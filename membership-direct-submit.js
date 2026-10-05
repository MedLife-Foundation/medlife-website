(function(){
  "use strict";
  const SUPABASE_URL="https://ftvjakwogxdlxxbpfydf.supabase.co";
  const SUPABASE_KEY="sb_publishable_beiimOXraRWZguAX7balCQ_HVao1o3K";

  const str=v=>String(v??"").trim();
  const arr=v=>Array.isArray(v)?v.map(x=>str(x)).filter(Boolean).slice(0,30):[];
  const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};

  const supervisionRoles=[
    {value:"assistant_supervisor",label:"مساعد مشرف"},
    {value:"supervisor",label:"مشرف"},
    {value:"general_supervisor",label:"مشرف عام"}
  ];

  const supervisionState={
    initialized:false,
    rows:[]
  };

  const blankSupervisionRow=()=>({
    cellId:"",
    role:"",
    roleStarted:"",
    roleContinuing:"",
    roleLeft:"",
    joined:"",
    continuing:"",
    left:"",
    notes:""
  });

  const escapeHtml=v=>str(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  const isSupervisorPage=()=>{
    try{return new URLSearchParams(location.search).get("form")==="supervisor";}catch(_){return false;}
  };
  const fieldStatus=(type,message)=>{
    const status=document.getElementById("status");
    if(!status)return;
    status.className="status show "+type;
    status.textContent=message;
  };

  function getCellChoices(unitWrap){
    const group=Array.from(unitWrap.querySelectorAll(".unit-group")).find(el=>str(el.querySelector("h3")?.textContent)==="الخلايا");
    if(!group)return null;
    const cells=Array.from(group.querySelectorAll('input[name="current_units"]')).map(input=>({
      id:str(input.value),
      name:str(input.closest("label")?.querySelector("span")?.textContent)||str(input.value)
    })).filter(cell=>cell.id&&cell.name);
    return {group,cells};
  }

  function rowHasData(row){
    return Object.values(row||{}).some(value=>str(value)!=="");
  }

  function syncSupervisionStateFromDom(panel){
    if(!panel)return;
    const rows=Array.from(panel.querySelectorAll(".ml-supervision-card"));
    if(!rows.length)return;
    supervisionState.rows=rows.map(row=>({
      cellId:str(row.querySelector("[data-supervision-field='cell']")?.value),
      role:str(row.querySelector("[data-supervision-field='role']")?.value),
      roleStarted:str(row.querySelector("[data-supervision-field='roleStarted']")?.value),
      roleContinuing:str(row.querySelector("[data-supervision-field='roleContinuing']")?.value),
      roleLeft:str(row.querySelector("[data-supervision-field='roleLeft']")?.value),
      joined:str(row.querySelector("[data-supervision-field='joined']")?.value),
      continuing:str(row.querySelector("[data-supervision-field='continuing']")?.value),
      left:str(row.querySelector("[data-supervision-field='left']")?.value),
      notes:str(row.querySelector("[data-supervision-field='notes']")?.value)
    }));
  }

  function renderSupervisionPanel(panel,cells){
    if(!supervisionState.rows.length)supervisionState.rows=[blankSupervisionRow()];
    const selected=new Set(supervisionState.rows.map(row=>str(row.cellId)).filter(Boolean));
    const rows=supervisionState.rows.map((row,index)=>{
      const cellOptions='<option value="">اختر الخلية التي تشرف عليها</option>'+cells.map(cell=>{
        const disabled=selected.has(cell.id)&&cell.id!==str(row.cellId);
        return'<option value="'+escapeHtml(cell.id)+'"'+(cell.id===str(row.cellId)?" selected":"")+(disabled?" disabled":"")+'>'+escapeHtml(cell.name)+'</option>';
      }).join("");
      const roleOptions='<option value="">اختر دورك الإشرافي</option>'+supervisionRoles.map(item=>
        '<option value="'+item.value+'"'+(item.value===str(row.role)?" selected":"")+'>'+item.label+'</option>'
      ).join("");
      const roleEnded=str(row.roleContinuing)==="false";
      const membershipEnded=str(row.continuing)==="false";
      return'<div class="ml-supervision-card unit-card" data-supervision-index="'+index+'">'+
        '<div class="unit-card-head"><strong>إشراف على خلية رقم '+(index+1)+'</strong><span class="unit-type">إشراف</span></div>'+
        '<div class="unit-card-grid">'+
        '<div class="field full"><label>الخلية التي تشرف عليها <span class="req">*</span></label><select data-supervision-field="cell">'+cellOptions+'</select></div>'+
        '<div class="field"><label>دورك الإشرافي <span class="req">*</span></label><select data-supervision-field="role">'+roleOptions+'</select></div>'+
        '<div class="field"><label>متى توليت المنصب؟ <span class="req">*</span></label><input type="date" data-supervision-field="roleStarted" value="'+escapeHtml(row.roleStarted)+'"></div>'+
        '<div class="field"><label>هل ما زلت تشغل هذا المنصب؟ <span class="req">*</span></label><select data-supervision-field="roleContinuing"><option value="">اختر</option><option value="true"'+(str(row.roleContinuing)==="true"?" selected":"")+'>نعم، ما زلت أشغله</option><option value="false"'+(roleEnded?" selected":"")+' >لا، لم أعد أشغله</option></select></div>'+
        '<div class="field '+(roleEnded?"":"hidden")+'"><label>تاريخ انتهاء المنصب <span class="req">*</span></label><input type="date" data-supervision-field="roleLeft" value="'+escapeHtml(row.roleLeft)+'"></div>'+
        '<div class="field"><label>متى انضممت إلى هذه الخلية؟ <span class="req">*</span></label><input type="date" data-supervision-field="joined" value="'+escapeHtml(row.joined)+'"></div>'+
        '<div class="field"><label>هل ما زلت عضواً فيها؟ <span class="req">*</span></label><select data-supervision-field="continuing"><option value="">اختر</option><option value="true"'+(str(row.continuing)==="true"?" selected":"")+'>نعم، ما زلت عضواً فيها</option><option value="false"'+(membershipEnded?" selected":"")+' >لا، لم أعد عضواً فيها</option></select></div>'+
        '<div class="field '+(membershipEnded?"":"hidden")+'"><label>تاريخ مغادرة الخلية <span class="req">*</span></label><input type="date" data-supervision-field="left" value="'+escapeHtml(row.left)+'"></div>'+
        '<div class="field notes"><label>ملاحظات</label><textarea data-supervision-field="notes" placeholder="أي معلومة مهمة عن دورك الإشرافي في هذه الخلية">'+escapeHtml(row.notes)+'</textarea></div>'+
        '</div>'+
        (index>0?'<div class="actions" style="margin-top:12px;padding-top:12px"><button type="button" class="btn btn-secondary ml-supervision-remove">حذف هذا الإشراف</button></div>':"")+
        '</div>';
    }).join("");

    panel.innerHTML=
      '<div class="unit-card-head"><strong>الإشراف على الخلايا</strong><span class="unit-type">للمشرفين</span></div>'+
      '<div class="help">الخلايا لا تُسجَّل كاختيار عام فقط. لكل خلية تشرف عليها، سجّل دورك الإشرافي وتاريخ تولّي المنصب وتاريخ انضمامك للخلية، مع توثيق استمرار كل منهما.</div>'+
      '<div class="ml-supervision-list">'+rows+'</div>'+
      '<button type="button" class="btn btn-secondary ml-supervision-add">＋ إضافة خلية أشرف عليها</button>';
  }

  function syncSupervisionStorage(fieldsRoot,unitWrap,cells){
    const panel=fieldsRoot.querySelector(".ml-supervision-panel");
    if(panel)syncSupervisionStateFromDom(panel);
    const storageId="mlSupervisorCellStorage";
    let storage=document.getElementById(storageId);
    if(!storage){
      storage=document.createElement("div");
      storage.id=storageId;
      storage.className="hidden";
      storage.style.display="none";
      unitWrap.parentElement.appendChild(storage);
    }
    storage.innerHTML="";

    const rows=supervisionState.rows.filter(row=>str(row.cellId));
    const selectedCells=new Set();
    rows.forEach(row=>{
      const cellId=str(row.cellId);
      if(!cells.some(cell=>cell.id===cellId))return;
      if(selectedCells.has(cellId))return;
      selectedCells.add(cellId);

      const checkbox=document.createElement("input");
      checkbox.type="checkbox";
      checkbox.name="current_units";
      checkbox.value=cellId;
      checkbox.checked=true;
      checkbox.hidden=true;
      storage.appendChild(checkbox);

      const card=document.createElement("div");
      card.className="unit-card";
      card.dataset.unitId=cellId;
      card.innerHTML=
        '<select name="unit_role_'+escapeHtml(cellId)+'"><option value="assistant_supervisor">مساعد مشرف</option><option value="supervisor">مشرف</option><option value="general_supervisor">مشرف عام</option></select>'+
        '<input type="date" name="unit_role_started_'+escapeHtml(cellId)+'">'+
        '<select name="unit_role_continuing_'+escapeHtml(cellId)+'"><option value="true">نعم</option><option value="false">لا</option></select>'+
        '<input type="date" name="unit_role_left_'+escapeHtml(cellId)+'">'+
        '<input type="date" name="unit_joined_'+escapeHtml(cellId)+'">'+
        '<select name="unit_continuing_'+escapeHtml(cellId)+'"><option value="true">نعم</option><option value="false">لا</option></select>'+
        '<input type="date" name="unit_left_'+escapeHtml(cellId)+'">'+
        '<textarea name="unit_notes_'+escapeHtml(cellId)+'"></textarea>';
      const selects=card.querySelectorAll("select");
      const inputs=card.querySelectorAll("input[type=date]");
      const textarea=card.querySelector("textarea");
      selects[0].value=str(row.role)||"supervisor";
      inputs[0].value=str(row.roleStarted);
      selects[1].value=str(row.roleContinuing)||"";
      inputs[1].value=str(row.roleLeft);
      inputs[2].value=str(row.joined);
      selects[2].value=str(row.continuing)||"";
      inputs[3].value=str(row.left);
      if(textarea)textarea.value=str(row.notes);
      storage.appendChild(card);
    });
  }

  function supervisorCellValidation(cells){
    const validIds=new Set(cells.map(cell=>cell.id));
    const validRoles=new Set(supervisionRoles.map(item=>item.value));
    const seen=new Set();
    const rows=supervisionState.rows.filter(row=>rowHasData(row));
    const today=new Date().toISOString().slice(0,10);

    for(const row of rows){
      const cellId=str(row.cellId);
      const role=str(row.role);
      const roleStarted=str(row.roleStarted);
      const roleContinuing=str(row.roleContinuing);
      const roleLeft=str(row.roleLeft);
      const joined=str(row.joined);
      const continuing=str(row.continuing);
      const left=str(row.left);

      if(!cellId)return"يرجى تحديد الخلية التي تشرف عليها.";
      if(!validIds.has(cellId))return"الخلية المختارة في الإشراف غير صالحة.";
      if(seen.has(cellId))return"لا يمكن تكرار الخلية نفسها في أكثر من منصب إشرافي.";
      seen.add(cellId);
      if(!validRoles.has(role))return"يرجى تحديد دورك الإشرافي.";
      if(!roleStarted)return"يرجى تحديد تاريخ تولّي المنصب الإشرافي.";
      if(roleStarted>today)return"تاريخ تولّي المنصب الإشرافي لا يمكن أن يكون في المستقبل.";
      if(!joined)return"يرجى تحديد تاريخ الانضمام إلى الخلية.";
      if(joined>today)return"تاريخ الانضمام إلى الخلية لا يمكن أن يكون في المستقبل.";
      if(roleStarted<joined)return"تاريخ تولّي المنصب الإشرافي لا يمكن أن يسبق تاريخ الانضمام إلى الخلية.";
      if(!["true","false"].includes(roleContinuing))return"يرجى تحديد ما إذا كنت ما زلت تشغل المنصب الإشرافي.";
      if(roleContinuing==="false"&&!roleLeft)return"يرجى تحديد تاريخ انتهاء المنصب الإشرافي.";
      if(roleLeft&&(roleLeft<roleStarted||roleLeft>today))return"تاريخ انتهاء المنصب الإشرافي غير صالح.";
      if(!["true","false"].includes(continuing))return"يرجى تحديد ما إذا كنت ما زلت عضواً في الخلية.";
      if(continuing==="false"&&!left)return"يرجى تحديد تاريخ مغادرة الخلية.";
      if(left&&(left<joined||left>today))return"تاريخ مغادرة الخلية غير صالح.";
      if(roleContinuing==="true"&&continuing==="false")return"لا يمكن أن يستمر المنصب الإشرافي بعد انتهاء العضوية في الخلية.";
    }
    return"";
  }

  function mountSupervisorCellOversight(){
    if(!isSupervisorPage())return;
    const fieldsRoot=document.getElementById("fields");
    if(!fieldsRoot)return;
    const unitWrap=fieldsRoot.querySelector('[data-field-wrap="current_units"]');
    if(!unitWrap)return;
    const picked=getCellChoices(unitWrap);
    if(!picked||!picked.cells.length)return;

    picked.group.classList.add("ml-supervisor-cell-picker-hidden");

    let panel=fieldsRoot.querySelector(".ml-supervision-panel");
    if(!panel){
      panel=document.createElement("div");
      panel.className="ml-supervision-panel content-supervision-box";
      const unitDetails=unitWrap.querySelector("#unitDetails");
      if(unitDetails)unitDetails.insertAdjacentElement("beforebegin",panel);
      else unitWrap.insertAdjacentElement("afterend",panel);
      if(!supervisionState.initialized){
        supervisionState.initialized=true;
        supervisionState.rows=[blankSupervisionRow()];
      }
      renderSupervisionPanel(panel,picked.cells);

      panel.addEventListener("input",()=>{
        syncSupervisionStateFromDom(panel);
        syncSupervisionStorage(fieldsRoot,unitWrap,picked.cells);
      });

      panel.addEventListener("change",()=>{
        syncSupervisionStateFromDom(panel);
        syncSupervisionStorage(fieldsRoot,unitWrap,picked.cells);
        renderSupervisionPanel(panel,picked.cells);
        syncSupervisionStorage(fieldsRoot,unitWrap,picked.cells);
      });

      panel.addEventListener("click",event=>{
        const add=event.target.closest(".ml-supervision-add");
        const remove=event.target.closest(".ml-supervision-remove");
        if(add){
          syncSupervisionStateFromDom(panel);
          supervisionState.rows.push(blankSupervisionRow());
          renderSupervisionPanel(panel,picked.cells);
          syncSupervisionStorage(fieldsRoot,unitWrap,picked.cells);
        }
        if(remove){
          syncSupervisionStateFromDom(panel);
          const card=event.target.closest(".ml-supervision-card");
          const index=Number(card?.dataset.supervisionIndex||0);
          supervisionState.rows.splice(index,1);
          if(!supervisionState.rows.length)supervisionState.rows=[blankSupervisionRow()];
          renderSupervisionPanel(panel,picked.cells);
          syncSupervisionStorage(fieldsRoot,unitWrap,picked.cells);
        }
      });
    }else{
      return;
    }

    if(!document.getElementById("mlSupervisorCellStyle")){
      const style=document.createElement("style");
      style.id="mlSupervisorCellStyle";
      style.textContent=".ml-supervisor-cell-picker-hidden{display:none!important}.ml-supervision-panel{margin-top:16px}.ml-supervision-panel .unit-card-head{margin-bottom:10px}.ml-supervision-list{display:grid;gap:12px}.ml-supervision-add{margin-top:10px}";
      document.head.appendChild(style);
    }
  }

  const observer=new MutationObserver(()=>{
    try{mountSupervisorCellOversight();}catch(_){}
  });

  function initSupervisorCellOversight(){
    if(!isSupervisorPage())return;
    const start=()=>{
      const fieldsRoot=document.getElementById("fields");
      if(!fieldsRoot)return;
      observer.observe(fieldsRoot,{childList:true,subtree:true});
      mountSupervisorCellOversight();
    };
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
    else start();
  }

  document.addEventListener("submit",event=>{
    if(!isSupervisorPage())return;
    const fieldsRoot=document.getElementById("fields");
    const unitWrap=fieldsRoot?.querySelector('[data-field-wrap="current_units"]');
    const picked=unitWrap?getCellChoices(unitWrap):null;
    if(!picked)return;
    const panel=fieldsRoot.querySelector(".ml-supervision-panel");
    if(panel)syncSupervisionStateFromDom(panel);
    const error=supervisorCellValidation(picked.cells);
    if(error){
      event.preventDefault();
      event.stopImmediatePropagation();
      fieldStatus("err",error);
      window.scrollTo({top:Math.max(0,(fieldsRoot?.offsetTop||0)-90),behavior:"smooth"});
      return;
    }
    syncSupervisionStorage(fieldsRoot,unitWrap,picked.cells);
  },true);

  initSupervisorCellOversight();

  function build(data,schema,units,formKey,id){
    const supervisor=formKey==="membership_renewal_supervisor";
    const details=data.current_unit_details&&typeof data.current_unit_details==="object"&&!Array.isArray(data.current_unit_details)
      ?data.current_unit_details:{};
    const selected=Array.isArray(data.current_units)?data.current_units.map(String).filter(Boolean):[];
    const selectedUnits=selected.map(id=>units.find(u=>String(u.id)===id)).filter(Boolean);

    const requestedUnits=selectedUnits.map(u=>{
      const d=details[String(u.id)]&&typeof details[String(u.id)]==="object"?details[String(u.id)]:{};
      const contentUnit=supervisor&&(String(u.id)==="b1ea8c52-b405-4ad9-b9f6-2768a22a7827"||str(u.name_ar)==="كتابة محتوى"||str(u.name_en).toLowerCase()==="content writing");
      return {
        id:String(u.id),
        name_ar:str(u.name_ar||u.name_en),
        unit_type:str(u.unit_type),
        role:contentUnit?"content_writer":(supervisor&&String(u.unit_type)==="other"?"volunteer":str(d.role)||"volunteer"),
        senior_management_position:str(d.senior_management_position),
        role_started_on:d.role_started_on||null,
        role_continuing:Boolean(d.role_continuing),
        role_left_on:d.role_left_on||null,
        joined_on:d.joined_on||null,
        continuing:Boolean(d.continuing),
        left_on:d.left_on||null,
        notes:str(d.notes)
      };
    });

    const certificates=Array.isArray(data.certificate_history)?data.certificate_history.filter(x=>x&&typeof x==="object"):[];

    return {
      id,
      form_id:schema.id,
      form_version:Number(schema.version||0),
      status:"pending",
      membership_number:null,
      full_name:str(data.full_name),
      father_name:str(data.father_name),
      mother_name:str(data.mother_name),
      national_id:str(data.national_id),
      country:str(data.country),
      country_other:str(data.country_other),
      nationality:str(data.nationality),
      nationality_other:str(data.nationality_other),
      governorate:str(data.governorate),
      city:str(data.city),
      full_address:str(data.full_address),
      date_of_birth:data.date_of_birth||null,
      gender:str(data.gender),
      email:str(data.email).toLowerCase(),
      phone:str(data.phone),
      emergency_contact_name:str(data.emergency_contact_name),
      emergency_contact_relationship:str(data.emergency_contact_relationship),
      emergency_contact_phone:str(data.emergency_contact_phone),
      emergency_contact_alt_phone:str(data.emergency_contact_alt_phone),
      emergency_contact_notes:str(data.emergency_contact_notes),
      supervisor_start_date:data.supervisor_start_date||null,
      academic_status:str(data.academic_status),
      university:str(data.university),
      specialty:str(data.specialty),
      consultation_specialty:str(data.consultation_specialty),
      consultation_specialty_other:str(data.consultation_specialty_other),
      profession:str(data.profession),
      workplace:str(data.workplace),
      skills:str(data.skills).split(/[,،]/).map(x=>x.trim()).filter(Boolean).slice(0,30),
      self_declared_talents:arr(data.talent_areas),
      undiscovered_talents:str(data.undiscovered_talents),
      desired_contributions:arr(data.desired_contributions),
      development_interests:arr(data.development_interests),
      join_date:data.join_date||null,
      requested_unit_ids:requestedUnits.map(u=>u.id),
      requested_units:requestedUnits,
      requested_unit_roles:Object.fromEntries(requestedUnits.map(u=>[u.id,u.role])),
      requested_unit_details:Object.fromEntries(requestedUnits.map(u=>[u.id,{
        role:u.role,senior_management_position:u.senior_management_position,
        role_started_on:u.role_started_on,role_continuing:u.role_continuing,
        role_left_on:u.role_left_on,joined_on:u.joined_on,
        continuing:u.continuing,left_on:u.left_on,notes:u.notes
      }])),
      reported_total_volunteer_hours:num(data.reported_total_volunteer_hours),
      field_available_days:arr(data.field_available_days),
      volunteer_commitment_hours:num(data.volunteer_commitment_hours),
      certificate_types:[...new Set(certificates.map(x=>str(x.type).toLowerCase()).filter(Boolean))],
      certificate_other:str(data.certificate_other),
      certificate_history:certificates,
      availability:str(data.availability),
      education_track:str(data.academic_status),
      interest_areas:arr(data.interest_areas),
      continuing_as_volunteer:supervisor?true:data.continuing_as_volunteer===true,
      additional_notes:str(data.additional_notes),
      declaration_accurate:true,
      privacy_consent:true,
      form_data:{
        ...data,
        current_units:selected,
        current_unit_details:details,
        certificate_history:certificates,
        captured_at:new Date().toISOString()
      },
      form_schema:{
        form_id:schema.id,
        form_key:schema.form_key,
        version:Number(schema.version||0),
        name_ar:schema.name_ar,
        name_en:schema.name_en,
        description_ar:schema.description_ar,
        description_en:schema.description_en,
        settings:schema.settings&&typeof schema.settings==="object"?schema.settings:{},
        captured_at:new Date().toISOString(),
        fields:Array.isArray(schema.fields)?schema.fields:[]
      },
      source:"public_website"
    };
  }

  window.medlifeSubmitMembership=async function(data,schema,units,formKey){
    const id=crypto.randomUUID();
    const payload=build(data,schema,units,formKey,id);
    const response=await fetch(SUPABASE_URL+"/rest/v1/public_membership_renewal_submissions",{
      method:"POST",
      headers:{
        apikey:SUPABASE_KEY,
        "Content-Type":"application/json",
        Prefer:"return=minimal"
      },
      body:JSON.stringify(payload)
    });
    const raw=await response.text();
    let body={};
    try{body=raw?JSON.parse(raw):{}}catch(_){}
    if(!response.ok){
      const detail=str(body.message||body.error||body.details);
      throw new Error(detail||("تعذر تسجيل العضوية. رمز الاستجابة: "+response.status));
    }

    const receipt=await fetch(SUPABASE_URL+"/rest/v1/rpc/get_membership_renewal_receipt",{
      method:"POST",
      headers:{
        apikey:SUPABASE_KEY,
        "Content-Type":"application/json",
        Accept:"application/json"
      },
      body:JSON.stringify({
        p_submission_id:id,
        p_email:str(data.email).toLowerCase()
      })
    });
    const receiptBody=await receipt.json().catch(()=>({}));
    return {
      submission_id:id,
      membership_number:receipt.ok&&receiptBody?.success?receiptBody.membership_number:null
    };
  };
})();