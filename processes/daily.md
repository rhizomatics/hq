# Daily

## Stats snapshot
- **When:** 05:00 UTC
- **Who:** GitHub Actions (`hq-private/.github/workflows/collect-stats.yml`, `hq-private/scripts/collect_stats.py`)
- **Output:** `hq-private/data/stats/YYYY-MM-DD.json`
- Must stay daily: GitHub traffic data is only kept for 14 days.

## Dependabot sweep — `/dependabot-sweep`
- **Who:** infra-lead
- **Output:** `hq-private/reports/dependabot/YYYY-MM-DD.md`
- Merges trusted bumps (GitHub-owned, hassfest/HACS and `rhizomatics/.github` actions; Astral and
  oxc tooling) once CI is green, never major versions; closes bumps of dependencies inherited from Home Assistant or
  SignalK. Standing approval from the maintainer; everything else waits for the PR report.

## Support sweep — `/support-sweep`
- **Who:** pm
- **Output:** `hq-private/reports/support-sweep/YYYY-MM-DD.md`
- Issues and discussions waiting on a maintainer reply, ranked, with draft replies.

## Security escalation — `/security-escalation`
- **Who:** infra-lead
- **Output:** `hq-private/reports/security/YYYY-MM-DD.md`
- **Escalates:** issue labelled `security-escalation` in `rhizomatics/hq-private`
- Excludes purely transitive vulnerabilities from Home Assistant / SignalK.

## Forum watch — `/forum-watch`
- **Who:** marketing
- **Output:** `hq-private/reports/forums/YYYY-MM-DD.md`
- Runs daily but only checks sources due by their own cadence (see `reference/*_discussion.md`).
  Ends with the manual checks due that day.
