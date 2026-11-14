---
name: policy-review
description: Four-monthly review of HQ policies, processes and the cloud routines that run them — consistency, gaps, missed opportunities, and cheap checks of policies against the repos. Delivers a PR on hq plus one hq issue for decisions.
context: fork
agent: pm
---

# Policy review (Apr / Aug / Dec, 10th)

Reviews `policies/`, `processes/`, `CLAUDE.md`, `team.md`, the skills in `.claude/skills/` and the
cloud routines. No report: the outputs are a PR and an issue (see "Reports" in `CLAUDE.md`).

## 0. Pick up

- Read the previous policy review issue (open or closed, labels `alignment` + `org`, title
  `org: policy review decisions, <Month YYYY>`) and its comments. Carry out anything approved there
  that isn't done yet, and note what you picked up in the new issue.
- `git log --since=<last review date> -- policies processes CLAUDE.md .claude` shows what changed
  since; new or edited text is the most likely place for new inconsistencies.

## 1. Consistency

Read every file under `policies/` and `processes/`, then `CLAUDE.md` and `team.md`. Look for:

- **Contradictions** between files: the same rule stated differently (versions windows, trusted
  packages, file names and paths, cooldowns), or a process README rule that `CLAUDE.md` contradicts.
- **Duplication** that will drift: keep a rule in one place and point to it from the others.
- **Stale facts**: examples whose dates have passed, deprecated tools still named, repos that were
  renamed or archived (check against `repos.toml`).
- **Process plumbing**: every cadence entry has a skill in `.claude/skills/` and vice versa; the
  schedule in `processes/README.md` matches the cadence files; owners in `team.md` match the
  cadence files' **Who**; each skill's output matches its cadence entry.

## 2. Cloud routines

List the routines (the `/schedule` skill, or `RemoteTrigger` list). For each `hq: ...` routine
check its cron against the cadence files and `processes/README.md` (times are UTC), its environment
against the README's environment lists, that it runs the right skill, and that every non-archived repo in
`repos.toml` is attached. A process with no routine is a gap unless the README says it runs by hand.
Fixing a routine is the maintainer's: list the exact change in the issue.

## 3. Policies against reality

Only cheap checks, by REST (`gh api`), farmed to the `researcher` subagent for many repos:

- `products.md`: Actions, Issues, PRs and Discussions on, Wiki and Projects off
  (`gh api repos/rhizomatics/<repo> --jq '{has_issues,has_discussions,has_wiki,has_projects}'`);
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

- **PR on `hq`**, branch `policy-review/YYYY-MM`, review requested from `jeyrb`: every change that
  needs no decision (wording, typos, cross-references, stale facts, schedule text, skill plumbing).
  One theme per PR; the description says why each change was made.
- **One hq issue** in `rhizomatics/hq-private`, labels `alignment` + `org`, assigned `jeyrb`, title
  `org: policy review decisions, <Month YYYY>`: a checklist of decisions only the maintainer can make,
  each with the evidence (repos, files) and the options in a line or two. Link it from the PR and
  the PR from it. Search open issues with the same labels first.
- Once the maintainer answers in the issue, carry out what was approved (PRs for repo changes,
  edits to skills or policies) and tick the items with how.
