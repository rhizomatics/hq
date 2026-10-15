---
name: support-sweep
description: Daily sweep of unanswered GitHub issues and discussions across all Rhizomatics repos. Produces a ranked report of who is waiting on a maintainer reply.
context: fork
agent: pm
---

# Daily support sweep

Find every open issue and discussion in the repos in `repos.toml` where a user is waiting on a
maintainer. Maintainers are listed in `repos.toml` under `[org].maintainers`.

## Gather

- Issues: `gh api 'repos/rhizomatics/<repo>/issues?state=open&per_page=100'` (skip items with
  `pull_request`), and `gh api repos/rhizomatics/<repo>/issues/<n>/comments` for the last commenter.
- Discussions: in a cloud routine read `discussions` per repo from the latest `hq-private/data/github/` snapshot
  (open discussions with last commenter), then WebFetch a thread if you need its content. Locally, GraphQL:
  ```
  gh api graphql -f query='query($o:String!,$r:String!){repository(owner:$o,name:$r){discussions(first:50,states:OPEN,orderBy:{field:UPDATED_AT,direction:DESC}){nodes{number title url createdAt author{login} answer{id} category{name} comments(last:1){nodes{author{login} createdAt}}}}}}' -f o=rhizomatics -f r=<repo>
  ```
- Ignore bot authors (`*[bot]`, renovate, dependabot) and the maintainers' own tracking issues.

## Classify

An item is **waiting** if the last comment (or the opening post, if no comments) is by a non-maintainer.
For each waiting item record: repo, link, author, age since their last message, and a one-line gist.
Flag first-time contributors (`authorAssociation` of FIRST_TIME_CONTRIBUTOR / NONE).

Rank: bug reports with data-loss/crash/security words > first-timers > oldest wait > the rest.
For the top items, read the thread and suggest the next action (reply draft, ask for logs, label,
close as duplicate). Keep drafts to a few sentences.

## Output

Write `hq-private/reports/support-sweep/YYYY-MM-DD.md`, short (see "Working rules" in `CLAUDE.md`):

```
# Support sweep YYYY-MM-DD
**N waiting** (M new) · oldest: X days · [hq#N](link)
Gaps: <one line per repo or source that couldn't be read, if any>

| Item | Who | Waiting | Action needed |
| [repo#123](link) | login (first-timer) | 4d | Decide X / reply / close as done |

## Drafts
### repo#123
> draft...
```

Only items still waiting go in the table; things cleared since yesterday get one line at most.
Nothing waiting → a one-line report.

Then update the rolling hq issue per area (`<area>: reply to waiting users`, labels `support` +
area), per "Issues and PRs" in `CLAUDE.md`: one checklist item per waiting thread, linking the
thread and its draft (`hq-private/reports/support-sweep/YYYY-MM-DD.md#repo123`); tick items that are no longer
waiting. Do not post anything in the product repos.
