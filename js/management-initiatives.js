(function(){
"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function init(){
 const grid=document.querySelector("main .grid"); if(!grid)return;
 try{
  const r=await fetch("/api/management?resource=activities&limit=12",{headers:{Accept:"application/json"},cache:"no-store"});
  if(!r.ok)return;
  const d=await r.json(),rows=Array.isArray(d?.data)?d.data:[];if(!rows.length)return;
  const section=document.createElement("section");
  section.className="management-activities";
  section.innerHTML=`<div style="text-align:center;margin-bottom:22px"><div style="color:#ff2a54;font-weight:900;font-size:12px">منصة الإدارة</div><h2 style="margin:6px 0;color:#14213d">أحدث أنشطة ميدلايف</h2><p style="margin:0;color:#697586">الأنشطة التي اعتمدها الفريق للعرض العام.</p></div><div class="mg-grid"></div>`;
  grid.parentNode.insertBefore(section,grid);
  section.querySelector(".mg-grid").innerHTML=rows.map(x=>`<article class="card"><div class="body"><div class="source">${esc(x.activity_type||"نشاط")} · ${esc(x.governorate||"ميدلايف")}</div><h2>${esc(x.title)}</h2><p>${esc(x.description||"نشاط من أنشطة ميدلايف المنشورة.")}</p><div class="source">${esc(x.city||"")} ${x.start_at?"· "+new Date(x.start_at).toLocaleDateString("ar-SY"):""}</div></div></article>`).join("");
  const s=document.createElement("style");s.textContent=".management-activities{padding:42px 0}.mg-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}@media(max-width:900px){.mg-grid{grid-template-columns:1fr 1fr}}@media(max-width:600px){.mg-grid{grid-template-columns:1fr}}";section.appendChild(s);
 }catch(e){console.warn("Management initiatives integration skipped",e);}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();