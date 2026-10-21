# Deployment handover

> **The final site has not been deployed.** Publishing `https://air.genain3.ie/` needs the project
> owner's separate, explicit approval after hosting is chosen. The only deployment in this
> repository is the GitHub Pages **preview** described below.

## GitHub Pages preview

`.github/workflows/deploy.yml` publishes a preview to `https://kenmccarthy.github.io/genain3-air/`
on every push to `main`, and can also be run by hand from the Actions tab. It does the following:

1. Runs every check, including the browser tests. If any fails, nothing is published.
2. Builds with `VITE_BASE=/<repo>/`, because Pages serves project sites from a sub-path, and
   `VITE_PREVIEW=true`.
3. Publishes `dist/` with GitHub's Pages actions.

The preview build differs from the final build in two ways:

- It shows a "Preview" notice saying that reviews saved there will not move to the final site.
- It adds `<meta name="robots" content="noindex">`, so search engines don't index it.

**One-off settings** (repository owner, on GitHub):

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.** The workflow tries to set
   this up (`enablement: true`), but check it.
2. After the first run, **Settings → Environments → `github-pages` → Deployment branches and
   tags** must allow `main`. If the deploy step is rejected, change this and re-run the workflow.
3. Leave **Custom domain** empty while the site is a preview.

**Limits of the preview:**

- GitHub Pages cannot send custom response headers, so the security headers recommended below do
  not apply to it.
- Its browser origin (`https://kenmccarthy.github.io`) is shared with the SETU edition. Their
  storage keys don't overlap (see `docs/compatibility.md`).
- Reviews saved on the preview stay with the preview's origin.

**Later, moving to `air.genain3.ie`:**

- If GitHub Pages is the final host: add a DNS CNAME `air.genain3.ie → kenmccarthy.github.io`, set
  the custom domain in Settings → Pages with "Enforce HTTPS", and build with `VITE_BASE=/` and
  without `VITE_PREVIEW`.
- If another host is chosen: follow the rest of this page.

Tell testers to export anything they want to keep from the preview first.

AI Integration Review is a static site. Any static web host can serve it. No server code,
database or build step is needed on the host.

## Build

```sh
npm ci
npm run lint && npm run typecheck && npm test && npm run format:check
npm run test:e2e
npm run build
```

The output is in `dist/`: `index.html` plus hashed files in `dist/assets/`. The build is meant for
the **root** of its own site (`https://air.genain3.ie/`); `base` is `/` in `vite.config.ts`. To
serve it from a sub-path instead, change `base` and rebuild.

The build is reproducible from a commit. Record the commit SHA and application version with each
release.

Also publish `LICENSE`, `CONTENT-LICENSE.md`, `BRANDING.md` and `THIRD-PARTY-NOTICES.md`, or link
to them in the repository (the Licensing page links to the repository's notices). The bundled
third-party code is MIT-licensed and its notices must remain available.

## Hosting requirements

- **HTTPS only**, with HTTP redirected to HTTPS. Clipboard copying needs a secure context.
- **DNS:** point `air.genain3.ie` at the host as the provider instructs (usually a CNAME), and set
  up the TLS certificate for that name.
- **Routing:** no rewrite rules are needed. The app uses hash routing (`/#/help`), so the server
  only ever serves `index.html` and files in `assets/`.
- **Caching:**
  - `index.html`: `Cache-Control: no-cache`, so users get new releases straight away.
  - `assets/*`: `Cache-Control: public, max-age=31536000, immutable`. File names change whenever
    content changes.
- **Storage origin:** reviews are saved per origin. Keep the same origin
  (`https://air.genain3.ie`) for good. Moving to a different domain later would leave users' saved
  reviews behind in the old origin, and they would have to export and import them.

## Recommended security headers

```text
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'
Strict-Transport-Security: max-age=31536000
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
```

This policy needs no `'unsafe-inline'` or `'unsafe-eval'`. The app has no inline scripts or
styles, and its validation library is set never to generate code at run time. The browser test
"works under the recommended Content-Security-Policy" (`tests/e2e/workflows.spec.ts`) applies this
policy and checks that nothing is blocked. If you change the policy, update the test too. After
setting the headers on the real host, check the browser console while you start a review, import a
file, copy the statement and print it. The `mailto:` feedback link is not affected by
`form-action`.

## Release checklist

1. All checks above pass on the release commit, and CI is green.
2. `version` in `package.json` is the release version (shown in the footer and About page), and
   `CHANGELOG.md` has an entry for it.
3. `docs/accessibility-report.md` is up to date, and any blocking issue is fixed or accepted by the
   project owner.
4. `THIRD-PARTY-NOTICES.md` is regenerated (`npm run notices`).
5. Tag the commit (for example `v1.0.0`).
6. Get the owner's approval to publish, then upload `dist/` to the host.
7. After publishing, smoke-test the live site: check the home page, the footer version and the
   feedback link, start and export a review, import it in a private window, and print a statement.
