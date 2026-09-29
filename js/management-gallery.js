(function(){
"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const safeUrl=v=>{try{const u=new URL(String(v||""),location.origin);return u.protocol==="https:"||u.origin===location.origin?u.href:""}catch{return""}};
async function init(){
 const host=document.querySelector("#gallery"); if(!host)return;
 try{
  const r=await fetch("/api/management?resource=media&limit=30",{headers:{Accept:"application/json"},cache:"no-store"});
  if(!r.ok)return;
  const d=await r.json(), rows=Array.isArray(d?.data)?d.data:[]; if(!rows.length)return;
  const section=document.createElement("section");
  section.innerHTML=`<div class="wrap"><div style="padding:30px 0 12px;text-align:center"><div class="eyebrow">منصة الإدارة</div><h2 style="color:#151d36;margin:7px 0">أحدث الوسائط المنشورة</h2><p style="color:#64748b;font-size:12px">صور اعتمدها فريق ميدلايف للنشر على الموقع.</p></div><div id="managementGalleryGrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding:0 0 30px"></div></div>`;
  host.parentNode.insertBefore(section,host.parentNode.firstElementChild);
  const grid=section.querySelector("#managementGalleryGrid");
  grid.innerHTML=rows.map(x=>{const u=safeUrl(x.public_url);if(!u)return"";return `<article class="card" style="cursor:default"><img src="${esc(u)}" alt="${esc(x.alt_text||x.caption||"من أنشطة ميدلايف")}" loading="lazy"><div class="overlay"><h3>${esc(x.caption||"من أنشطة ميدلايف")}</h3><p>من مكتبة الوسائط</p></div></article>`}).join("");
  const s=document.createElement("style");s.textContent="@media(max-width:850px){#managementGalleryGrid{grid-template-columns:repeat(2,1fr)!important}}@media(max-width:560px){#managementGalleryGrid{grid-template-columns:1fr!important}}";section.appendChild(s);
 }catch(e){console.warn("Management gallery integration skipped",e);}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();