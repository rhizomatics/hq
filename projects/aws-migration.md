---
title: Move Rhizomatics infrastructure to its own AWS account
status: draft
lead: infra-lead
owner: jeyrb
started: 2026-10-14
---

## Goal

Everything Rhizomatics runs on AWS lives in the dedicated Rhizomatics AWS account, with nothing
left in the personal account, no long-lived access keys, and the setup described as code in this
repo so it can be rebuilt and reviewed.

## Context

- New Rhizomatics AWS account: created, nothing else done.
- Personal account is the current home; what Rhizomatics uses there is not yet inventoried.
- Likely candidates to check (unconfirmed): Route53 zones/records for project docs domains
  (several repos have a `CNAME`, so docs are probably on GitHub Pages with DNS in Route53),
  S3 buckets, CloudFront, SES/SNS, IAM users or keys used by GitHub Actions, budgets/billing alerts.

## Plan

### Phase 0: access
- [ ] @human Enable IAM Identity Center (or root MFA + an admin role) in the Rhizomatics account; decide whether it joins an AWS Organization with the personal account (makes billing and cross-account moves easier)
- [ ] @human Set up a local `rhizomatics` CLI profile via `aws configure sso`; refresh personal-account login
- [ ] @human Grant agents a **read-only** profile on both accounts for inventory (e.g. `ReadOnlyAccess` + `aws configure sso` session)

### Phase 1: inventory (personal account)
- [ ] @agent List all resources across regions (Resource Explorer / `aws resourcegroupstaggingapi`, plus Route53, IAM, S3, CloudFront, ACM, SES, Lambda, budgets) into `hq-private/projects/aws-migration/inventory.md` (private: resource names and account details)
- [ ] @pair Classify each resource: Rhizomatics / personal / unknown
- [ ] @agent Find every consumer of those resources: grep Rhizomatics repos' workflows and secrets names (`gh secret list`), DNS records pointed at by docs CNAMEs, IAM keys' last-used dates

### Phase 2: design target
- [ ] @pair Decide IaC tool (OpenTofu/Terraform vs CDK vs plain CLI scripts) and state storage
- [ ] @pair GitHub Actions → AWS via OIDC roles scoped per repo, replacing any access keys
- [ ] @pair Budgets and billing alerts in the new account

### Phase 3: migrate (per resource, lowest risk first)
- [ ] @pair Route53: recreate zones in new account, lower TTLs, switch registrar NS, verify, then delete old zones
- [ ] @pair S3 / others: copy, cut over consumers, verify, then retire
- [ ] @pair Rotate and delete any old IAM users/keys

### Phase 4: close out
- [ ] @agent Confirm nothing Rhizomatics-tagged or referenced remains in the personal account
- [ ] @human Final review; set `status: done`

## Decisions

_None yet._

## Log

- 2026-10-14 — Project created. Rhizomatics AWS account exists; inventory blocked on Phase 0 credentials.
- 2026-10-23 — project-review: hq-private#20 (Phase 0 access) was closed by jeyrb on 2026-10-16 with no comment. Phase 0 boxes left unticked until confirmed; no AWS CLI or profile in the cloud routine environment, so Phase 1 inventory is `@pair` for now. See hq-private#33.
