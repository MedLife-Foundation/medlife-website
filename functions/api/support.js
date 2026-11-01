/* Public MedLife support-fund API.
   Supabase is the source of truth. Private applications and donor notifications
   are accepted only through SECURITY DEFINER RPCs; public reads use sanitized
   public_site_support_cases and active public payment methods.
*/
import { json } from './_auth.js';

const SUPABASE_URL = "https://ftvjakwogxdlxxbpfydf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_beiimOXraRWZguAX7balCQ_HVao1o3K";

function headers(extra = {}) {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
    Accept: "application/json",
    ...extra
  };
}

async function readRows(path) {
  const response = await fetch(SUPABASE_URL + "/rest/v1/" + path, {
    headers: headers(),
    cf: { cacheTtl: 0 }
  });
  const body = await response.text();
  let data;
  try { data = JSON.parse(body); } catch { data = { error: body }; }
  if (!response.ok) {
    console.error("Support public read failed", response.status, body.slice(0, 300));
    throw new Error("تعذر تحميل بيانات صندوق الدعم حالياً.");
  }
  return Array.isArray(data) ? data : [];
}

async function callRpc(name, payload) {
  const response = await fetch(SUPABASE_URL + "/rest/v1/rpc/" + name, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ p_payload: payload })
  });
  const body = await response.text();
  let data;
  try { data = JSON.parse(body); } catch { data = { message: body }; }
  if (!response.ok) {
    const message = data?.message || data?.hint || data?.details || "تعذر تنفيذ الطلب حالياً.";
    return { ok: false, status: response.status, data: { success: false, error: message } };
  }
  return { ok: true, status: response.status, data };
}

function cleanAmount(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export async function onRequest({ request }) {
  try {
    if (request.method === "GET") {
      const url = new URL(request.url);
      const caseCode = String(url.searchParams.get("case") || "").trim();
      const select = [
        "source_id", "case_code", "subject", "category", "status", "priority",
        "description", "summary", "amount_required", "amount_secured", "currency",
        "public_url", "documents_verified", "governorate", "areas", "support_type",
        "start_date", "end_date", "progress_stage", "public_status_note", "created_at", "updated_at"
      ].join(",");
      const query = new URLSearchParams({
        select,
        order: "updated_at.desc",
        limit: "100"
      });
      if (caseCode) query.set("case_code", "eq." + caseCode);
      const [caseRows, paymentMethods] = await Promise.all([
        readRows("public_site_support_cases?" + query.toString()),
        readRows("support_payment_methods?select=method_code,label,account_label,account_value,instructions,sort_order&is_active=eq.true&order=sort_order.asc")
      ]);

      const cases = caseRows.map(row => {
        const target = cleanAmount(row.amount_required);
        const secured = cleanAmount(row.amount_secured);
        return {
          ...row,
          amount_required: target,
          amount_secured: secured,
          amount_remaining: Math.max(0, target - secured),
          progress_percent: target > 0 ? Math.min(100, Math.round((secured / target) * 100)) : 0
        };
      });
      const payload = {
        success: true,
        cases,
        case: caseCode ? (cases[0] || null) : null,
        paymentMethods,
        totalFunded: cases.reduce((sum, row) => sum + row.amount_secured, 0),
        activeCount: cases.filter(row => ["published", "supporting"].includes(row.status)).length,
        completedCount: cases.filter(row => row.status === "closed").length
      };
      return json(payload);
    }

    if (request.method !== "POST") {
      return json({ success: false, error: "Method not allowed." }, 405);
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return json({ success: false, error: "بيانات الطلب غير صحيحة." }, 400);
    }

    // Honeypot: return a neutral success to automated form submissions without
    // inserting an application or contribution.
    if (String(body.website || "").trim()) {
      return json({
        success: true,
        message: "تم استلام الطلب."
      }, 201);
    }

    const action = String(body.action || "").trim();
    if (action === "apply") {
      const payload = {
        applicant_name: String(body.applicant_name || "").trim(),
        phone: String(body.phone || "").trim(),
        email: String(body.email || "").trim(),
        governorate: String(body.governorate || "").trim(),
        area: String(body.area || "").trim(),
        request_type: String(body.request_type || "").trim(),
        beneficiary_relation: String(body.beneficiary_relation || "").trim(),
        beneficiary_age: String(body.beneficiary_age || "").trim(),
        beneficiary_gender: String(body.beneficiary_gender || "").trim(),
        need_summary: String(body.need_summary || "").trim(),
        medical_details: String(body.medical_details || "").trim(),
        requested_amount: cleanAmount(body.requested_amount),
        family_income: String(body.family_income || "").trim(),
        existing_support: String(body.existing_support || "").trim(),
        document_urls: Array.isArray(body.document_urls)
          ? body.document_urls.map(value => String(value || "").trim()).filter(Boolean).slice(0, 10)
          : [],
        preferred_contact: String(body.preferred_contact || "").trim(),
        consent: body.consent === true
      };
      const result = await callRpc("support_submit_application", payload);
      return json(result.data, result.ok ? 201 : (result.status === 401 ? 401 : 400));
    }

    if (action === "contribute") {
      const payload = {
        case_code: String(body.case_code || "").trim(),
        amount: cleanAmount(body.amount),
        method_code: String(body.method_code || "").trim(),
        donor_name: String(body.donor_name || "").trim(),
        donor_contact: String(body.donor_contact || "").trim(),
        transaction_reference: String(body.transaction_reference || "").trim(),
        donor_wants_public_credit: body.donor_wants_public_credit === true,
        consent: body.consent === true
      };
      const result = await callRpc("support_submit_contribution", payload);
      return json(result.data, result.ok ? 201 : (result.status === 401 ? 401 : 400));
    }

    return json({ success: false, error: "نوع الطلب غير معروف." }, 400);
  } catch (error) {
    console.error("Support API error", error);
    return json({ success: false, error: error?.message || "تعذر تنفيذ العملية حالياً." }, 500);
  }
}
