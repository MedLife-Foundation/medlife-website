// Membership direct submit: unified unit roles / inline supervisor details — routed through the existing management API
(function(){
  "use strict";
  "use strict";
  const SUPABASE_URL="https://ftvjakwogxdlxxbpfydf.supabase.co";
  const SUPABASE_KEY="sb_publishable_beiimOXraRWZguAX7balCQ_HVao1o3K";

  const str=v=>String(v??"").trim();
  const arr=v=>Array.isArray(v)?v.map(x=>str(x)).filter(Boolean).slice(0,30):[];
  const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};

  function build(data,schema,units,formKey,id){
    const supervisor=formKey==="membership_renewal_supervisor";
    const details=data.current_unit_details&&typeof data.current_unit_details==="object"&&!Array.isArray(data.current_unit_details)
      ?data.current_unit_details:{};
    const selected=Array.isArray(data.current_units)?data.current_units.map(String).filter(Boolean):[];
    const selectedUnits=selected.map(id=>units.find(u=>String(u.id)===id)).filter(Boolean);

    const requestedUnits=selectedUnits.map(u=>{
      const d=details[String(u.id)]&&typeof details[String(u.id)]==="object"?details[String(u.id)]:{};
      return {
        id:String(u.id),
        name_ar:str(u.name_ar||u.name_en),
        unit_type:str(u.unit_type),
        role:supervisor&&String(u.unit_type)==="other"?"volunteer":str(d.role)||"volunteer",
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
      content_assignments:[],
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
    const response=await fetch("/api/management",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        Accept:"application/json"
      },
      body:JSON.stringify({
        action:"membership_renewal",
        form_id:schema.id,
        form_version:Number(schema.version||0),
        form_data:data
      })
    });
    const raw=await response.text();
    let body={};
    try{body=raw?JSON.parse(raw):{}}catch(_){}
    if(!response.ok||!body.success){
      const detail=str(body.error||body.message);
      throw new Error(detail||("تعذر تسجيل العضوية. رمز الاستجابة: "+response.status));
    }
    return {
      submission_id:body.submission_id,
      membership_number:body.membership_number||null
    };
  };
})();