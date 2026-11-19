# Home Assistant discussion sites

Watched by `/forum-watch` on each source's cadence: daily | weekly (Mondays) | fortnightly (Mondays of
even ISO weeks) | monthly (1st). `How to search` tells the agent which access method works.

| Community | URL | Cadence | How to search |
|---|---|---|---|
| Home Assistant Community | https://community.home-assistant.io | daily | Discourse API: `/search.json?q=<terms> after:<YYYY-MM-DD> order:latest`, `/latest.json` Discourse API occasionally fails DNS in the sandbox and WebSearch is a lagging fallback. WebFetch can get 403 from it; `curl` to the same URL has worked then. |
| r/homeassistant | https://www.reddit.com/r/homeassistant | daily | Reddit API blocks anonymous calls (403) — WebSearch `site:reddit.com/r/homeassistant <terms>` |
| Feature Requests | https://github.com/orgs/home-assistant/discussions | daily | Regular Github Discussions|
| Architecture | https://github.com/home-assistant/architecture/discussions | daily | Regular Github discussions |
| What the Heck | https://community.home-assistant.io/c/month-of-what-the-heck/ | daily | Home Assistant's way of prompting to users to share frustrations with core or integrations |

## Manual checks

Places agents can't read (login walls, chat apps). The cadence is a guide for
the maintainer; agents file an hq issue for one only when there's a specific reason to look. See also [Home Assistant Help](https://www.home-assistant.io/help/) for more support and discussion links.

| Community | URL | Cadence | What to look for |
|---|---|---|---|
| Home Assistant Discord | https://www.home-assistant.io/join-chat | weekly | product names in #custom-integrations, #notifications |
