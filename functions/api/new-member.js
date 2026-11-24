import { json } from "./_auth.js";

export async function onRequest({ request }) {
  if (request.method === "OPTIONS") return json({ success: true });
  return json({
    success: false,
    code: "use_current_recruitment_form",
    error: "يرجى تعبئة استمارة الانضمام الجديدة على رابط مؤسسة ميدلايف الرسمي.",
    application_url: "https://medlifesy.org/joinwithus"
  }, 410);
}
