# AI Integration Review

**A GenAI:N3 resource**

> **Status: Preview — not yet launched.** A test version is served by GitHub Pages at
> <https://kenmccarthy.github.io/genain3-air/>. The final site at `https://air.genain3.ie/` has not
> been published. Reviews saved on the preview will not move to the final site automatically.

AI Integration Review helps programme teams and educators reflect on how AI is addressed in
learning outcomes, teaching, assessment and graduate capabilities. Programme and module reviews
can be completed independently or used together to inform a shared Programme AI Integration
Statement.

It is free to use, needs no account and stores review content only in the user's browser.

Created by Dr Hazel Farrell in collaboration with Ken McCarthy, with support from ChatGPT and
Claude Code.

## What it does

- **Programme AI Integration Review**: programme context plus five sections: graduate
  capabilities, AI capability progression (the I–P–E–D map), curriculum and assessment, programme
  coherence, and priorities and next steps.
- **Module AI Integration Review**: module context plus four sections: learning outcomes, teaching
  and learning, assessment (three core questions per assessment, with optional detail), and
  reflection and next steps.
- **Programme AI Integration Statement**: five sections drafted from the programme review. Each
  drafted sentence is labelled with its basis, the team can edit every section, and the statement
  moves through Draft → Under Review → Agreed. "Agreed" means agreed through the institution's or
  programme team's own process. It does not mean GenAI:N3 has endorsed or approved anything.
- **Connected reviews**: programme teams can export priorities and questions for module teams, and
  module teams can export a contribution for the programme review. Imports never overwrite
  unrelated work.
- **Portability**: JSON export and import of single reviews and of every review in the browser;
  copy the statement as text; print or save it as a PDF from the browser.

## Origin

This is a public, institution-neutral edition of the SETU AI Integration Review. It was adapted
from [`kenmccarthy/setu-module-review`](https://github.com/kenmccarthy/setu-module-review) at
commit `8acfcc8093e63834058c8d69366f8f23beefaff5`. The two editions are maintained independently
and may diverge. Review files can be moved between them where the formats allow; see
[docs/compatibility.md](docs/compatibility.md).

## Licensing

| What                                                                | Licence                                                                                        |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Application source code                                             | [GNU General Public License v3.0 or later](LICENSE) (`GPL-3.0-or-later`)                       |
| Educational framework, review questions, guidance and documentation | [Creative Commons Attribution–ShareAlike 4.0 International](CONTENT-LICENSE.md) (CC BY-SA 4.0) |
| GenAI:N3 name, logos and brand assets                               | Not covered by either licence; see [BRANDING.md](BRANDING.md)                                  |
| Programme and module reviews and statements created with the tool   | Belong to their authors; not licensed by this project                                          |
| Third-party packages                                                | Their own licences; see [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)                       |

The software is licensed under the GPL version 3 **or (at your option) any later version**
published by the Free Software Foundation. See [CONTENT-LICENSE.md](CONTENT-LICENSE.md) for exactly
which files the CC BY-SA licence covers.

## Feedback

Email [air@genain3.ie](mailto:air@genain3.ie). Please don't include review content or personal
information unless you choose to.

## Development

Requires Node.js 22.

```sh
npm ci
npm run dev           # local development server
npm run lint          # oxlint
npm run typecheck     # TypeScript
npm test              # Vitest unit tests
npm run format:check  # Prettier
npm run test:e2e      # browser tests (accessibility, imports, storage failures)
npm run build         # static production build in dist/
npm run notices       # regenerate THIRD-PARTY-NOTICES.md after dependency changes
```

The build is a static site meant for the root of `https://air.genain3.ie/`. It uses hash routing,
so no server rewrite rules are needed. CI only runs checks; nothing in this repository deploys the
site.

## Data and storage

Reviews are saved in the browser's `localStorage` under keys prefixed `genain3-air:`. These are
separate from the SETU edition's keys. Nothing is sent to a server as part of using the tool.
Users should export JSON backups regularly.

## Documentation

- [CHANGELOG.md](CHANGELOG.md): release notes and known limitations.
- [docs/implementation-log.md](docs/implementation-log.md): what was changed from the source
  edition, stage by stage.
- [docs/compatibility.md](docs/compatibility.md): moving review files to and from the SETU edition.
- [docs/accessibility-report.md](docs/accessibility-report.md): what was tested, what was fixed and
  what is still to check.
- [docs/privacy-review.md](docs/privacy-review.md): data flows and the checks behind the privacy
  page.
- [docs/maintenance.md](docs/maintenance.md): configuration, dependencies and schema changes.
- [docs/deployment.md](docs/deployment.md): building and hosting the static site (not yet
  deployed).
