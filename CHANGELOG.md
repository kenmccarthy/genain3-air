# Changelog

Application versions. Data files use schema version 2 throughout; see `docs/compatibility.md`.

## 1.0.0-rc.1 — release candidate (not published)

The first release candidate of AI Integration Review, A GenAI:N3 resource. It was adapted from the
SETU AI Integration Review at `kenmccarthy/setu-module-review@8acfcc8`.

### What's included

- The Programme AI Integration Review (five sections), the Module AI Integration Review (four
  sections, three core questions per assessment, with optional detail), programme–module
  exchange, and the Programme AI Integration Statement (Draft → Under Review → Agreed). The
  educational workflows are unchanged from the source edition.
- Public identity: the title, the publisher line "A GenAI:N3 resource", the approved attribution,
  About, Privacy and data storage, and Licensing pages, a footer with the version and a feedback
  link (`air@genain3.ie`; the subject carries only the version).
- Optional Institution Name on every review. The last name typed is remembered in the browser for
  new reviews only. It is printed above the programme title in the statement, never in its text.
- Qualification framework (NFQ by default) and credit system (ECTS by default), both free text.
- Imports: SETU v1 files are named after SETU. For v2 reviews with no institution name, the user
  is asked about each one, and the default is blank. Unknown fields are kept and reported.
- Storage: separate `genain3-air:` keys. If saving fails, changes are kept in memory, a warning is
  shown with an export button, and the tool never shows "Saved" for a failed save. Saves and imports
  are all-or-nothing.
- Licensing: GPL-3.0-or-later for code and CC BY-SA 4.0 for educational content. GenAI:N3 marks
  are reserved. User reviews are not licensed by the project.
- Quality: 137 unit tests and 19 browser tests, including axe WCAG 2.2 AA rules on every page.

### Removed from the source edition

- SETU branding, the link to the Classic tool and its banner, the GitHub Pages deployment, and
  reading the SETU edition's browser storage. Importing files from the Classic tool is kept.

### Known limitations

- **Accessibility:** automated and keyboard checks pass. Screen-reader, browser-zoom,
  forced-colours, real-device touch and PDF checks are still to do by hand, so WCAG 2.2 AA
  conformance is **not** claimed. See `docs/accessibility-report.md`.
- **SETU edition compatibility:** the SETU edition accepts this edition's files but drops
  Institution Name, qualification framework, credit system and any other fields it does not know.
  Keep this edition's export as the master copy.
- **Provenance:** for v2 files, the tool cannot tell which edition created a file. The user is
  asked instead. The `generator` field is informational and is not proof of origin.
- **Storage:** reviews live only in one browser on one device and are not encrypted. If storage is
  full, the open review is safe only until the tab closes, unless it is exported.
- **Export:** JSON, copy as text and browser print / save as PDF only. There is no Word export.
  Browser PDFs are not tagged.
- **Branding:** text only. No GenAI:N3 logo or favicon until approved assets are provided.
- **Not yet deployed:** hosting, DNS and launch need separate approval (`docs/deployment.md`).
