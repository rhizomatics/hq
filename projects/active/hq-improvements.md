---
summary: Collection of improvements to HQ prior to the first public seed
---

# HQ Improvements

## Projects

- Capitalize 'active', 'done' etc on HQ site
- Renamed 'queued' to 'ready'
- Add a new 'blocked' status, with a mandatory front matter key for reason and optional front matter key that gives a hq ref, e.g. projects/up-my-game.md
 - Regular project review checks on blocks and challenges progress
- Add `ongoing` as a project status
  - Used for background projects, or opportunistic ones like the pngquant migration, where changes happen as products are touched rather than concerted effort
- Add `programme` as column in projects list
- By default `shelved` and `done` are collapsed 
- Consider supporting `projects` stucture within product repos
  - No product line repos, HQ is effectively the home for anything that might be product line level
  - Supports overall goal of keeping HQ sprawl down, so only org wide, or product-line wide, things there
- Project view on site should have date proposed, date ready, date started, last revision, last known work date, date complete. Only show columns that make sense for the status, so proposed and ready don't show started, complete etc

## Metadata

- Front matter supports labels/tags
  - Other tags, `productline` or `programme` are treated as labels
  - Web site has an index per label, and labels are search terms

## Processes

- Split reports into `snapshot` reports and `rolling` reports
  - Rolling reports have one instance per routine, and updated whenever routine updates, if only to change the last reviewed date in front matter
  - Snapshot reports are the current report structure
    - These lead to lots of sprawl and don't get read
- By default, all reports are rolling
  - Periodic security audits, and monthly or quarterly reviews are good examples of ones that remain snapshots
    - Daily security reviews are rolling

## HQ Product

(Blocked on `hq-seed` going live and `hq` rebased as a seeded instance of it)

- The HQ improvement projects move out of HQ and become roadmap and RFCs for `hq-seed`
- Future changed to HQ get reviewed in regular review and recommended as PRs back to `hq-seed` ( issue if uncertain, PR if its likely a good idea)
## Tasks

Projects:

- [x] @agent Capitalise statuses on the site (list headings, and sidebar groups instead of folder names)
- [x] @agent Rename `queued` to `ready`
- [x] @agent `blocked` status: `projects/blocked/`, `blocked:` (required) and `blocked_by:` (optional: a
      project, a path in hq, an issue `repo#12` or a URL); check-hq enforces both; the list shows reason and link
- [x] @agent Project review checks blocks (cleared? still the real reason? challenged after 6 weeks) and
      challenges progress (active with no work for 3+ weeks)
- [x] @agent `ongoing` status: `projects/ongoing/`, reviewed monthly rather than for weekly progress
- [x] @agent `programme` column in the projects list (done earlier, with the Programmes section)
- [x] @agent Done and shelved collapsed by default, on the list page and in the sidebar
- [x] @agent Dates per status from git history: proposed, ready, started (or `started:`), last work (latest
      Log date), blocked since, completed, shelved
- [ ] @human Decide: `projects/` structure within product repos (only org-wide and product-line work in HQ)

Metadata:

- [x] @pair Labels/tags in frontmatter, with `productline` and `programme` as labels; an index page per label
      on the site, and labels as search terms (2026-11-26: one Labels page with a section per label)

Processes:

- [ ] @pair Rolling and snapshot reports: rolling by default, one per routine, updated each run; snapshots kept
      for periodic audits and monthly or quarterly reviews. Touches every skill's **Output** and the reports
      pages

HQ Product:

- [ ] @human Blocked on `hq-seed` going live and `hq` rebased on it: move HQ improvement projects to `hq-seed`'s
      roadmap and RFCs

## Log

- 2026-11-25: Projects section built: statuses `active`, `ongoing`, `blocked`, `ready` (was `queued`),
  `proposed`, `done`, `shelved`; the list shows per-status dates from git history and the Log, blocked
  projects' reason and what they wait on, and folds done and shelved away; the sidebar groups by status with
  capitalised names; every project URL redirects from the other status folders, so moves don't break links.
  The site build checks out full history for the dates.
- 2026-11-26: labels. `labels:` in project frontmatter (checked: lower-case and hyphens), with `productline:`
  and `programme:` counted as labels and a programme's owner carrying its own name. The site has a Labels page
  (sidebar, under Projects) with a section per label, and each project page opens with its labels, linked, so
  the site search finds them. Documented in `projects/README.md`. Also removed the "major" flag from the
  public product catalogue (products now alphabetical within a line).
