// Generated parts of the hq docs, and the mechanical checks on them (policies/scripts_over_agents.md).
//
// Lists that would otherwise be kept by hand are generated from their one source:
//   <!-- hq:generated projects -->   project tables, from each project file's folder, title and `summary:`
//   <!-- hq:generated schedule -->   routine schedule, from the cadence files' **When:** / **Who:** / **Environment:**
//   <!-- hq:runs <persona> -->       the processes a persona runs, from the cadence files' **Who:**
// The markers stay in the markdown (invisible on GitHub); the site build expands them.
// The index pages of projects/, processes/ and policies/ on the site are generated lists too (listPage);
// each folder's README becomes that section's "How it works" page.

import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { loadConfig } from '@rhizomatics/hq-stats';

const CADENCES = [
  ['daily', 'Daily'],
  ['weekly', 'Weekly'],
  ['fortnightly', 'Fortnightly'],
  ['monthly', 'Monthly'],
  ['quarterly', 'Every four months'],
];
// Project folders, in the order the list shows them. The folder is the status; nothing sits in projects/ itself.
export const PROJECT_GROUPS = [
  ['active', 'Active'],
  ['queued', 'Queued'],
  ['proposed', 'Proposed'],
  ['done', 'Done'],
  ['shelved', 'Shelved'],
];

// Policy groups (`group:` in each policy's frontmatter), in the order the list shows them.
export const POLICY_GROUPS = [
  ['general', 'General'],
  ['python', 'Python'],
  ['signalk', 'SignalK'],
  ['hq', 'HQ'],
];

const exists = (p) => stat(p).then(() => true, () => false);

function frontmatter(text) {
  const fm = text.match(/^---\n([\s\S]*?)\n---\n?/);
  const fields = {};
  if (fm) {
    for (const line of fm[1].split('\n')) {
      const m = line.match(/^([\w-]+):\s*(.*)$/);
      if (m) fields[m[1]] = m[2].trim().replace(/^(['"])(.*)\1$/, '$2');
    }
  }
  return { fields, body: fm ? text.slice(fm[0].length) : text };
}

const cell = (s) => s.replace(/\|/g, '\\|');

// ---- projects ----

export async function projects(hqRoot) {
  const out = [];
  for (const [dir, group] of PROJECT_GROUPS) {
    const abs = path.join(hqRoot, 'projects', dir);
    if (!(await exists(abs))) continue;
    for (const f of (await readdir(abs)).filter((n) => n.endsWith('.md') && n !== 'README.md')) {
      const rel = path.posix.join('projects', dir, f);
      const { fields, body } = frontmatter(await readFile(path.join(abs, f), 'utf8'));
      const title = fields.title || body.match(/^#\s+(.+)$/m)?.[1]?.trim() || f.replace(/\.md$/, '');
      out.push({ rel, slug: f.replace(/\.md$/, ''), group, title, summary: fields.summary || null, programme: fields.programme || null });
    }
  }
  return out;
}

// The project a `programme:` names (by file name, in any status folder), or null.
const programmeOf = (list, p) => (p.programme ? (list.find((x) => x.slug === p.programme) ?? null) : null);

function projectTables(list, fromDir) {
  const link = (p) => `[${cell(p.title)}](${path.posix.relative(fromDir, p.rel)})`;
  const programmeCell = (p) => {
    const owner = programmeOf(list, p);
    return owner ? link(owner) : p.programme ? cell(p.programme) : '';
  };
  const byStatus = PROJECT_GROUPS.map(([, group]) => {
    const rows = list.filter((p) => p.group === group).sort((a, b) => a.title.localeCompare(b.title));
    const table = rows.length
      ? [
          '| Project | Goal | Programme |',
          '|---|---|---|',
          ...rows.map((p) => `| ${link(p)} | ${cell(p.summary ?? '_no summary_')} | ${programmeCell(p)} |`),
        ].join('\n')
      : '_None._';
    return `## ${group}\n\n${table}`;
  });
  // Programmes: each owning project with its member projects, whatever their status.
  const owners = [...new Set(list.map((p) => p.programme).filter(Boolean))]
    .map((slug) => list.find((x) => x.slug === slug))
    .filter(Boolean)
    .sort((a, b) => a.title.localeCompare(b.title));
  if (!owners.length) return byStatus.join('\n\n');
  const order = Object.fromEntries(PROJECT_GROUPS.map(([, g], i) => [g, i]));
  const programmes = owners.map((owner) => {
    const members = list.filter((p) => p.programme === owner.slug).sort((a, b) => order[a.group] - order[b.group] || a.title.localeCompare(b.title));
    const rows = [owner, ...members].map((p) => `| ${link(p)}${p === owner ? ' _(programme)_' : ''} | ${p.group} | ${cell(p.summary ?? '_no summary_')} |`);
    return `### ${cell(owner.title)}\n\n| Project | Status | Goal |\n|---|---|---|\n${rows.join('\n')}`;
  });
  return [...byStatus, `## Programmes\n\nProjects grouped by the programme they belong to (\`programme:\` in their frontmatter).\n\n${programmes.join('\n\n')}`].join('\n\n');
}

// ---- policies ----

export async function policies(hqRoot) {
  const dir = path.join(hqRoot, 'policies');
  const out = [];
  for (const f of (await readdir(dir)).filter((n) => n.endsWith('.md') && n !== 'README.md')) {
    const { fields, body } = frontmatter(await readFile(path.join(dir, f), 'utf8'));
    const title = fields.title || body.match(/^#\s+(.+)$/m)?.[1]?.trim() || f.replace(/\.md$/, '');
    out.push({ rel: `policies/${f}`, title, group: fields.group || null, summary: fields.summary || null });
  }
  return out.sort((a, b) => a.title.localeCompare(b.title));
}

// Policies by group, known groups first. A policy is never dropped: an unknown group gets its own heading
// (named from its id) and one without a group goes under Other. check-hq flags both.
export function policyGroups(list) {
  const ids = [...POLICY_GROUPS.map(([id]) => id), ...new Set(list.map((p) => p.group ?? 'other'))];
  const label = (id) => POLICY_GROUPS.find(([g]) => g === id)?.[1] ?? id.replace(/[-_]/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
  return [...new Set(ids)]
    .map((id) => ({ id, label: label(id), items: list.filter((p) => (p.group ?? 'other') === id) }))
    .filter((g) => g.items.length);
}

function policyTables(list, fromDir) {
  return policyGroups(list).map(({ label, items }) => [`## ${label}`, '', '| Policy | What it says |', '|---|---|',
    ...items.map((p) => `| [${cell(p.title)}](${path.posix.relative(fromDir, p.rel)}) | ${cell(p.summary ?? '_no summary_')} |`)].join('\n')).join('\n\n');
}

// ---- processes ----

// Heading anchor as the site renders it (github-slugger rules).
function anchor(heading) {
  return heading.replace(/`/g, '').toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-');
}

// Every agent process entry (a heading naming a `/skill`) in the cadence files, with its fields.
export async function processes(hqRoot) {
  const out = [];
  for (const [cadence, cadenceLabel] of CADENCES) {
    const file = path.join(hqRoot, 'processes', `${cadence}.md`);
    if (!(await exists(file))) continue;
    let parent = null;
    let entry = null;
    for (const line of (await readFile(file, 'utf8')).split('\n')) {
      const h = line.match(/^(#{2,})\s+(.+?)\s*$/);
      if (h) {
        const skill = h[2].match(/`\/([\w-]+)`/)?.[1];
        if (!skill) {
          if (h[1].length === 2) parent = h[2];
          entry = null;
          continue;
        }
        const parts = h[2].split(/\s+[—-]\s+/).filter((p) => !p.includes('`/'));
        const [day, name] = parts.length > 1 ? [parts[0], parts[1]] : [h[1].length > 2 ? parent : null, parts[0]];
        entry = { cadence, cadenceLabel, rel: `processes/${cadence}.md`, anchor: anchor(h[2]), skill, name, day, fields: {} };
        out.push(entry);
        continue;
      }
      const f = entry && line.match(/^- \*\*([\w ]+):\*\*\s*(.*)$/);
      if (f) entry.fields[f[1].toLowerCase()] = f[2].trim();
    }
  }
  for (const e of out) e.who = e.fields.who?.match(/^[\w-]+/)?.[0] ?? null;
  return out;
}

// The Environment column appears only if some entry sets one (the default environment is in processes/README.md).
function scheduleTable(list, fromDir) {
  const envs = list.some((e) => e.fields.environment);
  const rows = list.map((e) => {
    const when = e.fields.when ? [e.day, e.fields.when].filter(Boolean).join(', ') : '_not scheduled_';
    const link = `${path.posix.relative(fromDir, e.rel)}#${e.anchor}`;
    const env = envs ? ` ${cell(e.fields.environment ?? 'default')} |` : '';
    const routine = e.fields.routine ? e.fields.routine.replace(/`/g, '') : `hq: ${e.cadence} ${e.name.toLowerCase()}`;
    return `| [${cell(e.name)}](${link}) | \`/${e.skill}\` | ${e.cadenceLabel} | ${cell(when)} | ${e.who ?? ''} | ${cell(routine)} |${env}`;
  });
  const head = envs
    ? ['| Process | Skill | Cadence | When | Who | Routine | Environment |', '|---|---|---|---|---|---|---|']
    : ['| Process | Skill | Cadence | When | Who | Routine |', '|---|---|---|---|---|---|'];
  return [...head, ...rows].join('\n');
}

function runsList(list, persona, fromDir) {
  const mine = list.filter((e) => e.who === persona);
  if (!mine.length) return '_none_';
  return mine.map((e) => `[${e.name}](${path.posix.relative(fromDir, e.rel)}) (${e.cadence})`).join(', ');
}

// ---- section list pages ----

// The generated body of a section's index page on the site, under its intro and "How it works" button.
export async function listPage(section, hqRoot) {
  const fromDir = section;
  if (section === 'projects') return projectTables(await projects(hqRoot), fromDir);
  if (section === 'processes') return scheduleTable(await processes(hqRoot), fromDir);
  if (section === 'policies') return policyTables(await policies(hqRoot), fromDir);
  throw new Error(`no list page for ${section}`);
}

// ---- expansion ----

// Expand the markers in one doc. `rel` is the doc's path in hq, for relative links.
export async function expandGenerated(body, rel, hqRoot) {
  if (!body.includes('<!-- hq:')) return body;
  const fromDir = path.posix.dirname(rel);
  const procs = await processes(hqRoot);
  const projectList = body.includes('<!-- hq:generated projects -->') ? await projects(hqRoot) : [];
  return body
    .replace(/<!-- hq:generated projects -->/g, () => projectTables(projectList, fromDir))
    .replace(/<!-- hq:generated schedule -->/g, () => scheduleTable(procs, fromDir))
    .replace(/<!-- hq:runs ([\w-]+) -->/g, (_, persona) => runsList(procs, persona, fromDir));
}

// ---- checks ----

// Mechanical consistency checks: each returns a list of problems, empty when all is well.
export async function checkHq(hqRoot) {
  const problems = [];
  const procs = await processes(hqRoot);
  const skillsDir = path.join(hqRoot, '.claude', 'skills');
  const agentsDir = path.join(hqRoot, '.claude', 'agents');
  const skills = (await exists(skillsDir)) ? await readdir(skillsDir) : [];

  for (const e of procs) {
    const where = `${e.rel} "${e.name}"`;
    const skillFile = path.join(skillsDir, e.skill, 'SKILL.md');
    if (!(await exists(skillFile))) {
      problems.push(`${where}: no skill .claude/skills/${e.skill}/SKILL.md`);
      continue;
    }
    const { fields } = frontmatter(await readFile(skillFile, 'utf8'));
    if (fields.name && fields.name !== e.skill) problems.push(`${where}: skill frontmatter name is "${fields.name}", not "${e.skill}"`);
    if (!e.who) problems.push(`${where}: no **Who:**`);
    else if (!(await exists(path.join(agentsDir, `${e.who}.md`)))) problems.push(`${where}: **Who:** ${e.who} is not a persona in .claude/agents/`);
    else if (fields.agent && fields.agent !== e.who) problems.push(`${where}: **Who:** is ${e.who} but the skill runs as agent: ${fields.agent}`);
    if (!e.fields.when) problems.push(`${where}: no **When:** (UTC time), so it has no routine`);
    else if (!/\d{2}:\d{2} UTC/.test(e.fields.when)) problems.push(`${where}: **When:** has no UTC time`);
    if (!e.fields.report) problems.push(`${where}: no **Report:** visibility`);
  }
  // Processes sharing a routine run as one persona at one time.
  const byRoutine = {};
  for (const e of procs.filter((p) => p.fields.routine)) (byRoutine[e.fields.routine] ??= []).push(e);
  for (const [routine, list] of Object.entries(byRoutine)) {
    const who = new Set(list.map((e) => e.who));
    const time = new Set(list.map((e) => e.fields.when?.match(/\d{2}:\d{2} UTC/)?.[0]));
    if (who.size > 1) problems.push(`routine ${routine}: processes with different personas (${[...who].join(', ')})`);
    if (time.size > 1) problems.push(`routine ${routine}: processes with different start times (${[...time].join(', ')})`);
  }

  const used = new Set(procs.map((e) => e.skill));
  for (const s of skills) {
    if (!used.has(s) && (await exists(path.join(skillsDir, s, 'SKILL.md')))) problems.push(`.claude/skills/${s}: not in any cadence file`);
  }

  const projectList = await projects(hqRoot);
  for (const p of projectList) {
    if (!p.summary) problems.push(`${p.rel}: no summary: in frontmatter`);
    if (p.programme && !programmeOf(projectList, p)) problems.push(`${p.rel}: programme: "${p.programme}" isn't a project file name`);
    if (p.programme === p.slug) problems.push(`${p.rel}: programme: names itself`);
  }
  for (const [slug, n] of Object.entries(Object.groupBy(projectList, (p) => p.slug)).map(([k, v]) => [k, v.length])) {
    if (n > 1) problems.push(`projects: ${slug}.md is in ${n} status folders`);
  }
  // Every project is in one of the status folders: a file or folder anywhere else isn't listed on the site.
  const projectDirs = PROJECT_GROUPS.map(([dir]) => dir);
  for (const ent of await readdir(path.join(hqRoot, 'projects'), { withFileTypes: true })) {
    if (ent.isDirectory() ? !projectDirs.includes(ent.name) : ent.name.endsWith('.md') && ent.name !== 'README.md') {
      problems.push(`projects/${ent.name}: not in a status folder (${projectDirs.join(', ')})`);
    }
  }
  const groups = POLICY_GROUPS.map(([id]) => id);
  for (const p of await policies(hqRoot)) {
    if (!p.summary) problems.push(`${p.rel}: no summary: in frontmatter`);
    if (!groups.includes(p.group)) problems.push(`${p.rel}: group: should be one of ${groups.join(', ')}`);
  }

  // hq.toml, products.toml and community.toml, through hq-stats' loader, which already fails on a product in an
  // unknown line, a repo in two products, a bad slug or lifecycle.
  let cfg;
  try {
    cfg = loadConfig({ config: hqRoot, warn: (m) => problems.push(m) });
  } catch (err) {
    problems.push(`products: ${err.message}`);
    return problems;
  }
  const settings = cfg.settings;
  const lineIds = new Set(cfg.lines.map((l) => l.id));
  const platformIds = new Set(Object.keys(settings.platforms ?? {}));
  const distributions = new Set(Object.keys(settings.distributions ?? {}));
  const productIds = new Set(cfg.products.map((p) => p.id));

  // Platforms named anywhere are in [platforms], and so is what each builds on.
  for (const l of cfg.lines) {
    for (const pl of l.platforms) if (!platformIds.has(pl)) problems.push(`hq.toml [lines.${l.id}]: platform "${pl}" isn't in [platforms]`);
  }
  for (const [id, pl] of Object.entries(settings.platforms ?? {})) {
    for (const b of [pl.builds_on ?? []].flat()) if (!platformIds.has(b)) problems.push(`hq.toml [platforms.${id}]: builds_on "${b}" isn't in [platforms]`);
  }
  // GoatCounter codes: the site code GoatCounter allows, and no two products counting to the same site.
  const codes = {};
  for (const p of cfg.products) {
    for (const pl of p.platforms) if (!platformIds.has(pl)) problems.push(`products.toml [${p.id}]: platform "${pl}" isn't in hq.toml [platforms]`);
    for (const a of p.artefacts) {
      if (!distributions.has(a.distribution)) problems.push(`products.toml [${p.id}]: artefact ${a.name}'s distribution "${a.distribution}" isn't in hq.toml [distributions]`);
      if (a.goatcounter == null) continue;
      if (!/^[a-z0-9][a-z0-9-]*$/.test(a.goatcounter)) problems.push(`products.toml [${p.id}]: goatcounter "${a.goatcounter}" isn't a GoatCounter site code`);
      if (codes[a.goatcounter]) problems.push(`products.toml: goatcounter "${a.goatcounter}" used by both ${codes[a.goatcounter]} and ${p.id}`);
      codes[a.goatcounter] = p.id;
    }
  }
  for (const w of settings.security_watch ?? []) {
    if (!lineIds.has(w.area)) problems.push(`hq.toml [[security_watch]] ${w.package}: area "${w.area}" isn't a line`);
  }

  // Community entries: complete, and extending one of the org's own products.
  for (const e of cfg.community) {
    const where = `community.toml [${e.id}]`;
    if (e.line && !lineIds.has(e.line)) problems.push(`${where}: line "${e.line}" isn't in hq.toml [lines]`);
    if (e.kind === 'blog') {
      for (const field of ['url', 'author']) if (!e[field]) problems.push(`${where}: no ${field}`);
      continue;
    }
    if (e.kind !== 'project') problems.push(`${where}: kind "${e.kind}" isn't project or blog`);
    for (const field of ['repo', 'author', 'extends']) if (!e[field]) problems.push(`${where}: no ${field}`);
    if (e.repo && !/^[\w.-]+\/[\w.-]+$/.test(e.repo)) problems.push(`${where}: repo should be owner/name`);
    if (e.extends && !productIds.has(e.extends)) problems.push(`${where}: extends "${e.extends}", which isn't in products.toml`);
    for (const a of e.artefacts) {
      if (!distributions.has(a.distribution)) problems.push(`${where}: artefact ${a.name}'s distribution "${a.distribution}" isn't in hq.toml [distributions]`);
    }
  }

  // Capabilities: every provider well formed and third-party ones pinned; every skill provides exactly one.
  const KINDS = ['hq', 'gh-aw', 'skill', 'action', 'service'];
  const STATUSES = ['active', 'trial', 'candidate'];
  const providedBy = {};
  for (const [id, cap] of Object.entries(settings.capabilities ?? {})) {
    const where = `hq.toml [capabilities.${id}]`;
    if (!Array.isArray(cap.providers) || !cap.providers.length) {
      problems.push(`${where}: no providers`);
      continue;
    }
    for (const p of cap.providers) {
      if (!KINDS.includes(p.kind)) problems.push(`${where}: kind "${p.kind}" isn't one of ${KINDS.join(', ')}`);
      if (!p.ref) problems.push(`${where}: a ${p.kind} provider has no ref`);
      if (p.status && !STATUSES.includes(p.status)) problems.push(`${where}: status "${p.status}" isn't one of ${STATUSES.join(', ')}`);
      if (p.kind === 'hq' && p.ref) {
        if (!skills.includes(p.ref)) problems.push(`${where}: hq provider "${p.ref}" isn't a skill in .claude/skills`);
        (providedBy[p.ref] ??= []).push(id);
      }
      // Third-party code runs pinned, so a change to it reaches us only when we move the pin. The org's own
      // shared workflows are pinned by their callers instead (admin/README.md).
      const ownWorkflow = p.ref?.startsWith(`${settings.org.github}/${settings.org.hq_repo ?? 'hq'}/`);
      if (['gh-aw', 'skill', 'action'].includes(p.kind) && p.ref && !ownWorkflow && !/@[\w.-]+$/.test(p.ref)) {
        problems.push(`${where}: ${p.kind} provider "${p.ref}" isn't pinned (@version or @sha)`);
      }
      if (p.kind === 'gh-aw' && p.ref && !/^[\w.-]+\/[\w.-]+\/.+\.md@[0-9a-f]{40}$/.test(p.ref)) {
        problems.push(`${where}: gh-aw provider should be owner/repo/path.md@<full sha>`);
      }
    }
  }
  if (settings.capabilities) {
    for (const s of skills) {
      if (!(await exists(path.join(skillsDir, s, 'SKILL.md')))) continue;
      const caps = providedBy[s] ?? [];
      if (caps.length !== 1) problems.push(`.claude/skills/${s}: hq provider of ${caps.length ? caps.join(', ') : 'no capability'} in hq.toml (should be one)`);
    }
  }

  // Markdown headings broken by a non-breaking space after the #s.
  for (const dir of ['policies', 'processes', 'projects', 'reference']) {
    const walk = async (d) => {
      for (const ent of await readdir(d, { withFileTypes: true })) {
        const full = path.join(d, ent.name);
        if (ent.isDirectory()) await walk(full);
        else if (ent.name.endsWith('.md') && /^#+\u00a0/m.test(await readFile(full, 'utf8'))) {
          problems.push(`${path.relative(hqRoot, full)}: heading with a non-breaking space after #`);
        }
      }
    };
    if (await exists(path.join(hqRoot, dir))) await walk(path.join(hqRoot, dir));
  }
  return problems;
}
