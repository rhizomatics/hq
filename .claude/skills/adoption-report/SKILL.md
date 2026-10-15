---
name: adoption-report
description: Weekly report on download, install and clone trends for Rhizomatics projects across npm, PyPI, GHCR (Docker), HACS/Home Assistant analytics and GitHub.
context: fork
agent: marketing
---

# Weekly adoption report

Data comes from the daily snapshots in `hq-private/data/stats/YYYY-MM-DD.json` written by
`hq-private/scripts/collect_stats.py` (run by CI). If today's snapshot is missing, run the script first.

## Compute (this week vs last week, and vs 4-week average)

- **GitHub**: stars/forks delta; views and clones summed by unique date across snapshots (traffic
  arrays overlap — de-duplicate on `timestamp`); unique visitors.
- **npm**: `last_week` per package (SignalK plugins; npm downloads ≈ SignalK app store installs + CI).
- **PyPI**: `last_week`.
- **GHCR**: delta of `total` between snapshots ≈ pulls this week.
- **Home Assistant**: `ha_installs` (active installs reporting analytics; a real-user floor) and
  week delta. **HACS**: delta of `release_assets[*][hacs_zip]` download counts ≈ HACS installs/updates.

Write a small throwaway script in the scratchpad if that's easier than reasoning over JSON by eye;
if it proves stable, propose adding it to `hq-private/scripts/`.

## Output

`hq-private/reports/adoption/YYYY-Www.md`:

1. Three-line headline: what moved and why (link to releases in the window — `gh release list`).
2. Per family (HA integrations, SignalK plugins, MQTT services, other) a table:
   `Project | Real-use signal | Δ wk | Downloads/pulls | Δ wk | Clones (uniq) | Stars Δ`.
3. Anomalies (spikes from CI, mirrors, a blog/forum mention — check referrers with
   `gh api repos/rhizomatics/<repo>/traffic/popular/referrers`).
4. Up to three suggested actions (release post, README fix, forum reply…). Each one the maintainer
   must do or approve is an hq issue (labels `adoption` + area) linking back here, per "Issues and
   PRs" in `CLAUDE.md`; list the issue links, not just the suggestions.

Where history is shorter than a comparison window, say so rather than guessing.
