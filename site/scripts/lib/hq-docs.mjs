// Generated parts of the hq docs, and the mechanical checks on them (policies/scripts_over_agents.md).
//
// Lists that would otherwise be kept by hand are generated from their one source:
//   <!-- hq:generated projects -->   project tables, from each project file's folder, title and `summary:`
//   <!-- hq:generated schedule -->   routine schedule, from the cadence files' **When:** / **Who:** / **Environment:**
//   <!-- hq:runs <persona> -->       the processes a persona runs, from the cadence files' **Who:**
// The markers stay in the markdown (invisible on GitHub); the site build expands them.

import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { parse as parseToml } from 'smol-toml';

const CADENCES = [
  ['daily', 'Daily'],
  ['weekly', 'Weekly'],
  ['fortnightly', 'Fortnightly'],
  ['monthly', 'Monthly'],
  ['quarterly', 'Every four months'],
];
const PROJECT_GROUPS = [
  ['', 'Active'],
  ['proposed', 'Proposed'],
  ['done', 'Done'],
  ['shelved', 'Shelved'],
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
      out.push({ rel, group, title, summary: fields.summary || null });
    }
  }
  return out;
}

function projectTables(list, fromDir) {
  return PROJECT_GROUPS.map(([, group]) => {
    const rows = list.filter((p) => p.group === group).sort((a, b) => a.title.localeCompare(b.title));
    const table = rows.length
      ? ['| Project | Goal |', '|---|---|', ...rows.map((p) => `| [${cell(p.title)}](${path.posix.relative(fromDir, p.rel)}) | ${cell(p.summary ?? '_no summary_')} |`)].join('\n')
      : '_None._';
    return `## ${group}\n\n${table}`;
  }).join('\n\n');
}

// ---- processes ----

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
        entry = { cadence, cadenceLabel, rel: `processes/${cadence}.md`, skill, name, day, fields: {} };
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
    const link = path.posix.relative(fromDir, e.rel);
    const env = envs ? ` ${cell(e.fields.environment ?? 'default')} |` : '';
    return `| [${cell(e.name)}](${link}) | \`/${e.skill}\` | ${e.cadenceLabel} | ${cell(when)} | ${e.who ?? ''} |${env}`;
  });
  const head = envs ? ['| Process | Skill | Cadence | When | Who | Environment |', '|---|---|---|---|---|---|'] : ['| Process | Skill | Cadence | When | Who |', '|---|---|---|---|---|'];
  return [...head, ...rows].join('\n');
}

function runsList(list, persona, fromDir) {
  const mine = list.filter((e) => e.who === persona);
  if (!mine.length) return '_none_';
  return mine.map((e) => `[${e.name}](${path.posix.relative(fromDir, e.rel)}) (${e.cadence})`).join(', ');
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
  const used = new Set(procs.map((e) => e.skill));
  for (const s of skills) {
    if (!used.has(s) && (await exists(path.join(skillsDir, s, 'SKILL.md')))) problems.push(`.claude/skills/${s}: not in any cadence file`);
  }

  for (const p of await projects(hqRoot)) {
    if (!p.summary) problems.push(`${p.rel}: no summary: in frontmatter`);
  }

  const registry = parseToml(await readFile(path.join(hqRoot, 'repos.toml'), 'utf8'));
  // GoatCounter codes: the site code GoatCounter allows, and no two repos counting to the same site.
  const codes = {};
  for (const [name, r] of Object.entries(registry.repos ?? {})) {
    if (r.goatcounter == null) continue;
    if (!/^[a-z0-9][a-z0-9-]*$/.test(r.goatcounter)) problems.push(`repos.toml [repos.${name}]: goatcounter "${r.goatcounter}" isn't a GoatCounter site code`);
    if (codes[r.goatcounter]) problems.push(`repos.toml: goatcounter "${r.goatcounter}" used by both ${codes[r.goatcounter]} and ${name}`);
    codes[r.goatcounter] = name;
  }

  // Community entries: complete, and extending one of the org's own repos.
  for (const [id, e] of Object.entries(registry.community ?? {})) {
    const kind = e.kind ?? 'project';
    if (kind === 'blog') {
      for (const field of ['url', 'author']) if (!e[field]) problems.push(`repos.toml [community.${id}]: no ${field}`);
      continue;
    }
    if (kind !== 'project') problems.push(`repos.toml [community.${id}]: kind "${kind}" isn't project or blog`);
    for (const field of ['repo', 'author', 'extends']) if (!e[field]) problems.push(`repos.toml [community.${id}]: no ${field}`);
    if (e.repo && !/^[\w.-]+\/[\w.-]+$/.test(e.repo)) problems.push(`repos.toml [community.${id}]: repo should be owner/name`);
    if (e.extends && !registry.repos?.[e.extends]) problems.push(`repos.toml [community.${id}]: extends "${e.extends}", which isn't in [repos]`);
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
