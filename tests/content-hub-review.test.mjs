import assert from "node:assert/strict";
import { classifyPost, mapNotionPost, CONTENT_SOURCES } from "../functions/api/content-hub-review-mapper.mjs";

assert.equal(classifyPost("تم نشره"), "archive");
assert.equal(classifyPost("جاهز للنشر"), "active");
assert.equal(classifyPost("بالتنسيق"), "active");
assert.equal(classifyPost(""), "needs_review");
assert.equal(classifyPost("لم تبدأ"), "needs_review");

const astrocyte = CONTENT_SOURCES.find((source) => source.key === "astrocyte");
const mapped = mapNotionPost({
  id: "page-1",
  url: "https://www.notion.so/page-1",
  created_time: "2026-01-01T00:00:00.000Z",
  last_edited_time: "2026-02-01T00:00:00.000Z",
  properties: {
    Name: { type: "title", title: [{ plain_text: "<p>عنوان قديم</p>" }] },
    "حالة البوست": { type: "status", status: { name: "تم نشره" } },
    "الحالة": { type: "status", status: { name: "لم تبدأ" } },
    "تاريخ كتابة البوست": { type: "date", date: { start: "2025-09-01" } },
    "تاريخ نشر البوست": { type: "date", date: { start: "2025-09-10" } },
    "رابط البوست": { type: "url", url: "https://example.org/post" },
    "اسم كاتب المنشور": { type: "relation", relation: [{ id: "writer-1" }] }
  }
}, astrocyte);

assert.equal(mapped.title, "عنوان قديم");
assert.equal(mapped.bucket, "archive");
assert.equal(mapped.post_status, "تم نشره");
assert.equal(mapped.workflow_status, "لم تبدأ");
assert.equal(mapped.written_at, "2025-09-01");
assert.equal(mapped.published_at, "2025-09-10");
assert.equal(mapped.publish_url, "https://example.org/post");
assert.deepEqual(mapped.writer_relation_ids, ["writer-1"]);
assert.equal(mapped.source_page_id, "page-1");
assert.equal(mapped.source_cell_key, "astrocyte");
assert.equal(CONTENT_SOURCES.length, 7);

const redBlood = CONTENT_SOURCES.find((source) => source.key === "red-blood");
const ambiguousRedBlood = mapNotionPost({
  id: "page-2",
  properties: {
    Name: { type: "title", title: [{ plain_text: "سجل يحتاج مراجعة" }] },
    "الحالة": { type: "status", status: { name: "تم" } }
  }
}, redBlood);
assert.equal(ambiguousRedBlood.workflow_status, "تم");
assert.equal(ambiguousRedBlood.bucket, "needs_review");
assert.equal(ambiguousRedBlood.post_status, "");

console.log("Content Hub Notion mapping and archive classification: OK");
