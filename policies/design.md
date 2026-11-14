# Design

Design documents live in each product repo under `docs/developer/design/`, so they're public and versioned with the code.
They're checked by HQ processes: RFCs by the weekly project review, roadmaps by the roadmap review. The
[Design Process](https://hq.rhizomatics.org.uk/design/) page on the HQ site lists them for every product.

## RFC Process

Major changes, such as new features and extensive refactoring, will be planned using Request for Comment (RFC) documents, stored in `docs/developer/design/rfcs/`, one file per RFC named `NNNN-short_title.md`.

Exception: `supernotify` keeps its RFCs in `docs/developer/rfcs/`.

RFCs *may* be accompanied by a GitHub discussion, where there's a likelihood of someone noticing and contributing.

RFCs start as `draft`, then move to `ready for review` and `in progress`, and end as `complete`, `partially complete` or
`cancelled`. A superseded RFC is `cancelled`, naming the one that replaced it.

The status goes near the top of the file, on its own line or as a table row, followed by any detail:

```markdown
**Status**: in progress, phases 0 and 1 released in 1.18.0
**Created**: 2026-11-14
```

The HQ site's [RFCs page](https://hq.rhizomatics.org.uk/rfcs/) reads these lines, so an RFC with no status line is listed as a draft.

## Design Principles

A `design_principles.md` in `docs/developer/design/` will be used for major projects (see `project_standards.md`) to state the overall principles, including scope, such as where something is expected in HomeAssistant/SignalK/some other plugin vs this one.

## Road Map

A `roadmap.md` in `docs/developer/design/` will be used to summarize anticipated major projects (which may not have an RFC yet) as well as smaller changes. It will be used rather than necessarily adding GitHub feature Issues every time.