---
summary: Report and validate platform view of product health
productline: signalk
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

- [ ] @agent hq-stats: collect each Home Assistant integration's declared quality scale level and the level its
      `quality_scale.yaml` adds up to, into the snapshots and `stats.json`; HQ's catalogue reads it from there
      and `build-design.mjs` stops reading manifests
- [ ] @agent hq-stats: collect SignalK plugin registry `score`, `badges` and `testStatus` the same way
- [ ] @pair Targets per product line, overridable per product (in `products.toml`), and a check that warns when
      a product's declared level or score misses its target or disagrees with its own assessment
