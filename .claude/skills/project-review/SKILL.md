---
name: project-review
description: Weekly and monthly review of everything in projects/ — progress updates and next steps weekly; monthly, also refine each project itself (goal, scope, shape, whether it's still worth doing).
context: fork
agent: pm
---

# Project review

Runs every Friday. The last Friday of the month is the **monthly** review (weekly + refinement);
every other Friday is the **weekly** review.

Active projects are `projects/*.md`; ideas not yet started are in `projects/proposed/`. Project files
are the maintainer's own documents and vary in shape, from a one-line idea to the fuller template
in `projects/README.md`. Respect their wording; suggest structure rather than imposing it.

## Weekly, per active project

- What moved this week: ticked tasks, Log entries, related commits/issues/PRs in the product repos
  (`gh search issues/prs --owner rhizomatics --updated >=<date>`), relevant process reports
  (e.g. an alignment proposal that belongs to a project).
- Status check: is the recorded status still true? Stalled (no movement in 3+ weeks)? Blocked, and on
  whom?
- **Next steps**: the 1–3 concrete next tasks, each tagged `@agent` / `@pair` / `@human`. For
  `@agent` tasks, say whether you could do them next run unattended.

Apply clear factual updates directly (tick tasks evidenced as done, add a dated Log entry, fix the
`projects/README.md` index). Leave goal/scope/priority changes as proposals.

## Monthly, additionally

- **Refine the project itself**: is the goal clear and testable? Is it the right size, or should
  it split/merge? Do "Soon"/"Distant" items now have the feedback they were waiting on (check
  process reports)? Still worth doing?
- For a free-form project that has grown many steps or approval gates, propose the fuller shape
  (Goal / Context / Plan with tagged tasks / Decisions / Log) as a draft in the report; leave
  short projects short.
- Cross-project: dependencies, conflicts, and what should be next to start given capacity.
- Ideas raised in process reports that deserve to become projects (draft them for `projects/proposed/`).
- Is it really a policy? A standing rule with no end state (a preferred library, a docs toolchain,
  "all HA components have no YAML") belongs in `policies/` (see `policies/README.md`), with any big
  catch-up work kept as a project. Propose the move and a draft of the policy.
- Proposed projects: is any now ready to start (move up to `projects/`), or better shelved?
- Active projects that look finished (propose moving to `projects/done/`) or abandoned (propose
  `projects/shelved/` with a dated reason). Moves between folders are the maintainer's call.
- Shelved projects: has anything changed (ecosystem, demand) that makes one worth reviving?

## Output

`hq-private/reports/projects/YYYY-MM-DD.md`: one section per project (status, moved, next steps, flags), then
for the monthly review a **Refinements** section with proposed edits as diffs or drafts.

Every `@human` next step, flag (blocked on the maintainer, stalled) and refinement needing a decision
must be in an hq issue (label `project` + area, one per project, per "Issues and PRs" in
`CLAUDE.md`) linking back to its section here; update the project's existing issue rather than
opening another.
