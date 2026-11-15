---
name: release-digest
description: Daily summary of new releases across the org's products for the HQ site's Releases page — judges each release as an enhancement, a critical fix or maintenance, and writes a one or two line summary of what's significant for users.
context: fork
agent: marketing
---

# Daily release digest

Feeds the Releases page on the HQ site: the last month's releases with new features or critical fixes,
each summarised. A script finds the releases and builds the page; this skill only does the judging and
writing (`policies/scripts_over_agents.md`).

## Find what's new

From `hq/site`: `GITHUB_TOKEN=$(gh auth token) node scripts/build-releases.mjs --pending` lists, as JSON,
every release from the last 31 days of a public product that has no entry yet in
`hq-private/data/releases/summaries.json`. Most days it's empty or one or two: then stop, with nothing to
commit. Read each pending release's notes (`gh api repos/<org>/<repo>/releases/tags/<tag>`).

## Judge and summarise

Add one entry per pending release to `hq-private/data/releases/summaries.json`, keyed `<repo>@<tag>`:

```json
"supernotify@v2.18.0": { "include": true, "kind": "enhancement", "summary": "..." }
```

- **kind `enhancement`**, `include: true`: a new feature, new device or platform support, or a notable
  improvement users will notice.
- **kind `critical-fix`**, `include: true`: no enhancements, but a fix for something badly broken: it
  wouldn't start or install, gave wrong readings, lost or duplicated data, cost money (e.g. paid API calls),
  reported failure as success, or a security issue in the product's own code.
- **kind `maintenance`**, `include: false`: everything else, e.g. small fixes, docs, tests, dependency or CVE
  rebuilds, pre-releases (the final release gets its own entry), a package move. Give a few words of
  reason as the summary; it isn't shown.

Summaries: one or two sentences for a user of the product, in the house voice (practical, understated).
Say what they can now do or what's fixed, not how; name a breaking change or new minimum version in a
clause. Don't copy the release notes, list PRs, or mention CI, typing, tests or badges.

Never change an existing entry unless it's wrong; it's the record of what was shown.

## Output

Commit `hq-private/data/releases/summaries.json` and push to `main` with the message
`release-digest: <YYYY-MM-DD>`. No report. The site picks it up at its next build.
