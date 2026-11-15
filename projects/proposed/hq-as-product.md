---
title: HQ as a product
status: draft
lead: architect
owner: jeyrb
---

## Goal

Other open source developers can seed their own HQ from Rhizomatics HQ, with agentic policy checks, scheduled
sweeps, usage stats and a public site, and have their own agents adapt it to them. They keep taking
improvements from the core product without losing their local changes. It runs on more than one agent (not only
Claude), and uses the best available skills and GitHub Agentic Workflows rather than maintaining equivalents here.

There should be value even for a single-product developer, e.g. usage stats and the public site alone.

## Context

- **Two products in one.** (1) Stats and site: deterministic collection of usage per channel (PyPI, npm, ghcr,
  HACS, HA analytics) and the public site. No AI needed. (2) The agentic operating model: personas, policies,
  processes and skills. Different audiences and set-up costs; (1) is the low-friction way in to (2).
- **Coupling is lighter than it looks** (2026-11-15 count): most org-specific content is the org name and
  maintainer in prose. Only `architecture-review`, `ecosystem-review`, `security-escalation` and
  `dependabot-sweep` are deeply Home Assistant or SignalK specific. Stats are already per channel, driven by
  fields in `repos.toml`, so `python`/`node` "modules" aren't needed.
- **GitHub Agentic Workflows** (`gh-aw`, technical preview): Markdown workflows compiled to GitHub Actions, run
  by a choice of engine (Copilot, Claude, Codex). Ready-made OSPO workflows overlap HQ: org health report,
  contributor report, open source compliance check, stale repo report. Maintained by GitHub and improving, and
  engine-neutral, which also helps non-Claude users.
- **OpenSSF Allstar** looks unmaintained; not a candidate. OpenSSF Scorecard is (see [OpenSSF](../openssf.md)).
- **What HQ adds** over gh-aw's examples: ecosystem-aware stats (HACS, HA analytics, SignalK), forum watching,
  policies aligned to an upstream platform, personas that disagree on purpose, private/public split, the site.

## Design

### Seed, not template

A user seeds an HQ from the product, then their own agents change it freely. A template copy would drift from day one, so the seed records where everything came from:

- `hq.lock` (or a section of `repos.toml`): product version seeded from, and per file whether it is
  **upstream** (unchanged), **modified** or **local**.
- A monthly **upstream review** process, in the product itself: three-way comparison of the base version, the
  current product and the local copy, per policy, skill, persona and process. It recommends which upstream
  changes to take, which local changes to keep, and which local changes look worth offering back upstream.
  Output is a PR with the uncontested updates and an issue for the judgement calls. Rhizomatics HQ runs it too.

This keeps the support burden low: users' agents do the adapting and the merging, not the maintainer.

### Capabilities with pluggable providers

Each capability (security audit, docs review, support sweep, PR report, org health, ...) is declared in config
with one or more providers, each pinned to a version:

- an upstream HQ skill, a third-party skill (e.g. from a skills marketplace), a gh-aw workflow, or a local skill
- more than one provider is allowed and expected for **security auditing**: the best auditors will change over
  time and people want their own. `security-escalation` becomes the step that merges, de-duplicates and ranks
  their findings, and applies the transitive-vulnerability and escalation rules
- the upstream review also checks for better providers than the ones in use, and proposes swaps with evidence
  (findings missed or false positives on the same repos)

Prefer pulling in a better maintained skill or workflow over maintaining one here. Keep in HQ only what nobody
else does well, mostly the ecosystem packs.

### Core and ecosystem packs

- **Core:** project and process model, issue/PR conventions, support, PRs, Dependabot, registry, projects,
  security merge step, stats collection framework, site, upstream review, brand kit structure.
- **Packs:** `homeassistant` and `signalk`: forum watch sources and topic terms, platform alignment policies,
  platform change tracking, upstream advisories (`security_watch`), stats channels (HACS, HA analytics).
- No language modules: channel fields in `repos.toml` (`pypi`, `npm`, `ghcr`, ...) already select collectors.

### Agent-neutral

- `AGENTS.md` is the canonical instruction file; `CLAUDE.md` and other agent files are thin pointers to it.
- Skills in the open `SKILL.md` format where the agent supports it; processes and personas as plain Markdown
  any agent can follow, with thin per-agent adapters (`.claude/agents/`, Codex, Copilot, ...) generated from them.
- Scheduling via gh-aw (engine chosen by the user) as the default runtime, Claude Code routines as one option.
  The cloud-sandbox workarounds in today's `CLAUDE.md` move to the Claude adapter.
- Every requirement stated per runtime: plan or API key, token scopes, rough monthly cost.

### Config

Extend `repos.toml`, don't add YAML: `[org]` gains the private repo location (optional; omitted for entirely
public set-ups), areas and labels, enabled packs and capability providers. Plain config also suits scripted
automation without an agent.

### Privacy in the core

Not optional, whatever the set-up: the publish step refuses anything that looks private (`sync-content.mjs`),
security alerts are never published, and an entirely public set-up doesn't collect traffic referrers or alerts.

### Brand kit

The product carries the structure, not Rhizomatics' images: one master logo per product feeding docs sites,
plugin manifests, HA brands, social previews and the HQ site, with sizes, formats and where each is used, and a
check that they stay consistent. Consistent marks across all of those are cheap marketing; the kit makes it
the default. Rhizomatics' own images stay in its repos.

### Docs and domain

`hq.rhizomatics.org.uk` stays Rhizomatics' HQ. Product docs start as the product repo's README and GitHub Pages;
a separate domain only once there are outside users.

## Plan

### Phase 0: parameterise (in hq)

- [ ] @agent Move org, maintainer, private repo, areas, labels and families into `repos.toml`; skills, personas and site scripts read them
- [ ] @agent Replace hardcoded `rhizomatics` / `jeyrb` / platform names outside config and packs; done when a grep finds none
- [ ] @agent Make `AGENTS.md` canonical, `CLAUDE.md` a pointer plus Claude-only notes

### Phase 1: providers and gh-aw

- [ ] @agent Evaluate gh-aw OSPO workflows against HQ skills on Rhizomatics repos for two weeks, side by side.
      First candidates: org health report ↔ `support-sweep` + `pr-report`; stale repo report ↔ `registry-check`;
      compliance check ↔ `github-review` (community files part); contributor report ↔ part of `adoption-report`
- [ ] @pair Replace each skill where the gh-aw workflow does as well or better; keep the HQ-specific remainder as a small add-on
- [ ] @agent Survey existing security auditing skills and workflows; pick at least two providers to run alongside Dependabot and CodeQL
- [ ] @pair Capability/provider config and the security merge step
- [ ] @human Decide gh-aw as default runtime (cost, engine, token handling)

### Phase 2: core and packs

- [ ] @pair Split skills, policies and reference into core and `homeassistant` / `signalk` packs; hq runs unchanged
- [ ] @pair Brand kit structure in core; Rhizomatics images move to wherever its products keep them
- [ ] @pair Per-agent adapters generated from personas and skills; try one non-Claude engine end to end

### Phase 3: product repo and dogfooding

- [ ] @human Create the product repo (name: `hq-product`?) and its plugin / skills listing
- [ ] @pair Publish core and packs from it, versioned; hq consumes them and records `hq.lock`
- [ ] @pair Upstream review process and skill; first run on hq itself
- [ ] @pair Seed skill (`/hq-init` or equivalent): drafts `repos.toml` from the org's repo list, optional private repo, site and stats workflows
- [ ] @agent Seed a throwaway org end to end; fix whatever needed hand edits

### Phase 4: product

- [ ] @human One friendly outside developer seeds an HQ
- [ ] @pair Product docs (README, Pages), announcement drafts for HA and SignalK developer forums
- [ ] @human Post announcements; list the skill

## Success test

One outside org running a seeded HQ, and taking at least one upstream update through the upstream review,
within 3 months of the announcement. Otherwise stop at phase 3: everything up to there still pays off for
Rhizomatics alone.

## Decisions

Open:

- Which product leads the announcement: stats and site, or the full operating model
- gh-aw as default runtime, or Claude Code routines with gh-aw as an option

## Log

- 2026-11-15 — Reviewed and reshaped: moved to proposed; module system dropped in favour of config and packs;
  seed + upstream review model for support burden; pluggable capability providers (several security auditors);
  gh-aw to replace skills where it does as well; agent-neutral; brand kit as structure only; Allstar dropped
  (unmaintained).
