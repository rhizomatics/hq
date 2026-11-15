# Daily

## Stats snapshot
- **When:** 05:00 UTC
- **Who:** GitHub Actions (`hq-private/.github/workflows/collect-stats.yml`, `hq-private/scripts/collect_stats.py`)
- **Output:** `hq-private/data/stats/YYYY-MM-DD.json`
- **Report:** private (raw data); its public aggregates feed the site's Usage pages
- Must stay daily: GitHub traffic data is only kept for 14 days.

## Site build
- **When:** 05:40 UTC, after the stats snapshot, and 17:40 UTC to refresh the Operations pages; also on any push that changes docs or `site/`
- **Who:** GitHub Actions (`.github/workflows/site.yml`)
- **Output:** the HQ site (`[org].site_url` in `repos.toml`) — docs, public reports and per-component usage
- **Report:** public (it is the site)

## Dependabot sweep — `/dependabot-sweep`
- **Who:** infra-lead
- **When:** 05:40 UTC
- **Output:** `hq-private/reports/dependabot/YYYY-MM-DD.md`
- **Report:** private by exception
- Merges trusted bumps (GitHub-owned, hassfest/HACS and `<org>/.github` actions; Astral and
  oxc tooling) once CI is green, never major versions; closes bumps of dependencies inherited from Home Assistant or
  SignalK. Standing approval from the maintainer; everything else waits for the PR report.

## Support sweep — `/support-sweep`
- **Who:** pm
- **When:** 06:00 UTC
- **Output:** `hq-private/reports/support-sweep/YYYY-MM-DD.md`
- **Report:** private
- Issues and discussions waiting on a maintainer reply, ranked, with draft replies.

## Security escalation — `/security-escalation`
- **Who:** infra-lead
- **When:** 06:20 UTC
- **Output:** `hq-private/reports/security/YYYY-MM-DD.md`
- **Report:** private
- **Escalates:** issue labelled `security-escalation` in `<org>/hq-private`
- Excludes purely transitive vulnerabilities from Home Assistant / SignalK.

## Forum watch — `/forum-watch`
- **Who:** marketing
- **When:** 06:40 UTC
- **Output:** `hq-private/reports/forums/YYYY-MM-DD.md`
- **Report:** private
- Runs daily but only checks sources due by their own cadence (see `reference/*_discussion.md`).
  Ends with the manual checks due that day.
