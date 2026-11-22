#!/usr/bin/env node
// Builds src/data/issues.json: open issues per public repo, counted by GitHub issue type. Used by the
// Design Process page (features) and the Support page (bugs and unclassified issues).
//
// Sources, all read-only:
//   - repos.toml                        which repos to cover (`archived = true` ones are left out)
//   - hq-private/data/github/<latest>   only for repo visibility and archive state
//   - GitHub REST API                   each public repo's settings and open issues (pull requests left out)
//
// Classification is the issue's type alone (the org's types are Feature, Bug and Task), so the counts
// match the GitHub searches the pages link to. An issue with no type is unclassified. Labels aren't read.
// Needs GITHUB_TOKEN (or GH_TOKEN).

import path from 'node:path';
import { gh, ghAll, inBatches, publicRepos, siteRoot, token, writeJson } from './lib/github.mjs';

const outPath = path.join(siteRoot, 'src', 'data', 'issues.json');

async function repoIssues(org, name) {
  const repo = `${org}/${name}`;
  const settings = await gh(`repos/${repo}`);
  if (!settings?.has_issues) return { enabled: false, counts: {}, oldest: {} };
  const issues = (await ghAll(`repos/${repo}/issues?state=open`)).filter((i) => !i.pull_request);
  const counts = {};
  const oldest = {};
  for (const i of issues) {
    const type = i.type?.name?.toLowerCase() ?? 'unclassified';
    counts[type] = (counts[type] ?? 0) + 1;
    if (!oldest[type] || i.created_at < oldest[type]) oldest[type] = i.created_at;
  }
  return { enabled: true, total: issues.length, counts, oldest };
}

async function main() {
  const { org, repos } = await publicRepos();
  const notes = [];
  let out = [];
  if (!token) {
    notes.push('No GitHub token at build time, so issues were not counted.');
    console.warn('issues: no GITHUB_TOKEN; writing empty counts');
  } else {
    out = (
      await inBatches(repos, async (r) => {
        try {
          return { id: r.name, family: r.family, product: r.product, url: `https://github.com/${org}/${r.name}/issues`, ...(await repoIssues(org, r.name)) };
        } catch (err) {
          notes.push(`${r.name}: issues unavailable (${err.message}).`);
          return null;
        }
      })
    ).filter(Boolean);
  }
  await writeJson(outPath, { generatedAt: new Date().toISOString(), available: Boolean(token), notes, repos: out });
  const sum = (t) => out.reduce((n, r) => n + (r.counts[t] ?? 0), 0);
  console.log(`issues: ${out.length} repos, ${sum('feature')} features, ${sum('bug')} bugs, ${sum('unclassified')} unclassified${notes.length ? `; ${notes.length} gaps` : ''}`);
  for (const n of notes) console.warn(`  ${n}`);
}

await main();
