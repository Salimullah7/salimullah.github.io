import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { load } from 'cheerio';

export const projectDirectory = fileURLToPath(new URL('../', import.meta.url));
export const distDirectory = path.join(projectDirectory, 'dist');
export const qaDirectory = path.resolve(projectDirectory, '..', 'qa');
export const validationOrigin = 'https://portfolio-validation.invalid';

export function normalizeBasePath(value = process.env.BASE_PATH || '/') {
  if (!value.startsWith('/') || value.startsWith('//') || /[?#\\]/u.test(value)) {
    throw new Error('BASE_PATH must be an absolute URL path, such as / or /portfolio/.');
  }
  const normalized = new URL(value, validationOrigin).pathname;
  return `${normalized.replace(/\/+$/u, '')}/`;
}

export function routeForFile(file, basePath = normalizeBasePath()) {
  const relative = path.relative(distDirectory, file).split(path.sep).join('/');
  const route = relative.replace(/(^|\/)index\.html$/iu, '$1');
  return basePath + route.split('/').map(encodeURIComponent).join('/');
}

export async function discoverHtml(directory = distDirectory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((first, second) => first.name.localeCompare(second.name))) {
    const location = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await discoverHtml(location));
    else if (entry.isFile() && /\.html$/iu.test(entry.name)) files.push(location);
  }
  return files;
}

async function isFile(location) {
  try {
    return (await stat(location)).isFile();
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false;
    throw error;
  }
}

async function resolveTarget(url, basePath) {
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    throw new Error(`Invalid URL encoding in path: ${url.pathname}`);
  }
  const decodedBase = decodeURIComponent(basePath);
  const baseRoot = decodedBase.replace(/\/$/u, '');
  if (pathname !== baseRoot && !pathname.startsWith(decodedBase)) {
    throw new Error(`Local URL is outside BASE_PATH ${basePath}: ${url.pathname}`);
  }
  const relative = pathname === baseRoot ? '' : pathname.slice(decodedBase.length);
  if (relative.includes('\\') || relative.includes('\0')) throw new Error('Invalid local URL path.');
  const target = path.resolve(distDirectory, relative);
  const withinDist = path.relative(distDirectory, target);
  if (withinDist === '..' || withinDist.startsWith(`..${path.sep}`) || path.isAbsolute(withinDist)) {
    throw new Error('Local URL escapes dist/.');
  }
  if (!pathname.endsWith('/') && await isFile(target)) return target;
  const index = path.join(target, 'index.html');
  if (await isFile(index)) return index;
  throw new Error(`Missing local path: ${url.pathname}`);
}

function idsIn($) {
  return new Set($('[id], a[name]').toArray().flatMap(element => [
    $(element).attr('id'),
    element.tagName?.toLowerCase() === 'a' ? $(element).attr('name') : undefined,
  ]).filter(Boolean));
}

export async function validateSite() {
  const basePath = normalizeBasePath();
  const files = await discoverHtml();
  if (files.length === 0) throw new Error('dist/ contains no HTML. Build the static site first.');
  const documents = new Map();
  const origins = new Set([validationOrigin]);
  if (process.env.SITE_URL) origins.add(new URL(process.env.SITE_URL).origin);
  for (const file of files) {
    const $ = load(await readFile(file, 'utf8'));
    documents.set(file, { $, ids: idsIn($) });
    for (const element of $('link[rel~="canonical"][href]').toArray()) {
      try {
        origins.add(new URL($(element).attr('href')).origin);
      } catch {
        continue;
      }
    }
  }
  const results = [];
  let referencesChecked = 0;
  const targetCache = new Map();
  const fragmentCache = new Map([...documents].map(([file, document]) => [file, document.ids]));
  for (const [file, { $, ids }] of documents) {
    const route = routeForFile(file, basePath);
    const issues = [];
    const require = (condition, message) => { if (!condition) issues.push(message); };
    require($('h1').length === 1, `Expected one h1; found ${$('h1').length}.`);
    require($('h1').text().trim().length > 0, 'h1 must contain text.');
    require($('head title').length === 1 && $('head title').text().trim().length > 0, 'Expected one nonempty document title.');
    const descriptions = $('head meta').filter((_index, element) => ($(element).attr('name') || '').toLowerCase() === 'description');
    require(descriptions.length === 1 && (descriptions.attr('content') || '').trim().length > 0, 'Expected one nonempty meta description.');
    require(($('html').attr('lang') || '').trim().length > 0, 'html must declare a nonempty lang.');
    const mains = $('main, [role="main"]');
    require(mains.length === 1, `Expected one main landmark; found ${mains.length}.`);
    require($('nav, [role="navigation"]').length > 0, 'Expected a navigation landmark.');
    const seenIds = new Set();
    for (const element of $('[id]').toArray()) {
      const id = $(element).attr('id');
      if (id && seenIds.has(id)) issues.push(`Duplicate id makes fragment targeting ambiguous: ${id}`);
      seenIds.add(id);
    }
    const pageUrl = new URL(route, validationOrigin);
    let documentUrl = pageUrl;
    const baseHref = $('base[href]').first().attr('href');
    if (baseHref !== undefined) {
      try {
        documentUrl = new URL(baseHref, pageUrl);
      } catch {
        issues.push(`Invalid base href: ${baseHref}`);
      }
    }
    for (const element of $('[href], [src]').toArray()) {
      for (const attribute of ['href', 'src']) {
        const raw = $(element).attr(attribute);
        if (raw === undefined) continue;
        const value = raw.trim();
        const label = `${element.tagName}[${attribute}=${JSON.stringify(raw)}]`;
        if (/^javascript:/iu.test(value)) {
          issues.push(`Unsafe script URL: ${label}`);
          continue;
        }
        if (value === '' && attribute === 'src') {
          issues.push(`Empty resource URL: ${label}`);
          continue;
        }
        let url;
        try {
          url = new URL(value, documentUrl);
        } catch {
          issues.push(`Invalid URL: ${label}`);
          continue;
        }
        if (!['http:', 'https:'].includes(url.protocol) || !origins.has(url.origin)) continue;
        referencesChecked += 1;
        try {
          let target = targetCache.get(url.pathname);
          if (!target) {
            target = await resolveTarget(url, basePath);
            targetCache.set(url.pathname, target);
          }
          const encodedFragment = url.hash.slice(1).split(':~:')[0];
          if (!encodedFragment || !/\.(html|svg)$/iu.test(target)) continue;
          const fragment = decodeURIComponent(encodedFragment);
          let targetIds = target === file ? ids : fragmentCache.get(target);
          if (!targetIds) {
            targetIds = idsIn(load(await readFile(target, 'utf8'), { xmlMode: /\.svg$/iu.test(target) }));
            fragmentCache.set(target, targetIds);
          }
          const implicitTop = /^top$/iu.test(fragment) && /\.html$/iu.test(target);
          require(targetIds.has(fragment) || implicitTop, `Missing hash anchor #${fragment} in ${url.pathname}: ${label}`);
        } catch (error) {
          issues.push(`${error.message}: ${label}`);
        }
      }
    }
    results.push({ route, file: path.relative(projectDirectory, file), issues });
  }
  return { basePath, pageCount: files.length, referencesChecked, results };
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    const report = await validateSite();
    const failures = report.results.flatMap(result => result.issues.map(issue => `${result.route}: ${issue}`));
    for (const failure of failures) console.error(`FAIL ${failure}`);
    console.log(`Static validation: ${report.pageCount} HTML pages, ${report.referencesChecked} local href/src references, BASE_PATH=${report.basePath}, ${failures.length} failures.`);
    if (failures.length) process.exitCode = 1;
  } catch (error) {
    console.error(`Static validation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
