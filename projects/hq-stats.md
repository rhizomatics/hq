---
title: HQ Stats
summary: Usage stats as an npm package, configured and stored in an hq repo, with a built-in UI or raw data
status: active
lead: architect
owner: jeyrb
started: 2026-11-19
---

## Goal

Any open source developer, even with a single product, can collect usage for their projects across every channel
they publish to (downloads and website page views) and show it publicly, with no AI and little set-up. Shares
branding with [HQ as a product](hq-as-product.md), ships before it and is marketed first, as the low-friction
way in to HQ.

## Context

- Pulled out of HQ as a product (decided 2026-11-15): stats need no agents, so they suit a wider audience and can
  launch without waiting for the agentic parts.
- What exists today: daily collectors in `hq-private/scripts/collect_stats.py` (stdlib Python, no deps) run by
  `collect-stats.yml`, snapshots in `hq-private/data/stats/`, legacy HACS history, and the site's Usage section
  (Downloads and Page views, split 2026-11-16; GitHub repo views added the same day) built by `site/scripts/build-stats.mjs`, which publishes only public
  aggregates.
- Channels are selected by fields in `repos.toml` (`pypi`, `npm`, `ghcr`, `hacs_zip`, `ha_domain`, `goatcounter`),
  so adding a user's repos is config, not code.
- Platform channels (HACS, HA analytics, SignalK) are what nobody else offers; generic ones (PyPI, npm, ghcr,
  GitHub traffic, GoatCounter page views) make it useful beyond those platforms.
- **Shape (2026-11-16): a plain npm package, `@<org>/hq-stats`**, published the same way as the org's other npm
  packages ([release policy](../policies/release.md): GitHub Actions, gated on CI, staged npm release with
  manual approval, immutable semver releases). Its source lives in its own repo; nothing about a user lives there.
  - **Configuration and outputs live in the user's `hq` repo**: `repos.toml` (or a skeleton one for someone without
    HQ), an `hq-stats` section for options, and the snapshots and public aggregates under `data/`. Snapshots record
    only public data. The user's own
    scheduled workflow runs `npx @<org>/hq-stats collect` and commits the results. A copy-in workflow is in the docs.
  - **Two ways to use it**, both from the same package: the **built-in UI** (`hq-stats build` writes the Usage pages
    as a static site, or as pages an Astro/Starlight site such as the HQ site mounts in its own navigation) or the
    **raw data**, a documented JSON format for anyone's own pages or reports.
  - This replaces the earlier plan of an `hq-stats` repo per user holding config and data, served on its own
    subdomain with a navigation manifest. The HQ site mounts the built-in pages directly, so one site, one menu.
- Stats are for open source products, so everything collected is assumed public. Private repos are skipped by the
  collector (since 2026-11-15). Someone who wants private stats keeps their `hq` repo private; the docs give that advice.
- The collector token needs push access (GitHub traffic API), so the workflow runs on schedule and manual dispatch
  only, never on PR code.
- Branding: the HQ logo with `stats` beneath in a complementary colour, a similar binary style at a smaller size.
- **Community**: contributed projects built on the org's products (`[community.<id>]` in `repos.toml`, design in
  [HQ as a product](hq-as-product.md#community-contributed-projects)) are collected from public sources only:
  stars, forks, releases, downloads per channel; no traffic or clones. Kept apart from the org's own figures:
  separate in the data, their own pages, never in the org's totals.
- **Not stats**: `collect_github.py` (alerts, referrers, discussions) stays in `hq-private`. Security (incl. OpenSSF
  Scorecard) stays on the HQ site's Security page.

## Plan

- [x] @agent Collector skips private repos, so current snapshots hold only public ones (2026-11-15)
- [x] @agent Site views: `collect_stats.py` collects daily page views (14-day overlapping window) and top pages per
      website from the GoatCounter API, `goatcounter` field per repo, `GOATCOUNTER_TOKEN` secret; the HQ site's Usage
      is split into Downloads and Page views, with page views on each component's page (2026-11-16)
- [ ] @human `GOATCOUNTER_TOKEN` secret in `hq-private` (API key with "Read statistics"); check one key reads every site
- [x] @pair Package skeleton: `hq-stats` repo, npm package with a `collect` and a `build` command, CI and the
      staged npm release workflow the other npm packages use (2026-11-19, local only until the repo exists)
- [x] @pair Port the collectors (`collect_stats.py`) to JavaScript in the package, with org and repos from
      `repos.toml`; done when nothing outside config names Rhizomatics (2026-11-19)
- [x] @pair Config: an `hq-stats` section (in `repos.toml` or its own file in `hq`) for the data directory, site
      options and the parent site's label and URL; skeleton `repos.toml` in the docs (2026-11-19: `[stats]`;
      the parent site's label and URL weren't needed, as the pages mount in the host site)
- [x] @pair Document the snapshot and aggregate formats as the raw-data interface, versioned with the package (2026-11-19)
- [x] @pair Built-in UI: move `build-stats.mjs`, `usage.ts`, the Usage pages and `Chart`/`Kpi` into the package;
      standalone static site plus pages the HQ site mounts in its own sidebar (2026-11-19: an Astro integration
      and sidebar helper, plus a standalone Starlight example; the HQ site still uses its own copy until 0.1.0 is
      published)
- [ ] @pair Community: move `build-community.mjs` and its page into the package; `[community.*]` from public
      sources only, stored apart, never in the org's totals
- [x] @pair Workflow for users to copy: schedule and manual dispatch only, `npx` the pinned version, commit to `hq` (2026-11-19)
- [ ] @pair Brand: HQ logo with `stats` beneath in a complementary colour; site look in the HQ family
- [ ] @human Create the `hq-stats` repo, its npm package and trusted publishing; then @agent pushes the local
      repo (`../hq-stats`, one commit) and drafts the 0.1.0 release
- [ ] @pair Rhizomatics on the package: snapshots and legacy HACS history moved from `hq-private/data/stats` into
      `hq/data/`, GitHub traffic (views, clones) kept, `hq-private`'s stats collector retired, the HQ site's Usage pages served by the package
- [ ] @agent Seed a throwaway org end to end from the docs; fix whatever needed hand edits
- [ ] @pair README and docs; announcement drafts for HA and SignalK developer forums
- [ ] @human Post announcements

## Success test

Rhizomatics HQ runs on the released `hq-stats` package unchanged, and at least one outside developer has it
running within 2 months of the announcement.

## Decisions

Decided:

- 2026-11-15 — Everything public: private repos aren't collected; private stats are a documented do-it-yourself
  option.
- 2026-11-16 — Shape: a plain npm package published like the org's other npm packages, with its configuration and
  outputs in the user's `hq` repo, usable through its built-in UI or the raw data. Replaces the 2026-11-15 shape
  (an `hq-stats` repo per user holding config and snapshots, its own subdomain and a navigation manifest).
- 2026-11-16 — Daily snapshots live in `hq` and record only public data. GitHub traffic for public repos (repo page
  views and clones) counts as public and is kept. Referrers and popular paths stay with `collect_github.py` in
  `hq-private`.

Open:

_None._

## Log

- 2026-11-15 — Created from the [HQ as a product](hq-as-product.md) decision to ship stats and site first, as
  a separate product with shared branding.
- 2026-11-15 — Collectors plus optional pages on a subdomain, with a navigation manifest for HQ's menu; everything
  public. `hq-private/scripts/collect_stats.py` now skips private repos. Community projects added, collected from
  public sources and kept out of the org's totals.
- 2026-11-15 — Page views: GitHub gives none for Pages sites, only repo traffic. GoatCounter chosen (cookieless,
  no consent banners; no Google Analytics). HQ site wired to it via `[org].goatcounter`; collector task added.
- 2026-11-16 — Reshaped by the maintainer: an npm package published like the rest, with config and outputs in
  `hq`, built-in UI or raw data; no per-user `hq-stats` repo, subdomain or manifest. Plan rewritten to match.
  GoatCounter collection added to `collect_stats.py` and the Usage section split into Downloads and Page views;
  page views appear once the `GOATCOUNTER_TOKEN` secret exists.
- 2026-11-16 — Decided: snapshots live in `hq`, public data only. GitHub traffic (repo page views, clones) counts as public and is kept.
- 2026-11-19 — Started (moved to active) as the last Phase 0 task of [HQ as a product](hq-as-product.md). Built in a
  local `hq-stats` repo next to `hq`, not yet on GitHub (the repo is the maintainer's to create):
  `hq-stats collect` (the JS port of `collect_stats.py`, same snapshot format plus each repo's description and
  archive state, so `build` no longer needs the private GitHub snapshot), `hq-stats build` (from `build-stats.mjs`),
  and the Usage pages as an Astro integration (`@rhizomatics/hq-stats/astro`) with a sidebar helper. Checked
  against Rhizomatics' data: `build` gives the same aggregate as the site's own (descriptions aside, which old
  snapshots lack), and an HQ site built with the packed package renders the same 21 Usage pages. Tests, lint,
  CI and the staged npm release workflow are in place; README and `docs/data-format.md` document the config and
  both data formats. Generalised on the way: no hard-coded family (the HA installs column shows where a family
  has installs), components outside `[families]` go under "Other".
