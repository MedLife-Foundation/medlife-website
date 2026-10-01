const SUPABASE_URL = "https://ftvjakwogxdlxxbpfydf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_beiimOXraRWZguAX7balCQ_HVao1o3K";

const RESOURCES = {
  content: {
    table: "public_site_content",
    select: "source_id,content_type,title,slug,excerpt,body,metadata,published_at,public_url,created_at,updated_at,image_url",
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
  },
  settings: {
    table: "public_site_settings",
    select: "key,value,updated_at",
    order: "key.asc"
  },
  volunteer_recruitment: {
    table: "volunteer_recruitment_settings",
    select: "id,is_open,title,intro,closed_message,application_url,opens_at,closes_at,updated_at",
    order: "id.asc"
  },
  join_units: {
    table: "org_units",
    select: "id,name_ar,name_en,unit_type,description",
    order: "sort_order.asc"
  },
  join_form: {
    table: "admin_form_definitions",
    select: "id,form_key,name_ar,name_en,description_ar,description_en,form_kind,status,is_public,version,settings",
    order: "updated_at.desc"
  },
  membership_renewal_form: {
    table: "admin_form_definitions",
    select: "id,form_key,name_ar,name_en,description_ar,description_en,form_kind,status,is_public,version,settings",
    order: "updated_at.desc"
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
  if (resource === "volunteer_recruitment") {
    query.set("id", "eq.1");
  }
  if (resource === "join_units") {
    query.set("unit_type", "in.(department,field_team)");
    query.set("is_active", "eq.true");
  }
  if (resource === "join_form") {
    query.set("form_kind", "eq.new_member");
    query.set("status", "eq.published");
    query.set("is_public", "eq.true");
    query.set("limit", "1");
  }
  if (resource === "membership_renewal_form") {
    query.set("form_kind", "eq.membership_renewal");
    query.set("status", "eq.published");
    query.set("is_public", "eq.true");
    query.set("limit", "1");
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
  if (resource === "join_form" || resource === "membership_renewal_form") {
    const form = Array.isArray(data) ? data[0] : null;
    if (!form?.id) return [];
    const fieldsResponse = await fetch(
      SUPABASE_URL + "/rest/v1/admin_form_fields?select=id,form_id,field_key,label_ar,help_ar,placeholder_ar,field_type,required,options,visibility,target_unit_ids,sort_order,is_active&form_id=eq." + encodeURIComponent(form.id) + "&is_active=eq.true&order=sort_order.asc",
      {
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
          Accept: "application/json"
        }
      }
    );
    const fieldsBody = await fieldsResponse.text();
    let fields;
    try { fields = JSON.parse(fieldsBody); } catch { fields = []; }
    if (!fieldsResponse.ok || !Array.isArray(fields)) throw new Error("تعذر تحميل أسئلة النموذج.");
    if (resource === "membership_renewal_form") {
      const unitsResponse = await fetch(
        SUPABASE_URL + "/rest/v1/org_units?select=id,name_ar,name_en,unit_type&unit_type=in.(department,field_team)&is_active=eq.true&order=sort_order.asc,name_ar.asc",
        {
          headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
            Accept: "application/json"
          }
        }
      );
      const units = await unitsResponse.json().catch(() => []);
      const liveUnits = (Array.isArray(units) ? units : []).map(unit => ({
        id: String(unit.id),
        name_ar: cleanText(unit.name_ar || unit.name_en, 200),
        name_en: cleanText(unit.name_en || unit.name_ar, 200),
        unit_type: cleanText(unit.unit_type, 50)
      })).filter(unit => unit.id && unit.name_ar);
      const normalizedFields = fields.map(field => field.field_key === "current_units"
        ? {...field, options: liveUnits.map(unit => ({value: unit.id, label_ar: unit.name_ar, label_en: unit.name_en}))}
        : field
      );
      return [{...form, fields: normalizedFields, units: liveUnits}];
    }
    return [{...form, fields}];
  }
  return Array.isArray(data) ? data : [];
}

function sanitizeFormValue(value) {
  if (Array.isArray(value)) {
    return value.slice(0, 30).map(item => sanitizeFormValue(item)).filter(item => item !== "");
  }
  if (typeof value === "boolean" || typeof value === "number") return value;
  return cleanText(value, 5000);
}

async function validateAndSanitizeFormData(body, expectedFormKind = "new_member") {
  const formId = cleanText(body.form_id, 80);
  if (!formId) return {form_id: null, form_version: null, form_data: {}, form_schema: {}};

  const formResponse = await fetch(
    SUPABASE_URL + "/rest/v1/admin_form_definitions?select=id,form_key,name_ar,name_en,description_ar,description_en,form_kind,status,is_public,version,updated_at&id=eq." + encodeURIComponent(formId) + "&form_kind=eq." + encodeURIComponent(expectedFormKind) + "&status=eq.published&is_public=eq.true&limit=1",
    {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
        Accept: "application/json"
      }
    }
  );
  const formRows = await formResponse.json().catch(() => []);
  const form = Array.isArray(formRows) ? formRows[0] : null;
  if (!form?.id) throw new Error("نموذج الانضمام غير صالح أو لم يعد منشوراً.");

  const fieldsResponse = await fetch(
    SUPABASE_URL + "/rest/v1/admin_form_fields?select=field_key,label_ar,label_en,help_ar,placeholder_ar,field_type,required,options,visibility,target_unit_ids,sort_order&form_id=eq." + encodeURIComponent(form.id) + "&is_active=eq.true&order=sort_order.asc&limit=200",
    {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
        Accept: "application/json"
      }
    }
  );
  const fields = await fieldsResponse.json().catch(() => []);
  const fieldRows = Array.isArray(fields) ? fields : [];
  const allowed = new Set(fieldRows.map(field => cleanText(field.field_key, 120)).filter(Boolean));
  const raw = body.form_data && typeof body.form_data === "object" && !Array.isArray(body.form_data) ? body.form_data : {};
  const formData = {};
  for (const [key, value] of Object.entries(raw)) {
    const safeKey = cleanText(key, 120);
    if (!allowed.has(safeKey) || /password|secret|token/i.test(safeKey)) continue;
    const safeValue = sanitizeFormValue(value);
    if (Array.isArray(safeValue) ? safeValue.length : safeValue !== "") formData[safeKey] = safeValue;
  }
  for (const field of fieldRows) {
    if (!field.required) continue;
    const value = formData[field.field_key];
    const missing = Array.isArray(value)
      ? value.length === 0
      : typeof value === "boolean"
        ? false
        : value === undefined || value === null || String(value).trim() === "";
    if (missing) throw new Error("يرجى تعبئة السؤال: " + String(field.label_ar || field.field_key));
  }

  const formSchema = {
    form_id: form.id,
    form_key: form.form_key,
    version: form.version,
    name_ar: form.name_ar,
    name_en: form.name_en,
    description_ar: form.description_ar,
    description_en: form.description_en,
    captured_at: new Date().toISOString(),
    fields: fieldRows.map(field => ({
      field_key: field.field_key,
      label_ar: field.label_ar,
      label_en: field.label_en,
      help_ar: field.help_ar,
      placeholder_ar: field.placeholder_ar,
      field_type: field.field_type,
      required: Boolean(field.required),
      options: Array.isArray(field.options) ? field.options.slice(0, 100) : [],
      visibility: field.visibility && typeof field.visibility === "object" ? field.visibility : {mode:"always"},
      target_unit_ids: Array.isArray(field.target_unit_ids) ? field.target_unit_ids.slice(0, 50) : [],
      sort_order: Number(field.sort_order || 0)
    }))
  };
  return {form_id: form.id, form_version: form.version, form_data: formData, form_schema: formSchema};
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
    requested_departments: Array.isArray(body.requested_departments)
      ? body.requested_departments.map((item) => cleanText(item, 160)).filter(Boolean).slice(0, 6)
      : [],
    form_id: null,
    form_version: null,
    form_data: {},
    form_schema: {},
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
      : body.action === "membership_renewal"
        ? "public_membership_renewal_submissions"
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
    } else if (body.action === "membership_renewal") {
      let dynamic;
      try {
        dynamic = await validateAndSanitizeFormData(body, "membership_renewal");
      } catch (formError) {
        return json({ success: false, error: formError.message || "نموذج التجديد غير صالح." }, 400);
      }

      const data = dynamic.form_data;
      if (data.declaration_accurate !== true || data.privacy_consent !== true) {
        return json({ success: false, error: "يرجى تأكيد صحة المعلومات والموافقة على استخدام البيانات." }, 400);
      }

      const requestedIds = Array.isArray(data.current_units)
        ? [...new Set(data.current_units.map(item => cleanText(item, 80)).filter(Boolean))].slice(0, 8)
        : [];
      if (!requestedIds.length) {
        return json({ success: false, error: "يرجى اختيار قسم أو فريق واحد على الأقل." }, 400);
      }

      const unitsResponse = await fetch(
        SUPABASE_URL + "/rest/v1/org_units?select=id,name_ar,name_en,unit_type&unit_type=in.(department,field_team)&is_active=eq.true&order=sort_order.asc,name_ar.asc",
        {
          headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
            Accept: "application/json"
          }
        }
      );
      const unitsRows = await unitsResponse.json().catch(() => []);
      const activeUnits = Array.isArray(unitsRows) ? unitsRows : [];
      const requestedUnits = activeUnits
        .filter(unit => requestedIds.includes(String(unit.id)))
        .map(unit => ({
          id: String(unit.id),
          name_ar: cleanText(unit.name_ar || unit.name_en, 200),
          unit_type: cleanText(unit.unit_type, 50)
        }));
      if (requestedUnits.length !== requestedIds.length) {
        return json({ success: false, error: "يوجد قسم أو فريق غير صالح ضمن الاختيار." }, 400);
      }

      const numberValue = value => {
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
      };
      const toArray = value => Array.isArray(value)
        ? value.map(item => cleanText(item, 100)).filter(Boolean).slice(0, 30)
        : [];
      const certificateTypes = toArray(data.certificate_types).filter(value => value !== "none");

      const payload = {
        form_id: dynamic.form_id,
        form_version: dynamic.form_version,
        status: "pending",
        full_name: cleanText(data.full_name, 150),
        father_name: cleanText(data.father_name, 150),
        mother_name: cleanText(data.mother_name, 150),
        national_id: cleanText(data.national_id, 40),
        country: cleanText(data.country, 100),
        governorate: cleanText(data.governorate, 100),
        city: cleanText(data.city, 120),
        full_address: cleanText(data.full_address, 1000),
        date_of_birth: normalizeDate(data.date_of_birth),
        gender: cleanText(data.gender, 20),
        email: cleanText(data.email, 250).toLowerCase(),
        phone: cleanText(data.phone, 50),
        academic_status: cleanText(data.academic_status, 60),
        university: cleanText(data.university, 250),
        specialty: cleanText(data.specialty, 250),
        profession: cleanText(data.profession, 250),
        workplace: cleanText(data.workplace, 250),
        skills: cleanText(data.skills, 1000).split(/[,،]/).map(value => value.trim()).filter(Boolean).slice(0, 30),
        join_date: normalizeDate(data.join_date),
        requested_unit_ids: requestedUnits.map(unit => unit.id),
        requested_units: requestedUnits,
        current_role_in_team: cleanText(data.current_role_in_team, 250),
        reported_total_volunteer_hours: numberValue(data.reported_total_volunteer_hours),
        volunteer_commitment_hours: numberValue(data.volunteer_commitment_hours),
        certificate_types: certificateTypes,
        certificate_other: cleanText(data.certificate_other, 500),
        availability: cleanText(data.availability, 50),
        interest_areas: toArray(data.interest_areas),
        continuing_as_volunteer: data.continuing_as_volunteer === true,
        additional_notes: cleanText(data.additional_notes, 3000),
        declaration_accurate: true,
        privacy_consent: true,
        form_data: {...dynamic.form_data, current_units: requestedUnits.map(unit => unit.id)},
        form_schema: {
          ...dynamic.form_schema,
          fields: dynamic.form_schema.fields.map(field => field.field_key === "current_units"
            ? {...field, options: requestedUnits.map(unit => ({value: unit.id, label_ar: unit.name_ar, label_en: unit.name_ar}))}
            : field)
        },
        source: "public_website"
      };

      const requiredCore = [
        "full_name","father_name","mother_name","national_id","country","governorate",
        "full_address","date_of_birth","gender","email","phone","academic_status","join_date"
      ];
      if (requiredCore.some(key => !String(payload[key] ?? "").trim())) {
        return json({ success: false, error: "يرجى إكمال جميع المعلومات الأساسية المطلوبة." }, 400);
      }

      const response = await fetch(SUPABASE_URL + "/rest/v1/public_membership_renewal_submissions?select=id", {
        method: "POST",
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
          Prefer: "return=representation"
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Membership renewal write failed", response.status, errorText);
        return json({ success: false, error: "تعذر تسجيل طلب تجديد العضوية." }, 502);
      }
      const created = await response.json().catch(() => []);
      return json({
        success: true,
        submission_id: Array.isArray(created) ? created[0]?.id || null : null,
        message: "تم استلام طلب تجديد العضوية وسيتم تدقيقه من فريق ميدلايف."
      }, 201);
    } else {
      const recruitmentResponse = await fetch(
        SUPABASE_URL + "/rest/v1/volunteer_recruitment_settings?select=is_open,opens_at,closes_at&id=eq.1",
        {
          headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
            Accept: "application/json"
          }
        }
      );
      const recruitment = await recruitmentResponse.json().catch(() => []);
      const config = Array.isArray(recruitment) ? recruitment[0] : null;
      const now = Date.now();
      const opensAt = config?.opens_at ? Date.parse(config.opens_at) : null;
      const closesAt = config?.closes_at ? Date.parse(config.closes_at) : null;
      const isOpen = Boolean(config?.is_open) && (!opensAt || now >= opensAt) && (!closesAt || now < closesAt);
      if (!isOpen) {
        return json({ success: false, error: "باب الانضمام مغلق حالياً." }, 403);
      }

      payload = volunteerPayload(body);
      if (!payload.full_name || !payload.phone || !payload.governorate) {
        return json({ success: false, error: "يرجى تعبئة الاسم والهاتف والمحافظة." }, 400);
      }

      try {
        const dynamic = await validateAndSanitizeFormData(body);
        payload.form_id = dynamic.form_id;
        payload.form_version = dynamic.form_version;
        payload.form_data = dynamic.form_data;
        payload.form_schema = dynamic.form_schema;
      } catch (formError) {
        return json({ success: false, error: formError.message || "نموذج الانضمام غير صالح." }, 400);
      }

      const unitsResponse = await fetch(
        SUPABASE_URL + "/rest/v1/org_units?select=name_ar,name_en&unit_type=in.(department,field_team)&is_active=eq.true",
        {
          headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
            Accept: "application/json"
          }
        }
      );
      const units = await unitsResponse.json().catch(() => []);
      const allowedNames = new Set(
        (Array.isArray(units) ? units : []).flatMap((unit) => [unit.name_ar, unit.name_en]).filter(Boolean)
      );
      payload.requested_departments = payload.requested_departments.filter((item) => allowedNames.has(item));
    }

    const writeUrl = SUPABASE_URL + "/rest/v1/" + target + (body.action === "article_submission" ? "?select=id" : "");
    const response = await fetch(writeUrl, {
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
    const created = body.action === "article_submission" ? await response.json().catch(() => []) : [];
    const submissionId = Array.isArray(created) ? created[0]?.id || null : null;
    return json({ success: true, submission_id: submissionId, message: "تم تسجيل الطلب في منصة الإدارة." }, 201);
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
