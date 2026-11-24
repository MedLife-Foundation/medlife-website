import assert from 'node:assert/strict';
import { test } from 'node:test';

import { readFileSync } from 'node:fs';
const source=readFileSync('functions/api/management.js','utf8');
const key=source.match(/const SUPABASE_PUBLISHABLE_KEY = "([^"]+)"/)?.[1];
assert.ok(key,'website public key is missing');
const origin='https://ftvjakwogxdlxxbpfydf.supabase.co';
const lookup=await import('data:text/javascript;base64,'+
  Buffer.from(source+'\nexport { fieldsForNewVolunteerIntake, validateAndSanitizeFormData };').toString('base64'));
async function getRows(path){
  const response=await fetch(origin+'/rest/v1/'+path,{
    headers:{apikey:key,Authorization:'Bearer '+key,Accept:'application/json'},
    signal:AbortSignal.timeout(25000)
  });
  assert.equal(response.status,200,'Supabase read-only public form metadata must be reachable');
  return await response.json();
}
const TRACKS=[
  'medical_content','medical_content_formatting','design','video_editing',
  'visual_media','field_work','university_media','voice_over','it',
  'telegram','instagram','podcast_live','medical_consultations'
];

test('live 13-track form schema has valid options, dependencies and required fields',async()=>{
  const forms=await getRows('admin_form_definitions?select=id,form_key,form_kind,status,is_public&form_key=eq.new_volunteer_application&status=eq.published&is_public=eq.true&limit=1');
  const form=forms?.[0];
  assert.equal(form?.form_key,'new_volunteer_application');
  assert.equal(form?.form_kind,'new_member');
  const base=await getRows('admin_form_fields?select=field_key,label_ar,label_en,help_ar,placeholder_ar,field_type,required,options,validation,visibility,target_unit_ids,target_unit_types,sort_order&form_id=eq.'+
    encodeURIComponent(form.id)+'&is_active=eq.true&order=sort_order.asc&limit=200');
  const fields=lookup.fieldsForNewVolunteerIntake(base,'new_volunteer_application');
  assert.ok(fields.length>=45,'comprehensive questionnaire is missing');
  const keys=fields.map(f=>f.field_key);
  assert.equal(keys.length,new Set(keys).size,'duplicate field keys');
  const map=new Map(fields.map(f=>[f.field_key,f]));
  const requiredFields=[
    'full_name','national_id','email','phone','phone_country_code',
    'whatsapp_confirmed','country','other_country','academic_status',
    'university','university_other','study_field','study_field_other',
    'medical_profession','resident_specialty','residency_year',
    'residency_start_year','residency_hospital','motivation',
    'volunteer_commitment','primary_volunteer_field',
    'volunteer_interest_preferences','medical_consultation_specialties',
    'medical_consultation_demo_seen','medical_consultation_ethics'
  ];
  for(const k of requiredFields)assert.ok(map.has(k),'missing field '+k);
  assert.deepEqual(map.get('primary_volunteer_field').options.map(o=>o.value),TRACKS);
  assert.ok(map.get('medical_consultation_specialties').options.length>=50);
  assert.ok(map.get('other_country').options.length>=150);
  assert.ok(map.get('university').options.length>=15);
  assert.ok(map.get('phone_country_code').options.length>=10);
  for(const f of fields){
    assert.ok(f.label_ar?.trim(),'missing Arabic label '+f.field_key);
    if(f.required&&['select','multi_select'].includes(f.field_type)){
      assert.ok(Array.isArray(f.options)&&f.options.length>0,'empty required options '+f.field_key);
    }
    if(Array.isArray(f.options)){
      const opts=f.options.map(o=>o.value).filter(Boolean);
      assert.equal(opts.length,new Set(opts).size,'duplicate options '+f.field_key);
    }
    if(f.visibility?.mode==='when')assert.ok(map.has(f.visibility.field_key),'missing conditional parent '+f.field_key);
  }
  for(const f of fields){
    const seen=new Set([f.field_key]);let current=f;
    for(let i=0;i<=fields.length;i++){
      if(current.visibility?.mode!=='when')break;
      const parent=current.visibility.field_key;
      assert.ok(!seen.has(parent),'circular dependency '+f.field_key);
      seen.add(parent);current=map.get(parent);
    }
  }
  const conditional=fields.filter(f=>f.visibility?.mode==='when');
  assert.ok(conditional.length>=70,'domain-specific questions disappeared');
  for(const track of TRACKS){
    const relevant=conditional.filter(f=>{
      let v=f.visibility;const seen=new Set();
      while(v?.mode==='when'&&!seen.has(v.field_key)){
        if(v.field_key==='volunteer_interest_preferences'){
          return Array.isArray(v.value)?v.value.includes(track):
            String(v.value).split(',').map(x=>x.trim()).includes(track);
        }
        seen.add(v.field_key);v=map.get(v.field_key)?.visibility;
      }
      return false;
    });
    assert.ok(relevant.length>0,'no conditional questions for '+track);
  }
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async (resource,opts)=>{
    const url=String(resource);
    if(url.includes('/rest/v1/admin_form_definitions?'))return Response.json([{
      ...form,name_ar:'انضم إلى ميدلايف',name_en:'Join MedLife',
      description_ar:'النموذج الجديد',version:1,settings:{},updated_at:new Date().toISOString()
    }]);
    if(url.includes('/rest/v1/admin_form_fields?'))return Response.json(base);
    return originalFetch(resource,opts);
  };
  try{
    for(const track of TRACKS){
      const data={};
      for(const f of fields){
        const opts=Array.isArray(f.options)?f.options:[];
        const preferred=opts.find(o=>o.value&&!['other','none','no'].includes(String(o.value)))
          ||opts.find(o=>o.value);
        if(f.field_type==='select')data[f.field_key]=preferred?.value||'yes';
        else if(f.field_type==='multi_select')data[f.field_key]=preferred?[preferred.value]:[];
        else if(f.field_type==='number')data[f.field_key]=Math.max(1,Number(f.validation?.min||1));
        else if(f.field_type==='date')data[f.field_key]='1998-03-10';
        else if(f.field_type==='url')data[f.field_key]='https://example.org/profile';
        else if(f.field_type==='email')data[f.field_key]='qa@example.invalid';
        else if(f.field_type==='boolean')data[f.field_key]=true;
        else data[f.field_key]='فحص تقني لمجالات التطوع';
      }
      Object.assign(data,{
        full_name:'شخصية اختبارية غير حقيقية',father_name:'فحص',mother_name:'فحص',
        national_id:'00000000000000000000987654',email:'qa@example.invalid',
        phone_country_code:'+963',phone:'+963933333333',
        whatsapp_confirmed:'yes',country:'سوريا',academic_status:'resident_doctor',
        medical_profession:'human_medicine',resident_specialty:'general_medicine',
        doctor_specialty:'general_medicine',specialty:'general_medicine',
        residency_start_year:2023,residency_year:'3',
        weekly_availability:map.get('weekly_availability').field_type==='select'
          ?map.get('weekly_availability').options[0].value:8,
        primary_volunteer_field:track,volunteer_interest_preferences:[track],
        volunteer_commitment:'1',medical_consultation_demo_seen:'yes',
        medical_consultation_ethics:['ethics','privacy','evidence','scope','exam','followup','verification'],
        medical_consultation_specialties:['general_medicine']
      });
      let validated;
      try{
        validated=await lookup.validateAndSanitizeFormData({
          form_id:form.id,form_data:data
        },'new_member');
      }catch(error){
        assert.fail('Invalid server-side questionnaire for '+track+': '+error.message);
      }
      assert.equal(validated.form_data.primary_volunteer_field,track);
      assert.deepEqual(validated.form_data.volunteer_interest_preferences,[track]);
      assert.ok(!validated.form_data.password,'never store a password in the application');

      // Validate fail-closed behavior without ever submitting to the database.
      if(track==='medical_content'){
        await assert.rejects(
          lookup.validateAndSanitizeFormData({form_id:form.id,
            form_data:{...data,volunteer_interest_preferences:[track,track]}},'new_member'),
          /الرغبات|مجال|مكررة|صحيحة/
        );
        await assert.rejects(
          lookup.validateAndSanitizeFormData({form_id:form.id,
            form_data:{...data,phone:'0933333333'}},'new_member'),
          /واتساب|هاتف|دولي/
        );
        await assert.rejects(
          lookup.validateAndSanitizeFormData({form_id:form.id,
            form_data:{...data,volunteer_commitment:'2'}},'new_member'),
          /الالتزام|التطوعي/
        );
      }
      if(track==='medical_consultations'){
        await assert.rejects(
          lookup.validateAndSanitizeFormData({form_id:form.id,
            form_data:{...data,academic_status:'university'}},'new_member'),
          /الاستشارات|مؤهل|الأطباء/
        );
        await assert.rejects(
          lookup.validateAndSanitizeFormData({form_id:form.id,
            form_data:{...data,medical_consultation_specialties:[
              'general_medicine','family_medicine','cardiology'
            ]}},'new_member'),
          /اختصاص|اختيار/
        );
      }

    }
  }finally{globalThis.fetch=originalFetch;}

});
