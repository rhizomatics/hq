---
name: reputation-review
description: Monthly reputation and visibility review for the org — trends in mentions and sentiment, search visibility gaps, competitors, where the products are (and aren't) recommended, and a review of the org's main website.
context: fork
agent: marketing
---

# Monthly reputation review

## Inputs

- The month's forum and adoption reports: the history of `hq-private/reports/forums/current.md` and
  `hq-private/reports/adoption/current.md` (`git log -p --since=<a month ago>`), plus any dated files from the month.
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
5. **Our own presence** — last announcement per product vs last release; releases that were never announced. References to other products where relevant, or in the footer of README.md.
6. **The org's main site** — www.rhizomatics.org.uk, built with Zensical from `docs/` in `<org>/.github`
   (`index.md`, `home-automation.md`, `sailing.md`, `zensical.toml`), served from its `gh-pages` branch.
   Read the live pages and the source, and check:
   - **Coverage and accuracy**: every product in `products.toml` (not on the `org` line, `public = false`, `experimental` or
     archived) appears on the right page with a current one-line description and working links to its repo
     and docs; nothing retired is still promoted; the description matches the product's README.
   - **Positioning**: does each page tell a newcomer what the products do for them, in the house voice
     (practical, understated, technically credible)? Recent notable releases, the HQ site, the Community page
     and blogs linked where they help.
   - **Discoverability**: title and description per page, sitemap, `robots.txt`, IndexNow still running
     (`.github/workflows/indexnow.yml`), indexed (`site:www.rhizomatics.org.uk`), and how it ranks for the
     org's name and its main product names compared with the repos.
   Fixes are a PR on `<org>/.github` (one theme, review from the maintainer); positioning choices are an hq
   issue.

## Output

`hq-private/reports/reputation/YYYY-MM.md`: a 3-line summary, a trends table, search visibility table
(`Product | Query | Our best rank | What ranks above`), gaps, and up to five actions (e.g. "write a
forum post for supernotify 2.13 YAML-free config", "add sitemap to remote_logger docs").

Actions the maintainer must do or approve become hq issues (labels `reputation` + area) linking
back here, per "Issues and PRs" in `AGENTS.md`.

The "Manual checks" places in `reference/*_discussion.md` are ones this review can't see. Don't file
a routine issue for them; when this month's findings give a specific reason to look in one (a
competitor launch, a complaint theme, a release likely to be discussed there), file one hq issue for
it (labels `forums` + area) saying where and what to look for. Treat the maintainer's notes on those
issues from the past month as mentions like any other.
