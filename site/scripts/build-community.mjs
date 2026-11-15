#!/usr/bin/env node
// Builds src/data/community.json for the Community page: projects other people have built on the org's
// products, grouped by the product they extend. Kept apart from the org's own usage figures.
//
// Sources, all read-only and public:
//   - repos.toml        `[community.<id>]` entries (repo, author, extends, channel fields)
//   - GitHub REST API   each project's description, stars, latest release, and downloads of its HACS asset
// Needs GITHUB_TOKEN (or GH_TOKEN) for the API; without one the page still lists the projects.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { parse as parseToml } from 'smol-toml';
import { gh, ghAll, hqRoot, inBatches, siteRoot, token } from './lib/github.mjs';

const outPath = path.join(siteRoot, 'src', 'data', 'community.json');

async function details(entry) {
  const info = await gh(`repos/${entry.repo}`);
  if (!info || info.private) return null;
  const releases = await ghAll(`repos/${entry.repo}/releases`);
  const latest = releases.find((r) => !r.draft && !r.prerelease);
  const hacsDownloads = entry.hacs_zip
    ? releases.flatMap((r) => r.assets).filter((a) => a.name === entry.hacs_zip).reduce((n, a) => n + a.download_count, 0)
    : null;
  return {
    description: info.description,
    stars: info.stargazers_count,
    license: info.license?.spdx_id ?? null,
    archived: info.archived,
    latestRelease: latest ? { tag: latest.tag_name, date: latest.published_at, url: latest.html_url } : null,
    hacsDownloads,
  };
}

async function main() {
  const registry = parseToml(await readFile(path.join(hqRoot, 'repos.toml'), 'utf8'));
  const org = registry.org.github;
  const entries = Object.entries(registry.community ?? {}).map(([id, e]) => ({ id, ...e }));
  const notes = [];
  if (!token && entries.length) notes.push('No GitHub token at the last build, so stars and releases are missing.');

  const projects = (
    await inBatches(entries, async (e) => {
      const base = {
        id: e.id,
        name: e.repo.split('/')[1],
        url: `https://github.com/${e.repo}`,
        author: e.author,
        authorUrl: `https://github.com/${e.author}`,
        extends: e.extends,
      };
      if (!token) return base;
      try {
        const d = await details(e);
        if (d === null) {
          notes.push(`${e.id}: not public or not found, so left out.`);
          return null;
        }
        return { ...base, ...d };
      } catch (err) {
        notes.push(`${e.id}: details unavailable (${err.message}).`);
        return base;
      }
    })
  ).filter(Boolean);

  const products = [...new Set(projects.map((p) => p.extends))].sort().map((id) => ({
    id,
    url: `https://github.com/${org}/${id}`,
    projects: projects.filter((p) => p.extends === id).sort((a, b) => a.name.localeCompare(b.name)),
  }));
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), notes, products })}\n`);
  console.log(`community: ${projects.length} projects for ${products.length} products${notes.length ? `; ${notes.length} gaps` : ''}`);
  for (const n of notes) console.warn(`  ${n}`);
}

await main();
