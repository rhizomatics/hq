---
name: registry-check
description: Weekly check that repos.toml matches the rhizomatics GitHub org — new, removed, renamed or archived repos, and new publishing channels.
context: fork
agent: pm
---

# Weekly registry check

`repos.toml` is the source of truth for every other process, so drift there means silent gaps.

1. The org's repos: `org_repos` in the latest `hq-private/data/github/YYYY-MM-DD.json` (in a cloud routine the
   org endpoint is blocked), or `gh repo list rhizomatics --limit 200 --json name,isArchived,isFork,visibility,createdAt,description` locally.
   A brand-new repo may not be attached to the routine; inspect it via WebFetch of its github.com page.
2. Compare with `[repos.*]` in `repos.toml`:
   - **New** in org, not in registry → inspect it (`package.json` name, `pyproject.toml` name and
     PyPI workflow, `Dockerfile` + GHCR workflow, `hacs.json`, `custom_components/<domain>`) and
     propose a complete entry.
     Also file an hq issue (area `org`) asking the maintainer to attach the new repo to the cloud
     routines at https://claude.ai/code/routines, or routines won't be able to read it.
   - **In registry, gone from org** → probably renamed or deleted; check `gh api repos/rhizomatics/<name>`
     (a redirect means renamed).
   - **Archived** → propose removing it, or keeping it for stats only.
3. For existing entries, spot new channels: a new `pypi-publish`/`docker-publish` workflow, a newly
   published npm/PyPI package, `hacs.json` added.

Since a wrong registry entry quietly breaks stats, apply clear-cut changes (a new repo with obvious
channels, a rename) directly to `repos.toml` and commit; list judgement calls as proposals.

## Output

Append a section to this week's `hq-private/reports/prs/YYYY-Www.md` if it exists, otherwise write
`hq-private/reports/registry/YYYY-Www.md`. No drift → one line.
