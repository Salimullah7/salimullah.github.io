import type { APIRoute } from 'astro';
import { pathTo } from '../lib/paths';
export const GET: APIRoute = ({ site }) => new Response(`User-agent: *\nAllow: /\nSitemap: ${new URL(pathTo('sitemap.xml'), site).href}\n`);
