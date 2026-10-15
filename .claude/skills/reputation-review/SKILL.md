---
name: reputation-review
description: Monthly reputation and visibility review for Rhizomatics — trends in mentions and sentiment, search visibility gaps, competitors, and where the products are (and aren't) recommended.
context: fork
agent: marketing
---

# Monthly reputation review

## Inputs

- The month's `hq-private/reports/forums/` (mentions, sentiment, comparisons) and `hq-private/reports/adoption/`.
- Previous `hq-private/reports/reputation/` for trend lines.

## Investigate

1. **Mentions trend** — count by product, community and kind (praise/question/bug/complaint/
   comparison) vs previous months. Recurring complaints are reputational even if each is small.
2. **Search visibility** — for each product, run WebSearch for 2–3 problem phrases from
   `reference/topic_terms.md` and its name. Record whether our docs site, repo or forum thread appears
   on the first page and what ranks above it. Check the docs sites (CNAME in each repo) have a
   good title, description, sitemap, and are indexed (`site:<domain>`).
3. **Listings and backlinks** — present and current in: HACS default/custom lists, SignalK app
   store, awesome lists (awesome-home-assistant, awesome-mqtt, boat-tech-directory),
   Home Assistant/SignalK docs or blogs, YouTube/blog write-ups. GitHub dependents and stars trend.
4. **Competitors and alternatives** — projects that came up in comparisons; what they claim, what
   users prefer, gaps we could fill or should acknowledge.
5. **Our own presence** — last announcement per product vs last release; releases that were never
   announced.

## Output

`hq-private/reports/reputation/YYYY-MM.md`: a 3-line summary, a trends table, search visibility table
(`Product | Query | Our best rank | What ranks above`), gaps, and up to five actions (e.g. "write a
forum post for supernotify 2.13 YAML-free config", "add sitemap to remote_logger docs").

Actions the maintainer must do or approve become hq issues (labels `reputation` + area) linking
back here, per "Issues and PRs" in `CLAUDE.md`.

Add every "Manual checks" row in `reference/*_discussion.md` to the rolling forums issue for its
area (`<area>: forum replies and manual checks`), since this review can't see those places: for
each, what to look for this month (product names, competitors and complaint themes found above).

The maintainer ticks manual checks and writes notes as comments on those issues; treat notes from
the past month as mentions like any other.
