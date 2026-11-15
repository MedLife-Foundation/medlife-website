import { authenticateArticleAdmin, json } from "./article-admin-session.js";
import { CONTENT_SOURCES, mapNotionPost } from "./content-hub-review-mapper.mjs";

const NOTION_VERSION = "2025-09-03";
const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 100;

function errorResponse(code, message, status) {
  return json({ success: false, code, error: message }, status);
}

function resolveSource(key) {
  return CONTENT_SOURCES.find((source) => source.key === key) ?? null;
}

export async function onRequest({ request, env }) {
  if (request.method !== "GET") {
    return errorResponse("method_not_allowed", "هذا المسار مخصص للقراءة فقط.", 405);
  }

  if (!env.DB) {
    return errorResponse("database_unavailable", "قاعدة جلسات الإدارة غير متاحة.", 503);
  }

  const admin = await authenticateArticleAdmin(request, env.DB);
  if (!admin) {
    return errorResponse("unauthorized", "يجب تسجيل الدخول بحساب إداري للوصول إلى مراجعة محتوى ميدلايف.", 401);
  }

  if (!env.NOTION_API_TOKEN) {
    return errorResponse("notion_not_configured", "ربط Notion غير مهيأ في بيئة المعاينة. يلزم ضبط NOTION_API_TOKEN ومنح التكامل صلاحية قراءة بنوك الخلايا.", 503);
  }

  const url = new URL(request.url);
  const source = resolveSource(url.searchParams.get("cell") || "astrocyte");
  if (!source) {
    return errorResponse("unknown_cell", "الخلية المطلوبة غير معروفة.", 400);
  }

  const pageSizeRaw = Number(url.searchParams.get("page_size") || DEFAULT_PAGE_SIZE);
  const pageSize = Number.isFinite(pageSizeRaw)
    ? Math.max(1, Math.min(MAX_PAGE_SIZE, Math.trunc(pageSizeRaw)))
    : DEFAULT_PAGE_SIZE;
  const cursor = url.searchParams.get("cursor") || "";

  if (cursor.length > 2000) {
    return errorResponse("invalid_cursor", "مؤشر الانتقال غير صالح.", 400);
  }

  const query = { page_size: pageSize };
  if (cursor) query.start_cursor = cursor;

  try {
    const response = await fetch(
      `https://api.notion.com/v1/data_sources/${source.dataSourceId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.NOTION_API_TOKEN}`,
          "Notion-Version": NOTION_VERSION,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(query)
      }
    );

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const code = response.status === 401 || response.status === 403
        ? "notion_access_denied"
        : response.status === 404
          ? "notion_source_not_found"
          : "notion_request_failed";
      const message = response.status === 401 || response.status === 403
        ? "رفض Notion الوصول إلى بنك هذه الخلية. تحقق من مشاركة قاعدة البيانات مع التكامل."
        : response.status === 404
          ? "لم يتمكن Notion من العثور على بنك هذه الخلية أو أن التكامل لا يملك صلاحية الوصول إليه."
          : "تعذر قراءة منشورات هذه الخلية من Notion.";
      console.error("Content Hub Notion read failed", {
        cell: source.key,
        status: response.status,
        notionCode: payload?.code || null
      });
      return errorResponse(code, message, 502);
    }

    const items = (Array.isArray(payload.results) ? payload.results : [])
      .map((page) => mapNotionPost(page, source));

    return json({
      success: true,
      read_only: true,
      cell: { key: source.key, label: source.label },
      items,
      has_more: payload.has_more === true,
      next_cursor: payload.next_cursor || null
    });
  } catch (error) {
    console.error("Content Hub read error", {
      cell: source.key,
      message: error instanceof Error ? error.message : "unknown"
    });
    return errorResponse("notion_unavailable", "تعذر الاتصال بخدمة Notion حالياً.", 502);
  }
}
