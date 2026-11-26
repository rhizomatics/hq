---
name: registry-check
description: Weekly check that products.toml matches the org on GitHub — new, removed, renamed or archived repos, and new publishing channels.
context: fork
agent: pm
---

# Weekly registry check

`products.toml` (with `hq.toml` and `community.toml`) is the source of truth for every other process, so
drift there means silent gaps.

1. The org's repos: `org_repos` in the latest `hq-private/data/github/YYYY-MM-DD.json` (in a cloud routine the
   org endpoint is blocked), or `gh repo list <org> --limit 200 --json name,isArchived,isFork,visibility,createdAt,description` locally.
   A brand-new repo may not be attached to the routine; inspect it via WebFetch of its github.com page.
2. Compare with the repos of every product in `products.toml` (`repos`, default the product's slug). Every org
   repo should be in exactly one product's `repos`; `mise run check-hq` already fails on a repo listed twice.
   - **New** in org, not in registry → inspect it (`package.json` name, `pyproject.toml` name and
     PyPI workflow, `Dockerfile` + GHCR workflow, `hacs.json`, `custom_components/<domain>`) and
     propose a complete entry: a new product with its line and artefacts, or a repo added to an existing
     product's `repos` (a split, a companion repo).
     Also file an hq issue (area `org`) asking the maintainer to attach the new repo to the cloud
     routines at https://claude.ai/code/routines, or routines won't be able to read it.
   - **In registry, gone from org** → probably renamed or deleted; check `gh api repos/<org>/<name>`
     (a redirect means renamed).
   - **Archived** → propose removing it, or keeping it for stats only.
3. For existing entries, spot new artefacts: a new `pypi-publish`/`docker-publish` workflow, a newly
   published npm/PyPI package, `hacs.json` added, release assets for a firmware or daemon.

Since a wrong registry entry quietly breaks stats, apply clear-cut changes (a new repo with obvious
channels, a rename) directly to `products.toml` and commit; list judgement calls as proposals.

## Output

Rewrite the `## Registry` section of `hq-private/reports/prs/current.md` (see "Rolling reports" in `AGENTS.md`), adding it if missing and
leaving the rest of the file alone. No drift → one line.
