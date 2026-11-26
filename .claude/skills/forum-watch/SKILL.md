---
name: forum-watch
description: Daily scan of Home Assistant and SignalK community forums for discussions mentioning the org's products, or where one of them would be a good answer. Drafts replies; never posts.
context: fork
agent: marketing
---

# Daily forum watch

Sources and access methods are in `reference/hass_discussion.md` and `reference/signalk_discussion.md`; problem phrases per product in `reference/topic_terms.md`. Products are the repos in
`products.toml` (read a repo's README if you need to know what it does).

## Gather

Check only the sources whose cadence is due today (see the reference files), covering the
period since that source was last checked: one cadence period, or since the last version of the
report that listed it (`git log -p` on `current.md`). Record in the report which sources were checked.

1. **Mentions** — product, repo and package names from `products.toml`, and the org's own name (`[org].name`).
2. **Opportunities** — threads matching the problem phrases where nobody has already given a good
   answer, the thread is recent and still open, and our product genuinely fits (version, platform,
   setup effort). Being useful beats being promotional; skip weak fits.

Skip threads already listed in the report's history unless there is a new reply mentioning us.

## Classify mentions

praise · question/how-to · bug report (→ check whether a GitHub issue exists) · complaint ·
comparison with an alternative (note which) · announcement by us.

## Output

Rewrite `hq-private/reports/forums/current.md` (see "Rolling reports" in `AGENTS.md`), short (see "Working rules" in `AGENTS.md`):

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

Then file one hq issue per thread worth replying to (labels `forums` + area), per "Issues and PRs"
in `AGENTS.md`, never a standing issue. The title names the thread and what's at stake, with a
date when the chance passes (`homeassistant: reply on WTH "Notifying people is hard" by 2026-11-24
(frontend wants mockup feedback)`); the body says in a line why it matters and why now, and links
the thread and its draft (`current.md#...` at the commit that added it, so the link survives the next run). Rank the time-sensitive
ones first in the report: a platform team asking for feedback, a WTH or feature-request thread
about something a product already does, an RFC or design discussion we could shape. Close an issue,
saying how, once a reply from us is visible in the thread or the thread has gone cold.

Manual checks (the "Manual checks" tables in `reference/*_discussion.md`) don't get issues on a
schedule. File one only when there is a specific reason to look, e.g. a release or a complaint
theme found today that is likely being discussed there, saying what to look for.

Fix stale reference files (`reference/*_discussion.md`, `topic_terms.md`) directly in the same
run instead of reporting them. Nothing found → a one-line report. Do not post anywhere.
