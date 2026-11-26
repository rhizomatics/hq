# Daily

## Stats snapshot
- **When:** 04:23 UTC
- **Who:** GitHub Actions (`.github/workflows/collect-stats.yml`, running `hq-stats collect` from [@rhizomatics/hq-stats](https://github.com/rhizomatics/hq-stats))
- **Output:** `data/stats/YYYY-MM-DD.json` (public data only); the site's Usage pages are built from it
- **Report:** public (raw data)
- Must stay daily: GitHub traffic data is only kept for 14 days.

## Site build
- **When:** 00:40, 08:40 (after the stats snapshot) and 16:40 UTC, to refresh the Operations pages; also on any push that changes docs, data or `site/`
- **Who:** GitHub Actions (`.github/workflows/site.yml`)
- **Output:** the HQ site (`[org].site_url` in `hq.toml`) — docs, public reports and per-component usage
- **Report:** public (it is the site)

## Dependabot sweep — `/dependabot-sweep`
- **Who:** infra-lead
- **When:** 05:40 UTC
- **Routine:** `hq: daily infra-lead`
- **Output:** `hq-private/reports/dependabot/current.md`
- **Report:** private by exception; rolling
- Merges trusted bumps (GitHub-owned, hassfest/HACS and `<org>/hq` shared admin workflows; Astral and
  oxc tooling) once CI is green, never major versions; closes bumps of dependencies inherited from Home Assistant or
  SignalK. Standing approval from the maintainer; everything else waits for the PR report.

## Support sweep — `/support-sweep`
- **Who:** pm
- **When:** 06:00 UTC
- **Output:** `hq-private/reports/support-sweep/current.md`
- **Report:** private; rolling
- Issues and discussions waiting on a maintainer reply, ranked, with draft replies.

## Security escalation — `/security-escalation`
- **Who:** infra-lead
- **When:** 05:40 UTC, after the Dependabot sweep
- **Routine:** `hq: daily infra-lead`
- **Output:** `hq-private/reports/security/current.md`
- **Report:** private; rolling
- **Escalates:** issue labelled `security-escalation` in `<org>/hq-private`
- Excludes purely transitive vulnerabilities from Home Assistant / SignalK.

## Forum watch — `/forum-watch`
- **Who:** marketing
- **When:** 06:40 UTC
- **Routine:** `hq: daily marketing`
- **Output:** `hq-private/reports/forums/current.md`
- **Report:** private; rolling
- Runs daily but only checks sources due by their own cadence (see `reference/*_discussion.md`).
  Files one hq issue per thread worth replying to, never a standing one.

## Release digest — `/release-digest`
- **Who:** marketing
- **When:** 06:40 UTC, after forum watch
- **Routine:** `hq: daily marketing`
- **Output:** summaries in `hq-private/data/releases/summaries.json`, shown on the site's Releases page; the community
  blogs' saved feeds in `hq-private/data/community/feeds.json`, for the Community page
- **Report:** public (it is the site's Releases page)
- Judges each new release of a product as an enhancement, a critical fix or maintenance, and summarises what's
  significant. A script lists the releases and builds the page; most days there's nothing new.
