# OpenSSF

Upgrade the HQ with OpenSSF Scorecard and checks, and use as input to the security and alignment reviews

## Decision: secret scanning and push protection (2026-10-14, raised by security-escalation)

- Finding: secret scanning and push protection are disabled on 10 public repos. Code scanning is also not set up on them.
  - signalk plugins: signalk-bluetti-plugin, signalk-datalab-plugin, signalk-delta-squelch-plugin, signalk-einklabel-genai-plugin, signalk-einklabel-plugin, signalk-teltonika-sms-plugin
  - other: agent-plugins, awesome-mqtt, hacs-downloads, .github
- Proposal: enable secret scanning and push protection org-wide (free for public repos), and enable CodeQL default setup on the signalk plugins. Also add `paths-ignore` for generated docs HTML (see supernotify `docs/developer/diagrams/`).
- 2026-10-14 — **Approved and done (secret scanning + push protection).** Enabled on the 10 repos above plus
  supernotify, boat-tech-directory and signalk-cli, which had scanning but not push protection. All 20 public repos now
  have both. `hq` is private (needs paid GitHub Advanced Security), so it is not covered.
- Still open:
  - [x] @human Org default for new repos — 2026-10-14: code security configuration "Rhizomatics baseline"
    (secret scanning + push protection, dependency graph, Dependabot alerts; CodeQL `not_set`, unenforced) set as
    default for new public repos. Existing repos are not attached to it; their settings were set directly.
  - [x] @pair CodeQL default setup on the signalk plugins — 2026-10-14: enabled on all six; first alerts in hq-private#3.
  - [x] @pair `paths-ignore` for generated docs HTML (supernotify `docs/developer/diagrams/`) — PR rhizomatics/supernotify#281 merged 2026-10-14.

## Next

- [ ] @agent Add OpenSSF Scorecard to the security/alignment reviews (nothing started yet; the 2026-10-14 work was all secret scanning and CodeQL)

## Log

- 2026-10-16 — project-review: ticked the `paths-ignore` task (supernotify#281 merged). Secret-scanning work is complete; Scorecard itself not started.
- 2026-10-23 — project-review: still no Scorecard work; nothing else moved.
- 2026-10-30 — project-review: no Scorecard work for the third week running. Kept as `@agent` next step; see report for whether it is still worth having.
