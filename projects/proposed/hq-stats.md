---
title: HQ Stats
summary: Usage stats and public site as a standalone product, shipped and marketed ahead of HQ
status: draft
lead: architect
owner: jeyrb
---

## Goal

Any open source developer, even with a single product, can collect usage for their projects across every channel they publish to and show it on a public site, with no AI and little set-up. Shares branding with [HQ as a product](../hq-as-product.md), ships before it and is marketed first, as the low-friction way in to HQ.

## Context

- Pulled out of HQ as a product (decided 2026-11-15): stats and site need no agents, so they suit a wider audience and can launch without waiting for the agentic parts.
- What exists today: daily collectors in `hq-private/scripts/` (stdlib Python, no deps) run by
  `collect-stats.yml`, snapshots in `hq-private/data/stats/`, legacy HACS history, and the site's Usage section
  built by `site/scripts/build-stats.mjs`, which publishes only public aggregates.
- Channels are already selected by fields in `repos.toml` (`pypi`, `npm`, `ghcr`, `hacs_zip`, `ha_domain`), so
  adding a user's repos is config, not code.
- Ecosystem channels (HACS, HA analytics, SignalK) are what nobody else offers; generic ones (PyPI, npm, ghcr, GitHub traffic) make it useful beyond those ecosystems.
- New product is a Javascript project with Github Actions and a config file that provides a location for `repos.toml`
  - `repos.toml` is expected to be inside a `hq` project at same repo, however it is also supported running `hq-stats` on its own, so the `repos.toml` can be in the same project. A skeleton one is provided in MD docs.
  - stats are collected into the `hq-stats` repo instance, from where they are available to `hq`
  - It is expected that `hq-stats` is a public repo, the documentation will cover any concerns or accomodations required if it is private
- Branding will be the HQ logo with `stats` at the bottom in a complementary color, a similar style of binary although in smaller size font
- Stats are for open source products, so everything collected is assumed public. Private repos are skipped by the
  collector (since 2026-11-15). Someone who wants private stats makes their `hq-stats` repo private and grants the
  extra permissions; the docs give that advice.
- Two parts:
  1. **Collectors**: snapshots and public aggregates in a documented format. Enough on their own to use
     `hq-stats` headless, as the source of stats for someone else's web pages or reports.
  2. **Default web pages** (optional): the Usage pages now built inside the `hq` site, served by `hq-stats` on its
     own subdomain (`hq-stats.rhizomatics.org.uk` for Rhizomatics). One domain would be ideal, but a separate one is
     simpler, so it's made as seamless as possible instead.
- HQ must be able to build navigation to the `hq-stats` pages into its own menu, and the two sites should feel like
  one: same look, links back and forth.

## Plan

- [ ] @pair Port the collectors (`collect_stats.py`) to JavaScript, with org and repos from `repos.toml`; done when
      nothing outside config names Rhizomatics. `collect_github.py` (alerts, referrers) stays in `hq-private`: it isn't stats
- [ ] @pair Config file and Actions workflow: locate `repos.toml` (in an `hq` repo or alongside in `hq-stats`), collect
      daily, commit snapshots to the `hq-stats` repo; skeleton `repos.toml` in the docs
- [x] @agent Collector skips private repos, so current snapshots hold only public ones (2026-11-15)
- [ ] @pair Workflow runs on schedule and manual dispatch only, so its push-access token never runs on PR code;
      docs on making `hq-stats` private for private stats, and the permissions that needs
- [ ] @pair Document the snapshot and aggregate formats as the headless interface
- [ ] @pair Default pages: move the Usage pages and `build-stats.mjs` out of the `hq` site into an optional `hq-stats`
      site, deployed to its own subdomain
- [ ] @pair Navigation manifest: `hq-stats` publishes its page list (label, URL, family) with the site; the `hq` site
      reads it at build time and puts Usage in its own menu, linking across. `hq-stats` pages link back to a parent
      site set in its config (label and URL), with matching header and theme so moving between them is seamless
- [ ] @pair Brand: HQ logo with `stats` beneath in a complementary colour, binary style at a smaller size; site look in the HQ family
- [ ] @human Create the `hq-stats` repo and its stats token secret; DNS for `hq-stats.rhizomatics.org.uk`
- [ ] @pair Move the code there, versioned; Rhizomatics' existing snapshots (private repos removed) and legacy HACS
      history migrated; the `hq` site drops its Usage pages and links to `hq-stats` through the manifest
- [ ] @agent Seed a throwaway org end to end; fix whatever needed hand edits
- [ ] @pair README and docs; announcement drafts for HA and SignalK developer forums
- [ ] @human Post announcements

## Success test

Rhizomatics HQ runs on the released `hq-stats` unchanged, and at least one outside developer has it running
within 2 months of the announcement.

## Decisions

Decided:

- 2026-11-15 — Shape: a JavaScript project with GitHub Actions and a config file pointing at `repos.toml`, which can
  live in an `hq` repo or in `hq-stats` itself. Snapshots are committed to the `hq-stats` repo, expected to be public.

- 2026-11-15 — Everything public: private repos aren't collected; private stats are a documented do-it-yourself
  option (private `hq-stats` repo plus permissions).
- 2026-11-15 — `hq-stats` is the collectors plus optional default pages, on their own subdomain. HQ builds its
  menu from `hq-stats`' page list, and navigation between them is as seamless as possible. Usable on its own,
  with HQ, or headless.

Open:

_None._

## Log

- 2026-11-15 — Created from the [HQ as a product](../hq-as-product.md) decision to ship stats and site first, as
  a separate product with shared branding.
- 2026-11-15 — Shape, data location and branding set in Context; plan updated to match, with tasks added for the
  JavaScript port and for keeping a public `hq-stats` repo free of private repos' data.
- 2026-11-15 — Collectors plus optional pages on a subdomain, with a navigation manifest for HQ's menu; everything
  public. `hq-private/scripts/collect_stats.py` now skips private repos.
