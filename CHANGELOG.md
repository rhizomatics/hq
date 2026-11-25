---
title: What's New
---

# Unreleased

## Shared admin workflows

- `admin-zizmor.yml` runs on a push to `main` only when workflows or `.github/zizmor.yml` change (still on every
  pull request and weekly): zizmor audits workflows only, and its online checks use the repo's API allowance.
- The reusable workflows are named "… (shared)", so a repo's Actions list tells them apart from its own callers
  of the same name. Check names are unchanged.

## HQ

- Site builds on push reuse the GitHub data the scheduled builds save, rather than reading every repo again.
- The Deployments page's data reads each repo's recent runs in one or a few calls rather than one per workflow:
  about half the API calls, same result.
- Products: a catalogue at `/products/` and a page per product. Projects: `ongoing`, `blocked` and `ready`
  statuses, dates per status, done and shelved folded away. Community projects can be recommended rather than
  built on.

# 1.1.0

## Products, product lines and artefacts

- `repos.toml` is replaced by three files: `hq.toml` (the org, product lines, platforms, distributions, labels,
  `security_watch`, capabilities), `products.toml` (one table per product: its line, repos, platform,
  significance, lifecycle and artefacts) and `community.toml`. Written with `hq-stats migrate`, then laid out as
  designed in the Product Catalogue project.
- Product lines replace families, and their slugs are the hq issue areas: `homeassistant`, `signalk`,
  `picoware`, `mqtt`, `hq` and `org`. `signalk-cli` and `boat-tech-directory` move under SignalK; `hq-stats`
  gets the HQ line; `.github` is the `homepage` product; `hq` and `hq-private` are one product.
- `upstream` becomes `platform`, set on the line and overridden per product (Picoware's `linux` and `esp32`).
- The site reads the registry through hq-stats 0.3's `loadConfig`, one model shared with the Usage pages, and
  groups the Deployments, Security, Support and Design pages by product line (`hq-stats` now appears on them).
- `mise run check-hq` also checks that every artefact's distribution and every platform is declared in
  `hq.toml`, and that community projects extend a product.
- Skills, personas, policies and the hq-private collectors (`collect_github.py`, `sync_sandbox.py`, whose
  profiles now map by platform) read the new files.

# 1.0.1

## Shared admin workflows

- New `reusable-zizmor.yml` and its caller template `admin-zizmor.yml`: [zizmor](https://docs.zizmor.sh/) audits
  each repo's GitHub Actions workflows and uploads its findings to code scanning (public repos).
- `reusable-dependency-review.yml` and `reusable-labels.yml` pin their actions by commit SHA, and the labels
  checkout no longer keeps its token.
- Caller templates grant no permissions by default; each job asks for only what it needs.
- `admin-auto-assign.yml` calls the reusable workflow in `hq` rather than `.github`.

## HQ

- Usage stats are collected by the new [`@rhizomatics/hq-stats`](https://github.com/rhizomatics/hq-stats) package
  and kept in `hq/data/stats/`. The site's Usage pages come from the same package.
- Page views include GitHub repo views, in the totals and per repo.
- Releases page: several releases of one product on the same day show as one entry.
- OpenSSF Scorecard runs on `hq`; scores feed the security and alignment reviews but stay internal.
- `[capabilities]` in `repos.toml` records who provides each recurring capability (HQ skill, gh-aw workflow,
  scanner or service), checked by `mise run check-hq`.
- `/security-escalation` merges and ranks findings across scanners before escalating.

# 1.0.0

Working package
