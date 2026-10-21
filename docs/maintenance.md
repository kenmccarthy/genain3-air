# Maintenance guide

## Everyday checks

```sh
npm ci
npm run lint && npm run typecheck && npm test && npm run format:check && npm run build
npm run test:e2e   # browser tests: accessibility, imports, storage failures (uses Chromium)
```

CI (`.github/workflows/ci.yml`) runs all of these on every push and pull request. Every push to
`main` also publishes the GitHub Pages preview (`.github/workflows/deploy.yml`), after running the
same checks. See `docs/deployment.md`.

## Where things are

| Change                                                                                                  | File                                             |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Title, publisher line, attribution, URLs, feedback address, subject line, licence links, storage prefix | `src/config/branding.ts`                         |
| Application version (footer, About, feedback subject, `generator`)                                      | `version` in `package.json`                      |
| Home, About, Privacy, Licensing text                                                                    | `src/content/v2/home.ts`, `src/content/about.ts` |
| Review questions and guidance                                                                           | `src/content/**`                                 |
| Data schema                                                                                             | `src/model/v2/schema.ts`                         |
| Import, export and storage                                                                              | `src/store/*`                                    |

If the repository moves (for example to a GenAI:N3 organisation), update `repositoryUrl` in
`src/config/branding.ts`, `repository` in `package.json`, and the links in the README and
`CONTENT-LICENSE.md`.

## Dependencies

After adding, removing or upgrading a runtime dependency, run `npm run notices` and commit the
updated `THIRD-PARTY-NOTICES.md`. Check that each new licence is compatible with GPL-3.0-or-later.

`@playwright/test` is pinned to the version whose Chromium build is installed in the development
environment. `package.json` `overrides` keeps `@axe-core/playwright` on the same `playwright-core`.
Upgrade them together.

## Changing the data schema

Review files are the only way users move work between browsers, computers and editions, so
changes to their format need care.

1. **Prefer an optional field with a default.** Add it with `.default(...)` so older files load
   unchanged. This keeps schema version 2 and keeps files readable by the SETU edition (which
   ignores unknown fields). This is how `institutionName`, `qualificationFramework` and
   `creditSystem` were added.
2. **Never rename or remove a field, or change what its values mean**, without a schema version
   bump. Keep old keys even when they are no longer shown (for example `duration` and `nfqLevel`).
3. **Only for a genuinely breaking change, bump the schema version.** Then:
   - add a migration function from the previous version, with a test using real exported files;
   - keep accepting every older version (v1 files still import today);
   - keep refusing files from newer versions, rather than downgrading them (`parseImport`);
   - record in `docs/compatibility.md` that the SETU edition will reject the new files, because it
     accepts only version 2.
4. Keep objects that hold review content as `z.looseObject` so fields from other editions survive.
   Keep anything that is _shared_ (module snapshots) stripped to known fields.
5. Add fixtures for the new shape to `tests/fixtures/` and extend `tests/compat.test.ts`.

The application version and the data schema version are separate. Bump the application version
for every release. Bump the schema version only for breaking data changes.

## Comparing with a newer SETU edition

Copy the newer SETU schema files into `tests/compat/setu/` (see its README), regenerate SETU
fixtures with the SETU edition's own code (see `tests/fixtures/README.md`), and run
`tests/compat.test.ts`. Then update `docs/compatibility.md` with what changed.
