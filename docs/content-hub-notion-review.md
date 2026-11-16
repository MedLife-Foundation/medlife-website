# MedLife Content Hub — Notion review and archive import

## Scope

This change is a read-only review surface for the existing per-cell Notion post banks. It does not write to Notion, alter the public site, publish posts, or move records between databases.

## Canonical Notion sources

| Cell | Data source ID | Page status field |
|---|---|---|
| Astrocyte Cell | `cc5248c8-bfaf-4699-917e-b2f1ae73bbdf` | `حالة البوست` |
| Leukocyte Cell | `67929a3c-e40d-46a9-b754-ce36480d652d` | `حالة البوست` |
| Plasma Cell | `63fa4fd2-0c8c-4868-a142-76ec4e721758` | `حالة البوست` |
| Heart Cell | `c6d40e43-f732-49c3-bb36-18230a4a88ea` | `حالة البوست` |
| Red Blood Cell | `9ea536d7-e219-4df0-8e9f-4eb9552055dd` | `حالة البوست` |
| Stem Cells | `c7c382d1-6067-446e-8651-d89c5b4ffff4` | `حالة البوست` |

Only these six active cell banks are configured. Brain Cells was retired and is intentionally excluded from the review API, interface, and import scope.

The source page ID and Notion page URL are retained for every result. Duplicate titles are not deduplicated: distinct Notion page IDs are distinct source records.

## Classification rules

- `حالة البوست = تم نشره` → historical archive.
- `حالة البوست = جاهز للنشر` or `بالتنسيق` → active editorial queue.
- Missing or unrecognized `حالة البوست` → needs manual review; never infer publication from a different workflow field.

Red Blood has a separate `الحالة` field (for example `لم تبدأ`, `قيد التنفيذ`, `تم`) in addition to `حالة البوست`. They are preserved separately. A task state of `تم` does not by itself mean the post was published.

## Fields exposed to the review surface

Title, cell, post status, separate workflow status, writing/publication/design/coordination dates, publication method, publish URL, relation IDs for writer/coordinator/designer, source page URL, and source timestamps.

## Runtime requirements

- Set `NOTION_API_TOKEN` only in the Cloudflare Pages preview environment; never commit a token or put it in browser code.
- Share each of the six active source databases with the Notion integration used by that token.
- The API route requires a valid MedLife article-admin session and uses read-only Notion data-source queries.
- The current review endpoint returns one page (up to 100 rows) at a time. It never calls Notion create/update/archive endpoints.

## Validation

Run:

```sh
node tests/content-hub-review.test.mjs
```

Manual preview checklist:
1. Sign in with an allowed MedLife article-admin account.
2. Open `/content-hub-review.html`.
3. Select each of the six active cells and verify the source title, cell label, and status values.
4. Check that published posts are in the archive filter, while ready-to-publish and coordinating posts remain active.
5. Confirm Red Blood workflow status remains separate from post status.
6. Confirm the Notion source URL opens the original record.
7. Confirm a non-admin session receives HTTP 401 and an unshared Notion source produces a clear access error.

## Explicit non-goals for this PR

No Notion writes, no account migration, no publication action, no automatic change of source status, no production database migration, and no production deployment.
