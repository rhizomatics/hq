---
summary: OpenSSF Scorecard and checks feeding the security and alignment reviews
---

# OpenSSF

Upgrade the HQ with OpenSSF Scorecard and checks, and use as input to the security and alignment reviews

## Decision: secret scanning and push protection (2026-10-14, raised by security-escalation)

- Finding: secret scanning and push protection are disabled on 10 public repos. Code scanning is also not set up on them.
  - signalk plugins: signalk-bluetti-plugin, signalk-datalab-plugin, signalk-delta-squelch-plugin, signalk-einklabel-genai-plugin, signalk-einklabel-plugin, signalk-teltonika-sms-plugin
  - other: agent-plugins, .github
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

- [x] @agent Add OpenSSF Scorecard to the security/alignment reviews (skills edited 2026-11-15)
- [x] @human Add the Scorecard workflow to the product repos (15 repos, 2026-11-15)
- [x] @pair Scorecard workflow on the remaining released repos: signalk-einklabel-genai, signalk-teltonika-sms,
  signalk-delta-squelch, signalk-ble-sensors, pico-ais-reporter, `.github` and `hq` (PRs merged 2026-11-16).
  agent-plugins has no releases, so it's left out; supernotify-cards is a community project, not ours
- [x] @agent Scorecard on the HQ site's Security page (2026-11-16), then removed the same day: scores are for the
  internal security and alignment reviews only. Accepted checks listed in `policies/project_standards.md`
- [x] @human Review and merge the Token-Permissions PRs (21 repos, branch `scorecard-token-permissions`): empty
  top-level permissions on the shared admin callers (template fixed in hq), release.yml writes moved to job level
  (supernotify, appliance_autonotify, camera_autonotify), Dependabot on the pico repos, a LICENSE in `.github`
- [x] @human Default workflow token to read-only, and decide on signed release zips (hq-private#116: both agreed)
- [x] @human Merge the five attestation PRs: [supernotify#333](https://github.com/rhizomatics/supernotify/pull/333), [autoarm#157](https://github.com/rhizomatics/autoarm/pull/157), [appliance_autonotify#61](https://github.com/rhizomatics/appliance_autonotify/pull/61), [camera_autonotify#32](https://github.com/rhizomatics/camera_autonotify/pull/32), [homeassistant-repl#43](https://github.com/rhizomatics/homeassistant-repl/pull/43) (remote_logger already attests; all five merged 2026-11-20)
- [x] @human Let routines reach `api.securityscorecards.dev` (cloud environment network), then @agent check the first results next monthly run; move to `done/` if they are useful (access granted
  2026-11-15 on hq-private#112; Scorecard is read by `/security-escalation` and `/alignment-review` from here on)

## Log

- 2026-10-16 — project-review: ticked the `paths-ignore` task (supernotify#281 merged). Secret-scanning work is complete; Scorecard itself not started.
- 2026-10-23 — project-review: still no Scorecard work; nothing else moved.
- 2026-10-30 — project-review: no Scorecard work for the third week running. Kept as `@agent` next step; see report for whether it is still worth having.
- 2026-11-06 — project-review: no Scorecard work for the fourth week; open security-alert issue #55 was closed 10-31, so the alerts excuse has gone. Still `@agent` next step.
- 2026-11-13 — project-review: fifth week with no Scorecard work and no agent has picked it up. Asked in hq-private issue whether to do it or shelve it.
- 2026-11-15 — project-review: maintainer said "do it" on hq-private#109 (11-13). `scorecard.yml` is now in 15 repos (added 11-15), and `/security-escalation` and `/alignment-review` read Scorecard results. Not yet run: the Scorecard API host is blocked in routines (WebFetch failed), so the first real results need it allowed or another route. Not yet in: signalk-delta-squelch, signalk-einklabel-genai, signalk-teltonika-sms, signalk-ble-sensors, supernotify-cards, agent-plugins (check whether each is in scope).
- 2026-11-16 — Scorecard added to every public repo with releases (7 PRs, all merged) and shown on the Security
  page. First results across 16 repos average about 6.5/10; weakest checks org-wide (median 0) are Code-Review (a solo
  maintainer's PRs aren't approved by anyone else), CII-Best-Practices, Fuzzing and Signed-Releases, then
  Branch-Protection and Contributors (median 3). Worth deciding which of those to act on rather than chasing the number.
- 2026-11-16 — Maintainer: scores off the public site, internal review only. Breakdown: Maintained 0 on five repos
  is Scorecard's rule for repos under 90 days old, not inactivity; Code-Review, Contributors and Branch-Protection
  are structural for one maintainer; Token-Permissions 0 came from top-level write grants in release.yml, and every
  repo warned on the shared admin callers having no top-level permissions (fixed in the template, PRs in 21 repos).
  Every repo's default Actions token is `write`. Signed-Releases applies only to the 6 HA repos with release zips;
  keyless Sigstore attestation in the existing release workflow adds no release friction (decision in hq-private#116).
- 2026-11-20 — project-review: token-permission PRs all merged (none open). Maintainer approved the default read-only token and attestations on hq-private#116 (11-17, 11-19); remote_logger already attests, and the other five zip workflows have PRs. zizmor, rolled out from hq v1.0.1, fails with `startup_failure` in every repo until `zizmorcore/zizmor-action@*` is allowed in org Actions settings (hq-private#125). The Scorecard API host is still unverified from routines.
- 2026-11-22 — Done, confirmed by the maintainer. The five attestation PRs merged 2026-11-20, so all six HA repos
  with release zips now attest. Routines can reach the Scorecard API (hq-private#112), and Scorecard results are now
  part of the security and alignment reviews.
