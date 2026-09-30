const API_RESOURCE = "support";

function sanitizeManagedHtml(value) {
  return String(value || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*')/gi, "")
    .replace(/\s(?:href|src)\s*=\s*("|')\s*javascript:[\s\S]*?\2/gi, "");
}

export async function onRequestGet(context) {
  const assetResponse = await context.env.ASSETS.fetch(context.request);
  if (!assetResponse.ok) return assetResponse;

  try {
    const apiUrl = new URL("/api/management", context.request.url);
    apiUrl.searchParams.set("resource", "content");
    apiUrl.searchParams.set("content_type", "page");
    apiUrl.searchParams.set("slug", API_RESOURCE);
    apiUrl.searchParams.set("limit", "1");

    const response = await fetch(apiUrl, { headers: { Accept: "application/json" } });
    if (!response.ok) return assetResponse;

    const payload = await response.json().catch(() => ({}));
    const page = Array.isArray(payload?.data) ? payload.data[0] : null;
    const body = page?.body ? sanitizeManagedHtml(page.body) : "";
    if (!body) return assetResponse;

    const html = await assetResponse.text();
    const startMarker = "<!--MANAGED_SUPPORT_START-->";
    const endMarker = "<!--MANAGED_SUPPORT_END-->";
    const start = html.indexOf(startMarker);
    const end = html.indexOf(endMarker, start + startMarker.length);
    if (start < 0 || end < 0) return assetResponse;

    const managed = html.slice(0, start + startMarker.length) + body + html.slice(end);
    return new Response(managed, {
      status: assetResponse.status,
      headers: {
        "content-type": "text/html; charset=UTF-8",
        "cache-control": "public, max-age=60, s-maxage=60"
      }
    });
  } catch (_) {
    return assetResponse;
  }
}
