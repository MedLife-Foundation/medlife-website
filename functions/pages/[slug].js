const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));

const safeUrl = (value, origin) => {
  try {
    const u = new URL(String(value || ""), origin);
    return u.protocol === "https:" || u.origin === origin ? u.href : "";
  } catch {
    return "";
  }
};

const SUPABASE_URL = "https://ftvjakwogxdlxxbpfydf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_beiimOXraRWZguAX7balCQ_HVao1o3K";

async function fetchPage(slug) {
  const query = new URLSearchParams({
    select: "title,slug,excerpt,body,metadata,published_at,public_url,updated_at",
    slug: "eq." + slug,
    content_type: "eq.page",
    status: "eq.published",
    limit: "1"
  });
  const response = await fetch(SUPABASE_URL + "/rest/v1/public_site_content?" + query.toString(), {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
      Accept: "application/json"
    },
    cf: {cacheTtl: 0}
  });
  if (!response.ok) return null;
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

function renderBody(body, title) {
  const raw = String(body || "").trim();
  if (!raw) return '<div class="page-empty">لا يوجد محتوى منشور لهذه الصفحة حالياً.</div>';

  if (/^<!doctype html>/i.test(raw) || /^<html[\s>]/i.test(raw)) {
    return raw;
  }

  const paragraphs = raw
    .split(/\n\s*\n|\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => '<p>' + esc(line) + '</p>')
    .join("");

  return '<article class="managed-page-card">' +
    '<h2>' + esc(title) + '</h2>' +
    paragraphs +
    '</article>';
}

export async function onRequestGet({params, request}) {
  const slug = String(params?.slug || "").trim().toLowerCase();
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug === "home") {
    return new Response("الصفحة غير موجودة.", {status:404});
  }

  const page = await fetchPage(slug);
  if (!page) return new Response("الصفحة غير موجودة أو غير منشورة للعامة.", {status:404});

  const origin = new URL(request.url).origin;
  const title = esc(page.title || "صفحة ميدلايف");
  const excerpt = esc(page.excerpt || "");
  const body = renderBody(page.body, page.title || "صفحة ميدلايف");
  const metaDescription = excerpt || "مؤسسة ميدلايف الطبية الخيرية التطوعية";

  const html = '<!doctype html>' +
'<html lang="ar" dir="rtl">' +
'<head>' +
'<meta charset="utf-8">' +
'<meta name="viewport" content="width=device-width,initial-scale=1">' +
'<title>' + title + ' | مؤسسة ميدلايف</title>' +
'<meta name="description" content="' + metaDescription + '">' +
'<link rel="icon" href="/logo.PNG">' +
'<link rel="preconnect" href="https://fonts.googleapis.com">' +
'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
'<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">' +
'<link rel="stylesheet" href="/homepage-redesign.css">' +
'<style>' +
'.managed-page-hero{padding:66px 0 48px;background:linear-gradient(135deg,#f8fafc 0%,#fff 60%,#fff1f4 100%);border-bottom:1px solid var(--ml-line)}' +
'.managed-page-hero h1{margin:0;color:var(--ml-navy);font-size:clamp(34px,5vw,58px);line-height:1.5}' +
'.managed-page-hero p{margin:12px 0 0;color:var(--ml-muted);font-size:14px;line-height:2;max-width:850px}' +
'.managed-page-section{padding:70px 0}' +
'.managed-page-card{max-width:900px;margin:0 auto;background:#fff;border:1px solid var(--ml-line);border-radius:24px;padding:34px;box-shadow:var(--ml-shadow)}' +
'.managed-page-card h2{margin:0 0 18px;color:var(--ml-navy);font-size:24px}' +
'.managed-page-card p{margin:0 0 14px;color:var(--ml-muted);font-size:14px;line-height:2.1}' +
'.managed-page-card p:last-child{margin-bottom:0}' +
'.page-empty{max-width:900px;margin:0 auto;padding:42px 20px;text-align:center;border:1px dashed #dce3eb;border-radius:18px;color:var(--ml-muted);background:#fbfcfe}' +
'</style>' +
'</head><body><main>' +
'<section class="managed-page-hero"><div class="ml-wrap"><div class="ml-eyebrow">صفحة من موقع ميدلايف</div><h1>' + title + '</h1>' +
(excerpt ? '<p>' + excerpt + '</p>' : '') +
'</div></section>' +
'<section class="ml-section ml-soft managed-page-section"><div class="ml-wrap">' +
body +
'</div></section>' +
'</main><footer class="ml-footer">© 2026 مؤسسة ميدلايف الطبية الخيرية التطوعية — بالعمل التطوعي نصنع الأثر.</footer>' +
'<script src="/site-nav.js?v=20261002-cms1"></script></body></html>';

  const response = new Response(html, {
    status: 200,
    headers: {
      "content-type":"text/html; charset=UTF-8",
      "cache-control":"no-store, no-cache, must-revalidate",
      "x-medlife-managed-page":"1"
    }
  });
  return response;
}
