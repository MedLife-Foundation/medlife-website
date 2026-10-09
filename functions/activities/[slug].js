const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
const safeUrl = (value, origin) => {
  try {
    const u = new URL(String(value || ""), origin);
    return u.protocol === "https:" || u.origin === origin ? u.href : "";
  } catch { return ""; }
};
const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("ar-SY", { year:"numeric", month:"long", day:"numeric" });
};
const typeMap = { medical:"طبي", awareness:"توعية", training:"تدريب", humanitarian:"إنساني", community:"مجتمعي", school:"مدارس", other:"أخرى" };

function formatInlineMarkdown(value) {
  let output = esc(value);
  const codeTokens = [];

  output = output.replace(/`([^`\\n]+)`/g, (_, code) => {
    const token = "\\uE000" + codeTokens.length + "\\uE001";
    codeTokens.push("<code>" + code + "</code>");
    return token;
  });
  output = output.replace(/\\*\\*([^*\\n]+)\\*\\*/g, "<strong>$1</strong>");
  output = output.replace(/~~([^~\\n]+)~~/g, "<del>$1</del>");
  output = output.replace(/==([^=\\n]+)==/g, '<mark class="story-highlight">$1</mark>');
  output = output.replace(/(^|[^*])\\*([^*\\n]+)\\*(?!\\*)/g, "$1<em>$2</em>");
  output = output.replace(/(^|[^_])_([^_\\n]+)_(?!_)/g, "$1<em>$2</em>");

  return output.replace(/\\uE000(\\d+)\\uE001/g, (_, index) => codeTokens[Number(index)] || "");
}

function formatDetailBlocks(value) {
  const normalized = String(value || "").replace(/\r\n?/g, "\n").trim();
  if (!normalized) return ["<p>لا توجد تفاصيل إضافية منشورة لهذا النشاط حالياً.</p>"];

  let rawBlocks = normalized.split(/\n\s*\n+/).map(part => part.trim()).filter(Boolean);
  if (rawBlocks.length === 1) {
    const lines = normalized.split("\n").map(line => line.trim()).filter(Boolean);
    if (lines.length > 1) rawBlocks = lines;
  }

  const output = [];
  const isBullet = line => /^(?:[-*•▪]|\d+[.)])\s+/.test(line);

  for (const raw of rawBlocks) {
    const lines = raw.split("\n").map(line => line.trim()).filter(Boolean);
    if (!lines.length) continue;

    if (lines.every(isBullet)) {
      output.push("<ul>" + lines.map(line =>
        "<li>" + esc(line.replace(/^(?:[-*•▪]|\d+[.)])\s+/, "")) + "</li>"
      ).join("") + "</ul>");
      continue;
    }

    if (lines.length === 1 && /^#{1,3}\s+/.test(lines[0])) {
      output.push("<h3>" + esc(lines[0].replace(/^#{1,3}\s+/, "")) + "</h3>");
      continue;
    }

    const text = lines.join(" ").replace(/\s+/g, " ").trim();
    const sentences = text.match(/[^.!؟…]+(?:[.!؟…]+|$)/g)?.map(sentence => sentence.trim()).filter(Boolean) || [text];

    // If an editor pasted a very long, single paragraph, break it into readable
    // two-sentence paragraphs automatically without changing its wording.
    if (text.length > 460 && sentences.length >= 4) {
      for (let i = 0; i < sentences.length; i += 2) {
        output.push("<p>" + sentences.slice(i, i + 2).map(formatInlineMarkdown).join(" ") + "</p>");
      }
    } else {
      output.push("<p>" + formatInlineMarkdown(text) + "</p>");
    }
  }
  return output.length ? output : ["<p>لا توجد تفاصيل إضافية منشورة لهذا النشاط حالياً.</p>"];
}

export async function onRequestGet({ params, request }) {
  const slug = String(params?.slug || "").trim();
  if (!slug || slug.length > 160) return new Response("الصفحة غير موجودة.", { status:404 });

  const origin = new URL(request.url).origin;
  const api = origin + "/api/management?resource=activities&slug=" + encodeURIComponent(slug) + "&limit=1";
  const response = await fetch(api, { headers:{ Accept:"application/json" }, cf:{ cacheTtl:0 } });
  if (!response.ok) return new Response("تعذر تحميل النشاط حالياً.", { status:502 });

  const payload = await response.json().catch(() => ({}));
  const activity = Array.isArray(payload?.data) ? payload.data[0] : null;
  if (!activity) return new Response("النشاط غير موجود أو غير منشور للعامة.", { status:404 });

  const title = esc(activity.title || "نشاط ميدلايف");
  const description = esc(activity.description || "");
  const details = String(activity.details || "").trim();
  const image = safeUrl(activity.cover_image_url, origin);
  const sourceUrl = safeUrl(activity.source_url, origin);
  const galleryUrl = safeUrl(activity.gallery_url, origin);
  const date = formatDate(activity.start_at);
  const location = [activity.city, activity.governorate].filter(Boolean).join(" — ");
  const seenGallery = new Set(image ? [image] : []);
  const gallery = [];
  const rawGallery = Array.isArray(activity.gallery) ? activity.gallery : [];
  for (const item of rawGallery) {
    if (!item) continue;
    const url = safeUrl(item.url, origin);
    if (!url || seenGallery.has(url)) continue;
    seenGallery.add(url);
    gallery.push({ url, alt_text: item.alt_text || activity.title || "صورة النشاط" });
  }

  const actions = [
    sourceUrl ? '<a class="btn primary" href="' + sourceUrl + '" target="_blank" rel="noopener noreferrer">قراءة التغطية / المصدر</a>' : "",
    galleryUrl ? '<a class="btn secondary" href="' + galleryUrl + '" target="_blank" rel="noopener noreferrer">ألبوم الصور الخارجي</a>' : ""
  ].filter(Boolean).join("");

  const placementLabels = {
    intro_side: "بجانب المقدمة",
    after_intro: "بعد المقدمة",
    middle: "منتصف الخبر",
    full_width: "بعرض المقال",
    bottom: "أسفل المقال"
  };
  const editorialImages = gallery.map((item, index) => {
    const url = item.url;
    const altText = String(item.alt_text || activity.title || "صورة النشاط");
    const alt = esc(altText);
    const placement = Object.prototype.hasOwnProperty.call(placementLabels, item.placement)
      ? item.placement
      : "bottom";
    const layoutClass = placement === "intro_side"
      ? "editorial-image-side"
      : placement === "full_width"
        ? "editorial-image-wide"
        : "editorial-image-medium";
    const captionText = String(item.caption || "").trim();
    const caption = captionText ? '<figcaption>' + esc(captionText) + '</figcaption>' : "";
    const html = '<figure class="editorial-image ' + layoutClass + '">' +
      '<button type="button" class="editorial-image-button" data-image="' + esc(url) + '" data-alt="' + alt + '" aria-label="عرض الصورة ' + (index + 1) + '">' +
        '<img src="' + esc(url) + '" alt="' + alt + '" loading="lazy" decoding="async">' +
        '<span class="editorial-image-zoom" aria-hidden="true">تكبير الصورة ↗</span>' +
      '</button>' + caption +
    '</figure>';
    return { ...item, placement, html, index };
  });

  const detailBlocks = formatDetailBlocks(details);
  const inlineImages = editorialImages.filter(item => item.placement !== "bottom");
  const bottomImages = editorialImages.filter(item => item.placement === "bottom");
  const storyParts = [];
  const imageInsertions = new Map();
  const blockCount = detailBlocks.length;
  inlineImages.forEach(item => {
    let afterBlock;
    if (item.placement === "intro_side") afterBlock = 0;
    else if (item.placement === "after_intro") afterBlock = 1;
    else afterBlock = Math.max(1, Math.ceil(blockCount / 2));

    const bucket = imageInsertions.get(afterBlock) || [];
    bucket.push(item);
    imageInsertions.set(afterBlock, bucket);
  });
  const addImagesAt = blockIndex => {
    const images = imageInsertions.get(blockIndex) || [];
    storyParts.push(...images.map(item => item.html));
  };
  addImagesAt(0);
  detailBlocks.forEach((block, blockIndex) => {
    storyParts.push(block);
    addImagesAt(blockIndex + 1);
  });
  const storyHtml = storyParts.join("");

  const bottomGalleryHtml = bottomImages.length
    ? '<section class="activity-bottom-gallery" aria-label="صور النشاط">' +
        '<header class="activity-bottom-gallery-heading"><span class="activity-section-kicker">التوثيق المصوّر</span><h2>صور من النشاط</h2><p>لقطات إضافية من الفعالية.</p></header>' +
        '<div class="activity-bottom-gallery-grid">' +
        bottomImages.map((item, index) => {
          const alt = esc(item.alt_text || activity.title || "صورة النشاط");
          const caption = String(item.caption || "").trim();
          return '<figure class="activity-bottom-photo">' +
            '<button type="button" class="activity-bottom-photo-button" data-image="' + esc(item.url) + '" data-alt="' + alt + '" aria-label="عرض صورة النشاط ' + (index + 1) + '">' +
              '<img src="' + esc(item.url) + '" alt="' + alt + '" loading="lazy" decoding="async">' +
              '<span class="editorial-image-zoom" aria-hidden="true">تكبير الصورة ↗</span>' +
            '</button>' +
            (caption ? '<figcaption>' + esc(caption) + '</figcaption>' : '') +
          '</figure>';
        }).join("") +
        '</div></section>'
    : "";

  const meta = [
    date ? '<span><strong>التاريخ</strong>' + esc(date) + '</span>' : "",
    location ? '<span><strong>المكان</strong>' + esc(location) + '</span>' : "",
    activity.participant_count != null ? '<span><strong>المشاركون</strong>' + esc(String(activity.participant_count)) + '</span>' : "",
    activity.activity_type ? '<span><strong>المجال</strong>' + esc(typeMap[activity.activity_type] || activity.activity_type) + '</span>' : ""
  ].filter(Boolean).join("");

  const canonical = origin + "/activities/" + encodeURIComponent(slug);
  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} | مؤسسة ميدلايف</title>
<meta name="description" content="${description}">
<meta name="theme-color" content="#12203a">
<link rel="canonical" href="${esc(canonical)}">
<link rel="icon" href="/logo.PNG">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/homepage-redesign.css">
<style>
.activity-detail-hero{padding:clamp(44px,6vw,76px) 0 54px;background:radial-gradient(circle at 8% 5%,rgba(229,31,69,.07),transparent 27%),linear-gradient(135deg,#f8fafc 0%,#fff 57%,#fff2f5 100%);border-bottom:1px solid var(--ml-line)}
.activity-detail-grid{display:grid;grid-template-columns:minmax(0,1.04fr) minmax(320px,.96fr);gap:clamp(24px,4vw,44px);align-items:center}
.activity-detail-kicker{display:inline-flex;align-items:center;gap:8px;color:var(--ml-red);font-size:12px;font-weight:900;letter-spacing:.01em}
.activity-detail-kicker:before{content:"";width:24px;height:2px;background:var(--ml-red);border-radius:999px}
.activity-detail-hero h1{margin:14px 0 16px;color:var(--ml-navy);font-size:clamp(32px,4.5vw,56px);line-height:1.55;font-weight:900;text-wrap:balance}
.activity-detail-lead{margin:0;color:var(--ml-muted);font-size:16px;line-height:2.15;max-width:740px}
.activity-detail-cover{position:relative;aspect-ratio:4/3;border-radius:28px;overflow:hidden;border:1px solid rgba(18,32,58,.08);background:linear-gradient(135deg,#edf2f7,#f9fbfc);box-shadow:0 24px 60px rgba(18,32,58,.13);display:grid;place-items:center;isolation:isolate}
.activity-detail-cover:after{content:"";position:absolute;inset:0;pointer-events:none;border:1px solid rgba(255,255,255,.45);border-radius:inherit;z-index:2}
.activity-detail-cover img{width:100%;height:100%;max-height:480px;object-fit:cover;display:block}
.activity-detail-cover.no-image{min-height:290px}
.activity-detail-cover.no-image img{width:148px;height:auto;object-fit:contain;opacity:.46;filter:drop-shadow(0 12px 22px rgba(18,32,58,.12))}
.activity-detail-meta{display:flex;flex-wrap:wrap;gap:9px;margin-top:22px}
.activity-detail-meta span{display:flex;flex-direction:column;gap:3px;min-width:104px;padding:10px 13px;background:rgba(255,255,255,.86);border:1px solid rgba(18,32,58,.08);border-radius:13px;color:var(--ml-muted);font-size:11px;box-shadow:0 6px 18px rgba(18,32,58,.035)}
.activity-detail-meta strong{color:var(--ml-navy);font-size:10px}
.activity-detail-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}
.activity-detail-actions .btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;border-radius:12px;padding:10px 16px;font:900 12px Cairo,sans-serif;text-decoration:none;transition:transform .2s,box-shadow .2s}
.activity-detail-actions .btn:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(18,32,58,.1)}
.activity-detail-actions .primary{background:var(--ml-red);color:#fff;border:1px solid var(--ml-red)}
.activity-detail-actions .secondary{background:#fff;color:var(--ml-navy);border:1px solid var(--ml-line)}
.activity-detail-section{padding:clamp(44px,6vw,78px) 0;background:linear-gradient(180deg,#fbfcfe 0%,#fff 260px)}
.activity-detail-content{width:min(920px,100%);margin-inline:auto;display:block}
.activity-detail-card{background:#fff;border:1px solid rgba(18,32,58,.07);border-radius:26px;padding:clamp(22px,4vw,48px);box-shadow:0 18px 60px rgba(18,32,58,.055)}
.activity-story-heading{margin:0 0 27px;padding-bottom:20px;border-bottom:1px solid #edf0f4}
.activity-story-heading .activity-section-kicker,.activity-inline-gallery-heading .activity-section-kicker{color:var(--ml-red);font-size:11px;font-weight:900;letter-spacing:.02em}
.activity-story-heading h2{margin:5px 0 0;color:var(--ml-navy);font-size:clamp(23px,3vw,30px);line-height:1.6}
.activity-story-body{color:#46536a}
.activity-story-body p{margin:0 auto 24px;color:#46536a;font-size:15px;line-height:2.25;max-width:760px;text-wrap:pretty}
.activity-story-body p:first-child{color:#26364f;font-size:17px;line-height:2.15;font-weight:600}
.activity-story-body strong{font-weight:900;color:#1e2e49}
.activity-story-body em{font-style:italic;color:#354660}
.activity-story-body del{color:#7b8798;text-decoration-thickness:1px}
.activity-story-body mark.story-highlight{background:#fff0bd;color:#6d4c00;padding:.08em .3em;border-radius:.3em}
.activity-story-body code{background:#f1f4f8;color:#34435b;padding:.12em .38em;border-radius:.35em;font:600 .9em/1.6 ui-monospace,monospace;direction:ltr;unicode-bidi:plaintext}
.activity-story-body blockquote{margin:28px auto;padding:15px 20px;max-width:760px;border-inline-start:4px solid var(--ml-red);background:#fff6f8;border-radius:0 14px 14px 0;color:#354660}
.activity-story-body blockquote p{margin:0;font-weight:700;color:#354660}
.activity-story-body blockquote p+p{margin-top:8px}

.activity-story-body h3{margin:32px auto 12px;max-width:760px;color:var(--ml-navy);font-size:20px;line-height:1.8}
.activity-story-body ul{max-width:760px;margin:0 auto 24px;padding-inline-start:25px;color:#46536a}
.activity-story-body li{padding-inline-start:6px;margin-bottom:9px;line-height:2.1}
/* Manual placements selected in the management platform. Unplaced/default images stay below the story. */
.activity-story-body{display:flow-root;color:#46536a}
.editorial-image{position:relative;margin:28px auto 32px;max-width:100%;text-align:center}
.editorial-image-wide{width:100%;max-width:820px;clear:both}
.editorial-image-medium{width:76%;max-width:660px;clear:both}
.editorial-image-side{float:inline-start;width:40%;max-width:320px;margin:7px 0 22px 26px}
.editorial-image-button,.activity-bottom-photo-button{position:relative;display:block;width:100%;aspect-ratio:16/10;padding:0;border:0;border-radius:16px;overflow:hidden;background:#edf1f5;box-shadow:0 13px 32px rgba(18,32,58,.1);cursor:zoom-in;isolation:isolate}
.editorial-image-medium .editorial-image-button{aspect-ratio:5/4}
.editorial-image-side .editorial-image-button{aspect-ratio:4/5;border-radius:14px}
.editorial-image-button img,.activity-bottom-photo-button img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s ease}
.editorial-image-button:after,.activity-bottom-photo-button:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 50%,rgba(7,15,31,.42));opacity:.48;transition:opacity .2s}
.editorial-image-button:hover img,.activity-bottom-photo-button:hover img{transform:scale(1.04)}
.editorial-image-button:hover:after,.activity-bottom-photo-button:hover:after{opacity:.9}
.editorial-image-zoom{position:absolute;z-index:2;bottom:10px;inset-inline-start:11px;padding:5px 9px;border-radius:999px;color:#fff;background:rgba(7,15,31,.5);font:700 10px Cairo,sans-serif;opacity:0;transform:translateY(4px);transition:.2s}
.editorial-image-button:hover .editorial-image-zoom,.editorial-image-button:focus-visible .editorial-image-zoom,.activity-bottom-photo-button:hover .editorial-image-zoom,.activity-bottom-photo-button:focus-visible .editorial-image-zoom{opacity:1;transform:translateY(0)}
.editorial-image figcaption,.activity-bottom-photo figcaption{margin-top:8px;color:#7b8798;font:600 11px/1.9 Cairo,sans-serif;text-align:center}
.activity-bottom-gallery{margin:30px auto 0;padding:clamp(18px,3vw,30px);border:1px solid #e8edf3;border-radius:24px;background:linear-gradient(145deg,#fbfcfe,#fff);box-shadow:0 14px 42px rgba(18,32,58,.05)}
.activity-bottom-gallery-heading{margin-bottom:18px}
.activity-bottom-gallery-heading .activity-section-kicker{color:var(--ml-red);font-size:11px;font-weight:900}
.activity-bottom-gallery-heading h2{margin:5px 0;color:var(--ml-navy);font-size:24px;line-height:1.6}
.activity-bottom-gallery-heading p{margin:0;color:var(--ml-muted);font-size:12px;line-height:1.9}
.activity-bottom-gallery-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.activity-bottom-photo{min-width:0;margin:0;padding:9px;border:1px solid #edf0f4;border-radius:17px;background:#fff}
.activity-bottom-photo-button{aspect-ratio:4/3;border-radius:12px;box-shadow:none}
.activity-story-body h3{margin:32px auto 12px;max-width:760px;color:var(--ml-navy);font-size:20px;line-height:1.8}
.activity-story-body ul{max-width:760px;margin:0 auto 24px;padding-inline-start:25px;color:#46536a}
.activity-story-body li{padding-inline-start:6px;margin-bottom:9px;line-height:2.1}
@media(max-width:900px){.editorial-image-medium{width:88%}.editorial-image-side{width:42%;margin-inline-end:20px}.activity-bottom-gallery-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:600px){
  .editorial-image{margin:23px auto 28px;clear:both}
  .editorial-image-wide,.editorial-image-medium,.editorial-image-side{float:none;width:100%;max-width:100%}
  .editorial-image-button,.editorial-image-medium .editorial-image-button,.editorial-image-side .editorial-image-button{aspect-ratio:16/10;border-radius:12px}
  .editorial-image-zoom{opacity:1;transform:none;bottom:7px;inset-inline-start:8px}
  .activity-bottom-gallery{padding:14px;border-radius:18px}
  .activity-bottom-gallery-heading h2{font-size:21px}
  .activity-bottom-gallery-grid{grid-template-columns:1fr;gap:10px}
  .activity-bottom-photo{padding:7px;border-radius:13px}
  .activity-bottom-photo-button{aspect-ratio:16/10}
}
.activity-story-footer{display:flex;justify-content:center;margin-top:34px;padding-top:25px;border-top:1px solid #edf0f4}
.activity-story-footer a{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:9px 17px;border:1px solid #e1e6ed;border-radius:12px;background:#fff;color:var(--ml-navy);font:800 12px Cairo,sans-serif;text-decoration:none;transition:.2s}
.activity-story-footer a:hover{border-color:#e5aebc;color:var(--ml-red);transform:translateY(-2px)}
.activity-lightbox{position:fixed;inset:0;z-index:5000;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(6,10,22,.95);backdrop-filter:blur(8px)}
.activity-lightbox.open{display:flex}
.activity-lightbox img{max-width:94vw;max-height:86vh;border-radius:18px;box-shadow:0 30px 100px rgba(0,0,0,.45);object-fit:contain}
.activity-lightbox button{position:absolute;top:18px;left:22px;min-height:42px;border:0;border-radius:11px;background:#fff;color:var(--ml-navy);padding:8px 14px;font:800 12px Cairo,sans-serif;cursor:pointer}
@media(max-width:900px){.activity-detail-grid{grid-template-columns:1fr;gap:28px}.activity-detail-cover{max-width:760px;width:100%;margin-inline:auto;aspect-ratio:16/9;max-height:420px}.activity-detail-meta{gap:7px}.activity-gallery{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:600px){.activity-detail-hero{padding:45px 0 38px}.activity-detail-hero h1{font-size:32px;line-height:1.55}.activity-detail-lead{font-size:14px}.activity-detail-cover{aspect-ratio:5/4;border-radius:20px;min-height:0}.activity-detail-meta span{min-width:calc(50% - 7px);flex:1}.activity-detail-card{padding:23px 18px;border-radius:20px}.activity-story-body p,.activity-story-body p:first-child{font-size:14px;line-height:2.15}.activity-story-body h3{font-size:18px}.activity-inline-gallery{margin:28px 0;padding:13px;border-radius:17px}.activity-inline-gallery-heading h2{font-size:20px}.activity-gallery,.activity-gallery.count-2{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.gallery-item.featured{grid-column:span 2;grid-row:span 1;aspect-ratio:16/10;min-height:0}.gallery-item{border-radius:11px}.gallery-zoom{opacity:1;transform:none;font-size:9px;bottom:7px;inset-inline-start:7px}}
@media(prefers-reduced-motion:reduce){.activity-detail-actions .btn,.gallery-item img,.activity-story-footer a{transition:none}}
</style>
</head>
<body>
<main>
<section class="activity-detail-hero">
<div class="ml-wrap activity-detail-grid">
<div>
<div class="activity-detail-kicker">مبادرات وأنشطة ميدلايف</div>
<h1>${title}</h1>
${description ? '<p class="activity-detail-lead">' + description + '</p>' : ''}
${meta ? '<div class="activity-detail-meta">' + meta + '</div>' : ''}
${actions ? '<div class="activity-detail-actions">' + actions + '</div>' : ''}
</div>
<div class="activity-detail-cover ${image ? '' : 'no-image'}">
${image ? '<img src="' + esc(image) + '" alt="' + title + '" loading="eager">' : '<img src="/logo.PNG" alt="MedLife">'}
</div>
</div>
</section>
<section class="ml-section ml-soft activity-detail-section">
<div class="ml-wrap activity-detail-content">
<article class="activity-detail-card">
<header class="activity-story-heading">
  <span class="activity-section-kicker">تفاصيل ومعلومات</span>
  <h2>عن النشاط</h2>
</header>
<div class="activity-story-body">
${storyHtml}
</div>
<div class="activity-story-footer">
  <a href="/initiatives-gallery.html">← العودة إلى جميع الأنشطة</a>
</div>
</article>
${bottomGalleryHtml}
</div>
</section>
</main>
<div class="activity-lightbox" id="activityLightbox" aria-hidden="true"><button type="button" id="activityLightboxClose">إغلاق</button><img id="activityLightboxImage" alt=""></div>
<footer class="ml-footer">© 2026 مؤسسة ميدلايف الطبية الخيرية التطوعية — بالعمل التطوعي نصنع الأثر.</footer>
<script src="/site-nav.js?v=20261002-activities2"></script>
<script>
(() => {
 const box=document.getElementById("activityLightbox"), image=document.getElementById("activityLightboxImage");
 const close=()=>{box.classList.remove("open");box.setAttribute("aria-hidden","true");image.src="";};
 document.querySelectorAll(".editorial-image-button,.activity-bottom-photo-button").forEach(item=>item.addEventListener("click",()=>{image.src=item.dataset.image||"";image.alt=item.dataset.alt||item.querySelector("img")?.alt||"MedLife";box.classList.add("open");box.setAttribute("aria-hidden","false");}));
 document.getElementById("activityLightboxClose")?.addEventListener("click",close);
 box?.addEventListener("click",e=>{if(e.target===box)close();});
 document.addEventListener("keydown",e=>{if(e.key==="Escape")close();});
})();
</script>
</body></html>`;

  return new Response(html, {
    headers: { "content-type":"text/html; charset=UTF-8", "cache-control":"no-store, no-cache, must-revalidate" }
  });
}
