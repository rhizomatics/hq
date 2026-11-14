# Quarterly

Four reviews, each run every four months in its own month, so one lands each month. The rolling ones spread their results over about a week.

## Jan / May / Sep — Docs review — `/docs-review`
- **Who:** tech-writer
- **When:** daily on the 1st–14th; each run reviews the next batch until all products are done
- **Report:** public
- Readability, accessibility and fidelity to the code.

## Feb / Jun / Oct — Architecture review — `/architecture-review`
- **Who:** architect
- **When:** daily on the 1st–14th, rolling like the docs review
- **Output:** `hq-private/reports/architecture-review/YYYY-Qn/` (`_platform-changes.md` plus one file per product)
- **Report:** private by exception
- Conformance with the Home Assistant / SignalK architecture, HA Quality Scale (code, level, and changes to the scale), MQTT discovery for MQTT services.

## Mar / Jul / Nov — Roadmap review — `/roadmap-review`
- **Who:** pm
- **When:** 10th
- **Report:** public
- Roadmap items done, obsoleted, or needing reprioritising, for every product that has a roadmap.


## Apr / Aug / Dec - Policy Review - `/policy-review`
- **Who:** pm
- **When:** 10th
- **Output:** a PR on `hq` with policy and process changes, review requested from `jeyrb`; decisions only the maintainer can make in one hq issue (`alignment`, `org`)
- **Report:** public
- Review HQ policies and processes for consistency, gaps and missed opportunities, and check policies against the repos where that's cheap (GitHub settings, design docs, releases).
