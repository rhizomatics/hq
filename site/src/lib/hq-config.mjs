// Org-specific settings from hq.toml, products.toml and community.toml, so nothing in the site or its scripts
// names the org itself. Read through @rhizomatics/hq-stats' loadConfig: one model of the product lines, products
// and their artefacts, the same one the Usage pages are built from. Synchronous so astro.config.mjs can use it.

import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { channels, isProduct as isProductIn, lines, loadConfig } from '@rhizomatics/hq-stats';

// The hq checkout: next to this file's repo when run from source; from the working directory (site/) once Astro
// has bundled it.
const candidates = [
  process.env.HQ_CONFIG,
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..'),
  path.resolve(process.cwd(), '..'),
  process.cwd(),
].filter(Boolean);
export const HQ_ROOT = candidates.find((d) => existsSync(path.join(d, 'hq.toml')));
if (!HQ_ROOT) throw new Error(`hq.toml not found (tried ${candidates.join(', ')})`);

export const CONFIG = loadConfig({ config: HQ_ROOT });
const org = CONFIG.settings.org;
const hqRepo = org.hq_repo ?? 'hq';

// Products, in products.toml order; each repo belongs to exactly one.
export const PRODUCTS = CONFIG.products;
export const productOfRepo = (repo) => PRODUCTS.find((p) => p.repos.includes(repo)) ?? null;

// A product for the catalogue and the per-product pages: public, active, not on an org line (policies/products.md).
export const isProduct = (p) => isProductIn(CONFIG, p);

// Every repo named in products.toml with its product, line and whether that product is a product (above).
// Archived products are marked; visibility comes from GitHub, not from here.
export const REPOS = PRODUCTS.flatMap((p) =>
  p.repos.map((name) => ({ name, productId: p.id, line: p.line, archived: p.lifecycle === 'archived', product: isProduct(p) })),
);

export const ORG = {
  name: org.name,
  github: org.github,
  hqRepo,
  privateRepo: org.private_repo ?? null,
  siteUrl: org.site_url.replace(/\/$/, ''),
  goatcounter: (productOfRepo(hqRepo) && channels(productOfRepo(hqRepo)).goatcounter) || null,
};

// Page-view counting with GoatCounter: cookieless, so no consent banner. The HQ site counts to the GoatCounter
// site of the website artefact of the product the hq repo belongs to (products.toml).
export const analyticsHead = () =>
  ORG.goatcounter
    ? [{ tag: 'script', attrs: { 'data-goatcounter': `https://${ORG.goatcounter}.goatcounter.com/count`, async: true, src: '//gc.zgo.at/count.js' } }]
    : [];

export const githubUrl = (repo) => `https://github.com/${ORG.github}${repo ? `/${repo}` : ''}`;

// User-Agent for API calls: generic, so requests don't carry the org's name.
export const USER_AGENT = 'hq-site';

// [line, heading] in display order: the product lines, then the org's own lines (its sites, HQ itself), which
// only pages that cover them add.
const { lines: productLines, orgLines } = lines(CONFIG);
export const LINES = productLines;
export const ORG_LINES = orgLines;
