const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
const safeUrl = (value, origin) => {
  try {
    const u = new URL(String(value || ""), origin);
    return u.protocol === "https:" || u.origin === origin ? u.href : "";
  } catch { return ""; }
};
const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("ar-SY", { year:"numeric", month:"long", day:"numeric" });
};
const typeMap = { medical:"طبي", awareness:"توعية", training:"تدريب", humanitarian:"إنساني", community:"مجتمعي", school:"مدارس", other:"أخرى" };

export async function onRequestGet({ params, request }) {
  const slug = String(params?.slug || "").trim();
  if (!slug || slug.length > 160) return new Response("الصفحة غير موجودة.", { status:404 });

  const origin = new URL(request.url).origin;
  const api = origin + "/api/management?resource=activities&slug=" + encodeURIComponent(slug) + "&limit=1";
  const response = await fetch(api, { headers:{ Accept:"application/json" }, cf:{ cacheTtl:0 } });
  if (!response.ok) return new Response("تعذر تحميل النشاط حالياً.", { status:502 });

  const payload = await response.json().catch(() => ({}));
  const activity = Array.isArray(payload?.data) ? payload.data[0] : null;
  if (!activity) return new Response("النشاط غير موجود أو غير منشور للعامة.", { status:404 });

  const title = esc(activity.title || "نشاط ميدلايف");
  const description = esc(activity.description || "");
  const details = String(activity.details || "").trim();
  const image = safeUrl(activity.cover_image_url, origin);
  const sourceUrl = safeUrl(activity.source_url, origin);
  const galleryUrl = safeUrl(activity.gallery_url, origin);
  const date = formatDate(activity.start_at);
  const location = [activity.city, activity.governorate].filter(Boolean).join(" — ");
  const gallery = Array.isArray(activity.gallery) ? activity.gallery.filter(x => x && safeUrl(x.url, origin)) : [];
  if (image && !gallery.some(x => safeUrl(x.url, origin) === image)) gallery.unshift({url:image,alt_text:activity.title});

  const actions = [
    sourceUrl ? '<a class="btn primary" href="' + sourceUrl + '" target="_blank" rel="noopener noreferrer">قراءة التغطية / المصدر</a>' : "",
    galleryUrl ? '<a class="btn secondary" href="' + galleryUrl + '" target="_blank" rel="noopener noreferrer">ألبوم الصور الخارجي</a>' : ""
  ].filter(Boolean).join("");

  const galleryHtml = gallery.length
    ? '<div class="activity-gallery">' + gallery.map((item, index) => {
        const url = safeUrl(item.url, origin);
        const alt = esc(item.alt_text || activity.title || "صورة النشاط");
        return '<button type="button" class="gallery-item" data-image="' + esc(url) + '" aria-label="عرض الصورة ' + (index + 1) + '"><img src="' + esc(url) + '" alt="' + alt + '" loading="lazy" decoding="async"></button>';
      }).join("") + '</div>'
    : '<div class="gallery-empty">لا توجد صور منشورة لهذا النشاط بعد.</div>';

  const detailsHtml = details
    ? details.split(/\n\s*\n|\n/).filter(Boolean).map(line => '<p>' + esc(line) + '</p>').join("")
    : '<p>لا توجد تفاصيل إضافية منشورة لهذا النشاط حالياً.</p>';

  const meta = [
    date ? '<span><strong>التاريخ</strong>' + esc(date) + '</span>' : "",
    location ? '<span><strong>المكان</strong>' + esc(location) + '</span>' : "",
    activity.participant_count != null ? '<span><strong>المشاركون</strong>' + esc(String(activity.participant_count)) + '</span>' : "",
    activity.activity_type ? '<span><strong>المجال</strong>' + esc(typeMap[activity.activity_type] || activity.activity_type) + '</span>' : ""
  ].filter(Boolean).join("");

  const canonical = origin + "/activities/" + encodeURIComponent(slug);
  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} | مؤسسة ميدلايف</title>
<meta name="description" content="${description}">
<meta name="theme-color" content="#12203a">
<link rel="canonical" href="${esc(canonical)}">
<link rel="icon" href="/logo.PNG">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/homepage-redesign.css">
<style>
.activity-detail-hero{padding:72px 0 54px;background:linear-gradient(135deg,#f8fafc 0%,#fff 56%,#fff1f4 100%);border-bottom:1px solid var(--ml-line)}
.activity-detail-grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(320px,.9fr);gap:38px;align-items:center}
.activity-detail-kicker{color:var(--ml-red);font-size:13px;font-weight:900}
.activity-detail-hero h1{margin:12px 0 15px;color:var(--ml-navy);font-size:clamp(34px,5.2vw,60px);line-height:1.5}
.activity-detail-lead{margin:0;color:var(--ml-muted);font-size:15px;line-height:2.15;max-width:760px}
.activity-detail-cover{border-radius:28px;overflow:hidden;border:1px solid var(--ml-line);background:#f3f6f8;box-shadow:var(--ml-shadow);min-height:300px;display:grid;place-items:center}
.activity-detail-cover img{width:100%;height:100%;max-height:440px;object-fit:cover;display:block}
.activity-detail-cover.no-image{min-height:300px}
.activity-detail-cover.no-image img{width:160px;height:auto;object-fit:contain;opacity:.55}
.activity-detail-meta{display:flex;flex-wrap:wrap;gap:9px;margin-top:22px}
.activity-detail-meta span{display:flex;flex-direction:column;gap:2px;padding:9px 12px;background:#fff;border:1px solid var(--ml-line);border-radius:11px;color:var(--ml-muted);font-size:10px}
.activity-detail-meta strong{color:var(--ml-navy);font-size:10px}
.activity-detail-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:23px}
.activity-detail-actions .btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;border-radius:11px;padding:10px 15px;font:900 12px Cairo,sans-serif}
.activity-detail-actions .primary{background:var(--ml-red);color:#fff}
.activity-detail-actions .secondary{background:#fff;color:var(--ml-navy);border:1px solid var(--ml-line)}
.activity-detail-section{padding:82px 0}
.activity-detail-content{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,.78fr);gap:24px;align-items:start}
.activity-detail-card{background:#fff;border:1px solid var(--ml-line);border-radius:24px;padding:30px;box-shadow:var(--ml-shadow)}
.activity-detail-card h2{margin:0 0 13px;color:var(--ml-navy);font-size:24px}
.activity-detail-card p{margin:0 0 14px;color:var(--ml-muted);font-size:14px;line-height:2.1}
.activity-detail-card p:last-child{margin-bottom:0}
.activity-gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.gallery-item{border:1px solid var(--ml-line);padding:0;background:#fff;border-radius:16px;overflow:hidden;aspect-ratio:4/3;cursor:pointer}
.gallery-item img{width:100%;height:100%;object-fit:cover;display:block;transition:.35s}
.gallery-item:hover img{transform:scale(1.04)}
.gallery-empty{padding:35px 20px;border:1px dashed #dce3eb;border-radius:18px;color:var(--ml-muted);text-align:center;background:#fbfcfe;font-size:12px}
.activity-lightbox{position:fixed;inset:0;z-index:5000;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(6,10,22,.94)}
.activity-lightbox.open{display:flex}
.activity-lightbox img{max-width:94vw;max-height:86vh;border-radius:18px;box-shadow:0 30px 100px rgba(0,0,0,.45)}
.activity-lightbox button{position:absolute;top:18px;left:22px;width:48px;height:42px;border:0;border-radius:10px;background:#fff;color:var(--ml-navy);font:800 12px Cairo,sans-serif;cursor:pointer}
@media(max-width:900px){.activity-detail-grid,.activity-detail-content{grid-template-columns:1fr}.activity-detail-cover{min-height:250px}.activity-gallery{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:600px){.activity-detail-hero{padding:50px 0 40px}.activity-detail-hero h1{font-size:34px}.activity-detail-card{padding:23px}.activity-gallery{grid-template-columns:1fr}.gallery-item{aspect-ratio:16/10}}
</style>
</head>
<body>
<main>
<section class="activity-detail-hero">
<div class="ml-wrap activity-detail-grid">
<div>
<div class="activity-detail-kicker">مبادرات وأنشطة ميدلايف</div>
<h1>${title}</h1>
${description ? '<p class="activity-detail-lead">' + description + '</p>' : ''}
${meta ? '<div class="activity-detail-meta">' + meta + '</div>' : ''}
${actions ? '<div class="activity-detail-actions">' + actions + '</div>' : ''}
</div>
<div class="activity-detail-cover ${image ? '' : 'no-image'}">
${image ? '<img src="' + esc(image) + '" alt="' + title + '" loading="eager">' : '<img src="/logo.PNG" alt="MedLife">'}
</div>
</div>
</section>
<section class="ml-section ml-soft activity-detail-section">
<div class="ml-wrap activity-detail-content">
<article class="activity-detail-card">
<h2>عن النشاط</h2>
${detailsHtml}
</article>
<section class="activity-detail-card">
<h2>صور النشاط</h2>
${galleryHtml}
</section>
</div>
</section>
</main>
<div class="activity-lightbox" id="activityLightbox" aria-hidden="true"><button type="button" id="activityLightboxClose">إغلاق</button><img id="activityLightboxImage" alt=""></div>
<footer class="ml-footer">© 2026 مؤسسة ميدلايف الطبية الخيرية التطوعية — بالعمل التطوعي نصنع الأثر.</footer>
<script src="/site-nav.js"></script>
<script>
(() => {
 const box=document.getElementById("activityLightbox"), image=document.getElementById("activityLightboxImage");
 const close=()=>{box.classList.remove("open");box.setAttribute("aria-hidden","true");image.src="";};
 document.querySelectorAll(".gallery-item").forEach(item=>item.addEventListener("click",()=>{image.src=item.dataset.image||"";image.alt=item.querySelector("img")?.alt||"MedLife";box.classList.add("open");box.setAttribute("aria-hidden","false");}));
 document.getElementById("activityLightboxClose")?.addEventListener("click",close);
 box?.addEventListener("click",e=>{if(e.target===box)close();});
 document.addEventListener("keydown",e=>{if(e.key==="Escape")close();});
})();
</script>
</body></html>`;

  return new Response(html, {
    headers: { "content-type":"text/html; charset=UTF-8", "cache-control":"no-store, no-cache, must-revalidate" }
  });
}
