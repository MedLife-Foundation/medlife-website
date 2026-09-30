const READER_ASSET = "/article-reader-v8.html";
const MANAGEMENT_API = "/api/management";

function jsonArticle(row){
  if(!row) return null;
  return {
    id: row.id || row.source_id,
    title_ar: row.title_ar || row.title,
    title_en: row.title_en || row.title,
    excerpt_ar: row.excerpt_ar || row.excerpt,
    excerpt_en: row.excerpt_en || row.excerpt,
    content_ar: row.content_ar || row.body,
    content_en: row.content_en || row.body,
    author_name: row.author_name || row.metadata?.author_name || "MedLife",
    category: row.category || row.metadata?.category || "مقال طبي",
    image_url: row.image_url || row.metadata?.image_url || "",
    slug: row.slug,
    canonical_path: row.public_url || "/articles/" + encodeURIComponent(row.slug),
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

  try {
    const api = new URL(MANAGEMENT_API, context.request.url);
    api.searchParams.set("resource", "content");
    api.searchParams.set("content_type", "medical_article");
    api.searchParams.set("slug", routeKey);
    api.searchParams.set("limit", "1");

    const response = await fetch(api, { headers: { Accept: "application/json" } });
    if (!response.ok) return new Response("Article service unavailable", { status: 502 });

    const payload = await response.json().catch(() => ({}));
    const row = Array.isArray(payload?.data) ? payload.data[0] : null;
    if (!row) return new Response("Not found", { status: 404 });

    const article = jsonArticle(row);
    const assetResponse = await context.env.ASSETS.fetch(new URL(READER_ASSET, context.request.url));
    if (!assetResponse.ok) return assetResponse;

    const html = await assetResponse.text();
    const safeRoute = JSON.stringify("/articles/" + encodeURIComponent(row.slug));
    const safeArticle = JSON.stringify(article);
    const bootstrap = "<script>(function(){const article=" + safeArticle + ";window.__MEDLIFE_ARTICLE__=article;window.__MEDLIFE_ARTICLE_ROUTE__=" + safeRoute + ";})();</script>";
    const patched = html.replace(/<head>/i, "<head>" + bootstrap);

    const canonical = new URL("/articles/" + encodeURIComponent(row.slug), context.request.url).href;
    return new Response(patched, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=UTF-8",
        "cache-control": "no-store",
        "link": "<" + canonical + ">; rel=\"canonical\"",
        "x-medlife-article-renderer": "article-reader-v8",
        "x-medlife-article-source": "management-platform"
      }
    });
  } catch (error) {
    console.error("Public article route error:", error);
    return new Response("Article service unavailable", { status: 502 });
  }
}
