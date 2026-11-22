// Shared helpers for the build scripts that read GitHub: the REST client and the list of repos to cover.

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseToml } from 'smol-toml';
import { USER_AGENT } from '../../src/lib/hq-config.mjs';

export const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const hqRoot = path.resolve(siteRoot, '..');
export const privateRoot = path.resolve(process.env.HQ_PRIVATE ?? path.join(hqRoot, '..', 'hq-private'));
export const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

// Write a build script's output as JSON, creating its folder. Every script writes through here, so the code
// scanning alert for network data written to a file (js/http-to-file-access) has one location, dismissed as by
// design: fetching GitHub data and saving it for the site to render is what these scripts are for.
export async function writeJson(file, data, indent) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(data, null, indent)}\n`);
}

export async function gh(route) {
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
    if (res.status === 404) return null;
    if ((res.status < 500 && res.status !== 429) || attempt >= 3) throw new Error(`HTTP ${res.status}`);
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
}

// Every page of a list endpoint (route without per_page/page).
export async function ghAll(route) {
  const out = [];
  for (let page = 1; ; page += 1) {
    const sep = route.includes('?') ? '&' : '?';
    const items = (await gh(`${route}${sep}per_page=100&page=${page}`)) ?? [];
    out.push(...items);
    if (items.length < 100) return out;
  }
}

// Public, unarchived repos from repos.toml; visibility and archive state come from the latest private snapshot.
// `product` follows policies/products.md: not `meta`, `internal` or `experimental`.
export async function publicRepos() {
  const registry = parseToml(await readFile(path.join(hqRoot, 'repos.toml'), 'utf8'));
  const dir = path.join(privateRoot, 'data', 'github');
  const latest = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort().at(-1);
  const orgRepos = Object.fromEntries(JSON.parse(await readFile(path.join(dir, latest), 'utf8')).org_repos.map((r) => [r.name, r]));
  const isProduct = (r) => r.family !== 'meta' && !r.category?.some((c) => c === 'internal' || c === 'experimental');
  return {
    org: registry.org.github,
    repos: Object.keys(registry.repos)
      .filter((n) => !registry.repos[n].archived && orgRepos[n]?.visibility === 'public' && !orgRepos[n].archived)
      .map((name) => ({ name, family: registry.repos[name].family, product: isProduct(registry.repos[name]) })),
  };
}

// Run `fn` over items a few at a time, which keeps well inside the API's secondary rate limits.
export async function inBatches(items, fn, size = 4) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  return out;
}
