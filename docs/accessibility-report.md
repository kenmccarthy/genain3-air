# Accessibility report

**Target:** WCAG 2.2 Level AA.
**Status:** Automated checks pass, and the keyboard checks listed below pass. Screen-reader testing
**has not yet been done**, so this report does **not** claim that the tool conforms to WCAG 2.2 AA.

Last updated: 2026-10-21, application version 1.0.0-rc.1.

## How it was tested

| Method           | Tool                                                                                                  | Coverage                                                                                                                                                                                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Automated rules  | axe-core 4.11 via `@axe-core/playwright`, tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` | Every page: home, saved reviews, help, about, privacy, licensing, all 9 programme review pages and all 7 module review pages (using the sample), and the import dialog. Each page at 320px and 1280px wide.                                                   |
| Reflow           | Playwright, 320px wide (equivalent to 400% zoom at 1280px)                                            | Information pages and every programme page, including the progression map: no horizontal page scrolling.                                                                                                                                                      |
| Keyboard only    | Playwright, keys only                                                                                 | Skip link; opening and closing the phone menu (focus moves in, Escape returns focus); starting a module review, typing, moving between sections, adding an assessment and answering with Space and the arrow keys; the import dialog (default focus, Escape). |
| Storage warnings | Playwright                                                                                            | The "not saved" alert is a live `role="alert"` region and has a working export button.                                                                                                                                                                        |
| Print            | Playwright print-media emulation                                                                      | The printed statement header order (institution, then programme title, then sections).                                                                                                                                                                        |

Browser: Chromium 141 (Playwright 1.56), headless, on Linux. The automated tests are in
`tests/e2e/` and run in CI on every push (`npm run test:e2e`).

## Problems found and fixed

| Issue                                                                                                                     | WCAG              | Fix                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------- |
| Grey list numbers, menu numbers, disclosure symbols and unselected progression-map letters had a contrast of 2.6:1        | 1.4.3, 1.4.11     | Darkened to at least 4.5:1                                                                                      |
| On phones, the closed menu was off-screen but its links could still be reached with Tab                                   | 2.4.3, 2.4.11     | The closed menu is now hidden from keyboard and screen readers                                                  |
| The menu button did not say whether the menu was open, focus did not move into the menu, and Escape did not close it      | 4.1.2, 2.1.1      | Added `aria-expanded` and `aria-controls`, moved focus into the menu, and made Escape close it and return focus |
| The save status was a live region that also contained the time, so screen readers could announce it after every keystroke | 4.1.3 (usability) | Only the save state is announced; the time is outside the live region                                           |
| Several "Open", "Export" and "Delete" buttons on Saved reviews had identical names                                        | 2.4.6             | Each button's accessible name now includes the review's title                                                   |
| The text-field focus ring was pale (`brand-200`)                                                                          | 2.4.7, 1.4.11     | It now uses the dark brand colour                                                                               |
| Copying to the clipboard could fail silently                                                                              | 3.3.1, 4.1.3      | `CopyButton` announces success or failure                                                                       |

## Still to do before claiming conformance

These checks need a person and were not possible in this environment:

- **Screen readers:** NVDA with Firefox or Chrome on Windows, VoiceOver with Safari on macOS and
  iOS, and TalkBack on Android. Check the section navigation, radio groups, disclosure sections, the
  import dialog, the storage alert, and announcements for imports and saves.
- **Browser zoom** at 200% and text-only zoom in Firefox and Safari (only reflow at 320px was
  automated).
- **Windows High Contrast / forced colours:** check that the selected answer, the progression-map
  toggles and the focus outline remain visible.
- **Touch** on a real phone: target sizes passed the automated `target-size` rule, but check them
  in practice.
- **PDF output:** check reading order and legibility of a statement saved as a PDF in Chrome,
  Edge, Firefox and Safari. Browser-generated PDFs are not tagged, so a PDF is not itself an
  accessible document. Copying the text is the accessible alternative.
- **Cognitive load:** review help text and error messages with real users.

## Known limitations

- The progression map is a grid of toggle buttons. Each has a full accessible name (capability,
  stage and phase), but the grid is long to navigate with a screen reader. Manual testing should
  confirm whether it is usable.
- Some confirmations (replacing a saved review, deleting a review, replacing a newer import) use the
  browser's built-in `confirm()` dialog. These are accessible in current browsers, but the wording
  can't be styled.

A failure that stops someone completing a review should block release unless the project owner
explicitly accepts it.
