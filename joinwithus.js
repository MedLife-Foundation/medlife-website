/* MedLife comprehensive NEW-volunteer intake. No membership renewal data is accessed. */
(() => {
  "use strict";
  const FORM_KEY = "new_volunteer_application";
  const STEPS = [
    { name:"البيانات الشخصية", desc:"نحتاج معلوماتك الأساسية كما ترغب بتسجيلها رسمياً." },
    { name:"التواصل والإقامة", desc:"سنتواصل معك على المعلومات التي تقدمها هنا." },
    { name:"الدراسة والعمل", desc:"أخبرنا عن تحصيلك العلمي وخبراتك المهنية." },
    { name:"الاهتمامات والمهارات", desc:"اختر مجال العمل المفضل والمهارات الإضافية التي تمتلكها." },
    { name:"أسئلة الاختصاص", desc:"أسئلة مخصصة للمجال الذي اخترته، حتى نتعرف إلى نقاط قوتك." },
    { name:"الدافع والتفرغ", desc:"وضح سبب رغبتك بالعمل التطوعي والوقت الذي تستطيع الالتزام به." },
    { name:"مراجعة وإرسال", desc:"تحقق من البيانات واقرأ الإقرار قبل إرسال طلبك." }
  ];
  const GROUPS = [
    ["full_name","father_name","mother_name","date_of_birth","gender","national_id"],
    ["email","phone","country","governorate","city","address"],
    ["academic_status","university","faculty","study_year","resident_specialty","residency_year","residency_hospital","doctor_specialty","specialty","profession","workplace"],
    ["primary_volunteer_field","secondary_talent_field","secondary_talent_other","practical_skills","tools_used","portfolio_url"],
    [],
    ["volunteer_history","previous_volunteer_experience","collaboration_example","preferred_work_mode","availability_days","training_goals","motivation","weekly_availability"]
  ];
  const known = new Set(GROUPS.flat());
  const $ = id => document.getElementById(id);
  const state = { form:null, fields:[], settings:null, units:[], preferences:["","",""], values:{}, step:0, consent:false, sending:false };
  const STEP_TOTAL = STEPS.length;
  function setVisible(id, yes) { $(id).classList.toggle("hidden", !yes); }
  function showOnly(which) { for (const id of ["loading","closed","failure","success","form-ui"]) setVisible(id, id === which); }
  function setAlert(message) {
    $("form-alert").textContent = message || "";
    setVisible("form-alert", Boolean(message));
  }
  function text(value) { return String(value ?? "").trim(); }
  function opts(field) { return Array.isArray(field.options) ? field.options : []; }
  function labelOf(field) { return text(field.label_ar || field.label_en || field.field_key); }
  function valueOf(key) { return state.values[key]; }
  function visible(field) {
    const v = field.visibility || {};
    if (Array.isArray(field.target_unit_ids) && field.target_unit_ids.length) return false;
    if (Array.isArray(field.target_unit_types) && field.target_unit_types.length) return false;
    if (v.mode !== "when") return true;
    const actual = valueOf(v.field_key);
    const actualList = Array.isArray(actual) ? actual.map(String) : [text(actual)];
    const wanted = Array.isArray(v.value) ? v.value.map(String) : text(v.value).split(",").map(s=>s.trim());
    if (v.operator === "not_equals") return !actualList.includes(text(v.value));
    if (v.operator === "in") return actualList.some(a => wanted.includes(a));
    if (v.operator === "contains") return actualList.some(a => a.includes(text(v.value)));
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
    state.values[key] = value;
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
      for (const o of opts(field)) {
        const v = text(o.value);
        const row = create("label","choice-option");
        const cb = create("input");
        cb.type = "checkbox";
        cb.checked = chosen.has(v);
        cb.value = v;
        cb.addEventListener("change", () => {
          if (cb.checked) chosen.add(v); else chosen.delete(v);
          setValue(key, Array.from(chosen), false);
        });
        row.append(cb, create("span","",o.label_ar || o.label_en || v));
        el.append(row);
      }
      if (!opts(field).length) el.append(create("span","help","لم تتوفر خيارات لهذا السؤال."));
    } else if (type === "select") {
      el = create("select");
      const placeholder = create("option","", "اختر الإجابة");
      placeholder.value = "";
      el.append(placeholder);
      for (const o of opts(field)) {
        const op = create("option","",o.label_ar || o.label_en || o.value);
        op.value = text(o.value);
        el.append(op);
      }
      el.value = text(valueOf(key));
      el.addEventListener("change", () => setValue(key,el.value,true));
    } else {
      el = create(type === "textarea" ? "textarea" : "input");
      if (type !== "textarea") {
        el.type = {email:"email",phone:"tel",url:"url",number:"number",date:"date"}[type] || "text";
        if (type === "number") {
          if (field.validation && field.validation.min !== undefined) el.min = field.validation.min;
          if (field.validation && field.validation.max !== undefined) el.max = field.validation.max;
          if (field.validation && field.validation.step !== undefined) el.step = field.validation.step;
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
    return wrap;
  }
  function renderPreferences() {
    const area = $("field-area");
    area.querySelector("#preference-area")?.remove();
    const section = create("div","preference-area wide");
    section.id = "preference-area";
    section.append(create("h3","preference-title","رغبات الانضمام إلى الخلايا والأقسام"));
    section.append(create("p","help","اختر حتى ثلاث جهات من ميدلايف حسب الأولوية، مع مراعاة خبرتك ومجال التطوع الذي حددته. الرغبة الأولى إلزامية والثانية والثالثة اختياريتان."));
    const grid = create("div","preference-grid");
    const positions = ["الأولوية الأولى — أساسية","الأولوية الثانية — اختيارية","الأولوية الثالثة — اختيارية"];
    for(let i=0;i<3;i++){
      const wrap = create("div","field");
      const label = create("label","",positions[i]);
      label.htmlFor = "jf-preference-"+i;
      const select = create("select");
      select.id = "jf-preference-"+i;
      const empty = create("option","",i===0?"اختر الخلية أو القسم":"لا توجد رغبة إضافية");
      empty.value = "";select.append(empty);
      for (const unit of state.units) {
        const option = create("option","",unit.name_ar+(unit.unit_type==="field_team"?" · فريق ميداني":unit.unit_type==="cell"?" · خلية":" · قسم"));
        option.value = unit.id;
        option.disabled = state.preferences.some((id,index)=>index!==i && id===unit.id);
        select.append(option);
      }
      select.value = state.preferences[i] || "";
      select.addEventListener("change",()=>{
        const value = select.value;
        if (value && state.preferences.some((item,index)=>index!==i && item===value)) {
          setAlert("لا يمكن اختيار نفس الخلية أو القسم في أكثر من رغبة.");
          select.value=state.preferences[i] || "";return;
        }
        state.preferences[i]=value;
        // A vacant second preference also clears the third one to preserve ordering.
        if (i===1 && !value) state.preferences[2]="";
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
        const item = create("div","review-item");
        item.append(create("strong","",labelOf(f)),create("span","",showValue(f)));
        area.append(item);
      }
    }
    if (state.units.length) {
      const prefs = create("div","review-item wide");
      prefs.append(create("strong","","رغبات الانضمام مرتبة حسب الأولوية"));
      const names = state.preferences.filter(Boolean).map((id,i) => (i+1)+". "+(state.units.find(unit=>unit.id===id)?.name_ar || "—"));
      prefs.append(create("span","", names.join(" | ") || "لم يتم اختيار رغبة"));
      area.append(prefs);
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
  function renderFields() {
    const area = $("field-area");
    area.replaceChildren();
    if (state.step === 6) return review();
    const fields = fieldsForStep(state.step);
    if (!fields.length) {
      area.append(create("div","no-fields",state.step === 4 ? "لا توجد أسئلة إضافية لهذا التخصص حالياً. يمكنك المتابعة." : "لا توجد أسئلة لهذه المرحلة."));
      return;
    }
    if (state.step === 4) area.append(create("p","section-tip","الأسئلة التالية مرتبطة بالمجال الأساسي الذي اخترته. قد تختلف بحسب الخلية أو اختصاصك."));
    if (state.step === 0) area.append(create("p","section-tip","تُستخدم بيانات الهوية الحساسة للتحقق من عدم تكرار طلبات الانتساب، ولا تُنشر ضمن الملف العام."));
    for (const field of fields) area.append(controlFor(field));
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
    $("submit").disabled = state.sending;
    renderFields();setAlert("");
  }
  function validStep(step) {
    if (step===3) {
      const chosen=state.preferences.filter(Boolean);
      if (!chosen.length) {setAlert("يرجى تحديد رغبتك الأولى في التطوع.");return false;}
      if (new Set(chosen).size!==chosen.length || (state.preferences[2] && !state.preferences[1])) {
        setAlert("يرجى ترتيب الرغبات دون تكرار أو تجاوز الأولوية الثانية.");return false;
      }
    }
    const fields = fieldsForStep(step);
    for (const field of fields) {
      const value = valueOf(field.field_key);
      const missing = Array.isArray(value) ? !value.length : value === undefined || value === null || !text(value);
      if (field.required && missing) {
        setAlert("يرجى تعبئة الحقل المطلوب: " + labelOf(field));
        document.getElementById("jf-"+field.field_key)?.focus();
        return false;
      }
      if (missing) continue;
      if (field.field_type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(value))) {
        setAlert("يرجى كتابة بريد إلكتروني صحيح.");return false;
      }
      if (field.field_type === "url") {
        try { const u = new URL(text(value));if (!["http:","https:"].includes(u.protocol)) throw Error("invalid"); }
        catch { setAlert("يرجى كتابة رابط يبدأ بـ https:// أو http://");return false; }
      }
      if (field.field_type === "number") {
        const n = Number(value);
        const v = field.validation || {};
        if (!Number.isFinite(n) || (v.min!==undefined && n<Number(v.min)) || (v.max!==undefined && n>Number(v.max))) {
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
      const [settingsResponse, formResponse, unitsResponse] = await Promise.all([
        fetch("/api/management?resource=volunteer_recruitment",{cache:"no-store"}),
        fetch("/api/management?resource=join_form&form_key="+encodeURIComponent(FORM_KEY),{cache:"no-store"}),
        fetch("/api/management?resource=join_units",{cache:"no-store"})
      ]);
      if (!settingsResponse.ok || !formResponse.ok || !unitsResponse.ok) throw Error("تعذر تحميل بيانات الاستمارة والخلايا من المنصة.");
      const settingsPayload = await settingsResponse.json();
      const formPayload = await formResponse.json();
      const unitsPayload = await unitsResponse.json();
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
      const units = Array.isArray(unitsPayload?.data) ? unitsPayload.data : [];
      state.units = units.filter(unit => unit?.id && unit?.name_ar && ["cell","department","field_team"].includes(unit.unit_type));
      if (!state.units.length) throw Error("تعذر تحميل قائمة الخلايا والأقسام المتاحة.");
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
      const requestedDepartments = state.preferences.filter(Boolean).map(id=>state.units.find(unit=>unit.id===id)?.name_ar).filter(Boolean);
      if (!requestedDepartments.length || new Set(requestedDepartments).size !== requestedDepartments.length) {
        throw Error("يرجى اختيار رغبات تطوع صحيحة وغير مكررة.");
      }
      const body = Object.assign({},formData,{
        requested_departments:requestedDepartments,
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
      if (!response.ok || !result.success) throw Error(result.error || "تعذر تسجيل الطلب. يرجى المحاولة مجدداً.");
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
      $("submit").disabled=false;
      $("submit").textContent="إرسال طلب الانضمام ←";
    }
  }
  $("retry").addEventListener("click",load);
  $("next").addEventListener("click",next);
  $("previous").addEventListener("click",prev);
  $("join-form").addEventListener("submit",submit);
  load();
})();