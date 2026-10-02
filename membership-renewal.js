(function(){
"use strict";

const form=document.getElementById("renewalForm");
const progress=document.getElementById("progress");
const sectionsHost=document.getElementById("sections");
const errorBox=document.getElementById("formError");
const successBox=document.getElementById("formSuccess");

let model=null;
let fields=[];
let groupSections=[];
let progressButtons=[];
let step=0;
let loading=true;

const groupDefs=[
  {title:"المعلومات الأساسية",desc:"البيانات الشخصية وبيانات التواصل والعنوان.",min:5,max:129},
  {title:"المعلومات الأكاديمية والمهنية",desc:"الجامعة والاختصاص والمهنة والخبرات.",min:130,max:189},
  {title:"العضوية والتطوع",desc:"تاريخ الانضمام، الأقسام، الساعات، الشهادات والتفرغ.",min:190,max:280},
  {title:"التأكيد والخصوصية",desc:"التصريح بصحة المعلومات والموافقة على استخدامها.",min:281,max:999}
];

function setError(message){
  errorBox.textContent=message||"";
  errorBox.className=message?"error show":"error";
}

function setSuccess(message){
  successBox.textContent=message||"";
  successBox.className=message?"success show":"success";
}

function fieldListForGroup(group){
  return fields
    .filter(field=>Number(field.sort_order)>=group.min && Number(field.sort_order)<=group.max)
    .sort((a,b)=>Number(a.sort_order)-Number(b.sort_order));
}

function buildOptions(field){
  const options=Array.isArray(field.options)?field.options:[];
  return options
    .map(option=>({
      value:String(option.value??option.label_ar??""),
      label:String(option.label_ar??option.label??option.value??"")
    }))
    .filter(option=>option.value&&option.label);
}

function getNodes(key){
  return [...form.querySelectorAll('[data-key="'+CSS.escape(key)+'"]')];
}

function getValue(key,type){
  const nodes=getNodes(key);
  if(type==="multi_select") return nodes.filter(node=>node.checked).map(node=>node.value);
  if(type==="boolean") return Boolean(nodes[0]?.checked);
  return nodes[0]?.value??"";
}

function getUnitDetails(){
  const details={};
  getValue("current_units","multi_select").forEach(unitId=>{
    const key=String(unitId);
    const role=form.querySelector('[data-unit-role="'+CSS.escape(key)+'"]')?.value||"";
    const joinedOn=form.querySelector('[data-unit-joined="'+CSS.escape(key)+'"]')?.value||"";
    const continuing=form.querySelector('[data-unit-continuing="'+CSS.escape(key)+'"]')?.value==="true";
    const notes=form.querySelector('[data-unit-notes="'+CSS.escape(key)+'"]')?.value||"";
    details[key]={role,joined_on:joinedOn,continuing,notes};
  });
  return details;
}

function validateUnitDetails(){
  const units=getValue("current_units","multi_select");
  const details=getUnitDetails();
  for(const unitId of units){
    const key=String(unitId);
    const detail=details[key]||{};
    const label=form.querySelector('[data-unit-label="'+CSS.escape(key)+'"]')?.textContent||"الوحدة المختارة";
    if(detail.role!=="volunteer" && detail.role!=="supervisor"){
      setError("يرجى تحديد دورك في: "+label);
      form.querySelector('[data-unit-role="'+CSS.escape(key)+'"]')?.focus();
      return false;
    }
    if(!/^\d{4}-\d{2}-\d{2}$/.test(detail.joined_on)){
      setError("يرجى تحديد تاريخ بدء انتسابك إلى: "+label);
      form.querySelector('[data-unit-joined="'+CSS.escape(key)+'"]')?.focus();
      return false;
    }
    if(typeof detail.continuing!=="boolean"){
      setError("يرجى تحديد هل ما زلت مستمراً في: "+label);
      form.querySelector('[data-unit-continuing="'+CSS.escape(key)+'"]')?.focus();
      return false;
    }
  }
  return true;
}

function setSectionVisible(index){
  step=index;
  groupSections.forEach((section,i)=>section.classList.toggle("active",i===index));
  progressButtons.forEach((button,i)=>{
    button.classList.toggle("active",i===index);
    button.classList.toggle("done",i<index);
  });
  setError("");
  window.scrollTo({top:0,behavior:"smooth"});
}

function renderField(field){
  const wrapper=document.createElement("div");
  wrapper.className="field"+(
    field.field_type==="textarea"||
    field.field_type==="multi_select"||
    field.field_type==="boolean" ? " full":""
  );
  wrapper.dataset.key=field.field_key;

  const label=document.createElement("span");
  label.textContent=String(field.label_ar||field.field_key)+(field.required?" *":"");
  wrapper.appendChild(label);

  if(field.field_key==="current_unit_details"){
    wrapper.style.display="none";
    return wrapper;
  }

  if(field.help_ar){
    const help=document.createElement("p");
    help.className="help";
    help.textContent=String(field.help_ar);
    wrapper.appendChild(help);
  }

  if(field.field_key==="current_units"){
    const note=document.createElement("p");
    note.className="dept-note";
    note.textContent="يمكنك اختيار عدة وحدات. بعد اختيار كل وحدة، حدّد دورك فيها بشكل مستقل.";
    wrapper.appendChild(note);
  }

  const type=String(field.field_type||"text");

  if(field.field_key==="current_units"){
    const box=document.createElement("div");
    box.className="unit-role-list";
    buildOptions(field).forEach(option=>{
      const item=document.createElement("div");
      item.className="unit-role-item";
      const head=document.createElement("label");
      head.className="option";
      head.dataset.unitLabel=option.value;
      const input=document.createElement("input");
      input.type="checkbox";
      input.name=field.field_key;
      input.value=option.value;
      input.dataset.key=field.field_key;
      const text=document.createElement("span");
      text.textContent=option.label;
      head.append(input,text);

      const details=document.createElement("div");
      details.className="unit-role-details";

      const role=document.createElement("select");
      role.dataset.unitRole=option.value;
      role.setAttribute("aria-label","الدور في "+option.label);
      role.disabled=true;
      const rolePlaceholder=document.createElement("option");
      rolePlaceholder.value="";
      rolePlaceholder.textContent="الدور داخل الوحدة";
      role.appendChild(rolePlaceholder);
      [
        {value:"volunteer",label:"متطوع"},
        {value:"supervisor",label:"مشرف"}
      ].forEach(itemRole=>{
        const roleOption=document.createElement("option");
        roleOption.value=itemRole.value;
        roleOption.textContent=itemRole.label;
        role.appendChild(roleOption);
      });

      const joined=document.createElement("input");
      joined.type="date";
      joined.dataset.unitJoined=option.value;
      joined.setAttribute("aria-label","تاريخ بدء الانتساب إلى "+option.label);
      joined.disabled=true;

      const continuing=document.createElement("select");
      continuing.dataset.unitContinuing=option.value;
      continuing.setAttribute("aria-label","الاستمرار في "+option.label);
      continuing.disabled=true;
      const contPlaceholder=document.createElement("option");
      contPlaceholder.value="";
      contPlaceholder.textContent="هل ما زلت مستمراً؟";
      continuing.appendChild(contPlaceholder);
      [{value:"true",label:"نعم، مستمر"},{value:"false",label:"لا، توقفت"}].forEach(itemCont=>{
        const contOption=document.createElement("option");
        contOption.value=itemCont.value;
        contOption.textContent=itemCont.label;
        continuing.appendChild(contOption);
      });

      const notes=document.createElement("textarea");
      notes.dataset.unitNotes=option.value;
      notes.setAttribute("aria-label","ملاحظات عن "+option.label);
      notes.placeholder="ملاحظات عن انتسابك إلى هذه الوحدة";
      notes.disabled=true;
      notes.rows=2;

      input.addEventListener("change",()=>{
        const enabled=input.checked;
        role.disabled=!enabled;
        joined.disabled=!enabled;
        continuing.disabled=!enabled;
        notes.disabled=!enabled;
        if(!enabled){
          role.value="";
          joined.value="";
          continuing.value="";
          notes.value="";
        }
      });

      details.append(role,joined,continuing,notes);
      item.append(head,details);
      box.appendChild(item);
    });
    wrapper.appendChild(box);
  }else if(type==="multi_select"){
    const box=document.createElement("div");
    box.className="options";
    buildOptions(field).forEach(option=>{
      const item=document.createElement("label");
      item.className="option";
      const input=document.createElement("input");
      input.type="checkbox";
      input.name=field.field_key;
      input.value=option.value;
      input.dataset.key=field.field_key;
      const text=document.createElement("span");
      text.textContent=option.label;
      item.append(input,text);
      box.appendChild(item);
    });
    wrapper.appendChild(box);
  }else if(type==="boolean"){
    const item=document.createElement("label");
    item.className="boolean";
    const input=document.createElement("input");
    input.type="checkbox";
    input.dataset.key=field.field_key;
    const text=document.createElement("span");
    text.textContent=String(field.label_ar||field.field_key);
    label.remove();
    item.append(input,text);
    wrapper.appendChild(item);
  }else if(type==="select"){
    const select=document.createElement("select");
    select.dataset.key=field.field_key;
    const placeholder=document.createElement("option");
    placeholder.value="";
    placeholder.textContent="اختر";
    select.appendChild(placeholder);
    buildOptions(field).forEach(option=>{
      const optionNode=document.createElement("option");
      optionNode.value=option.value;
      optionNode.textContent=option.label;
      select.appendChild(optionNode);
    });
    wrapper.appendChild(select);
  }else{
    const input=type==="textarea"?document.createElement("textarea"):document.createElement("input");
    if(input.tagName==="INPUT") input.type=type==="phone"?"tel":type;
    input.dataset.key=field.field_key;
    if(field.placeholder_ar) input.placeholder=String(field.placeholder_ar);
    wrapper.appendChild(input);
  }

  return wrapper;
}

function fieldVisible(field){
  if(field.field_key==="certificate_other"){
    const values=getValue("certificate_types","multi_select");
    return values.includes("other");
  }
  const rule=field.visibility||{};
  if(rule.mode!=="when") return true;
  const controlling=fields.find(x=>x.field_key===String(rule.field_key||""));
  if(!controlling) return false;
  const actual=getValue(controlling.field_key,controlling.field_type);
  const expected=String(rule.value??"");
  if(rule.operator==="not_equals") return Array.isArray(actual)?!actual.includes(expected):String(actual)!==expected;
  if(rule.operator==="contains") return Array.isArray(actual)?actual.includes(expected):String(actual).includes(expected);
  return Array.isArray(actual)?actual.includes(expected):String(actual)===expected;
}

function refreshVisibility(){
  fields.forEach(field=>{
    const wrapper=form.querySelector('[data-key="'+CSS.escape(field.field_key)+'"]');
    if(!wrapper) return;
    wrapper.style.display=fieldVisible(field)?"":"none";
  });
}

function validateGroup(index){
  const group=groupDefs[index];
  const groupFields=fieldListForGroup(group);
  refreshVisibility();

  for(const field of groupFields){
    if(!field.required || !fieldVisible(field) || field.field_type==="boolean") continue;
    const value=getValue(field.field_key,field.field_type);
    if(Array.isArray(value)?value.length===0:!String(value).trim()){
      setError("يرجى تعبئة السؤال: "+String(field.label_ar||field.field_key));
      const target=form.querySelector('[data-key="'+CSS.escape(field.field_key)+'"]');
      target?.scrollIntoView({behavior:"smooth",block:"center"});
      target?.focus();
      return false;
    }
  }
  setError("");
  return true;
}

function validateAll(){
  for(let i=0;i<groupDefs.length;i++){
    if(!validateGroup(i)){setSectionVisible(i);return false;}
  }

  const continuing=getValue("continuing_as_volunteer","boolean");
  if(typeof continuing!=="boolean"){
    setError("يرجى تحديد رغبتك بالاستمرار كمتطوع.");
    return false;
  }

  if(!validateUnitDetails()){
    setSectionVisible(2);
    return false;
  }

  if(getValue("certificate_types","multi_select").length===0){
    setError("يرجى تحديد حالة الشهادات.");
    setSectionVisible(2);
    return false;
  }

  if(getValue("declaration_accurate","boolean")!==true){
    setError("يجب تأكيد صحة المعلومات قبل الإرسال.");
    setSectionVisible(3);
    return false;
  }

  if(getValue("privacy_consent","boolean")!==true){
    setError("يجب الموافقة على استخدام البيانات لأغراض إدارة العضوية.");
    setSectionVisible(3);
    return false;
  }

  return true;
}

function collect(){
  refreshVisibility();
  const data={};
  for(const field of fields){
    if(!fieldVisible(field)) continue;
    if(field.field_key==="current_unit_roles") continue;
    const value=getValue(field.field_key,field.field_type);
    if(field.field_type==="boolean") data[field.field_key]=Boolean(value);
    else if(Array.isArray(value)?value.length:String(value??"").trim()) data[field.field_key]=value;
  }
  data.current_unit_details=getUnitDetails();
  return data;
}

function build(){
  progress.innerHTML="";
  sectionsHost.innerHTML="";
  groupSections=[];
  progressButtons=[];

  groupDefs.forEach((group,index)=>{
    const button=document.createElement("button");
    button.type="button";
    button.className="progress-item"+(index===0?" active":"");
    button.innerHTML='<span class="num">'+(index+1)+'</span><strong>'+group.title+'</strong>';
    button.addEventListener("click",()=>{
      if(index<=step){setSectionVisible(index);return;}
      for(let i=step;i<index;i++){
        if(!validateGroup(i)){setSectionVisible(i);return;}
      }
      setSectionVisible(index);
    });
    progress.appendChild(button);
    progressButtons.push(button);

    const section=document.createElement("section");
    section.className="section"+(index===0?" active":"");
    const head=document.createElement("div");
    head.className="section-head";
    head.innerHTML='<div><h2>'+group.title+'</h2><p>'+group.desc+'</p></div>';
    section.appendChild(head);

    const grid=document.createElement("div");
    grid.className="grid";
    fieldListForGroup(group).forEach(field=>grid.appendChild(renderField(field)));
    section.appendChild(grid);

    const actions=document.createElement("div");
    actions.className="actions";

    const back=document.createElement("button");
    back.type="button";
    back.className="btn btn-secondary";
    back.textContent=index===0?"العودة":"السابق";
    back.addEventListener("click",()=>{
      if(index===0) location.href="join-options.html";
      else setSectionVisible(index-1);
    });

    const next=document.createElement("button");
    next.type="button";
    next.className="btn btn-primary";
    next.textContent=index===groupDefs.length-1?"إرسال طلب التجديد":"التالي";
    next.addEventListener("click",()=>{
      if(index===groupDefs.length-1){void submit();return}
      if(validateGroup(index))setSectionVisible(index+1);
    });

    actions.append(back,next);
    section.appendChild(actions);
    sectionsHost.appendChild(section);
    groupSections.push(section);
  });

  form.addEventListener("input",refreshVisibility);
  form.addEventListener("change",refreshVisibility);
  refreshVisibility();
}

async function load(){
  try{
    const response=await fetch("/api/management?resource=membership_renewal_form",{cache:"no-store"});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok||!payload.success) throw new Error(payload.error||"تعذر تحميل نموذج تجديد العضوية.");
    model=payload.data?.[0]||null;
    if(!model?.id) throw new Error("نموذج تجديد العضوية غير متاح حالياً.");
    fields=(Array.isArray(model.fields)?model.fields:[]).filter(field=>field?.is_active);
    if(!fields.length) throw new Error("لم تتم تهيئة أسئلة النموذج بعد.");
    build();
  }catch(error){
    setError(error.message||"تعذر تحميل النموذج.");
    form.querySelectorAll("button").forEach(button=>button.disabled=true);
  }finally{
    loading=false;
  }
}

async function submit(){
  if(loading||!validateAll()) return;
  const data=collect();
  const button=[...form.querySelectorAll(".btn-primary")].find(node=>node.textContent.includes("إرسال"));
  if(button) button.disabled=true;

  setError("");
  setSuccess("جارٍ إرسال طلب تجديد العضوية...");

  try{
    const response=await fetch("/api/management",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({action:"membership_renewal",form_id:model.id,form_data:data})
    });
    const payload=await response.json().catch(()=>({}));
    if(!response.ok||!payload.success) throw new Error(payload.error||"تعذر تسجيل طلب تجديد العضوية.");

    setSuccess("تم استلام طلب تجديد العضوية بنجاح. سيقوم فريق ميدلايف بتدقيق البيانات قبل اعتمادها في قاعدة الأعضاء.");
    form.querySelectorAll("input,select,textarea,button").forEach(element=>element.disabled=true);
    window.scrollTo({top:0,behavior:"smooth"});
  }catch(error){
    setSuccess("");
    setError(error.message||"تعذر إرسال الطلب حالياً.");
    if(button) button.disabled=false;
  }
}

void load();
})();