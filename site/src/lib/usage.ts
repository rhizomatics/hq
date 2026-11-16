import stats from '../data/stats.json';
import { FAMILIES } from './hq-config.mjs';

export type Daily = Record<string, number>;
export type Component = (typeof stats.components)[number];
export type Channel = 'hacs' | 'npm' | 'pypi' | 'ghcr';

// Channel order is the categorical slot order (validated as adjacent pairs for stacked bars).
export const CHANNELS: { id: Channel; label: string; slot: number; note: string }[] = [
  { id: 'hacs', label: 'HACS / Marketplace', slot: 1, note: 'release zip downloads by HACS (the Home Assistant Marketplace from 2026.11): installs and updates, not unique users' },
  { id: 'npm', label: 'npm', slot: 2, note: 'npm registry downloads, including the SignalK app store, CI and mirrors' },
  { id: 'pypi', label: 'PyPI', slot: 3, note: 'PyPI downloads without mirrors (pypistats.org)' },
  { id: 'ghcr', label: 'Container pulls', slot: 4, note: 'GitHub Container Registry pulls' },
];

export const data = stats;
export type Website = (typeof stats.websites)[number];
export const familyLabel = (family: string) => FAMILIES.find(([f]) => f === family)?.[1] ?? family;

export type ChartSpec = {
  type: 'bar' | 'line';
  stacked?: boolean;
  labels: string[];
  datasets: { label: string; slot: number; data: (number | null)[]; type?: 'bar' | 'line'; extra?: (string | null)[] }[];
  yLabel?: string;
};

const DAY = 86_400_000;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

function weekStart(date: string) {
  const t = Date.parse(date);
  return iso(t - ((new Date(t).getUTCDay() + 6) % 7) * DAY);
}

function dateRange(from: string, to: string) {
  const out: string[] = [];
  for (let t = Date.parse(from); t <= Date.parse(to); t += DAY) out.push(iso(t));
  return out;
}

// Stacked series (downloads by channel, page views by kind of site). Weekly buckets run Monday to Sunday;
// the current, incomplete week is left out. Daily view covers the last 90 days.
export function stackedSpecs(groups: { label: string; slot: number; daily: Daily }[], unit: string) {
  const present = groups.filter((g) => Object.keys(g.daily).length);
  const allDates = present.flatMap((g) => Object.keys(g.daily)).sort();
  if (!allDates.length) return null;
  const last = allDates.at(-1)!;
  const days = dateRange(allDates[0], last);

  const lastFullWeek = iso(Date.parse(weekStart(last)) - 7 * DAY);
  const weeks = [...new Set(days.map(weekStart))].filter((w) => w <= lastFullWeek);
  const weekly: ChartSpec = {
    type: 'bar',
    stacked: true,
    labels: weeks,
    datasets: present.map((g) => {
      const sums: Record<string, number> = {};
      for (const [d, v] of Object.entries(g.daily)) sums[weekStart(d)] = (sums[weekStart(d)] ?? 0) + v;
      return { label: g.label, slot: g.slot, data: weeks.map((w) => (w in sums ? Math.round(sums[w]) : null)) };
    }),
    yLabel: `${unit} per week`,
  };
  const recent = days.slice(-90);
  const daily: ChartSpec = {
    type: 'bar',
    stacked: true,
    labels: recent,
    datasets: present.map((g) => ({
      label: g.label,
      slot: g.slot,
      data: recent.map((d) => (d in g.daily ? Math.round(g.daily[d]) : null)),
    })),
    yLabel: `${unit} per day`,
  };
  // Too few full weeks for a weekly chart to say anything: show daily only.
  return { weekly: weeks.length >= 2 ? weekly : null, daily, groups: present.map((g) => g.label) };
}

// Downloads across channels are additive, so they stack.
export function downloadsSpecs(series: Partial<Record<Channel, Daily>>) {
  const channels = CHANNELS.filter((c) => series[c.id] && Object.keys(series[c.id]!).length);
  const specs = stackedSpecs(channels.map((c) => ({ label: c.label, slot: c.slot, daily: series[c.id]! })), 'Downloads');
  return specs && { weekly: specs.weekly ?? specs.daily, daily: specs.daily, channels: channels.map((c) => c.id) };
}

// Page views: product websites (docs sites) and the org's own (www, the HQ site), stacked.
export const VIEWS_NOTE =
  'Page views counted by GoatCounter on each website: cookieless, bots excluded, and one count per page per visitor session, so a reload or return visit the same day may not count again';

export function pageViewSpecs(sites: { product: boolean; daily: Daily }[]) {
  const sum = (list: { daily: Daily }[]) => {
    const out: Daily = {};
    for (const s of list) for (const [d, v] of Object.entries(s.daily)) out[d] = (out[d] ?? 0) + v;
    return out;
  };
  return stackedSpecs(
    [
      { label: 'Product sites', slot: 1, daily: sum(sites.filter((s) => s.product)) },
      { label: 'Organisation sites', slot: 2, daily: sum(sites.filter((s) => !s.product)) },
    ],
    'Page views',
  );
}

export function viewsViews(specs: { weekly: ChartSpec | null; daily: ChartSpec }): Record<string, ChartSpec> {
  return specs.weekly ? { Weekly: specs.weekly, Daily: specs.daily } : { Daily: specs.daily };
}

// The org-wide view: every component's channels added together, per channel.
export function combinedDownloads() {
  const combined: Partial<Record<Channel, Daily>> = {};
  for (const c of stats.components) {
    for (const [channel, daily] of Object.entries(c.downloads) as [Channel, Daily][]) {
      const target = (combined[channel] ??= {});
      for (const [d, v] of Object.entries(daily)) target[d] = (target[d] ?? 0) + v;
    }
  }
  return combined;
}

export function lineSpec(series: Daily, label: string, yLabel: string): ChartSpec | null {
  const dates = Object.keys(series).sort();
  if (dates.length < 2) return null;
  return { type: 'line', labels: dates, datasets: [{ label, slot: 1, data: dates.map((d) => series[d]) }], yLabel };
}

export function clonesSpec(clones: Record<string, { count: number; uniques: number }>): ChartSpec | null {
  const dates = Object.keys(clones).sort();
  if (dates.length < 2) return null;
  return {
    type: 'bar',
    labels: dates,
    datasets: [
      { label: 'Clones', slot: 1, data: dates.map((d) => clones[d].count) },
      { label: 'Unique cloners', slot: 2, type: 'line', data: dates.map((d) => clones[d].uniques) },
    ],
    yLabel: 'Per day',
  };
}

function versionKey(v: string) {
  return v.replace(/^v/i, '').split(/[.\-+]/).map((p) => (/^\d+$/.test(p) ? p.padStart(6, '0') : `~${p}`)).join('.');
}
const byVersion = (a: string, b: string) => {
  const ka = versionKey(a);
  const kb = versionKey(b);
  // A pre-release (beta1) sorts before its release: compare numerically, then let shorter win.
  const pa = ka.split('.');
  const pb = kb.split('.');
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    if (pa[i] === undefined) return pb[i].startsWith('~') ? 1 : -1;
    if (pb[i] === undefined) return pa[i].startsWith('~') ? -1 : 1;
    if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
  }
  return 0;
};

// Oldest to newest, the newest `limit - 1` versions and the rest folded into "Older".
function foldVersions<T extends { version: string; value: number }>(rows: T[], limit: number) {
  const sorted = [...rows].sort((a, b) => byVersion(a.version, b.version));
  if (sorted.length <= limit) return sorted;
  const older = sorted.slice(0, sorted.length - limit + 1);
  return [{ ...older[0], version: 'Older', value: older.reduce((s, r) => s + r.value, 0) }, ...sorted.slice(-(limit - 1))];
}

export function hacsVersionSpec(rows: { version: string; downloads: number; last7: number | null }[]): ChartSpec | null {
  if (!rows.length) return null;
  const folded = foldVersions(rows.map((r) => ({ ...r, value: r.downloads })), 16);
  return {
    type: 'bar',
    labels: folded.map((r) => r.version),
    datasets: [{
      label: 'Downloads',
      slot: 1,
      data: folded.map((r) => r.value),
      extra: folded.map((r) => (r.version !== 'Older' && r.last7 != null ? `${r.last7} in the last 7 days` : null)),
    }],
    yLabel: 'Downloads, all time',
  };
}

export function haVersionSpec(versions: Record<string, number> | null): ChartSpec | null {
  if (!versions || !Object.keys(versions).length) return null;
  const folded = foldVersions(Object.entries(versions).map(([version, value]) => ({ version, value })), 12);
  return {
    type: 'bar',
    labels: folded.map((r) => r.version),
    datasets: [{ label: 'Installations', slot: 1, data: folded.map((r) => r.value) }],
    yLabel: 'Installations reporting',
  };
}

export const fmt = (n: number | null | undefined) => (n == null ? '–' : new Intl.NumberFormat('en-GB').format(Math.round(n)));
export const signed = (n: number | null | undefined) => (n == null ? '' : n > 0 ? `+${n}` : n < 0 ? `${n}` : '±0');
