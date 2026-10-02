const escHtml = (value) => String(value ?? "").replace(/[&<>"]/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
const escapeText = (value) => String(value ?? "");
const nl2p = (value) => escapeText(value).trim().split(/\n\s*\n|\n/).filter(Boolean).map(x => "<p>" + escHtml(x) + "</p>").join("");
const renderBody = (page) => {
  const html = page?.metadata?.html_body;
  if (typeof html === "string" && html.trim()) return html;
  return nl2p(page?.body || "");
};
const safeUrl = (value, origin) => {
  try {
    const u = new URL(String(value || ""), origin);
    return u.protocol === "https:" || u.origin === origin ? u.href : "#";
  } catch { return "#"; }
};

export async function onRequestGet({ params, request }) {
  const slug = String(params?.slug || "").trim();
  if (!slug || slug === "home") return new Response("Not Found", { status: 404 });

  const origin = new URL(request.url).origin;
  const api = origin + "/api/management?resource=content&content_type=page&slug=" + encodeURIComponent(slug) + "&limit=1";
  const response = await fetch(api, { headers: { Accept: "application/json" }, cf: { cacheTtl: 0 } });
  if (!response.ok) return new Response("تعذر تحميل الصفحة حالياً.", { status: 502 });

  const payload = await response.json().catch(() => ({}));
  const page = Array.isArray(payload?.data) ? payload.data[0] : null;
  if (!page) return new Response("الصفحة غير موجودة.", { status: 404 });

  if (page?.metadata?.template === "legacy_html" && typeof page.body === "string" && /<html[\\s>]/i.test(page.body)) {
    return new Response(page.body, { headers: { "content-type":"text/html; charset=UTF-8", "cache-control":"no-store, no-cache, must-revalidate" } });
  }

  const title = escHtml(page.title || "MedLife");
  const excerpt = escHtml(page.excerpt || "");
  const body = renderBody(page);
  const canonical = safeUrl(page.public_url || ("/pages/" + slug), origin);

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} | MedLife</title>
<meta name="description" content="${excerpt}">
<link rel="canonical" href="${canonical}">
<link rel="icon" href="/logo.PNG">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
:root{--navy:#151d36;--red:#e83255;--ink:#273248;--muted:#68758a;--bg:#f5f7fa;--line:#e1e6ed;--max:960px}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:Cairo,Arial,sans-serif;line-height:2}
a{text-decoration:none;color:inherit}.top{background:#fff;border-bottom:1px solid var(--line);padding:14px 20px}.topin{max-width:1180px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:20px}.brand{display:flex;align-items:center;gap:10px}.brand img{width:48px;height:48px;object-fit:contain}.brand strong{display:block;color:var(--navy);font-size:17px}.brand span{display:block;color:var(--muted);font-size:10px}.back{color:var(--red);font-size:11px;font-weight:800}
.hero{background:linear-gradient(135deg,#fff,#fff4f7);padding:72px 20px 58px;text-align:center}.hero .eyebrow{color:var(--red);font-size:12px;font-weight:900}.hero h1{max-width:900px;margin:10px auto;color:var(--navy);font-size:clamp(34px,5.5vw,58px);line-height:1.35}.hero p{max-width:760px;margin:0 auto;color:var(--muted);font-size:13px}
main{max-width:var(--max);margin:auto;padding:50px 20px 90px}.card{background:#fff;border:1px solid var(--line);border-radius:24px;padding:35px;box-shadow:0 16px 45px rgba(21,29,54,.07)}.card p{margin:0 0 18px;color:var(--muted);font-size:14px}.card p:last-child{margin-bottom:0}.empty{color:var(--muted)}
footer{background:#0d1426;color:#98a4b7;text-align:center;padding:28px;font-size:10px}
@media(max-width:600px){.topin{align-items:flex-start}.brand span{display:none}.back{font-size:10px}.hero{padding:52px 15px 45px}.card{padding:24px;border-radius:20px}}
</style>
</head>
<body>
<header class="top"><div class="topin">
<a class="brand" href="/"><img src="/logo.PNG" alt="MedLife"><span><strong>MedLife</strong>مؤسسة ميدلايف الطبية الخيرية التطوعية</span></a>
<a class="back" href="/">العودة إلى الموقع ←</a>
</div></header>
<section class="hero"><div class="eyebrow">MedLife · صفحة مُدارة</div><h1>${title}</h1>${excerpt ? "<p>"+excerpt+"</p>" : ""}</section>
<main><article class="card">${body || "<div class='empty'>لا يوجد محتوى منشور لهذه الصفحة بعد.</div>"}</article></main>
<footer>© 2026 مؤسسة ميدلايف الطبية الخيرية التطوعية — بالعمل التطوعي نصنع الأثر.</footer>
<script src="/site-nav.js?v=20261002-activities2"></script>
</body></html>`;

  return new Response(html, {
    headers: {
      "content-type":"text/html; charset=UTF-8",
      "cache-control":"no-store, no-cache, must-revalidate"
    }
  });
}
