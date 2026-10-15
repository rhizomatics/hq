---
name: docs-review
description: Quarterly rolling documentation review of each Rhizomatics product for readability, accessibility and fidelity to the code. Runs daily during the review window and reviews only the next small batch of products each run.
context: fork
agent: tech-writer
---

# Quarterly rolling docs review

The review window is the 1st–14th of January, April, July and October; this skill is
scheduled daily then. Each run reviews **one batch**, so results arrive spread over about
a week instead of all at once.

## Pick today's batch

1. Quarter folder: `hq-private/reports/docs-review/YYYY-Qn/`. Products in scope: repos in `repos.toml` with
   user-facing docs (skip `family = "meta"`).
2. Already reviewed this quarter = files in that folder. Nothing left → write nothing and stop.
3. Batch size = ceil(remaining products / 5), max 4. Order: products with the most support
   traffic in the last quarter first (from `hq-private/reports/support-review/`), then the rest alphabetically.

## Review each product

Read the docs source from the attached repo (`docs/`, README, `properdocs.yml`/`zensical.toml`
nav) and the published site at the repo's CNAME with WebFetch. Don't install packages or build the
site; the routine's environment isn't set up for it.

- **Fidelity to the code** — every config option, default, type, service/action, entity, MQTT
  topic, CLI flag and plugin setting in the docs exists in the code with that name and default,
  and vice versa (undocumented options). Examples are valid against the current schema. Version
  numbers and minimum HA/SignalK versions are current. This is the most important check; cite
  file:line for each mismatch.
- **Readability** — clear first page (what it is, who it's for, install in < 5 steps); task-oriented
  structure; jargon explained; troubleshooting section exists; translated READMEs not badly out of
  date with the English one.
- **Accessibility** — image alt text, heading hierarchy, link text that makes sense out of
  context, no information only in images or colour, code blocks marked with a language,
  contrast of any custom theme.

## Output

One file per product: `hq-private/reports/docs-review/YYYY-Qn/<repo>.md`, with findings in three sections,
each tagged severity (wrong / missing / polish) and with the concrete fix (the corrected text or
example). Compare with the same product's file from last quarter if present.

Fix `wrong` and `missing` findings as a docs PR in the product repo where an agent can, linking
this report. File an hq issue (labels `docs` + area, one per product) only for findings that need
the maintainer's decision or knowledge, per "Issues and PRs" in `CLAUDE.md`.
