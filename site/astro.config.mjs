// @ts-check
import { readFileSync } from 'node:fs';
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import { FAMILIES } from './src/lib/families.mjs';

// Usage pages are listed in the sidebar by family; stats.json is built before Astro runs.
function usageSidebar() {
  let components = [];
  try {
    components = JSON.parse(readFileSync(new URL('./src/data/stats.json', import.meta.url), 'utf8')).components;
  } catch {
    // No stats yet (e.g. `astro dev` before `npm run stats`): the overview link still works.
  }
  const groups = FAMILIES.map(([family, label]) => ({
    label,
    collapsed: true,
    items: components.filter((c) => c.family === family).map((c) => ({ label: c.id, link: `/usage/${c.id}/` })),
  })).filter((g) => g.items.length);
  return [{ label: 'All components', link: '/usage/' }, ...groups];
}

export default defineConfig({
  site: 'https://hq.rhizomatics.org.uk',
  trailingSlash: 'always',
  integrations: [
    starlight({
      title: 'Rhizomatics HQ',
      description: 'How the Rhizomatics open source projects are run, and how much they are used.',
      logo: { src: './src/assets/icon.svg' },
      favicon: '/favicon.svg',
      head: [{ tag: 'meta', attrs: { property: 'og:image', content: 'https://hq.rhizomatics.org.uk/og.png' } }],
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/rhizomatics' }],
      customCss: ['./src/styles/site.css'],
      lastUpdated: false,
      sidebar: [
        { label: 'Usage', items: usageSidebar() },
        { label: 'Workflows', link: '/actions/' },
        { label: 'RFCs', link: '/rfcs/' },
        { label: 'Projects', collapsed: true, items: [{ autogenerate: { directory: 'projects' } }] },
        { label: 'Processes', collapsed: true, items: [{ autogenerate: { directory: 'processes' } }] },
        { label: 'Policies', collapsed: true, items: [{ autogenerate: { directory: 'policies' } }] },
        { label: 'Reference', collapsed: true, items: [{ autogenerate: { directory: 'reference' } }] },
        { label: 'Team', link: '/team/' },
        { label: 'Reports', collapsed: true, items: [{ autogenerate: { directory: 'reports' } }] },
      ],
    }),
  ],
});
