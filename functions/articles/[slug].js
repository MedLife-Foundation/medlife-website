const READER_ASSET = "/article-reader-v8.html";

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

export async function onRequestGet(context) {
  const routeKey = String(context.params.slug || "").trim();
  if (!routeKey || routeKey.includes("/") || routeKey === "." || routeKey === "..") {
    return new Response("Not found", { status: 404 });
  }

  if(!context.env.DB){
    return new Response("Article service unavailable", { status: 502 });
  }

  try {
    // Canonical public paths are stored separately from the optional human-readable slug.
    // Keep the slug fallback so previously published articles remain reachable.
    const article = await context.env.DB
      .prepare("SELECT * FROM articles WHERE status='published' AND (canonical_path = ? OR slug = ?) LIMIT 1")
      .bind(routeKey, routeKey)
      .first();

    if (!article) return new Response("Not found", { status: 404 });

    const assetResponse = await context.env.ASSETS.fetch(new URL(READER_ASSET, context.request.url));
    if (!assetResponse.ok) return assetResponse;

    const html = await assetResponse.text();
    const safeRoute = JSON.stringify(article.canonical_path || routeKey);
    const safeArticle = JSON.stringify(jsonArticle(article));
    const bootstrap = `<script>(function(){const article=${safeArticle};window.__MEDLIFE_ARTICLE__=article;window.__MEDLIFE_ARTICLE_ROUTE__=${safeRoute};})();</script>`;
    const patched = html.replace(/<head>/i, `<head>${bootstrap}`);
    const canonicalKey = article.canonical_path || routeKey;
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
  } catch(error) {
    console.error('Public article route error:', error);
    return new Response("Article service unavailable", { status: 502 });
  }
}
