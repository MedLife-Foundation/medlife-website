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
    image_alt: row.image_alt || null,
    seo_title: row.seo_title || null,
    seo_description: row.meta_description || row.seo_description || null,
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
    body_format_version: metadata.body_format_version,
    content_en: metadata.content_en || null,
    author_name: metadata.author_name || "MedLife",
    category: metadata.category || metadata.specialty || "محتوى طبي",
    image_url: row.image_url || metadata.image_url || null,
    image_alt: metadata.image_alt || null,
    seo_title: metadata.seo_title || null,
    seo_description: metadata.seo_description || null,
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


function articlePlainText(value) {
  return String(value || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:nbsp|#160);/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ").trim();
}

function htmlEsc(value) {
  return String(value || "").replace(/[&<>"']/g, function(character) {
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[character];
  });
}

function articleShortText(value, max) {
  const clean = articlePlainText(value);
  if (clean.length <= max) return clean;
  const segment = clean.slice(0, max + 1);
  const boundary = segment.lastIndexOf(" ");
  return (boundary >= max * .6 ? segment.slice(0, boundary) : segment.slice(0, max)).trim();
}

function safeArticleImage(url) {
  try {
    const value = new URL(String(url || ""));
    return value.protocol === "https:" ? value.href : null;
  } catch { return null; }
}

function articleMetaTags(article, canonicalUrl) {
  const rawTitle = articlePlainText(article.seo_title || article.title_ar) || "مقال طبي";
  const title = /(?:medlife|ميدلايف)/i.test(rawTitle) ? rawTitle : rawTitle + " | MedLife";
  const description = articleShortText(
    article.seo_description || article.excerpt_ar || article.content_ar || "مقال طبي من المكتبة الطبية لمؤسسة ميدلايف.",
    175
  );
  const image = safeArticleImage(article.image_url);
  const alt = articlePlainText(article.image_alt || article.title_ar || "");
  const publisher = "MedLife";
  const tags = [
    '<title>' + htmlEsc(title) + '</title>',
    '<meta name="description" content="' + htmlEsc(description) + '">',
    '<link rel="canonical" href="' + htmlEsc(canonicalUrl) + '">',
    '<meta property="og:type" content="article">',
    '<meta property="og:site_name" content="' + publisher + '">',
    '<meta property="og:locale" content="ar_SY">',
    '<meta property="og:title" content="' + htmlEsc(title) + '">',
    '<meta property="og:description" content="' + htmlEsc(description) + '">',
    '<meta property="og:url" content="' + htmlEsc(canonicalUrl) + '">',
    '<meta name="twitter:card" content="' + (image ? 'summary_large_image' : 'summary') + '">',
    '<meta name="twitter:title" content="' + htmlEsc(title) + '">',
    '<meta name="twitter:description" content="' + htmlEsc(description) + '">'
  ];
  if (image) {
    tags.push('<meta property="og:image" content="' + htmlEsc(image) + '">');
    tags.push('<meta name="twitter:image" content="' + htmlEsc(image) + '">');
    if (alt) tags.push('<meta property="og:image:alt" content="' + htmlEsc(alt) + '">');
  }
  const graph = {
    "@context":"https://schema.org",
    "@type":"Article",
    headline: articlePlainText(article.title_ar),
    description: description,
    inLanguage:"ar",
    mainEntityOfPage:canonicalUrl,
    publisher:{"@type":"Organization",name:publisher,url:"https://www.medlifesy.org"},
  };
  if (article.author_name) {
    graph.author = {
      "@type":/^(?:MedLife|ميدلايف)$/i.test(article.author_name)?"Organization":"Person",
      name:articlePlainText(article.author_name)
    };
  }
  if (article.published_at) graph.datePublished = article.published_at;
  if (article.updated_at) graph.dateModified = article.updated_at;
  if (image) graph.image = [image];
  tags.push('<script type="application/ld+json">' +
    JSON.stringify(graph).replace(/</g, "\\u003c").replace(/\u2028/g,"\\u2028").replace(/\u2029/g,"\\u2029") +
    '</script>');
  return tags.join("");
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
  const canonical = new URL(`/articles/${encodeURIComponent(canonicalKey)}`, "https://www.medlifesy.org").href;
  // Public metadata must be rendered by the server, not added by JavaScript after crawl.
  const cleanTemplate = html
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\b[^>]*name=["']description["'][^>]*>/i, "");
  const tags = articleMetaTags(article, canonical);
  const patched = cleanTemplate.replace(/<head>/i, `<head>${tags}${bootstrap}`);

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
