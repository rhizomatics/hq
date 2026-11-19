---
name: pr-report
description: Weekly report on lingering open pull requests across the org's repos — external contributions awaiting review, stuck dependency bumps, and stale drafts.
context: fork
agent: pm
---

# Weekly lingering PR report

For each repo in `repos.toml`:
`gh api 'repos/<org>/<repo>/pulls?state=open'`, with `gh api repos/<org>/<repo>/pulls/<n>` for
`mergeable`, `.../pulls/<n>/reviews`, and `gh api repos/<org>/<repo>/commits/<sha>/check-runs` for CI (REST
only: GraphQL-based `gh pr list` doesn't work in cloud routines)

## Buckets

1. **External contributions awaiting us** — author not a maintainer and not a bot, and the last
   action was theirs. Highest priority; note age and whether CI passes.
2. **Dependency bumps** (renovate/dependabot) — trusted and inherited bumps are merged or closed
   daily by `/dependabot-sweep`; what's left here is the rest. Group by repo: green & mergeable (can batch-merge),
   failing CI (summarise the failure from the check runs), conflicting. Bumps open > 7 days are lingering.
3. **Maintainer's own PRs** open > 14 days, and drafts with no activity > 30 days (candidates to close).
4. **Waiting on the author** — we asked for changes and they've gone quiet > 14 days.

## Output

`hq-private/reports/prs/YYYY-Www.md`: a counts line, then a table per bucket
`Repo | PR | Author | Age | Idle | CI | Suggested action`. Call out the same PR appearing in last
week's report ("lingering 2+ weeks"). Suggested actions may include exact `gh pr merge` commands
for green bumps, but do not run them.

PRs waiting on the maintainer, per "Issues and PRs" in `AGENTS.md` (never a rolling issue): where
review and merge is all that's needed, make sure review is requested from the maintainer and leave
it at that. A PR needing a decision (an external contribution to accept or not, a stale draft to
close, a major bump) gets its own hq issue (labels `prs` + area), titled with the PR and the
decision, e.g. `homeassistant: decide on supernotify#320 (external: WebOS transport)`, linking back
to this report. Close issues for PRs merged or closed since.
