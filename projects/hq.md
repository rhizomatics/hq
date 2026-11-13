# Rhizomatics HQ

A headquarters for Rhizomatics, running projects and ensuring products are running well.

## Outstanding

### Now

- Reorganize the schedule so easier for human review and editing in code editor
  - Separate docs for daily, weekly, bi-weekly, monthly, quarterly
- Weekly and monthly project review
  - Refine project itself, updates, next steps
- Monthly Github review
  - Focus on github workflows and settings
  - Use new features where appropriate
  - Use workflows consistently per type of app ( e.g. HACS, signalk plugin, docker)
  - Pick up repeated issues on builds and get to root causes
- Quarterly review of the roadmaps for each project that has one
  - Items that have been done, or obsoleted by other changes

### Soon
*Feedback required from using existing processes first*
- Private web access to HQ
  - Projects, reports by area, process calendar, adoption charts from `hq-private/data/stats/`
- Public facing site — **built** in `site/`, deploying to https://hq.rhizomatics.org.uk/ (2026-11-13)
  - [x] Docs (policies, projects, processes, reference, team) published, with a build-time check for private details
  - [x] Usage per component: HACS/Marketplace by version, npm, PyPI, GHCR, stars, clones, HA analytics by version
  - [x] Processes declare report visibility; public and private-by-exception reports published from 2026-11-14
  - [ ] @human Add `HQ_PRIVATE_READ_TOKEN` to hq's Actions secrets and set Pages source to GitHub Actions
  - [ ] @pair Retire `hacs-downloads`: point its Pages at the new Usage section, stop its daily capture, archive the repo
  - [ ] @pair Replace the `www.rhizomatics.org.uk` site built from `.github` (custom domain on this site, or link across)

### Distant
*Longer term feedback needed to see if its worthwhile and the shape of the package*
- Make `hq` available as a product itself
  - `homeassistant` and `signalk` become modules within it
  - Extract as a public template (personas, skills, processes, scripts) with no data; `hq` itself stays
    private because it holds unfixed security findings and personal infrastructure details
  - Possibly split into
    - `hq-skill` - the commodified shared skill
    - `hq-private` - reports, and sensitive config
    - `hq` - the public facing site, also housing the web front end
      - S3 buckets also considered for the public facing site and private generated reports, however don't do this unless GitHub repo can't cope
  
- Reflect *Project* documents as GitHub projects
  - Cloud agents have no GraphQL access, so has to be one way sync out

## Log

- 2026-10-14 — "Now" items set up: schedule split into `processes/{daily,weekly,fortnightly,monthly,quarterly}.md`;
  new skills `/project-review` (weekly Fri, monthly on last Fri), `/github-review` (monthly 11th, takes CI
  workflows over from `/alignment-review`), `/roadmap-review` (quarterly, Mar/Jun/Sep/Dec). None run yet.
- 2026-10-14 — Added private web access idea (Cloudflare Pages + Access) after confirming GitHub
  Pages can't serve a private site on the free org; noted that `hq` stays private.
- 2026-10-30 — project-review: correction to the 10-23 note. The `/github-review` skill was only created on 10-14, after its 11th-of-month slot, so "no report" was expected; first real run is 2026-11-11. Same for `/alignment-review` changes and `/roadmap-review` (December). Nothing to chase.
- 2026-11-13 — project-review: `/github-review` ran 11-11 (hq-private#105 follows up). "Now" items are all running; nothing started on "Soon".
- 2026-11-13 — Public site built in `site/` (Astro Starlight, per the docs toolchain policy for non-Python
  projects) and deployed by `.github/workflows/site.yml` daily at 05:40. hq is public, so Pages works on the
  free org; private data is read at build time from hq-private and only aggregates are published.
  hacs-downloads' history archived to `hq-private/data/legacy/`. Privacy check before publishing: redacted
  a LAN address and router model in `agent-diagnostics.md`; nothing else found.
