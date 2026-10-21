# Privacy and security review

Reviewed for version 1.0.0-rc.1 on 2026-10-21. This review checks that the Privacy and data storage
page (`src/content/about.ts`, `PRIVACY`) is accurate.

## Data flows

| Data                                                     | Where it goes                                                                                                                                                                                                    |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Review content, including any names and Institution Name | The browser's `localStorage` for the site, under keys prefixed `genain3-air:`. It goes nowhere else unless the user exports a file, copies text or prints.                                                       |
| Remembered Institution Name                              | `localStorage` key `genain3-air:pref:institutionName`. It is used only to pre-fill new reviews. It is not included in exports except as part of a review.                                                        |
| Feedback                                                 | A `mailto:` link opens the user's own email program. The subject contains only the application version. There is no body, and no review content, institution, browser or personal data is added.                 |
| Requests to the web server                               | Only the site's own static files. An automated test (`tests/e2e/workflows.spec.ts`, "makes no requests to any other website") walks through the main pages and confirms there are no requests to any other host. |

## Checked

- There is no analytics, advertising, tracking, remote font, CDN, remote AI service, cookie or
  server API. There are no `fetch` calls or `XMLHttpRequest` in the source.
- Imported files are parsed as JSON and validated with Zod. Text is rendered by React as text.
  There is no `dangerouslySetInnerHTML`, `innerHTML`, `eval` or `new Function` (automated source
  scan in `tests/compat.test.ts`). A fixture full of markup and script strings round-trips as plain
  text.
- Unknown fields in an imported file are stored and re-exported, but they are never displayed or
  executed.
- Module contribution files contain only the module's summary fields. Tests check that unknown or
  private fields in a module review never leak into one.
- If storage is blocked or full, the tool says so. It does not show "Saved" when the save failed.

## Not claimed

- Reviews are **not encrypted** in browser storage. Anyone with access to the browser profile can
  read them.
- The tool makes **no claim of formal compliance** with any institution's policy or with data
  protection law. Institutions should advise staff on what to enter.
- The hosting provider will process ordinary access logs (IP address, time, requested file, user
  agent). The privacy page says this. When hosting is chosen, confirm the provider's log retention
  and add it to the privacy page if needed.

## Before adding anything new

Any analytics, error reporting, remote fonts, embedded media, feedback form or AI service needs
separate approval and an update to this review and to the privacy page first.
