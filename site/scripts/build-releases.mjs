#!/usr/bin/env node
// Releases page data: the last WINDOW_DAYS days of releases across the public products, with the
// summaries the daily release digest (/release-digest) writes.
//
//   node scripts/build-releases.mjs            writes src/data/releases.json for the Releases page
//                                              (same-day releases of a product rolled up into one entry)
//   node scripts/build-releases.mjs --pending  lists releases in the window that have no summary yet, as JSON
//                                              (what the digest works from; nothing is written)
//
// Sources, all read-only:
//   - repos.toml + hq-private/data/github/<latest>   which repos are public products (lib/github.mjs)
//   - GitHub REST API                                each product's releases (drafts left out)
//   - hq-private/data/releases/summaries.json        the digest's judgement per release, keyed "<repo>@<tag>":
//       { "include": bool, "kind": "enhancement" | "critical-fix" | "maintenance", "summary": "..." }
// Needs GITHUB_TOKEN (or GH_TOKEN).

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { gh, inBatches, privateRoot, publicRepos, siteRoot, token } from './lib/github.mjs';

const WINDOW_DAYS = 31;
const outPath = path.join(siteRoot, 'src', 'data', 'releases.json');
const summariesPath = path.join(privateRoot, 'data', 'releases', 'summaries.json');
const pendingMode = process.argv.includes('--pending');

async function readSummaries() {
  try {
    return JSON.parse(await readFile(summariesPath, 'utf8'));
  } catch {
    return {};
  }
}

async function recentReleases(org, repos, since) {
  const lists = await inBatches(repos, async (r) => {
    const items = (await gh(`repos/${org}/${r.name}/releases?per_page=50`)) ?? [];
    return items
      .filter((rel) => !rel.draft && rel.published_at >= since)
      .map((rel) => ({
        key: `${r.name}@${rel.tag_name}`,
        repo: r.name,
        family: r.family,
        tag: rel.tag_name,
        name: rel.name || rel.tag_name,
        date: rel.published_at,
        prerelease: rel.prerelease,
        url: rel.html_url,
        repoUrl: `https://github.com/${org}/${r.name}`,
      }));
  });
  return lists.flat().sort((a, b) => b.date.localeCompare(a.date));
}

// Several releases of one product on the same (UTC) day make one entry, rolled up to the latest of them: its tag,
// link and date, with the summaries of the ones worth listing, oldest first. A day with nothing worth listing is
// left out, and an important fix in any of them marks the entry. `releases` is newest first.
function rollUpByDay(releases, summaries) {
  const groups = new Map();
  for (const r of releases) {
    const id = `${r.repo}|${r.date.slice(0, 10)}`;
    groups.set(id, [...(groups.get(id) ?? []), r]);
  }
  return [...groups.values()].flatMap((group) => {
    const listed = group.filter((r) => summaries[r.key]?.include).reverse();
    if (!listed.length) return [];
    const latest = group[0];
    return [{
      ...latest,
      kind: listed.some((r) => summaries[r.key].kind === 'critical-fix') ? 'critical-fix' : 'enhancement',
      summary: listed.map((r) => summaries[r.key].summary.trim()).join(' '),
      rolledUp: group.slice(1).reverse().map((r) => r.tag),
    }];
  });
}

async function main() {
  if (!token) {
    if (pendingMode) throw new Error('needs GITHUB_TOKEN (or GH_TOKEN)');
    console.warn('releases: no GITHUB_TOKEN; writing an empty list');
  }
  const { org, repos } = await publicRepos();
  const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();
  const releases = token ? await recentReleases(org, repos.filter((r) => r.product), since) : [];
  const summaries = await readSummaries();

  if (pendingMode) {
    const pending = releases.filter((r) => !summaries[r.key]).map(({ key, repo, tag, date, prerelease, url }) => ({ key, repo, tag, date, prerelease, url }));
    console.log(JSON.stringify(pending, null, 1));
    return;
  }

  const shown = rollUpByDay(releases, summaries);
  const leftOut = releases.filter((r) => summaries[r.key] && !summaries[r.key].include).length;
  const pending = releases.filter((r) => !summaries[r.key]).length;
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(
    outPath,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), available: Boolean(token), windowDays: WINDOW_DAYS, total: releases.length, leftOut, pending, releases: shown })}\n`,
  );
  console.log(`releases: ${releases.length} in ${WINDOW_DAYS} days, ${shown.length} shown, ${leftOut} maintenance only, ${pending} not yet summarised`);
}

await main();
