# Projects

One markdown file per project.

- `projects/*.md` — active projects.
- `projects/proposed/*.md` — ideas not started yet. Move the file up into `projects/` when work starts.
- `projects/done/*.md` — finished projects.
- `projects/shelved/*.md` — rejected or postponed indefinitely. Add a dated line saying why.

A project file starts as a title and a one-paragraph goal; add sections as the project needs them
(e.g. Done / Remaining, or Now / Soon / Distant). Larger projects with many steps or approval
gates can use the fuller shape, as `aws-migration.md` does:

```markdown
---
title: Short name
status: draft | active | blocked     # folder says proposed/done/shelved
lead: infra-lead | pm | marketing | architect   # persona that drives it
owner: jeyrb
started: YYYY-MM-DD
---

## Goal / ## Context / ## Plan (tagged tasks) / ## Decisions / ## Log
```

Tasks are checkboxes tagged with who executes them:

- `@agent` — an agent can do it unattended (read-only, or reversible and inside this repo)
- `@pair` — agent does the work, human reviews/approves before it takes effect
- `@human` — needs the human (console logins, payments, credentials, judgement calls)

`- [ ] @pair Write Terraform for the Route53 zones` · `- [x] @human Create AWS account (2026-10)`

When a task becomes real work, link it: an `@human` task gets an hq issue (labels `project` + area),
a `@pair` task gets the PR the agent built. See "Issues and PRs" in `CLAUDE.md`.

Rules for agents working a project: work the first unblocked task you're allowed to; never cross a
`@pair` gate without recorded approval in **Decisions**; add a **Log** entry each session; if
blocked, say on what (in frontmatter `status` if the file has it, otherwise in the Log).

## Index

### Active

| Project | Goal |
|---|---|
| [HQ](hq.md) | Run projects and keep products healthy from one hub |
| [AWS migration](aws-migration.md) | Move Rhizomatics infrastructure to its own AWS account |
| [OpenSSF](openssf.md) | OpenSSF Scorecard and checks feeding the security and alignment reviews |
| [De-YAMLification](deyamlification.md) | HA components with zero YAML, or a small power-user set |
| [Supernotify packages](supernotify_packages.md) | Auto-discovered notification packages on top of Supernotify |
| [Developer environment](dev-env.md) | Segregated hardware, software and cloud dev environment (depends on AWS migration) |

### Proposed

| Project | Goal |
|---|---|
| [Tankie](proposed/tankie.md) | Heating oil / offline fuel storage in HA, using the Energy features |

### Done

_None yet._

### Shelved

_None yet._
