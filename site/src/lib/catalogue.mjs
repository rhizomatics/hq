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

// Platform ratings, from hq-stats (`health` on each component in stats.json): Home Assistant's Integration Quality
// Scale and the SignalK plugin registry's score, each as the catalogue shows it, with a shields.io badge.
const QUALITY_COLOURS = { bronze: 'cd7f32', silver: 'a8a9ad', gold: 'd4a017', platinum: '8a9ba8' };
const titled = (level) => (level ? String(level).charAt(0).toUpperCase() + String(level).slice(1) : null);
const shield = (label, message, colour) =>
  `https://img.shields.io/badge/${encodeURIComponent(label).replaceAll('-', '--')}-${encodeURIComponent(message).replaceAll('-', '--')}-${colour}`;

export function qualityRating(ha) {
  if (!ha || ha.error || !ha.declared) return ha && !ha.error && ha.assessed !== undefined ? { level: null, assessed: titled(ha.assessed), next: ha.next ?? null, url: ha.assessment_url } : null;
  const level = String(ha.declared).toLowerCase();
  return {
    level: titled(level),
    // What its own quality_scale.yaml adds up to, when that differs from what it declares.
    assessed: ha.assessed !== undefined && ha.assessed !== level ? (titled(ha.assessed) ?? 'below Bronze') : null,
    next: ha.next ?? null,
    alt: `Quality scale: ${titled(level)} (self-assessed)`,
    image: shield('quality scale', `${level} (self-assessed)`, QUALITY_COLOURS[level] ?? 'lightgrey'),
    url: ha.assessment_url,
  };
}

export function signalkRating(sk) {
  if (!sk || sk.error || sk.score == null) return null;
  const colour = sk.score >= 90 ? '4c1' : sk.score >= 75 ? 'dfb317' : 'fe7d37';
  return {
    score: sk.score,
    badges: sk.badges ?? [],
    testStatus: sk.test_status,
    pluginCi: sk.plugin_ci,
    version: sk.version,
    alt: `SignalK plugin registry: ${sk.score}/100`,
    image: shield('signalk registry', `${sk.score}/100`, colour),
    url: sk.url,
  };
}

// Community projects from community.toml, with their figures from stats.json once a snapshot has them. A project
// added since the last snapshot is listed from its config alone. `relation` is "extends" (built on the product)
// or "recommended" (someone else's project we recommend using with it).
const statsCommunity = byRepo(stats.community);
export const COMMUNITY_PROJECTS = CONFIG.community
  .filter((e) => e.kind === 'project' && e.repo)
  .map((e) => {
    const s = statsCommunity[e.id];
    const [owner, name] = e.repo.split('/');
    const author = e.author ?? owner;
    return {
      id: e.id,
      name: s?.name ?? name,
      url: s?.url ?? `https://github.com/${e.repo}`,
      author,
      authorUrl: `https://github.com/${author}`,
      extends: e.extends,
      relation: e.relation ?? 'extends',
      description: s?.description || e.description || '',
      archived: s?.archived ?? false,
      latestRelease: s?.latestRelease ?? null,
      stars: s?.kpis?.stars ?? null,
      counted: Boolean(s),
    };
  });
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
    quality: qualityRating(usage?.health?.homeassistant),
    registry: signalkRating(usage?.health?.signalk),
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
    community: COMMUNITY_PROJECTS.filter((c) => c.extends === p.id),
  };
}

export const CATALOGUE = PRODUCTS.filter(isProduct).map(entry);

// [line id, heading, products] in display order; within a line, alphabetical.
export const CATALOGUE_BY_LINE = LINES.map(([line, label]) => [
  line,
  label,
  CATALOGUE.filter((p) => p.line === line).sort((a, b) => a.id.localeCompare(b.id)),
]).filter(([, , list]) => list.length);

export const lineLabel = (line) => LINES.find(([l]) => l === line)?.[1] ?? line;

export const DATA_AS_OF = {
  usage: stats.snapshotDate,
  releases: releases.generatedAt,
  design: design.available ? design.generatedAt : null,
  issues: issues.available ? issues.generatedAt : null,
  windowDays: releases.windowDays,
};
