---
name: roadmap-review
description: Quarterly review of product roadmaps across Rhizomatics repos — items already done, obsoleted by other changes (ours or the platform's), and items whose priority has changed.
context: fork
agent: pm
---

# Quarterly roadmap review

## Find the roadmaps

For each repo in `repos.toml`, look for: `docs/developer/roadmap.md` (the standard location for major
projects per `reference/project_standards.md`; flag major projects without one), `ROADMAP.md`, roadmap pages under `docs/` (grep nav in
`properdocs.yml`/`zensical.toml`), a roadmap section in the README, open milestones
(`gh api repos/rhizomatics/<repo>/milestones`), issues labelled `roadmap`/`enhancement` that are
referenced from those pages, and planning folders (e.g. `planning/`). Skip repos without one, but
list them.

## Check each item

- **Done** — shipped: match against CHANGELOG.md, releases, merged PRs, closed issues since the
  item was written. Cite the release/PR.
- **Obsolete** — overtaken by another change in our code, or by the platform (check
  `hq-private/reports/ecosystem/` and `hq-private/reports/architecture-review/` for the quarter: e.g. Home Assistant core
  now does it, a SignalK API made it unnecessary).
- **Changed priority** — strong demand signals (support themes in `hq-private/reports/support-review/`,
  forum mentions, issue reactions `gh api .../issues/<n>/reactions`) or none at all.
- **Missing** — recurring requests or ecosystem opportunities from the quarter's reports that
  aren't on the roadmap.

## Output

`hq-private/reports/roadmaps/YYYY-Qn.md`: per product a table `Item | Where | Verdict (done/obsolete/
reprioritise/keep) | Evidence | Proposed edit`, then the proposed edits to each roadmap page as
diffs. Do not edit product repos without approval: file one hq issue per product (labels `roadmap`
+ area) listing the proposed edits and linking back here; once approved there, an agent may open
the PR.
