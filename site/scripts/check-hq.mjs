#!/usr/bin/env node
// Mechanical consistency checks on the hq docs (policies/scripts_over_agents.md): every process has a
// skill, persona, schedule, environment and report visibility that agree; every skill is in a cadence
// file; every project has a summary; no broken headings. Exits 1 if anything is wrong.
// Run with `mise run check-hq`; the site build prints the same problems as warnings.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkHq } from './lib/hq-docs.mjs';

const hqRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const problems = await checkHq(hqRoot);
for (const p of problems) console.log(p);
console.log(problems.length ? `${problems.length} problem(s)` : 'hq docs: all checks pass');
process.exit(problems.length ? 1 : 0);
