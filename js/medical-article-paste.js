(function (root) {
  "use strict";

  function escapePastedText(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function plainInlineToHtml(value) {
    return escapePastedText(value)
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function (_match, label, url) {
        return '<a href="' + url + '">' + label + "</a>";
      })
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
      .replace(/_([^_\n]+)_/g, "<em>$1</em>");
  }

  function detectPastedHeading(line) {
    const markdown = line.match(/^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (markdown) return { tag: markdown[1].length <= 2 ? "h2" : "h3", text: markdown[2] };

    const bold = line.match(/^\*\*(.{2,120})\*\*$/);
    if (bold) return { tag: "h3", text: bold[1] };

    const section = line.match(/^(?:(?:أولاً|أولًا|ثانياً|ثانيًا|ثالثاً|ثالثًا|رابعاً|رابعًا|خامساً|خامسًا|سادساً|سادسًا|سابعاً|سابعًا|ثامناً|ثامنًا|تاسعاً|تاسعًا|عاشراً|عاشرًا)|(?:\d{1,2}|[٠-٩]{1,2}))\s*[:：-]\s*(.{3,140})$/u);
    if (section) return { tag: "h2", text: line };

    const namedHeading = /^(?:المقدمة|مقدمة|أهمية التوعية|رسائل توعوية مقترحة|الأسباب|الأعراض|عوامل الخطر|المضاعفات|الوقاية|طرق الوقاية|التشخيص|العلاج|الخلاصة|المراجع|المصادر|نصائح مهمة|علامات تستدعي مراجعة الطبيب)\s*[:：؟?]?$/u;
    const questionHeading = /^(?:ما هو|ما هي|ما المقصود|متى يجب|متى ينبغي|كيف يمكن)\s+.{2,110}[؟?]?$/u;
    if (line.length <= 140 && (namedHeading.test(line) || questionHeading.test(line))) {
      return { tag: "h2", text: line };
    }
    return null;
  }

  function plainTextToArticleHtml(value) {
    const normalized = String(value ?? "")
      .replace(/\r\n?/g, "\n")
      .replace(/\u00a0/g, " ")
      .replace(/\u200b/g, "")
      .trim();
    if (!normalized) return "";

    const blocks = [];
    let paragraphLines = [];
    let quoteLines = [];
    let listTag = null;
    let listItems = [];

    function flushParagraph() {
      if (!paragraphLines.length) return;
      blocks.push("<p>" + paragraphLines.map(plainInlineToHtml).join(" ") + "</p>");
      paragraphLines = [];
    }
    function flushQuote() {
      if (!quoteLines.length) return;
      blocks.push("<blockquote><p>" + quoteLines.map(plainInlineToHtml).join(" ") + "</p></blockquote>");
      quoteLines = [];
    }
    function flushList() {
      if (listTag && listItems.length) {
        blocks.push("<" + listTag + ">" + listItems.map(item => "<li>" + item + "</li>").join("") + "</" + listTag + ">");
      }
      listTag = null;
      listItems = [];
    }
    function flushAll() {
      flushParagraph();
      flushQuote();
      flushList();
    }

    for (const rawLine of normalized.split("\n")) {
      const line = rawLine.trim();
      if (!line) {
        flushAll();
        continue;
      }
      if (/^(?:-{3,}|_{3,}|\*{3,})$/.test(line)) {
        flushAll();
        blocks.push("<hr>");
        continue;
      }

      const heading = detectPastedHeading(line);
      if (heading) {
        flushAll();
        blocks.push("<" + heading.tag + ">" + plainInlineToHtml(heading.text) + "</" + heading.tag + ">");
        continue;
      }

      const unordered = line.match(/^[-*+•]\s+(.+)$/u);
      const ordered = line.match(/^(?:\d{1,2}|[٠-٩]{1,2})[.)،]\s+(.+)$/u);
      if (unordered || ordered) {
        flushParagraph();
        flushQuote();
        const nextTag = unordered ? "ul" : "ol";
        if (listTag && listTag !== nextTag) flushList();
        listTag = nextTag;
        listItems.push(plainInlineToHtml((unordered || ordered)[1]));
        continue;
      }

      if (/^>\s?/.test(line)) {
        flushParagraph();
        flushList();
        quoteLines.push(line.replace(/^>\s?/, ""));
        continue;
      }

      flushList();
      flushQuote();
      paragraphLines.push(line);
    }
    flushAll();
    return blocks.join("");
  }

  function normalizeImportedArticleHeadings(container) {
    if (!container || !container.querySelectorAll) return;
    const doc = container.ownerDocument || root.document;
    container.querySelectorAll("p[class],p[style],div[class],div[style]").forEach(function (node) {
      const importedStyles = (
        String(node.getAttribute("class") || "") + " " + String(node.getAttribute("style") || "")
      ).toLowerCase();
      const match = importedStyles.match(/msoheading([1-6])|mso-outline-level\s*:\s*([1-6])/);
      if (!match) return;
      const level = Number(match[1] || match[2]);
      const replacement = doc.createElement(level <= 2 ? "h2" : "h3");
      replacement.innerHTML = node.innerHTML;
      node.replaceWith(replacement);
    });

    container.querySelectorAll("p").forEach(function (node) {
      const label = String(node.textContent || "").replace(/\s+/g, " ").trim();
      if (!label || label.length > 140 || /^\s*#{1,6}\s+/.test(label) || /^\*\*[^*]+\*\*$/.test(label)) return;
      const semanticHeading = detectPastedHeading(label);
      const children = Array.from(node.children);
      const hasBoldWeight = value => /(?:^|;)\s*font-weight\s*:\s*(?:bold|[7-9]00)\b/i.test(value);
      const onlyBold = children.length === 1 && (
        ["STRONG", "B"].includes(children[0].tagName) ||
        (children[0].tagName === "SPAN" && hasBoldWeight(children[0].getAttribute("style") || ""))
      ) && String(children[0].textContent || "").replace(/\s+/g, " ").trim() === label;
      const boldParagraph = hasBoldWeight(node.getAttribute("style") || "") && !node.querySelector("img,table,ul,ol");
      if (!semanticHeading && !onlyBold && !boldParagraph) return;
      const replacement = doc.createElement(semanticHeading ? semanticHeading.tag : "h3");
      replacement.innerHTML = node.innerHTML;
      node.replaceWith(replacement);
    });
  }

  const api = { detectPastedHeading, plainTextToArticleHtml, normalizeImportedArticleHeadings };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MedLifeArticlePaste = api;
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : null));
