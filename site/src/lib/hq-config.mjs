// Org-specific settings from repos.toml, so nothing in the site or its scripts names the org itself.
// Synchronous so astro.config.mjs can use it.

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseToml } from 'smol-toml';

// Next to this file's repo when run from source; from the working directory (site/) once Astro has bundled it.
const candidates = [
  process.env.REPOS_TOML,
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'repos.toml'),
  path.resolve(process.cwd(), '..', 'repos.toml'),
  path.resolve(process.cwd(), 'repos.toml'),
].filter(Boolean);
const registryPath = candidates.find((p) => existsSync(p));
if (!registryPath) throw new Error(`repos.toml not found (tried ${candidates.join(', ')})`);
const registry = parseToml(readFileSync(registryPath, 'utf8'));
const org = registry.org;

export const ORG = {
  name: org.name,
  github: org.github,
  hqRepo: org.hq_repo ?? 'hq',
  privateRepo: org.private_repo ?? null,
  siteUrl: org.site_url.replace(/\/$/, ''),
  goatcounter: org.goatcounter || null,
};

// Page-view counting with GoatCounter: cookieless, so no consent banner. The HQ site has a GoatCounter site
// of its own ([org].goatcounter).
export const analyticsHead = () =>
  ORG.goatcounter
    ? [{ tag: 'script', attrs: { 'data-goatcounter': `https://${ORG.goatcounter}.goatcounter.com/count`, async: true, src: '//gc.zgo.at/count.js' } }]
    : [];

export const githubUrl = (repo) => `https://github.com/${ORG.github}${repo ? `/${repo}` : ''}`;

// User-Agent for API calls: generic, so requests don't carry the org's name.
export const USER_AGENT = 'hq-site';

// [family, heading] in display order. `meta` (the org's own repos) is left out: pages that cover it add it.
export const FAMILIES = Object.entries(registry.families ?? {})
  .filter(([family]) => family !== 'meta')
  .map(([family, f]) => [family, f.label]);

export const META_LABEL = registry.families?.meta?.label ?? 'Organisation';
