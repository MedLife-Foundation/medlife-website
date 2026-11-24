const SUPABASE_URL = "https://ftvjakwogxdlxxbpfydf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_beiimOXraRWZguAX7balCQ_HVao1o3K";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0dmpha3dvZ3hkbHh4YnBmeWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MDMxNTcsImV4cCI6MjEwNjI3OTE1N30.mu0ob9dI7yiL_0PPytvaWqRrv--ZOkwkwd-4tKspmIE";

const RESOURCES = {
  content: {
    table: "public_site_content",
    select: "source_id,content_type,title,slug,excerpt,body,metadata,published_at,public_url,created_at,updated_at,image_url",
    order: "published_at.desc"
  },
  activities: {
    table: "public_site_activities",
    select: "source_id,title,activity_type,description,details,governorate,city,start_at,end_at,status,participant_target,participant_count,cover_image_url,slug,source_url,gallery_url,gallery,created_at,updated_at",
    order: "start_at.desc"
  },
  campaigns: {
    table: "public_site_campaigns",
    select: "source_id,name,description,status,start_date,end_date,governorate,objective,target_value,achieved_value,budget_currency,created_at,updated_at",
    order: "start_date.desc"
  },
  support: {
    table: "public_site_support_cases",
    select: "source_id,case_code,subject,summary,category,status,priority,description,governorate,areas,support_type,start_date,end_date,progress_stage,public_status_note,amount_required,amount_secured,currency,public_url,documents_verified,created_at,updated_at",
    order: "created_at.desc"
  },
  support_payment_methods: {
    table: "support_payment_methods",
    select: "method_code,label,account_label,account_value,instructions,sort_order",
    order: "sort_order.asc"
  },
  media: {
    table: "public_site_media",
    select: "source_id,file_name,mime_type,alt_text,caption,public_url,created_at",
    order: "created_at.desc"
  },
  settings: {
    table: "public_site_settings",
    select: "key,value,updated_at",
    order: "key.asc"
  },
  volunteer_recruitment: {
    table: "volunteer_recruitment_settings",
    select: "id,is_open,title,intro,closed_message,application_url,opens_at,closes_at,updated_at",
    order: "id.asc"
  },
  join_units: {
    table: "org_units",
    select: "id,name_ar,name_en,unit_type,description",
    order: "sort_order.asc"
  },
  join_form: {
    table: "admin_form_definitions",
    select: "id,form_key,name_ar,name_en,description_ar,description_en,form_kind,status,is_public,version,settings",
    order: "updated_at.desc"
  },
  membership_renewal_form: {
    table: "admin_form_definitions",
    select: "id,form_key,name_ar,name_en,description_ar,description_en,form_kind,status,is_public,version,settings",
    order: "updated_at.desc"
  },
  birthdays: {
    table: "public_site_birthdays",
    select: "volunteer_id,display_name,birth_month,birth_day,profile_image_url,team_months",
    order: "display_name.asc"
  },
  upcoming_birthdays: {
    table: "public_site_birthdays",
    select: "volunteer_id,display_name,birth_month,birth_day,profile_image_url,team_months",
    order: "display_name.asc"
  },
  occasions: {
    table: "public_site_occasions",
    select: "id,title,occasion_type,person_name,description,image_url,occasion_date,created_at",
    order: "occasion_date.desc,created_at.desc"
  }
};

const DEFAULT_CERTIFICATE_TYPE_OPTIONS = [
  {value:"volunteer_service",label_ar:"شهادة تطوع"},
  {value:"thank_you",label_ar:"شهادة شكر"},
  {value:"participation",label_ar:"شهادة مشاركة"},
  {value:"training",label_ar:"شهادة تدريب"},
  {value:"appreciation",label_ar:"شهادة تقدير"},
  {value:"other",label_ar:"أخرى"}
];


/* Separate intake-only questions. Published renewal schemas and existing member records are unchanged.
   These become part of the versioned form snapshot attached to each new application. */
const NEW_VOLUNTEER_CATEGORIES = [
  { value: "medical_content", label_ar: "كتابة المحتوى الطبي" },
  { value: "medical_content_formatting", label_ar: "تنسيق المحتوى الطبي" },
  { value: "design", label_ar: "التصميم الجرافيكي والبوسترات" },
  { value: "video_editing", label_ar: "مونتاج الفيديوهات" },
  { value: "visual_media", label_ar: "الإعلام المرئي" },
  { value: "field_work", label_ar: "القسم الميداني" },
  { value: "university_media", label_ar: "الإعلام الجامعي" },
  { value: "voice_over", label_ar: "التعليق الصوتي" },
  { value: "it", label_ar: "تقنية المعلومات IT" },
  { value: "telegram", label_ar: "إدارة التليجرام" },
  { value: "instagram", label_ar: "إدارة الإنستاغرام" },
  { value: "podcast_live", label_ar: "البودكاست والبث المباشر" },
  { value: "medical_consultations", label_ar: "الاستشارات الطبية" },
];


const RECRUITMENT_ELIGIBLE_MEDICAL_ROLES = new Set(["doctor","resident_doctor","specialist","pharmacist"]);
const MEDICAL_CONSULTATION_SPECIALTIES = [
  { value: "general_medicine", label_ar: "الطب العام" },
  { value: "family_medicine", label_ar: "طب الأسرة" },
  { value: "internal_medicine", label_ar: "الأمراض الداخلية" },
  { value: "cardiology", label_ar: "أمراض القلب" },
  { value: "endocrinology", label_ar: "الغدد الصم والسكري" },
  { value: "gastroenterology", label_ar: "أمراض الجهاز الهضمي والكبد" },
  { value: "nephrology", label_ar: "أمراض الكلى" },
  { value: "pulmonology", label_ar: "الأمراض الصدرية والتنفسية" },
  { value: "rheumatology", label_ar: "الأمراض الرثوية والمفاصل" },
  { value: "infectious_diseases", label_ar: "الأمراض المعدية" },
  { value: "hematology", label_ar: "أمراض الدم" },
  { value: "medical_oncology", label_ar: "الأورام الطبية" },
  { value: "radiation_oncology", label_ar: "العلاج الشعاعي للأورام" },
  { value: "allergy_immunology", label_ar: "الحساسية والمناعة" },
  { value: "dermatology", label_ar: "الأمراض الجلدية" },
  { value: "neurology", label_ar: "الأمراض العصبية" },
  { value: "neurosurgery", label_ar: "الجراحة العصبية" },
  { value: "psychiatry", label_ar: "الطب النفسي" },
  { value: "pediatrics", label_ar: "طب الأطفال" },
  { value: "neonatology", label_ar: "حديثو الولادة والخدّج" },
  { value: "pediatric_cardiology", label_ar: "قلبية الأطفال" },
  { value: "pediatric_neurology", label_ar: "عصبية الأطفال" },
  { value: "pediatric_surgery", label_ar: "جراحة الأطفال" },
  { value: "obgyn", label_ar: "التوليد وأمراض النساء" },
  { value: "reproductive_medicine", label_ar: "طب الإنجاب والعقم" },
  { value: "maternal_fetal_medicine", label_ar: "طب الأم والجنين" },
  { value: "general_surgery", label_ar: "الجراحة العامة" },
  { value: "orthopedics", label_ar: "الجراحة العظمية" },
  { value: "urology", label_ar: "الجراحة البولية" },
  { value: "cardiac_surgery", label_ar: "جراحة القلب" },
  { value: "vascular_surgery", label_ar: "جراحة الأوعية" },
  { value: "thoracic_surgery", label_ar: "الجراحة الصدرية" },
  { value: "plastic_surgery", label_ar: "الجراحة التجميلية والترميمية" },
  { value: "ent", label_ar: "أمراض وجراحة الأذن والأنف والحنجرة" },
  { value: "ophthalmology", label_ar: "طب وجراحة العيون" },
  { value: "anesthesiology", label_ar: "التخدير والإنعاش" },
  { value: "emergency_medicine", label_ar: "طب الطوارئ" },
  { value: "critical_care", label_ar: "العناية المشددة" },
  { value: "radiology", label_ar: "الأشعة والتصوير الطبي" },
  { value: "nuclear_medicine", label_ar: "الطب النووي" },
  { value: "pathology", label_ar: "التشريح المرضي" },
  { value: "laboratory_medicine", label_ar: "الطب المخبري" },
  { value: "microbiology", label_ar: "الأحياء الدقيقة الطبية" },
  { value: "clinical_genetics", label_ar: "الوراثة الطبية" },
  { value: "physical_medicine", label_ar: "الطب الفيزيائي وإعادة التأهيل" },
  { value: "sports_medicine", label_ar: "الطب الرياضي" },
  { value: "geriatric_medicine", label_ar: "طب الشيخوخة" },
  { value: "palliative_medicine", label_ar: "الطب التلطيفي" },
  { value: "occupational_medicine", label_ar: "طب العمل" },
  { value: "public_health", label_ar: "الصحة العامة والطب الوقائي" },
  { value: "nutrition", label_ar: "التغذية العلاجية" },
  { value: "pain_medicine", label_ar: "طب الألم" },
  { value: "sleep_medicine", label_ar: "طب النوم" },
  { value: "tropical_medicine", label_ar: "طب المناطق المدارية" },
  { value: "forensic_medicine", label_ar: "الطب الشرعي" },
  { value: "transfusion_medicine", label_ar: "طب نقل الدم" },
  { value: "pharmacy", label_ar: "الصيدلة" },
  { value: "clinical_pharmacy", label_ar: "الصيدلة السريرية" },
  { value: "pharmacology", label_ar: "علم الأدوية والمعلومات الدوائية" },
];
const PHARMACY_CONSULTATION_CODES = new Set(["pharmacy","clinical_pharmacy","pharmacology"]);

// Verified ISO 3166-1 alpha-2 territory list. Labels are Arabic CLDR region names.
const INTAKE_COUNTRY_CODES = "AW AF AO AI AX AL AD AE AR AM AS AQ TF AG AU AT AZ BI BE BJ BQ BF BD BG BH BS BA BL BY BZ BM BO BR BB BN BT BV BW CF CA CC CH CL CN CI CM CD CG CK CO KM CV CR CU CW CX KY CY CZ DE DJ DM DK DO DZ EC EG ER EH ES EE ET FI FJ FK FR FO FM GA GB GE GG GH GI GN GP GM GW GQ GR GD GL GT GF GU GY HK HM HN HR HT HU ID IM IN IO IE IR IQ IS IL IT JM JE JO JP KZ KE KG KH KI KN KR KW LA LB LR LY LC LI LK LS LT LU LV MO MF MA MC MD MG MV MX MH MK ML MT MM ME MN MP MZ MR MS MQ MU MW MY YT NA NC NE NF NG NI NU NL NO NP NR NZ OM PK PA PN PE PH PW PG PL PR KP PT PY PS PF QA RE RO RU RW SA SD SN SG GS SH SJ SB SL SV SM SO PM RS SS ST SR SK SI SE SZ SX SC SY TC TD TG TH TJ TK TM TL TO TT TN TR TV TW TZ UG UA UM UY US UZ VA VC VE VG VI VN VU WF WS YE ZA ZM ZW".split(" ");
const INTAKE_UNIVERSITIES = [{"value":"uni_1","label_ar":"جامعة دمشق"},{"value":"uni_2","label_ar":"جامعة حلب"},{"value":"uni_3","label_ar":"جامعة اللاذقية (تشرين سابقاً)"},{"value":"uni_4","label_ar":"جامعة حمص (البعث سابقاً)"},{"value":"uni_5","label_ar":"جامعة الفرات"},{"value":"uni_6","label_ar":"جامعة حماة"},{"value":"uni_7","label_ar":"جامعة طرطوس"},{"value":"uni_8","label_ar":"جامعة إدلب"},{"value":"uni_9","label_ar":"الجامعة الافتراضية السورية"},{"value":"uni_10","label_ar":"جامعة الأندلس الخاصة للعلوم الطبية"},{"value":"uni_11","label_ar":"الجامعة السورية الخاصة"},{"value":"uni_12","label_ar":"جامعة القلمون الخاصة"},{"value":"uni_13","label_ar":"جامعة الوادي الدولية الخاصة"},{"value":"uni_14","label_ar":"جامعة المنارة"},{"value":"uni_15","label_ar":"جامعة الشام الخاصة"},{"value":"uni_16","label_ar":"الجامعة العربية الدولية"},{"value":"uni_17","label_ar":"جامعة قرطبة الخاصة"},{"value":"uni_18","label_ar":"جامعة الاتحاد الخاصة"},{"value":"uni_19","label_ar":"جامعة الحواش الخاصة"},{"value":"uni_20","label_ar":"جامعة تشرين الخاصة"},{"value":"uni_21","label_ar":"جامعة الرشيد الدولية الخاصة"},{"value":"uni_22","label_ar":"جامعة الشهباء الخاصة"},{"value":"uni_23","label_ar":"جامعة اليرموك الخاصة"},{"value":"uni_24","label_ar":"الجامعة الدولية الخاصة للعلوم والتكنولوجيا"},{"value":"uni_25","label_ar":"جامعة الزيتونة الدولية الخاصة"},{"value":"uni_26","label_ar":"جامعة أنطاكية السورية الخاصة"},{"value":"other","label_ar":"جامعة أخرى / خارج القائمة"}];
const INTAKE_DENTAL_SPECIALTIES = [{"value":"dent_1","label_ar":"طب الأسنان العام"},{"value":"dent_2","label_ar":"جراحة الفم والوجه والفكين"},{"value":"dent_3","label_ar":"تقويم الأسنان والفكين"},{"value":"dent_4","label_ar":"المعالجة اللبية"},{"value":"dent_5","label_ar":"أمراض وجراحة اللثة"},{"value":"dent_6","label_ar":"التعويضات السنية الثابتة"},{"value":"dent_7","label_ar":"التعويضات السنية المتحركة"},{"value":"dent_8","label_ar":"زراعة الأسنان"},{"value":"dent_9","label_ar":"طب أسنان الأطفال"},{"value":"dent_10","label_ar":"طب أسنان الأسرة والمجتمع"},{"value":"dent_11","label_ar":"طب الفم وتشخيص أمراضه"},{"value":"dent_12","label_ar":"طب الأسنان الترميمي والتجميلي"},{"value":"dent_13","label_ar":"الأشعة الفموية والفكية"},{"value":"dent_14","label_ar":"الصحة العامة الفموية"},{"value":"dent_15","label_ar":"النسج الفموية والمرضية"},{"value":"dent_16","label_ar":"الوقاية وصحة الفم"}];
const INTAKE_PHARMACY_SPECIALTIES = [{"value":"pharm_1","label_ar":"الصيدلة الصناعية"},{"value":"pharm_2","label_ar":"الصيدلة التحليلية"},{"value":"pharm_3","label_ar":"الصيدلة الحيوية"},{"value":"pharm_4","label_ar":"مراقبة جودة الأدوية"},{"value":"pharm_5","label_ar":"التيقظ الدوائي"}];
const INTAKE_MEDICAL_SPECIALTIES = MEDICAL_CONSULTATION_SPECIALTIES.filter(x=>!PHARMACY_CONSULTATION_CODES.has(x.value));
const INTAKE_ALL_SPECIALTIES = [...INTAKE_MEDICAL_SPECIALTIES,...INTAKE_DENTAL_SPECIALTIES,...MEDICAL_CONSULTATION_SPECIALTIES.filter(x=>PHARMACY_CONSULTATION_CODES.has(x.value)),...INTAKE_PHARMACY_SPECIALTIES];
const INTAKE_WHATSAPP_DIAL_CODES = [{"value":"+963","label_ar":"سوريا +963"},{"value":"+961","label_ar":"لبنان +961"},{"value":"+90","label_ar":"تركيا +90"},{"value":"+962","label_ar":"الأردن +962"},{"value":"+964","label_ar":"العراق +964"},{"value":"+970","label_ar":"فلسطين +970"},{"value":"+972","label_ar":"إسرائيل +972"},{"value":"+20","label_ar":"مصر +20"},{"value":"+966","label_ar":"السعودية +966"},{"value":"+971","label_ar":"الإمارات +971"},{"value":"+974","label_ar":"قطر +974"},{"value":"+965","label_ar":"الكويت +965"},{"value":"+968","label_ar":"عُمان +968"},{"value":"+973","label_ar":"البحرين +973"},{"value":"+967","label_ar":"اليمن +967"},{"value":"+31","label_ar":"هولندا +31"},{"value":"+49","label_ar":"ألمانيا +49"},{"value":"+33","label_ar":"فرنسا +33"},{"value":"+44","label_ar":"المملكة المتحدة +44"},{"value":"+1","label_ar":"الولايات المتحدة / كندا +1"},{"value":"+46","label_ar":"السويد +46"},{"value":"+47","label_ar":"النرويج +47"},{"value":"+45","label_ar":"الدنمارك +45"},{"value":"+32","label_ar":"بلجيكا +32"},{"value":"+41","label_ar":"سويسرا +41"},{"value":"+43","label_ar":"النمسا +43"},{"value":"+39","label_ar":"إيطاليا +39"},{"value":"+34","label_ar":"إسبانيا +34"},{"value":"+7","label_ar":"روسيا / كازاخستان +7"},{"value":"+61","label_ar":"أستراليا +61"},{"value":"+64","label_ar":"نيوزيلندا +64"},{"value":"+91","label_ar":"الهند +91"},{"value":"+86","label_ar":"الصين +86"},{"value":"+81","label_ar":"اليابان +81"},{"value":"+82","label_ar":"كوريا الجنوبية +82"},{"value":"+92","label_ar":"باكستان +92"},{"value":"+98","label_ar":"إيران +98"},{"value":"+27","label_ar":"جنوب أفريقيا +27"},{"value":"other","label_ar":"رمز دولة أخرى (أدخله يدوياً)"}];

const INTAKE_OTHER_COUNTRIES = (() => {
  const names = new Intl.DisplayNames(["ar"], {type:"region"});
  return INTAKE_COUNTRY_CODES.filter(code=>code!=="SY")
    .map(code=>({value:code,label_ar:names.of(code)||code}))
    .sort((a,b)=>a.label_ar.localeCompare(b.label_ar,"ar"));
})();

// Legacy 2026 MedLife recruitment form, 64 questions across 20 pages.
// Adapted for multi-track intake; specialist questions render for all selected preferences.
const LEGACY_RECRUITMENT_REFERENCE_FIELDS = [
  {
    "field_key": "social_profile_url",
    "label_ar": "رابط حسابك الشخصي على وسائل التواصل الاجتماعي (اختياري)",
    "sort_order": 62,
    "field_type": "url",
    "required": false,
    "help_ar": "فيسبوك أو إنستاغرام أو لينكدإن، إن وجد."
  },
  {
    "field_key": "field_direct_participation",
    "label_ar": "هل تستطيع المشاركة في الأنشطة والحملات الميدانية بشكل مباشر؟",
    "field_type": "select",
    "required": true,
    "sort_order": 303,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "field_work"
    },
    "options": [
      {
        "value": "1",
        "label_ar": "نعم"
      },
      {
        "value": "2",
        "label_ar": "أحياناً"
      },
      {
        "value": "3",
        "label_ar": "لا"
      }
    ]
  },
  {
    "field_key": "field_work_pressure",
    "label_ar": "هل تستطيع العمل ضمن فريق وتحمل ضغط العمل أثناء الأنشطة؟",
    "field_type": "select",
    "required": true,
    "sort_order": 304,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "field_work"
    },
    "options": [
      {
        "value": "1",
        "label_ar": "نعم"
      },
      {
        "value": "2",
        "label_ar": "إلى حد ما"
      },
      {
        "value": "3",
        "label_ar": "لا"
      }
    ]
  },
  {
    "field_key": "field_work_preferred_tasks",
    "label_ar": "ما المهام الميدانية التي تجد نفسك مناسباً لها؟",
    "field_type": "multi_select",
    "required": true,
    "sort_order": 305,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "field_work"
    },
    "options": [
      {
        "value": "1",
        "label_ar": "تنظيم الفرق"
      },
      {
        "value": "2",
        "label_ar": "التنسيق اللوجستي"
      },
      {
        "value": "3",
        "label_ar": "التواصل مع الناس"
      },
      {
        "value": "4",
        "label_ar": "إدارة النشاط"
      },
      {
        "value": "5",
        "label_ar": "التوثيق والمتابعة"
      },
      {
        "value": "6",
        "label_ar": "الدعم الإنساني"
      }
    ]
  },
  {
    "field_key": "medical_content_background",
    "label_ar": "هل لديك خلفية أو دراسة طبية؟",
    "field_type": "select",
    "required": true,
    "sort_order": 231,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "medical_content"
    },
    "options": [
      {
        "value": "1",
        "label_ar": "نعم"
      },
      {
        "value": "2",
        "label_ar": "لا"
      }
    ]
  },
  {
    "field_key": "medical_content_study_details",
    "label_ar": "اذكر الاختصاص أو المجال الطبي إن وجد",
    "field_type": "text",
    "required": false,
    "sort_order": 232,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "medical_content"
    }
  },
  {
    "field_key": "medical_writing_languages",
    "label_ar": "ما اللغات التي تستطيع الكتابة بها؟",
    "field_type": "multi_select",
    "required": true,
    "sort_order": 233,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "medical_content"
    },
    "options": [
      {
        "value": "1",
        "label_ar": "العربية"
      },
      {
        "value": "2",
        "label_ar": "الإنكليزية"
      },
      {
        "value": "3",
        "label_ar": "لغة أخرى"
      }
    ]
  },
  {
    "field_key": "formatting_programs",
    "label_ar": "ما البرامج التي تجيد استخدامها في تنسيق المحتوى؟",
    "field_type": "multi_select",
    "required": true,
    "sort_order": 251,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "medical_content_formatting"
    },
    "options": [
      {
        "value": "1",
        "label_ar": "Microsoft Word"
      },
      {
        "value": "2",
        "label_ar": "PowerPoint"
      },
      {
        "value": "3",
        "label_ar": "Canva"
      },
      {
        "value": "4",
        "label_ar": "Google Docs"
      },
      {
        "value": "5",
        "label_ar": "برامج أخرى"
      }
    ]
  },
  {
    "field_key": "formatting_formal_reports",
    "label_ar": "هل سبق لك العمل على تقارير أو ملفات رسمية؟",
    "field_type": "select",
    "required": true,
    "sort_order": 252,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "medical_content_formatting"
    },
    "options": [
      {
        "value": "1",
        "label_ar": "نعم"
      },
      {
        "value": "2",
        "label_ar": "لا"
      }
    ]
  },
  {
    "field_key": "design_software",
    "label_ar": "ما برامج التصميم التي تجيد استخدامها؟",
    "field_type": "multi_select",
    "required": true,
    "sort_order": 341,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "design"
    },
    "options": [
      {
        "value": "1",
        "label_ar": "Canva"
      },
      {
        "value": "2",
        "label_ar": "Photoshop"
      },
      {
        "value": "3",
        "label_ar": "Illustrator"
      },
      {
        "value": "4",
        "label_ar": "Figma"
      },
      {
        "value": "5",
        "label_ar": "برنامج آخر"
      }
    ]
  },
  {
    "field_key": "design_types",
    "label_ar": "ما أنواع التصاميم التي لديك خبرة بها؟",
    "field_type": "multi_select",
    "required": true,
    "sort_order": 342,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "design"
    },
    "options": [
      {
        "value": "1",
        "label_ar": "بوسترات طبية"
      },
      {
        "value": "2",
        "label_ar": "منشورات سوشال ميديا"
      },
      {
        "value": "3",
        "label_ar": "شعارات وهوية بصرية"
      },
      {
        "value": "4",
        "label_ar": "إنفوغرافيك"
      },
      {
        "value": "5",
        "label_ar": "تصميم فيديوهات قصيرة"
      }
    ]
  },
  {
    "field_key": "design_experience_level",
    "label_ar": "كيف تصف مستوى خبرتك في التصميم؟",
    "field_type": "select",
    "required": true,
    "sort_order": 343,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "design"
    },
    "options": [
      {
        "value": "1",
        "label_ar": "مبتدئ"
      },
      {
        "value": "2",
        "label_ar": "متوسط"
      },
      {
        "value": "3",
        "label_ar": "متقدم"
      }
    ]
  },
  {
    "field_key": "montage_software",
    "label_ar": "ما البرامج التي تستخدمها في مونتاج الفيديوهات؟",
    "field_type": "multi_select",
    "required": true,
    "sort_order": 331,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "video_editing"
    },
    "options": [
      {
        "value": "1",
        "label_ar": "CapCut"
      },
      {
        "value": "2",
        "label_ar": "Premiere Pro"
      },
      {
        "value": "3",
        "label_ar": "After Effects"
      },
      {
        "value": "4",
        "label_ar": "VN"
      },
      {
        "value": "5",
        "label_ar": "DaVinci Resolve"
      },
      {
        "value": "6",
        "label_ar": "برنامج آخر"
      }
    ]
  },
  {
    "field_key": "montage_video_types",
    "label_ar": "ما أنواع الفيديوهات التي تستطيع العمل عليها؟",
    "field_type": "multi_select",
    "required": true,
    "sort_order": 332,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "video_editing"
    },
    "options": [
      {
        "value": "1",
        "label_ar": "ريلز قصيرة"
      },
      {
        "value": "2",
        "label_ar": "فيديوهات توعوية"
      },
      {
        "value": "3",
        "label_ar": "مقابلات"
      },
      {
        "value": "4",
        "label_ar": "تغطيات أنشطة"
      },
      {
        "value": "5",
        "label_ar": "موشن جرافيك"
      }
    ]
  },
  {
    "field_key": "montage_deadline_commitment",
    "label_ar": "هل تستطيع إنجاز الفيديوهات بشكل منتظم ضمن المواعيد المحددة؟",
    "field_type": "select",
    "required": true,
    "sort_order": 333,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "video_editing"
    },
    "options": [
      {
        "value": "1",
        "label_ar": "نعم"
      },
      {
        "value": "2",
        "label_ar": "لا"
      }
    ]
  },
  {
    "field_key": "visual_media_roles",
    "label_ar": "أي مهام الإعلام المرئي تفضل تنفيذها؟",
    "field_type": "multi_select",
    "required": true,
    "sort_order": 267,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "visual_media"
    },
    "options": [
      {
        "value": "1",
        "label_ar": "الظهور أمام الكاميرا"
      },
      {
        "value": "2",
        "label_ar": "كتابة النصوص للتصوير"
      },
      {
        "value": "3",
        "label_ar": "التصوير وإدارة الكاميرا"
      },
      {
        "value": "4",
        "label_ar": "التقديم الإعلامي"
      },
      {
        "value": "5",
        "label_ar": "إعداد الأفكار والسيناريوهات"
      }
    ]
  },
  {
    "field_key": "visual_media_camera_comfort",
    "label_ar": "هل تشعر بالراحة أمام الكاميرا وأثناء التصوير؟",
    "field_type": "select",
    "required": true,
    "sort_order": 268,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "visual_media"
    },
    "options": [
      {
        "value": "1",
        "label_ar": "نعم"
      },
      {
        "value": "2",
        "label_ar": "لا"
      }
    ]
  },
  {
    "field_key": "visual_media_equipment_details",
    "label_ar": "ما معدات التصوير أو التسجيل التي تتوفر لديك؟",
    "field_type": "textarea",
    "required": false,
    "sort_order": 269,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "visual_media"
    }
  },
  {
    "field_key": "university_media_tasks",
    "label_ar": "ما المهام التي تستطيع تنفيذها في الإعلام الجامعي؟",
    "field_type": "multi_select",
    "required": true,
    "sort_order": 372,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "university_media"
    },
    "options": [
      {
        "value": "1",
        "label_ar": "نشر الأنشطة"
      },
      {
        "value": "2",
        "label_ar": "استقطاب متطوعين"
      },
      {
        "value": "3",
        "label_ar": "تنظيم فعاليات جامعية"
      },
      {
        "value": "4",
        "label_ar": "التنسيق مع الطلاب"
      },
      {
        "value": "5",
        "label_ar": "التغطية الإعلامية"
      }
    ]
  },
  {
    "field_key": "university_media_previous_experience",
    "label_ar": "هل شاركت سابقاً في نشاطات طلابية أو فرق جامعية؟",
    "field_type": "select",
    "required": true,
    "sort_order": 373,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "university_media"
    },
    "options": [
      {
        "value": "1",
        "label_ar": "نعم"
      },
      {
        "value": "2",
        "label_ar": "لا"
      }
    ]
  },
  {
    "field_key": "voiceover_experience",
    "label_ar": "هل لديك خبرة سابقة في التعليق الصوتي؟",
    "field_type": "select",
    "required": true,
    "sort_order": 352,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "voice_over"
    },
    "options": [
      {
        "value": "1",
        "label_ar": "نعم"
      },
      {
        "value": "2",
        "label_ar": "لا"
      }
    ]
  },
  {
    "field_key": "voiceover_production_types",
    "label_ar": "ما أنواع الأعمال الصوتية التي تستطيع تقديمها؟",
    "field_type": "multi_select",
    "required": true,
    "sort_order": 353,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "voice_over"
    },
    "options": [
      {
        "value": "1",
        "label_ar": "تعليق صوتي طبي"
      },
      {
        "value": "2",
        "label_ar": "إعلانات"
      },
      {
        "value": "3",
        "label_ar": "بودكاست"
      },
      {
        "value": "4",
        "label_ar": "تقارير وفيديوهات توعوية"
      }
    ]
  },
  {
    "field_key": "it_prior_projects",
    "label_ar": "هل لديك مشاريع أو أعمال تقنية سابقة؟",
    "field_type": "select",
    "required": true,
    "sort_order": 382,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "it"
    },
    "options": [
      {
        "value": "1",
        "label_ar": "نعم"
      },
      {
        "value": "2",
        "label_ar": "لا"
      }
    ]
  },
  {
    "field_key": "it_project_links",
    "label_ar": "رابط إلى مشروع تقني سابق إن وجد",
    "field_type": "url",
    "required": false,
    "sort_order": 383,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "it"
    }
  },
  {
    "field_key": "telegram_tasks",
    "label_ar": "ما المهام التي تستطيع القيام بها في إدارة التليجرام؟",
    "field_type": "multi_select",
    "required": true,
    "sort_order": 389,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "telegram"
    },
    "options": [
      {
        "value": "1",
        "label_ar": "نشر المحتوى"
      },
      {
        "value": "2",
        "label_ar": "تنظيم القنوات"
      },
      {
        "value": "3",
        "label_ar": "التفاعل مع الأعضاء"
      },
      {
        "value": "4",
        "label_ar": "إدارة البوتات"
      },
      {
        "value": "5",
        "label_ar": "التنسيق الإعلامي"
      }
    ]
  },
  {
    "field_key": "instagram_tasks",
    "label_ar": "ما المجالات التي تستطيع العمل فيها على إنستاغرام؟",
    "field_type": "multi_select",
    "required": true,
    "sort_order": 390,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "instagram"
    },
    "options": [
      {
        "value": "1",
        "label_ar": "كتابة التعليقات التوضيحية Caption"
      },
      {
        "value": "2",
        "label_ar": "تنظيم المحتوى"
      },
      {
        "value": "3",
        "label_ar": "إدارة القصص Stories"
      },
      {
        "value": "4",
        "label_ar": "إدارة الريلز Reels"
      },
      {
        "value": "5",
        "label_ar": "الرد على الرسائل"
      },
      {
        "value": "6",
        "label_ar": "تحليل الأداء"
      }
    ]
  },
  {
    "field_key": "podcast_presenting_comfort",
    "label_ar": "هل تشعر بالراحة أثناء الحوار والتقديم؟",
    "field_type": "select",
    "required": true,
    "sort_order": 391,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "podcast_live"
    },
    "options": [
      {
        "value": "1",
        "label_ar": "نعم"
      },
      {
        "value": "2",
        "label_ar": "لا"
      }
    ]
  },
  {
    "field_key": "referral_channel",
    "label_ar": "كيف تعرفت على مؤسسة ميدلايف؟",
    "sort_order": 460,
    "field_type": "select",
    "required": true,
    "options": [
      {
        "value": "1",
        "label_ar": "فيسبوك"
      },
      {
        "value": "2",
        "label_ar": "إنستاغرام"
      },
      {
        "value": "3",
        "label_ar": "تليجرام"
      },
      {
        "value": "4",
        "label_ar": "الجامعة"
      },
      {
        "value": "5",
        "label_ar": "صديق أو متطوع"
      },
      {
        "value": "6",
        "label_ar": "نشاط أو فعالية"
      },
      {
        "value": "7",
        "label_ar": "موقع إلكتروني"
      },
      {
        "value": "8",
        "label_ar": "طريقة أخرى"
      }
    ]
  },
  {
    "field_key": "what_stands_out",
    "label_ar": "ما الذي يلفت انتباهك أو يميز مؤسسة ميدلايف برأيك؟",
    "sort_order": 470,
    "field_type": "textarea",
    "required": true
  },
  {
    "field_key": "opinion_of_medlife",
    "label_ar": "ما رأيك بفريق ميدلايف؟",
    "sort_order": 480,
    "field_type": "textarea",
    "required": false
  },
  {
    "field_key": "expected_contribution",
    "label_ar": "كيف يمكن أن تسهم في تطوير المؤسسة أو المجال الذي اخترته؟",
    "sort_order": 490,
    "field_type": "textarea",
    "required": true
  },
  {
    "field_key": "future_ideas",
    "label_ar": "هل لديك أفكار أو اقتراحات مستقبلية يمكن أن تضيف قيمة لعمل المؤسسة؟",
    "sort_order": 500,
    "field_type": "textarea",
    "required": false
  },
  {
    "field_key": "volunteer_commitment",
    "label_ar": "هل تستطيع الالتزام بالعمل التطوعي والتعاون ضمن فريق وفق الأنظمة والتعليمات التنظيمية؟",
    "sort_order": 510,
    "field_type": "select",
    "required": true,
    "options": [
      {
        "value": "1",
        "label_ar": "نعم، أستطيع الالتزام"
      },
      {
        "value": "2",
        "label_ar": "لا أستطيع حالياً"
      }
    ]
  }
];

const NEW_VOLUNTEER_SCENARIO_FIELDS = [
  {
    "field_key": "scenario_medical_content",
    "label_ar": "كتابة المحتوى الطبي — موقف عملي",
    "help_ar": "مهمة عملية: طُلب منك إعداد منشور توعوي عن الاستخدام الصحيح للمضادات الحيوية. كيف ستحدد 3 رسائل أساسية، وتبحث عن مراجع موثوقة، وتتأكد من سلامة المحتوى قبل نشره؟ يمكنك الإجابة حتى لو كانت خبرتك محدودة؛ صف طريقة تفكيرك، ولا تذكر معلومات شخصية لمرضى أو متطوعين.",
    "field_type": "textarea",
    "required": true,
    "sort_order": 600,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "medical_content"
    }
  },
  {
    "field_key": "scenario_medical_content_formatting",
    "label_ar": "تنسيق المحتوى الطبي — موقف عملي",
    "help_ar": "مهمة عملية: وصلتك مقالة طبية طويلة وغير مرتبة تتضمن عنواناً وعناوين فرعية ومراجع وصوراً. كيف ستعيد تنظيمها دون تغيير المعلومات أو فقدان المراجع؟ يمكنك الإجابة حتى لو كانت خبرتك محدودة؛ صف طريقة تفكيرك، ولا تذكر معلومات شخصية لمرضى أو متطوعين.",
    "field_type": "textarea",
    "required": true,
    "sort_order": 601,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "medical_content_formatting"
    }
  },
  {
    "field_key": "scenario_design",
    "label_ar": "التصميم الجرافيكي والبوسترات — موقف عملي",
    "help_ar": "مهمة عملية: طُلب منك تصميم بوستر توعوي عاجل لميدلايف خلال ساعات. صف خطواتك من استلام النص حتى التسليم، وكيف تحافظ على الهوية البصرية والشعار ودقة المعلومات. يمكنك الإجابة حتى لو كانت خبرتك محدودة؛ صف طريقة تفكيرك، ولا تذكر معلومات شخصية لمرضى أو متطوعين.",
    "field_type": "textarea",
    "required": true,
    "sort_order": 602,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "design"
    }
  },
  {
    "field_key": "scenario_video_editing",
    "label_ar": "مونتاج الفيديوهات — موقف عملي",
    "help_ar": "مهمة عملية: لديك 8 لقطات هاتف من فعالية طبية وصوت متفاوت الجودة وتحتاج ريل مدته 45 ثانية. كيف ترتب اللقطات وتعالج الصوت وتحافظ على خصوصية المشاركين؟ يمكنك الإجابة حتى لو كانت خبرتك محدودة؛ صف طريقة تفكيرك، ولا تذكر معلومات شخصية لمرضى أو متطوعين.",
    "field_type": "textarea",
    "required": true,
    "sort_order": 603,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "video_editing"
    }
  },
  {
    "field_key": "scenario_visual_media",
    "label_ar": "الإعلام المرئي — موقف عملي",
    "help_ar": "موقف عملي: أثناء تصوير فعالية، ظهر مريض بوضوح أمام الكاميرا ولم يوافق على التصوير. ما تصرفك؟ وكيف تحضر مقابلة قصيرة تحترم الخصوصية وتوصل الرسالة؟ يمكنك الإجابة حتى لو كانت خبرتك محدودة؛ صف طريقة تفكيرك، ولا تذكر معلومات شخصية لمرضى أو متطوعين.",
    "field_type": "textarea",
    "required": true,
    "sort_order": 604,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "visual_media"
    }
  },
  {
    "field_key": "scenario_field_work",
    "label_ar": "القسم الميداني — موقف عملي",
    "help_ar": "موقف عملي: قبل نشاط ميداني بساعة تغيب عدد من المتطوعين، وهناك ازدحام ونقص مواد. كيف تعيد توزيع المهام وتحدد الأولويات وتحافظ على سلامة المشاركين؟ يمكنك الإجابة حتى لو كانت خبرتك محدودة؛ صف طريقة تفكيرك، ولا تذكر معلومات شخصية لمرضى أو متطوعين.",
    "field_type": "textarea",
    "required": true,
    "sort_order": 605,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "field_work"
    }
  },
  {
    "field_key": "scenario_university_media",
    "label_ar": "الإعلام الجامعي — موقف عملي",
    "help_ar": "مهمة عملية: مطلوب تعريف 30 طالباً بميدلايف داخل جامعتك من دون ميزانية كبيرة. صف طريقة الوصول للطلاب والتنظيم والتواصل والقياس بعد النشاط. يمكنك الإجابة حتى لو كانت خبرتك محدودة؛ صف طريقة تفكيرك، ولا تذكر معلومات شخصية لمرضى أو متطوعين.",
    "field_type": "textarea",
    "required": true,
    "sort_order": 606,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "university_media"
    }
  },
  {
    "field_key": "scenario_voice_over",
    "label_ar": "التعليق الصوتي — موقف عملي",
    "help_ar": "مهمة عملية: استلمت نصاً طبياً يتضمن مصطلحات إنكليزية صعبة وتحتاج تسجيل دقيقة صوتية واضحة خلال يوم. كيف تتحقق من النطق وتضبط الصوت وتراجع التسجيل؟ يمكنك الإجابة حتى لو كانت خبرتك محدودة؛ صف طريقة تفكيرك، ولا تذكر معلومات شخصية لمرضى أو متطوعين.",
    "field_type": "textarea",
    "required": true,
    "sort_order": 607,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "voice_over"
    }
  },
  {
    "field_key": "scenario_it",
    "label_ar": "تقنية المعلومات IT — موقف عملي",
    "help_ar": "موقف عملي: أبلغ عدة متطوعين أن تسجيل الدخول للمنصة لا يعمل بعد تحديث جديد. ما أول خطوات التشخيص؟ وكيف تحمي بيانات المستخدمين وتتحقق من الحل قبل نشره؟ يمكنك الإجابة حتى لو كانت خبرتك محدودة؛ صف طريقة تفكيرك، ولا تذكر معلومات شخصية لمرضى أو متطوعين.",
    "field_type": "textarea",
    "required": true,
    "sort_order": 608,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "it"
    }
  },
  {
    "field_key": "scenario_telegram",
    "label_ar": "إدارة التليجرام — موقف عملي",
    "help_ar": "موقف عملي: وصل منشور طبي عاجل مع صورة لكن معلوماته ناقصة، وهناك ضغط لنشره فوراً. كيف تتحقق منه وتنسق مع الفريق وتتعامل مع التعليقات بعد النشر؟ يمكنك الإجابة حتى لو كانت خبرتك محدودة؛ صف طريقة تفكيرك، ولا تذكر معلومات شخصية لمرضى أو متطوعين.",
    "field_type": "textarea",
    "required": true,
    "sort_order": 609,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "telegram"
    }
  },
  {
    "field_key": "scenario_instagram",
    "label_ar": "إدارة الإنستاغرام — موقف عملي",
    "help_ar": "مهمة عملية: صمّم تصوراً لستوري وريل توعوي من فعالية واحدة. كيف تختار الرسالة والتوقيت ونداء التفاعل، وما المؤشرات التي ستراجعها لقياس الأثر؟ يمكنك الإجابة حتى لو كانت خبرتك محدودة؛ صف طريقة تفكيرك، ولا تذكر معلومات شخصية لمرضى أو متطوعين.",
    "field_type": "textarea",
    "required": true,
    "sort_order": 610,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "instagram"
    }
  },
  {
    "field_key": "scenario_podcast_live",
    "label_ar": "البودكاست والبث المباشر — موقف عملي",
    "help_ar": "موقف عملي: أثناء بث صحي مباشر، قدّم أحد الضيوف معلومة علاجية قد تكون غير دقيقة. كيف تتعامل مع الموقف باحترام وتحمي الجمهور وتحافظ على سير الحوار؟ يمكنك الإجابة حتى لو كانت خبرتك محدودة؛ صف طريقة تفكيرك، ولا تذكر معلومات شخصية لمرضى أو متطوعين.",
    "field_type": "textarea",
    "required": true,
    "sort_order": 611,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "podcast_live"
    }
  },
  {
    "field_key": "scenario_medical_consultations",
    "label_ar": "الاستشارات الطبية — موقف عملي",
    "help_ar": "موقف مهني: وصلتك استشارة تحتوي بيانات حساسة وأعراضاً قد تدل على حالة إسعافية خارج حدود خبرتك. كيف تتعامل مع خصوصية المريض وتقيّم الحاجة للإحالة أو الرعاية الإسعافية؟ يمكنك الإجابة حتى لو كانت خبرتك محدودة؛ صف طريقة تفكيرك، ولا تذكر معلومات شخصية لمرضى أو متطوعين.",
    "field_type": "textarea",
    "required": true,
    "sort_order": 612,
    "visibility": {
      "mode": "when",
      "field_key": "primary_volunteer_field",
      "operator": "equals",
      "value": "medical_consultations"
    }
  }
];

const NEW_VOLUNTEER_EXTRA_FIELDS = [
  ...NEW_VOLUNTEER_SCENARIO_FIELDS,
  {"field_key":"academic_status_other","label_ar":"ما وضعك الدراسي أو المهني حالياً؟","field_type":"text","required":true,"sort_order":111,"visibility":{"mode":"when","field_key":"academic_status","operator":"equals","value":"other"}},
  {"field_key":"school_name","label_ar":"اسم المدرسة","field_type":"text","required":true,"sort_order":118,"visibility":{"mode":"when","field_key":"academic_status","operator":"equals","value":"school"}},
  {"field_key":"institute_name","label_ar":"اسم المعهد واختصاصك فيه","field_type":"text","required":true,"sort_order":119,"visibility":{"mode":"when","field_key":"academic_status","operator":"equals","value":"institute"}},
  {"field_key":"university_other","label_ar":"اكتب اسم الجامعة كاملاً","field_type":"text","required":true,"sort_order":120.5,"visibility":{"mode":"when","field_key":"university","operator":"equals","value":"other"}},
  {"field_key":"study_field","label_ar":"ما الاختصاص الذي تدرسه أو تخرجت منه؟","field_type":"select","required":true,"sort_order":121.1,"options":[{"value":"human_medicine","label_ar":"طب بشري"},{"value":"dentistry","label_ar":"طب أسنان"},{"value":"pharmacy","label_ar":"صيدلة"},{"value":"nursing","label_ar":"تمريض"},{"value":"other","label_ar":"اختصاص آخر"}],"visibility":{"mode":"when","field_key":"academic_status","operator":"in","value":"university,graduate,postgraduate"}},
  {"field_key":"study_field_other","label_ar":"ما الاختصاص الذي تدرسه؟ (اذكره كما هو مسجل في جامعتك)","field_type":"text","required":true,"sort_order":121.2,"visibility":{"mode":"when","field_key":"study_field","operator":"equals","value":"other"}},
  {"field_key":"medical_profession","label_ar":"ما المجال الطبي الذي تنتمي إليه؟","field_type":"select","required":true,"sort_order":122.1,"options":[{"value":"human_medicine","label_ar":"طب بشري"},{"value":"dentistry","label_ar":"طب أسنان"},{"value":"pharmacy","label_ar":"صيدلة"}],"visibility":{"mode":"when","field_key":"academic_status","operator":"in","value":"doctor,resident_doctor,specialist,pharmacist"}},
  {"field_key":"resident_specialty_other","label_ar":"اذكر اسم اختصاص الإقامة غير الموجود بالقائمة","field_type":"text","required":true,"sort_order":123.1,"visibility":{"mode":"when","field_key":"resident_specialty","operator":"equals","value":"other"}},
  {"field_key":"residency_start_year","label_ar":"سنة بدء الإقامة الفعلية (تاريخ المباشرة)","field_type":"number","required":true,"sort_order":124.4,"validation":{"min":1980,"max":2100,"step":1},"help_ar":"اكتب سنة بدء المباشرة الفعلية في المشفى، وليس سنة التخرج.","visibility":{"mode":"when","field_key":"academic_status","operator":"equals","value":"resident_doctor"}},
  {"field_key":"residency_program","label_ar":"ما نظام الإقامة أو الجهة التدريبية؟","field_type":"select","required":true,"sort_order":124.6,"options":[{"value":"syrian_board","label_ar":"الهيئة السورية للاختصاصات الطبية / البورد السوري"},{"value":"university","label_ar":"الدراسات العليا / الجامعة"},{"value":"health_ministry","label_ar":"برنامج تابع لوزارة الصحة"},{"value":"other","label_ar":"جهة تدريبية أخرى"}],"visibility":{"mode":"when","field_key":"academic_status","operator":"equals","value":"resident_doctor"}},
  {"field_key":"residency_program_other","label_ar":"اذكر الجهة التدريبية الأخرى","field_type":"text","required":true,"sort_order":124.7,"visibility":{"mode":"when","field_key":"residency_program","operator":"equals","value":"other"}},
  {"field_key":"doctor_specialty_other","label_ar":"اذكر اختصاصك غير المدرج","field_type":"text","required":true,"sort_order":126.1,"visibility":{"mode":"when","field_key":"doctor_specialty","operator":"equals","value":"other"}},
  {"field_key":"specialty_other","label_ar":"اذكر اختصاصك غير المدرج","field_type":"text","required":true,"sort_order":127.1,"visibility":{"mode":"when","field_key":"specialty","operator":"equals","value":"other"}},
  {"field_key":"phone_country_code","label_ar":"رمز اتصال بلد الواتساب","field_type":"select","required":true,"sort_order":55,"options":[{"value":"+963","label_ar":"سوريا +963"},{"value":"+961","label_ar":"لبنان +961"},{"value":"+90","label_ar":"تركيا +90"},{"value":"+962","label_ar":"الأردن +962"},{"value":"+964","label_ar":"العراق +964"},{"value":"+970","label_ar":"فلسطين +970"},{"value":"+972","label_ar":"إسرائيل +972"},{"value":"+20","label_ar":"مصر +20"},{"value":"+966","label_ar":"السعودية +966"},{"value":"+971","label_ar":"الإمارات +971"},{"value":"+974","label_ar":"قطر +974"},{"value":"+965","label_ar":"الكويت +965"},{"value":"+968","label_ar":"عُمان +968"},{"value":"+973","label_ar":"البحرين +973"},{"value":"+967","label_ar":"اليمن +967"},{"value":"+31","label_ar":"هولندا +31"},{"value":"+49","label_ar":"ألمانيا +49"},{"value":"+33","label_ar":"فرنسا +33"},{"value":"+44","label_ar":"المملكة المتحدة +44"},{"value":"+1","label_ar":"الولايات المتحدة / كندا +1"},{"value":"+46","label_ar":"السويد +46"},{"value":"+47","label_ar":"النرويج +47"},{"value":"+45","label_ar":"الدنمارك +45"},{"value":"+32","label_ar":"بلجيكا +32"},{"value":"+41","label_ar":"سويسرا +41"},{"value":"+43","label_ar":"النمسا +43"},{"value":"+39","label_ar":"إيطاليا +39"},{"value":"+34","label_ar":"إسبانيا +34"},{"value":"+7","label_ar":"روسيا / كازاخستان +7"},{"value":"+61","label_ar":"أستراليا +61"},{"value":"+64","label_ar":"نيوزيلندا +64"},{"value":"+91","label_ar":"الهند +91"},{"value":"+86","label_ar":"الصين +86"},{"value":"+81","label_ar":"اليابان +81"},{"value":"+82","label_ar":"كوريا الجنوبية +82"},{"value":"+92","label_ar":"باكستان +92"},{"value":"+98","label_ar":"إيران +98"},{"value":"+27","label_ar":"جنوب أفريقيا +27"},{"value":"other","label_ar":"رمز دولة أخرى (أدخله يدوياً)"}],"help_ar":"اختر رمز الاتصال الدولي الذي يبدأ به رقمك، حتى لو كان مختلفاً عن بلد إقامتك."},
  {"field_key":"phone_dial_other","label_ar":"اكتب رمز الاتصال الدولي (مثل +358)","field_type":"text","required":true,"sort_order":55.5,"visibility":{"mode":"when","field_key":"phone_country_code","operator":"equals","value":"other"}},
  {"field_key":"whatsapp_confirmed","label_ar":"هل الرقم أعلاه مرتبط بحساب واتساب نشط ويمكن التواصل معك عبره؟","field_type":"select","required":true,"sort_order":61,"options":[{"value":"yes","label_ar":"نعم، هذا الرقم مرتبط بواتساب وأستطيع استقبال الرسائل"},{"value":"no","label_ar":"لا، ليس لدي واتساب على هذا الرقم"}],"help_ar":"نستخدم واتساب للتواصل بخصوص المقابلات وقبول المتطوعين. لا يُرسل طلبك إن كان الرقم غير مفعّل على واتساب."},
  ...LEGACY_RECRUITMENT_REFERENCE_FIELDS,
  {
    field_key:"other_country",label_ar:"اختر بلد الإقامة من قائمة الدول",field_type:"select",required:true,sort_order:85,
    help_ar:"تظهر هذه القائمة عند اختيار «أخرى» بدلاً من سوريا، ويمكن البحث عن البلد بكتابة اسمه داخل القائمة في بعض المتصفحات.",
    options:INTAKE_OTHER_COUNTRIES,
    visibility:{mode:"when",field_key:"country",operator:"equals",value:"أخرى"},
  },
  {
    field_key:"foreign_region",label_ar:"المحافظة أو الولاية أو المنطقة في بلد الإقامة",field_type:"text",required:true,sort_order:91,
    visibility:{mode:"when",field_key:"country",operator:"equals",value:"أخرى"},
  },
  {
    field_key:"medical_consultation_specialties",label_ar:"اختر اختصاصاً أو اختصاصين للاستشارات الطبية والصيدلانية",field_type:"multi_select",required:true,sort_order:312,
    help_ar:"الحد الأقصى اختصاصان. تُعرض اختصاصات الطب البشري أو طب الأسنان أو الصيدلة حسب المجال المهني، ويُراجع المؤهل والترخيص قبل تكليف المتطوع بأي استشارة.",
    options:INTAKE_ALL_SPECIALTIES,
    visibility:{mode:"when",field_key:"primary_volunteer_field",operator:"equals",value:"medical_consultations"},
  },
  {
    field_key: "volunteer_interest_preferences", label_ar: "ترتيب مجالات التطوع المفضلة",
    help_ar: "أولوية أولى إلزامية وأولويتان إضافيتان اختياريتان؛ ليست تعييناً لأي خلية أو قسم.",
    field_type: "multi_select", required: true, sort_order: 151,
    options: NEW_VOLUNTEER_CATEGORIES,
  },
  {
    field_key: "podcast_experience", label_ar: "هل لديك خبرة في إعداد وتقديم البودكاست أو البث المباشر؟",
    field_type: "select", required: true, sort_order: 385,
    options: [
      {value: "experienced", label_ar: "نعم، لدي خبرة عملية"},
      {value: "some", label_ar: "لدي تجربة بسيطة"},
      {value: "learn", label_ar: "لا، لكنني أرغب بالتعلم"},
    ],
    visibility: {mode: "when", field_key: "primary_volunteer_field", operator: "equals", value: "podcast_live"},
  },
  {
    field_key: "podcast_skills", label_ar: "ما الأدوار التي تستطيع تنفيذها في البودكاست والبث المباشر؟",
    field_type: "multi_select", required: true, sort_order: 386,
    options: [
      {value:"hosting",label_ar:"التقديم وإدارة الحوار"},
      {value:"planning",label_ar:"إعداد المحاور والبحث"},
      {value:"recording",label_ar:"التسجيل الصوتي وتصوير الفيديو"},
      {value:"streaming",label_ar:"إدارة البث المباشر والأجهزة"},
      {value:"editing",label_ar:"تحرير الحلقات وإنتاجها"},
    ],
    visibility: {mode: "when", field_key: "primary_volunteer_field", operator: "equals", value: "podcast_live"},
  },
  {
    field_key: "telegram_channel_experience",
    label_ar: "ما مدى خبرتك في إدارة قنوات التليجرام وجدولة المنشورات؟",
    field_type: "select", required: true, sort_order: 387,
    options: [
      {value:"experienced",label_ar:"أدرت قناة أو مجموعة ونشرت محتوى بانتظام"},
      {value:"basic",label_ar:"أعرف أساسيات النشر والإشراف"},
      {value:"learn",label_ar:"لا أملك خبرة لكنني أرغب بالتدرب"},
    ],
    visibility: {mode:"when",field_key:"primary_volunteer_field",operator:"equals",value:"telegram"},
  },
  {
    field_key: "instagram_content_experience",
    label_ar: "ما مدى خبرتك في نشر القصص والريلز ومتابعة تفاعل الجمهور عبر الإنستاغرام؟",
    field_type: "select", required: true, sort_order: 388,
    options: [
      {value:"experienced",label_ar:"عملت على محتوى إنستاغرام وتحليل أدائه"},
      {value:"basic",label_ar:"أتقن النشر الأساسي للمنشورات والقصص"},
      {value:"learn",label_ar:"لا أملك خبرة لكنني أرغب بالتدرب"},
    ],
    visibility: {mode:"when",field_key:"primary_volunteer_field",operator:"equals",value:"instagram"},
  },
  {
    field_key: "practical_skills", label_ar: "ما المهارات العملية التي تتقنها ويمكنك توظيفها في ميدلايف؟",
    help_ar: "اذكر مهارات محددة مع أمثلة قصيرة، مثل الكتابة أو التصوير أو البحث أو التنظيم.",
    field_type: "textarea", required: true, sort_order: 155,
  },
  {
    field_key: "tools_used", label_ar: "ما البرامج والأدوات التي تجيد استخدامها؟",
    help_ar: "مثال: Canva، Photoshop، CapCut، Microsoft Office، Notion أو أدوات أخرى.",
    field_type: "textarea", required: false, sort_order: 195,
  },
  {
    field_key: "volunteer_history", label_ar: "هل سبق لك المشاركة في عمل تطوعي أو مبادرات مجتمعية؟",
    field_type: "select", required: true, sort_order: 400,
    options: [
      { value: "yes", label_ar: "نعم، لدي تجارب سابقة" },
      { value: "no", label_ar: "لا، وهذه ستكون تجربتي الأولى" },
    ],
  },
  {
    field_key: "previous_volunteer_experience", label_ar: "اشرح خبراتك التطوعية السابقة ودورك فيها",
    help_ar: "يمكنك ذكر الجهة، المهام التي نفذتها، والفترة أو الأثر الذي حققته دون مشاركة بيانات أشخاص آخرين.",
    field_type: "textarea", required: true, sort_order: 410,
    visibility: { mode: "when", field_key: "volunteer_history", operator: "equals", value: "yes" },
  },
  {
    field_key: "collaboration_example", label_ar: "اذكر موقفاً عملت فيه مع فريق لحل مشكلة أو تنفيذ مهمة",
    field_type: "textarea", required: false, sort_order: 420,
  },
  {
    field_key: "preferred_work_mode", label_ar: "ما نمط التطوع الأنسب لك؟",
    field_type: "select", required: true, sort_order: 430,
    options: [
      { value: "remote", label_ar: "عن بُعد" },
      { value: "onsite", label_ar: "ميدانياً / حضورياً" },
      { value: "both", label_ar: "كلاهما حسب الحاجة" },
    ],
  },
  {
    field_key: "availability_days", label_ar: "ما الأيام التي يتوفر لديك فيها وقت للتطوع؟",
    field_type: "multi_select", required: false, sort_order: 440,
    options: [
      { value: "sat", label_ar: "السبت" }, { value: "sun", label_ar: "الأحد" },
      { value: "mon", label_ar: "الاثنين" }, { value: "tue", label_ar: "الثلاثاء" },
      { value: "wed", label_ar: "الأربعاء" }, { value: "thu", label_ar: "الخميس" },
      { value: "fri", label_ar: "الجمعة" }, { value: "flexible", label_ar: "حسب الحاجة" },
    ],
  },
  {
    field_key: "training_goals", label_ar: "ما المهارات التي ترغب في تطويرها خلال تطوعك معنا؟",
    field_type: "textarea", required: false, sort_order: 450,
  },
].map(field => ({
  options: [], validation: {}, visibility: { mode: "always" },
  target_unit_ids: [], target_unit_types: [], is_active: true,
  ...field,
}));


// Recruitment revision: shared by preview reads and server-side submission validation.
const INTAKE_REVISIONS = {
  "practical_skills": {
    "label_ar": "ما المهارات التي تمتلكها وترغب في توظيفها ضمن مؤسسة ميدلايف؟",
    "field_type": "multi_select",
    "options": [
      {
        "value": "writing",
        "label_ar": "الكتابة وصياغة المحتوى"
      },
      {
        "value": "research",
        "label_ar": "البحث العلمي وجمع المعلومات"
      },
      {
        "value": "review",
        "label_ar": "التدقيق اللغوي والعلمي"
      },
      {
        "value": "design",
        "label_ar": "التصميم الجرافيكي"
      },
      {
        "value": "photo",
        "label_ar": "التصوير الفوتوغرافي"
      },
      {
        "value": "video",
        "label_ar": "تصوير وتحرير الفيديو"
      },
      {
        "value": "speaking",
        "label_ar": "الإلقاء والتحدث أمام الجمهور"
      },
      {
        "value": "voice",
        "label_ar": "التعليق الصوتي"
      },
      {
        "value": "social",
        "label_ar": "إدارة منصات التواصل الاجتماعي"
      },
      {
        "value": "events",
        "label_ar": "تنظيم الفعاليات والأنشطة"
      },
      {
        "value": "communication",
        "label_ar": "التواصل وبناء العلاقات"
      },
      {
        "value": "team",
        "label_ar": "العمل الجماعي وقيادة الفرق"
      },
      {
        "value": "training",
        "label_ar": "التدريب والتعليم"
      },
      {
        "value": "coding",
        "label_ar": "البرمجة وتطوير المواقع"
      },
      {
        "value": "data",
        "label_ar": "تحليل البيانات وإعداد التقارير"
      },
      {
        "value": "projects",
        "label_ar": "إدارة المشاريع والتخطيط"
      },
      {
        "value": "none",
        "label_ar": "لا أمتلك خبرة حالياً ولكنني مستعد للتعلم"
      },
      {
        "value": "other",
        "label_ar": "أخرى"
      }
    ],
    "help_ar": "يمكنك اختيار أكثر من خيار.",
    "validation": {}
  },
  "tools_used": {
    "label_ar": "ما البرامج والأدوات الرقمية التي تجيد استخدامها؟",
    "field_type": "multi_select",
    "options": [
      {
        "value": "tool_1",
        "label_ar": "Microsoft Word"
      },
      {
        "value": "tool_2",
        "label_ar": "Microsoft Excel"
      },
      {
        "value": "tool_3",
        "label_ar": "Microsoft PowerPoint"
      },
      {
        "value": "tool_4",
        "label_ar": "Google Workspace"
      },
      {
        "value": "tool_5",
        "label_ar": "Notion"
      },
      {
        "value": "tool_6",
        "label_ar": "Trello"
      },
      {
        "value": "tool_7",
        "label_ar": "Canva"
      },
      {
        "value": "tool_8",
        "label_ar": "Adobe Photoshop"
      },
      {
        "value": "tool_9",
        "label_ar": "Adobe Illustrator"
      },
      {
        "value": "tool_10",
        "label_ar": "Figma"
      },
      {
        "value": "tool_11",
        "label_ar": "CapCut"
      },
      {
        "value": "tool_12",
        "label_ar": "Adobe Premiere Pro"
      },
      {
        "value": "tool_13",
        "label_ar": "Adobe After Effects"
      },
      {
        "value": "tool_14",
        "label_ar": "DaVinci Resolve"
      },
      {
        "value": "tool_15",
        "label_ar": "Adobe Audition"
      },
      {
        "value": "tool_16",
        "label_ar": "PubMed"
      },
      {
        "value": "tool_17",
        "label_ar": "Google Scholar"
      },
      {
        "value": "tool_18",
        "label_ar": "Zotero"
      },
      {
        "value": "tool_19",
        "label_ar": "Mendeley"
      },
      {
        "value": "tool_20",
        "label_ar": "ChatGPT"
      },
      {
        "value": "tool_21",
        "label_ar": "GitHub"
      },
      {
        "value": "tool_22",
        "label_ar": "Visual Studio Code"
      },
      {
        "value": "tool_23",
        "label_ar": "Supabase"
      },
      {
        "value": "tool_24",
        "label_ar": "Cloudflare"
      },
      {
        "value": "other_ai",
        "label_ar": "أدوات ذكاء اصطناعي أخرى"
      },
      {
        "value": "none",
        "label_ar": "لا أجيد أياً من الأدوات المذكورة"
      },
      {
        "value": "other",
        "label_ar": "أخرى"
      }
    ],
    "help_ar": "يمكنك اختيار أكثر من خيار.",
    "validation": {}
  },
  "weekly_availability": {
    "label_ar": "كم ساعة يمكنك تخصيصها أسبوعياً للعمل التطوعي ضمن مؤسسة ميدلايف؟",
    "field_type": "select",
    "options": [
      {
        "value": "1",
        "label_ar": "أقل من ساعتين"
      },
      {
        "value": "2",
        "label_ar": "من ساعتين إلى أقل من 4 ساعات"
      },
      {
        "value": "3",
        "label_ar": "من 4 إلى أقل من 6 ساعات"
      },
      {
        "value": "4",
        "label_ar": "من 6 إلى أقل من 10 ساعات"
      },
      {
        "value": "5",
        "label_ar": "من 10 إلى 15 ساعة"
      },
      {
        "value": "6",
        "label_ar": "أكثر من 15 ساعة"
      },
      {
        "value": "7",
        "label_ar": "يتغير وقت تفرغي بحسب ظروف الدراسة أو العمل"
      }
    ],
    "help_ar": "",
    "validation": {}
  },
  "what_stands_out": {
    "label_ar": "ما الذي جذبك إلى مؤسسة ميدلايف وشجعك على الانضمام إلى فريقها؟",
    "help_ar": "أجب باختصار."
  },
  "expected_contribution": {
    "label_ar": "ما الإضافة التي تطمح إلى تقديمها لمؤسسة ميدلايف، سواء من خلال مهاراتك أو أفكارك ومبادراتك المستقبلية؟",
    "help_ar": "اذكر فكرة أو مساهمة واقعية باختصار."
  },
  "field_work_governorate": {
    "label_ar": "في أي محافظة ترغب بالمشاركة في أنشطة مؤسسة ميدلايف الميدانية؟",
    "field_type": "select",
    "options": [
      {
        "value": "طرطوس",
        "label_ar": "طرطوس"
      },
      {
        "value": "اللاذقية",
        "label_ar": "اللاذقية"
      },
      {
        "value": "حمص",
        "label_ar": "حمص"
      },
      {
        "value": "حماة",
        "label_ar": "حماة"
      },
      {
        "value": "دمشق",
        "label_ar": "دمشق"
      },
      {
        "value": "ريف دمشق",
        "label_ar": "ريف دمشق"
      },
      {
        "value": "حلب",
        "label_ar": "حلب"
      },
      {
        "value": "إدلب",
        "label_ar": "إدلب"
      },
      {
        "value": "درعا",
        "label_ar": "درعا"
      },
      {
        "value": "السويداء",
        "label_ar": "السويداء"
      },
      {
        "value": "القنيطرة",
        "label_ar": "القنيطرة"
      },
      {
        "value": "دير الزور",
        "label_ar": "دير الزور"
      },
      {
        "value": "الرقة",
        "label_ar": "الرقة"
      },
      {
        "value": "الحسكة",
        "label_ar": "الحسكة"
      },
      {
        "value": "محافظة أخرى",
        "label_ar": "محافظة أخرى"
      }
    ],
    "visibility": {
      "mode": "when",
      "field_key": "volunteer_interest_preferences",
      "operator": "intersects",
      "value": [
        "field_work"
      ]
    }
  },
  "availability_days": {
    "label_ar": "ما الأيام التي يمكنك المشاركة فيها بالأنشطة الميدانية؟",
    "visibility": {
      "mode": "when",
      "field_key": "volunteer_interest_preferences",
      "operator": "intersects",
      "value": [
        "field_work"
      ]
    },
    "sort_order": 271,
    "required": true,
    "help_ar": "حدد الأيام المناسبة أو اختر بحسب موعد النشاط.",
    "options": [
      {
        "value": "sat",
        "label_ar": "السبت"
      },
      {
        "value": "sun",
        "label_ar": "الأحد"
      },
      {
        "value": "mon",
        "label_ar": "الاثنين"
      },
      {
        "value": "tue",
        "label_ar": "الثلاثاء"
      },
      {
        "value": "wed",
        "label_ar": "الأربعاء"
      },
      {
        "value": "thu",
        "label_ar": "الخميس"
      },
      {
        "value": "fri",
        "label_ar": "الجمعة"
      },
      {
        "value": "flexible",
        "label_ar": "بحسب موعد النشاط"
      }
    ]
  },
  "scenario_medical_content": {
    "label_ar": "وجدت معلومة طبية منتشرة على وسائل التواصل تتعارض مع بعض المصادر الطبية. كيف تتصرف؟",
    "field_type": "select",
    "options": [
      {
        "value": "1",
        "label_ar": "أعتمد المعلومة لأنها منتشرة"
      },
      {
        "value": "2",
        "label_ar": "أراجع المصادر الطبية الموثوقة والحديثة قبل اعتمادها"
      },
      {
        "value": "3",
        "label_ar": "أحذف المعلومة دون محاولة التحقق منها"
      },
      {
        "value": "4",
        "label_ar": "أعرض المعلومتين دون التحقق من صحتهما"
      }
    ],
    "help_ar": "اختر الإجراء الأقرب لطريقة تفكيرك.",
    "validation": {},
    "sort_order": 600
  },
  "it_skills": {
    "label_ar": "ما المجالات التقنية التي تمتلك خبرة فيها أو ترغب في المساهمة بها؟",
    "field_type": "multi_select",
    "options": [
      {
        "value": "frontend",
        "label_ar": "تطوير واجهات المواقع Frontend"
      },
      {
        "value": "backend",
        "label_ar": "تطوير الأنظمة Backend"
      },
      {
        "value": "fullstack",
        "label_ar": "تطوير المواقع المتكاملة Full Stack"
      },
      {
        "value": "ux",
        "label_ar": "تصميم تجربة المستخدم UI/UX"
      },
      {
        "value": "database",
        "label_ar": "إدارة قواعد البيانات"
      },
      {
        "value": "qa",
        "label_ar": "اختبار الأنظمة واكتشاف الأخطاء QA"
      },
      {
        "value": "security",
        "label_ar": "الأمن السيبراني وحماية البيانات"
      },
      {
        "value": "hosting",
        "label_ar": "إدارة المواقع والاستضافة"
      },
      {
        "value": "automation",
        "label_ar": "الأتمتة والتكامل بين الأنظمة"
      },
      {
        "value": "data",
        "label_ar": "تحليل البيانات ولوحات المعلومات"
      },
      {
        "value": "support",
        "label_ar": "الدعم التقني"
      },
      {
        "value": "other",
        "label_ar": "أخرى"
      }
    ],
    "help_ar": "يمكنك اختيار أكثر من خيار.",
    "validation": {},
    "visibility": {
      "mode": "when",
      "field_key": "volunteer_interest_preferences",
      "operator": "intersects",
      "value": [
        "it"
      ]
    }
  },
  "it_tools": {
    "label_ar": "ما التقنيات التي سبق لك العمل بها؟",
    "field_type": "multi_select",
    "options": [
      {
        "value": "tech_1",
        "label_ar": "HTML / CSS / JavaScript"
      },
      {
        "value": "tech_2",
        "label_ar": "TypeScript"
      },
      {
        "value": "tech_3",
        "label_ar": "React / Next.js"
      },
      {
        "value": "tech_4",
        "label_ar": "Node.js"
      },
      {
        "value": "tech_5",
        "label_ar": "Python"
      },
      {
        "value": "tech_6",
        "label_ar": "SQL / PostgreSQL"
      },
      {
        "value": "tech_7",
        "label_ar": "Supabase"
      },
      {
        "value": "tech_8",
        "label_ar": "Cloudflare"
      },
      {
        "value": "tech_9",
        "label_ar": "Git / GitHub"
      },
      {
        "value": "tech_10",
        "label_ar": "REST APIs"
      },
      {
        "value": "none",
        "label_ar": "لا أمتلك خبرة سابقة"
      },
      {
        "value": "other",
        "label_ar": "أخرى"
      }
    ],
    "help_ar": "يمكنك اختيار أكثر من خيار.",
    "validation": {},
    "visibility": {
      "mode": "when",
      "field_key": "volunteer_interest_preferences",
      "operator": "intersects",
      "value": [
        "it"
      ]
    },
    "required": true
  },
  "it_prior_projects": {
    "label_ar": "هل سبق لك تطوير موقع إلكتروني أو تطبيق أو نظام إداري؟",
    "visibility": {
      "mode": "when",
      "field_key": "volunteer_interest_preferences",
      "operator": "intersects",
      "value": [
        "it"
      ]
    }
  },
  "it_project_links": {
    "visibility": {
      "mode": "when",
      "field_key": "it_prior_projects",
      "operator": "equals",
      "value": "1"
    },
    "help_ar": "أضف رابط مشروع أو مستودع كود إن وجد."
  },
  "scenario_it": {
    "label_ar": "أبلغ أحد المتطوعين أن المنصة لا تحفظ تعديلاته، بينما تعمل لدى مستخدمين آخرين. ما أول إجراء تقوم به؟",
    "field_type": "select",
    "options": [
      {
        "value": "1",
        "label_ar": "أعيد بناء الميزة بالكامل"
      },
      {
        "value": "2",
        "label_ar": "أجمع تفاصيل المشكلة وأحاول إعادة إنتاجها وأراجع الصلاحيات والسجلات"
      },
      {
        "value": "3",
        "label_ar": "أطلب منه استخدام حساب شخص آخر"
      },
      {
        "value": "4",
        "label_ar": "أتجاهل المشكلة لأنها لا تحدث لدى الجميع"
      }
    ],
    "help_ar": "",
    "validation": {},
    "visibility": {
      "mode": "when",
      "field_key": "volunteer_interest_preferences",
      "operator": "intersects",
      "value": [
        "it"
      ]
    },
    "sort_order": 384
  },
  "medical_consultation_capacity": {
    "label_ar": "هل يمكنك متابعة الطلبات المسندة إليك بشكل منتظم؟",
    "field_type": "select",
    "options": [
      {
        "value": "1",
        "label_ar": "نعم، بشكل يومي"
      },
      {
        "value": "2",
        "label_ar": "نعم، عدة مرات أسبوعياً"
      },
      {
        "value": "3",
        "label_ar": "ضمن أوقات محددة يتم الاتفاق عليها مسبقاً"
      },
      {
        "value": "4",
        "label_ar": "لا أستطيع الالتزام بمتابعة منتظمة حالياً"
      }
    ],
    "help_ar": "",
    "validation": {},
    "visibility": {
      "mode": "when",
      "field_key": "volunteer_interest_preferences",
      "operator": "intersects",
      "value": [
        "medical_consultations"
      ]
    },
    "sort_order": 320
  },
  "scenario_medical_consultations": {
    "label_ar": "تلقيت استشارة تتضمن أعراضاً قد تشير إلى حالة إسعافية. كيف تتصرف؟",
    "field_type": "select",
    "options": [
      {
        "value": "1",
        "label_ar": "أقدم علاجاً إلكترونياً دون فحص المريض"
      },
      {
        "value": "2",
        "label_ar": "أوجه المستفيد فوراً لطلب الرعاية الإسعافية المناسبة دون تأخير"
      },
      {
        "value": "3",
        "label_ar": "أنتظر معلومات إضافية قبل توجيهه"
      },
      {
        "value": "4",
        "label_ar": "أترك الطلب دون متابعة"
      }
    ],
    "help_ar": "",
    "validation": {},
    "visibility": {
      "mode": "when",
      "field_key": "volunteer_interest_preferences",
      "operator": "intersects",
      "value": [
        "medical_consultations"
      ]
    },
    "sort_order": 324
  }
};
const INTAKE_ADDITIONS = [
  {
    "field_key": "practical_skills_other",
    "field_type": "text",
    "label_ar": "اذكر المهارات الأخرى",
    "sort_order": 156,
    "visibility": {
      "mode": "when",
      "field_key": "practical_skills",
      "operator": "contains",
      "value": "other"
    },
    "required": true,
    "options": [],
    "validation": {},
    "target_unit_ids": [],
    "target_unit_types": [],
    "is_active": true
  },
  {
    "field_key": "tools_used_other",
    "field_type": "text",
    "label_ar": "اذكر الأدوات الأخرى",
    "sort_order": 196,
    "visibility": {
      "mode": "when",
      "field_key": "tools_used",
      "operator": "contains",
      "value": "other"
    },
    "required": true,
    "options": [],
    "validation": {},
    "target_unit_ids": [],
    "target_unit_types": [],
    "is_active": true
  },
  {
    "field_key": "scenario_medical_content_reason",
    "field_type": "text",
    "label_ar": "وضح سبب اختيارك بجملة واحدة.",
    "sort_order": 601,
    "visibility": {
      "mode": "when",
      "field_key": "volunteer_interest_preferences",
      "operator": "intersects",
      "value": [
        "medical_content"
      ]
    },
    "required": true,
    "options": [],
    "validation": {},
    "target_unit_ids": [],
    "target_unit_types": [],
    "is_active": true,
    "help_ar": "إجابة قصيرة توضح طريقة تفكيرك."
  },
  {
    "field_key": "field_work_governorate_other",
    "field_type": "text",
    "label_ar": "اكتب اسم المحافظة أو المنطقة",
    "sort_order": 270.1,
    "visibility": {
      "mode": "when",
      "field_key": "field_work_governorate",
      "operator": "equals",
      "value": "محافظة أخرى"
    },
    "required": true,
    "options": [],
    "validation": {},
    "target_unit_ids": [],
    "target_unit_types": [],
    "is_active": true
  },
  {
    "field_key": "field_work_times",
    "field_type": "multi_select",
    "label_ar": "ما الأوقات التي تناسبك عادةً؟",
    "sort_order": 272,
    "visibility": {
      "mode": "when",
      "field_key": "volunteer_interest_preferences",
      "operator": "intersects",
      "value": [
        "field_work"
      ]
    },
    "required": true,
    "options": [
      {
        "value": "morning",
        "label_ar": "الفترة الصباحية"
      },
      {
        "value": "evening",
        "label_ar": "الفترة المسائية"
      },
      {
        "value": "flexible",
        "label_ar": "بحسب طبيعة النشاط وموعده"
      }
    ],
    "validation": {},
    "target_unit_ids": [],
    "target_unit_types": [],
    "is_active": true
  },
  {
    "field_key": "it_skills_other",
    "field_type": "text",
    "label_ar": "اذكر المجال التقني الآخر",
    "sort_order": 380.1,
    "visibility": {
      "mode": "when",
      "field_key": "it_skills",
      "operator": "contains",
      "value": "other"
    },
    "required": true,
    "options": [],
    "validation": {},
    "target_unit_ids": [],
    "target_unit_types": [],
    "is_active": true
  },
  {
    "field_key": "it_tools_other",
    "field_type": "text",
    "label_ar": "اذكر التقنيات الأخرى",
    "sort_order": 381.1,
    "visibility": {
      "mode": "when",
      "field_key": "it_tools",
      "operator": "contains",
      "value": "other"
    },
    "required": true,
    "options": [],
    "validation": {},
    "target_unit_ids": [],
    "target_unit_types": [],
    "is_active": true
  },
  {
    "field_key": "it_level",
    "field_type": "select",
    "label_ar": "كيف تقيّم مستواك التقني الحالي؟",
    "sort_order": 381.2,
    "visibility": {
      "mode": "when",
      "field_key": "volunteer_interest_preferences",
      "operator": "intersects",
      "value": [
        "it"
      ]
    },
    "required": true,
    "options": [
      {
        "value": "1",
        "label_ar": "مبتدئ وفي مرحلة التعلم"
      },
      {
        "value": "2",
        "label_ar": "لدي معرفة أساسية وتجارب بسيطة"
      },
      {
        "value": "3",
        "label_ar": "متوسط وقادر على تنفيذ مهام مستقلة"
      },
      {
        "value": "4",
        "label_ar": "متقدم وقادر على تطوير أنظمة متكاملة"
      },
      {
        "value": "5",
        "label_ar": "خبير وقادر على الإشراف التقني"
      }
    ],
    "validation": {},
    "target_unit_ids": [],
    "target_unit_types": [],
    "is_active": true,
    "help_ar": ""
  },
  {
    "field_key": "it_project_description",
    "field_type": "textarea",
    "label_ar": "حدثنا باختصار عن المشروع ودورك فيه",
    "sort_order": 382.1,
    "visibility": {
      "mode": "when",
      "field_key": "it_prior_projects",
      "operator": "equals",
      "value": "1"
    },
    "required": true,
    "options": [],
    "validation": {},
    "target_unit_ids": [],
    "target_unit_types": [],
    "is_active": true
  },
  {
    "field_key": "it_security_scenario",
    "field_type": "select",
    "label_ar": "اكتشفت ثغرة تسمح لمستخدم بالوصول إلى بيانات خارج صلاحياته. كيف تتصرف؟",
    "sort_order": 384.1,
    "visibility": {
      "mode": "when",
      "field_key": "volunteer_interest_preferences",
      "operator": "intersects",
      "value": [
        "it"
      ]
    },
    "required": true,
    "options": [
      {
        "value": "1",
        "label_ar": "أبلغ المسؤول التقني بسرية وأساهم في معالجة الثغرة وفق الصلاحيات"
      },
      {
        "value": "2",
        "label_ar": "أنشر تفاصيل المشكلة في مجموعة المتطوعين"
      },
      {
        "value": "3",
        "label_ar": "أستخدم الثغرة للاطلاع على البيانات"
      },
      {
        "value": "4",
        "label_ar": "أتجاهلها طالما النظام يعمل"
      }
    ],
    "validation": {},
    "target_unit_ids": [],
    "target_unit_types": [],
    "is_active": true,
    "help_ar": ""
  },
  {
    "field_key": "it_task_preferences",
    "field_type": "multi_select",
    "label_ar": "ما طبيعة المهام التقنية التي تفضل المشاركة فيها؟",
    "sort_order": 384.2,
    "visibility": {
      "mode": "when",
      "field_key": "volunteer_interest_preferences",
      "operator": "intersects",
      "value": [
        "it"
      ]
    },
    "required": true,
    "options": [
      {
        "value": "1",
        "label_ar": "تطوير ميزات جديدة"
      },
      {
        "value": "2",
        "label_ar": "تحسين الميزات الموجودة"
      },
      {
        "value": "3",
        "label_ar": "اختبار المنصة وإعداد تقارير الأخطاء"
      },
      {
        "value": "4",
        "label_ar": "تحسين تجربة المستخدم"
      },
      {
        "value": "5",
        "label_ar": "الدعم التقني ومتابعة مشكلات الأعضاء"
      },
      {
        "value": "6",
        "label_ar": "إدارة البيانات والتقارير"
      },
      {
        "value": "7",
        "label_ar": "التعلم تحت إشراف الفريق التقني"
      }
    ],
    "validation": {},
    "target_unit_ids": [],
    "target_unit_types": [],
    "is_active": true
  },
  {
    "field_key": "medical_consultation_demo_seen",
    "field_type": "select",
    "label_ar": "هل اطلعت على منصة الاستشارات التجريبية وفهمت طبيعة العمل؟",
    "sort_order": 311,
    "visibility": {
      "mode": "when",
      "field_key": "volunteer_interest_preferences",
      "operator": "intersects",
      "value": [
        "medical_consultations"
      ]
    },
    "required": true,
    "options": [
      {
        "value": "yes",
        "label_ar": "نعم، اطلعت على المنصة وفهمت طبيعة العمل"
      }
    ],
    "validation": {},
    "target_unit_ids": [],
    "target_unit_types": [],
    "is_active": true,
    "help_ar": "اطلع على النسخة التجريبية قبل الإجابة، ولا تدخل أي بيانات مرضى حقيقية."
  },
  {
    "field_key": "medical_consultation_roles",
    "field_type": "multi_select",
    "label_ar": "ما طبيعة المساهمة التي يمكنك تقديمها ضمن قسم الاستشارات؟",
    "sort_order": 313,
    "visibility": {
      "mode": "when",
      "field_key": "volunteer_interest_preferences",
      "operator": "intersects",
      "value": [
        "medical_consultations"
      ]
    },
    "required": true,
    "options": [
      {
        "value": "1",
        "label_ar": "التوجيه والتثقيف الصحي"
      },
      {
        "value": "2",
        "label_ar": "الإجابة عن الاستفسارات ضمن اختصاصي وصلاحياتي المهنية"
      },
      {
        "value": "3",
        "label_ar": "متابعة الحالات المسندة إليّ ضمن نطاق دوري"
      },
      {
        "value": "4",
        "label_ar": "مراجعة الاستشارات والإشراف العلمي وفق مؤهلاتي"
      }
    ],
    "validation": {},
    "target_unit_ids": [],
    "target_unit_types": [],
    "is_active": true
  },
  {
    "field_key": "medical_consultation_response",
    "field_type": "select",
    "label_ar": "ما المدة التي تستطيع الالتزام بها لمراجعة الطلبات غير الإسعافية المسندة إليك؟",
    "sort_order": 321,
    "visibility": {
      "mode": "when",
      "field_key": "volunteer_interest_preferences",
      "operator": "intersects",
      "value": [
        "medical_consultations"
      ]
    },
    "required": true,
    "options": [
      {
        "value": "1",
        "label_ar": "خلال 12 ساعة"
      },
      {
        "value": "2",
        "label_ar": "خلال 24 ساعة"
      },
      {
        "value": "3",
        "label_ar": "خلال 48 ساعة"
      },
      {
        "value": "4",
        "label_ar": "وفق جدول يتم الاتفاق عليه مسبقاً"
      }
    ],
    "validation": {},
    "target_unit_ids": [],
    "target_unit_types": [],
    "is_active": true
  },
  {
    "field_key": "medical_consultation_ethics",
    "field_type": "multi_select",
    "label_ar": "الالتزام المهني والأخلاقي — وافق على جميع البنود للانضمام إلى القسم",
    "sort_order": 325,
    "visibility": {
      "mode": "when",
      "field_key": "volunteer_interest_preferences",
      "operator": "intersects",
      "value": [
        "medical_consultations"
      ]
    },
    "required": true,
    "options": [
      {
        "value": "ethics",
        "label_ar": "ألتزم بأخلاقيات وآداب المهنة الطبية"
      },
      {
        "value": "privacy",
        "label_ar": "ألتزم بسرية معلومات المرضى وعدم مشاركتها خارج النظام المصرح به"
      },
      {
        "value": "evidence",
        "label_ar": "ألتزم بالمعلومات الطبية المبنية على الأدلة العلمية"
      },
      {
        "value": "scope",
        "label_ar": "ألتزم بحدود اختصاصي ومؤهلاتي وصلاحياتي المهنية"
      },
      {
        "value": "exam",
        "label_ar": "أدرك أن التوجيه الإلكتروني لا يغني عن الفحص الطبي المباشر عند الحاجة"
      },
      {
        "value": "followup",
        "label_ar": "ألتزم بمتابعة الطلبات وإبلاغ المشرف عند تعذر المتابعة"
      },
      {
        "value": "verification",
        "label_ar": "أوافق على التحقق من المؤهلات والإشراف العلمي وضوابط العمل"
      }
    ],
    "validation": {},
    "target_unit_ids": [],
    "target_unit_types": [],
    "is_active": true
  }
];
const INTAKE_REMOVED = new Set(["opinion_of_medlife","future_ideas"]);

function fieldsForNewVolunteerIntake(baseFields, formKey) {
  if (formKey !== "new_volunteer_application") return baseFields;
  // Hold back the monthly-fee question pending a clear organizational policy.
  const base = baseFields.filter(field => ![
    "field_work_monthly_fee",
    "secondary_talent_field",
    "secondary_talent_other",
    "medical_consultation_specialty"
  ].includes(field.field_key));
  const seen = new Set(base.map(field => field.field_key));
  return [...base, ...NEW_VOLUNTEER_EXTRA_FIELDS.filter(field => !seen.has(field.field_key)), ...INTAKE_ADDITIONS.filter(field => !seen.has(field.field_key) && !NEW_VOLUNTEER_EXTRA_FIELDS.some(x=>x.field_key===field.field_key))]
    .filter(field => !INTAKE_REMOVED.has(field.field_key))
    .map(field => ({...field,...(INTAKE_REVISIONS[field.field_key]||{})}))
    .map(field => {
      if (field.field_key === "primary_volunteer_field") {
        return {...field, options: NEW_VOLUNTEER_CATEGORIES, label_ar: "المجال الذي ترغب بالانضمام إليه"};
      }
      if (field.field_key === "academic_status") {
        const options = Array.isArray(field.options) ? field.options : [];
        const additions = [
          {value:"postgraduate",label_ar:"طالب دراسات عليا"},
          {value:"employee",label_ar:"موظف / موظفة"},
          {value:"freelancer",label_ar:"مستقل / Freelancer"},
          {value:"pharmacist",label_ar:"صيدلي / صيدلانية"}
        ];
        return {...field, options:[
          ...options.filter(option=>!additions.some(extra=>extra.value===option.value)),
          ...additions
        ]};
      }
      if (field.field_key === "university") {
        return {...field,field_type:"select",options:INTAKE_UNIVERSITIES,
          label_ar: "اختر الجامعة التي تدرس أو درست فيها",
          visibility:{mode:"when",field_key:"academic_status",operator:"in",
            value:"university,graduate,doctor,resident_doctor,specialist,postgraduate,pharmacist"}};
      }
      if (field.field_key === "faculty") {
        return {...field,required:false,
          visibility:{mode:"when",field_key:"academic_status",operator:"in",
            value:"graduate,postgraduate"}};
      }
      if (field.field_key === "study_year") {
        return {...field,label_ar:"السنة الدراسية الحالية",required:true,
          visibility:{mode:"when",field_key:"academic_status",operator:"in",
            value:"school,institute,university"}};
      }
      if (["resident_specialty","doctor_specialty","specialty"].includes(field.field_key)) {
        return {...field,field_type:"select",
          options:[...INTAKE_ALL_SPECIALTIES,{value:"other",label_ar:"اختصاص غير مدرج — سأكتبه بنفسي"}],
          label_ar:field.field_key==="resident_specialty"
            ? "اختصاص الإقامة الحالية" : "اختصاصك الطبي أو المهني"};
      }
      if (field.field_key === "residency_start_year") {
        // Workers may expose 1970 when Date is evaluated at module load.
        // Derive the max within the request handler, after asynchronous I/O.
        return {...field,validation:{min:1980,max:Math.max(2026,new Date().getUTCFullYear()),step:1}};
      }
      if (field.field_key === "residency_year") {
        return {...field,field_type:"select",
          options:Array.from({length:10},(_,i)=>({value:String(i+1),label_ar:"السنة "+(i+1)})),
          label_ar:"السنة الحالية من الإقامة"};
      }
      if (field.field_key === "residency_hospital") {
        return {...field,label_ar:"اسم المشفى الذي تباشر فيه الإقامة حالياً",
          placeholder_ar:"مثال: مشفى التوليد والأطفال بطرطوس"};
      }
      if (field.field_key === "phone") {
        return {...field,label_ar:"رقم الهاتف المرتبط بواتساب مع الرمز الدولي",
          placeholder_ar:"+9639XXXXXXXX",
          help_ar:"أدخل الرقم كاملاً بالصيغة الدولية، مثلاً +9639XXXXXXXX، من دون صفر إضافي بعد رمز البلد. يجب أن يكون واتساب فعالاً على هذا الرقم."};
      }
      if (field.field_key === "full_name") {
        return {...field,label_ar:"الاسم الثلاثي الكامل"};
      }
      if (field.field_key === "governorate") {
        return {...field, visibility:{mode:"when",field_key:"country",operator:"equals",value:"سوريا"}};
      }
      // All selected recruitment preferences get their own questions, not just preference #1.
      // This stays scoped to new-member intake and does not modify renewal form definitions.
      const v = field.visibility;
      if (v?.mode === "when" && v.field_key === "primary_volunteer_field") {
        return {...field, visibility: {
          mode: "when",
          field_key: "volunteer_interest_preferences",
          operator: "intersects",
          value: Array.isArray(v.value) ? v.value : [v.value]
        }};
      }
      return field;
    })
    .sort((a,b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, no-cache, must-revalidate"
    }
  });
}

function cleanText(value, max) {
  return String(value ?? "").trim().slice(0, max);
}

function normalizeNationalIdentifier(value) {
  return cleanText(value, 40).normalize("NFKC")
    .replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 0x06F0))
    .replace(/[\s\u200b-\u200d\-\u2010-\u2015]/g, "");
}

function normalizeDate(value) {
  const raw = cleanText(value, 32);
  return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

async function fetchResource(resource, url) {
  const config = RESOURCES[resource];
  // Keep the requested form key in function scope: unit filtering below also
  // needs it when the membership form's options are assembled.
  const requestedFormKey = resource === "membership_renewal_form"
    ? cleanText(url.searchParams.get("form_key"), 120)
    : "";
  // New volunteer intake has its own published definition; never fall back to renewals.
  const requestedJoinFormKey = resource === "join_form"
    ? cleanText(url.searchParams.get("form_key"), 120) || "new_volunteer_application"
    : "";
  const limitRaw = Number(url.searchParams.get("limit") || 50);
  const limit = Number.isFinite(limitRaw) ? Math.min(50, Math.max(1, Math.trunc(limitRaw))) : 50;
  const query = new URLSearchParams({select: config.select, order: config.order, limit: String(limit)});

  if (resource === "content") {
    const slug = url.searchParams.get("slug");
    if (slug) query.set("slug", "eq." + slug);
    const type = url.searchParams.get("content_type");
    if (type) query.set("content_type", "eq." + type);
  }
  if (resource === "activities") {
    const status = url.searchParams.get("status");
    if (status) query.set("status", "eq." + status);
    const slug = url.searchParams.get("slug");
    if (slug) query.set("slug", "eq." + slug);
  }
  if (resource === "campaigns") {
    const status = url.searchParams.get("status");
    if (status) query.set("status", "eq." + status);
  }
  if (resource === "support") {
    const status = url.searchParams.get("status");
    if (status) query.set("status", "eq." + status);
    const caseCode = url.searchParams.get("case_code");
    if (caseCode) query.set("case_code", "eq." + cleanText(caseCode, 80));
  }
  if (resource === "volunteer_recruitment") {
    query.set("id", "eq.1");
  }
  if (resource === "join_units") {
    query.set("unit_type", "in.(cell,department,field_team)");
    query.set("is_active", "eq.true");
  }
  if (resource === "join_form") {
    if (!["new_member", "new_volunteer_application"].includes(requestedJoinFormKey)) {
      throw new Error("نموذج الانضمام المطلوب غير صالح.");
    }
    query.set("form_kind", "eq.new_member");
    query.set("form_key", "eq." + requestedJoinFormKey);
    query.set("status", "eq.published");
    query.set("is_public", "eq.true");
    query.set("limit", "1");
  }
  if (resource === "birthdays") {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Damascus",
      month: "numeric",
      day: "numeric"
    }).formatToParts(now);
    const month = parts.find(part => part.type === "month")?.value;
    const day = parts.find(part => part.type === "day")?.value;
    if (month && day) {
      query.set("birth_month", "eq." + month);
      query.set("birth_day", "eq." + day);
    }
    // Return every person sharing today's birthday, not just the first 20.
    query.set("limit", "1000");
  }
  if (resource === "upcoming_birthdays") {
    // Month and day only: the public view never exposes birth year or full DOB.
    // The current team has 87 eligible profiles; use a higher ceiling so growth
    // does not silently hide birthdays beyond the first 100 alphabetic names.
    query.set("limit", "1000");
  }
  if (resource === "membership_renewal_form") {
    query.set("form_kind", "eq.membership_renewal");
    query.set("status", "eq.published");
    query.set("is_public", "eq.true");
    if (requestedFormKey) query.set("form_key", "eq." + requestedFormKey);
    query.set("limit", "1");
  }

  const resourceUrl = SUPABASE_URL + "/rest/v1/" + config.table + "?" + query.toString();
  const readHeaders = (key) => ({
    apikey: key,
    Authorization: "Bearer " + key,
    Accept: "application/json"
  });
  let response = await fetch(resourceUrl, {
    headers: readHeaders(SUPABASE_PUBLISHABLE_KEY)
  });
  let body = await response.text();
  let data;
  try { data = JSON.parse(body); } catch { data = { error: body }; }

  // Membership forms are public registration-critical resources. Retry their
  // lookup with the project's anon JWT if the publishable-key request fails or
  // unexpectedly returns no published form, so a key-format mismatch cannot
  // leave every applicant staring at an empty form.
  if (resource === "membership_renewal_form" &&
      (!response.ok || !Array.isArray(data) || data.length === 0)) {
    const fallbackResponse = await fetch(resourceUrl, {
      headers: readHeaders(SUPABASE_ANON_KEY)
    });
    const fallbackBody = await fallbackResponse.text();
    let fallbackData;
    try { fallbackData = JSON.parse(fallbackBody); } catch { fallbackData = { error: fallbackBody }; }
    if (fallbackResponse.ok && Array.isArray(fallbackData) && fallbackData.length > 0) {
      response = fallbackResponse;
      body = fallbackBody;
      data = fallbackData;
    }
  }
  if (!response.ok) {
    console.error("Public resource read failed", resource, response.status, body.slice(0, 500));
    throw new Error("تعذر تحميل بيانات الموقع.");
  }
  if (resource === "join_form" || resource === "membership_renewal_form") {
    const form = Array.isArray(data) ? data[0] : null;
    if (!form?.id) return [];
    const fieldsResponse = await fetch(
      SUPABASE_URL + "/rest/v1/admin_form_fields?select=id,form_id,field_key,label_ar,help_ar,placeholder_ar,field_type,required,options,validation,visibility,target_unit_ids,target_unit_types,sort_order,is_active&form_id=eq." + encodeURIComponent(form.id) + "&is_active=eq.true&order=sort_order.asc",
      {
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
          Accept: "application/json"
        }
      }
    );
    const fieldsBody = await fieldsResponse.text();
    let fields;
    try { fields = JSON.parse(fieldsBody); } catch { fields = []; }
    if (!fieldsResponse.ok || !Array.isArray(fields)) throw new Error("تعذر تحميل أسئلة النموذج.");
    if (resource === "membership_renewal_form") {
      const unitReadHeaders = {
        apikey: SUPABASE_ANON_KEY,
        Authorization: "Bearer " + SUPABASE_ANON_KEY,
        Accept: "application/json"
      };
      const unitsResponse = await fetch(
        SUPABASE_URL + "/rest/v1/org_units?select=id,name_ar,name_en,unit_type&unit_type=in.(cell,department,field_team,other)&is_active=eq.true&order=sort_order.asc,name_ar.asc",
        {headers: unitReadHeaders}
      );
      const units = await unitsResponse.json().catch(() => []);
      const liveUnits = (Array.isArray(units) ? units : []).map(unit => ({
        id: String(unit.id),
        name_ar: cleanText(unit.name_ar || unit.name_en, 200),
        name_en: cleanText(unit.name_en || unit.name_ar, 200),
        unit_type: cleanText(unit.unit_type, 50)
      })).filter(unit => unit.id && unit.name_ar && (unit.unit_type !== "other" || requestedFormKey === "membership_renewal_supervisor"));
      const normalizedFields = fields.map(field => field.field_key === "current_units"
        ? {...field, options: liveUnits.map(unit => ({value: unit.id, label_ar: unit.name_ar, label_en: unit.name_en}))}
        : field
      );
      return [{...form, fields: normalizedFields, units: liveUnits}];
    }
    return [{...form, fields: fieldsForNewVolunteerIntake(fields, form.form_key)}];
  }
  if (resource === "content") {
    // public_site_content is a published-only projection; expose an explicit
    // status value to consumers without requiring a status column in the table.
    return Array.isArray(data) ? data.map(row => ({...row, status:"published"})) : [];
  }
  return Array.isArray(data) ? data : [];
}

function sanitizeFormValue(value) {
  if (Array.isArray(value)) {
    return value.slice(0, 30).map(item => sanitizeFormValue(item)).filter(item => item !== "");
  }
  if (value && typeof value === "object") {
    const output = {};
    for (const [key, item] of Object.entries(value).slice(0, 50)) {
      const safeKey = cleanText(key, 120);
      if (!safeKey || /password|secret|token/i.test(safeKey)) continue;
      const safeValue = sanitizeFormValue(item);
      if (Array.isArray(safeValue) ? safeValue.length : safeValue !== "") output[safeKey] = safeValue;
    }
    return output;
  }
  if (typeof value === "boolean" || typeof value === "number") return value;
  return cleanText(value, 5000);
}

async function validateAndSanitizeFormData(body, expectedFormKind = "new_member") {
  const formId = cleanText(body.form_id, 80);
  if (!formId) return {form_id: null, form_version: null, form_data: {}, form_schema: {}};

  const formResponse = await fetch(
    SUPABASE_URL + "/rest/v1/admin_form_definitions?select=id,form_key,name_ar,name_en,description_ar,description_en,form_kind,status,is_public,version,settings,updated_at&id=eq." + encodeURIComponent(formId) + "&form_kind=eq." + encodeURIComponent(expectedFormKind) + "&status=eq.published&is_public=eq.true&limit=1",
    {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
        Accept: "application/json"
      }
    }
  );
  const formRows = await formResponse.json().catch(() => []);
  const form = Array.isArray(formRows) ? formRows[0] : null;
  if (!form?.id) throw new Error("نموذج الانضمام غير صالح أو لم يعد منشوراً.");

  const fieldsResponse = await fetch(
    SUPABASE_URL + "/rest/v1/admin_form_fields?select=field_key,label_ar,label_en,help_ar,placeholder_ar,field_type,required,options,validation,visibility,target_unit_ids,target_unit_types,sort_order&form_id=eq." + encodeURIComponent(form.id) + "&is_active=eq.true&order=sort_order.asc&limit=200",
    {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
        Accept: "application/json"
      }
    }
  );
  const fields = await fieldsResponse.json().catch(() => []);
  const fieldRows = fieldsForNewVolunteerIntake(Array.isArray(fields) ? fields : [], form.form_key);
  const allowed = new Set(fieldRows.map(field => cleanText(field.field_key, 120)).filter(Boolean));
  const extraAllowed = (form.form_key === "membership_renewal" || form.form_key === "membership_renewal_supervisor")
    ? new Set(["profile_image_url", "profile_image_public_id"])
    : new Set();
  const raw = body.form_data && typeof body.form_data === "object" && !Array.isArray(body.form_data) ? body.form_data : {};
  const formData = {};
  for (const [key, value] of Object.entries(raw)) {
    const safeKey = cleanText(key, 120);
    if ((!allowed.has(safeKey) && !extraAllowed.has(safeKey)) || /password|secret|token/i.test(safeKey)) continue;
    const safeValue = sanitizeFormValue(value);
    if (Array.isArray(safeValue) ? safeValue.length : safeValue !== "") formData[safeKey] = safeValue;
  }
  if (form.form_key === "new_volunteer_application" && typeof formData.national_id === "string") {
    formData.national_id = normalizeNationalIdentifier(formData.national_id);
  }
  if ((form.form_key === "membership_renewal" || form.form_key === "membership_renewal_supervisor") && formData.profile_image_url) {
    const imageUrl = cleanText(formData.profile_image_url, 1000);
    const imagePublicId = cleanText(formData.profile_image_public_id, 300);
    if (!/^https:\/\/res\.cloudinary\.com\/pyvrk863\/image\/upload\//.test(imageUrl)) {
      throw new Error("رابط الصورة الشخصية غير صالح.");
    }
    formData.profile_image_url = imageUrl;
    if (imagePublicId) formData.profile_image_public_id = imagePublicId;
  }

  for (const field of fieldRows) {
    // Validate actual option values for the dedicated new-volunteer intake only.
    // Do not change behavior for existing membership renewal forms.
    if (form.form_key === "new_volunteer_application" && formData[field.field_key] !== undefined) {
      const value = formData[field.field_key];
      if (["practical_skills","tools_used","it_tools"].includes(field.field_key) && Array.isArray(value) && value.includes("none") && value.length>1) throw new Error("لا يمكن الجمع بين خيار عدم الخبرة وخيارات المهارات أو الأدوات.");
      const choices = (Array.isArray(field.options) ? field.options : []).map(option => String(option.value));
      if (field.field_type === "select" && !choices.includes(String(value))) {
        throw new Error("الخيار المحدد غير صالح في: " + String(field.label_ar || field.field_key));
      }
      if (field.field_type === "multi_select" &&
          (!Array.isArray(value) || !value.every(item => choices.includes(String(item))))) {
        throw new Error("هناك إجابة غير صالحة في: " + String(field.label_ar || field.field_key));
      }
      if (field.field_type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
        throw new Error("البريد الإلكتروني غير صالح.");
      }
      if (field.field_type === "number" && field.field_key === "weekly_availability" &&
          (Number(value) < 1 || Number(value) > 80)) {
        throw new Error("عدد ساعات التفرغ الأسبوعية يجب أن يكون بين ساعة و80 ساعة.");
      }
    }
    if (field.field_type === "number" && formData[field.field_key] !== undefined && formData[field.field_key] !== null && String(formData[field.field_key]).trim() !== "") {
      const number = Number(formData[field.field_key]);
      const rules = field.validation && typeof field.validation === "object" ? field.validation : {};
      if (!Number.isFinite(number)) throw new Error("القيمة في «" + String(field.label_ar || field.field_key) + "» يجب أن تكون رقماً.");
      if (rules.min !== undefined && number < Number(rules.min)) throw new Error("القيمة في «" + String(field.label_ar || field.field_key) + "» يجب ألا تقل عن " + rules.min + ".");
      if (rules.max !== undefined && number > Number(rules.max)) throw new Error("القيمة في «" + String(field.label_ar || field.field_key) + "» يجب ألا تتجاوز " + rules.max + ".");
      if (rules.step !== undefined && Number(rules.step) > 0 && rules.min !== undefined) {
        const steps = (number - Number(rules.min)) / Number(rules.step);
        if (Math.abs(steps - Math.round(steps)) > 1e-9) throw new Error("القيمة في «" + String(field.label_ar || field.field_key) + "» لا تطابق الزيادة المحددة: " + rules.step + ".");
      }
      formData[field.field_key] = number;
    }
    if (field.field_type === "boolean" && typeof formData[field.field_key] === "string") {
      const rawBoolean = String(formData[field.field_key]).toLowerCase();
      formData[field.field_key] = rawBoolean === "true" || rawBoolean === "yes" || rawBoolean === "1";
    }
    if (field.field_type === "multi_select" && formData[field.field_key] !== undefined && !Array.isArray(formData[field.field_key])) {
      formData[field.field_key] = [formData[field.field_key]];
    }
  }

  const selectedUnitTypes = new Set();
  const selectedUnitIds = Array.isArray(formData.current_units)
    ? formData.current_units.map(value => cleanText(value, 80)).filter(Boolean)
    : [];
  if (selectedUnitIds.length) {
    const selectedUnitsResponse = await fetch(
      SUPABASE_URL + "/rest/v1/org_units?select=id,unit_type&id=in.(" + selectedUnitIds.map(encodeURIComponent).join(",") + ")",
      {
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
          Accept: "application/json"
        }
      }
    );
    const selectedUnits = await selectedUnitsResponse.json().catch(() => []);
    for (const unit of (Array.isArray(selectedUnits) ? selectedUnits : [])) {
      const type = cleanText(unit.unit_type, 50);
      if (type) selectedUnitTypes.add(type);
    }
  }

  const fieldIsVisible = (field, visited = new Set()) => {
    if (visited.has(field.field_key)) return false;
    const nextVisited = new Set([...visited,field.field_key]);
    const targetUnitIds = Array.isArray(field.target_unit_ids)
      ? field.target_unit_ids.map(value => cleanText(value, 80)).filter(Boolean)
      : [];
    if (targetUnitIds.length && !targetUnitIds.some(id => selectedUnitIds.includes(id))) return false;

    const targetUnitTypes = Array.isArray(field.target_unit_types)
      ? field.target_unit_types.map(value => cleanText(value, 50)).filter(Boolean)
      : [];
    if (targetUnitTypes.length && !targetUnitTypes.some(type => selectedUnitTypes.has(type))) return false;

    const visibility = field.visibility && typeof field.visibility === "object" ? field.visibility : {};
    if (visibility.mode !== "when") return true;
    if (form.form_key === "new_volunteer_application") {
      const parent = fieldRows.find(f=>f.field_key===visibility.field_key);
      if(parent && !fieldIsVisible(parent,nextVisited)) return false;
    }
    const actual = formData[cleanText(visibility.field_key, 120)];
    const expected = String(visibility.value ?? "");
    const operator = cleanText(visibility.operator, 30) || "equals";
    if (operator === "intersects") {
      return Array.isArray(actual) && Array.isArray(visibility.value) &&
        visibility.value.some(value => actual.map(String).includes(String(value)));
    }
    if (operator === "contains") {
      return Array.isArray(actual)
        ? actual.map(String).includes(expected)
        : String(actual ?? "").toLowerCase().includes(expected.toLowerCase());
    }
    if (operator === "in") {
      const allowed = String(visibility.value ?? "").split(",").map(item => item.trim()).filter(Boolean);
      return Array.isArray(actual)
        ? actual.some(item => allowed.includes(String(item)))
        : allowed.includes(String(actual ?? ""));
    }
    if (operator === "not_equals") return String(actual ?? "") !== expected;
    return String(actual ?? "") === expected;
  };

  // A removed preference must never leave stale specialty answers in the submitted record.
  // Do not change membership renewal validation or stored data.
  if (form.form_key === "new_volunteer_application") {
    for (const field of fieldRows) {
      if (!fieldIsVisible(field)) delete formData[field.field_key];
    }
  }

  for (const field of fieldRows) {
    if (!field.required || !fieldIsVisible(field)) continue;
    // These supervisor fields are rendered and validated per selected unit,
    // not as top-level form fields. Their values live in current_unit_details.
    const dynamicSupervisorField = form.form_key === "membership_renewal_supervisor" &&
      ["current_unit_details", "senior_management_position", "content_assignments"].includes(field.field_key);
    if (dynamicSupervisorField) continue;
    const value = formData[field.field_key];
    const missing = Array.isArray(value)
      ? value.length === 0
      : typeof value === "boolean"
        ? false
        : value === undefined || value === null || String(value).trim() === "";
    if (missing) throw new Error("يرجى تعبئة السؤال: " + String(field.label_ar || field.field_key));
  }

  if (form.form_key === "new_volunteer_application") {
    const preferences = formData.volunteer_interest_preferences;
    const allowed = new Set(NEW_VOLUNTEER_CATEGORIES.map(item => item.value));
    if (!Array.isArray(preferences) || preferences.length < 1 || preferences.length > 3 ||
        new Set(preferences).size !== preferences.length ||
        !preferences.every(value => allowed.has(String(value))) ||
        preferences[0] !== formData.primary_volunteer_field) {
      throw new Error("يرجى اختيار من مجال إلى ثلاثة مجالات تطوع صحيحة حسب الأولوية، مع تطابق المجال الأساسي مع الرغبة الأولى.");
    }

    if (formData.volunteer_commitment !== "1") {
      throw new Error("لإرسال طلب الانضمام، يجب تأكيد القدرة على الالتزام بالعمل التطوعي وأنظمة المؤسسة.");
    }

    // The applicant's actual medical discipline must match their declared
    // professional role; students and non-clinical members cannot enter consultations.
    const role = String(formData.academic_status||"");
    const profession = String(formData.medical_profession||"");
    const isMedicalRole = RECRUITMENT_ELIGIBLE_MEDICAL_ROLES.has(role);
    if (isMedicalRole) {
      if (!["human_medicine","dentistry","pharmacy"].includes(profession) ||
          (role==="pharmacist" && profession!=="pharmacy") ||
          (["doctor","specialist"].includes(role) && profession==="pharmacy")) {
        throw new Error("يرجى تحديد مجال مهني صحيح: طب بشري أو طب أسنان للأطباء، وصيدلة للصيادلة.");
      }
      for (const key of ["resident_specialty","doctor_specialty","specialty"]) {
        const chosen = formData[key];
        if (!chosen || chosen==="other") continue;
        if (!INTAKE_ALL_SPECIALTIES.some(option=>option.value===chosen)) {
          throw new Error("الاختصاص المحدد غير موجود في القائمة المعتمدة.");
        }
        const valid = profession==="human_medicine"
          ? INTAKE_MEDICAL_SPECIALTIES.some(option=>option.value===chosen)
          : profession==="dentistry"
            ? INTAKE_DENTAL_SPECIALTIES.some(option=>option.value===chosen)
            : [...MEDICAL_CONSULTATION_SPECIALTIES.filter(x=>PHARMACY_CONSULTATION_CODES.has(x.value)),...INTAKE_PHARMACY_SPECIALTIES].some(option=>option.value===chosen);
        if (!valid) throw new Error("الاختصاص المحدد لا يطابق المجال الطبي الذي اخترته.");
      }
      if (role==="resident_doctor") {
        const started = Number(formData.residency_start_year);
        if (!Number.isInteger(started) || started<1980 || started>new Date().getFullYear()) {
          throw new Error("يرجى إدخال سنة بدء الإقامة الفعلية بصورة صحيحة.");
        }
      }
    }

    if (preferences.includes("medical_consultations")) {
      const ethics = formData.medical_consultation_ethics;
      const requiredEthics = ["ethics","privacy","evidence","scope","exam","followup","verification"];
      if (formData.medical_consultation_demo_seen !== "yes" ||
          !Array.isArray(ethics) || ethics.length !== requiredEthics.length ||
          !requiredEthics.every(code=>ethics.includes(code))) {
        throw new Error("يرجى تأكيد الاطلاع على المنصة والموافقة على جميع بنود الالتزام المهني.");
      }
      if (!isMedicalRole) {
        throw new Error("مجال الاستشارات متاح فقط للأطباء والمقيمين والاختصاصيين والصيادلة، وليس للطلاب.");
      }
      const chosen = formData.medical_consultation_specialties;
      const allowedByProfession = profession==="human_medicine"
        ? INTAKE_MEDICAL_SPECIALTIES
        : profession==="dentistry"
          ? INTAKE_DENTAL_SPECIALTIES
          : [...MEDICAL_CONSULTATION_SPECIALTIES.filter(x=>PHARMACY_CONSULTATION_CODES.has(x.value)),...INTAKE_PHARMACY_SPECIALTIES];
      const codes = new Set(allowedByProfession.map(option=>option.value));
      if (!Array.isArray(chosen) || chosen.length<1 || chosen.length>2 ||
          new Set(chosen).size!==chosen.length || !chosen.every(value=>codes.has(String(value)))) {
        throw new Error("يجب اختيار اختصاص أو اختصاصين فقط، بما يتوافق مع مؤهلك الطبي أو الصيدلاني.");
      }
    }
    // University/unlisted specialty values must be completed when selected.
    if (formData.university==="other" && !formData.university_other) {
      throw new Error("يرجى كتابة اسم الجامعة الأخرى.");
    }
    if (formData.study_field==="other" && !formData.study_field_other) {
      throw new Error("يرجى كتابة اختصاصك الدراسي.");
    }
    // The number is normalized and validated server-side; the checkbox is an
    // applicant attestation, not proof of WhatsApp ownership.
    const telephone = String(formData.phone||"").replace(/[\s\-().]/g,"");
    const prefix = formData.phone_country_code==="other"
      ? String(formData.phone_dial_other||"").replace(/\s/g,"")
      : String(formData.phone_country_code||"");
    if (!/^\+[1-9]\d{7,14}$/.test(telephone) ||
        !/^\+[1-9]\d{0,3}$/.test(prefix) ||
        !telephone.startsWith(prefix) || telephone.slice(prefix.length).length<6) {
      throw new Error("يرجى إدخال رقم واتساب صحيح مع رمز الاتصال الدولي، مثال: +9639XXXXXXXX.");
    }
    if (formData.whatsapp_confirmed!=="yes") {
      throw new Error("يجب تأكيد أن الرقم مرتبط بواتساب نشط لاستلام مراسلات الانضمام.");
    }
    formData.phone=telephone;
    if (formData.country==="أخرى") {
      const chosen = formData.other_country;
      if (!INTAKE_OTHER_COUNTRIES.some(option=>option.value===chosen)) {
        throw new Error("يرجى اختيار بلد الإقامة الصحيح من القائمة.");
      }
    }
  }

  const formSchema = {
    form_id: form.id,
    form_key: form.form_key,
    version: form.version,
    name_ar: form.name_ar,
    name_en: form.name_en,
    description_ar: form.description_ar,
    description_en: form.description_en,
    settings: form.settings && typeof form.settings === "object" ? form.settings : {},
    captured_at: new Date().toISOString(),
    fields: fieldRows.map(field => ({
      field_key: field.field_key,
      label_ar: field.label_ar,
      label_en: field.label_en,
      help_ar: field.help_ar,
      placeholder_ar: field.placeholder_ar,
      field_type: field.field_type,
      required: Boolean(field.required),
      options: field.field_key === "certificate_types" && !Array.isArray(field.options?.filter?.(option => option?.value && option.value !== "none")) 
        ? DEFAULT_CERTIFICATE_TYPE_OPTIONS
        : (Array.isArray(field.options) && field.options.some(option => option?.value && option.value !== "none")
          ? field.options.slice(0, form.form_key==="new_volunteer_application" ? 350 : 100)
          : field.field_key === "certificate_types" ? DEFAULT_CERTIFICATE_TYPE_OPTIONS : []),
      validation: field.validation && typeof field.validation === "object" ? field.validation : {},
      visibility: field.visibility && typeof field.visibility === "object" ? field.visibility : {mode:"always"},
      target_unit_ids: Array.isArray(field.target_unit_ids) ? field.target_unit_ids.slice(0, 50) : [],
      target_unit_types: Array.isArray(field.target_unit_types) ? field.target_unit_types.slice(0, 10) : [],
      sort_order: Number(field.sort_order || 0)
    }))
  };
  return {form_id: form.id, form_version: form.version, form_data: formData, form_schema: formSchema};
}

function volunteerPayload(body) {
  return {
    application_kind: body.application_kind === "current_member" ? "current_member" : "new_member",
    status: "pending",
    full_name: cleanText(body.full_name, 150),
    mother_name: cleanText(body.mother_name, 150),
    national_id: cleanText(body.national_id, 40),
    date_of_birth: normalizeDate(body.date_of_birth),
    gender: cleanText(body.gender, 20),
    email: cleanText(body.email, 200).toLowerCase(),
    phone: cleanText(body.phone, 40),
    governorate: cleanText(body.governorate, 100),
    address: cleanText(body.address, 500),
    academic_status: cleanText(body.academic_status, 40),
    university: cleanText(body.university, 250),
    faculty: cleanText(body.faculty, 250),
    study_year: cleanText(body.study_year, 100),
    graduation_year: cleanText(body.graduation_year, 100),
    profession: cleanText(body.profession, 250),
    workplace: cleanText(body.workplace, 250),
    resident_specialty: cleanText(body.resident_specialty, 250),
    residency_year: cleanText(body.residency_year, 100),
    residency_hospital: cleanText(body.residency_hospital, 250),
    doctor_graduation_year: cleanText(body.doctor_graduation_year, 100),
    doctor_specialty: cleanText(body.doctor_specialty, 250),
    doctor_workplace: cleanText(body.doctor_workplace, 250),
    specialty: cleanText(body.specialty, 250),
    specialist_graduation_year: cleanText(body.specialist_graduation_year, 100),
    specialist_workplace: cleanText(body.specialist_workplace, 250),
    interest: cleanText(body.interest, 200),
    motivation: cleanText(body.motivation, 2500),
    medlife_role: cleanText(body.medlife_role, 100),
    join_date: normalizeDate(body.join_date),
    cell: cleanText(body.cell, 100),
    consultation_specialty: cleanText(body.consultation_specialty, 250),
    field_location: cleanText(body.field_location, 100),
    volunteer_certificate: cleanText(body.volunteer_certificate, 30),
    requested_departments: Array.isArray(body.requested_departments)
      ? body.requested_departments.map((item) => cleanText(item, 160)).filter(Boolean).slice(0, 6)
      : [],
    form_id: null,
    form_version: null,
    form_data: {},
    form_schema: {},
    source: "public_website"
  };
}

export async function onRequestPost({ request }) {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return json({ success: false, error: "صيغة الطلب غير صالحة." }, 415);
  }
  try {
    const body = await request.json();
    if (body.website) return json({ success: true });
    if (body.action === "join_identity_check") {
      const origin = request.headers.get("origin");
      if (origin && origin !== new URL(request.url).origin) return json({success:false},403);
      if (!["start","verify"].includes(body.mode)) return json({success:false},400);
      const identityRequest = {
        mode: body.mode, email: cleanText(body.email,254), national_id: normalizeNationalIdentifier(body.national_id),
        challenge_id: cleanText(body.challenge_id,40), code:cleanText(body.code,10)
      };
      try {
        const upstream=await fetch(SUPABASE_URL+"/functions/v1/join-identity-verification",{
          method:"POST",
          headers:{apikey:SUPABASE_ANON_KEY,Authorization:"Bearer "+SUPABASE_ANON_KEY,"Content-Type":"application/json"},
          body:JSON.stringify(identityRequest)
        });
        const result=await upstream.json();
        if(upstream.ok && result.success===true){
          if(body.mode==="start" && typeof result.challenge_id==="string")return json({success:true,challenge_id:result.challenge_id});
          if(body.mode==="verify" && ["continue","duplicate"].includes(result.status))return json({success:true,status:result.status});
        }
        return json({success:false,error:typeof result.error==="string"?result.error:"تعذر إتمام التحقق حالياً."},upstream.status===429?429:upstream.status===400?400:503);
      }catch(_){return json({success:false,error:"تعذر الاتصال بخدمة التحقق حالياً."},503);}
    }

    // Cloudflare Pages preview hosts share the live Supabase project.
    // Never accept real new-volunteer submissions from a public preview URL.
    if (body.action === "new_volunteer_application" &&
        new URL(request.url).hostname.toLowerCase().endsWith(".pages.dev")) {
      return json({ success: false, error: "هذه نسخة معاينة للاختبار فقط؛ إرسال الطلبات متاح بعد نشر الرابط الرسمي." }, 403);
    }

    const target = body.action === "article_submission"
      ? "public_article_submissions"
      : body.action === "membership_renewal"
        ? "public_membership_renewal_submissions"
        : "public_volunteer_applications";

    let payload;
    if (body.action === "article_submission") {
      payload = {
        status: "pending",
        title_ar: cleanText(body.title_ar, 500),
        title_en: cleanText(body.title_en, 500),
        excerpt_ar: cleanText(body.excerpt_ar, 5000),
        author_name: cleanText(body.author_name, 300),
        author_email: cleanText(body.author_email, 320).toLowerCase(),
        author_member_id: cleanText(body.author_member_id, 50),
        category: cleanText(body.category, 200),
        content_ar: cleanText(body.content_ar, 50000),
        image_url: cleanText(body.image_url, 2000),
        editorial_brief: body.editorial_brief && typeof body.editorial_brief === "object" ? body.editorial_brief : {},
        reference_data: Array.isArray(body.reference_data) ? body.reference_data.slice(0, 30) : [],
        source: "public_website"
      };
      if (!payload.title_ar || !payload.author_name || !payload.content_ar) {
        return json({ success: false, error: "يرجى إكمال عنوان المقال واسم الكاتب والمحتوى." }, 400);
      }
      if (!payload.author_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.author_email)) {
        return json({ success: false, error: "أدخل بريداً إلكترونياً صالحاً لتلقي ملاحظات المراجعة وإشعار النشر." }, 400);
      }
      // Generate the receipt ID on the server because the public insert intentionally uses return=minimal.
      payload.id = crypto.randomUUID();
    } else if (body.action === "membership_renewal") {
      let dynamic;
      try {
        dynamic = await validateAndSanitizeFormData(body, "membership_renewal");
      } catch (formError) {
        return json({ success: false, error: formError.message || "نموذج التجديد غير صالح." }, 400);
      }

      const data = dynamic.form_data;
      const formSettings = dynamic.form_schema?.settings && typeof dynamic.form_schema.settings === "object"
        ? dynamic.form_schema.settings
        : {};
      const supervisorForm = dynamic.form_schema?.form_key === "membership_renewal_supervisor";
      const membershipControls = formSettings.membership_controls && typeof formSettings.membership_controls === "object"
        ? formSettings.membership_controls
        : {};
      const configuredRoleOptions = Array.isArray(membershipControls.role_options)
        ? membershipControls.role_options
            .filter(item => item && typeof item === "object")
            .map(item => ({
              value: cleanText(item.value, 60).toLowerCase(),
              label_ar: cleanText(item.label_ar || item.label_en, 120)
            }))
            .filter(item => item.value)
        : [];
      const configuredSeniorPositions = Array.isArray(membershipControls.senior_management_positions)
        ? membershipControls.senior_management_positions
            .filter(item => item && typeof item === "object")
            .map(item => ({
              value: cleanText(item.value, 100),
              label_ar: cleanText(item.label_ar || item.label_en, 180)
            }))
            .filter(item => item.value)
        : [];
      const certificateControls = membershipControls.certificates && typeof membershipControls.certificates === "object"
        ? membershipControls.certificates
        : {};
      const certificateFeatureEnabled = certificateControls.enabled !== false;
      const certificateUnitLinkEnabled = certificateControls.unit_link_enabled !== false;
      const certificateUnitLinkRequired = certificateControls.unit_link_required === true;

      const unitsResponse = await fetch(
        SUPABASE_URL + "/rest/v1/org_units?select=id,name_ar,name_en,unit_type&is_active=eq.true&unit_type=in.(cell,department,field_team)&order=sort_order.asc,name_ar.asc",
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: "Bearer " + SUPABASE_ANON_KEY,
            Accept: "application/json"
          }
        }
      );
      const activeUnitsPayload = await unitsResponse.json().catch(() => []);
      const activeUnits = Array.isArray(activeUnitsPayload)
        ? activeUnitsPayload.map(unit => ({
            id: String(unit.id || ""),
            name_ar: cleanText(unit.name_ar || unit.name_en, 200),
            name_en: cleanText(unit.name_en || unit.name_ar, 200),
            unit_type: cleanText(unit.unit_type, 50)
          })).filter(unit => unit.id && unit.name_ar)
        : [];

      const findLiveCertificateUnit = async (unitId, unitName) => {
        const normalizedId = cleanText(unitId, 80);
        const normalizedName = cleanText(unitName, 200).replace(/\\s+/g, " ").toLowerCase();
        const candidate = activeUnits.find(unit =>
          (normalizedId && unit.id === normalizedId) ||
          (normalizedName && [unit.name_ar, unit.name_en].some(name =>
            cleanText(name, 200).replace(/\\s+/g, " ").toLowerCase() === normalizedName
          ))
        );
        return candidate || null;
      };

      if (data.declaration_accurate !== true || data.privacy_consent !== true) {
        return json({ success: false, error: "يرجى تأكيد صحة المعلومات والموافقة على استخدام البيانات." }, 400);
      }

      const languageAssignments = Array.isArray(data.language_assignments)
        ? data.language_assignments.filter(item => item && typeof item === "object" && !Array.isArray(item)).slice(0, 30)
        : [];
      const allowedLanguageCodes = new Set([
        "arabic","english","french","german","turkish","kurdish",
        "spanish","italian","russian","persian","sign_language","other"
      ]);
      const allowedLanguageLevels = new Set(["native","a1_a2","b1_b2","c1","c2"]);
      const seenLanguageKeys = new Set();
      for (const item of languageAssignments) {
        const language = cleanText(item.language, 60).toLowerCase();
        const other = cleanText(item.language_other, 120);
        const level = cleanText(item.level, 30).toLowerCase();
        if (!allowedLanguageCodes.has(language)) {
          return json({ success: false, error: "توجد لغة غير صالحة ضمن البيانات." }, 400);
        }
        if (!allowedLanguageLevels.has(level)) {
          return json({ success: false, error: "يوجد مستوى لغة غير صالح ضمن البيانات." }, 400);
        }
        if (language === "other" && !other) {
          return json({ success: false, error: "يرجى كتابة اسم اللغة عند اختيار «أخرى»." }, 400);
        }
        const languageKey = language === "other"
          ? "other:" + other.replace(/\s+/g, " ").trim().toLowerCase()
          : language;
        if (seenLanguageKeys.has(languageKey)) {
          return json({ success: false, error: "لا يمكن تكرار اللغة نفسها أكثر من مرة." }, 400);
        }
        seenLanguageKeys.add(languageKey);
      }

      let requestedIds = Array.isArray(data.current_units)
        ? [...new Set(data.current_units.map(item => cleanText(item, 80)).filter(Boolean))].slice(0, 26)
        : [];
      const requestedUnitDetails = data.current_unit_details && typeof data.current_unit_details === "object" && !Array.isArray(data.current_unit_details)
        ? data.current_unit_details
        : {};
      // Validate the exact submitted IDs directly. This avoids rejecting a valid
      // supervisor-only unit such as General Administration because the broader
      // public unit query is filtered differently.
      // Resolve submitted unit IDs from the active public unit list already loaded above.
      // This avoids a second PostgREST lookup that can reject otherwise valid IDs.
      const canonicalAdmin = supervisorForm && requestedIds.includes("87673bd2-5151-4f8b-95e9-dba4f2a11045")
        ? [{id:"87673bd2-5151-4f8b-95e9-dba4f2a11045",name_ar:"الإدارة العامة",name_en:"General Administration",unit_type:"other"}]
        : [];
      const unitsForSubmission = [
        ...activeUnits.filter(unit => requestedIds.includes(String(unit.id))),
        ...canonicalAdmin.filter(admin => !activeUnits.some(unit => String(unit.id) === admin.id))
      ];
      if (supervisorForm && unitsForSubmission.some(unit =>
        String(unit.unit_type) === "department" && cleanText(unit.name_ar, 200) === "كتابة محتوى"
      )) {
        return json({
          success: false,
          error: "قسم «كتابة محتوى» يُدار عبر خلايا المحتوى. اختر خلية المحتوى المرتبطة بدلاً من اختيار القسم نفسه."
        }, 400);
      }
      const requestedUnits = unitsForSubmission
        .filter(unit => requestedIds.includes(String(unit.id)))
        .map(unit => {
          const raw = requestedUnitDetails[String(unit.id)];
          const detail = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
          let role = cleanText(detail.role, 30).toLowerCase();
          const joinedOn = normalizeDate(detail.joined_on);
          const continuing = detail.continuing === true;
          const leftOn = normalizeDate(detail.left_on);
          let roleStartedOn = normalizeDate(detail.role_started_on);
          let roleContinuing = detail.role_continuing === true;
          const roleContinuingProvided = Object.prototype.hasOwnProperty.call(detail, "role_continuing");
          const notes = cleanText(detail.notes, 1500);
          const seniorManagementPosition = cleanText(detail.senior_management_position, 120);

          if (supervisorForm && String(unit.unit_type) === "other") {
            role = "volunteer";
          }

          // Regular volunteers have only the volunteer/member role. Keep the
          // database timeline internally consistent without asking for a
          // separate role start/end date in their public form.
          if (!supervisorForm) {
            role = "volunteer";
            roleStartedOn = joinedOn;
            roleContinuing = continuing;
          }

          return {
            id: String(unit.id),
            name_ar: cleanText(unit.name_ar || unit.name_en, 200),
            unit_type: cleanText(unit.unit_type, 50),
            role,
            senior_management_position: seniorManagementPosition,
            joined_on: joinedOn,
            continuing,
            left_on: leftOn,
            role_started_on: roleStartedOn,
            role_continuing: roleContinuing,
            role_continuing_provided: supervisorForm ? roleContinuingProvided : true,
            role_left_on: supervisorForm ? normalizeDate(detail.role_left_on) : (continuing ? null : leftOn),
            notes
          };
        });
      if (requestedUnits.length !== requestedIds.length) {
        return json({ success: false, error: "يوجد قسم أو وحدة غير صالحة ضمن الاختيار." }, 400);
      }
      // Certificate links are independent from the current unit selection:
      // a member may have several current units, while a certificate belongs to
      // one active MedLife unit at a time. This keeps certificate history isolated
      // from multi-unit membership details.

      const defaultUnitRoles = ["volunteer","assistant_supervisor","supervisor","general_supervisor","content_writer"];
      const allowedUnitRoles = supervisorForm
        ? (configuredRoleOptions.length ? configuredRoleOptions.map(item => item.value) : defaultUnitRoles)
        : ["volunteer"];
      const allowedSeniorPositions = configuredSeniorPositions.length
        ? new Set(configuredSeniorPositions.map(item => item.value))
        : new Set(["general_supervisor_syria","advisor_deputy_general_supervisor","executive_director","medical_director","legal_advisor","financial_director"]);
      const configuredContentCellIds = new Set(
        Array.isArray(formSettings.content_cells)
          ? formSettings.content_cells
              .filter(item => item && typeof item === "object")
              .map(item => cleanText(item.id, 80))
              .filter(Boolean)
          : []
      );
      if (supervisorForm && requestedUnits.some(unit =>
        unit.role === "content_writer" &&
        (String(unit.unit_type) !== "cell" || !configuredContentCellIds.has(String(unit.id)))
      )) {
        return json({
          success: false,
          error: "دور «كاتب محتوى» يجب أن يكون مرتبطاً بإحدى خلايا المحتوى المعرّفة في إعدادات النموذج."
        }, 400);
      }
      if (requestedUnits.some(unit => !allowedUnitRoles.includes(unit.role))) {
        return json({ success: false, error: "يوجد دور غير صالح ضمن أحد الأقسام أو الوحدات." }, 400);
      }
      if (supervisorForm) {
        const adminUnits = requestedUnits.filter(unit => unit.unit_type === "other");
        if (adminUnits.some(unit => !unit.senior_management_position)) {
          return json({ success: false, error: "يرجى تحديد المنصب في الإدارة العامة." }, 400);
        }
        if (adminUnits.some(unit => unit.senior_management_position && !allowedSeniorPositions.has(unit.senior_management_position))) {
          return json({ success: false, error: "يوجد منصب إداري غير مدعوم ضمن إعدادات نموذج العضوية." }, 400);
        }
      }
      const today = new Date().toISOString().slice(0, 10);
      const timelineUnits = requestedUnits;

      if (timelineUnits.some(unit => !unit.joined_on)) {
        return json({ success: false, error: "يرجى تحديد تاريخ بدء الانتساب لكل قسم أو وحدة." }, 400);
      }
      const missingRoleStart = timelineUnits.find(unit => !unit.role_started_on);
      if (missingRoleStart) {
        return json({ success: false, error: "يرجى تحديد تاريخ بدء الدور داخل «" + missingRoleStart.name_ar + "»." }, 400);
      }
      if (timelineUnits.some(unit => unit.role_started_on > today || unit.role_started_on < unit.joined_on)) {
        return json({ success: false, error: "تاريخ بدء الدور يجب أن يكون بعد أو في تاريخ الانضمام إلى الوحدة وألا يكون في المستقبل." }, 400);
      }
      if (timelineUnits.some(unit => !unit.role_continuing_provided)) {
        return json({ success: false, error: "يرجى تحديد حالة استمرار الدور داخل كل وحدة." }, 400);
      }
      if (timelineUnits.some(unit => !unit.role_continuing && !unit.role_left_on)) {
        return json({ success: false, error: "يرجى تحديد تاريخ انتهاء الدور الذي لم تعد تشغله." }, 400);
      }
      if (timelineUnits.some(unit => unit.role_continuing && !unit.continuing)) {
        return json({ success: false, error: "لا يمكن أن يستمر الدور بعد انتهاء العضوية في الوحدة." }, 400);
      }
      if (timelineUnits.some(unit => unit.joined_on > today)) {
        return json({ success: false, error: "تاريخ بدء الانتساب لا يمكن أن يكون في المستقبل." }, 400);
      }
      if (timelineUnits.some(unit => !unit.continuing && !unit.left_on)) {
        return json({ success: false, error: "يرجى تحديد تاريخ انتهاء كل انتساب غير مستمر." }, 400);
      }
      if (timelineUnits.some(unit => unit.left_on && (unit.left_on < unit.joined_on || unit.left_on > today))) {
        return json({ success: false, error: "تواريخ انتهاء الانتساب يجب أن تكون بعد تاريخ البدء وألا تتجاوز تاريخ اليوم." }, 400);
      }
      if (timelineUnits.some(unit => unit.role_left_on && (unit.role_left_on < unit.role_started_on || unit.role_left_on > today))) {
        return json({ success: false, error: "تواريخ انتهاء الدور يجب أن تكون بعد تاريخ بدء الدور وألا تتجاوز تاريخ اليوم." }, 400);
      }
      if (timelineUnits.some(unit => unit.role_left_on && unit.left_on && unit.role_left_on > unit.left_on)) {
        return json({ success: false, error: "لا يمكن أن يستمر الدور بعد مغادرة الوحدة." }, 400);
      }

      const hasContinuingUnit = requestedUnits.some(unit => unit.continuing);
      const overallContinuing = supervisorForm ? true : data.continuing_as_volunteer === true;
      if (!supervisorForm && overallContinuing !== hasContinuingUnit) {
        return json({ success: false, error: hasContinuingUnit
          ? "يوجد قسم ما زلت مستمراً فيه، لذلك يجب اختيار الاستمرار مع ميدلايف أيضاً."
          : "لم تعد مستمراً بأي قسم مختار، لذلك يجب اختيار عدم الاستمرار مع ميدلايف."
        }, 400);
      }

      const numberValue = value => {
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
      };
      const toArray = value => Array.isArray(value)
        ? value.map(item => cleanText(item, 100)).filter(Boolean).slice(0, 30)
        : [];
      const rawCertificateHistory = certificateFeatureEnabled && Array.isArray(data.certificate_history)
        ? data.certificate_history
            .filter(item => item && typeof item === "object" && !Array.isArray(item))
            .filter(item => (
              String(item.type ?? "").trim() ||
              String(item.title ?? "").trim() ||
              String(item.issuing_organization ?? "").trim() ||
              String(item.issued_date ?? "").trim() ||
              String(item.issuing_unit_id ?? "").trim() ||
              String(item.reference_code ?? "").trim() ||
              String(item.notes ?? "").trim()
            ))
            .slice(0, 30)
        : [];
      const certificateHistory = [];
      const certificateTypeField = (dynamic.form_schema?.fields || [])
        .find(field => field.field_key === "certificate_types");
      const configuredCertificateTypes = Array.isArray(certificateTypeField?.options)
        ? certificateTypeField.options
            .map(option => cleanText(option?.value, 60).toLowerCase())
            .filter(value => value && value !== "none")
        : [];
      const validCertificateTypes = new Set(
        configuredCertificateTypes.length
          ? configuredCertificateTypes
          : DEFAULT_CERTIFICATE_TYPE_OPTIONS.map(option => option.value)
      );
      for (const item of rawCertificateHistory) {
        // Keep the selected category with the certificate record. Older clients
        // that do not send a category remain compatible and are stored as "other".
        const requestedType = cleanText(item.type, 60).toLowerCase();
        if (requestedType && !validCertificateTypes.has(requestedType)) {
          return json({ success: false, error: "نوع الشهادة المختار غير صالح." }, 400);
        }
        const type = requestedType || "other";
        const title = cleanText(item.title, 500);
        const issuingOrganization = cleanText(item.issuing_organization, 500);
        const issuedDate = normalizeDate(item.issued_date);
        const issuingUnitId = cleanText(item.issuing_unit_id, 80);
        const issuingUnitName = cleanText(item.issuing_unit_name, 200);
        const referenceCode = cleanText(item.reference_code, 120);
        const notes = cleanText(item.notes, 1500);
        if (!title || !issuingOrganization || !issuedDate) {
          return json({ success: false, error: "كل شهادة يجب أن تتضمن اسمها والجهة المانحة وتاريخ الحصول عليها." }, 400);
        }
        if (issuedDate > new Date().toISOString().slice(0,10)) {
          return json({ success: false, error: "تاريخ الحصول على الشهادة لا يمكن أن يكون في المستقبل." }, 400);
        }
        let canonicalIssuingUnitId = issuingUnitId;
        if (certificateUnitLinkRequired && !issuingUnitId && !issuingUnitName) {
          return json({ success: false, error: "يرجى تحديد الفريق أو الوحدة المرتبطة بكل شهادة." }, 400);
        }
        if (issuingUnitId || issuingUnitName) {
          if (!certificateUnitLinkEnabled) {
            return json({ success: false, error: "ربط الشهادة بوحدة غير مفعّل في إعدادات نموذج العضوية." }, 400);
          }
          const liveUnit = await findLiveCertificateUnit(issuingUnitId, issuingUnitName);
          if (!liveUnit) {
            return json({ success: false, error: "الفريق أو الوحدة المرتبطة بالشهادة يجب أن تكون وحدة فعّالة في ميدلايف." }, 400);
          }
          canonicalIssuingUnitId = String(liveUnit.id);
        }
        certificateHistory.push({
          type,
          title,
          issuing_organization: issuingOrganization,
          issued_date: issuedDate,
          issuing_unit_id: canonicalIssuingUnitId || null,
          issuing_unit_name: issuingUnitName || null,
          reference_code: referenceCode || null,
          notes: notes || null
        });
      }
      const certificateTypes = [...new Set(certificateHistory.map(item => item.type))];

      const payload = {
        form_id: dynamic.form_id,
        form_version: dynamic.form_version,
        status: "pending",
        membership_number: null,
        full_name: cleanText(data.full_name, 150),
        father_name: cleanText(data.father_name, 150),
        mother_name: cleanText(data.mother_name, 150),
        national_id: cleanText(data.national_id, 40),
        country: cleanText(data.country, 100),
        country_other: cleanText(data.country_other, 100),
        nationality: cleanText(data.nationality, 100),
        nationality_other: cleanText(data.nationality_other, 100),
        governorate: cleanText(data.governorate, 100),
        city: cleanText(data.city, 120),
        full_address: cleanText(data.full_address, 1000),
        date_of_birth: normalizeDate(data.date_of_birth),
        gender: cleanText(data.gender, 20),
        email: cleanText(data.email, 250).toLowerCase(),
        phone: cleanText(data.phone, 50),
        emergency_contact_name: cleanText(data.emergency_contact_name, 150),
        emergency_contact_relationship: cleanText(data.emergency_contact_relationship, 50),
        emergency_contact_phone: cleanText(data.emergency_contact_phone, 50),
        emergency_contact_alt_phone: cleanText(data.emergency_contact_alt_phone, 50),
        emergency_contact_notes: cleanText(data.emergency_contact_notes, 1500),
        supervisor_start_date: normalizeDate(data.supervisor_start_date),
        academic_status: cleanText(data.academic_status, 60),
        university: cleanText(data.university, 250),
        specialty: cleanText(data.specialty, 250),
        consultation_specialty: cleanText(data.consultation_specialty, 250),
        consultation_specialty_other: cleanText(data.consultation_specialty_other, 500),
        profession: cleanText(data.profession, 250),
        workplace: cleanText(data.workplace, 250),
        skills: cleanText(data.skills, 1000).split(/[,،]/).map(value => value.trim()).filter(Boolean).slice(0, 30),
        self_declared_talents: toArray(data.talent_areas),
        undiscovered_talents: cleanText(data.undiscovered_talents, 2000),
        desired_contributions: toArray(data.desired_contributions),
        development_interests: toArray(data.development_interests),
        join_date: normalizeDate(data.join_date),
        requested_unit_ids: requestedUnits.map(unit => unit.id),
        requested_units: requestedUnits,
        requested_unit_roles: Object.fromEntries(requestedUnits.map(unit => [unit.id, unit.role])),
        requested_unit_details: Object.fromEntries(requestedUnits.map(unit => [unit.id, {
          role: unit.role,
          senior_management_position: unit.senior_management_position,
          role_started_on: unit.role_started_on,
          role_continuing: unit.role_continuing,
          role_left_on: unit.role_left_on,
          joined_on: unit.joined_on,
          continuing: unit.continuing,
          left_on: unit.left_on,
          notes: unit.notes
        }])),
        reported_total_volunteer_hours: numberValue(data.reported_total_volunteer_hours),
        field_available_days: toArray(data.field_available_days),
        volunteer_commitment_hours: numberValue(data.volunteer_commitment_hours),
        certificate_types: certificateTypes,
        certificate_other: cleanText(data.certificate_other, 500),
        certificate_history: certificateHistory,
        availability: cleanText(data.availability, 50),
        education_track: cleanText(data.academic_status, 60),
        interest_areas: toArray(data.interest_areas),
        continuing_as_volunteer: supervisorForm ? true : data.continuing_as_volunteer === true,
        additional_notes: cleanText(data.additional_notes, 3000),
        declaration_accurate: true,
        privacy_consent: true,
        form_data: {
          ...dynamic.form_data,
          current_units: requestedUnits.map(unit => unit.id),
          current_unit_details: Object.fromEntries(requestedUnits.map(unit => [unit.id, {
            role: unit.role,
            senior_management_position: unit.senior_management_position,
            role_started_on: unit.role_started_on,
            role_continuing: unit.role_continuing,
            role_left_on: unit.role_left_on,
            joined_on: unit.joined_on,
            continuing: unit.continuing,
            left_on: unit.left_on,
            notes: unit.notes
          }])),
          certificate_history: certificateHistory
        },
        form_schema: {
          ...dynamic.form_schema,
          fields: dynamic.form_schema.fields.map(field => field.field_key === "current_units"
            ? {...field, options: requestedUnits.map(unit => ({value: unit.id, label_ar: unit.name_ar, label_en: unit.name_ar}))}
            : field)
        },
        source: "public_website"
      };

      const requiredCore = [
        "full_name","father_name","mother_name","national_id","country",
        "full_address","date_of_birth","gender","email","phone","academic_status","join_date"
      ];
      const missingRequiredCore = requiredCore.some(key => !String(payload[key] ?? "").trim())
        || (payload.country === "سوريا" && !String(payload.governorate ?? "").trim())
        || (payload.country === "أخرى" && !String(payload.country_other ?? "").trim())
        || (payload.nationality === "أخرى" && !String(payload.nationality_other ?? "").trim());
      if (missingRequiredCore) {
        return json({ success: false, error: "يرجى إكمال جميع المعلومات الأساسية المطلوبة." }, 400);
      }
      const requiredEmergency = ["emergency_contact_name","emergency_contact_relationship","emergency_contact_phone"];
      if (requiredEmergency.some(key => !String(payload[key] ?? "").trim())) {
        return json({ success: false, error: "يرجى تعبئة اسم شخص الطوارئ وصلته ورقم هاتفه." }, 400);
      }

      // The public API uses the anonymous publishable key. Avoid return=representation
      // because PostgREST would then require SELECT privilege on the membership table.
      // Generate the row ID ourselves, insert with return=minimal, and return the known ID.
      const submissionId = crypto.randomUUID();
      payload.id = submissionId;
      const response = await fetch(SUPABASE_URL + "/rest/v1/public_membership_renewal_submissions", {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: "Bearer " + SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Membership renewal write failed", response.status, errorText);
        if (
          response.status === 409 ||
          /23505|national_id|هذا الرقم الوطني مسجل مسبقاً|الرقم الوطني مسجل/i.test(errorText)
        ) {
          return json({
            success: false,
            error: "هذا الرقم الوطني مسجل مسبقاً لدى ميدلايف. يرجى مراجعة الإدارة أو مراسلتها لإتمام الإجراء."
          }, 409);
        }
        return json({ success: false, error: "تعذر تسجيل طلب العضوية حالياً." }, 502);
      }
      // The submission is already committed. Receipt lookup is best-effort:
      // a transient RPC/network failure must never turn a successful insert into
      // an error response that encourages the browser to submit the same form again.
      let receipt = {};
      try {
        const receiptResponse = await fetch(SUPABASE_URL + "/rest/v1/rpc/get_membership_renewal_receipt", {
          method: "POST",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: "Bearer " + SUPABASE_ANON_KEY,
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({p_submission_id: submissionId, p_email: cleanText(data.email, 250).toLowerCase()})
        });
        if (receiptResponse.ok) receipt = await receiptResponse.json().catch(() => ({}));
      } catch (receiptError) {
        console.error("Membership submission saved but receipt lookup failed", submissionId, receiptError?.message || receiptError);
      }
      const hasReceipt = Boolean(receipt?.success && receipt?.membership_number);
      return json({
        success: true,
        submission_id: submissionId,
        membership_number: hasReceipt ? receipt.membership_number : null,
        message: hasReceipt
          ? (supervisorForm
              ? "تم حفظ بيانات المشرف وإصدار رقم العضوية وبطاقة العضوية بنجاح."
              : "تم تسجيل تجديد العضوية مباشرة في قاعدة أعضاء ميدلايف.")
          : "تم استلام البيانات وحفظ الطلب، لكن تعذر تأكيد رقم العضوية الآن. لا تعِد إرسال النموذج؛ يرجى التواصل مع الإدارة."
      }, 201);
    } else {
      // New applicants are handled separately from the existing member renewal flow.
      if (body.action === "new_volunteer_application" && body.privacy_consent !== true) {
        return json({ success: false, error: "يرجى الموافقة على معالجة بيانات طلب الانضمام." }, 400);
      }
      const recruitmentResponse = await fetch(
        SUPABASE_URL + "/rest/v1/volunteer_recruitment_settings?select=is_open,opens_at,closes_at&id=eq.1",
        {
          headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
            Accept: "application/json"
          }
        }
      );
      const recruitment = await recruitmentResponse.json().catch(() => []);
      const config = Array.isArray(recruitment) ? recruitment[0] : null;
      const now = Date.now();
      const opensAt = config?.opens_at ? Date.parse(config.opens_at) : null;
      const closesAt = config?.closes_at ? Date.parse(config.closes_at) : null;
      const isOpen = Boolean(config?.is_open) && (!opensAt || now >= opensAt) && (!closesAt || now < closesAt);
      if (!isOpen) {
        return json({ success: false, error: "باب الانضمام مغلق حالياً." }, 403);
      }

      payload = volunteerPayload(body);
      if (!payload.full_name || !payload.phone ||
          (body.action !== "new_volunteer_application" && !payload.governorate)) {
        return json({ success: false, error: "يرجى تعبئة الاسم والهاتف والمحافظة." }, 400);
      }

      try {
        const dynamic = await validateAndSanitizeFormData(body);
        if (body.action === "new_volunteer_application" && dynamic.form_schema?.form_key !== "new_volunteer_application") {
          return json({ success: false, error: "استمارة الانضمام المعتمدة غير متطابقة." }, 400);
        }
        payload.form_id = dynamic.form_id;
        payload.form_version = dynamic.form_version;
        payload.form_data = dynamic.form_data;
        payload.form_schema = dynamic.form_schema;
        if (body.action === "new_volunteer_application") {
          // Never trust a client-only "verified" flag. The database will
          // atomically verify this server-side OTP proof and consume it on insert.
          const challenge = cleanText(body.identity_challenge_id, 50);
          if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(challenge)) {
            return json({
              success:false, code:"identity_reverification_required",
              error:"يرجى إكمال التحقق من بريدك الإلكتروني قبل إرسال طلب الانضمام."
            },400);
          }
          payload.form_data._join_identity_challenge = challenge;
        }
      } catch (formError) {
        return json({ success: false, error: formError.message || "نموذج الانضمام غير صالح." }, 400);
      }

      if (body.action === "new_volunteer_application") {
        // Treat the validated form snapshot as authoritative: the client cannot
        // bypass national-ID duplicate protection by changing only top-level fields.
        const identity = volunteerPayload({...body, ...payload.form_data});
        for (const key of [
          "full_name","mother_name","national_id","date_of_birth","gender",
          "email","phone","governorate","address","academic_status","university",
          "faculty","study_year","profession","workplace","resident_specialty",
          "residency_year","residency_hospital","doctor_specialty","specialty","motivation"
        ]) payload[key] = identity[key];
        payload.national_id = normalizeNationalIdentifier(payload.form_data.national_id);
        if (payload.form_data.country === "أخرى") {
          const country = INTAKE_OTHER_COUNTRIES.find(option=>option.value===payload.form_data.other_country);
          payload.governorate = cleanText(payload.form_data.foreign_region, 100);
          // Keep country + region in the existing address column as well as the versioned answers;
          // the application table currently has no dedicated country/city column.
          payload.address = cleanText((country?.label_ar||"") + "، " + (payload.form_data.foreign_region||"") + " — " + (payload.form_data.address||""), 500);
        }
        // Preserve both the medically scoped choice and its Arabic label.
        if (payload.form_data.medical_consultation_specialties?.length) {
          payload.consultation_specialty = cleanText(
            payload.form_data.medical_consultation_specialties
              .map(code=>INTAKE_ALL_SPECIALTIES.find(option=>option.value===code)?.label_ar||code).join("، "),
            250
          );
        }
        if (!payload.national_id) {
          return json({success:false,error:"يرجى إدخال رقم وطني صحيح في بياناتك الشخصية."},400);
        }
        if (!payload.governorate) {
          return json({success:false,error:"يرجى تحديد المحافظة أو الولاية أو المنطقة التي تقيم فيها."},400);
        }
        // Applicant preferences are broad recruitment tracks, NOT internal org units.
        // The assigned unit and internal distribution are selected later by authorized HR staff.
        const ranked = payload.form_data?.volunteer_interest_preferences;
        const first = payload.form_data?.primary_volunteer_field;
        const label = NEW_VOLUNTEER_CATEGORIES.find(category => category.value === first)?.label_ar;
        if (!Array.isArray(ranked) || ranked.length < 1 || !label) {
          return json({ success: false, error: "يرجى تحديد مجال التطوع الأساسي." }, 400);
        }
        payload.interest = label;
        payload.requested_departments = [];
        payload.id = crypto.randomUUID();
      } else {
        const unitsResponse = await fetch(
          SUPABASE_URL + "/rest/v1/org_units?select=name_ar,name_en&unit_type=in.(cell,department,field_team)&is_active=eq.true",
          {
            headers: {
              apikey: SUPABASE_PUBLISHABLE_KEY,
              Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
              Accept: "application/json"
            }
          }
        );
        const units = await unitsResponse.json().catch(() => []);
        const allowedNames = new Set(
          (Array.isArray(units) ? units : []).flatMap((unit) => [unit.name_ar, unit.name_en]).filter(Boolean)
        );
        if (body.action === "new_volunteer_application") {
          const preferred = payload.requested_departments;
          if (preferred.length < 1 || preferred.length > 3 ||
              new Set(preferred).size !== preferred.length ||
              !preferred.every(name => allowedNames.has(name))) {
            return json({ success: false, error: "يجب اختيار رغبة إلى ثلاث رغبات تطوعية صحيحة وغير مكررة." }, 400);
          }
          // The membership number is issued only after an authorized acceptance decision.
          payload.id = crypto.randomUUID();
        }
        payload.requested_departments = payload.requested_departments.filter((item) => allowedNames.has(item));
      }
    }

    const writeUrl = SUPABASE_URL + "/rest/v1/" + target;
    const response = await fetch(writeUrl, {
      method: "POST",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorText = await response.text();
      // Database uniqueness errors can contain sensitive identity details.
      // Do not log raw errors from new volunteer applications.
      console.error("Public management write failed", target, response.status,
        body.action === "new_volunteer_application" ? "[identity details suppressed]" : errorText.slice(0,500));
      if (body.action === "new_volunteer_application" &&
          /يرجى (إتمام|إعادة) التحقق من البريد الإلكتروني|join_identity_proof|identity_challenge/i.test(errorText)) {
        return json({
          success:false, code:"identity_reverification_required",
          error:"رمز التحقق من البريد لم يعد صالحاً. يرجى إعادة التحقق ثم إرسال الطلب مجدداً."
        },400);
      }
      if (body.action === "new_volunteer_application" && (
        /national_id|الرقم الوطني|public_volunteer_applications_national_id/i.test(errorText)
      )) {
        return json({
          success: false, code: "duplicate_national_id",
          error: "هذه البيانات مرتبطة بسجل سابق في ميدلايف. إذا كنت عضواً سابقاً وترغب بالعودة، يرجى التواصل مع إدارة المؤسسة بدلاً من تقديم طلب انضمام جديد.",
          contact_email: "info@medlifesy.org",
          complaints_url: "/contact.html#complaints"
        }, 409);
      }
      if (body.action === "new_volunteer_application" && (
        response.status === 409 || /23505|email_uq|duplicate key/i.test(errorText)
      )) {
        return json({
          success: false, code: "duplicate_application",
          error: "يوجد طلب سابق مرتبط بمعلوماتك. يرجى التواصل مع إدارة المؤسسة للتحقق من حالة طلبك.",
          contact_email: "info@medlifesy.org",
          complaints_url: "/contact.html#complaints"
        }, 409);
      }
      if (response.status === 409 ||
          /23505|national_id|public_volunteer_applications_national_id_active_unique|الرقم الوطني/i.test(errorText)) {
        return json({success: false, error: "هذا الرقم الوطني مسجل مسبقاً. لا يمكن إنشاء سجل عضو مكرر."}, 409);
      }
      return json({ success: false, error: "تعذر تسجيل الطلب في منصة الإدارة." }, 502);
    }
    const submissionId = ["article_submission","new_volunteer_application"].includes(body.action) ? payload.id || null : null;
    return json({ success: true, submission_id: submissionId, message: "تم تسجيل الطلب في منصة الإدارة." }, 201);
  } catch (error) {
    console.error("Management API POST error", error);
    return json({ success: false, error: "تعذر استقبال الطلب حالياً." }, 500);
  }
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const resource = url.searchParams.get("resource") || "";
  if (!Object.prototype.hasOwnProperty.call(RESOURCES, resource)) {
    return json({ success: false, error: "مصدر البيانات غير صالح." }, 400);
  }
  try {
    const data = await fetchResource(resource, url);
    return json({ success: true, resource, data });
  } catch (error) {
    console.error("Management API GET error", error);
    return json({ success: false, error: "تعذر الاتصال بمنصة الإدارة." }, 502);
  }
}
