# HQ Seed inventory

Every file in `hq` and `hq-private` sorted by where it goes in [HQ Seed](../projects/hq-seed.md), and what each
needs first. Taken 2026-11-23 from `git ls-files`, with mentions counted by regex (org or maintainer name; Home
Assistant/HACS; SignalK; Claude, `.claude`, routines, model names) and the files with mentions then read.
Generated and data files (`data/`, `site/src/content/`, images) are left out. Counts are a guide to the work,
not exact: "HA" matches some prose that isn't about the platform.

**Destinations:** **core** (every HQ), **module** (`python`, `node`, `github-actions`, `homeassistant`,
`signalk`, chosen per HQ), **instance** (Rhizomatics only, stays in `hq`), **private** (optional private-repo
skeleton), **agent-specific** (not in the seed: Claude Code reads `AGENTS.md`, and scheduling is the instance's own).
Layout, agents and modules were decided on 2026-11-23 ([HQ Seed](../projects/hq-seed.md#decisions)).

## Summary

- **144 files in `hq`** once data, generated pages and images are left out. Most of the core needs only small
  edits; `hq-private` gives the seed three files and the rest is instance.
- **Org names are cheap.** Mostly comments, plus a few real values: the admin callers pin
  `rhizomatics/hq/...@<sha>`, `reusable-auto-assign.yml` defaults to `jeyrb`, `reusable-labels.yml` checks out
  `rhizomatics/hq`, and `sync-admin.sh` matches `github.com/rhizomatics/`. All can read `repos.toml` `[org]`.
- **Platform names are the bulk of the core work**: 20 core files mention them, mostly as examples or
  module-shaped sections (below).
- **Agent specifics go deeper than the 2026-11-15 count suggested.** The layout itself is Claude's
  (`.claude/agents/`, `.claude/skills/`), and `check-hq` (`site/scripts/lib/hq-docs.mjs`), `AGENTS.md`,
  `processes/README.md` and `team.md` all name those paths. Skills carry Claude Code frontmatter (`context: fork`,
  `agent: <persona>` in all 18). Scheduling is written as Claude Code cloud routines throughout (process docs,
  the policy review's routine audit, `**Routine:**` lines). Decided: move to `team/` and `skills/` with neutral
  frontmatter, and keep scheduling out of the seed.

## hq

### Core

| Files | Needs |
| --- | --- |
| `AGENTS.md` | platform names out of the terms section (examples can move to modules); `.claude/` paths → `team/` and `skills/`; Claude scheduling notes out |
| `team.md` | `.claude/agents` wording → neutral |
| `projects/README.md`, `processes/README.md`, `processes/weekly.md`, `processes/fortnightly.md` | `processes/README.md`: routines, models and the cloud environment (25 mentions) → out of the seed; the rest is neutral |
| `processes/daily.md`, `monthly.md`, `quarterly.md` | platform processes' entries move to modules; `**Routine:**` lines → out of the seed |
| Team: `pm`, `infra-lead`, `researcher` | path wording only |
| Team: `architect`, `marketing`, `tech-writer` | platform names (1–3 each) → "the platforms in `repos.toml`" |
| Skills with no platform content: `support-sweep`, `support-review`, `pr-report`, `release-digest`, `registry-check`, `project-review`, `roadmap-review`, `docs-review`, `alignment-review` | frontmatter → neutral; `registry-check` checks routines' attached repos (→ out of the seed) |
| Skills with platform examples: `adoption-report` (HACS, HA analytics), `github-review`, `reputation-review` (also names the org), `agent-accessibility-review`, `forum-watch` | examples out; forum sources and platform channels read from modules |
| `policy-review` | its "Cloud routines" section (19 mentions) → out of the seed; the rest core |
| `policies/README.md`, `policies/scripts_over_agents.md` | none beyond one SignalK example |
| `repos.toml` | split: schema header and `[org]`/`[families]`/`[labels]`/`[capabilities]` shape → skeleton; `[repos]`, `[community]`, `security_watch` entries → instance |
| `admin/` (README, `labels.yml`, `sync-admin.sh`, `templates/`), `.github/workflows/reusable-*.yml` | org and pinned ref from `[org]` and the instance's own latest release; `templates/hass-github/` → `homeassistant` |
| `site/` (config, `scripts/`, `src/`), `mise.toml`, `.pre-commit-config.yaml`, `.gitignore`, `site/.gitignore` | `hq-docs.mjs` paths and routine checks (21 mentions) → `team/` and `skills/`, routine checks dropped; home page and branding → placeholders; `design.astro` has one example of each platform. `@rhizomatics/hq-stats` and its npm cooldown exemption stay as a dependency, not an instance detail |
| `.github/workflows/site.yml`, `collect-stats.yml` | org from config |

### Modules

| Module | Files |
| --- | --- |
| python | `policies/python_stack.md`, `policies/python_versions.md` (its Home Assistant tie goes to `homeassistant`), Python parts of `project_standards.md`, `admin/templates/python/` |
| node | Node parts of `project_standards.md` (npm cooldown), `admin/templates/node/` |
| github-actions | `policies/release_workflows.md` (15 platform mentions, to their modules), `.github/zizmor.yml`, the zizmor and Dependabot automerge parts of `admin/` |
| homeassistant | `policies/hass-alignment.md`, `reference/hass_discussion.md`, `reference/hass_platform_changes.md`, `admin/templates/hass-github/` |
| signalk | `policies/signalk-alignment.md`, `policies/signalk_versions.md`, `reference/signalk_discussion.md` |
| both (one section each) | `reference/topic_terms.md` (per product, so instance content in a module's shape) |
| skills, split into a core frame and per-module sections | `architecture-review` (quality scale, platform architecture), `platform-review`, `security-escalation` (`security_watch`, inherited-dependency rules; 20 platform mentions), `dependabot-sweep` (dependencies inherited from the platform; 16) |

### Core policies, and what's left to place

Core: `policies/README.md`, `scripts_over_agents.md`, `project_standards.md` once its Python, Node and Home
Assistant parts move to their modules (its "Claude Code settings" section is agent-specific). Still to place:
`release.md`, `build.md`, `docs_toolchain.md` (candidate `docs` module), `design.md`, `branding.md`, `products.md`
(names Rhizomatics' sites) and `.github/dependabot.yml`. Every copied-in policy gets `seed: review` by default.

### Instance (stays in hq)

`projects/` (all but the README), `CHANGELOG.md`, `README.md`, `LICENSE` (the seed gets its own), `branding/`,
`assets/`, `data/`, the admin callers in `.github/workflows/admin-*.yml`, `scorecard.yml`, and in `reference/`:
`cloud-access-probe.md`, `project_tooling.md`, `github_actions.md`. `reference/skill_providers.md` is evidence about
the product, so it moves to `hq-seed`'s own docs rather than into what's seeded.

## hq-private

- **Private skeleton:** `scripts/collect_github.py` with `.github/workflows/collect-github.yml`, and
  `.github/workflows/notify-assignee.yml`. Both read the org from config already, apart from comments.
- **Agent-specific:** `.github/workflows/claude.yml`, `.claude-plugin/`, `CLAUDE.md`.
- **Instance:** everything else: reports, data, private reference notes, the maintainer's own commands and
  scripts, and a diagnostics plugin.

## Decided

The questions this inventory raised were settled by the maintainer on 2026-11-23: `team/` (with the maintainer
role) and `skills/` at the root; `AGENTS.md` only (Claude Code 2.1.277 or later); scheduling out of the seed;
modules with `seed:` policy settings and a fortnightly seed review. Details in [HQ Seed](../projects/hq-seed.md#design).
