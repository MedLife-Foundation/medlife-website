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

function cleanText(value, max) {
  return String(value ?? "").trim().slice(0, max);
}

function normalizeDate(value) {
  const raw = cleanText(value, 32);
  return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

async function fetchResource(resource, url) {
  const config = RESOURCES[resource];
  const limitRaw = Number(url.searchParams.get("limit") || 50);
  const limit = Number.isFinite(limitRaw) ? Math.min(50, Math.max(1, Math.trunc(limitRaw))) : 50;
  const query = new URLSearchParams({select: config.select, order: config.order, limit: String(limit)});

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

  const response = await fetch(SUPABASE_URL + "/rest/v1/" + config.table + "?" + query.toString(), {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
      Accept: "application/json"
    }
  });
  const body = await response.text();
  let data;
  try { data = JSON.parse(body); } catch { data = { error: body }; }
  if (!response.ok) throw new Error("تعذر تحميل بيانات الموقع.");
  return Array.isArray(data) ? data : [];
}

function volunteerPayload(body) {
  return {
    application_kind: body.application_kind === "current_member" ? "current_member" : "new_member",
    status: "pending",
    full_name: cleanText(body.full_name, 150),
    mother_name: cleanText(body.mother_name, 150),
    national_id: cleanText(body.national_id, 40),
    date_of_birth: normalizeDate(body.date_of_birth),
    gender: cleanText(body.gender, 20),
    email: cleanText(body.email, 200).toLowerCase(),
    phone: cleanText(body.phone, 40),
    governorate: cleanText(body.governorate, 100),
    address: cleanText(body.address, 500),
    academic_status: cleanText(body.academic_status, 40),
    university: cleanText(body.university, 250),
    faculty: cleanText(body.faculty, 250),
    study_year: cleanText(body.study_year, 100),
    graduation_year: cleanText(body.graduation_year, 100),
    profession: cleanText(body.profession, 250),
    workplace: cleanText(body.workplace, 250),
    resident_specialty: cleanText(body.resident_specialty, 250),
    residency_year: cleanText(body.residency_year, 100),
    residency_hospital: cleanText(body.residency_hospital, 250),
    doctor_graduation_year: cleanText(body.doctor_graduation_year, 100),
    doctor_specialty: cleanText(body.doctor_specialty, 250),
    doctor_workplace: cleanText(body.doctor_workplace, 250),
    specialty: cleanText(body.specialty, 250),
    specialist_graduation_year: cleanText(body.specialist_graduation_year, 100),
    specialist_workplace: cleanText(body.specialist_workplace, 250),
    interest: cleanText(body.interest, 200),
    motivation: cleanText(body.motivation, 2500),
    medlife_role: cleanText(body.medlife_role, 100),
    join_date: normalizeDate(body.join_date),
    cell: cleanText(body.cell, 100),
    consultation_specialty: cleanText(body.consultation_specialty, 250),
    field_location: cleanText(body.field_location, 100),
    volunteer_certificate: cleanText(body.volunteer_certificate, 30),
    source: "public_website"
  };
}

export async function onRequestPost({ request }) {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return json({ success: false, error: "صيغة الطلب غير صالحة." }, 415);
  }
  try {
    const body = await request.json();
    if (body.website) return json({ success: true });

    const target = body.action === "article_submission"
      ? "public_article_submissions"
      : "public_volunteer_applications";

    let payload;
    if (body.action === "article_submission") {
      payload = {
        status: "pending",
        title_ar: cleanText(body.title_ar, 500),
        title_en: cleanText(body.title_en, 500),
        excerpt_ar: cleanText(body.excerpt_ar, 5000),
        author_name: cleanText(body.author_name, 300),
        author_email: cleanText(body.author_email, 320).toLowerCase(),
        author_member_id: cleanText(body.author_member_id, 50),
        category: cleanText(body.category, 200),
        content_ar: cleanText(body.content_ar, 50000),
        image_url: cleanText(body.image_url, 2000),
        editorial_brief: body.editorial_brief && typeof body.editorial_brief === "object" ? body.editorial_brief : {},
        reference_data: Array.isArray(body.reference_data) ? body.reference_data.slice(0, 30) : [],
        source: "public_website"
      };
      if (!payload.title_ar || !payload.author_name || !payload.content_ar) {
        return json({ success: false, error: "يرجى إكمال عنوان المقال واسم الكاتب والمحتوى." }, 400);
      }
    } else {
      payload = volunteerPayload(body);
      if (!payload.full_name || !payload.phone || !payload.governorate) {
        return json({ success: false, error: "يرجى تعبئة الاسم والهاتف والمحافظة." }, 400);
      }
    }

    const response = await fetch(SUPABASE_URL + "/rest/v1/" + target, {
      method: "POST",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const text = await response.text();
      console.error("Public management write failed", target, response.status, text);
      return json({ success: false, error: "تعذر تسجيل الطلب في منصة الإدارة." }, 502);
    }
    return json({ success: true, message: "تم تسجيل الطلب في منصة الإدارة." }, 201);
  } catch (error) {
    console.error("Management API POST error", error);
    return json({ success: false, error: "تعذر استقبال الطلب حالياً." }, 500);
  }
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const resource = url.searchParams.get("resource") || "";
  if (!Object.prototype.hasOwnProperty.call(RESOURCES, resource)) {
    return json({ success: false, error: "مصدر البيانات غير صالح." }, 400);
  }
  try {
    const data = await fetchResource(resource, url);
    return json({ success: true, resource, data });
  } catch (error) {
    console.error("Management API GET error", error);
    return json({ success: false, error: "تعذر الاتصال بمنصة الإدارة." }, 502);
  }
}
