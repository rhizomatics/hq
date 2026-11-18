# Policies

Use this to create policies across projects and products.

Policies should be scoped wherever they are not truly global.

Policies often imply ongoing work. Raise a project only where there is major work to implement or correct for a policy.

## Policy files

One markdown file per policy, starting with frontmatter that gives its `group:` (`general`, `python`,
`signalk` or `hq`) and a one-line `summary:` (both used by the [list of policies](./) on the site, which the
build generates), and a **Scope:** line wherever the policy isn't
truly global. Exceptions go in the policy itself, next to the rule they bend. `mise run check-hq` (also a commit hook) reports a policy
without a summary or group. A new group goes in `POLICY_GROUPS` in `site/scripts/lib/hq-docs.mjs`; until then
the policy still shows, under its own heading.
