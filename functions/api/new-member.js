/* MEDLIFE — unified public recruitment intake
 * POST /api/new-member -> public_membership_renewal_submissions (Supabase)
 * GET  /api/new-member?units=1 -> active cells/departments/field teams
 *
 * Required Cloudflare Pages secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 * Never expose the service-role key to browser code.
 */
const FORM_KEY = "membership_renewal";
const headers = (key) => ({
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
});
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store" },
});
const clean = (value, max = 500) => String(value ?? "").trim().slice(0, max);
const schemaFields = [
  ["full_name","الاسم الكامل",true],["mother_name","اسم الأم",true],
  ["national_id","الرقم الوطني",true],["gender","الجنس",true],["email","البريد الإلكتروني",true],
  ["phone","رقم الهاتف",true],["governorate","المحافظة",true],["city","المدينة",false],
  ["full_address","العنوان",false],["academic_status","الوضع الأكاديمي/المهني",true],
  ["university","الجامعة أو المؤسسة التعليمية",true],["faculty","الكلية/الفرع",false],
  ["study_year","السنة الدراسية",false],["graduation_year","سنة التخرج",false],
  ["profession","المهنة",false],["workplace","مكان العمل",false],
  ["specialty","الاختصاص",false],["resident_specialty","اختصاص الإقامة",false],
  ["residency_year","سنة الإقامة",false],["residency_hospital","مشفى الإقامة",false],
  ["interest","مجال المساهمة",true],["motivation","الدافع للتطوع",false],
];
async function api(env, path, init = {}) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_CONFIG_MISSING");
  const base = env.SUPABASE_URL.replace(/\/$/, "");
  const response = await fetch(base + "/rest/v1/" + path, {
    ...init, headers: { ...headers(env.SUPABASE_SERVICE_ROLE_KEY), ...(init.headers || {}) },
  });
  const body = await response.text();
  let data = null;
  try { data = body ? JSON.parse(body) : null; } catch {}
  if (!response.ok) {
    console.error("Supabase intake request failed", response.status, data?.code || data?.message || "");
    throw new Error("SUPABASE_REQUEST_FAILED");
  }
  return data;
}
export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  }});
  if (request.method === "GET") {
    if (new URL(request.url).searchParams.get("units") !== "1") return json({ success:false, error:"Method not allowed." },405);
    try {
      const units = await api(env, "org_units?select=id,name_ar,name_en,unit_type&is_active=eq.true&unit_type=in.(cell,department,field_team)&order=unit_type.asc,name_ar.asc");
      return json({ success:true, units: units || [] });
    } catch (error) {
      const missing = error.message === "SUPABASE_CONFIG_MISSING";
      return json({ success:false, error: missing ? "خدمة التسجيل غير مهيأة بعد. يرجى التواصل مع الإدارة." : "تعذر تحميل قائمة الوحدات." }, 503);
    }
  }
  if (request.method !== "POST") return json({ success:false, error:"Method not allowed." },405);
  try {
    const body = await request.json();
    const full_name = clean(body.full_name,150);
    const mother_name = clean(body.mother_name,150);
    const national_id = clean(body.national_id,40).replace(/\s+/g,"");
    const email = clean(body.email,200).toLowerCase();
    const phone = clean(body.phone,40);
    const gender = clean(body.gender,20);
    const governorate = clean(body.governorate,100);
    const city = clean(body.city,100);
    const full_address = clean(body.address,500);
    const academic_status = clean(body.academic_status,40);
    const university = clean(body.university,200);
    const faculty = clean(body.faculty,200);
    const study_year = clean(body.study_year,80);
    const graduation_year = clean(body.graduation_year,20);
    const profession = clean(body.profession,150);
    const workplace = clean(body.workplace,200);
    const specialty = clean(body.specialty || body.resident_specialty || body.doctor_specialty,150);
    const resident_specialty = clean(body.resident_specialty,150);
    const residency_year = clean(body.residency_year,80);
    const residency_hospital = clean(body.residency_hospital,200);
    const interest = clean(body.interest,150);
    const motivation = clean(body.motivation,2000);
    const unit_id = clean(body.unit_id,80);
    if (![full_name,mother_name,national_id,email,phone,gender,governorate,academic_status,university,interest,unit_id].every(Boolean))
      return json({ success:false, error:"يرجى تعبئة جميع الحقول الإلزامية، بما فيها المؤسسة التعليمية والخلية المطلوبة." },400);
    if (!/^\S+@\S+\.\S+$/.test(email)) return json({success:false,error:"البريد الإلكتروني غير صالح."},400);
    if (!["male","female"].includes(gender)) return json({success:false,error:"الجنس المحدد غير صالح."},400);
    if (!["student","graduate","doctor","resident","specialist","other"].includes(academic_status))
      return json({success:false,error:"الحالة الأكاديمية غير صالحة."},400);
    if (body.consent !== true) return json({success:false,error:"يرجى الموافقة على سياسة استخدام البيانات."},400);

    const units = await api(env, "org_units?select=id,name_ar,name_en,unit_type&id=eq." + encodeURIComponent(unit_id) + "&is_active=eq.true&unit_type=in.(cell,department,field_team)&limit=1");
    if (!units?.length) return json({success:false,error:"الخلية أو القسم المختار غير متاح حالياً. حدّث الصفحة واختر من القائمة."},400);

    const forms = await api(env, "admin_form_definitions?select=id,version,settings&form_key=eq." + FORM_KEY + "&is_public=eq.true&status=eq.published&limit=1");
    if (!forms?.length) return json({success:false,error:"نموذج الانتساب غير منشور حالياً. يرجى التواصل مع الإدارة."},503);
    const form = forms[0];

    const duplicates = await api(env, "public_membership_renewal_submissions?select=id&national_id=eq." + encodeURIComponent(national_id) + "&limit=1");
    if (duplicates?.length) return json({success:false,error:"يوجد طلب سابق مرتبط بهذا الرقم الوطني. يرجى التواصل مع الإدارة بدلاً من إرسال طلب مكرر."},409);
    const emailDuplicates = await api(env, "public_membership_renewal_submissions?select=id&email=ilike." + encodeURIComponent(email) + "&limit=1");
    if (emailDuplicates?.length) return json({success:false,error:"يوجد طلب سابق مرتبط بهذا البريد الإلكتروني. يرجى التواصل مع الإدارة."},409);

    const formData = {
      full_name,mother_name,national_id,gender,email,phone,governorate,city,full_address,
      academic_status,education_track:academic_status,university,faculty,study_year,graduation_year,
      profession,workplace,specialty,resident_specialty,residency_year,residency_hospital,interest,motivation,
      privacy_consent:true,declaration_accurate:true,
    };
    const formSchema = { form_key:FORM_KEY, version:form.version, fields:schemaFields.map(([field_key,label_ar,required],sort_order)=>({field_key,label_ar,required,is_active:true,sort_order})) };
    const submission = {
      form_id:form.id, form_version:form.version, status:"pending", full_name,mother_name,national_id,
      email,phone,governorate,city:city||null,full_address:full_address||null,gender,academic_status,
      university, specialty:specialty||null, profession:profession||null, workplace:workplace||null,
      skills:[], requested_unit_ids:[unit_id], requested_units:[{id:units[0].id,name_ar:units[0].name_ar,name_en:units[0].name_en,unit_type:units[0].unit_type}],
      interest_areas:[interest], form_data:formData, form_schema:formSchema, source:"public_website",
      declaration_accurate:true, privacy_consent:true, recruitment_stage:"new", recruitment_decision:"pending",
      education_track:academic_status, additional_notes:motivation||null,
    };
    const inserted = await api(env,"public_membership_renewal_submissions?select=id,created_at",{
      method:"POST", headers:{Prefer:"return=representation"}, body:JSON.stringify(submission),
    });
    if (!inserted?.length) throw new Error("EMPTY_INSERT");
    return json({success:true,id:inserted[0].id,status:"pending",message:"تم استلام طلبك بنجاح. سيقوم فريق الموارد البشرية بمراجعته."},201);
  } catch (error) {
    console.error("Public recruitment intake error", error.message || error);
    const missing = error.message === "SUPABASE_CONFIG_MISSING";
    return json({success:false,error:missing?"خدمة التسجيل غير مهيأة بعد. يرجى التواصل مع الإدارة.":"تعذر إرسال الطلب حالياً. لم يتم تأكيد حفظه؛ يرجى المحاولة لاحقاً."},503);
  }
}
