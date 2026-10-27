const test = require("node:test");
const assert = require("node:assert/strict");
const { detectPastedHeading, plainTextToArticleHtml } = require("../js/medical-article-paste.js");

test("normalizes pasted paragraphs and mixed line endings", () => {
  assert.equal(
    plainTextToArticleHtml("هذا نص\r\nسطر تابع\r\n\r\nفقرة ثانية"),
    "<p>هذا نص سطر تابع</p><p>فقرة ثانية</p>",
  );
});

test("formats Arabic health section headings and numbered sections", () => {
  assert.match(plainTextToArticleHtml("مقدمة:\n\nنص المقدمة.\n\nأهمية التوعية:\n\nنص التوعية."), /<h2>مقدمة:<\/h2>/);
  assert.match(plainTextToArticleHtml("مقدمة:\n\nنص المقدمة.\n\nأهمية التوعية:\n\nنص التوعية."), /<h2>أهمية التوعية:<\/h2>/);
  assert.deepEqual(detectPastedHeading("أولاً: الوقاية"), { tag: "h2", text: "أولاً: الوقاية" });
});

test("converts bullet and ordered lists consistently", () => {
  const html = plainTextToArticleHtml("• الوقاية\n• الكشف المبكر\n\n1. الخطوة الأولى\n2. الخطوة الثانية");
  assert.match(html, /<ul><li>الوقاية<\/li><li>الكشف المبكر<\/li><\/ul>/);
  assert.match(html, /<ol><li>الخطوة الأولى<\/li><li>الخطوة الثانية<\/li><\/ol>/);
});

test("supports quotations, separators, inline emphasis and safe links", () => {
  const html = plainTextToArticleHtml("> معلومة مهمة\n\n---\n\n**تنبيه** و *معلومة* و [WHO](https://www.who.int/)");
  assert.match(html, /<blockquote><p>معلومة مهمة<\/p><\/blockquote>/);
  assert.match(html, /<hr>/);
  assert.match(html, /<strong>تنبيه<\/strong>/);
  assert.match(html, /<em>معلومة<\/em>/);
  assert.match(html, /<a href="https:\/\/www\.who\.int\/">WHO<\/a>/);
});

test("escapes HTML-like text and never creates unsafe javascript links", () => {
  const html = plainTextToArticleHtml("<script>alert(1)</script>\n\n[رابط](javascript:alert(1))");
  assert.doesNotMatch(html, /<script\b/i);
  assert.doesNotMatch(html, /<a\b/i);
  assert.match(html, /&lt;script&gt;/);
});

test("does not turn ordinary sentences into headings", () => {
  const sentence = "الأعراض قد تبدأ بعد عدة أيام من التعرض للعدوى.";
  assert.equal(detectPastedHeading(sentence), null);
  assert.match(plainTextToArticleHtml(sentence), /^<p>/);
});
