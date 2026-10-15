---
name: support-review
description: Monthly review of the past month's support load (issues, discussions, forum threads) across Rhizomatics products, finding recurring themes and proposing root-cause fixes in code, tests or docs.
context: fork
agent: pm
---

# Monthly support review

The daily sweep answers people; this review stops the same questions recurring.

## Gather (last calendar month)

- Issues and discussions opened or active in the month for each repo in `repos.toml`
  (`gh issue list --state all --search "updated:>=YYYY-MM-01"`, discussions via GraphQL).
- Daily reports in `hq-private/reports/support-sweep/` and `hq-private/reports/forums/` for the month.
- Time-to-first-response and time-to-close per repo, from the issue timelines.

## Analyse

Group items into themes per product: same error, same misconfiguration, same missing feature, same
confusing docs page. For each theme with 2+ items (or 1 serious one), read the threads and the
relevant code (shallow-clone into the scratchpad), then work out the root cause and propose the fix
that would have prevented it:

- **Code** — better validation, clearer error/log message that names the fix, safer default,
  config migration.
- **Tests** — the regression test that would have caught a shipped bug.
- **Docs** — the missing example, FAQ/troubleshooting entry, or the page that misled.

Name files and functions, sketch the change, and estimate effort S/M/L. Prefer one fix that removes
a class of question over many patch replies.

## Output

`hq-private/reports/support-review/YYYY-MM.md`: headline metrics (volume, first-response median, still-open
from last month, vs previous month), themes ranked by recurring cost, the fix proposals, and a
check of last month's proposals (done / not done / no longer relevant). End with "proposed
issues", filed as hq issues (fixes an agent can build go as PRs), per "Issues and PRs" in `CLAUDE.md`.
