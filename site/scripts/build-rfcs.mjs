#!/usr/bin/env node
// Builds src/data/rfcs.json, the RFCs page: open and recently closed RFCs across the public repos.
//
// Sources, all read-only:
//   - repos.toml                        which repos to cover (`archived = true` ones are left out)
//   - hq-private/data/github/<latest>   only for repo visibility and archive state
//   - GitHub REST API                   each public repo's tree, its RFC files and their last commit
//
// An RFC is any Markdown file in a directory named `rfcs` (policies/design.md), apart from index,
// README and template files. Its status is read from the first lines, in any of the forms in use:
//   `Status: x`, `**Status**: x`, `· Status: x` (byline) or a `| Status | x |` table row.
// Drafts and RFCs with no status are left off the page; the rest are:
//   closed  done, complete, implemented, built, released, archived, cancelled, rejected, superseded
//   open    everything else, including partly built ("phases 0 and 1 implemented", "in progress")
// "Recently closed" means the file's last commit is within RECENT_DAYS. Needs GITHUB_TOKEN (or GH_TOKEN).

import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseToml } from 'smol-toml';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hqRoot = path.resolve(siteRoot, '..');
const privateRoot = path.resolve(process.env.HQ_PRIVATE ?? path.join(hqRoot, '..', 'hq-private'));
const outPath = path.join(siteRoot, 'src', 'data', 'rfcs.json');
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const DAY = 86_400_000;
const RECENT_DAYS = 60;

async function gh(route) {
  for (let attempt = 1; ; attempt += 1) {
    const res = await fetch(`https://api.github.com/${route}`, {
      headers: {
        'User-Agent': 'rhizomatics-hq-site',
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(30_000),
    });
    if (res.ok) return res.json();
    if ((res.status < 500 && res.status !== 429) || attempt >= 3) throw new Error(`HTTP ${res.status}`);
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
}

const isRfc = (p) => /(^|\/)rfcs\/[^/]+\.md$/i.test(p) && !/\/(index|readme|[^/]*template[^/]*)\.md$/i.test(p);
const plain = (s) => s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '').trim();

export function readStatus(text) {
  const lines = text.split('\n').slice(0, 40);
  for (const line of lines) {
    const m = line.match(/(?:^|·|\|)\s*\**status\**\s*(?:\||:)\s*\**\s*(.+)$/i);
    if (!m) continue;
    let s = plain(m[1].replace(/\|\s*$/, ''));
    // Keep the first sentence of a long status line.
    const stop = s.search(/\.\s/);
    if (stop > 0) s = s.slice(0, stop);
    if (s.length > 140) s = `${s.slice(0, 137).trimEnd()}…`;
    if (s) return s;
  }
  return null;
}

export function stage(status) {
  if (!status) return 'draft';
  const s = status.toLowerCase().replace(/not yet \w+/g, '');
  if (/^draft\b/.test(s)) return 'draft';
  if (/\b(cancel+ed|rejected|withdrawn|superseded|archived|abandoned)\b/.test(s)) return 'closed';
  if (/\b(partial|partly|phases?|in progress|ready for review|under review)\b/.test(s)) return 'open';
  if (/\b(done|complete|completed|implemented|built|released|shipped)\b/.test(s)) return 'closed';
  return 'open';
}

function readTitle(text, file) {
  const heading = text.split('\n').find((l) => /^#\s/.test(l));
  const raw = heading ? plain(heading.replace(/^#\s+/, '')) : file.replace(/\.md$/, '');
  const m = raw.match(/^RFC[\s-]*(\d+[a-z]?)\s*[:\-–—]?\s*(.*)$/i);
  const fromFile = file.match(/(\d+[a-z]?)/)?.[1];
  return m ? { number: m[1], title: m[2] || raw } : { number: fromFile ?? null, title: raw };
}

const discussionOf = (text) => text.match(/https:\/\/github\.com\/rhizomatics\/[\w.-]+\/discussions\/\d+/)?.[0] ?? null;

async function repoRfcs(org, name) {
  const repo = `${org}/${name}`;
  const { tree, truncated } = await gh(`repos/${repo}/git/trees/HEAD?recursive=1`);
  const files = tree.filter((t) => t.type === 'blob' && isRfc(t.path));
  const out = await Promise.all(
    files.map(async (f) => {
      const [blob, commits] = await Promise.all([
        gh(`repos/${repo}/git/blobs/${f.sha}`),
        gh(`repos/${repo}/commits?path=${encodeURIComponent(f.path)}&per_page=1`),
      ]);
      const text = Buffer.from(blob.content, 'base64').toString('utf8');
      const status = readStatus(text);
      return {
        repo: name,
        ...readTitle(text, path.basename(f.path)),
        status,
        stage: stage(status),
        updated: commits[0]?.commit.committer.date ?? null,
        url: `https://github.com/${repo}/blob/HEAD/${f.path}`,
        discussion: discussionOf(text),
      };
    }),
  );
  return { rfcs: out, truncated };
}

async function main() {
  const registry = parseToml(await readFile(path.join(hqRoot, 'repos.toml'), 'utf8'));
  const org = registry.org.github;
  const dir = path.join(privateRoot, 'data', 'github');
  const latest = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort().at(-1);
  const orgRepos = Object.fromEntries(JSON.parse(await readFile(path.join(dir, latest), 'utf8')).org_repos.map((r) => [r.name, r]));
  const now = Date.now();
  const notes = [];

  const names = Object.keys(registry.repos).filter((n) => !registry.repos[n].archived && orgRepos[n]?.visibility === 'public' && !orgRepos[n].archived);
  const all = [];
  if (!token) {
    notes.push('No GitHub token at build time, so RFCs were not fetched.');
    console.warn('rfcs: no GITHUB_TOKEN; writing an empty page');
  } else {
    for (let i = 0; i < names.length; i += 4) {
      const batch = names.slice(i, i + 4);
      const results = await Promise.all(
        batch.map(async (name) => {
          try {
            const { rfcs, truncated } = await repoRfcs(org, name);
            if (truncated) notes.push(`${name}: file list was truncated, so some RFCs may be missing.`);
            return rfcs;
          } catch (err) {
            notes.push(`${name}: RFCs unavailable (${err.message}).`);
            return [];
          }
        }),
      );
      all.push(...results.flat());
    }
  }

  const byUpdated = (a, b) => (b.updated ?? '').localeCompare(a.updated ?? '') || a.repo.localeCompare(b.repo);
  const open = all.filter((r) => r.stage === 'open').sort(byUpdated);
  const closed = all.filter((r) => r.stage === 'closed' && r.updated && Date.parse(r.updated) >= now - RECENT_DAYS * DAY).sort(byUpdated);
  const drafts = all.filter((r) => r.stage === 'draft').length;

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(
    outPath,
    `${JSON.stringify({ generatedAt: new Date(now).toISOString(), available: Boolean(token), recentDays: RECENT_DAYS, total: all.length, drafts, notes, open, closed })}\n`,
  );
  console.log(`rfcs: ${all.length} found, ${open.length} open, ${closed.length} recently closed, ${drafts} drafts${notes.length ? `; ${notes.length} gaps` : ''}`);
  for (const n of notes) console.warn(`  ${n}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
