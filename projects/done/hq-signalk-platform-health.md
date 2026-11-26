---
summary: Report and validate platform view of product health
productline: hq
labels: signalk
---
# SignalK Platform Health

`hq-stats` could pull in the score and badges for plugins owned by the HQ, and support validation of health as reported by the platform itself. 

This would give notice where rules had changed, or processes failed. Its likely something similar will end up for Home Assistant Marketplace

Ideas

- Set a target score per product line, overridable by product
  - Validate the score calculated by SignalK matches this
  - Report score on product catalog
- Likewise have target want/not-want badges
  - not want
    - `no-plugin-ci`
  - wants
    - `tested`, `compatible`
- Validate also `testStatus`

## Example Plugin Registry Data
```json
  "name": "@rhizomatics/signalk-bluetti-plugin",
      "scope": "rhizomatics",
      "keywords": [
        "battery",
        "ble",
        "bluetooth",
        "bluetti",
        "electrical",
        "gatt",
        "generator",
        "marine",
        "signalk",
        "signalk-node-plugin",
        "solar"
      ],
      "version": "2.2.3",
      "published": "2026-11-08T22:27:14.785Z",
      "official": false,
      "webapp": false,
      "categories": [
        "Hardware Support"
      ],
      "score": 100,
      "badges": [
        "compatible",
        "loads",
        "activates",
        "tested",
        "npm-audit-ok",
        "has-changelog",
        "has-screenshots"
      ],
      "testStatus": "passing",
      "npmUrl": "https://www.npmjs.com/package/@rhizomatics/signalk-bluetti-plugin",
      "sourceUrl": "https://github.com/rhizomatics/signalk-bluetti-plugin"
    }

```
## Related: Home Assistant quality scale (2026-11-25)

The Home Assistant side has a first version, which this could follow:

- The product catalogue shows each integration's Integration Quality Scale level (a column on `/products/` and a
  badge on its page), read at build time from the `quality_scale` its `manifest.json` declares, by
  `site/scripts/build-design.mjs`. The SignalK equivalent would read `score`, `badges` and `testStatus` from the
  plugin registry in the same place.
- Validation is already worth having there: comparing each declared level with what its own
  `quality_scale.yaml` adds up to (the highest tier whose rules, per hassfest's list, are all done or exempt)
  found supernotify declaring Silver while a Bronze rule (`action-setup`) is still `todo`. The same check, as a
  `check-hq`-style warning or in the architecture review, would cover "notice where rules had changed".
- Placement (decided 2026-11-25): platform scores are stats, so the code goes in `hq-stats`, collected into its
  snapshots and `stats.json` like downloads; HQ keeps only the data and config (targets per line or product).
  The Home Assistant level read by HQ's `build-design.mjs` moves there too, and HQ's pages then read it from
  `stats.json`.

## Tasks

- [x] @agent hq-stats: collect each Home Assistant integration's declared quality scale level and the level its
      `quality_scale.yaml` adds up to, into the snapshots and `stats.json`; HQ's catalogue reads it from there
      and `build-design.mjs` stops reading manifests ([hq-stats#10](https://github.com/rhizomatics/hq-stats/pull/10),
      HQ branch `platform-health`)
- [x] @agent hq-stats: collect SignalK plugin registry `score`, `badges` and `testStatus` the same way (same PR)
- [x] @human Release hq-stats 0.4.0; then @agent bump HQ's site to it and open the `platform-health` PR
      ([hq#23](https://github.com/rhizomatics/hq/pull/23))
- [x] @pair Targets per product line, overridable per product (in `products.toml`), and a check that warns when
      a product's declared level or score misses its target or disagrees with its own assessment (2026-11-26:
      targets in `hass-alignment.md` and `signalk-alignment.md` instead; checked by the monthly alignment review)

## What else HQ scans itself

Listed, with where each belongs, in [HQ data from hq-stats](../proposed/hq-data-from-stats.md) (part of the HQ as
a product programme).

## Log

- 2026-11-25: Started. hq-stats 0.4.0 (hq-stats#10) collects Home Assistant quality scale (declared, and what each
  `quality_scale.yaml` adds up to per hassfest's rule list) and the SignalK plugin registry's score, badges, tests
  and plugin-ci, as `health` per product, without GitHub API calls. HQ's catalogue reads it (branch
  `platform-health`, waiting for the release). First figures: supernotify declares Silver but its assessment
  doesn't reach Bronze (`action-setup`); homeassistant-repl declares none (`runtime-data` short of Bronze); both
  being fixed. SignalK: 100 for three plugins, 95 for three (no screenshots), 75 for datalab (tests not runnable)
  and boat-tech-directory (no plugin-ci). Listed what else HQ scans itself and where it belongs.
- 2026-11-25: supernotify fixed `action-setup` (declares Silver, assessment Silver) and homeassistant-repl now
  declares Bronze (assessment Bronze; Silver needs `test-coverage`). README badge for homeassistant-repl on branch
  `quality-scale-badge` (PR to open once GitHub recovers); supernotify#343's Silver badge now holds. The moves of
  other HQ scanning into hq-stats are a separate project.
- 2026-11-25: hq-stats 0.4.0 released; HQ's catalogue reads ratings from it in hq#23. All six Home Assistant
  integrations now declare the level their own assessment supports (supernotify moved to Platinum,
  homeassistant-repl to Bronze), each with its README badge. Ratings start with the next daily collection.
- 2026-11-26: done. The maintainer put the goals in policy: Home Assistant integrations Silver or better from
  v1.0.0, aiming for Platinum; SignalK plugins at registry score 100 from v1.0.0. The monthly alignment review
  (step 2a) checks each product from hq-stats' `health`: goal met (declared and assessed levels agree), not
  slipped against a month earlier, the quality scale rule lists and registry checks kept up with, and cheap moves
  to the next level. The first collection under hq-stats 0.4.0 ran today with ratings for all 14 products;
  homeassistant-repl's assessment is now Platinum.
