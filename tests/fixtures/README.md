# Test fixtures

Files named `setu-*.json` were produced by running the SETU edition's own code, not written by
hand:

- `setu-v1-review.json`: the Classic (v1) tool's sample review, serialised by its own
  `serializeReview` at `kenmccarthy/setu-module-review@925fa573e104c7018bd5e8658d235e035933b935`.
- The other `setu-*.json` files were made with the SETU v2 edition at
  `kenmccarthy/setu-module-review@8acfcc8093e63834058c8d69366f8f23beefaff5`: the v1 file was
  imported, a priority was added, a statement section was edited and the statement was agreed
  (`setu-v2-programme.json`); a module review was created and programme prompts were imported
  into it (`setu-v2-module.json`); then the exchange packets and a library bundle were exported.

They contain sample data only. The other fixtures are written by hand to test particular cases.
