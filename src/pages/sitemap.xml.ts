import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { pathTo } from '../lib/paths';
export const GET: APIRoute = async ({ site }) => {
  const routes = ['', 'work/', 'research/', 'lab/', 'writing/', 'about/', 'recognition/', 'contact/', 'evidence/'];
  for (const entry of await getCollection('work')) routes.push(`work/${entry.id}/`);
  for (const entry of await getCollection('writing')) routes.push(`writing/${entry.id}/`);
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(route => `<url><loc>${new URL(pathTo(route), site).href}</loc></url>`).join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml' } });
};
