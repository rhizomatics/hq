<img src="assets/icon.svg" alt="" width="96" align="right">

# Rhizomatics HQ

How the [Rhizomatics](https://github.com/rhizomatics) open source projects are run: one human maintainer, a team of AI agent personas doing the routine work on a schedule, reusing and supplementing product skills.

- [processes/](processes/) — the recurring routines (daily to quarterly) and who runs them
- [.claude/skills/](.claude/skills/) and [.claude/agents/](.claude/agents/) — each process as a
  Claude Code skill, and the personas that run them ([team.md](team.md))
- [policies/](policies/) — cross-project policies, such as supported Python and Home Assistant versions
- [reference/](reference/) — the standards every project should meet, and where users talk about the products
- [projects/](projects/) — work in progress and ideas
- [products.toml](products.toml) — every product, its repos and where it's published; [hq.toml](hq.toml) the org, product lines and platforms; [community.toml](community.toml) projects built on ours

Reports, metrics and the maintainer's to-do list live in a private companion repo. Analytics are supplied by https://rhizomatics.goatcounter.com

## Lessons Learned

### Use GitHub Objects Selectively
Using `Project` wasn't useful, neither was `Discussion`. However early on `Issue` became a good way to assign tasks to the human maintainer, such as decisions needed (and reduced the need to ever look at docs, see below).

One issue with Issue is that if an agent creates it under owner's account, it won't generate a notification, so doesn't show in inbox or GitHub phone app. A work around for this is to get a comment tagging the human automated after issue raised.

### Building a Bureaucracy
Its easy to recreate a human bureaucracy, agents turning out lots of wordy detailed documents that nobody reads, which is far too much deja vu for me to cope with.

This was replaced by a much tighter focus on actionable results - all of the regular routines should primarily result in a PR for something that probably needs done, or an Issue where the maintainer needs to make a decision or do something agent can't. In this mode, reports become an exception, done where there's a need either for additional detail, or proof of work for important tasks like security review where otherwise there'd be no bread trail outside of the agent's own logs.

### Routine Sprawl

Its easy to keep adding daily, weekly, monthly routines however that then becomes a maintenance issue of its own, especially for current Claude where each routine needs its own list of repos set.

That was improved by having one routine per person per period used, so tasks could be combined as far as made sense.

### Retain Structured Data

Agentic use generally liberates from the need for YAML or TOML everywhere, since they'll handle unstructued data and config. However, that makes it harder to then use scripts with the same data.

### Offload Repetitive Work from Agents

Like humans, agents aren't ideal for repetitive, routine work - its wasteful of tokens and they're not as reliable as a script. Some tasks start as requiring intelligence and then become routine.
Move as much work to scripts, static site generator features, github facilities and similar, and use regular automated review to drive this.

### Reuse Selectively
Its easy to have skills to do everything, however there may be better skills already out there, written with the help of people who know more about the domain and refined by a much larger community of use. 

 Security auditing is a good example, where skills developed by cyber security experts working with agents are likely to outperform what a non-expert and agent produce.

[Github Agentic Workflows](https://github.github.com/gh-aw/) is an example of being selective, it seemed appropriate and HQ was reinventing some wheels, however in practice it used up lots of API tokens and didn't have much relevance for this size of organization.

Focus on selecting the best specialists, and keeping watch over their performance, obsolesence, better alternatives and gaps that might need other reusable skills, or new skills owned by the HQ.

## Related

- [HQ site](https://hq.rhizomatics.org.uk/), with [usage stats](https://hq.rhizomatics.org.uk/usage/) for every component
- [NPM Stats](https://www.packfolio.dev/?q=%40rhizomatics)
- [Public Site](https://www.rhizomatics.org.uk)
