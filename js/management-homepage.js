(function(){
"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const safeUrl=v=>{try{const u=new URL(String(v||""),location.origin);return u.protocol==="https:"||u.origin===location.origin?u.href:""}catch{return""}};
const text=(v,n=260)=>esc(String(v??"").trim().slice(0,n));
function card(title,meta,desc,url){
  const href=safeUrl(url)||"#";
  return `<article style="background:#fff;border:1px solid rgba(15,35,63,.08);border-radius:18px;padding:20px;box-shadow:0 12px 30px rgba(15,35,63,.06)">
    <div style="color:#e83255;font-size:10px;font-weight:900;margin-bottom:6px">${text(meta,80)}</div>
    <h3 style="margin:0 0 8px;color:#12203a;font-size:17px;line-height:1.6">${text(title,180)}</h3>
    <p style="margin:0;color:#738092;font-size:11px;line-height:1.9">${text(desc,300)}</p>
    ${href!=="#" ? `<a href="${esc(href)}" style="display:inline-block;margin-top:12px;color:#e83255;font-size:10px;font-weight:900">عرض المزيد ←</a>` : ""}
  </article>`;
}
async function get(resource){
  const r=await fetch("/api/management?resource="+encodeURIComponent(resource)+"&limit=6",{headers:{Accept:"application/json"},cache:"no-store"});
  if(!r.ok)throw 0;
  const d=await r.json();
  return Array.isArray(d?.data)?d.data:[];
}
async function init(){
  const anchor=document.querySelector("#programs");
  if(!anchor)return;
  try{
    const [content,activities,campaigns,media]=await Promise.all([
      get("content").catch(()=>[]),get("activities").catch(()=>[]),get("campaigns").catch(()=>[]),get("media").catch(()=>[])
    ]);
    if(content.length||activities.length||campaigns.length){
      const section=document.createElement("section");
      section.className="ml-section ml-soft ml-reveal";
      section.id="managementLive";
      section.innerHTML=`<div class="ml-wrap">
        <div class="ml-heading"><div class="ml-eyebrow">آخر مستجدات ميدلايف</div><h2>منصة الإدارة تحافظ على الموقع محدثاً</h2><p>المحتوى العام المنشور والمعتمد يظهر هنا تلقائياً.</p></div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px" id="managementLiveGrid"></div>
      </div>`;
      anchor.insertAdjacentElement("afterend",section);
      const grid=section.querySelector("#managementLiveGrid");
      const items=[
        ...content.slice(0,2).map(x=>card(x.title,"مقال أو محتوى منشور",x.excerpt||x.body,safeUrl(x.public_url)||`/articles/${encodeURIComponent(x.slug||"")}`)),
        ...activities.slice(0,2).map(x=>card(x.title,"نشاط · "+(x.governorate||"ميدلايف"),x.description,safeUrl(x.public_url)||"#")),
        ...campaigns.slice(0,2).map(x=>card(x.name,"حملة · "+(x.governorate||"ميدلايف"),x.description,safeUrl(x.public_url)||"#"))
      ].slice(0,6);
      grid.innerHTML=items.join("");
      const style=document.createElement("style");
      style.textContent="@media(max-width:850px){#managementLiveGrid{grid-template-columns:1fr 1fr!important}}@media(max-width:560px){#managementLiveGrid{grid-template-columns:1fr!important}}";
      section.appendChild(style);
    }
    if(media.length){
      const gallery=document.querySelector("[data-home-gallery]");
      if(gallery){
        gallery.innerHTML=media.slice(0,6).map(x=>{
          const u=safeUrl(x.public_url); return u?`<article class="ml-gallery-card"><img src="${esc(u)}" alt="${text(x.alt_text||x.caption||"من أنشطة ميدلايف",140)}" loading="lazy"><div class="ml-gallery-overlay"><h3>${text(x.caption||"من أنشطة ميدلايف",90)}</h3><p>من مكتبة الوسائط المنشورة في منصة الإدارة</p></div></article>`:"";
        }).join("");
      }
    }
  }catch(e){console.warn("Management homepage integration skipped",e);}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();