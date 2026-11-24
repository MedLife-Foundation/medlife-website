import assert from 'node:assert/strict';
import { test } from 'node:test';

const FORM_URL='https://medlifesy.org/api/management?resource=join_form&form_key=new_volunteer_application';
const TRACKS=[
  'medical_content','medical_content_formatting','design','video_editing',
  'visual_media','field_work','university_media','voice_over','it',
  'telegram','instagram','podcast_live','medical_consultations'
];

test('live 13-track form schema has valid options, dependencies and required fields',async()=>{
  const response=await fetch(FORM_URL,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(25000)});
  assert.equal(response.status,200,'published form API must be reachable');
  const payload=await response.json(),form=payload.data?.[0];
  assert.equal(form?.form_key,'new_volunteer_application');
  assert.equal(form?.form_kind,'new_member');
  const fields=form.fields||[];
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
});
