/* MedLife comprehensive NEW-volunteer intake. No membership renewal data is accessed. */
(() => {
  "use strict";
  const FORM_KEY = "new_volunteer_application";
  const PREVIEW_ONLY = location.hostname.toLowerCase().endsWith(".pages.dev");
  const STEPS = [
    { name:"البيانات الشخصية", desc:"نحتاج معلوماتك الأساسية كما ترغب بتسجيلها رسمياً." },
    { name:"التواصل والإقامة", desc:"سنتواصل معك على المعلومات التي تقدمها هنا." },
    { name:"الدراسة والعمل", desc:"أخبرنا عن تحصيلك العلمي وخبراتك المهنية." },
    { name:"مجالات الانضمام", desc:"اختر المجال الذي ترغب بالانضمام إليه، ويمكنك إضافة رغبتين اختياريتين." },
    { name:"الأسئلة التخصصية", desc:"تظهر أسئلة خاصة بكل مجال ترغب بالانضمام إليه." },
    { name:"الدافع والتفرغ", desc:"وضح سبب رغبتك بالعمل التطوعي والوقت الذي تستطيع الالتزام به." },
    { name:"مراجعة وإرسال", desc:"تحقق من البيانات واقرأ الإقرار قبل إرسال طلبك." }
  ];
  const GROUPS = [
    ["full_name","father_name","mother_name","date_of_birth","gender","national_id"],
    ["email","phone_country_code","phone_dial_other","phone","whatsapp_confirmed","country","other_country","governorate","foreign_region","city","address","social_profile_url"],
    ["academic_status","academic_status_other","school_name","institute_name","university","university_other","faculty","study_field","study_field_other","study_year","medical_profession","resident_specialty","resident_specialty_other","residency_year","residency_start_year","residency_program","residency_program_other","residency_hospital","doctor_specialty","doctor_specialty_other","specialty","specialty_other","profession","workplace"],
    ["primary_volunteer_field","volunteer_interest_preferences","practical_skills","practical_skills_other","tools_used","tools_used_other","portfolio_url"],
    [],
    ["volunteer_history","previous_volunteer_experience","collaboration_example","preferred_work_mode","training_goals","motivation","weekly_availability","referral_channel","what_stands_out","expected_contribution","volunteer_commitment"]
  ];
  const known = new Set(GROUPS.flat());
  const $ = id => document.getElementById(id);
  const state = { form:null, fields:[], settings:null, categories:[], preferences:["","",""], values:{}, step:0, consent:false, sending:false };
  const MEDICAL_ELIGIBLE_ROLES = new Set(["doctor","resident_doctor","specialist","pharmacist"]);
  const PHARMACY_SPECIALTIES = new Set(["pharmacy","clinical_pharmacy","pharmacology","pharm_1","pharm_2","pharm_3","pharm_4","pharm_5"]);
  const STEP_TOTAL = STEPS.length;
  const clinicianRole = () => text(valueOf("academic_status"));
  const medicalDiscipline = () => text(valueOf("medical_profession"));
  function consultationsEligible() {
    const role=clinicianRole(), discipline=medicalDiscipline();
    return MEDICAL_ELIGIBLE_ROLES.has(role) &&
      ["human_medicine","dentistry","pharmacy"].includes(discipline) &&
      (role!=="pharmacist" || discipline==="pharmacy") &&
      (!["doctor","specialist"].includes(role)||discipline!=="pharmacy");
  }
  function choiceOptions(field) {
    const all=opts(field);
    const key=field.field_key,role=clinicianRole(),discipline=medicalDiscipline();
    if(key==="medical_profession")return all.filter(option=>{
      if(role==="pharmacist")return option.value==="pharmacy";
      if(["doctor","specialist"].includes(role))return option.value!=="pharmacy";
      return true;
    });
    if(["medical_consultation_specialties","resident_specialty","doctor_specialty","specialty"].includes(key)){
      return all.filter(option=>{
        const code=String(option.value);
        if(code==="other")return true;
        if(discipline==="dentistry")return code.startsWith("dent_");
        if(discipline==="pharmacy")return PHARMACY_SPECIALTIES.has(code);
        return !code.startsWith("dent_")&&!PHARMACY_SPECIALTIES.has(code);
      });
    }
    return all;
  }
  function setVisible(id, yes) { $(id).classList.toggle("hidden", !yes); }
  function showOnly(which) { for (const id of ["loading","closed","failure","success","form-ui"]) setVisible(id, id === which); }
  function setAlert(message) {
    $("form-alert").textContent = message || "";
    setVisible("form-alert", Boolean(message));
    if (!message) setVisible("duplicate-help",false);
  }
  function showContactHelp(result) {
    const err = result?.code;
    if (err !== "duplicate_national_id" && err !== "duplicate_application") return;
    // Static trusted links live in the HTML template. Never interpolate server input into markup.
    setVisible("duplicate-help",true);
  }
  function text(value) { return String(value ?? "").trim(); }
  function opts(field) { return Array.isArray(field.options) ? field.options : []; }
  function labelOf(field) { return text(field.label_ar || field.label_en || field.field_key); }
  function valueOf(key) { return state.values[key]; }
  function visible(field, visited = new Set()) {
    if(visited.has(field.field_key))return false;
    const nextVisited=new Set([...visited,field.field_key]);
    const v = field.visibility || {};
    if (Array.isArray(field.target_unit_ids) && field.target_unit_ids.length) return false;
    if (Array.isArray(field.target_unit_types) && field.target_unit_types.length) return false;
    if (v.mode !== "when") return true;
    const parent=state.fields.find(f=>f.field_key===v.field_key);
    if(parent&&!visible(parent,nextVisited))return false;
    const actual = valueOf(v.field_key);
    const actualList = Array.isArray(actual) ? actual.map(String) : [text(actual)];
    const wanted = Array.isArray(v.value) ? v.value.map(String) : text(v.value).split(",").map(s=>s.trim());
    if (v.operator === "intersects")
      return Array.isArray(v.value) && v.value.some(value=>actualList.includes(text(value)));
    if (v.operator === "not_equals") return !actualList.includes(text(v.value));
    if (v.operator === "in") return actualList.some(a => wanted.includes(a));
    if (v.operator === "contains") return Array.isArray(actual) ? actualList.includes(text(v.value)) : actualList.some(a => a.includes(text(v.value)));
    return actualList.includes(text(v.value));
  }
  function fieldsForStep(step) {
    if (step === 6) return [];
    const group = GROUPS[step];
    const found = state.fields.filter(field => {
      if (step === 4) return !known.has(field.field_key);
      return group.includes(field.field_key);
    });
    found.sort((a,b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
    return found.filter(visible);
  }
  function create(tag, cls, content) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (content !== undefined) el.textContent = text(content);
    return el;
  }
  function setValue(key, value, refresh) {
    const previous=state.values[key];
    state.values[key] = value;
    if(key==="academic_status" && previous!==value) {
      for(const k of ["university","university_other","study_field","study_field_other",
        "medical_profession","resident_specialty","resident_specialty_other","residency_year",
        "residency_start_year","residency_program","residency_program_other","residency_hospital",
        "doctor_specialty","doctor_specialty_other","specialty","specialty_other",
        "medical_consultation_specialties"]) delete state.values[k];
      if(value==="pharmacist")state.values.medical_profession="pharmacy";
      if(!consultationsEligible() && state.preferences.includes("medical_consultations")) {
        state.preferences=state.preferences.filter(item=>item && item!=="medical_consultations");
        while(state.preferences.length<3)state.preferences.push("");
        state.values.primary_volunteer_field=state.preferences[0]||"";
        state.values.volunteer_interest_preferences=state.preferences.filter(Boolean);
      }
    }
    if(key==="medical_profession" && previous!==value) {
      for(const k of ["resident_specialty","resident_specialty_other","doctor_specialty",
        "doctor_specialty_other","specialty","specialty_other",
        "medical_consultation_specialties"])delete state.values[k];
      if(!consultationsEligible()&&state.preferences.includes("medical_consultations")){
        state.preferences=state.preferences.filter(item=>item && item!=="medical_consultations");
        while(state.preferences.length<3)state.preferences.push("");
        state.values.primary_volunteer_field=state.preferences[0]||"";
        state.values.volunteer_interest_preferences=state.preferences.filter(Boolean);
      }
    }
    if(key==="university" && previous!==value)delete state.values.university_other;
    if(key==="study_field" && previous!==value)delete state.values.study_field_other;
    if(["resident_specialty","doctor_specialty","specialty","residency_program"].includes(key)&&previous!==value)
      delete state.values[key+"_other"];
    if(key==="country" && previous!==value) {
      delete state.values.other_country;
      delete state.values.foreign_region;
      delete state.values.governorate;
    }
    if(key==="phone_country_code"&&previous!==value) {
      delete state.values.phone_dial_other;
      const oldCode=previous!=="other"?text(previous):"";
      const newCode=value!=="other"?text(value):"";
      const current=text(state.values.phone);
      if(newCode && (!current||current===oldCode))state.values.phone=newCode;
      else if(newCode&&oldCode&&current.startsWith(oldCode))state.values.phone=newCode+current.slice(oldCode.length);
    }
    setAlert("");
    if (refresh) renderFields();
  }

  function controlFor(field) {
    const key = field.field_key;
    const type = field.field_type;
    const required = field.required === true;
    const wrap = create("div", "field" + (["textarea","multi_select"].includes(type) ? " wide" : ""));
    const lab = create("label", "", labelOf(field));
    lab.htmlFor = "jf-" + key;
    if (required) {
      const star = create("span","required","*");
      star.setAttribute("aria-label","إلزامي");
      lab.append(star);
    }
    wrap.append(lab);
    let el;
    if (type === "multi_select") {
      el = create("div","choices-grid");
      el.id = "jf-" + key;
      const chosen = new Set(Array.isArray(valueOf(key)) ? valueOf(key).map(String) : []);
      for (const o of choiceOptions(field)) {
        const v = text(o.value);
        const row = create("label","choice-option");
        const cb = create("input");
        cb.type = "checkbox";
        cb.checked = chosen.has(v);
        cb.value = v;
        cb.addEventListener("change", () => {
          if (cb.checked && key==="medical_consultation_specialties" && chosen.size>=2) {
            cb.checked=false;
            setAlert("يمكنك اختيار اختصاصين فقط في الاستشارات الطبية والصيدلانية.");
            return;
          }
          if (cb.checked) {
            if (["practical_skills","tools_used","it_tools"].includes(key)) {
              if(v==="none")chosen.clear();else chosen.delete("none");
            }
            chosen.add(v);
          } else chosen.delete(v);
          const conditional=state.fields.some(f=>f.visibility?.field_key===key);
          setValue(key, Array.from(chosen), conditional);
          if(!conditional)for(const input of el.querySelectorAll("input[type=checkbox]"))input.checked=chosen.has(input.value);
          if (key==="medical_consultation_specialties") {
            const count=wrap.querySelector(".selected-specialty-count");
            if(count)count.textContent="تم اختيار "+chosen.size+" من أصل اختصاصين كحد أقصى";
          }
        });
        row.append(cb, create("span","",o.label_ar || o.label_en || v));
        el.append(row);
      }
      if (key==="medical_consultation_specialties") {
        el.classList.add("specialty-choices");
        const search=create("input","specialty-search");
        search.type="search";search.placeholder="ابحث عن اختصاص طبي أو صيدلاني...";
        search.setAttribute("aria-label","بحث في الاختصاصات");
        search.addEventListener("input",()=>{
          const searchText=search.value.trim().toLocaleLowerCase("ar");
          [...el.querySelectorAll(".choice-option")].forEach(item=>{
            item.classList.toggle("hidden",!item.textContent.toLocaleLowerCase("ar").includes(searchText));
          });
        });
        const count=create("p","selected-specialty-count","تم اختيار "+chosen.size+" من أصل اختصاصين كحد أقصى");
        wrap.append(search,count);
      }
      if (!choiceOptions(field).length) el.append(create("span","help","لم تتوفر خيارات لهذا السؤال."));
    } else if (type === "select") {
      el = create("select");
      const placeholder = create("option","", "اختر الإجابة");
      placeholder.value = "";
      el.append(placeholder);
      for (const o of choiceOptions(field)) {
        const op = create("option","",o.label_ar || o.label_en || o.value);
        op.value = text(o.value);
        el.append(op);
      }
      const chosen=text(valueOf(key));
      el.value=chosen;
      if(chosen && ![...el.options].some(option=>option.value===chosen))el.value="";
      el.addEventListener("change", () => setValue(key,el.value,true));
      // Avoid an unmanageable dropdown when choosing universities or Syrian board specialties.
      if (["university","resident_specialty","doctor_specialty","specialty","other_country"].includes(key)) {
        const searchable=create("input","select-search");
        searchable.type="search";
        searchable.placeholder=key==="university"?"ابحث عن اسم الجامعة..."
          :key==="other_country"?"ابحث عن بلد الإقامة...":"ابحث عن الاختصاص...";
        searchable.setAttribute("aria-label","تصفية خيارات "+labelOf(field));
        searchable.addEventListener("input",()=>{
          const term=searchable.value.trim().toLocaleLowerCase("ar");
          const selected=el.value;
          el.replaceChildren();
          const initial=create("option","","اختر الإجابة");initial.value="";el.append(initial);
          for(const opt of choiceOptions(field)){
            if(term && !(String(opt.label_ar||opt.value).toLocaleLowerCase("ar").includes(term))
                && String(opt.value)!==selected)continue;
            const option=create("option","",opt.label_ar||opt.label_en||opt.value);
            option.value=String(opt.value);el.append(option);
          }
          el.value=selected;
          if(!selected)el.selectedIndex=0;
        });
        wrap.append(searchable);
      }
    } else {
      el = create(type === "textarea" ? "textarea" : "input");
      if (type !== "textarea") {
        el.type = {email:"email",phone:"tel",url:"url",number:"number",date:"date"}[type] || "text";
        if(key==="phone"){
          el.dir="ltr";el.inputMode="tel";
          el.placeholder="+9639XXXXXXXX";
        }
        if(key==="phone_dial_other"){el.dir="ltr";el.placeholder="+358";el.inputMode="tel";}
        if (type === "number") {
          if (field.validation && field.validation.min !== undefined) el.min = field.validation.min;
          if (field.validation && field.validation.max !== undefined) el.max = field.validation.max;
          if (field.validation && field.validation.step !== undefined) el.step = field.validation.step;
          if (key === "weekly_availability") { el.min = "1"; el.max = "80"; }
        }
      } else el.rows = 3;
      el.value = text(valueOf(key));
      el.placeholder = text(field.placeholder_ar);
      el.maxLength = 5000;
      el.addEventListener("input", () => setValue(key,el.value,false));
    }
    if (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA") {
      el.id = "jf-" + key;
      el.autocomplete = {full_name:"name",email:"email",phone:"tel",city:"address-level2",address:"street-address",country:"country-name"}[key] || "off";
    }
    wrap.append(el);
    if (field.help_ar) wrap.append(create("p","help",field.help_ar));
    if (key === "national_id") {
      wrap.append(create("p","help","يُستخدم الرقم الوطني لمنع تكرار طلبات الانضمام وربطه بالسجلات السابقة بشكل آمن. لا يمكن البحث عن العضوية بواسطة الرقم الوطني وحده."));
    }
    return wrap;
  }
  function renderPreferences() {
    const area = $("field-area");
    area.querySelector("#preference-area")?.remove();
    const section = create("div","preference-area wide");
    section.id = "preference-area";
    section.append(create("h3","preference-title","المجال الذي ترغب بالانضمام إليه"));
    section.append(create("p","help","اختر المجال الذي ترغب بالتقدم إليه أولاً، ويمكنك إضافة مجالين آخرين حسب الأولوية. هذه اختيارات أولية ولا تعني تعييناً في خلية أو قسم؛ يتم التوزيع بعد الفرز والمقابلة والتقييم."));
    const eligibilityTip=create("p","consultation-note",
      consultationsEligible()
        ? "الاستشارات الطبية متاحة لك حسب الصفة المهنية المحددة. اختر المجال ثم حدد اختصاصاً أو اختصاصين في الخطوة التالية."
        : "قسم الاستشارات الطبية موجود ضمن المجالات الـ13، لكنه متاح فقط للطبيب والطبيب المقيم والطبيب الاختصاصي والصيدلي. لاختياره، يرجى تحديد صفتك المهنية الصحيحة في خطوة «الدراسة والعمل».");
    section.append(eligibilityTip);
    const grid = create("div","preference-grid");
    const positions = ["المجال الذي ترغب بالانضمام إليه — إلزامي","مجال إضافي ترغب بالانضمام إليه — اختياري","مجال ثالث ترغب بالانضمام إليه — اختياري"];
    for (let i=0; i<3; i++) {
      const wrap = create("div","field");
      const label = create("label","",positions[i]);
      label.htmlFor="jf-preference-"+i;
      const select=create("select");
      select.id="jf-preference-"+i;
      const empty=create("option","",i===0?"اختر مجال التطوع":"لا أرغب بمجال إضافي");
      empty.value="";select.append(empty);
      for (const cat of state.categories) {
        const restricted = cat.value==="medical_consultations" && !consultationsEligible();
        const option=create("option","",cat.label_ar + (restricted?" (للأطباء والمقيمين والصيادلة فقط)":""));
        option.value=cat.value;
        option.disabled=restricted || state.preferences.some((value,index)=>index!==i && value===cat.value);
        select.append(option);
      }
      select.value=state.preferences[i] || "";
      select.addEventListener("change",()=>{
        const value=select.value;
        if (value && state.preferences.some((item,index)=>index!==i && item===value)) {
          setAlert("لا يمكن اختيار مجال التطوع نفسه أكثر من مرة.");
          select.value=state.preferences[i] || "";
          return;
        }
        state.preferences[i]=value;
        if (i===0 && !value) {state.preferences[1]="";state.preferences[2]="";}
        if (i===1 && !value) state.preferences[2]="";
        state.values.primary_volunteer_field=state.preferences[0];
        state.values.volunteer_interest_preferences=state.preferences.filter(Boolean);
        // Changing the first preference updates the specialty-specific questions in step 5.
        renderPreferences();setAlert("");
      });
      wrap.append(label,select);grid.append(wrap);
    }
    section.append(grid);area.append(section);
  }
  function showValue(field) {
    const v = state.values[field.field_key];
    if (v === undefined || v === null || v === "") return "—";
    const labels = new Map(opts(field).map(option=>[text(option.value),text(option.label_ar || option.label_en || option.value)]));
    if (Array.isArray(v)) return v.map(x => labels.get(text(x)) || x).join("، ");
    if (field.field_key === "national_id") {
      const s = text(v);
      return s.length > 4 ? "••••" + s.slice(-4) : "••••";
    }
    return labels.get(text(v)) || text(v);
  }
  function review() {
    const area = $("field-area");
    area.append(create("p","review-intro","راجع إجاباتك قبل الإرسال. لا يعني استلام الطلب قبول الانضمام أو تفعيل حساب على منصة ميدلايف."));
    for (const step of [0,1,2,3,4,5]) {
      const current = fieldsForStep(step);
      if (!current.length) continue;
      const heading = create("h3","wide",STEPS[step].name);
      heading.style.cssText="font-size:14px;color:#162a48;margin:12px 0 0";
      area.append(heading);
      for (const f of current) {
        if (["primary_volunteer_field","volunteer_interest_preferences"].includes(f.field_key)) continue;
        const item = create("div","review-item");
        item.append(create("strong","",labelOf(f)),create("span","",showValue(f)));
        area.append(item);
      }
    }
    if (state.categories.length) {
      const prefs = create("div","review-item wide");
      prefs.append(create("strong","","مجالات التطوع التي اخترتها حسب الأولوية"));
      const names = state.preferences.filter(Boolean).map((value,i) =>
        (i+1)+". "+(state.categories.find(category=>category.value===value)?.label_ar || "—"));
      prefs.append(create("span","", names.join(" | ") || "لم يتم اختيار مجال"));
      area.append(prefs);
    }
    if (PREVIEW_ONLY) {
      area.append(create("p","review-intro","هذه نسخة معاينة للاطلاع على الأسئلة والتصميم. الإرسال معطل هنا لحماية قاعدة بيانات المتطوعين؛ يُفعّل فقط بعد نشر الرابط الرسمي."));
    }
    const consent = create("label","consent-box");
    const box = create("input");
    box.type = "checkbox";
    box.id = "privacy-consent";
    box.checked = state.consent;
    box.addEventListener("change",()=>{state.consent = box.checked;setAlert("");});
    consent.append(box,create("span","","أقرّ بصحة البيانات المقدمة، وأوافق على معالجتها لأغراض دراسة طلب الانضمام وإجراء المقابلات والتواصل، وفق الصلاحيات الإدارية المعتمدة. أفهم أن تقديم الطلب لا يعني قبول العضوية."));
    area.append(consent);
  }
  function fieldBelongsToTrack(field,track,visited=new Set()){
    if(visited.has(field.field_key))return false;
    const v=field.visibility||{};
    if(v.field_key==="volunteer_interest_preferences" && Array.isArray(v.value))return v.value.includes(track);
    const parent=state.fields.find(f=>f.field_key===v.field_key);
    return Boolean(parent&&fieldBelongsToTrack(parent,track,new Set([...visited,field.field_key])));
  }
  function renderFields() {
    const area = $("field-area");
    area.replaceChildren();
    if (state.step === 6) return review();
    const fields = fieldsForStep(state.step);
    if (!fields.length) {
      area.append(create("div","no-fields",state.step === 4 ? "لا توجد أسئلة إضافية لهذا التخصص حالياً. يمكنك المتابعة." : "لا توجد أسئلة لهذه المرحلة."));
      return;
    }
    if (state.step === 4) {
      area.append(create("p","section-tip","الأسئلة التالية مخصصة لكل مجال من المجالات التي اخترتها حسب ترتيب الأولوية. ستظهر أسئلة كل مجال بشكل مستقل، ويمكن تعديل رغباتك بالعودة للخطوة السابقة."));
      const rendered = new Set();
      for (const track of state.preferences.filter(Boolean)) {
        const matched = fields.filter(field => !rendered.has(field.field_key) &&
          fieldBelongsToTrack(field,track));
        if (!matched.length) continue;
        const heading = create("h3","specialty-heading",
          state.categories.find(category=>category.value===track)?.label_ar || "أسئلة التخصص");
        area.append(heading);
        if(track==="medical_consultations"){
          const intro=create("div","section-tip","اطلع على النسخة التجريبية للتعرف على آلية الاستشارات. لا تستخدم بيانات حقيقية في التجربة.");
          const link=create("a","","استكشاف منصة الاستشارات التجريبية ↗");
          link.href="https://medlife-care-lab.broad-frog-3978.workers.dev";
          link.target="_blank";link.rel="noopener noreferrer";
          intro.append(create("br"),link);area.append(intro);
        }
        for (const field of matched) {
          rendered.add(field.field_key);
          area.append(controlFor(field));
        }
      }
      for (const field of fields) if (!rendered.has(field.field_key)) area.append(controlFor(field));
      return;
    }
    if (state.step === 0) area.append(create("p","section-tip","تُستخدم بيانات الهوية للتحقق من عدم تكرار طلبات الانضمام. تُحفظ بسرية ولا تُنشر ضمن الملف العام."));
    if (state.step === 1) area.append(create("p","section-tip","رجاءً أدخل رقم هاتف دولياً يعمل عليه واتساب، لأننا سنعتمد عليه في التواصل بشأن المقابلة والقبول. مثال سوريا: +9639XXXXXXXX، وليس 09XXXXXXXX."));
    if (state.step === 2) {
      const status=clinicianRole();
      const tip=status==="university"
        ?"نحتاج اسم جامعتك واختصاصك الحقيقي (طب بشري، طب أسنان، صيدلة، تمريض أو غير ذلك)، لأن الأسئلة التالية تعتمد على دراستك."
        :status==="resident_doctor"
          ?"بيانات الإقامة تشمل المجال الطبي، الاختصاص، اسم المشفى، سنة المباشرة الفعلية وسنة الإقامة الحالية."
          :"اختر وضعك الدراسي أو المهني بدقة؛ ستظهر فقط الأسئلة التي تخصك.";
      area.append(create("p","section-tip",tip));
    }
    for (const field of fields) {
      if (state.step===3 && ["primary_volunteer_field","volunteer_interest_preferences"].includes(field.field_key)) continue;
      area.append(controlFor(field));
    }
    if (state.step===3) renderPreferences();
  }
  function render() {
    $("step-title").textContent = STEPS[state.step].name;
    $("step-description").textContent = STEPS[state.step].desc;
    $("step-number").textContent = String(state.step+1).padStart(2,"0") + " / " + String(STEP_TOTAL).padStart(2,"0");
    $("progress-fill").style.width = ((state.step+1)/STEP_TOTAL*100).toFixed(0) + "%";
    const steps = $("stepper");
    steps.replaceChildren();
    for (let i=0;i<STEP_TOTAL;i++) {
      const li = create("li",i===state.step?"active":i<state.step?"done":"");
      const span = create("span","",i<state.step?"✓":String(i+1).padStart(2,"0"));
      li.title = STEPS[i].name;
      li.append(span);steps.append(li);
    }
    $("previous").disabled = state.step===0 || state.sending;
    setVisible("next",state.step<6);
    setVisible("submit",state.step===6);
    $("submit").disabled = state.sending || PREVIEW_ONLY;
    $("submit").textContent = PREVIEW_ONLY ? "معاينة فقط — الإرسال غير مفعل" : "إرسال طلب الانضمام ←";
    renderFields();setAlert("");
  }
  function validStep(step) {
    if (step===5 && valueOf("volunteer_commitment")==="2") {
      setAlert("لا يمكن إتمام الانضمام دون الموافقة على الالتزام بالعمل التطوعي وأنظمة المؤسسة.");return false;
    }
    if (step===3) {
      const chosen=state.preferences.filter(Boolean);
      if(chosen.includes("medical_consultations") && !consultationsEligible()) {
        setAlert("الاستشارات الطبية والصيدلانية متاحة فقط للأطباء والمقيمين والأطباء الاختصاصيين والصيادلة.");return false;
      }
      if (!state.preferences[0] || !state.categories.some(category=>category.value===state.preferences[0])) {
        setAlert("يرجى اختيار المجال الأول من المجالات المتاحة.");return false;
      }
      if (new Set(chosen).size!==chosen.length || (state.preferences[2] && !state.preferences[1])) {
        setAlert("يرجى ترتيب الرغبات دون تكرار أو تجاوز الأولوية الثانية.");return false;
      }
    }
    const fields = fieldsForStep(step);
    if(step===4&&state.preferences.includes("medical_consultations")){
      const ethics=valueOf("medical_consultation_ethics");
      const required=state.fields.find(f=>f.field_key==="medical_consultation_ethics")?.options||[];
      if(valueOf("medical_consultation_demo_seen")!=="yes" || !Array.isArray(ethics) || !required.every(o=>ethics.includes(o.value))){
        setAlert("يرجى تأكيد الاطلاع على المنصة والموافقة على جميع بنود الالتزام المهني.");return false;
      }
    }
    for (const field of fields) {
      const value = valueOf(field.field_key);
      const missing = Array.isArray(value) ? !value.length : value === undefined || value === null || !text(value);
      if (field.required && missing) {
        setAlert("يرجى تعبئة الحقل المطلوب: " + labelOf(field));
        document.getElementById("jf-"+field.field_key)?.focus();
        return false;
      }
      if (missing) continue;
      if (field.field_key==="medical_consultation_specialties") {
        const choices=Array.isArray(value)?value:[];
        if(choices.length>2 || new Set(choices).size!==choices.length ||
            !choices.every(code=>choiceOptions(field).some(option=>option.value===code))) {
          setAlert("يرجى اختيار اختصاص أو اختصاصين مناسبين لصفتك المهنية فقط.");return false;
        }
      }
      if (field.field_key === "phone") {
        const normalized=text(value).replace(/[\s().-]/g,"");
        const prefix=valueOf("phone_country_code")==="other"
          ?text(valueOf("phone_dial_other")):text(valueOf("phone_country_code"));
        if(!/^\+[1-9]\d{7,14}$/.test(normalized)||
           !/^\+[1-9]\d{0,3}$/.test(prefix)||
           !normalized.startsWith(prefix)||normalized.slice(prefix.length).length<6){
          setAlert("اكتب رقم واتساب صحيحاً مع رمز الاتصال الدولي؛ مثال: +9639XXXXXXXX (بدون الصفر المحلي).");
          document.getElementById("jf-phone")?.focus();return false;
        }
      }
      if (field.field_key === "whatsapp_confirmed" && value!=="yes"){
        setAlert("أكّد أن رقم الهاتف عليه حساب واتساب نشط ويمكن التواصل معك من خلاله.");
        document.getElementById("jf-whatsapp_confirmed")?.focus();return false;
      }
      if (field.field_key === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(value))) {
        setAlert("يرجى كتابة بريد إلكتروني صحيح.");return false;
      }
      if (field.field_type === "url") {
        try { const u = new URL(text(value));if (!["http:","https:"].includes(u.protocol)) throw Error("invalid"); }
        catch { setAlert("يرجى كتابة رابط يبدأ بـ https:// أو http://");return false; }
      }
      if (field.field_type === "number") {
        const n = Number(value);
        const v = field.validation || {};
        if (!Number.isFinite(n) || (v.min!==undefined && n<Number(v.min)) || (v.max!==undefined && n>Number(v.max)) || (field.field_key==="weekly_availability" && (n<1 || n>80))) {
          setAlert("يرجى إدخال قيمة رقمية صحيحة للحقل: "+labelOf(field));return false;
        }
      }
    }
    return true;
  }
  function visitTop() { $("form-ui").scrollIntoView({behavior:"smooth",block:"start"}); }
  function next() {
    if (state.step===6 || state.sending) return;
    if (!validStep(state.step)) return;
    state.step++;render();visitTop();
  }
  function prev() { if (state.step===0 || state.sending) return;state.step--;render();visitTop(); }
  async function load() {
    showOnly("loading");
    try {
      const [settingsResponse, formResponse] = await Promise.all([
        fetch("/api/management?resource=volunteer_recruitment",{cache:"no-store"}),
        fetch("/api/management?resource=join_form&form_key="+encodeURIComponent(FORM_KEY),{cache:"no-store"})
      ]);
      if (!settingsResponse.ok || !formResponse.ok) throw Error("تعذر تحميل إعدادات الانضمام أو أسئلة الاستمارة.");
      const settingsPayload = await settingsResponse.json();
      const formPayload = await formResponse.json();
      const settings = settingsPayload?.data?.[0];
      const now = Date.now();
      const open = settings?.is_open === true
        && (!settings.opens_at || Date.parse(settings.opens_at) <= now)
        && (!settings.closes_at || Date.parse(settings.closes_at) > now);
      if (!open) {
        $("closed-message").textContent = text(settings?.closed_message) || "باب الانضمام مغلق حالياً. تابع الموقع لمعرفة موعد فتح التسجيل.";
        showOnly("closed");return;
      }
      const form = formPayload?.data?.[0];
      if (form?.form_key !== FORM_KEY || form.form_kind !== "new_member" || !Array.isArray(form.fields) || !form.fields.length) {
        throw Error("لم يتم العثور على استمارة استقطاب الأعضاء الجدد المعتمدة.");
      }
      const primaryField = form.fields.find(field=>field.field_key==="primary_volunteer_field");
      const categories = Array.isArray(primaryField?.options) ? primaryField.options : [];
      state.categories = categories.filter(category=>category?.value && category?.label_ar);
      if (state.categories.length!==13) throw Error("لم يتم تحميل قائمة مجالات التطوع المعتمدة بصورة صحيحة.");
      state.preferences = ["","",""];
      state.form = form;
      state.fields = form.fields.filter(x=>x.is_active !== false);
      state.settings = settings;
      state.step = 0;
      state.values = {};
      state.consent = false;
      showOnly("form-ui");render();
    } catch (err) {
      $("failure-message").textContent = err?.message || "تعذر تحميل الاستمارة.";
      showOnly("failure");
    }
  }
  async function submit(event) {
    event.preventDefault();
    if (state.sending || state.step!==6) return;
    if (PREVIEW_ONLY) {setAlert("لا يمكن إرسال طلب حقيقي من رابط المعاينة.");return;}
    for (let i=0;i<6;i++) if (!validStep(i)) {state.step=i;render();validStep(i);visitTop();return;}
    if (!state.consent) {setAlert("يرجى الموافقة على إقرار البيانات قبل إرسال الطلب.");return;}
    state.sending=true;$("submit").disabled=true;$("submit").textContent="جارٍ إرسال الطلب...";
    try {
      const formData = {};
      for (const field of state.fields) {
        if (!visible(field)) continue;
        const value = valueOf(field.field_key);
        if (value===undefined || value===null || value==="" || (Array.isArray(value) && !value.length)) continue;
        formData[field.field_key] = value;
      }
      const ranked = state.preferences.filter(Boolean);
      if (!ranked.length || ranked.length>3 || new Set(ranked).size!==ranked.length ||
          !ranked.every(code=>state.categories.some(category=>category.value===code))) {
        throw Error("يرجى اختيار المجالات الثلاثة حسب الأولوية دون تكرار.");
      }
      formData.primary_volunteer_field=ranked[0];
      formData.volunteer_interest_preferences=ranked;
      const body = Object.assign({},formData,{
        action:"new_volunteer_application",
        application_kind:"new_member",
        form_id:state.form.id,
        form_data:formData,
        privacy_consent:true
      });
      const response = await fetch("/api/management",{
        method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},
        body:JSON.stringify(body)
      });
      const result = await response.json().catch(()=>({}));
      if (!response.ok || !result.success) {
        if (result.code === "duplicate_national_id" || result.code === "duplicate_application") {
          setAlert(result.error || "بياناتك مسجلة مسبقاً، يرجى التواصل مع الإدارة.");
          showContactHelp(result);
          return;
        }
        throw Error(result.error || "تعذر تسجيل الطلب. يرجى المحاولة مجدداً.");
      }
      state.values={};
      state.preferences=["","",""];
      state.consent=false;
      if (result.submission_id) {
        $("receipt").textContent = "رقم متابعة الطلب: " + result.submission_id;
        setVisible("receipt",true);
      }
      showOnly("success");
      window.scrollTo({top:0,behavior:"smooth"});
    } catch(err) {
      setAlert(err?.message || "تعذر إرسال طلب الانضمام.");
    } finally {
      state.sending=false;
      $("submit").disabled=PREVIEW_ONLY;
      $("submit").textContent=PREVIEW_ONLY ? "معاينة فقط — الإرسال غير مفعل" : "إرسال طلب الانضمام ←";
    }
  }
  $("retry").addEventListener("click",load);
  $("next").addEventListener("click",next);
  $("previous").addEventListener("click",prev);
  $("join-form").addEventListener("submit",submit);
  load();
})();