const SUPABASE_URL = "https://ftvjakwogxdlxxbpfydf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_beiimOXraRWZguAX7balCQ_HVao1o3K";

const RESOURCES = {
  content: {
    table: "public_site_content",
    select: "source_id,content_type,title,slug,excerpt,body,published_at,public_url,created_at,updated_at",
    order: "published_at.desc"
  },
  activities: {
    table: "public_site_activities",
    select: "source_id,title,activity_type,description,governorate,city,start_at,end_at,status,participant_target,participant_count,created_at,updated_at",
    order: "start_at.desc"
  },
  campaigns: {
    table: "public_site_campaigns",
    select: "source_id,name,description,status,start_date,end_date,governorate,objective,target_value,achieved_value,budget_currency,created_at,updated_at",
    order: "start_date.desc"
  },
  support: {
    table: "public_site_support_cases",
    select: "source_id,case_code,subject,category,status,priority,description,amount_required,amount_secured,currency,public_url,documents_verified,created_at,updated_at",
    order: "created_at.desc"
  },
  media: {
    table: "public_site_media",
    select: "source_id,file_name,mime_type,alt_text,caption,public_url,created_at",
    order: "created_at.desc"
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60, s-maxage=60"
    }
  });
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const resource = url.searchParams.get("resource") || "";

  if (!Object.prototype.hasOwnProperty.call(RESOURCES, resource)) {
    return json({ success: false, error: "مصدر البيانات غير صالح." }, 400);
  }

  const config = RESOURCES[resource];
  const limitRaw = Number(url.searchParams.get("limit") || 50);
  const limit = Number.isFinite(limitRaw) ? Math.min(50, Math.max(1, Math.trunc(limitRaw))) : 50;

  const query = new URLSearchParams();
  query.set("select", config.select);
  query.set("order", config.order);
  query.set("limit", String(limit));

  if (resource === "content") {
    const slug = url.searchParams.get("slug");
    if (slug) query.set("slug", "eq." + slug);
    const type = url.searchParams.get("content_type");
    if (type) query.set("content_type", "eq." + type);
  }

  if (resource === "activities") {
    const status = url.searchParams.get("status");
    if (status) query.set("status", "eq." + status);
  }

  if (resource === "campaigns") {
    const status = url.searchParams.get("status");
    if (status) query.set("status", "eq." + status);
  }

  if (resource === "support") {
    const status = url.searchParams.get("status");
    if (status) query.set("status", "eq." + status);
  }

  try {
    const response = await fetch(
      SUPABASE_URL + "/rest/v1/" + config.table + "?" + query.toString(),
      {
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
          Accept: "application/json"
        }
      }
    );

    const body = await response.text();
    let data;
    try {
      data = JSON.parse(body);
    } catch {
      data = { error: body };
    }

    if (!response.ok) {
      console.error("Management API error", resource, response.status, data);
      return json({ success: false, error: "تعذر تحميل بيانات الموقع." }, 502);
    }

    return json({
      success: true,
      resource,
      data: Array.isArray(data) ? data : []
    });
  } catch (error) {
    console.error("Management API request failed", error);
    return json({ success: false, error: "تعذر الاتصال بمنصة الإدارة." }, 502);
  }
}
