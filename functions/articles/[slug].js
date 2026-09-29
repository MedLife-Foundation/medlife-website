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

  try {
    let article = null;

    if (context.env.DB) {
      article = await context.env.DB
        .prepare("SELECT * FROM articles WHERE status='published' AND (canonical_path = ? OR slug = ?) LIMIT 1")
        .bind(routeKey, routeKey)
        .first();
    }

    // Management Platform fallback: newly published articles live in Supabase.
    if (!article) {
      const u = new URL("https://ftvjakwogxdlxxbpfydf.supabase.co/rest/v1/public_site_content");
      u.searchParams.set("select", "source_id,content_type,title,slug,excerpt,body,published_at,public_url,created_at,updated_at,image_url");
      u.searchParams.set("slug", "eq." + routeKey);
      u.searchParams.set("limit", "1");
      const response = await fetch(u, {
        headers: {
          apikey: "sb_publishable_beiimOXraRWZguAX7balCQ_HVao1o3K",
          Authorization: "Bearer sb_publishable_beiimOXraRWZguAX7balCQ_HVao1o3K",
          Accept: "application/json"
        }
      });
      if (response.ok) {
        const rows = await response.json();
        const row = Array.isArray(rows) ? rows[0] : null;
        if (row) {
          article = {
            id: row.source_id,
            title_ar: row.title,
            title_en: row.title,
            excerpt_ar: row.excerpt,
            excerpt_en: row.excerpt,
            content_ar: row.body,
            content_en: row.body,
            author_name: "MedLife",
            category: row.content_type === "medical_article" ? "مقال طبي" : "محتوى MedLife",
            image_url: row.image_url || "",
            slug: row.slug,
            canonical_path: row.public_url || `/articles/${row.slug}`,
            published_at: row.published_at,
            created_at: row.created_at,
            updated_at: row.updated_at
          };
        }
      }
    }

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
