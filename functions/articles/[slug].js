const READER_ASSET = "/article-reader-v8.html";
const SUPABASE_URL = "https://ftvjakwogxdlxxbpfydf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_beiimOXraRWZguAX7balCQ_HVao1o3K";

function jsonArticle(row){
  if(!row) return null;
  return {
    id: row.id,
    title_ar: row.title_ar,
    title_en: row.title_en,
    excerpt_ar: row.excerpt_ar,
    excerpt_en: row.excerpt_en,
    content_ar: row.content_ar,
    content_en: row.content_en,
    author_name: row.author_name,
    category: row.category,
    image_url: row.image_url,
    slug: row.slug,
    canonical_path: row.canonical_path,
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function normalizeCmsArticle(row) {
  const metadata = row?.metadata && typeof row.metadata === "object" ? row.metadata : {};
  return {
    id: row.source_id,
    title_ar: row.title,
    title_en: metadata.title_en || null,
    excerpt_ar: row.excerpt,
    excerpt_en: metadata.excerpt_en || null,
    content_ar: row.body,
    content_en: metadata.content_en || null,
    author_name: metadata.author_name || "MedLife",
    category: metadata.category || metadata.specialty || "محتوى طبي",
    image_url: row.image_url || metadata.image_url || null,
    slug: row.slug,
    canonical_path: row.slug,
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    references: Array.isArray(metadata.references) ? metadata.references : []
  };
}

async function fetchCmsArticle(routeKey) {
  const query = new URLSearchParams({
    select: "source_id,content_type,title,slug,excerpt,body,metadata,published_at,public_url,created_at,updated_at,image_url",
    content_type: "eq.medical_article",
    slug: "eq." + routeKey,
    limit: "1"
  });
  const response = await fetch(
    SUPABASE_URL + "/rest/v1/public_site_content?" + query.toString(),
    {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
        Accept: "application/json"
      },
      cf: { cacheTtl: 0 }
    }
  );
  if (!response.ok) throw new Error("Supabase public article lookup failed: " + response.status);
  const rows = await response.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] : null;
  return row ? normalizeCmsArticle(row) : null;
}

async function renderArticle(context, article, routeKey) {
  const assetResponse = await context.env.ASSETS.fetch(new URL(READER_ASSET, context.request.url));
  if (!assetResponse.ok) return assetResponse;

  const html = await assetResponse.text();
  const canonicalKey = article.canonical_path || routeKey;
  // Escape less-than signs in JSON before embedding data inside a script element.
  const safeRoute = JSON.stringify(canonicalKey).replace(/</g, "\\u003c");
  const safeArticle = JSON.stringify(article)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  const bootstrap = `<script>(function(){const article=${safeArticle};window.__MEDLIFE_ARTICLE__=article;window.__MEDLIFE_ARTICLE_ROUTE__=${safeRoute};})();</script>`;
  const patched = html.replace(/<head>/i, `<head>${bootstrap}`);
  const canonical = new URL(`/articles/${encodeURIComponent(canonicalKey)}`, context.request.url).href;

  return new Response(patched, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=UTF-8",
      "cache-control": "no-store",
      "link": `<${canonical}>; rel="canonical"`,
      "x-medlife-article-renderer": "article-reader-v8",
      "x-medlife-article-route": canonicalKey,
    },
  });
}

export async function onRequestGet(context) {
  const routeKey = String(context.params.slug || "").trim();
  if (!routeKey || routeKey.includes("/") || routeKey === "." || routeKey === "..") {
    return new Response("Not found", { status: 404 });
  }

  // The new management platform publishes to Supabase's published-only projection.
  // Check it first so new CMS articles render without depending on the legacy D1 store.
  try {
    const cmsArticle = await fetchCmsArticle(routeKey);
    if (cmsArticle) return await renderArticle(context, cmsArticle, routeKey);
  } catch (error) {
    console.error("Supabase CMS article lookup failed:", error);
  }

  // Preserve compatibility with articles published through the old D1-backed editor.
  if (!context.env.DB) {
    return new Response("Article service unavailable", { status: 502 });
  }

  try {
    const legacyArticle = await context.env.DB
      .prepare("SELECT * FROM articles WHERE status='published' AND (canonical_path = ? OR slug = ?) LIMIT 1")
      .bind(routeKey, routeKey)
      .first();

    if (!legacyArticle) return new Response("Not found", { status: 404 });
    return await renderArticle(context, jsonArticle(legacyArticle), routeKey);
  } catch(error) {
    console.error("Public article route error:", error);
    return new Response("Article service unavailable", { status: 502 });
  }
}
