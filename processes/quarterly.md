# Quarterly

Each quarterly review owns a different month of the quarter, and the rolling ones spread their
results over about a week.

## Jan / Apr / Jul / Oct — Docs review — `/docs-review`
- **Who:** tech-writer
- **When:** daily on the 1st–14th; each run reviews the next batch until all products are done
- **Output:** `hq-private/reports/docs-review/YYYY-Qn/<repo>.md`
- Readability, accessibility and fidelity to the code.

## Feb / May / Aug / Nov — Architecture review — `/architecture-review`
- **Who:** architect
- **When:** daily on the 1st–14th, rolling like the docs review
- **Output:** `hq-private/reports/architecture-review/YYYY-Qn/` (`_platform-changes.md` plus one file per product)
- Conformance with the Home Assistant / SignalK architecture, HA Quality Scale (code, level, and
  changes to the scale), MQTT discovery for MQTT services.

## Mar / Jun / Sep / Dec — Roadmap review — `/roadmap-review`
- **Who:** pm
- **When:** 10th
- **Output:** `hq-private/reports/roadmaps/YYYY-Qn.md`
- Roadmap items done, obsoleted, or needing reprioritising, for every product that has a roadmap.
