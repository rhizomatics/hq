---
name: policy-review
description: Four-monthly review of HQ policies, processes and the cloud routines that run them — consistency, gaps, missed opportunities, and cheap checks of policies against the repos. Delivers a PR on hq plus one hq issue for decisions.
context: fork
agent: pm
---

# Policy review (Apr / Aug / Dec, 10th)

Reviews `policies/`, `processes/`, `AGENTS.md` (and the agent-specific notes such as `CLAUDE.md`),
`team.md`, the skills in `.claude/skills/` and the cloud routines. No report: the outputs are a PR and an
issue (see "Reports only when there's a case for one" in `AGENTS.md`).

## 0. Pick up

- Read the previous policy review issue (open or closed, labels `alignment` + `org`, title
  `org: policy review decisions, <Month YYYY>`) and its comments. Carry out anything approved there
  that isn't done yet, and note what you picked up in the new issue.
- `git log --since=<last review date> -- policies processes AGENTS.md CLAUDE.md .claude` shows what changed
  since; new or edited text is the most likely place for new inconsistencies.

## 1. Consistency

Read every file under `policies/` and `processes/`, then `AGENTS.md`, `CLAUDE.md` and `team.md`. Look for:

- **Contradictions** between files: the same rule stated differently (versions windows, trusted
  packages, file names and paths, cooldowns), or a process README rule that `AGENTS.md` contradicts.
- **Org names outside config**: the org, maintainer, site URL and repo names belong in `repos.toml`
  (`[org]`); everywhere else names the role (`<org>`, the maintainer, `hq-private`). A grep for them
  outside `repos.toml` and instance content (`projects/`, `policies/`, `reference/`, the site's home page)
  should find nothing.
- **Duplication** that will drift: keep a rule in one place and point to it from the others.
- **Stale facts**: examples whose dates have passed, deprecated tools still named, repos that were
  renamed or archived (check against `repos.toml`).
- **Process plumbing**: run `mise run check-hq` (or `node site/scripts/check-hq.mjs`) and fix or
  raise what it reports. It covers the mechanical checks: every cadence entry has a skill and vice
  versa, skill `name` and `agent:` match the entry, the persona exists, each entry has **When:**
  (UTC), **Environment:** and **Report:**, every project has a `summary:`, no broken headings. The
  schedule in `processes/README.md`, the project tables and each persona's **Runs** in `team.md` are
  generated from those sources, so there's nothing to compare there.
- **Scripts over agents** (`policies/scripts_over_agents.md`): any step in a skill that is the same
  mechanical work every run, or any list someone still keeps by hand, is a candidate for a script or
  a generated list. Propose it in the PR or the issue.

## 1a. Skills against the cadence files

The cadence files in `processes/` are the source of truth for *when*, *who*, *output* and *scope*;
the skill says *how*. Skills drift when a cadence entry is edited and the skill isn't. The script
above has already checked names, personas and required fields; for every cadence entry, read its
`SKILL.md` in full and check what needs reading:

- **When**: the timing the skill states (title, intro, "runs every …", rolling batch days, the
  weekly/monthly split) matches the cadence entry and its section heading.
- **Output**: the paths, PR/issue shapes and labels the skill's **Output** names match the entry's
  **Output**, and both follow the "Reports only when there's a case for one" rule in `AGENTS.md`
  (a skill still writing a report the cadence entry has dropped, or the reverse, is drift).
- **Report visibility**: the skill writes for the reader the entry's **Report** line implies, and a
  private-by-exception skill tells the agent when to set `visibility: private`.
- **Scope**: every bullet in the cadence entry is covered by a step in the skill, and the skill
  doesn't do substantial work the entry doesn't mention (or that another process owns).
- **Description**: the frontmatter `description` still summarises the entry; it's what decides
  when the skill is picked.

Where the cadence file is right and the skill has drifted, fix the skill in the PR. Where the skill
looks right and the cadence file stale (the skill was changed on purpose since), fix the cadence
file. Where it isn't clear which is intended, put it in the issue with both versions.

## 2. Cloud routines

List the routines (the `/schedule` skill, or `RemoteTrigger` list). For each `hq: ...` routine
check its cron against the **When:** of its cadence entry (times are UTC), its environment against
the entry's **Environment:**, and that it runs the right skill.

**Attached repos**: compare each routine's attached repos with `repos.toml` exactly, not just for
missing ones. The correct set is every repo in `repos.toml` without `archived = true`, including
`hq` and `hq-private` (routines commit to both). Report per routine:

- repos in `repos.toml` that aren't attached (new repos are the usual case);
- attached repos that shouldn't be: archived in `repos.toml`, renamed (the old name still attached),
  deleted, or not in `repos.toml` at all (if the repo is real and belongs, the gap is in
  `repos.toml`; fix it in the PR);
- routines whose repo sets differ from each other, since all `hq:` routines should carry the same set.

A process with no routine is a gap unless its cadence entry says it runs by hand.
Fixing a routine is the maintainer's: list the exact change in the issue.

## 3. Policies against reality

Only cheap checks, by REST (`gh api`), farmed to the `researcher` subagent for many repos:

- `products.md`: Actions, Issues, PRs and Discussions on, Wiki and Projects off
  (`gh api repos/<org>/<repo> --jq '{has_issues,has_discussions,has_wiki,has_projects}'`);
  "managed by hq" badge in the README.
- `release.md`: latest release immutable (`.immutable` on `releases?per_page=1`), except
  `experimental` repos.
- `design.md` / `project_standards.md`: major repos (`category = ["major"]`) have
  `docs/developer/design/design_principles.md` and `roadmap.md`; RFCs have a status line in the
  agreed format.

Anything deeper belongs to the process that owns it (`/github-review`, `/alignment-review`,
`/roadmap-review`): hand it over in the issue rather than redoing their work.

## 4. Gaps and opportunities

- Policies that no process checks: name the process that should, or propose a new check.
- Recurring findings in the last four months of hq issues that a policy would prevent.
- Policies that cost more than they save for a one-maintainer org: propose dropping or relaxing them.

## Output

- **PR on `hq`**, branch `policy-review/YYYY-MM`, review requested from the maintainer: every change that
  needs no decision (wording, typos, cross-references, stale facts, schedule text, skill plumbing).
  One theme per PR; the description says why each change was made.
- **One hq issue** in `<org>/hq-private`, labels `alignment` + `org`, assigned to the maintainer, title
  `org: policy review decisions, <Month YYYY>`: a checklist of decisions only the maintainer can make,
  each with the evidence (repos, files) and the options in a line or two. Link it from the PR and
  the PR from it. Search open issues with the same labels first.
- Once the maintainer answers in the issue, carry out what was approved (PRs for repo changes,
  edits to skills or policies) and tick the items with how.
