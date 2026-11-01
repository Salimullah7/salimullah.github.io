# Md. Salimullah Human Systems Portfolio

An accessible static Astro and TypeScript portfolio covering data engineering, technical integration work, research, recognition, writing, and an original browser-based membership processing lab.

## Run locally

Use Node.js 24 and npm. Run `npm ci`, then `npm run dev`. The site is served at the local URL printed by Astro.

## Validate and publish

Run `npm run check`, `npm test`, `npm run build`, and `npm run test:site`. Start `npm run preview` before `npm run test:browser`. Browser tests use Playwright Chromium or the browser executable specified in `CHROME_PATH`. They check every generated route on desktop and mobile, WCAG A/AA rules with axe, overflow, navigation, and sandbox behaviour. Automated accessibility checks do not replace a full assistive-technology audit.

The GitHub Pages workflow builds from source, runs checks, and uploads `dist`. Configure repository Pages to use GitHub Actions if it is currently publishing from a branch. `SITE_URL` controls the canonical origin and `BASE_PATH` supports a repository subpath; the supplied workflow targets the account homepage.

## Content and route headers

The navigation header has six destinations: Work explains engineering and integration contributions; Research separates published work, experimental work and intended interests; Lab contains independent demonstrations; Writing contains technical notes; About provides biography and career progression; Let's talk opens Contact. Recognition and the evidence policy are linked from the footer. Each page has one H1 naming its subject; H2 sections form a readable outline. Case study section links are generated from those headings so they remain trackable when content changes.

Case studies live in `src/content/work`. Their frontmatter fields are validated in `src/content.config.ts`: `title` names the engineering problem, `description` summarises it, `category` groups the work, `role` states personal responsibility, `status` labels the evidence and delivery stage, `order` controls sequence, `featured` selects homepage work, `stack` supplies context, and `diagram` selects a sanitised conceptual workflow. Writing entries use `title`, `description`, `date` and `category`.

Contact details are maintained in `src/data/profile.ts`. Integration contribution summaries are in `src/data/integrations.ts`. Public diagrams are semantic HTML and CSS with captions and step descriptions; they are conceptual reconstructions, not customer architecture. The abstract homepage SVG is decorative and hidden from assistive technology.

## Evidence and release boundaries

The public content is based on the supplied 1 November 2026 master dossier and the available professional conversation history. No earlier Astro files were present in this local workspace; the earlier scaffold is not claimed as recovered or modified. Historical Figma concepts were reviewed as unapproved references, and the present request authorises a fresh implementation and publishing.

The private dossier and audits are excluded from this repository. Customer names are anonymised in case studies. Disputed performance figures, financial claims, private code, infrastructure details, credentials, and internal security artifacts are not included. The published e-banking paper has a DOI and public bibliographic record. Research interests, experimental work, exploratory collaboration, and completed publications are clearly separated.

The sandbox is original educational code using synthetic records. It resets its synthetic register for each run and does not implement durable storage, production authentication, concurrency, or cross-run idempotency. Results are rendered with textContent. Certificates, personal photographs, and a public CV remain pending authentic publication-ready source assets.
