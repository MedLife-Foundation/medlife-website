(function(){
"use strict";
const form=document.getElementById("renewalForm"), progress=document.getElementById("progress"), sectionsHost=document.getElementById("sections");
const errorBox=document.getElementById("formError"), successBox=document.getElementById("formSuccess");
let model=null, fields=[], sections=[], step=0, loading=true;

const groupDefs=[
 {title:"المعلومات الأساسية",desc:"البيانات الشخصية وبيانات التواصل والعنوان.",min:5,max:129},
 {title:"المعلومات الأكاديمية والمهنية",desc:"الجامعة والاختصاص والمهنة والخبرات.",min:130,max:189},
 {title:"العضوية والتطوع",desc:"تاريخ الانضمام، الأقسام، الساعات، الشهادات والتفرغ.",min:190,max:280},
 {title:"التأكيد والخصوصية",desc:"التصريح بصحة المعلومات والموافقة على استخدامها.",min:281,max:999}
];
function fieldListForGroup(group){return fields.filter(f=>Number(f.sort_order)>=group.min&&Number(f.sort_order)<=group.max).sort((a,b)=>Number(a.sort_order)-Number(b.sort_order))}
function setError(msg){errorBox.textContent=msg||"";errorBox.className=msg?"error show":"error"}
function setSuccess(msg){successBox.textContent=msg||"";successBox.className=msg?"success show":"success"}
function escapeAttr(v){return String(v??"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
function buildOptions(f){
 const opts=Array.isArray(f.options)?f.options:[];
 return opts.map(o=>({value:String(o.value??o.label_ar??""),label:String(o.label_ar??o.label??o.value??"")})).filter(o=>o.value&&o.label)
}
function renderField(f){
 const wrap=document.createElement("div"); wrap.className="field"+(f.field_type==="textarea"||f.field_type==="multi_select"||f.field_type==="boolean"?" full":""); wrap.dataset.key=f.field_key;
 const label=document.createElement("span"); label.textContent=String(f.label_ar||f.field_key)+(f.required?" *":""); wrap.appendChild(label);
 if(f.help_ar){const p=document.createElement("p");p.className="help";p.textContent=f.help_ar;wrap.appendChild(p)}
 if(f.field_key==="current_units") {
   const note=document.createElement("p"); note.className="dept-note"; note.textContent="يمكنك اختيار أكثر من قسم أو فريق، لأن العضو قد ينتمي إلى أكثر من وحدة."; wrap.appendChild(note);
 }
 const type=String(f.field_type||"text");
 if(type==="multi_select"){
   const box=document.createElement("div");box.className="options";
   buildOptions(f).forEach(o=>{const l=document.createElement("label");l.className="option";const i=document.createElement("input");i.type="checkbox";i.name=f.field_key;i.value=o.value;i.dataset.key=f.field_key;const s=document.createElement("span");s.textContent=o.label;l.append(i,s);box.appendChild(l)});
   wrap.appendChild(box);
 }else if(type==="boolean"){
   const l=document.createElement("label");l.className="boolean";const i=document.createElement("input");i.type="checkbox";i.dataset.key=f.field_key;const s=document.createElement("span");s.textContent=f.label_ar||f.field_key;label.remove();l.append(i,s);wrap.appendChild(l)
 }else if(type==="select"){
   const s=document.createElement("select");s.dataset.key=f.field_key;const ph=document.createElement("option");ph.value="";ph.textContent="اختر";s.appendChild(ph);buildOptions(f).forEach(o=>{const op=document.createElement("option");op.value=o.value;op.textContent=o.label;s.appendChild(op)});wrap.appendChild(s)
 }else{
   const i=type==="textarea"?document.createElement("textarea"):document.createElement("input");
   if(i.tagName==="INPUT") i.type=type==="phone"?"tel":type; i.dataset.key=f.field_key; if(f.placeholder_ar)i.placeholder=f.placeholder_ar; wrap.appendChild(i)
 }
 return wrap;
}
function getValue(key,type){
 const nodes=[...form.querySelectorAll('[data-key="'+CSS.escape(key)+'"]')];
 if(type==="multi_select")return nodes.filter(n=>n.checked).map(n=>n.value);
 if(type==="boolean")return Boolean(nodes[0]?.checked);
 return nodes[0]?.value??"";
}
function validateStep(){
 const fs=fieldListForGroup(groupDefs[step]);
 for(const f of fs){
   if(!f.required)continue;
   const v=getValue(f.field_key,f.field_type);
   const missing=Array.isArray(v)?v.length===0:(f.field_type==="boolean"?v!==true:!String(v).trim());
   if(missing){setError("يرجى تعبئة السؤال: "+(f.label_ar||f.field_key));const target=form.querySelector('[data-key="'+CSS.escape(f.field_key)+'"]');target?.scrollIntoView({behavior:"smooth",block:"center"});target?.focus();return false}
 }
 setError("");return true;
}
function collect(){
 const data={};
 for(const f of fields){
   const v=getValue(f.field_key,f.field_type);
   if(f.field_type==="boolean")data[f.field_key]=Boolean(v);
   else if(Array.isArray(v)?v.length:String(v).trim())data[f.field_key]=v;
 }
 return data;
}
function draw(){
 progress.innerHTML="";
 sectionsHost.innerHTML="";
 sections=groupDefs.map((g,i)=>({g,el:null}));
 groupDefs.forEach((g,i)=>{
   const p=document.createElement("button");p.type="button";p.className="progress-item"+(i===step?" active ":"")+(i<step?" done":"");p.innerHTML='<span class="num">'+(i+1)+'</span><strong>'+g.title+'</strong>';p.addEventListener("click",()=>{if(i<=step||validateStep()){step=i;draw()}});progress.appendChild(p);
   const sec=document.createElement("section");sec.className="section"+(i===step?" active":"");
   const head=document.createElement("div");head.className="section-head";head.innerHTML='<div><h2>'+g.title+'</h2><p>'+g.desc+'</p></div>';sec.appendChild(head);
   const grid=document.createElement("div");grid.className="grid";
   fieldListForGroup(g).forEach(f=>grid.appendChild(renderField(f)));
   sec.appendChild(grid);
   const actions=document.createElement("div");actions.className="actions";
   const back=document.createElement("button");back.type="button";back.className="btn btn-secondary";back.textContent=i===0?"العودة":"السابق";back.onclick=()=>{if(i===0){location.href="join-options.html"}else{step=i-1;setError("");draw()}};
   const next=document.createElement("button");next.type="button";next.className="btn btn-primary";next.textContent=i===groupDefs.length-1?"إرسال طلب التجديد":"التالي";next.onclick=()=>{if(!validateStep())return;if(i===groupDefs.length-1){submit()}else{step=i+1;draw();window.scrollTo({top:0,behavior:"smooth"})}};
   actions.append(back,next);sec.appendChild(actions);sectionsHost.appendChild(sec)
 });
}
async function load(){
 try{
   const r=await fetch("/api/management?resource=membership_renewal_form",{cache:"no-store"});
   const j=await r.json();if(!r.ok||!j.success)throw new Error(j.error||"تعذر تحميل نموذج تجديد العضوية.");
   model=j.data?.[0]||null;if(!model?.id)throw new Error("نموذج تجديد العضوية غير متاح حالياً.");
   fields=(Array.isArray(model.fields)?model.fields:[]).filter(f=>f?.is_active);
   if(!fields.length)throw new Error("لم تتم تهيئة أسئلة النموذج بعد.");
   draw();
 }catch(e){setError(e.message||"تعذر تحميل النموذج.");form.querySelectorAll("button").forEach(b=>b.disabled=true)}
 finally{loading=false}
}
async function submit(){
 if(loading||!validateStep())return;
 const data=collect();
 const btn=[...form.querySelectorAll(".btn-primary")].find(b=>b.textContent.includes("إرسال"))||null;
 if(btn)btn.disabled=true;setError("");setSuccess("جارٍ إرسال طلب تجديد العضوية...");
 try{
   const r=await fetch("/api/management",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
     action:"membership_renewal",
     form_id:model.id,
     form_data:data
   })});
   const j=await r.json().catch(()=>({}));
   if(!r.ok||!j.success)throw new Error(j.error||"تعذر تسجيل طلب تجديد العضوية.");
   setSuccess("تم استلام طلب تجديد العضوية بنجاح. سيتم تدقيق البيانات من فريق ميدلايف قبل اعتمادها في قاعدة الأعضاء.");
   form.querySelectorAll("input,select,textarea,button").forEach(el=>el.disabled=true);
   window.scrollTo({top:0,behavior:"smooth"});
 }catch(e){setSuccess("");setError(e.message||"تعذر إرسال الطلب حالياً.");if(btn)btn.disabled=false}
}
void load();
})();