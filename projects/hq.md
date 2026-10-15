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
  - GitHub Pages can't do this: free org needs a public repo, Team plan makes the site public, only
    Enterprise Cloud has access-controlled Pages
  - Proposed: Zensical site built by a GitHub Action, deployed to Cloudflare Pages behind Cloudflare
    Access (free; email one-time code), e.g. `hq.rhizomatics.org.uk`
  - Contributors added by email later
  - Needs from Jey: Cloudflare account and DNS for the subdomain, API token for deploys
- Public facing site
  - A separate site from a safe subset only (never security data, traffic referrers, personal
    infrastructure, support triage notes)
  - Retire `hacs_downloads` and not lose any functionality
  - Maintain private what has to be private
  - Maintain repo private, so build out of Github Pages
    - Presume as an S3 bucket with CloudFront to guard against S3 costs
  - Non real time, build once or twice a day

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
