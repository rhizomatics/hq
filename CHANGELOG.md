---
title: What's New
---

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
