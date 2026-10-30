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
- Public facing site
  - A separate site from a safe subset only (never security data, traffic referrers, personal
    infrastructure, support triage notes)
  - Retire `hacs_downloads` and not lose any functionality
  - Maintain private what has to be private
  - Maintain repo private, so build out of Github Pages
    - Presume not an S3 bucket (with CloudFront to guard against S3 costs) unless hit wall with Github Pages
  - Non real time, build once or twice a day
  - Replace `hacs_downloads` site and the `www.rhizomatics.org.uk` site built from `.github` repo

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
