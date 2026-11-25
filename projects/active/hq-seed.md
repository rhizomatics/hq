---
title: HQ Seed
summary: The repo anyone seeds their own HQ from, and keeps taking improvements from without losing their changes
status: active
lead: architect
owner: jeyrb
programme: hq-as-product
started: 2026-11-23
---

## Goal

A public repo, `<org>/hq-seed`, that someone starts their own HQ from in one sitting, and that keeps improving
after they've started. Each HQ records which seed version it came from, so its own agents can take later seed
releases, keep the local changes that matter and offer good ones back. Rhizomatics' own `hq` is an instance of
it like any other.

This is the delivery vehicle for [HQ as a product](hq-as-product.md): that project holds the wider design (providers,
community, agent neutrality) and the launch; this one builds the seed and the update path.

## Context

- **Why now (2026-11-23):** [HQ Stats](../done/hq-stats.md) has known outside users, the low-friction way in has worked,
  and they're the first people to offer a full HQ to.
- **What a seed holds** (from the HQ as a product design): the core (project and process model, issue and PR
  conventions, personas, the core skills and policies, `check-hq`, the site with HQ Stats), the `homeassistant` and
  `signalk` modules, and an optional private-repo skeleton (`collect_github.py`, `notify-assignee.yml`). It holds no
  Rhizomatics content: no projects, reports, data, or `[repos]` entries.
- **Coupling is light** (2026-11-15 count): org name and maintainer are already config (`repos.toml` `[org]`);
  four skills are platform-specific and become module content. Platform names in core files are the main
  extraction work.
- **Products and product lines** ([Product Catalogue](hq-product-catalog.md)): the seed's `repos.toml` skeleton
  is the schema every HQ inherits, so how it defines a product and a product line should be settled before the
  seed's first release; changing it afterwards means a migration in every instance. Today `family` does three jobs:
  the product line heading on the site, the hq issue area, and in effect the platform. Modules are chosen by
  platform and technology (`upstream`, a `pyproject.toml`), not by family, so the seed needs those kept apart.
- **Provenance, not a template copy:** a template drifts from day one. The seed records per file whether it is
  `upstream` (unchanged), `modified` or `local`, against the seed version it came from (`hq.lock`), so an update
  is a three-way comparison rather than guesswork.

## Design

### Shape (decided 2026-11-23)

**A plain git repo with semver release tags**: no package, and nothing specific to one agent in the seed itself.

- **Why not npm, like HQ Stats:** skills, team roles and policies are meant to be edited in place by the user's
  agents, which a package hides in `node_modules`. Code that runs unchanged (the site scripts, `check-hq`) can move
  into a package later if it proves worth it.
- **Why not a Claude plugin:** ties the seed to one agent. A plugin listing can point at the seed later.

### Layout (decided 2026-11-23)

- `AGENTS.md`: the one instruction file. It says where the team and skills are, so any agent that reads
  `AGENTS.md` can run the HQ.
- `team/<role>.md`: one file per role, including the human **maintainer** role (what only they decide, approve or
  do, and how agents reach them), and `team/README.md` for how the roles fit together (today's `team.md`).
- `skills/<name>/SKILL.md`: the open skill format. Frontmatter: `name`, `description`, a neutral `role:` naming the
  team member who runs it, and Claude Code's `agent:` (the same role) and `context: fork`, which other agents
  ignore (decided 2026-11-23). `check-hq` checks `agent:` matches `role:`.
- `processes/`: cadence entries say **when** and **who**, never how they're scheduled.
- `modules/`: see below.

### Agents (decided 2026-11-23)

No adapters in the seed. **Claude Code 2.1.277 or later** is required: it reads `AGENTS.md` itself, and the README
says so. Older versions aren't catered for (decided 2026-11-23). An instance that adds a `CLAUDE.md` of its own
should know Claude Code then follows `CLAUDE.md` rather than `AGENTS.md`.

**Tested 2026-11-23 on Claude Code 2.1.327** (headless, fresh repo; the 2.1.277 minimum wasn't tested):

- `AGENTS.md` is loaded as project instructions with no `CLAUDE.md`.
- Skills are discovered only in `.claude/skills/`, roles only in `.claude/agents/`. `skills/`, `.agents/skills/`
  and `team/` are ignored, even with `AGENTS.md` pointing at them: Claude then reads a skill as a file when told
  to, but `/skill-name`, automatic use by description and running a role as a subagent (with its own model, as
  the researcher does) are lost.
- Symlinks fix it: `.claude/skills -> ../skills` and one link per AI role, `.claude/agents/<role>.md ->
  ../../team/<role>.md` (per file, so `team/maintainer.md` and `team/README.md` don't become agent types). Both are
  then discovered. Symlinks survive git, so cloud routines see them too.
- Instance set-up therefore makes those links (`/hq-init`, recorded as `local` in `hq.lock`); the seed holds no
  `.claude/`. A check in `check-hq` can confirm each AI role has its link when `.claude/` exists.
- Testing note: neither `CLAUDE.md` nor `AGENTS.md` was loaded in a repo under the system temp directory; the same
  repo under the home directory loaded both. Test seeds outside temp directories.
Other agents that read `AGENTS.md` work the same way; one is called supported only once it has run an HQ end to end.

How processes get run is the instance's own choice and stays out of the seed's process files: Claude Code
routines, GitHub Actions cron, plain cron. The seed's scheduling docs list the options, with this note on GitHub
Actions cron:

> GitHub's scheduled workflows are best effort. Runs start late under load (often minutes, sometimes an hour or
> more, worst at the top of the hour), can be skipped altogether, run only from the default branch, and are
> disabled automatically in a public repo after 60 days with no activity in it. Schedule off the hour, make each
> process cover the time since its last successful run rather than a fixed window, and have anything that must
> happen daily notice a missed day.

### Modules (decided 2026-11-23)

The seed is a core plus **modules**, one per technology or platform: `python`, `node`, `github-actions`,
`homeassistant`, `signalk` to start (candidates found in the inventory: `docs`, `containers`; planned: `secrets`, from
[environment separation](env-separation.md)). This supersedes
"platform packs" and the earlier "no language modules" in the HQ as a product design. Each module holds:

- its default policies (e.g. `python`: the Python stack and versions; `homeassistant`: platform alignment and
  the HA-tied Python versions);
- whatever it adds to processes and skills: whole skills and cadence entries (e.g. `homeassistant`'s
  architecture review against the quality scale), and sections for core skills (e.g. its forum sources for forum
  watch, its inherited dependencies for the Dependabot sweep, its advisories for security escalation);
- reference material (forums to watch, platform changes) and admin templates (e.g. `homeassistant`'s
  Dependabot config);
- a `module.toml`: description, version, and what makes it relevant (a `pyproject.toml` in a repo, an
  `upstream` in `repos.toml`), so an agent can choose.

**Set-up:** the owner picks the modules, or more likely their agent does from the org's repos, and `/hq-init`
builds them into the new HQ: policies and reference copied in, skills and cadence entries added, sections inserted
into core skills between `<!-- module:<name> -->` markers so a later update can replace a module's section
without touching local text. `hq.lock` records the seed version, the modules chosen and their versions.

**Policy front matter** says how each copied-in policy follows the seed, as `seed:`:

- `review` (the default): changes in the seed are proposed by the seed review and decided by the owner;
- `auto`: changes in the seed are taken as they come (still as a PR, never pushed straight to `main`);
- `diverged`: permanently the instance's own; the seed review skips it.

### Seed review (decided 2026-11-23)

A default **fortnightly** process in every HQ, replacing the `/hq-update` of the first plan. It compares the
instance with the latest seed release and recommends what to adopt:

- changes to the core and to the modules in use, per file a three-way comparison against `hq.lock` (base, new
  seed, local copy), following each policy's `seed:` setting;
- new modules, or modules not yet chosen that have become relevant (a repo that now has a `pyproject.toml`);
- local changes worth offering back, as a draft PR on `hq-seed`.

Likely fits arrive as **PRs** (one per module or theme); anything uncertain, contested or a judgement call as an
**issue** for the owner. Nothing is merged by the review.

### Where changes are made

Once `hq` consumes the seed, a change that belongs in every HQ is made in `hq-seed` first and reaches `hq` through
the seed review, the same path as everyone else's. Changes only Rhizomatics needs stay in `hq` as `local`, or as
`diverged` policies. Until then, `hq` stays the place work happens and the seed is extracted from it.

### Contents

| Part | From | Notes |
| --- | --- | --- |
| `AGENTS.md`, `team/` (with the maintainer role), `processes/`, `projects/README.md`, core `policies/` | `hq` | names roles, never the org; platform names out |
| Core skills (`skills/`) | `hq` (`.claude/skills`) | neutral frontmatter, module markers |
| `repos.toml` skeleton, `check-hq`, site with HQ Stats | `hq` | the site's home page and branding become placeholders |
| Shared admin workflows (`admin/`, `reusable-*.yml`) | `hq` | callers point at the instance's own `hq`, not Rhizomatics' |
| `modules/<name>/` | `hq` | policies, skills and sections, reference, templates; per-file sorting in the [inventory](../../reference/hq_seed_inventory.md) |
| Private skeleton: `private/` | `hq-private` | optional; omitted for an all-public HQ |

## Plan

### Phase 1: shape

- [x] @agent Inventory every file in `hq` and `hq-private`: core, module, instance-only or private skeleton, and what
      each needs before it can be seeded (2026-11-23, [HQ Seed inventory](../../reference/hq_seed_inventory.md))
- [x] @pair Decide the shape and update mechanism (2026-11-23: plain git repo, tags, `hq.lock`; no package, no agent specifics)
- [x] @pair Decide the questions the inventory raised (2026-11-23: `team/` and `skills/`, `AGENTS.md` only, scheduling
      out of the seed, modules with `seed:` policy settings and a fortnightly seed review)
- [x] @agent Check what Claude Code picks up from a neutral layout (2026-11-23, on 2.1.327: `AGENTS.md` yes;
      `skills/` and `team/` only through symlinks from `.claude/`; see [Agents](#agents-decided-2026-11-23))
- [x] @pair Skill frontmatter (2026-11-23: keep `agent:` and `context: fork` beside `role:`)
- [ ] @pair `repos.toml` schema for products and product lines, settled with the [Product Catalogue](hq-product-catalog.md)
      project: product line, issue area and platform as separate fields, `[families]` migrated
- [ ] @pair Formats: `hq.lock`, `module.toml`, the module markers in skills, the `seed:` policy setting; `check-hq` validates them
- [ ] @human Create the public `<org>/hq-seed` repo

### Phase 2: build

- [ ] @pair Move `hq` to the neutral layout first (`team/`, `skills/`, the maintainer role, `AGENTS.md` without
      `.claude/` paths, `CLAUDE.md` kept only as hq's own Claude notes, importing `AGENTS.md`); `hq` runs unchanged
- [ ] @pair Split skills, policies and reference into core and modules (`python`, `node`, `github-actions`,
      `homeassistant`, `signalk`); done when core files name no platform (moved from HQ as a product, Phase 2)
- [ ] @pair Extract core and modules into `hq-seed`, with placeholders where Rhizomatics content was; `check-hq`
      passes on the bare seed and on a seed with every module
- [ ] @pair Private-repo skeleton, optional at seed time
- [ ] @pair `/hq-init`: picks modules from the org's repos (owner confirms), builds them in, drafts `repos.toml`,
      writes `hq.lock`
- [ ] @pair Seed review: fortnightly process and skill, in the core; PRs for likely fits, issues for the rest,
      draft PRs upstream
- [ ] @pair Scheduling docs: the options per agent and runner, with the GitHub Actions cron note
- [ ] @pair Release process for the seed: semver tags, changelog with upgrade notes per module

### Phase 3: dogfood and first users

- [ ] @pair Rhizomatics `hq` records `hq.lock` against the first seed release; first seed review run on it
- [ ] @agent Seed a throwaway org end to end from the README; fix whatever needed hand edits
- [ ] @human Offer it to one HQ Stats user; they seed an HQ and take one update

## Success test

Rhizomatics `hq` and at least one outside HQ both take a seed release through the seed review without hand edits
beyond the judgement calls it raises, within 3 months of the first release.

## Decisions

Decided:

- 2026-11-23 — Started by the maintainer as its own project, `hq-seed`: the seed for anyone wanting their own HQ,
  and the ongoing improved seed they choose to update from. Takes over Phase 3 of HQ as a product (product repo,
  seed skill, instance alignment review, throwaway seed) and the core/pack split from its Phase 2.

- 2026-11-23 — Shape: a plain git repo with release tags, no package, and no agent specifics in the seed. Why:
  users' agents edit the files in place, and the seed must work for any agent. Agent-specific files (Claude's
  `.claude/`, `CLAUDE.md`, routines) are not seed content.

- 2026-11-23 — The inventory's questions, by the maintainer:
  1. Layout: `team/` (not "personas"), including the human maintainer's role, and `skills/` at the root.
  2. Agents: `AGENTS.md` only, noting Claude Code 2.1.277 or later is needed. Older versions aren't catered
     for: no `CLAUDE.md` pointer, not even as a documented workaround.
  3. Scheduling: when and who in the process files, how in the instance's own set-up; the docs carry a note on
     GitHub Actions cron reliability.
  4. Modules (`python`, `node`, `signalk`, `github-actions`, `homeassistant`, ...), each with default policies and
     whatever it adds to processes and skills, chosen at set-up (usually by the owner's agent) and built in. A
     default fortnightly seed review recommends changes and new modules: PRs when likely to fit, issues when
     uncertain. Each copied-in policy's front matter says `diverged`, `auto` or (default) `review`.

- 2026-11-23 — Skill frontmatter: skills keep Claude Code's `agent: <role>` and `context: fork` beside the neutral
  `role:`. Why: Claude Code runs a skill as its role, with the role's model, only through those keys; other agents
  ignore keys they don't know. The cheapest option, and no local edits for seed updates to merge around.

Open:

_None._

## Log

- 2026-11-23 — Created. HQ Stats has known outside users, so HQ as a product moves on to the seed. Plan drawn
  from HQ as a product's Phases 2 and 3; first task is the file inventory.
- 2026-11-23 — Shape decided by the maintainer: plain git repo, no package, no agent specifics. Inventory done
  ([HQ Seed inventory](../../reference/hq_seed_inventory.md)). Org names are cheap to template; platform names are the
  bulk of the core edits (about 20 files, plus four skills to split into a core frame and per-pack sections).
  Agent specifics go deeper than expected: the `.claude/` layout is wired into `check-hq`, `AGENTS.md` and the
  process docs, every skill has Claude Code frontmatter, and scheduling is written as Claude routines. That needs
  four decisions before extraction starts (Open, above).
- 2026-11-23 — The maintainer settled the four questions (Decisions). Design rewritten around them: `team/` with
  a maintainer role, `skills/`, `AGENTS.md` only, scheduling out of the seed with a GitHub cron note, modules in
  place of packs, `seed:` on policies, and a fortnightly seed review in place of `/hq-update`. Next: check what
  Claude Code 2.1.277 finds in the neutral layout, then the formats.
- 2026-11-23 — Tested Claude Code 2.1.327 on a neutral-layout repo: `AGENTS.md` loads; skills and roles are found
  only under `.claude/`, and symlinks from there to `skills/` and `team/` work. Instances get the links at set-up.
  One question opened: whether skills keep `agent:`/`context: fork` beside `role:`.
- 2026-11-23 — Skill frontmatter decided: option (a), `agent:` and `context: fork` kept beside `role:`. Phase 1 is
  left with the formats (`hq.lock`, `module.toml`, module markers, `seed:`) and the repo itself.
- 2026-11-23 — Linked to the new [Product Catalogue](hq-product-catalog.md) project: the seed's `repos.toml`
  schema needs its definitions of product and product line, so that's a Phase 1 task here, ahead of the first release.
