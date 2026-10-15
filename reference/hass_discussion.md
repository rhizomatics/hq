# Home Assistant discussion sites

Watched by `/forum-watch` on each source's cadence: daily | weekly (Mondays) | fortnightly (Mondays of
even ISO weeks) | monthly (1st). `How to search` tells the agent which access method works.

| Community | URL | Cadence | How to search |
|---|---|---|---|
| Home Assistant Community | https://community.home-assistant.io | daily | Discourse API: `/search.json?q=<terms> after:<YYYY-MM-DD> order:latest`, `/latest.json` Discourse API occasionally fails DNS in the sandbox and WebSearch is a lagging fallback. |
| r/homeassistant | https://www.reddit.com/r/homeassistant | daily | Reddit API blocks anonymous calls (403) — WebSearch `site:reddit.com/r/homeassistant <terms>` |
| Feature Requests | https://github.com/orgs/home-assistant/discussions | daily | Regular Github Discussions|
| Architecture | https://github.com/home-assistant/architecture/discussions | daily | Regular Github discussions |

## Manual checks

Places agents can't read (login walls, chat apps). Due checks go on the rolling forums hq issue
for the area (`<area>: forum replies and manual checks`). Cadence as above. See also [Home Assistant Help](https://www.home-assistant.io/help/) for more support and discussion links.

| Community | URL | Cadence | What to look for |
|---|---|---|---|
| Home Assistant Discord | https://www.home-assistant.io/join-chat | weekly | product names in #custom-integrations, #notifications |
