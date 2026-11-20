---
title: HQ as a product
summary: Others seed their own HQ, adapt it with their own agents and keep taking core updates
status: active
lead: architect
owner: jeyrb
started: 2026-11-15
---

## Goal

Other open source developers can seed their own HQ from Rhizomatics HQ, with agentic policy checks, scheduled
sweeps, usage stats and a public site, and have their own agents adapt it to them. They keep taking
improvements from the core product without losing their local changes. It's designed to be agent neutral, and
says honestly that it works best with Claude. It's built from existing skill packages wherever they exist, adding its own skills only to fill gaps.

There should be value even for a single-product developer: usage stats and the public site are pulled out as
a separate product, [HQ Stats](hq-stats.md), which ships and is marketed first.

## Context

- **Two products.** (1) [HQ Stats](hq-stats.md): deterministic collection of usage per channel (PyPI, npm,
  ghcr, HACS, HA analytics, website page views) and its public pages, as an npm package configured and stored
  in the user's `hq` repo (reshaped 2026-11-16). No AI needed. (2) HQ, the agentic operating model: personas,
  policies, processes and skills. Different audiences and set-up costs; (1) is the low-friction way in to (2),
  so it goes first, under shared branding, and HQ uses it as a component.
- **Coupling is lighter than it looks** (2026-11-15 count): most org-specific content is the org name and
  maintainer in prose. Only `architecture-review`, `platform-review`, `security-escalation` and
  `dependabot-sweep` are deeply Home Assistant or SignalK specific. Stats are already per channel, driven by
  fields in `repos.toml`, so `python`/`node` "modules" aren't needed.
- **GitHub Agentic Workflows** (`gh-aw`, technical preview): Markdown workflows compiled to GitHub Actions, run
  by a choice of engine (Copilot, Claude, Codex). Ready-made OSPO workflows overlap HQ: org health report,
  contributor report, open source compliance check, stale repo report. Maintained by GitHub and improving, and
  engine-neutral, which also helps non-Claude users.
- **OpenSSF Allstar** looks unmaintained; not a candidate. OpenSSF Scorecard is (see [OpenSSF](openssf.md)).
- **What HQ adds** over gh-aw's examples: platform-aware stats (HACS, HA analytics, SignalK), forum watching,
  policies aligned to an upstream platform, personas that disagree on purpose, private/public split, the site.

## Design

### Seed, not template

A user seeds an HQ from the product, then their own agents change it freely. A template copy would drift from day one, so the seed records where everything came from:

- `hq.lock` (or a section of `repos.toml`): product version seeded from, and per file whether it is
  **upstream** (unchanged), **modified** or **local**.
This keeps the support burden low: users' agents do the adapting and the merging, not the maintainer.

### Reuse skill packages first

Fundamental to HQ: it reuses existing packages of skills and adds its own only where there is a gap. gh-aw's
workflows are one source among several: vendors' own skills (a tool or platform vendor's skill for their own
product), skill marketplaces and other agent plugin packages. HQ doesn't do something a vendor has a better
skill for; it wires that skill in and supplies the org context (policies, `repos.toml`, issue conventions).

Each capability (security audit, docs review, support sweep, PR report, org health, ...) is declared in config
with one or more providers, each pinned to a version:

- an upstream HQ skill, a third-party skill or skill package, a gh-aw workflow, or a local skill
- more than one provider is allowed and expected for **security auditing**: the best auditors will change over
  time and people want their own. `security-escalation` becomes the step that merges, de-duplicates and ranks
  their findings, and applies the transitive-vulnerability and escalation rules

Keep in HQ only what nobody else does well, mostly the platform packs and the glue between providers.

A provider can also be **optional**: off by default and turned on per instance in config, like a skill, alongside
the HQ provider rather than instead of it. That's the likely shape for gh-aw's OSPO workflows (perhaps as a
quarterly audit), where the trial is about whether to support them at all. The defaults must work with no extra
set-up: anything that needs its own keys, plans or tuning is opt-in, so it never stands between a small developer
and a working HQ.

### Two regular reviews

Which skills are used, and whether they're still the best choice, is reviewed regularly, at two levels:

- **Product architecture review**, in the HQ product: for each capability, is the HQ skill still needed, or has
  a vendor or third-party skill caught up so it can be retired? Is any skill obsolete (the process it served is
  gone, or the platform changed)? Are there gaps no provider fills yet? Proposes swaps with evidence (findings
  missed or false positives on the same repos) and keeps the default provider set current.
- **Alignment review**, in each HQ instance, Rhizomatics' own included: three-way comparison of the base
  version, the current product and the local copy, per policy, skill, persona, process and provider choice. It
  recommends which product changes to take (including skills the product has retired in favour of a third-party
  one), which local changes to keep, local skills a third-party one now covers, and local changes worth offering
  back to the product. Output is a PR with the uncontested updates and an issue for the judgement calls.

### Core and platform packs

- **Core:** project and process model, issue/PR conventions, support, PRs, Dependabot, registry, projects,
  security merge step, provider config, the two reviews, brand kit structure. Stats and the site come from
  [HQ Stats](hq-stats.md).
- **Packs:** `homeassistant` and `signalk`: forum watch sources and topic terms, platform alignment policies,
  platform change tracking, upstream advisories (`security_watch`), stats channels (HACS, HA analytics).
- No language modules: channel fields in `repos.toml` (`pypi`, `npm`, `ghcr`, ...) already select collectors.

### Community: contributed projects

Other people build on the org's products: plugins for a product, Supernotify Cards, integrations that depend on
one of our packages. HQ tracks them as the org's **community**, separately from its own repos, so their use and
standing are visible without being mixed into the org's own numbers.

- **Registry:** `[community.<id>]` entries in `repos.toml`, beside `[repos]`: the project's GitHub repo, its
  author, the product it extends, and the same channel fields as our repos (`npm`, `pypi`, `hacs_zip`,
  `ha_domain`, ...). Only public projects.
- **Stats** (in [HQ Stats](hq-stats.md)): collected by the same collectors, from public sources only
  (stars, forks, releases, last release date, downloads per channel). Traffic and clones need push access to
  their repo, so they're never collected. Shown in their own Community section and kept out of the org's totals.
- **Reputation:** the reputation review covers the community too: mentions and sentiment, health (stale,
  unanswered issues, broken by one of our releases), and how we treat contributors (linked from our docs,
  thanked, notable ones mentioned in announcements).
- **Breaking changes:** before a release that changes an extension point, the architect lists the community
  projects that use it, so the release notes and any heads-up reach their authors.
- **Discovery:** a script finds candidates, per [scripts over agents](../policies/scripts_over_agents.md):
  npm and PyPI dependents of our packages, a GitHub topic or code search for our package names, forum mentions
  from forum watch. The registry check proposes additions; the maintainer approves, since the entry names
  someone else's project publicly. An author who asks to be left out is removed.

### Agent-neutral by design, best with Claude

Designed so any capable agent can run it, and honest that it works best with Claude: that's what it's built
and run on daily, and where its personas, skills and subagent hand-offs are tested. The docs say so plainly,
rather than claiming parity that hasn't been tested. For each other agent, say what has been tried, what works
and what's known to be weaker or missing; a non-Claude engine is "supported" only once it has run end to end.

- `AGENTS.md` is the canonical instruction file; `CLAUDE.md` and other agent files are thin pointers to it.
- Skills in the open `SKILL.md` format where the agent supports it; processes and personas as plain Markdown
  any agent can follow, with thin per-agent adapters (`.claude/agents/`, Codex, Copilot, ...) generated from them.
- Scheduling is the agent's own: Claude Code routines for Claude (the reference set-up), the equivalent
  scheduler for other agents. gh-aw is not a runtime for HQ, just one source of reused skills: a gh-aw provider
  runs as its own Actions workflow and HQ picks up its output. The cloud-sandbox workarounds in today's
  `CLAUDE.md` move to the Claude adapter.
- Every requirement stated per runtime: plan or API key, token scopes, rough monthly cost.

### Config

Extend `repos.toml`, don't add YAML: `[org]` gains the private repo location (optional; omitted for entirely
public set-ups), areas and labels, enabled packs and capability providers; `[community.*]` lists contributed
projects. Plain config also suits scripted
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

- [x] @agent Move org, maintainer, private repo, areas, labels and families into `repos.toml`; skills, personas and site scripts read them (2026-11-15)
- [x] @agent Replace hardcoded `rhizomatics` / `jeyrb` outside config; done when a grep finds none (2026-11-15). Scope: `AGENTS.md`,
      `CLAUDE.md`, personas, skills, processes, `team.md`, site scripts, pages and config. Instance content keeps its names:
      `projects/`, `policies/`, `reference/`, the site home page, and the admin workflows synced from `<org>/.github`
- [ ] @agent Platform names (Home Assistant, SignalK, HACS) out of core files: moved to Phase 2, where the packs they belong in are made
- [x] @agent Make `AGENTS.md` canonical, `CLAUDE.md` a pointer plus Claude-only notes (2026-11-15)
- [x] @agent Scripts over agents ([policy](../policies/scripts_over_agents.md)): project tables, routine schedule and
      persona **Runs** generated by the site build; mechanical plumbing checks in `mise run check-hq` (2026-11-15).
      Part of the core: every seeded HQ gets the generators and checks

- [x] @pair Pull usage stats and the site's Usage section out into [HQ Stats](hq-stats.md); it ships ahead of the phases below
      (2026-11-19: built and checked as a local `hq-stats` package; publishing it and moving the HQ site onto it
      are in the HQ Stats plan)

### Phase 1: providers and skill packages

- [x] @agent Survey existing skill packages for each HQ capability: vendors' own skills, skill marketplaces,
      agent plugin packages and gh-aw workflows. List per capability what exists, who maintains it and how it compares
      (2026-11-19, [skill providers](../reference/skill_providers.md))
- [ ] @agent Run the best candidates beside HQ skills on Rhizomatics repos for two weeks. The question (2026-11-19) is
      whether HQ should support gh-aw/OSPO workflows at all, as an optional provider, not whether they replace the
      HQ skills. First gh-aw candidates: org health report ↔ `support-sweep` + `pr-report`; stale repo report ↔ `registry-check`;
      compliance check ↔ `github-review` (community files part); contributor report ↔ part of `adoption-report`.
      Set up in [hq-private#121](https://github.com/rhizomatics/hq-private/pull/121); runs once merged with its
      engine secret ([hq-private#122](https://github.com/rhizomatics/hq-private/issues/122)), then compare for two weeks (plan in [skill providers](../reference/skill_providers.md#the-trial))
- [ ] @pair After the trial, decide whether HQ supports gh-aw/OSPO workflows as optional providers: off by default,
      turned on per instance in config like a skill, perhaps at a slower cadence (e.g. a quarterly audit). The current
      HQ skills stay either way. If yes, the opt-in becomes part of the provider config design (Phase 2)
- [x] @agent Survey existing security auditing skills and workflows; pick at least two providers to run alongside Dependabot and CodeQL
      (2026-11-19: zizmor for Actions workflows, built as a shared admin workflow; Socket.dev for package supply chain,
      a GitHub App for the maintainer to decide on ([hq-private#124](https://github.com/rhizomatics/hq-private/issues/124)). Scorecard, Grype and secret scanning were already running)
- [ ] @pair Capability/provider config and the security merge step: `[capabilities]` in `repos.toml`, checked by
      `check-hq`; "Providers and merging" in `/security-escalation` ([hq#13](https://github.com/rhizomatics/hq/pull/13);
      zizmor's roll-out after it in [hq-private#125](https://github.com/rhizomatics/hq-private/issues/125))

### Phase 2: core and packs

- [ ] @pair Split skills, policies and reference into core and `homeassistant` / `signalk` packs; hq runs unchanged;
      done when core files name no platform (deferred from Phase 0)
- [ ] @pair Community: `[community.*]` schema in `repos.toml`; discovery script; registry check proposes
      additions; reputation review and release checks cover it. Seed Rhizomatics' entries (known plugins,
      Supernotify Cards) for the maintainer to approve. Stats side is in [HQ Stats](hq-stats.md)
- [ ] @pair Brand kit structure in core; Rhizomatics images move to wherever its products keep them
- [ ] @pair Per-agent adapters generated from personas and skills; try one non-Claude engine end to end

### Phase 3: product repo and dogfooding

- [ ] @human Create the product repo (name: `hq-product`?) and its plugin / skills listing
- [ ] @pair Publish core and packs from it, versioned; hq consumes them and records `hq.lock`
- [ ] @pair Product architecture review process and skill, in the product (skills in use, obsolete, retirable, gaps)
- [ ] @pair Instance alignment review process and skill; first run on Rhizomatics HQ
- [ ] @pair Seed skill (`/hq-init` or equivalent): drafts `repos.toml` from the org's repo list, optional private repo, site and stats workflows
- [ ] @agent Seed a throwaway org end to end; fix whatever needed hand edits

### Phase 4: product

- [ ] @human One friendly outside developer seeds an HQ
- [ ] @pair Product docs (README, Pages), announcement drafts for HA and SignalK developer forums
- [ ] @human Post announcements; list the skill

## Success test

One outside org running a seeded HQ, and taking at least one product update through the alignment review,
within 3 months of the announcement. Otherwise stop at phase 3: everything up to there still pays off for
Rhizomatics alone.

## Decisions

Decided:

- 2026-11-15 — Stats and site become a separate project and product, [HQ Stats](hq-stats.md), with shared
  branding. It's pulled out in the first phase and marketed ahead of HQ itself.
- 2026-11-15 — Reusing existing skill packages is fundamental, gh-aw being only one source. HQ adds skills only
  for gaps and never does what a vendor has a better skill for. Skills in use, obsolete or retirable in favour of
  a third-party one are reviewed regularly, split into a product architecture review (HQ as a product) and an
  alignment review in each HQ instance, Rhizomatics' own included.
- 2026-11-15 — gh-aw is not HQ's runtime, only one of the reused skill sources. Each agent schedules with its
  own scheduler, Claude Code routines being the reference set-up.
- 2026-11-19 — The gh-aw/OSPO trial decides whether HQ supports those workflows as an optional, opt-in provider
  (possibly a quarterly audit), not whether they replace HQ skills. The current skills are kept. Why: an
  individual developer with three or four projects should get a working HQ from the defaults. The extra set-up
  gh-aw needs (an API key or Copilot plan, compiled workflows, tuning like the trial's rate-limit fix) could put
  them off HQ altogether, so it's only ever opt-in.

Open:

- 2026-11-19 — Engine for the gh-aw trial: Claude with an `ANTHROPIC_API_KEY` (as proposed in hq-private#121), or
  Copilot-hosted inference (no secret, needs a Copilot plan). [hq-private#122](https://github.com/rhizomatics/hq-private/issues/122)
- 2026-11-19 — Socket.dev for npm and PyPI supply-chain checks: install its GitHub App on the org, or not. [hq-private#124](https://github.com/rhizomatics/hq-private/issues/124)

## Log

- 2026-11-15 — Reviewed and reshaped: moved to proposed; module system dropped in favour of config and packs;
  seed + upstream review model for support burden; pluggable capability providers (several security auditors);
  gh-aw to replace skills where it does as well; agent-neutral; brand kit as structure only; Allstar dropped
  (unmaintained).
- 2026-11-15 — Decisions recorded: stats split out as [HQ Stats](hq-stats.md), first to market; skill-package
  reuse made fundamental, with the upstream review replaced by two reviews (product architecture, instance
  alignment). Plan updated to match.
- 2026-11-15 — Agent-neutral by design, but stated honestly as best used with Claude; other engines listed
  with what has and hasn't been tested. gh-aw dropped as a runtime; it stays a skill source.
- 2026-11-15 — Started (moved to active). Phase 0: `repos.toml` gained `[org]` name, `hq_repo`, `private_repo`,
  `site_url`, plus `[families]` (site heading and issue area per family) and `[labels]`. The site reads them
  through `site/src/lib/hq-config.mjs` (replaces `families.mjs`); site builds unchanged. `AGENTS.md` is now the
  canonical instructions with a "Names used in these docs" section (`<org>`, the maintainer, `hq-private`);
  `CLAUDE.md` imports it and keeps only Claude notes (Haiku researcher, cloud routine sandbox). Skills,
  personas, processes and `team.md` name roles, not the org. Policy review now greps for org names outside
  config. Platform names deferred to Phase 2. Stats extraction is the [HQ Stats](hq-stats.md) project's
  work: its collectors already read the org from `repos.toml`.
- 2026-11-15 — New policy, scripts over agents: lists that repeat facts are generated (project tables from
  `summary:` frontmatter, schedule from cadence **When:**/**Environment:**, persona **Runs** from **Who:**), and
  mechanical checks run as `mise run check-hq`. The project review no longer edits an index; the policy review
  runs the check instead of reading for plumbing. Found and fixed on the way: `project-alignment` listed as
  proposed while in `done/`, five headings broken by non-breaking spaces, `decision-followup` missing from
  `team.md`. Still open: `decision-followup` has no time or environment in the docs.
- 2026-11-15 — Decision follow-up folded into the weekly project review (it never had a routine); skill removed.
  Only one routine environment now (HQ Web Research), so it's a single default in `processes/README.md`, not a
  per-entry field. `fix-spaces` (sirosen/texthooks) added to the project standards and to hq's own prek config.
- 2026-11-15 — Ecosystem facility added to the design: contributed projects (plugins, Supernotify Cards) listed
  as `[ecosystem.*]` in `repos.toml`, with their own stats in HQ Stats and coverage in the reputation review,
  discovery by script and release checks for extension points. "Ecosystem packs" renamed "platform packs" to
  keep the word for this.
- 2026-11-15 — First ecosystem entry, approved by the maintainer: `[ecosystem.supernotify-cards]`
  (lollox80/supernotify-cards, a HACS card extending supernotify). Schema documented in the `repos.toml` header;
  no collector reads it yet. The repo carries the `supernotify` GitHub topic, a good first discovery source.
- 2026-11-15 — Ecosystem facility renamed **community** (`[community.*]` in `repos.toml`): plainer, and it keeps
  "ecosystem" from meaning two things. The platform a product belongs to is its platform.
- 2026-11-15 — Ecosystem review renamed **platform review** (skill, cadence entry, `platform` label in hq-private,
  report folder `hq-private/reports/platform/`). Terms defined in `AGENTS.md`: product, platform (what we run
  inside), community (what others build on us). Community page added to the site (sidebar, home page) from
  `[community.*]`, grouped by product; `check-hq` validates the entries. The routine's rename failed (HTTP 403,
  a repo it attaches is no longer accessible), so it's still `hq: monthly ecosystem review` running
  `/ecosystem-review`: needs fixing before 2026-12-10.
- 2026-11-15 — Routines regrouped to one per persona per cadence where processes share a time: `hq: daily
  infra-lead` (Dependabot sweep, then security escalation), `hq: daily marketing` (forum watch, then the new
  release digest), `hq: weekly pm (Monday)` (PR report, then registry check): 9 daily and weekly routines down to 6,
  each process keeping its own skill and output. Cadence entries carry **Routine:**; `check-hq` checks a shared
  routine's processes have one persona and one start time. Candidates for scripts next: the registry check and
  the PR report's listing.
- 2026-11-15 — project-review: first review. Phase 0 is 4 of 5 done; the open box (platform names out of core) is deferred to Phase 2 by design. Nothing is `@human`-blocked. Note the Log above is out of order and says "moved to proposed" before "Started (moved to active)"; status is active.
- 2026-11-19 — Phase 0 finished: [HQ Stats](hq-stats.md) built as a local package (collector, aggregate, Usage pages
  as an Astro integration) that reproduces the HQ site's Usage section. What's left there is publishing it.
  Platform names out of core stays in Phase 2.
- 2026-11-19 — Phase 1 surveys done ([skill providers](../reference/skill_providers.md)). No third-party provider
  fully covers an HQ capability; GitHub's OSPO gh-aw workflows overlap four skills partly and go on a two-week
  trial in hq-private (hq-private#121), each writing an unassigned `trial` issue. The survey's mirrors-only listing
  of the OSPO workflows was wrong: they're in github/awesome-copilot. gh-aw reads every public repo from one
  repo, so the org needs no extra token. Security: zizmor chosen and built as `reusable-zizmor.yml` with an admin
  caller (it reaches repos with the next hq release); its first run on hq found three checkouts keeping their
  token (fixed) and the auto-assign `pull_request_target` (intended, now annotated). Socket.dev chosen, pending the
  maintainer. Providers per capability are now config (`[capabilities]` in `repos.toml`, validated by
  `check-hq`: every skill provides exactly one capability, third-party providers are pinned), and
  `/security-escalation` merges and ranks findings across providers. Still open in Phase 1: the trial itself and
  the retire decisions after it.
- 2026-11-19 — gh-aw trial running (engine key added). First org health run cost about $2.43 (Sonnet 5) and
  filed no report: the "public repos only" local rule made it search per repo, it hit GitHub's search rate limit
  and ended without its safe output. Fixed in [hq-private#129](https://github.com/rhizomatics/hq-private/pull/129)
  (org-wide `is:public` searches, sequential, always file the issue). Trial reframed by the maintainer: it decides
  whether to support gh-aw/OSPO as an optional provider, not whether to retire HQ skills.
- 2026-11-20 — project-review: gh-aw trial running. hq-private#121 merged and the engine key added (#122 ticked); first OSPO Organization Health Report succeeded 11-19, rate-limit fixes merged (hq-private#129). Two-week comparison ends about 12-03, then the `@pair` decision. Zizmor roll-out merged in 23 repos but blocked by the org's allowed-actions list (hq-private#125). No new Phase 2 work. Reminder: the routine rename for the monthly ecosystem review still needs fixing before 2026-12-10.
