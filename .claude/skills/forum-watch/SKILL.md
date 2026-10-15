---
name: forum-watch
description: Daily scan of Home Assistant and SignalK community forums for discussions mentioning Rhizomatics products, or where a Rhizomatics product would be a good answer. Drafts replies; never posts.
context: fork
agent: marketing
---

# Daily forum watch

Sources and access methods are in `reference/hass_discussion.md` and `reference/signalk_discussion.md`; problem phrases per product in `reference/topic_terms.md`. Products are the repos in
`repos.toml` (read a repo's README if you need to know what it does).

## Gather

Check only the sources whose cadence is due today (see the reference files), covering the
period since that source was last checked: one cadence period, or since the last report that
listed it. Record in the report which sources were checked.

1. **Mentions** — product and repo names (`supernotify`, `updates2mqtt`, `rhizomatics`, …).
2. **Opportunities** — threads matching the problem phrases where nobody has already given a good
   answer, the thread is recent and still open, and our product genuinely fits (version, platform,
   setup effort). Being useful beats being promotional; skip weak fits.

Skip threads already listed in earlier reports unless there is a new reply mentioning us.

## Classify mentions

praise · question/how-to · bug report (→ check whether a GitHub issue exists) · complaint ·
comparison with an alternative (note which) · announcement by us.

## Output

`hq-private/reports/forums/YYYY-MM-DD.md`, short (see "Working rules" in `CLAUDE.md`):

```
# Forum watch YYYY-MM-DD
N mentions · M to reply · [hq#N](link)
Checked: <sources, one line>. Gaps: <one line per source that failed, if any>

| Thread | Product | Kind | Action needed |

## Drafts
### <thread title> (<link>)
> short, helpful, discloses that we maintain the project, links the specific docs page
```

"Kind" is reply (a mention needing one), opportunity, or bug report (without a matching GitHub
issue; give a suggested issue title). Landscape notes (competitors, announcements) get one line
each at most, and go to the reputation review rather than accumulating here.

Then update the rolling hq issue per area (`<area>: forum replies and manual checks`, labels
`forums` + area), per "Issues and PRs" in `CLAUDE.md`: one checklist item per thread to reply to,
linking the thread and its draft (`hq-private/reports/forums/YYYY-MM-DD.md#...`), plus the manual checks due
today from the "Manual checks" tables in the `reference/*_discussion.md` files (what to look for,
and any product or topic that came up today). Tick items already done (e.g. a reply is visible in
the thread) and drop manual checks that are past due by a full cadence.

Fix stale reference files (`reference/*_discussion.md`, `topic_terms.md`) directly in the same
run instead of reporting them. Nothing found → a one-line report. Do not post anywhere.
