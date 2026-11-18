---
group: python
summary: Preferred Python packages for new projects, with an exemplar repo and accepted alternatives.
---

# Python Stack

Preferred packages for Python projects, to be used in new projects, and existing projects compared against it in architecture reviews.

| Function      | Package         | Exemplar     | Alternatives by Exception |
| ------------- | ---------       | ------------ | ------------------------- |
| Configuration | pydantic        | anpr2mqtt    | OmegaConf/Hydra           |
| HTTP Client   | niquests        | anpr2mqtt    | httpx2                    |
| HTTP Caching  | niquests-cache  | anpr2mqtt    | hishel                    |
| CLI           | pydantic        | anpr2mqtt    | click                     |
| Logging       | structlog       | updates2mqtt | logging (built-in)        |
| Pretty Print  | rich            | updates2mqtt |                           |
| MQTT          | paho            | updates2mqtt |                           |
| Testing       | pytest          | supernotify  |                           |
| Linting       | ruff            |              |                           |
| Packaging     | uv              |              |                           |
| Typing        | mypy            |              | ty (parallel trial)       |
| Documentation | properdocs      | supernotify  | zensical                  |

