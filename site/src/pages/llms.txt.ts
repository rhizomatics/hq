// llms.txt (https://llmstxt.org): a plain index of the site for language models, built from the same docs
// collection and generated pages as the sidebar, so it never needs editing by hand.
import { getCollection } from 'astro:content';
import { ORG } from '../lib/hq-config.mjs';

const url = (p: string) => `${ORG.siteUrl}/${p.replace(/^\/|\/$/g, '')}${p === '/' ? '' : '/'}`;

// Pages built from src/pages rather than the docs collection.
const PAGES: [string, string, string][] = [
  ['Releases', 'releases', 'New features and important fixes in the last month, summarised (RSS: /releases.xml).'],
  ['Usage', 'usage', 'Downloads, installs and GitHub figures per component.'],
  ['Community', 'community', 'Projects other people build on our products.'],
  ['Design Process', 'design', 'How changes are proposed and decided; RFCs, roadmaps and design principles.'],
  ['RFCs', 'rfcs', 'Open and decided requests for comments.'],
  ['Support', 'support', 'Open issues by type across the products.'],
  ['Deployments', 'deployments', 'GitHub Actions state of each public repo.'],
  ['Security', 'security', 'Public security settings and published advisories.'],
];

const SECTIONS: [string, string][] = [
  ['projects', 'Projects'],
  ['processes', 'Processes'],
  ['policies', 'Policies'],
  ['reference', 'Reference'],
  ['reports', 'Reports'],
];

export async function GET() {
  const docs = (await getCollection('docs')).filter((d) => d.id !== 'index');
  const line = (title: string, href: string, desc?: string) => `- [${title}](${href})${desc ? `: ${desc.replace(/\s+/g, ' ').trim()}` : ''}`;
  const out = [
    `# ${ORG.name} HQ`,
    '',
    `> How the ${ORG.name} open source projects are run, and how much they are used: one human maintainer and a team of AI agent personas working to written policies and processes.`,
    '',
    '## Pages',
    '',
    ...PAGES.map(([t, p, d]) => line(t, url(p), d)),
  ];
  const team = docs.find((d) => d.id === 'team');
  if (team) out.push(line(team.data.title, url('team'), team.data.description));
  for (const [dir, heading] of SECTIONS) {
    const items = docs.filter((d) => d.id.startsWith(`${dir}/`) || d.id === dir).sort((a, b) => a.id.localeCompare(b.id));
    if (!items.length) continue;
    out.push('', `## ${heading}`, '', ...items.map((d) => line(d.data.title, url(d.id), d.data.description)));
  }
  out.push('', '## Optional', '', line('Source', `https://github.com/${ORG.github}/${ORG.hqRepo}`, 'the docs and site source'), '');
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
