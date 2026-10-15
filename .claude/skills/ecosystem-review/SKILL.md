---
name: ecosystem-review
description: Monthly review of Home Assistant and SignalK — recent releases and upcoming architecture changes — for threats (breakage, deprecations, overlap) and opportunities for Rhizomatics products.
context: fork
agent: architect
---

# Monthly ecosystem review

Scheduled on the 10th, always after Home Assistant's monthly release (first Wednesday), so the new
release is in scope.

These repos are outside rhizomatics, so in a cloud routine read them with WebFetch of their
github.com pages (`/releases`, `/pulls?q=...`, `/discussions`); the `gh` commands below work locally only.

## Look back: releases in the last month

- **Home Assistant**: release blog post (`https://www.home-assistant.io/blog/` — "20YY.M" post),
  its "Backward-incompatible changes" section, and the developer blog
  `https://developers.home-assistant.io/blog/` (deprecations and API changes for custom integrations).
- **SignalK**: `gh release list -R SignalK/signalk-server` and release notes; also
  `SignalK/specification` and `@signalk/server-api` changes.

## Look forward

- **Home Assistant**: `home-assistant/architecture` discussions and proposals active in the last
  month (`gh api graphql` discussions on that repo), plus developer-blog posts announcing future
  removals. Skip core PRs (too many to be useful).
- **SignalK**: open and recently merged PRs on `SignalK/signalk-server` and `SignalK/specification`
  (`gh pr list -R SignalK/signalk-server --state all --search "updated:>=<date>"`), focusing on the
  plugin API, server API, resources, notifications and the app store.

## Assess against our products (`repos.toml`, by `upstream`)

For each relevant change: which of our repos, and is it a

- **Threat** — breaks us, deprecates an API we use (grep our repos for it), or core now does what
  we do (e.g. a new core notify feature overlapping supernotify). Give the deadline/version.
- **Opportunity** — new API/feature we could use, a gap core declined to fill, a proposal we
  should comment on to steer it.

Also check our `hacs.json` `homeassistant` minimum versions and SignalK server version ranges
against what's now current.

## Output

`hq-private/reports/ecosystem/YYYY-MM.md`: a summary, then **Threats** (`Change | Affects | When | Action`),
**Opportunities**, **Watch list** (forward-looking items to recheck next month, carried over and
updated from last month's report). File actions as hq issues per "Issues and PRs" in `CLAUDE.md`.
