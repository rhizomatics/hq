@AGENTS.md

# Claude Code notes

Everything above is shared with other agents. These notes are Claude-only.

- The `researcher` subagent runs on Haiku.
- Personas are in `.claude/agents/`, skills in `.claude/skills/`; run a process by hand with `/<skill-name>`.

## Running as a cloud routine

Scheduled routines run in a cloud sandbox with every repo of the org attached, each cloned under
`/home/user/<repo>` (so `hq` and `hq-private` are siblings). Commit and push reports and data to
`hq-private`, and changes to docs, projects or `repos.toml` to `hq`, each on `main`. What works there:

- `gh api` REST calls scoped to a repo of the org: issues, comments, PRs, check runs, commits,
  releases, Actions runs, private security advisories, contents. Also `hq` issues.
- WebFetch and WebSearch, including github.com pages (e.g. discussions of any repo).

What doesn't, and what to use instead:

- **GraphQL** (`gh pr list`, `gh issue list`, `gh search`, discussions API) → use `gh api repos/...` REST.
- **Security alerts, traffic referrers/paths, org repo list, discussions with last-commenter**
  → the daily snapshot (see "Data you can't fetch live" in `AGENTS.md`).
- **Repos outside the org** (upstream platforms, other projects) → WebFetch their github.com pages.
- **Direct downloads** (`curl` to package registries, forums) → WebFetch the URL; download stats are already in `hq-private/data/stats/`.

If something you need is unavailable, say so in the report rather than guessing.
