import assert from 'node:assert/strict';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { discoverHtml, normalizeBasePath, projectDirectory, qaDirectory, routeForFile } from './check-site.mjs';

const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
];
const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];
const report = {
  schemaVersion: 1,
  startedAt: new Date().toISOString(),
  configuration: { previewUrl: process.env.PREVIEW_URL || 'http://127.0.0.1:4321', viewports, wcagTags },
  artifacts: [],
  results: [],
};
let browser;

async function check(result, name, action) {
  try {
    const details = await action();
    result.checks.push({ name, passed: true, ...(details === undefined ? {} : { details }) });
    return true;
  } catch (error) {
    result.checks.push({ name, passed: false, error: error.message });
    console.error(`FAIL ${result.viewport} ${result.route}: ${name}: ${error.message}`);
    return false;
  }
}

async function auditAccessibility(page, result, state) {
  await check(result, `WCAG accessibility: ${state}`, async () => {
    const audit = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
    const simplify = rules => rules.map(({ id, impact, description, help, helpUrl, tags, nodes }) => ({
      id, impact, description, help, helpUrl, tags,
      nodes: nodes.map(({ target, html, failureSummary }) => ({ target, html, failureSummary })),
    }));
    result.accessibility ??= [];
    result.accessibility.push({ state, violations: simplify(audit.violations), incomplete: simplify(audit.incomplete), passedRules: audit.passes.length });
    assert.equal(audit.violations.length, 0, audit.violations.map(rule => `${rule.id}: ${rule.nodes.map(node => node.target.join(' ')).join(', ')}`).join('; '));
  });
}

async function auditOverflow(page, result, state) {
  await check(result, `No horizontal overflow: ${state}`, async () => {
    const measurement = await page.evaluate(() => {
      const width = document.documentElement.clientWidth;
      const scrollWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
      const elements = [...document.querySelectorAll('body *')].filter(element => {
        const bounds = element.getBoundingClientRect();
        return bounds.width > 0 && (bounds.left < -1 || bounds.right > width + 1);
      }).slice(0, 10).map(element => ({
        tag: element.tagName.toLowerCase(), id: element.id, class: element.getAttribute('class'),
        left: element.getBoundingClientRect().left, right: element.getBoundingClientRect().right,
      }));
      return { viewportWidth: width, scrollWidth, elements };
    });
    result.overflow ??= [];
    result.overflow.push({ state, ...measurement });
    assert.ok(measurement.scrollWidth <= measurement.viewportWidth + 1, JSON.stringify(measurement));
    return { viewportWidth: measurement.viewportWidth, scrollWidth: measurement.scrollWidth };
  });
}

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function screenshot(page, filename) {
  const destination = path.join(qaDirectory, filename);
  await page.screenshot({ path: destination, fullPage: true, animations: 'disabled' });
  report.artifacts.push({ type: 'screenshot', path: destination });
}

async function exerciseHome(page, result, preview, basePath) {
  await check(result, 'Keyboard skip link reaches the main content', async () => {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const element = document.activeElement;
      const bounds = element.getBoundingClientRect();
      return { tag: element.tagName, href: element.getAttribute('href'), text: element.textContent, left: bounds.left, top: bounds.top, right: bounds.right, bottom: bounds.bottom, width: innerWidth, height: innerHeight };
    });
    assert.equal(focused.tag, 'A');
    assert.match(focused.text, /skip/iu);
    assert.match(focused.href || '', /^#[^#]+$/u);
    assert.ok(focused.top >= 0 && focused.left >= 0 && focused.right <= focused.width && focused.bottom <= focused.height, `Focused skip link is outside the viewport: ${JSON.stringify(focused)}`);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.activeElement?.matches('main, [role="main"]'));
  });
  await check(result, 'Main navigation opens research', async () => {
    const target = new URL(`${basePath}research/`, preview).href;
    await Promise.all([
      page.waitForURL(url => url.origin === new URL(target).origin && url.pathname === new URL(target).pathname),
      page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name: 'Research', exact: true }).click(),
    ]);
    assert.equal(await page.locator('h1').count(), 1);
    assert.ok((await page.locator('h1').innerText()).trim().length > 0);
  });
}

async function exerciseLab(page, result) {
  const input = page.locator('#csv-input');
  const run = page.locator('#run-sandbox');
  const reset = page.locator('#reset-sandbox');
  const download = page.locator('#download-results');
  const status = page.locator('#lab-status');
  const output = page.locator('#lab-output');
  let initial;
  await check(result, 'Lab starts with the documented synthetic sample', async () => {
    initial = await input.inputValue();
    assert.match(initial, /MEM-001,Avery Morgan,avery\.morgan@example\.test,renew/u);
    assert.equal(initial.trim().split(/\r?\n/u).length, 5);
    assert.ok(await download.isDisabled());
    assert.equal((await output.textContent()).trim(), '');
  });
  await check(result, 'Sample yields 1 created, 1 renewed, and 2 rejected with reconciled rows', async () => {
    await run.click();
    await page.waitForFunction(() => document.querySelectorAll('#lab-output tbody tr').length === 4);
    assert.deepEqual(await output.locator('.result-summary span').allTextContents(), ['1 created', '1 renewed', '2 rejected']);
    const rows = await output.locator('tbody tr').evaluateAll(elements => elements.map(element => [...element.cells].map(cell => cell.textContent)));
    assert.deepEqual(rows.map(row => row[0]), ['2', '3', '4', '5']);
    assert.deepEqual(rows.map(row => row[3]), ['renewed', 'created', 'rejected', 'rejected']);
    assert.deepEqual(rows[0].slice(1, 3), ['MEM-001', 'Avery Morgan']);
    assert.match(rows[2][4], /duplicate/iu);
    assert.match(rows[3][4], /email/iu);
    assert.match(await status.innerText(), /1 created, 1 renewed, 2 rejected/u);
    assert.ok(rows.every(row => row[4].trim().length > 0));
    assert.ok(await download.isEnabled());
  });
  await auditAccessibility(page, result, 'lab sample results');
  await auditOverflow(page, result, 'lab sample results');
  await check(result, 'Malformed CSV reports an error and clears stale downloadable results', async () => {
    await input.fill('member_id,name,email,action\nMEM-900,"Unterminated name,qa@example.test,create');
    await run.click();
    await page.waitForFunction(() => /malformed|unterminated/iu.test(document.querySelector('#lab-status')?.textContent || ''));
    assert.equal((await output.textContent()).trim(), '');
    assert.ok(await download.isDisabled());
  });
  await auditAccessibility(page, result, 'lab malformed input');
  await check(result, 'Reset restores the sample, clears output, and disables download', async () => {
    await reset.click();
    assert.ok(initial, 'Initial sample was not available.');
    assert.equal(await input.inputValue(), initial);
    assert.equal((await output.textContent()).trim(), '');
    assert.ok(await download.isDisabled());
    assert.match(await status.innerText(), /reset/iu);
  });
  await check(result, 'Download contains all four sample outcomes and correct counts', async () => {
    await run.click();
    const [artifact] = await Promise.all([page.waitForEvent('download'), download.click()]);
    assert.match(artifact.suggestedFilename(), /\.json$/iu);
    const destination = path.join(qaDirectory, `lab-results-${result.viewport}.json`);
    await artifact.saveAs(destination);
    assert.equal(await artifact.failure(), null);
    report.artifacts.push({ type: 'lab-download', path: destination });
    const downloaded = JSON.parse(await readFile(destination, 'utf8'));
    assert.deepEqual(downloaded.counts, { created: 1, renewed: 1, rejected: 2 });
    assert.equal(downloaded.outcomes.length, 4);
    assert.deepEqual(downloaded.outcomes.map(row => row.status), ['renewed', 'created', 'rejected', 'rejected']);
    assert.equal(Object.values(downloaded.counts).reduce((total, count) => total + count, 0), downloaded.outcomes.length);
    assert.ok(downloaded.outcomes.every(row => row.memberId && row.name && row.reason));
  });
  await check(result, 'HTML in CSV is displayed as literal text without creating elements or executing code', async () => {
    const memberId = '<svg onload="window.__portfolioQaInjected=true">';
    const name = '<img src="/__qa_payload__" onerror="window.__portfolioQaInjected=true"><script>window.__portfolioQaInjected=true</script>';
    const quote = value => `"${value.replaceAll('"', '""')}"`;
    await page.evaluate(() => { window.__portfolioQaInjected = false; });
    await input.fill(`member_id,name,email,action\n${quote(memberId)},${quote(name)},qa@example.test,create`);
    await run.click();
    await page.waitForFunction(() => document.querySelectorAll('#lab-output tbody tr').length === 1);
    const cells = await output.locator('tbody tr').first().locator('td').allTextContents();
    assert.equal(cells[1], memberId);
    assert.equal(cells[2], name);
    assert.equal(cells[3], 'created');
    assert.equal(await output.locator('img, script, svg, iframe, object').count(), 0);
    assert.equal(await page.evaluate(() => window.__portfolioQaInjected), false);
  });
  await auditAccessibility(page, result, 'lab literal HTML results');
  await auditOverflow(page, result, 'lab literal HTML results');
  await check(result, 'Lab remains resettable after HTML input', async () => {
    await reset.click();
    assert.equal(await input.inputValue(), initial);
    assert.ok(await download.isDisabled());
    assert.equal((await output.textContent()).trim(), '');
  });
}

try {
  await mkdir(qaDirectory, { recursive: true });
  const basePath = normalizeBasePath();
  const preview = new URL(report.configuration.previewUrl);
  assert.ok(['http:', 'https:'].includes(preview.protocol), 'PREVIEW_URL must use HTTP or HTTPS.');
  const files = await discoverHtml();
  assert.ok(files.length > 0, 'dist/ contains no HTML. Build the static site first.');
  const routes = files.map(file => ({ file, route: routeForFile(file, basePath) }));
  const homeRoute = basePath;
  const labRoute = `${basePath}lab/`;
  const caseRoute = routes.find(entry => entry.route === `${basePath}work/renewal-engine/`)?.route
    || routes.find(entry => entry.route.startsWith(`${basePath}work/`) && entry.route !== `${basePath}work/`)?.route;
  for (const required of [homeRoute, labRoute, `${basePath}research/`]) {
    assert.ok(routes.some(entry => entry.route === required), `Required route not found in dist/: ${required}`);
  }
  assert.ok(caseRoute, 'No case-study route found in dist/.');
  let executablePath = process.env.CHROME_PATH;
  if (!executablePath) {
    const defaultChrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
    try { await access(defaultChrome); executablePath = defaultChrome; } catch { executablePath = undefined; }
  }
  report.configuration = { ...report.configuration, basePath, executablePath: executablePath || chromium.executablePath(), routeCount: routes.length };
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  report.browserVersion = browser.version();
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, isMobile: viewport.name === 'mobile', hasTouch: viewport.name === 'mobile', acceptDownloads: true, reducedMotion: 'reduce' });
    context.setDefaultTimeout(15_000);
    context.setDefaultNavigationTimeout(30_000);
    for (const { file, route } of routes) {
      const url = new URL(route, preview).href;
      const result = { route, file: path.relative(projectDirectory, file), viewport: viewport.name, url, checks: [] };
      report.results.push(result);
      const page = await context.newPage();
      const diagnostics = { consoleErrors: [], pageErrors: [], failedRequests: [], httpErrors: [], expectedNotFoundResponses: [] };
      const notFound = /(^|\/)404(?:\.html|\/$)/u.test(route);
      page.on('console', message => { if (message.type() === 'error') diagnostics.consoleErrors.push({ text: message.text(), location: message.location() }); });
      page.on('pageerror', error => diagnostics.pageErrors.push(error.stack || error.message));
      page.on('requestfailed', request => diagnostics.failedRequests.push({ url: request.url(), method: request.method(), error: request.failure()?.errorText }));
      page.on('response', response => {
        if (response.status() < 400) return;
        const entry = { url: response.url(), status: response.status(), resourceType: response.request().resourceType() };
        if (notFound && response.status() === 404 && response.url() === url && response.request().isNavigationRequest() && response.frame() === page.mainFrame()) diagnostics.expectedNotFoundResponses.push(entry);
        else diagnostics.httpErrors.push(entry);
      });
      const loaded = await check(result, 'Route loads successfully', async () => {
        const response = await page.goto(url, { waitUntil: 'networkidle' });
        assert.ok(response, 'Navigation returned no response.');
        result.httpStatus = response.status();
        assert.ok(response.ok() || (notFound && response.status() === 404), `HTTP ${response.status()} at ${page.url()}`);
        const actual = new URL(page.url());
        assert.equal(actual.origin, preview.origin);
        assert.equal(actual.pathname, new URL(url).pathname, `Unexpected redirect to ${page.url()}`);
        await settle(page);
        assert.equal(await page.locator('h1').count(), 1);
        assert.equal(await page.getByRole('main').count(), 1);
      });
      if (loaded) {
        await auditAccessibility(page, result, 'initial page');
        await auditOverflow(page, result, 'initial page');
        if (route === homeRoute || (route === caseRoute && viewport.name === 'desktop')) {
          await check(result, 'Save review screenshot', () => screenshot(page, route === homeRoute ? `home-${viewport.name}.png` : 'case-desktop.png'));
        }
        if (route === labRoute) await exerciseLab(page, result);
        if (route === homeRoute) await exerciseHome(page, result, preview, basePath);
      }
      await page.close();
      if (diagnostics.expectedNotFoundResponses.length) {
        const expected = diagnostics.consoleErrors.filter(entry => entry.location.url === url && /^Failed to load resource:.*\b404\b/iu.test(entry.text));
        diagnostics.consoleErrors = diagnostics.consoleErrors.filter(entry => !expected.includes(entry));
        diagnostics.expectedNotFoundConsoleErrors = expected;
      }
      result.diagnostics = diagnostics;
      await check(result, 'No console errors, uncaught errors, failed requests, or unexpected HTTP errors', async () => {
        const failures = Object.fromEntries(['consoleErrors', 'pageErrors', 'failedRequests', 'httpErrors'].map(key => [key, diagnostics[key]]));
        assert.ok(Object.values(failures).every(entries => entries.length === 0), JSON.stringify(failures));
      });
      console.log(`${result.checks.every(entry => entry.passed) ? 'PASS' : 'FAIL'} ${viewport.name} ${route}`);
    }
    await context.close();
  }
} catch (error) {
  report.fatalError = { message: error.message, stack: error.stack };
  console.error(`Browser validation failed: ${error.message}`);
} finally {
  if (browser) {
    try { await browser.close(); } catch (error) { report.cleanupError = error.message; }
  }
  report.finishedAt = new Date().toISOString();
  const checks = report.results.flatMap(result => result.checks);
  report.summary = { passed: !report.fatalError && !report.cleanupError && checks.length > 0 && checks.every(entry => entry.passed), routeCount: report.configuration.routeCount || 0, pageViewportRuns: report.results.length, checks: checks.length, failedChecks: checks.filter(entry => !entry.passed).length };
  if (!report.summary.passed) process.exitCode = 1;
  await mkdir(qaDirectory, { recursive: true });
  const destination = path.join(qaDirectory, 'browser-report.json');
  await writeFile(destination, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Browser validation: ${report.summary.routeCount} routes, ${report.summary.pageViewportRuns} page/viewport runs, ${report.summary.failedChecks} failed checks. Report: ${destination}`);
}
