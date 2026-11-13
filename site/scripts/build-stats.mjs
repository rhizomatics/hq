#!/usr/bin/env node
// Builds src/data/stats.json, the public usage numbers behind the site's Usage pages.
//
// Sources, all read-only:
//   - hq-private/data/stats/*.json      daily snapshots by hq-private/scripts/collect_stats.py (from 2026-10-14)
//   - hq-private/data/github/<latest>   only for repo visibility, archive state and description
//   - hq-private/data/legacy/hacs-downloads-history.json   the retired hacs-downloads site's history (2026-09-12 on)
//   - live public APIs: npm daily downloads, PyPI daily downloads, Home Assistant analytics by version
//
// Only public aggregates are written: downloads, stars, clones, HA installs. Never views,
// referrers, paths, alerts or anything else in the private snapshots. Private and archived
// repos, `meta` repos and `internal` ones are left out. Nothing from the private data is logged.

import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseToml } from 'smol-toml';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hqRoot = path.resolve(siteRoot, '..');
const privateRoot = path.resolve(process.env.HQ_PRIVATE ?? path.join(hqRoot, '..', 'hq-private'));
const outPath = path.join(siteRoot, 'src', 'data', 'stats.json');
const UA = { 'User-Agent': 'rhizomatics-hq-site' };
const DAY = 86_400_000;

// hacs-downloads keyed some projects by a hyphenated id rather than the repo name.
const legacyProject = (projects, repo) => projects?.[repo] ?? projects?.[repo.replace(/_/g, '-')];

const isoDate = (t) => new Date(t).toISOString().slice(0, 10);
const addDays = (date, n) => isoDate(Date.parse(date) + n * DAY);

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function fetchJson(url, attempts = 3) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30_000) });
      if (res.ok) return await res.json();
      if (res.status !== 429 && res.status < 500) throw new Error(`HTTP ${res.status}`);
      if (attempt >= attempts) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      if (attempt >= attempts) throw err;
    }
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
}

// Daily downloads from a cumulative counter sampled on irregular dates. A gap of n days is spread
// evenly over those days; a drop (asset replaced or deleted, counter reset) counts as zero.
function cumulativeToDaily(points) {
  const daily = {};
  const sorted = [...points].sort((a, b) => a[0].localeCompare(b[0]));
  for (let i = 1; i < sorted.length; i += 1) {
    const [prevDate, prev] = sorted[i - 1];
    const [date, value] = sorted[i];
    const days = Math.round((Date.parse(date) - Date.parse(prevDate)) / DAY);
    if (days < 1) continue;
    const delta = Math.max(0, value - prev);
    for (let d = 0; d < days; d += 1) {
      const day = addDays(prevDate, d + 1);
      daily[day] = (daily[day] ?? 0) + delta / days;
    }
  }
  return Object.fromEntries(Object.entries(daily).map(([d, v]) => [d, Math.round(v * 10) / 10]));
}

async function loadSnapshots() {
  const dir = path.join(privateRoot, 'data', 'stats');
  const files = (await readdir(dir)).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  return Promise.all(files.map(async (f) => ({ date: f.slice(0, 10), ...(await readJson(path.join(dir, f))) })));
}

async function loadLegacy() {
  try {
    const history = await readJson(path.join(privateRoot, 'data', 'legacy', 'hacs-downloads-history.json'));
    // One snapshot per date; the last capture of a date wins.
    const byDate = {};
    for (const s of history.snapshots) byDate[s.capturedAt.slice(0, 10)] = { ...byDate[s.capturedAt.slice(0, 10)], ...s.projects };
    return byDate;
  } catch {
    return {};
  }
}

async function latestGithubSnapshot() {
  const dir = path.join(privateRoot, 'data', 'github');
  const latest = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort().at(-1);
  const snap = await readJson(path.join(dir, latest));
  return Object.fromEntries(snap.org_repos.map((r) => [r.name, r]));
}

async function npmDaily(pkg) {
  const end = isoDate(Date.now() - DAY);
  const start = addDays(end, -540); // npm's range API allows up to 18 months
  const data = await fetchJson(`https://api.npmjs.org/downloads/range/${start}:${end}/${encodeURIComponent(pkg).replace('%40', '@')}`);
  const daily = {};
  let seen = false;
  for (const { day, downloads } of data.downloads) {
    seen ||= downloads > 0;
    if (seen) daily[day] = downloads; // drop the run of zeros before the first publish
  }
  return daily;
}

async function pypiDaily(pkg) {
  const data = await fetchJson(`https://pypistats.org/api/packages/${pkg.toLowerCase()}/overall?mirrors=false`);
  const daily = {};
  for (const row of data.data) if (row.category === 'without_mirrors') daily[row.date] = row.downloads;
  return daily;
}

const ghcrPoints = (snapshots, repo) => snapshots
  .map((s) => [s.date, s.repos[repo]?.ghcr?.total])
  .filter(([, v]) => Number.isFinite(v));

function hacsPoints(snapshots, legacy, repo, zip) {
  const points = {};
  for (const [date, projects] of Object.entries(legacy)) {
    const total = legacyProject(projects, repo)?.total;
    if (Number.isFinite(total)) points[date] = total;
  }
  for (const s of snapshots) {
    const assets = s.repos[repo]?.github?.release_assets;
    if (!assets || assets.error) continue;
    points[s.date] = Object.values(assets).reduce((sum, a) => sum + (a[zip] ?? 0), 0);
  }
  return fromBaseline(Object.entries(points).sort((a, b) => a[0].localeCompare(b[0])));
}

// A counter that first appears mid-history (the legacy collector picked some assets up late, and
// reported 0 or 1 before then) jumps from near zero to its lifetime total in one step. That step is
// a baseline, not a day's downloads, so the series starts at the last such jump.
function fromBaseline(sorted) {
  let start = 0;
  for (let i = 1; i < sorted.length; i += 1) {
    const [, prev] = sorted[i - 1];
    const [, value] = sorted[i];
    if (value > 50 && prev < value * 0.05) start = i;
  }
  return sorted.slice(start);
}

function hacsVersions(snapshots, repo, zip) {
  const withAssets = snapshots.filter((s) => s.repos[repo]?.github?.release_assets && !s.repos[repo].github.release_assets.error);
  const latest = withAssets.at(-1);
  if (!latest) return [];
  const weekAgo = [...withAssets].reverse().find((s) => s.date <= addDays(latest.date, -7));
  const rows = Object.entries(latest.repos[repo].github.release_assets)
    .filter(([, a]) => zip in a)
    .map(([tag, a]) => {
      const before = weekAgo?.repos[repo].github.release_assets[tag]?.[zip];
      return { version: tag, downloads: a[zip], last7: weekAgo ? a[zip] - (before ?? 0) : null };
    });
  return rows;
}

function seriesFromSnapshots(snapshots, legacy, repo, pick, legacyPick) {
  const out = {};
  for (const [date, projects] of Object.entries(legacy)) {
    const v = legacyPick?.(legacyProject(projects, repo));
    if (Number.isFinite(v)) out[date] = v;
  }
  for (const s of snapshots) {
    const v = pick(s.repos[repo]);
    if (Number.isFinite(v)) out[s.date] = v;
  }
  return out;
}

// GitHub keeps 14 days of clone traffic; every snapshot has an overlapping window. The latest
// snapshot to mention a day wins, except its last day, which can be partial.
function clones(snapshots, legacy, repo) {
  const out = {};
  for (const projects of Object.values(legacy)) {
    for (const c of legacyProject(projects, repo)?.clones ?? []) out[c.date] = { count: c.count, uniques: c.uniques };
  }
  for (const s of snapshots) {
    const list = s.repos[repo]?.github?.clones;
    if (!Array.isArray(list)) continue;
    for (const c of list) {
      const date = c.timestamp.slice(0, 10);
      if (date >= s.date) continue;
      out[date] = { count: c.count, uniques: c.uniques };
    }
  }
  return out;
}

const sumRecent = (daily, days, today) => {
  const from = addDays(today, -days);
  return Math.round(Object.entries(daily).filter(([d]) => d > from && d <= today).reduce((s, [, v]) => s + v, 0));
};

const valueDaysAgo = (series, days, today) => {
  const target = addDays(today, -days);
  const dates = Object.keys(series).filter((d) => d <= target).sort();
  return dates.length ? series[dates.at(-1)] : null;
};

async function main() {
  const registry = parseToml(await readFile(path.join(hqRoot, 'repos.toml'), 'utf8'));
  const [snapshots, legacy, orgRepos] = await Promise.all([loadSnapshots(), loadLegacy(), latestGithubSnapshot()]);
  const haLive = await fetchJson('https://analytics.home-assistant.io/custom_integrations.json').catch((e) => {
    console.warn(`Home Assistant analytics unavailable: ${e.message}`);
    return null;
  });
  const today = snapshots.at(-1).date;
  const notes = [];
  const components = [];

  for (const [name, repo] of Object.entries(registry.repos)) {
    const meta = orgRepos[name];
    if (repo.family === 'meta' || repo.category?.includes('internal')) continue;
    if (!meta || meta.visibility !== 'public' || meta.archived) continue;

    const downloads = {};
    const totals = {};
    // When a live source fails, its 7- and 30-day totals still come from the latest snapshot.
    const fallback = { d7: 0, d30: 0 };
    const fallBackTo = (key, week) => {
      const recent = snapshots.at(-1).repos[name]?.[key];
      if (Number.isFinite(recent?.[week])) fallback.d7 += recent[week];
      if (Number.isFinite(recent?.last_month)) fallback.d30 += recent.last_month;
    };
    if (repo.hacs_zip) {
      const points = hacsPoints(snapshots, legacy, name, repo.hacs_zip);
      downloads.hacs = cumulativeToDaily(points);
      totals.hacs = points.at(-1)?.[1] ?? null;
    }
    if (repo.npm) {
      try {
        downloads.npm = await npmDaily(repo.npm);
        totals.npm = Object.values(downloads.npm).reduce((a, b) => a + b, 0);
      } catch (e) {
        notes.push(`npm daily downloads for ${name} unavailable at build (${e.message}).`);
        fallBackTo('npm', 'last_week');
      }
    }
    if (repo.pypi) {
      try {
        downloads.pypi = await pypiDaily(repo.pypi);
      } catch (e) {
        notes.push(`PyPI daily downloads for ${name} unavailable at build (${e.message}).`);
        fallBackTo('pypi', 'last_week');
      }
    }
    if (repo.ghcr) {
      const points = ghcrPoints(snapshots, name);
      downloads.ghcr = cumulativeToDaily(points);
      totals.ghcr = points.at(-1)?.[1] ?? null;
    }

    const stars = seriesFromSnapshots(snapshots, legacy, name, (r) => r?.github?.stars, (p) => p?.stars);
    const haInstalls = repo.ha_domain
      ? seriesFromSnapshots(snapshots, legacy, name, (r) => r?.ha_installs, (p) => p?.haAnalytics?.total)
      : {};
    const haToday = repo.ha_domain && haLive ? haLive[repo.ha_domain] : null;
    if (haToday) haInstalls[isoDate(Date.now())] = haToday.total;
    const lastLegacyHa = Object.values(legacy).map((p) => legacyProject(p, name)?.haAnalytics).filter(Boolean).at(-1);
    const haVersions = haToday?.versions ?? lastLegacyHa?.versions ?? null;

    const allDaily = {};
    for (const series of Object.values(downloads)) {
      for (const [d, v] of Object.entries(series)) allDaily[d] = (allDaily[d] ?? 0) + v;
    }
    const cloneSeries = clones(snapshots, legacy, name);
    const starNow = Object.entries(stars).sort().at(-1)?.[1] ?? null;
    const starWeekAgo = valueDaysAgo(stars, 7, today);

    components.push({
      id: name,
      family: repo.family,
      description: meta.description ?? '',
      url: `https://github.com/${registry.org.github}/${name}`,
      major: Boolean(repo.category?.includes('major')),
      channels: Object.keys(downloads),
      kpis: {
        downloads7: sumRecent(allDaily, 7, today) + fallback.d7,
        downloads30: sumRecent(allDaily, 30, today) + fallback.d30,
        totals,
        stars: starNow,
        starsChange7: starNow != null && starWeekAgo != null ? starNow - starWeekAgo : null,
        haInstalls: haToday?.total ?? Object.entries(haInstalls).sort().at(-1)?.[1] ?? null,
        clones14: Object.entries(cloneSeries).filter(([d]) => d > addDays(today, -14)).reduce((s, [, c]) => s + c.count, 0),
      },
      downloads,
      stars,
      clones: cloneSeries,
      haInstalls,
      haVersions,
      hacsVersions: repo.hacs_zip ? hacsVersions(snapshots, name, repo.hacs_zip) : [],
    });
  }

  const stats = {
    generatedAt: new Date().toISOString(),
    snapshotDate: today,
    firstSnapshot: [...Object.keys(legacy), snapshots[0].date].sort()[0],
    notes,
    components,
  };
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(stats)}\n`);
  console.log(`stats: ${components.length} components, snapshot ${today}${notes.length ? `; ${notes.length} source gaps` : ''}`);
  for (const n of notes) console.warn(`  ${n}`);
}

await main();
