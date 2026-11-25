// The Product Catalogue: one entry per product (products.toml, less org lines, experimental, archived and
// non-public ones), put together from what the other pages already build per repo: usage (stats.json),
// releases, design documents, issues, Actions and security. A product of several repos gathers all of theirs.

import actions from '../data/actions.json';
import design from '../data/design.json';
import issues from '../data/issues.json';
import releases from '../data/releases.json';
import security from '../data/security.json';
import stats from '../data/stats.json';
import { CONFIG, LINES, ORG, PRODUCTS, isProduct } from './hq-config.mjs';

const byRepo = (list) => Object.fromEntries((list ?? []).map((r) => [r.id, r]));
const designByRepo = byRepo(design.products);
const issuesByRepo = byRepo(issues.repos);
const actionsByRepo = byRepo(actions.repos);
const securityByRepo = byRepo(security.repos);
const usageById = byRepo(stats.components);
const distributions = CONFIG.settings.distributions ?? {};
const platformNames = { homeassistant: 'Home Assistant', signalk: 'SignalK', esp32: 'ESP32', linux: 'Linux', python: 'Python', node: 'Node.js' };

export const platformLabel = (id) => platformNames[id] ?? id;
export const distributionLabel = (id) => distributions[id]?.label ?? id;

// Where to get an artefact, and what to call it.
function artefactLink(a, repo, homepage) {
  const label = distributionLabel(a.distribution);
  const hacs = (category) =>
    `https://my.home-assistant.io/redirect/hacs_repository/?owner=${ORG.github}&repository=${encodeURIComponent(repo)}&category=${category}`;
  switch (a.distribution) {
    case 'pypi':
      return { label, detail: a.package, url: `https://pypi.org/project/${a.package}/` };
    case 'npm':
      return { label, detail: a.package, url: `https://www.npmjs.com/package/${a.package}` };
    case 'ghcr':
      return { label, detail: `ghcr.io/${ORG.github}/${a.package}`, url: `https://github.com/orgs/${ORG.github}/packages/container/package/${a.package}` };
    case 'homeassistant_marketplace_integration':
      return { label, detail: a.domain ?? a.asset, url: hacs('integration') };
    case 'homeassistant_marketplace_frontend':
      return { label, detail: a.asset, url: hacs('plugin') };
    case 'github_release':
      return { label, detail: a.asset ?? a.name, url: `https://github.com/${ORG.github}/${repo}/releases` };
    case 'website':
      return homepage ? { label, detail: homepage.replace(/^https?:\/\//, '').replace(/\/$/, ''), url: homepage } : null;
    default:
      return { label, detail: a.package ?? a.asset ?? a.name, url: null };
  }
}

// A product's platforms, unless they're just its line's default (every Home Assistant product runs on Home
// Assistant; saying so on each is noise).
function ownPlatforms(p) {
  const lineDefault = CONFIG.lines.find((l) => l.id === p.line)?.platforms ?? [];
  return p.platforms.join() === lineDefault.join() ? [] : p.platforms;
}

function entry(p) {
  const repos = p.repos.filter((r) => designByRepo[r] || issuesByRepo[r] || actionsByRepo[r]);
  const home = repos[0] ?? p.repos[0];
  const d = designByRepo[home];
  const usage = usageById[p.id] ?? null;
  const homepage = d?.homepage ?? null;
  const inRepos = (list) => (list ?? []).filter((x) => p.repos.includes(x.repo));
  const sum = (list, f) => list.reduce((n, x) => n + f(x), 0);
  const issueRows = repos.map((r) => issuesByRepo[r]).filter(Boolean);
  return {
    id: p.id,
    line: p.line,
    major: p.significance === 'major',
    platforms: ownPlatforms(p),
    description: usage?.description || d?.description || p.description || '',
    repos: repos.map((r) => ({ name: r, url: `https://github.com/${ORG.github}/${r}` })),
    homepage,
    // Websites last: where to read about it comes after where to get it.
    artefacts: [...p.artefacts]
      .sort((a, b) => Number(a.distribution === 'website') - Number(b.distribution === 'website'))
      .map((a) => artefactLink(a, home, homepage))
      .filter(Boolean),
    usage: usage ? { kpis: usage.kpis, page: usage.id } : null,
    releases: inRepos(releases.releases).sort((a, b) => b.date.localeCompare(a.date)),
    design: d
      ? {
          roadmap: d.roadmap,
          principles: d.principles,
          rfcs: d.rfcs,
          rfcCount: repos.reduce((n, r) => n + (designByRepo[r]?.rfcCount ?? 0), 0),
          discussions: d.discussions,
          open: inRepos(design.open),
          drafts: inRepos(design.drafts),
          closed: inRepos(design.closed),
        }
      : null,
    issues: issueRows.length
      ? { url: issueRows[0].url, total: sum(issueRows, (r) => r.total ?? 0), counts: issueRows.reduce((c, r) => { for (const [k, v] of Object.entries(r.counts ?? {})) c[k] = (c[k] ?? 0) + v; return c; }, {}) }
      : null,
    actions: repos.map((r) => actionsByRepo[r]).filter(Boolean),
    security: repos.map((r) => securityByRepo[r]).filter(Boolean),
    community: (stats.community ?? []).filter((c) => c.extends === p.id),
  };
}

export const CATALOGUE = PRODUCTS.filter(isProduct).map(entry);

// [line id, heading, products] in display order; within a line, major products first.
export const CATALOGUE_BY_LINE = LINES.map(([line, label]) => [
  line,
  label,
  CATALOGUE.filter((p) => p.line === line).sort((a, b) => Number(b.major) - Number(a.major) || a.id.localeCompare(b.id)),
]).filter(([, , list]) => list.length);

export const lineLabel = (line) => LINES.find(([l]) => l === line)?.[1] ?? line;

export const DATA_AS_OF = {
  usage: stats.snapshotDate,
  releases: releases.generatedAt,
  design: design.available ? design.generatedAt : null,
  issues: issues.available ? issues.generatedAt : null,
  windowDays: releases.windowDays,
};
