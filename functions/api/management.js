const SUPABASE_URL = "https://ftvjakwogxdlxxbpfydf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_beiimOXraRWZguAX7balCQ_HVao1o3K";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0dmpha3dvZ3hkbHh4YnBmeWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MDMxNTcsImV4cCI6MjEwNjI3OTE1N30.mu0ob9dI7yiL_0PPytvaWqRrv--ZOkwkwd-4tKspmIE";

const RESOURCES = {
  content: {
    table: "public_site_content",
    select: "source_id,content_type,title,slug,excerpt,body,metadata,published_at,public_url,created_at,updated_at,image_url",
    order: "published_at.desc"
  },
  activities: {
    table: "public_site_activities",
    select: "source_id,title,activity_type,description,details,governorate,city,start_at,end_at,status,participant_target,participant_count,cover_image_url,slug,source_url,gallery_url,gallery,created_at,updated_at",
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
  },
  birthdays: {
    table: "public_site_birthdays",
    select: "volunteer_id,display_name,birth_month,birth_day",
    order: "display_name.asc"
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, no-cache, must-revalidate"
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
    const slug = url.searchParams.get("slug");
    if (slug) query.set("slug", "eq." + slug);
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
    query.set("unit_type", "in.(cell,department,field_team)");
    query.set("is_active", "eq.true");
  }
  if (resource === "join_form") {
    query.set("form_kind", "eq.new_member");
    query.set("status", "eq.published");
    query.set("is_public", "eq.true");
    query.set("limit", "1");
  }
  if (resource === "birthdays") {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Damascus",
      month: "numeric",
      day: "numeric"
    }).formatToParts(now);
    const month = parts.find(part => part.type === "month")?.value;
    const day = parts.find(part => part.type === "day")?.value;
    if (month && day) {
      query.set("birth_month", "eq." + month);
      query.set("birth_day", "eq." + day);
    }
    query.set("limit", "20");
  }
  if (resource === "membership_renewal_form") {
    query.set("form_kind", "eq.membership_renewal");
    query.set("status", "eq.published");
    query.set("is_public", "eq.true");
    const requestedFormKey = cleanText(url.searchParams.get("form_key"), 120);
    if (requestedFormKey) query.set("form_key", "eq." + requestedFormKey);
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
      SUPABASE_URL + "/rest/v1/admin_form_fields?select=id,form_id,field_key,label_ar,help_ar,placeholder_ar,field_type,required,options,validation,visibility,target_unit_ids,target_unit_types,sort_order,is_active&form_id=eq." + encodeURIComponent(form.id) + "&is_active=eq.true&order=sort_order.asc",
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
      const unitReadHeaders = {
        apikey: SUPABASE_ANON_KEY,
        Authorization: "Bearer " + SUPABASE_ANON_KEY,
        Accept: "application/json"
      };
      const unitsResponse = await fetch(
        SUPABASE_URL + "/rest/v1/org_units?select=id,name_ar,name_en,unit_type&unit_type=in.(cell,department,field_team,other)&is_active=eq.true&order=sort_order.asc,name_ar.asc",
        {headers: unitReadHeaders}
      );
      const units = await unitsResponse.json().catch(() => []);
      const liveUnits = (Array.isArray(units) ? units : []).map(unit => ({
        id: String(unit.id),
        name_ar: cleanText(unit.name_ar || unit.name_en, 200),
        name_en: cleanText(unit.name_en || unit.name_ar, 200),
        unit_type: cleanText(unit.unit_type, 50)
      })).filter(unit => unit.id && unit.name_ar && (unit.unit_type !== "other" || requestedFormKey === "membership_renewal_supervisor"));
      const normalizedFields = fields.map(field => field.field_key === "current_units"
        ? {...field, options: liveUnits.map(unit => ({value: unit.id, label_ar: unit.name_ar, label_en: unit.name_en}))}
        : field
      );
      return [{...form, fields: normalizedFields, units: liveUnits}];
    }
    return [{...form, fields}];
  }
  if (resource === "content") {
    // public_site_content is a published-only projection; expose an explicit
    // status value to consumers without requiring a status column in the table.
    return Array.isArray(data) ? data.map(row => ({...row, status:"published"})) : [];
  }
  return Array.isArray(data) ? data : [];
}

function sanitizeFormValue(value) {
  if (Array.isArray(value)) {
    return value.slice(0, 30).map(item => sanitizeFormValue(item)).filter(item => item !== "");
  }
  if (value && typeof value === "object") {
    const output = {};
    for (const [key, item] of Object.entries(value).slice(0, 50)) {
      const safeKey = cleanText(key, 120);
      if (!safeKey || /password|secret|token/i.test(safeKey)) continue;
      const safeValue = sanitizeFormValue(item);
      if (Array.isArray(safeValue) ? safeValue.length : safeValue !== "") output[safeKey] = safeValue;
    }
    return output;
  }
  if (typeof value === "boolean" || typeof value === "number") return value;
  return cleanText(value, 5000);
}

async function validateAndSanitizeFormData(body, expectedFormKind = "new_member") {
  const formId = cleanText(body.form_id, 80);
  if (!formId) return {form_id: null, form_version: null, form_data: {}, form_schema: {}};

  const formResponse = await fetch(
    SUPABASE_URL + "/rest/v1/admin_form_definitions?select=id,form_key,name_ar,name_en,description_ar,description_en,form_kind,status,is_public,version,settings,updated_at&id=eq." + encodeURIComponent(formId) + "&form_kind=eq." + encodeURIComponent(expectedFormKind) + "&status=eq.published&is_public=eq.true&limit=1",
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
    SUPABASE_URL + "/rest/v1/admin_form_fields?select=field_key,label_ar,label_en,help_ar,placeholder_ar,field_type,required,options,validation,visibility,target_unit_ids,target_unit_types,sort_order&form_id=eq." + encodeURIComponent(form.id) + "&is_active=eq.true&order=sort_order.asc&limit=200",
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
  const extraAllowed = (form.form_key === "membership_renewal" || form.form_key === "membership_renewal_supervisor")
    ? new Set(["profile_image_url", "profile_image_public_id"])
    : new Set();
  const raw = body.form_data && typeof body.form_data === "object" && !Array.isArray(body.form_data) ? body.form_data : {};
  const formData = {};
  for (const [key, value] of Object.entries(raw)) {
    const safeKey = cleanText(key, 120);
    if ((!allowed.has(safeKey) && !extraAllowed.has(safeKey)) || /password|secret|token/i.test(safeKey)) continue;
    const safeValue = sanitizeFormValue(value);
    if (Array.isArray(safeValue) ? safeValue.length : safeValue !== "") formData[safeKey] = safeValue;
  }
  if ((form.form_key === "membership_renewal" || form.form_key === "membership_renewal_supervisor") && formData.profile_image_url) {
    const imageUrl = cleanText(formData.profile_image_url, 1000);
    const imagePublicId = cleanText(formData.profile_image_public_id, 300);
    if (!/^https:\/\/res\.cloudinary\.com\/pyvrk863\/image\/upload\//.test(imageUrl)) {
      throw new Error("رابط الصورة الشخصية غير صالح.");
    }
    formData.profile_image_url = imageUrl;
    if (imagePublicId) formData.profile_image_public_id = imagePublicId;
  }

  for (const field of fieldRows) {
    if (field.field_type === "number" && formData[field.field_key] !== undefined && formData[field.field_key] !== null && String(formData[field.field_key]).trim() !== "") {
      const number = Number(formData[field.field_key]);
      const rules = field.validation && typeof field.validation === "object" ? field.validation : {};
      if (!Number.isFinite(number)) throw new Error("القيمة في «" + String(field.label_ar || field.field_key) + "» يجب أن تكون رقماً.");
      if (rules.min !== undefined && number < Number(rules.min)) throw new Error("القيمة في «" + String(field.label_ar || field.field_key) + "» يجب ألا تقل عن " + rules.min + ".");
      if (rules.max !== undefined && number > Number(rules.max)) throw new Error("القيمة في «" + String(field.label_ar || field.field_key) + "» يجب ألا تتجاوز " + rules.max + ".");
      if (rules.step !== undefined && Number(rules.step) > 0 && rules.min !== undefined) {
        const steps = (number - Number(rules.min)) / Number(rules.step);
        if (Math.abs(steps - Math.round(steps)) > 1e-9) throw new Error("القيمة في «" + String(field.label_ar || field.field_key) + "» لا تطابق الزيادة المحددة: " + rules.step + ".");
      }
      formData[field.field_key] = number;
    }
    if (field.field_type === "boolean" && typeof formData[field.field_key] === "string") {
      const rawBoolean = String(formData[field.field_key]).toLowerCase();
      formData[field.field_key] = rawBoolean === "true" || rawBoolean === "yes" || rawBoolean === "1";
    }
    if (field.field_type === "multi_select" && formData[field.field_key] !== undefined && !Array.isArray(formData[field.field_key])) {
      formData[field.field_key] = [formData[field.field_key]];
    }
  }

  const selectedUnitTypes = new Set();
  const selectedUnitIds = Array.isArray(formData.current_units)
    ? formData.current_units.map(value => cleanText(value, 80)).filter(Boolean)
    : [];
  if (selectedUnitIds.length) {
    const selectedUnitsResponse = await fetch(
      SUPABASE_URL + "/rest/v1/org_units?select=id,unit_type&id=in.(" + selectedUnitIds.map(encodeURIComponent).join(",") + ")",
      {
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
          Accept: "application/json"
        }
      }
    );
    const selectedUnits = await selectedUnitsResponse.json().catch(() => []);
    for (const unit of (Array.isArray(selectedUnits) ? selectedUnits : [])) {
      const type = cleanText(unit.unit_type, 50);
      if (type) selectedUnitTypes.add(type);
    }
  }

  const fieldIsVisible = (field) => {
    const targetUnitIds = Array.isArray(field.target_unit_ids)
      ? field.target_unit_ids.map(value => cleanText(value, 80)).filter(Boolean)
      : [];
    if (targetUnitIds.length && !targetUnitIds.some(id => selectedUnitIds.includes(id))) return false;

    const targetUnitTypes = Array.isArray(field.target_unit_types)
      ? field.target_unit_types.map(value => cleanText(value, 50)).filter(Boolean)
      : [];
    if (targetUnitTypes.length && !targetUnitTypes.some(type => selectedUnitTypes.has(type))) return false;

    const visibility = field.visibility && typeof field.visibility === "object" ? field.visibility : {};
    if (visibility.mode !== "when") return true;
    const actual = formData[cleanText(visibility.field_key, 120)];
    const expected = String(visibility.value ?? "");
    const operator = cleanText(visibility.operator, 30) || "equals";
    if (operator === "contains") {
      return Array.isArray(actual)
        ? actual.map(String).includes(expected)
        : String(actual ?? "").toLowerCase().includes(expected.toLowerCase());
    }
    if (operator === "in") {
      const allowed = String(visibility.value ?? "").split(",").map(item => item.trim()).filter(Boolean);
      return Array.isArray(actual)
        ? actual.some(item => allowed.includes(String(item)))
        : allowed.includes(String(actual ?? ""));
    }
    if (operator === "not_equals") return String(actual ?? "") !== expected;
    return String(actual ?? "") === expected;
  };

  for (const field of fieldRows) {
    if (!field.required || !fieldIsVisible(field)) continue;
    // These supervisor fields are rendered and validated per selected unit,
    // not as top-level form fields. Their values live in current_unit_details.
    const dynamicSupervisorField = form.form_key === "membership_renewal_supervisor" &&
      ["current_unit_details", "senior_management_position", "content_assignments"].includes(field.field_key);
    if (dynamicSupervisorField) continue;
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
    settings: form.settings && typeof form.settings === "object" ? form.settings : {},
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
      validation: field.validation && typeof field.validation === "object" ? field.validation : {},
      visibility: field.visibility && typeof field.visibility === "object" ? field.visibility : {mode:"always"},
      target_unit_ids: Array.isArray(field.target_unit_ids) ? field.target_unit_ids.slice(0, 50) : [],
      target_unit_types: Array.isArray(field.target_unit_types) ? field.target_unit_types.slice(0, 10) : [],
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
      if (!payload.author_email || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(payload.author_email)) {
        return json({ success: false, error: "أدخل بريداً إلكترونياً صالحاً لتلقي ملاحظات المراجعة وإشعار النشر." }, 400);
      }
      // Generate the receipt ID on the server because the public insert intentionally uses return=minimal.
      payload.id = crypto.randomUUID();
    } else if (body.action === "membership_renewal") {
      let dynamic;
      try {
        dynamic = await validateAndSanitizeFormData(body, "membership_renewal");
      } catch (formError) {
        return json({ success: false, error: formError.message || "نموذج التجديد غير صالح." }, 400);
      }

      const data = dynamic.form_data;
      const formSettings = dynamic.form_schema?.settings && typeof dynamic.form_schema.settings === "object"
        ? dynamic.form_schema.settings
        : {};
      const supervisorForm = dynamic.form_schema?.form_key === "membership_renewal_supervisor";
      const membershipControls = formSettings.membership_controls && typeof formSettings.membership_controls === "object"
        ? formSettings.membership_controls
        : {};
      const configuredRoleOptions = Array.isArray(membershipControls.role_options)
        ? membershipControls.role_options
            .filter(item => item && typeof item === "object")
            .map(item => ({
              value: cleanText(item.value, 60).toLowerCase(),
              label_ar: cleanText(item.label_ar || item.label_en, 120)
            }))
            .filter(item => item.value)
        : [];
      const configuredSeniorPositions = Array.isArray(membershipControls.senior_management_positions)
        ? membershipControls.senior_management_positions
            .filter(item => item && typeof item === "object")
            .map(item => ({
              value: cleanText(item.value, 100),
              label_ar: cleanText(item.label_ar || item.label_en, 180)
            }))
            .filter(item => item.value)
        : [];
      const certificateControls = membershipControls.certificates && typeof membershipControls.certificates === "object"
        ? membershipControls.certificates
        : {};
      const certificateFeatureEnabled = certificateControls.enabled !== false;
      const certificateUnitLinkEnabled = certificateControls.unit_link_enabled !== false;
      const certificateUnitLinkRequired = certificateControls.unit_link_required === true;

      const unitsResponse = await fetch(
        SUPABASE_URL + "/rest/v1/org_units?select=id,name_ar,name_en,unit_type&is_active=eq.true&unit_type=in.(cell,department,field_team)&order=sort_order.asc,name_ar.asc",
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: "Bearer " + SUPABASE_ANON_KEY,
            Accept: "application/json"
          }
        }
      );
      const activeUnitsPayload = await unitsResponse.json().catch(() => []);
      const activeUnits = Array.isArray(activeUnitsPayload)
        ? activeUnitsPayload.map(unit => ({
            id: String(unit.id || ""),
            name_ar: cleanText(unit.name_ar || unit.name_en, 200),
            name_en: cleanText(unit.name_en || unit.name_ar, 200),
            unit_type: cleanText(unit.unit_type, 50)
          })).filter(unit => unit.id && unit.name_ar)
        : [];

      const findLiveCertificateUnit = async (unitId, unitName) => {
        const normalizedId = cleanText(unitId, 80);
        const normalizedName = cleanText(unitName, 200).replace(/\\s+/g, " ").toLowerCase();
        const candidate = activeUnits.find(unit =>
          (normalizedId && unit.id === normalizedId) ||
          (normalizedName && [unit.name_ar, unit.name_en].some(name =>
            cleanText(name, 200).replace(/\\s+/g, " ").toLowerCase() === normalizedName
          ))
        );
        return candidate || null;
      };

      if (data.declaration_accurate !== true || data.privacy_consent !== true) {
        return json({ success: false, error: "يرجى تأكيد صحة المعلومات والموافقة على استخدام البيانات." }, 400);
      }

      const languageAssignments = Array.isArray(data.language_assignments)
        ? data.language_assignments.filter(item => item && typeof item === "object" && !Array.isArray(item)).slice(0, 30)
        : [];
      const allowedLanguageCodes = new Set([
        "arabic","english","french","german","turkish","kurdish",
        "spanish","italian","russian","persian","sign_language","other"
      ]);
      const allowedLanguageLevels = new Set(["native","a1_a2","b1_b2","c1","c2"]);
      const seenLanguageKeys = new Set();
      for (const item of languageAssignments) {
        const language = cleanText(item.language, 60).toLowerCase();
        const other = cleanText(item.language_other, 120);
        const level = cleanText(item.level, 30).toLowerCase();
        if (!allowedLanguageCodes.has(language)) {
          return json({ success: false, error: "توجد لغة غير صالحة ضمن البيانات." }, 400);
        }
        if (!allowedLanguageLevels.has(level)) {
          return json({ success: false, error: "يوجد مستوى لغة غير صالح ضمن البيانات." }, 400);
        }
        if (language === "other" && !other) {
          return json({ success: false, error: "يرجى كتابة اسم اللغة عند اختيار «أخرى»." }, 400);
        }
        const languageKey = language === "other"
          ? "other:" + other.replace(/\s+/g, " ").trim().toLowerCase()
          : language;
        if (seenLanguageKeys.has(languageKey)) {
          return json({ success: false, error: "لا يمكن تكرار اللغة نفسها أكثر من مرة." }, 400);
        }
        seenLanguageKeys.add(languageKey);
      }

      let requestedIds = Array.isArray(data.current_units)
        ? [...new Set(data.current_units.map(item => cleanText(item, 80)).filter(Boolean))].slice(0, 26)
        : [];
      const requestedUnitDetails = data.current_unit_details && typeof data.current_unit_details === "object" && !Array.isArray(data.current_unit_details)
        ? data.current_unit_details
        : {};
      // Validate the exact submitted IDs directly. This avoids rejecting a valid
      // supervisor-only unit such as General Administration because the broader
      // public unit query is filtered differently.
      // Resolve submitted unit IDs from the active public unit list already loaded above.
      // This avoids a second PostgREST lookup that can reject otherwise valid IDs.
      const canonicalAdmin = supervisorForm && requestedIds.includes("87673bd2-5151-4f8b-95e9-dba4f2a11045")
        ? [{id:"87673bd2-5151-4f8b-95e9-dba4f2a11045",name_ar:"الإدارة العامة",name_en:"General Administration",unit_type:"other"}]
        : [];
      const unitsForSubmission = [
        ...activeUnits.filter(unit => requestedIds.includes(String(unit.id))),
        ...canonicalAdmin.filter(admin => !activeUnits.some(unit => String(unit.id) === admin.id))
      ];
      if (supervisorForm && unitsForSubmission.some(unit =>
        String(unit.unit_type) === "department" && cleanText(unit.name_ar, 200) === "كتابة محتوى"
      )) {
        return json({
          success: false,
          error: "قسم «كتابة محتوى» يُدار عبر خلايا المحتوى. اختر خلية المحتوى المرتبطة بدلاً من اختيار القسم نفسه."
        }, 400);
      }
      const requestedUnits = unitsForSubmission
        .filter(unit => requestedIds.includes(String(unit.id)))
        .map(unit => {
          const raw = requestedUnitDetails[String(unit.id)];
          const detail = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
          let role = cleanText(detail.role, 30).toLowerCase();
          const joinedOn = normalizeDate(detail.joined_on);
          const continuing = detail.continuing === true;
          const leftOn = normalizeDate(detail.left_on);
          let roleStartedOn = normalizeDate(detail.role_started_on);
          let roleContinuing = detail.role_continuing === true;
          const roleContinuingProvided = Object.prototype.hasOwnProperty.call(detail, "role_continuing");
          const notes = cleanText(detail.notes, 1500);
          const seniorManagementPosition = cleanText(detail.senior_management_position, 120);

          if (supervisorForm && String(unit.unit_type) === "other") {
            role = "volunteer";
          }

          return {
            id: String(unit.id),
            name_ar: cleanText(unit.name_ar || unit.name_en, 200),
            unit_type: cleanText(unit.unit_type, 50),
            role,
            senior_management_position: seniorManagementPosition,
            joined_on: joinedOn,
            continuing,
            left_on: leftOn,
            role_started_on: roleStartedOn,
            role_continuing: roleContinuing,
            role_continuing_provided: supervisorForm ? roleContinuingProvided : true,
            role_left_on: supervisorForm ? normalizeDate(detail.role_left_on) : (continuing ? null : leftOn),
            notes
          };
        });
      if (requestedUnits.length !== requestedIds.length) {
        return json({ success: false, error: "يوجد قسم أو وحدة غير صالحة ضمن الاختيار." }, 400);
      }
      // Certificate links are independent from the current unit selection:
      // a member may have several current units, while a certificate belongs to
      // one active MedLife unit at a time. This keeps certificate history isolated
      // from multi-unit membership details.

      const defaultUnitRoles = ["volunteer","assistant_supervisor","supervisor","general_supervisor","content_writer"];
      const allowedUnitRoles = supervisorForm
        ? (configuredRoleOptions.length ? configuredRoleOptions.map(item => item.value) : defaultUnitRoles)
        : ["volunteer"];
      const allowedSeniorPositions = configuredSeniorPositions.length
        ? new Set(configuredSeniorPositions.map(item => item.value))
        : new Set(["general_supervisor_syria","advisor_deputy_general_supervisor","executive_director","medical_director","legal_advisor","financial_director"]);
      const configuredContentCellIds = new Set(
        Array.isArray(formSettings.content_cells)
          ? formSettings.content_cells
              .filter(item => item && typeof item === "object")
              .map(item => cleanText(item.id, 80))
              .filter(Boolean)
          : []
      );
      if (supervisorForm && requestedUnits.some(unit =>
        unit.role === "content_writer" &&
        (String(unit.unit_type) !== "cell" || !configuredContentCellIds.has(String(unit.id)))
      )) {
        return json({
          success: false,
          error: "دور «كاتب محتوى» يجب أن يكون مرتبطاً بإحدى خلايا المحتوى المعرّفة في إعدادات النموذج."
        }, 400);
      }
      if (requestedUnits.some(unit => !allowedUnitRoles.includes(unit.role))) {
        return json({ success: false, error: "يوجد دور غير صالح ضمن أحد الأقسام أو الوحدات." }, 400);
      }
      if (supervisorForm) {
        const adminUnits = requestedUnits.filter(unit => unit.unit_type === "other");
        if (adminUnits.some(unit => !unit.senior_management_position)) {
          return json({ success: false, error: "يرجى تحديد المنصب في الإدارة العامة." }, 400);
        }
        if (adminUnits.some(unit => unit.senior_management_position && !allowedSeniorPositions.has(unit.senior_management_position))) {
          return json({ success: false, error: "يوجد منصب إداري غير مدعوم ضمن إعدادات نموذج العضوية." }, 400);
        }
      }
      const today = new Date().toISOString().slice(0, 10);
      const timelineUnits = requestedUnits;

      if (timelineUnits.some(unit => !unit.joined_on)) {
        return json({ success: false, error: "يرجى تحديد تاريخ بدء الانتساب لكل قسم أو وحدة." }, 400);
      }
      const missingRoleStart = timelineUnits.find(unit => !unit.role_started_on);
      if (missingRoleStart) {
        return json({ success: false, error: "يرجى تحديد تاريخ بدء الدور داخل «" + missingRoleStart.name_ar + "»." }, 400);
      }
      if (timelineUnits.some(unit => unit.role_started_on > today || unit.role_started_on < unit.joined_on)) {
        return json({ success: false, error: "تاريخ بدء الدور يجب أن يكون بعد أو في تاريخ الانضمام إلى الوحدة وألا يكون في المستقبل." }, 400);
      }
      if (timelineUnits.some(unit => !unit.role_continuing_provided)) {
        return json({ success: false, error: "يرجى تحديد حالة استمرار الدور داخل كل وحدة." }, 400);
      }
      if (timelineUnits.some(unit => !unit.role_continuing && !unit.role_left_on)) {
        return json({ success: false, error: "يرجى تحديد تاريخ انتهاء الدور الذي لم تعد تشغله." }, 400);
      }
      if (timelineUnits.some(unit => unit.role_continuing && !unit.continuing)) {
        return json({ success: false, error: "لا يمكن أن يستمر الدور بعد انتهاء العضوية في الوحدة." }, 400);
      }
      if (timelineUnits.some(unit => unit.joined_on > today)) {
        return json({ success: false, error: "تاريخ بدء الانتساب لا يمكن أن يكون في المستقبل." }, 400);
      }
      if (timelineUnits.some(unit => !unit.continuing && !unit.left_on)) {
        return json({ success: false, error: "يرجى تحديد تاريخ انتهاء كل انتساب غير مستمر." }, 400);
      }
      if (timelineUnits.some(unit => unit.left_on && (unit.left_on < unit.joined_on || unit.left_on > today))) {
        return json({ success: false, error: "تواريخ انتهاء الانتساب يجب أن تكون بعد تاريخ البدء وألا تتجاوز تاريخ اليوم." }, 400);
      }
      if (timelineUnits.some(unit => unit.role_left_on && (unit.role_left_on < unit.role_started_on || unit.role_left_on > today))) {
        return json({ success: false, error: "تواريخ انتهاء الدور يجب أن تكون بعد تاريخ بدء الدور وألا تتجاوز تاريخ اليوم." }, 400);
      }
      if (timelineUnits.some(unit => unit.role_left_on && unit.left_on && unit.role_left_on > unit.left_on)) {
        return json({ success: false, error: "لا يمكن أن يستمر الدور بعد مغادرة الوحدة." }, 400);
      }

      const hasContinuingUnit = requestedUnits.some(unit => unit.continuing);
      const overallContinuing = supervisorForm ? true : data.continuing_as_volunteer === true;
      if (!supervisorForm && overallContinuing !== hasContinuingUnit) {
        return json({ success: false, error: hasContinuingUnit
          ? "يوجد قسم ما زلت مستمراً فيه، لذلك يجب اختيار الاستمرار مع ميدلايف أيضاً."
          : "لم تعد مستمراً بأي قسم مختار، لذلك يجب اختيار عدم الاستمرار مع ميدلايف."
        }, 400);
      }

      const numberValue = value => {
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
      };
      const toArray = value => Array.isArray(value)
        ? value.map(item => cleanText(item, 100)).filter(Boolean).slice(0, 30)
        : [];
      const rawCertificateHistory = certificateFeatureEnabled && Array.isArray(data.certificate_history)
        ? data.certificate_history
            .filter(item => item && typeof item === "object" && !Array.isArray(item))
            .filter(item => (
              String(item.type ?? "").trim() ||
              String(item.title ?? "").trim() ||
              String(item.issuing_organization ?? "").trim() ||
              String(item.issued_date ?? "").trim() ||
              String(item.issuing_unit_id ?? "").trim() ||
              String(item.reference_code ?? "").trim() ||
              String(item.notes ?? "").trim()
            ))
            .slice(0, 30)
        : [];
      const certificateHistory = [];
      for (const item of rawCertificateHistory) {
        // Certificate classification is intentionally not user-configured.
        // Members enter any certificate by name; internally we store it as "other".
        const type = "other";
        const title = cleanText(item.title, 500);
        const issuingOrganization = cleanText(item.issuing_organization, 500);
        const issuedDate = normalizeDate(item.issued_date);
        const issuingUnitId = cleanText(item.issuing_unit_id, 80);
        const issuingUnitName = cleanText(item.issuing_unit_name, 200);
        const referenceCode = cleanText(item.reference_code, 120);
        const notes = cleanText(item.notes, 1500);
        if (!title || !issuingOrganization || !issuedDate) {
          return json({ success: false, error: "كل شهادة يجب أن تتضمن اسمها والجهة المانحة وتاريخ الحصول عليها." }, 400);
        }
        if (issuedDate > new Date().toISOString().slice(0,10)) {
          return json({ success: false, error: "تاريخ الحصول على الشهادة لا يمكن أن يكون في المستقبل." }, 400);
        }
        let canonicalIssuingUnitId = issuingUnitId;
        if (certificateUnitLinkRequired && !issuingUnitId && !issuingUnitName) {
          return json({ success: false, error: "يرجى تحديد الفريق أو الوحدة المرتبطة بكل شهادة." }, 400);
        }
        if (issuingUnitId || issuingUnitName) {
          if (!certificateUnitLinkEnabled) {
            return json({ success: false, error: "ربط الشهادة بوحدة غير مفعّل في إعدادات نموذج العضوية." }, 400);
          }
          const liveUnit = await findLiveCertificateUnit(issuingUnitId, issuingUnitName);
          if (!liveUnit) {
            return json({ success: false, error: "الفريق أو الوحدة المرتبطة بالشهادة يجب أن تكون وحدة فعّالة في ميدلايف." }, 400);
          }
          canonicalIssuingUnitId = String(liveUnit.id);
        }
        certificateHistory.push({
          type,
          title,
          issuing_organization: issuingOrganization,
          issued_date: issuedDate,
          issuing_unit_id: canonicalIssuingUnitId || null,
          issuing_unit_name: issuingUnitName || null,
          reference_code: referenceCode || null,
          notes: notes || null
        });
      }
      const certificateTypes = [...new Set(certificateHistory.map(item => item.type))];

      const payload = {
        form_id: dynamic.form_id,
        form_version: dynamic.form_version,
        status: "pending",
        membership_number: null,
        full_name: cleanText(data.full_name, 150),
        father_name: cleanText(data.father_name, 150),
        mother_name: cleanText(data.mother_name, 150),
        national_id: cleanText(data.national_id, 40),
        country: cleanText(data.country, 100),
        country_other: cleanText(data.country_other, 100),
        nationality: cleanText(data.nationality, 100),
        nationality_other: cleanText(data.nationality_other, 100),
        governorate: cleanText(data.governorate, 100),
        city: cleanText(data.city, 120),
        full_address: cleanText(data.full_address, 1000),
        date_of_birth: normalizeDate(data.date_of_birth),
        gender: cleanText(data.gender, 20),
        email: cleanText(data.email, 250).toLowerCase(),
        phone: cleanText(data.phone, 50),
        emergency_contact_name: cleanText(data.emergency_contact_name, 150),
        emergency_contact_relationship: cleanText(data.emergency_contact_relationship, 50),
        emergency_contact_phone: cleanText(data.emergency_contact_phone, 50),
        emergency_contact_alt_phone: cleanText(data.emergency_contact_alt_phone, 50),
        emergency_contact_notes: cleanText(data.emergency_contact_notes, 1500),
        supervisor_start_date: normalizeDate(data.supervisor_start_date),
        academic_status: cleanText(data.academic_status, 60),
        university: cleanText(data.university, 250),
        specialty: cleanText(data.specialty, 250),
        consultation_specialty: cleanText(data.consultation_specialty, 250),
        consultation_specialty_other: cleanText(data.consultation_specialty_other, 500),
        profession: cleanText(data.profession, 250),
        workplace: cleanText(data.workplace, 250),
        skills: cleanText(data.skills, 1000).split(/[,،]/).map(value => value.trim()).filter(Boolean).slice(0, 30),
        self_declared_talents: toArray(data.talent_areas),
        undiscovered_talents: cleanText(data.undiscovered_talents, 2000),
        desired_contributions: toArray(data.desired_contributions),
        development_interests: toArray(data.development_interests),
        join_date: normalizeDate(data.join_date),
        requested_unit_ids: requestedUnits.map(unit => unit.id),
        requested_units: requestedUnits,
        requested_unit_roles: Object.fromEntries(requestedUnits.map(unit => [unit.id, unit.role])),
        requested_unit_details: Object.fromEntries(requestedUnits.map(unit => [unit.id, {
          role: unit.role,
          senior_management_position: unit.senior_management_position,
          role_started_on: unit.role_started_on,
          role_continuing: unit.role_continuing,
          role_left_on: unit.role_left_on,
          joined_on: unit.joined_on,
          continuing: unit.continuing,
          left_on: unit.left_on,
          notes: unit.notes
        }])),
        reported_total_volunteer_hours: numberValue(data.reported_total_volunteer_hours),
        field_available_days: toArray(data.field_available_days),
        volunteer_commitment_hours: numberValue(data.volunteer_commitment_hours),
        certificate_types: certificateTypes,
        certificate_other: cleanText(data.certificate_other, 500),
        certificate_history: certificateHistory,
        availability: cleanText(data.availability, 50),
        education_track: cleanText(data.academic_status, 60),
        interest_areas: toArray(data.interest_areas),
        continuing_as_volunteer: supervisorForm ? true : data.continuing_as_volunteer === true,
        additional_notes: cleanText(data.additional_notes, 3000),
        declaration_accurate: true,
        privacy_consent: true,
        form_data: {
          ...dynamic.form_data,
          current_units: requestedUnits.map(unit => unit.id),
          current_unit_details: Object.fromEntries(requestedUnits.map(unit => [unit.id, {
            role: unit.role,
            senior_management_position: unit.senior_management_position,
            role_started_on: unit.role_started_on,
            role_continuing: unit.role_continuing,
            role_left_on: unit.role_left_on,
            joined_on: unit.joined_on,
            continuing: unit.continuing,
            left_on: unit.left_on,
            notes: unit.notes
          }])),
          certificate_history: certificateHistory
        },
        form_schema: {
          ...dynamic.form_schema,
          fields: dynamic.form_schema.fields.map(field => field.field_key === "current_units"
            ? {...field, options: requestedUnits.map(unit => ({value: unit.id, label_ar: unit.name_ar, label_en: unit.name_ar}))}
            : field)
        },
        source: "public_website"
      };

      const requiredCore = [
        "full_name","father_name","mother_name","national_id","country",
        "full_address","date_of_birth","gender","email","phone","academic_status","join_date"
      ];
      const missingRequiredCore = requiredCore.some(key => !String(payload[key] ?? "").trim())
        || (payload.country === "سوريا" && !String(payload.governorate ?? "").trim())
        || (payload.country === "أخرى" && !String(payload.country_other ?? "").trim())
        || (payload.nationality === "أخرى" && !String(payload.nationality_other ?? "").trim());
      if (missingRequiredCore) {
        return json({ success: false, error: "يرجى إكمال جميع المعلومات الأساسية المطلوبة." }, 400);
      }
      const requiredEmergency = ["emergency_contact_name","emergency_contact_relationship","emergency_contact_phone"];
      if (requiredEmergency.some(key => !String(payload[key] ?? "").trim())) {
        return json({ success: false, error: "يرجى تعبئة اسم شخص الطوارئ وصلته ورقم هاتفه." }, 400);
      }

      // The public API uses the anonymous publishable key. Avoid return=representation
      // because PostgREST would then require SELECT privilege on the membership table.
      // Generate the row ID ourselves, insert with return=minimal, and return the known ID.
      const submissionId = crypto.randomUUID();
      payload.id = submissionId;
      const response = await fetch(SUPABASE_URL + "/rest/v1/public_membership_renewal_submissions", {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: "Bearer " + SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Membership renewal write failed", response.status, errorText);
        return json({ success: false, error: "تعذر تسجيل طلب تجديد العضوية." }, 502);
      }
      const receiptResponse = await fetch(SUPABASE_URL + "/rest/v1/rpc/get_membership_renewal_receipt", {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: "Bearer " + SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({p_submission_id: submissionId, p_email: cleanText(data.email, 250).toLowerCase()})
      });
      const receipt = await receiptResponse.json().catch(() => ({}));
      return json({
        success: true,
        submission_id: submissionId,
        membership_number: receipt?.success ? receipt.membership_number : null,
        message: supervisorForm
          ? "تم حفظ بيانات المشرف وإصدار رقم العضوية وبطاقة العضوية بنجاح."
          : "تم تسجيل تجديد العضوية مباشرة في قاعدة أعضاء ميدلايف."
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
        SUPABASE_URL + "/rest/v1/org_units?select=name_ar,name_en&unit_type=in.(cell,department,field_team)&is_active=eq.true",
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

    const writeUrl = SUPABASE_URL + "/rest/v1/" + target;
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
      const errorText = await response.text();
      console.error("Public management write failed", target, response.status, errorText);
      if (
        response.status === 409 ||
        /23505|national_id|public_volunteer_applications_national_id_active_unique|الرقم الوطني/i.test(errorText)
      ) {
        return json({
          success: false,
          error: "هذا الرقم الوطني مسجل مسبقاً. لا يمكن إنشاء سجل عضو مكرر."
        }, 409);
      }
      return json({ success: false, error: "تعذر تسجيل الطلب في منصة الإدارة." }, 502);
    }
    const submissionId = body.action === "article_submission" ? payload.id || null : null;
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
