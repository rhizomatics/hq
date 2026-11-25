---
summary: HQ works only from hq-stats' captured data and its own docs; the stats-like scanning HQ still does moves into hq-stats
programme: hq-as-product
productline: hq
---

# HQ data from hq-stats

hq-stats does the scanning and collecting; HQ works only from what it captures, plus HQ's own docs and config
(decided 2026-11-25, with the platform ratings in [SignalK Platform Health](../active/hq-signalk-platform-health.md)).
That keeps one collector with one schedule and one history, and leaves the HQ site build reading files rather than
APIs, which is cheaper on the API allowance and what a seeded HQ would inherit.

## What HQ still scans itself

| Script | What it gathers | Fits hq-stats? |
| --- | --- | --- |
| `site/scripts/build-issues.mjs` | open issues per repo, by type | **Yes**: counts, and history would show trends; hq-stats already snapshots `open_issues_and_prs` |
| `site/scripts/build-security.mjs` | public security settings, published advisories | **Yes**, as ratings beside `health`; OpenSSF Scorecard scores (public API) would fit there too |
| `site/scripts/build-actions.mjs` | Actions state per workflow (failures, flapping) | **Probably**: a rating of build health, but the Deployments page wants it fresher than a daily snapshot |
| `site/scripts/build-releases.mjs` | the last month's releases | **Partly**: the release list and dates are data hq-stats half has (`release_assets`); the one-line summaries are HQ's own writing and stay |
| `site/scripts/build-design.mjs` | RFCs, roadmaps, design principles | **No**: documents, not stats (decided 2026-11-25) |
| `site/scripts/build-community.mjs` | blog feeds | **No**: content; community projects' stats are already hq-stats' (decided 2026-11-25) |
| `hq-private/scripts/collect_github.py` | security alerts, traffic referrers, org repo list, discussions | **No**: private, and hq-stats only ever writes public data (decided 2026-11-25) |

## Tasks

- [ ] @agent hq-stats: open issues per repo by type into the snapshots; the Support and Design pages read them
      from `stats.json`, and `build-issues.mjs` goes
- [ ] @agent hq-stats: public security posture (private reporting, CodeQL, Dependabot, own policy, published
      advisories) and OpenSSF Scorecard score as ratings; the Security page reads them, and `build-security.mjs`
      goes
- [ ] @pair Decide whether Actions state can live with daily freshness (or hq-stats gains a lighter, more
      frequent `collect` for it); then move it or leave it
- [ ] @pair Releases: the list and dates from hq-stats; HQ keeps the summaries and joins them to it
- [ ] @agent With each move, check the site build makes fewer API calls (measured 2026-11-25: ~410 per full build)

## Log

- 2026-11-25: Proposed, from the inventory in SignalK Platform Health. The three Nos agreed by the maintainer.
