#!/usr/bin/env node
// Builds src/data/design.json for the Design Process page (per product: roadmap, design principles,
// RFCs, GitHub discussions and issues, Home Assistant quality scale level) and the RFCs page (open and recently
// closed RFCs). The quality scale level also goes on the Product Catalogue.
//
// Products are the public repos of products in products.toml, less those on an org line, non-public,
// experimental or archived (policies/products.md). Roadmap and design principles are found by file name (`roadmap.md`,
// `design_principles.md`) anywhere under `docs/` (policies/design.md).
//
// Sources, all read-only:
//   - products.toml                     which repos to cover (archived products are left out)
//   - hq-private/data/github/<latest>   only for repo visibility and archive state (lib/github.mjs)
//   - GitHub REST API                   each public repo's settings, tree, RFC files and their last commit
//
// An RFC is any Markdown file in a directory named `rfcs` (policies/design.md), apart from index,
// README and template files. Its status is read from the first lines, in any of the forms in use:
//   `Status: x`, `**Status**: x`, `· Status: x` (byline) or a `| Status | x |` table row.
// RFCs with no status count as drafts. The rest are:
//   closed  done, complete, implemented, built, released, archived, cancelled, rejected, superseded
//   open    everything else, including partly built ("phases 0 and 1 implemented", "in progress")
// "Recently closed" means the file's last commit is within RECENT_DAYS. Created is the earlier of a date in
// the header (`Created:`, `Date:` or the byline) and the file's first commit; changed is its last commit.
// Needs GITHUB_TOKEN (or GH_TOKEN).

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ORG, USER_AGENT } from '../src/lib/hq-config.mjs';
import { publicRepos, writeJson } from './lib/github.mjs';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = path.join(siteRoot, 'src', 'data', 'design.json');
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const DAY = 86_400_000;
const RECENT_DAYS = 60;

async function gh(route) {
  for (let attempt = 1; ; attempt += 1) {
    const res = await fetch(`https://api.github.com/${route}`, {
      headers: {
        'User-Agent': USER_AGENT,
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

// Header dates: `Created: 2026-10-07`, `| Date | 2026-10-28, updated ... |`, `2026-10-07 · Author · Status: x`.
function headerDate(text) {
  for (const line of text.split('\n').slice(0, 40)) {
    const m = line.match(/\b(?:created|date)\b\**\s*(?:\||:)\s*\**\s*(\d{4}-\d{2}-\d{2})/i) ?? line.match(/^(\d{4}-\d{2}-\d{2})\s*·/);
    if (m) return m[1];
  }
  return null;
}

const discussionRe = new RegExp(`https://github\\.com/${ORG.github}/[\\w.-]+/discussions/\\d+`);
const discussionOf = (text) => text.match(discussionRe)?.[0] ?? null;

const docLink = (repo, paths, file) => {
  const p = paths.find((x) => x.toLowerCase().startsWith('docs/') && path.basename(x).toLowerCase() === file);
  return p ? `https://github.com/${repo}/blob/HEAD/${p}` : null;
};

// A Home Assistant integration's Integration Quality Scale level, as its manifest.json declares it
// (`quality_scale`), with a link to its quality_scale.yaml. Null for a repo without an integration, or one that
// declares no level. One extra call, only for repos with a custom_components/<domain>/manifest.json.
async function qualityScale(repo, tree) {
  const manifest = tree.find((t) => t.type === 'blob' && /^custom_components\/[^/]+\/manifest\.json$/.test(t.path));
  if (!manifest) return null;
  const blob = await gh(`repos/${repo}/git/blobs/${manifest.sha}`);
  let level;
  try {
    level = JSON.parse(Buffer.from(blob.content, 'base64').toString('utf8')).quality_scale;
  } catch {
    return null;
  }
  if (!level) return null;
  const yaml = path.posix.join(path.posix.dirname(manifest.path), 'quality_scale.yaml');
  const hasYaml = tree.some((t) => t.path === yaml);
  return { level, url: `https://github.com/${repo}/blob/HEAD/${hasYaml ? yaml : manifest.path}` };
}

async function repoDesign(org, name) {
  const repo = `${org}/${name}`;
  const [{ tree, truncated }, settings] = await Promise.all([gh(`repos/${repo}/git/trees/HEAD?recursive=1`), gh(`repos/${repo}`)]);
  const blobs = tree.filter((t) => t.type === 'blob').map((t) => t.path);
  const files = tree.filter((t) => t.type === 'blob' && isRfc(t.path));
  const rfcDir = files.length ? path.dirname(files[0].path) : null;
  const product = {
    id: name,
    url: `https://github.com/${repo}`,
    description: settings.description ?? null,
    homepage: settings.homepage || null,
    roadmap: docLink(repo, blobs, 'roadmap.md'),
    principles: docLink(repo, blobs, 'design_principles.md'),
    rfcs: rfcDir ? `https://github.com/${repo}/tree/HEAD/${rfcDir}` : null,
    rfcCount: files.length,
    discussions: settings.has_discussions ? `https://github.com/${repo}/discussions` : null,
    issues: settings.has_issues ? `https://github.com/${repo}/issues` : null,
    qualityScale: await qualityScale(repo, tree),
  };
  const out = await Promise.all(
    files.map(async (f) => {
      const [blob, commits] = await Promise.all([
        gh(`repos/${repo}/git/blobs/${f.sha}`),
        gh(`repos/${repo}/commits?path=${encodeURIComponent(f.path)}&per_page=100`),
      ]);
      const text = Buffer.from(blob.content, 'base64').toString('utf8');
      const status = readStatus(text);
      return {
        repo: name,
        ...readTitle(text, path.basename(f.path)),
        status,
        stage: stage(status),
        created: [headerDate(text), commits.at(-1)?.commit.committer.date?.slice(0, 10)].filter(Boolean).sort()[0] ?? null,
        updated: commits[0]?.commit.committer.date ?? null,
        url: `https://github.com/${repo}/blob/HEAD/${f.path}`,
        discussion: discussionOf(text),
      };
    }),
  );
  return { rfcs: out, product, truncated };
}

async function main() {
  const { org, repos: covered } = await publicRepos();
  const names = covered.map((r) => r.name);
  const repoOf = Object.fromEntries(covered.map((r) => [r.name, r]));
  const now = Date.now();
  const notes = [];
  const all = [];
  const products = [];
  if (!token) {
    notes.push('No GitHub token at build time, so design documents were not fetched.');
    console.warn('design: no GITHUB_TOKEN; writing empty pages');
  } else {
    for (let i = 0; i < names.length; i += 4) {
      const batch = names.slice(i, i + 4);
      const results = await Promise.all(
        batch.map(async (name) => {
          try {
            const { rfcs, product, truncated } = await repoDesign(org, name);
            if (repoOf[name].product) products.push({ ...product, line: repoOf[name].line });
            if (truncated) notes.push(`${name}: file list was truncated, so some RFCs may be missing.`);
            return rfcs;
          } catch (err) {
            notes.push(`${name}: design documents unavailable (${err.message}).`);
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
  const drafts = all.filter((r) => r.stage === 'draft').sort(byUpdated);

  await writeJson(outPath, { generatedAt: new Date(now).toISOString(), available: Boolean(token), recentDays: RECENT_DAYS, total: all.length, notes, drafts, products, open, closed });
  console.log(`design: ${products.length} products, ${all.length} RFCs, ${open.length} open, ${closed.length} recently closed, ${drafts.length} drafts${notes.length ? `; ${notes.length} gaps` : ''}`);
  for (const n of notes) console.warn(`  ${n}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
