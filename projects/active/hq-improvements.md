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