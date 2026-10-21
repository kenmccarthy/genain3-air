# Compatibility with the SETU edition

AI Integration Review (this edition) and the SETU AI Integration Review are maintained
independently and may change in different ways. Moving review files between them is supported on
a **best-effort** basis. This page says exactly what is kept and what is lost, as checked against
the SETU edition at commit `8acfcc8093e63834058c8d69366f8f23beefaff5`. Newer SETU versions may
behave differently.

The checks are automated in `tests/compat.test.ts`. They use files produced by the SETU edition's
own code (`tests/fixtures/`) and a frozen copy of its schema (`tests/compat/setu/`).

## Browser storage

The editions are hosted on different websites, and a browser keeps each website's storage
separate. Reviews saved in one edition never appear in the other. To move work, export a file from
one edition and import it into the other.

This edition stores reviews under keys starting `genain3-air:`. It never reads or writes the SETU
edition's keys (`setu-ai-review`, `setu-air:*`).

## SETU files imported into this edition

| File                                                             | Result                                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Review from the original single combined tool (schema version 1) | Imported as one programme review and one module review per module, as in the SETU edition. The original file's content is kept, unchanged, inside the programme review. Institution Name is set to "South East Technological University", because only the SETU tool produced version 1 files. |
| Programme or module review (schema version 2)                    | Every field is kept, including ones this edition no longer shows (such as programme duration).                                                                                                                                                                                                 |
| Bundle of reviews ("Export data")                                | As above, for each review.                                                                                                                                                                                                                                                                     |
| Module contribution, programme priorities and questions          | Imported into a review as in the SETU edition.                                                                                                                                                                                                                                                 |

For version 2 files there is no reliable way to tell which edition created a file, because both
editions use the same format. So when a review has no Institution Name field, the user is asked
whether it was exported from the SETU edition. The default is to leave the name blank. In a bundle,
each review is decided separately. A name already in the file, including a deliberately blank one,
is always kept without asking.

Files without a qualification framework are read as NFQ, and files without a credit system are
read as ECTS. These were the SETU edition's assumptions.

### Fields this edition does not know

If a file contains fields this edition does not define (for example, fields added in a later SETU
version), they are **kept unchanged** in the review and exported again. The import message lists
them. They are not shown or used.

One exception: module contributions and programme prompts carry only the fields listed in this
edition's schema. Unrecognised fields in such a packet are not copied into the review that
receives it, and the import message says so. This also makes sure that a module contribution never
shares anything from a module review beyond its summary fields.

## Files from this edition imported into the SETU edition

The SETU edition at `8acfcc8` accepts this edition's review files, bundles and exchange packets,
because both use schema version 2. However, it **drops fields it does not have**:

| Review           | Fields the SETU edition drops                                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Programme review | `institutionName`, `qualificationFramework`, `generator`, and Institution Name and credit system inside each module contribution |
| Module review    | `institutionName`, `creditSystem`, `generator`                                                                                   |
| Any review       | Any other field the SETU edition does not define, including unknown fields this edition kept from elsewhere                      |

If a review is imported into the SETU edition, exported from there, and imported back here, those
values are lost: the Institution Name becomes blank (so this edition asks about it again), and the
framework and credit system go back to NFQ and ECTS. All other content survives.

**Recommendation:** keep the file exported from this edition as your master copy.

## The `generator` field

Files saved or exported by this edition contain
`"generator": { "app": "genain3-air", "version": "…" }`. It records which application last saved
the file, to help with support and future compatibility. It is **informational only**: it is not
proof of where a file came from (anyone can edit a JSON file, and older files have none), and no
import decision depends on it.

## Schema versions

Both editions use data schema version 2. This edition adds only optional fields, so files keep
moving between the editions. The data schema version is separate from the application version
shown in the footer (for example `v1.0.0`). See `docs/maintenance.md` for how to handle future
schema changes.
