---
title: HQ Stats
status: draft
lead: architect
owner: jeyrb
---

## Goal

Any open source developer, even with a single product, can collect usage for their projects across every
channel they publish to and show it on a public site, with no AI and little set-up. Shares branding with
[HQ as a product](hq-as-product.md), ships before it and is marketed first, as the low-friction way in to HQ.

## Context

- Pulled out of HQ as a product (decided 2026-11-15): stats and site need no agents, so they suit a wider
  audience and can launch without waiting for the agentic parts.
- What exists today: daily collectors in `hq-private/scripts/` (stdlib Python, no deps) run by
  `collect-stats.yml`, snapshots in `hq-private/data/stats/`, legacy HACS history, and the site's Usage section
  built by `site/scripts/build-stats.mjs`, which publishes only public aggregates.
- Channels are already selected by fields in `repos.toml` (`pypi`, `npm`, `ghcr`, `hacs_zip`, `ha_domain`), so
  adding a user's repos is config, not code.
- Ecosystem channels (HACS, HA analytics, SignalK) are what nobody else offers; generic ones (PyPI, npm, ghcr,
  GitHub traffic) make it useful beyond those ecosystems.

## Plan

- [ ] @agent Separate the collectors and Usage site build from Rhizomatics specifics: org, repos and private
      data location from `repos.toml`; done when nothing outside config names Rhizomatics
- [ ] @pair Decide the shape: GitHub Action plus site template, or a repo to seed; snapshots kept in a private
      repo or on a data branch for all-public set-ups
- [ ] @pair Shared brand kit with HQ: name, mark and site look in the HQ family
- [ ] @human Create the `hq-stats` repo
- [ ] @pair Move the code there, versioned; Rhizomatics HQ consumes it and keeps its history
- [ ] @agent Seed a throwaway org end to end; fix whatever needed hand edits
- [ ] @pair README and docs; announcement drafts for HA and SignalK developer forums
- [ ] @human Post announcements

## Success test

Rhizomatics HQ runs on the released `hq-stats` unchanged, and at least one outside developer has it running
within 2 months of the announcement.

## Decisions

Open:

- Action + template or seeded repo; where snapshots live for all-public set-ups

## Log

- 2026-11-15 — Created from the [HQ as a product](hq-as-product.md) decision to ship stats and site first, as
  a separate product with shared branding.
