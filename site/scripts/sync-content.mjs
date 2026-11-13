#!/usr/bin/env node
// Copies hq's public docs, and the reports that processes declare public, into the Starlight
// content folder. The markdown in hq stays plain (readable on GitHub); this adds the frontmatter
// Starlight needs and turns relative .md links into site links.
//
// Published: team.md, policies/, processes/, projects/, reference/ from hq; reports from
// hq-private/reports/<area>/ for processes whose "**Report:**" line says public or
// "private by exception" (minus any report with `visibility: private` in its frontmatter),
// dated on or after REPORTS_FROM. Every page is scanned for private details first: a hit in an
// hq doc fails the build (fix the doc), a hit in a report leaves that report out.

import { copyFile, readFile, readdir, writeFile, mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hqRoot = path.resolve(siteRoot, '..');
const privateRoot = path.resolve(process.env.HQ_PRIVATE ?? path.join(hqRoot, '..', 'hq-private'));
const docsOut = path.join(siteRoot, 'src', 'content', 'docs');
const BASE = '/hq/';
const REPO = 'https://github.com/rhizomatics/hq';

// Reports written before visibility was declared assumed they were private; none of those are published.
const REPORTS_FROM = '2026-11-14';
const DOC_DIRS = ['policies', 'processes', 'projects', 'reference'];
const DOC_FILES = ['team.md'];
const CADENCE_ORDER = { readme: 0, daily: 1, weekly: 2, fortnightly: 3, monthly: 4, quarterly: 5 };

const PRIVATE_PATTERNS = [
  [/\b(?:10|127)\.\d{1,3}\.\d{1,3}\.\d{1,3}\b|\b192\.168\.\d{1,3}\.\d{1,3}\b|\b172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}\b/, 'private IP address'],
  [/\b[A-Za-z0-9._%+-]+@(?!users\.noreply\.github\.com)[A-Za-z0-9.-]+\.[a-z]{2,}\b/, 'email address'],
  [/\breferr\w*\b[^\n]{0,80}\b[\w-]+\.(?:com|org|net|io|dev|co\.uk)\b[^\n]{0,30}\d/i, 'traffic referrer counts'],
  [/\b(?:ghp|gho|github_pat|sk-ant|xox[bp]|AKIA)[A-Za-z0-9_-]{8,}/, 'credential-like token'],
];

function findPrivate(text) {
  return PRIVATE_PATTERNS.filter(([re]) => re.test(text)).map(([, what]) => what);
}

async function exists(p) {
  return stat(p).then(() => true, () => false);
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

// hq path (relative, posix) -> site slug, or null if not published.
function slugFor(rel) {
  const top = rel.split('/')[0];
  if (!DOC_FILES.includes(rel) && !DOC_DIRS.includes(top)) return null;
  return rel.replace(/(^|\/)README\.md$/i, '$1index.md').replace(/\.md$/, '').toLowerCase();
}

function pageUrl(slug) {
  return `${BASE}${slug.replace(/(^|\/)index$/, '')}/`.replace(/\/+$/, '/').replace(/\/\/+/g, '/');
}

// Split off YAML frontmatter and take the title from it or from the first H1.
function titleAndBody(text, fallback) {
  let front = '';
  let body = text;
  const fm = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (fm) {
    front = fm[1];
    body = text.slice(fm[0].length);
  }
  let title = front.match(/^title:\s*(.+)$/m)?.[1]?.trim();
  const h1 = body.match(/^#\s+(.+)\s*$/m);
  if (h1 && (!title || h1.index < 3 || body.slice(0, h1.index).trim() === '')) {
    title ??= h1[1].trim();
    body = body.slice(0, h1.index) + body.slice(h1.index + h1[0].length);
  }
  front = front.replace(/^title:.*$/m, '').trim();
  return { title: title ?? fallback, front, body: body.replace(/^\s+/, '') };
}

// Rewrite relative links outside code: published docs -> site pages, other hq files -> GitHub.
function rewriteLinks(body, srcRel, { linkBase }) {
  const parts = body.split(/(```[\s\S]*?```|`[^`\n]*`)/);
  return parts.map((part, i) => (i % 2 === 1 ? part : part.replace(/\]\(([^)\s]+)\)/g, (match, target) => {
    if (/^(?:[a-z]+:|#|\/)/i.test(target)) return match;
    const [file, anchor] = target.split('#');
    let rel = path.posix.normalize(path.posix.join(path.posix.dirname(srcRel), file));
    if (rel.startsWith('../hq-private/') || rel.startsWith('hq-private/')) {
      return `](https://github.com/rhizomatics/hq-private/blob/main/${rel.replace(/^(\.\.\/)?hq-private\//, '')})`;
    }
    if (rel.startsWith('..')) return match;
    const isDir = file.endsWith('/') || !path.posix.extname(rel);
    const docRel = isDir ? `${rel.replace(/\/$/, '')}/README.md` : rel;
    const slug = rel.endsWith('.md') || isDir ? slugFor(docRel) : null;
    const url = slug != null ? pageUrl(slug) : `${linkBase}/${isDir ? 'tree' : 'blob'}/main/${rel}`;
    return `](${url}${anchor ? `#${anchor}` : ''})`;
  }))).join('');
}

function yamlString(s) {
  return JSON.stringify(s);
}

async function writePage(slug, { title, front, body, editUrl, order, label, banner }) {
  const lines = [`title: ${yamlString(title)}`];
  if (front) lines.push(front);
  lines.push(editUrl ? `editUrl: ${yamlString(editUrl)}` : 'editUrl: false');
  if (order != null || label) {
    lines.push('sidebar:');
    if (label) lines.push(`  label: ${yamlString(label)}`);
    if (order != null) lines.push(`  order: ${order}`);
  }
  if (banner) lines.push(`banner:\n  content: ${yamlString(banner)}`);
  const dest = path.join(docsOut, `${slug}.md`);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, `---\n${lines.join('\n')}\n---\n\n${body}`);
}

async function syncDocs() {
  const sources = [...DOC_FILES];
  for (const dir of DOC_DIRS) {
    for (const f of await walk(path.join(hqRoot, dir))) sources.push(path.relative(hqRoot, f).split(path.sep).join('/'));
  }
  const problems = [];
  for (const rel of sources) {
    const text = await readFile(path.join(hqRoot, rel), 'utf8');
    const found = findPrivate(text);
    if (found.length) problems.push(`${rel}: ${found.join(', ')}`);
    const slug = slugFor(rel);
    const name = path.posix.basename(slug);
    const { title, front, body } = titleAndBody(text, name);
    const order = rel.startsWith('processes/') ? CADENCE_ORDER[name === 'index' ? 'readme' : name] : (name === 'index' ? 0 : undefined);
    await writePage(slug, {
      title,
      label: name === 'index' && rel.includes('/') ? 'Overview' : undefined,
      front: front.replace(/^(status|lead|owner|started):.*$/gm, '').trim(),
      body: rewriteLinks(body, rel, { linkBase: REPO }),
      editUrl: `${REPO}/edit/main/${rel}`,
      order,
    });
  }
  return { count: sources.length, problems };
}

// Report visibility per area, from the "**Output:**" and "**Report:**" lines of each process.
// Where two processes share an area, the more private one wins.
async function reportVisibility() {
  const rank = { public: 0, 'private by exception': 1, private: 2 };
  const areas = {};
  for (const f of await readdir(path.join(hqRoot, 'processes'))) {
    const text = await readFile(path.join(hqRoot, 'processes', f), 'utf8');
    for (const section of text.split(/^#+ /m)) {
      const area = section.match(/\*\*Output:\*\*\s*`hq-private\/reports\/([\w-]+)\//)?.[1];
      const vis = section.match(/\*\*Report:\*\*\s*(public|private by exception|private)/i)?.[1]?.toLowerCase();
      if (!area || !vis) continue;
      if (areas[area] == null || rank[vis] > rank[areas[area]]) areas[area] = vis;
    }
  }
  return areas;
}

// Start date of a report from its path: YYYY-MM-DD, YYYY-Www, YYYY-MM or a YYYY-Qn folder.
function reportDate(rel) {
  const day = rel.match(/(\d{4}-\d{2}-\d{2})/);
  if (day) return day[1];
  const week = rel.match(/(\d{4})-W(\d{2})/i);
  if (week) {
    const jan4 = new Date(Date.UTC(+week[1], 0, 4));
    const monday = new Date(jan4.getTime() - ((jan4.getUTCDay() + 6) % 7) * 86_400_000 + (+week[2] - 1) * 7 * 86_400_000);
    return monday.toISOString().slice(0, 10);
  }
  const quarter = rel.match(/(\d{4})-Q([1-4])/i);
  if (quarter) return `${quarter[1]}-${String((+quarter[2] - 1) * 3 + 1).padStart(2, '0')}-01`;
  const month = rel.match(/(\d{4}-\d{2})/);
  return month ? `${month[1]}-01` : null;
}

async function syncReports() {
  const reportsRoot = path.join(privateRoot, 'reports');
  if (!(await exists(reportsRoot))) return { published: 0, withheld: [], areas: {} };
  const areas = await reportVisibility();
  const withheld = [];
  let published = 0;
  for (const [area, vis] of Object.entries(areas)) {
    if (vis === 'private' || !(await exists(path.join(reportsRoot, area)))) continue;
    for (const file of await walk(path.join(reportsRoot, area))) {
      const rel = path.relative(reportsRoot, file).split(path.sep).join('/');
      const date = reportDate(rel);
      if (!date || date < REPORTS_FROM) continue;
      const text = await readFile(file, 'utf8');
      if (/^---\n[\s\S]*?^visibility:\s*private\s*$[\s\S]*?\n---/m.test(text)) continue;
      const found = findPrivate(text);
      if (found.length) {
        withheld.push(`reports/${rel}: ${found.join(', ')}`);
        continue;
      }
      const slug = `reports/${rel.replace(/\.md$/, '')}`.toLowerCase();
      const { title, front, body } = titleAndBody(text, path.posix.basename(rel, '.md'));
      await writePage(slug, {
        title,
        front: front.replace(/^visibility:.*$/m, '').trim(),
        body: rewriteLinks(body, `../hq-private/reports/${rel}`, { linkBase: REPO }),
        // Newest first in the sidebar.
        order: -Number(date.replaceAll('-', '')),
      });
      published += 1;
    }
  }
  await writePage('reports/index', {
    title: 'Reports',
    label: 'About reports',
    body: `Reports from processes whose **Report:** line in [Processes](${BASE}processes/) says public or private by exception, from ${REPORTS_FROM} on. Everything else stays private.\n`,
    order: -99999999,
  });
  return { published, withheld, areas };
}

for (const dir of [...DOC_DIRS, 'reports', 'team.md']) await rm(path.join(docsOut, dir), { recursive: true, force: true });
// The hq icon doubles as the site logo and favicon.
await mkdir(path.join(siteRoot, 'src', 'assets'), { recursive: true });
await mkdir(path.join(siteRoot, 'public'), { recursive: true });
await copyFile(path.join(hqRoot, 'assets', 'icon.svg'), path.join(siteRoot, 'src', 'assets', 'icon.svg'));
await copyFile(path.join(hqRoot, 'assets', 'icon.svg'), path.join(siteRoot, 'public', 'favicon.svg'));
await copyFile(path.join(hqRoot, 'assets', 'social-preview.png'), path.join(siteRoot, 'public', 'og.png'));
const docs = await syncDocs();
if (docs.problems.length) {
  console.error('Possible private details in hq docs; move them to hq-private or reword:');
  for (const p of docs.problems) console.error(`  ${p}`);
  process.exit(1);
}
const reports = await syncReports();
console.log(`content: ${docs.count} docs, ${reports.published} reports`);
for (const w of reports.withheld) console.warn(`  withheld ${w}`);
