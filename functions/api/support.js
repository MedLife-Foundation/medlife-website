/* MedLife Support Fund API
   Public read access + admin-only writes.
   Support applications are private until reviewed and approved.
   Uses the existing MEMBERS_DB D1 binding.
*/
import { json } from './_auth.js';

const SUPABASE_URL = 'https://ftvjakwogxdlxxbpfydf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_beiimOXraRWZguAX7balCQ_HVao1o3K';

async function ensure(db){
  await db.prepare(`CREATE TABLE IF NOT EXISTS support_cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'case',
    title TEXT NOT NULL,
    summary TEXT,
    description TEXT,
    target_amount INTEGER NOT NULL DEFAULT 0,
    funded_amount INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    urgent INTEGER NOT NULL DEFAULT 0,
    governorate TEXT,
    public_notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();

  const addColumn = async (name, definition) => { try { await db.prepare(`ALTER TABLE support_cases ADD COLUMN ${name} ${definition}`).run(); } catch (_) {} };
  await addColumn('beneficiary_count','INTEGER NOT NULL DEFAULT 0');
  await addColumn('beneficiary_label','TEXT');
  await addColumn('duration_months','INTEGER NOT NULL DEFAULT 0');
  await addColumn('monthly_per_beneficiary','INTEGER NOT NULL DEFAULT 0');
  await addColumn('spent_amount','INTEGER NOT NULL DEFAULT 0');
  await addColumn('amount_basis','TEXT');
  await addColumn('financial_status',"TEXT NOT NULL DEFAULT 'not_published'");
  await addColumn('start_date','TEXT');
  await addColumn('end_date','TEXT');
  await addColumn('verification_status',"TEXT NOT NULL DEFAULT 'internal_review'");
  await addColumn('support_type','TEXT');
  await addColumn('areas','TEXT');
  await addColumn('progress_stage','TEXT');
  await addColumn('public_status_note','TEXT');

  await db.prepare(`CREATE TABLE IF NOT EXISTS support_contributions (
    id INTEGER PRIMARY KEY AUTOINCREMENT, case_id INTEGER NOT NULL, amount INTEGER NOT NULL,
    donor_name TEXT, donor_public INTEGER NOT NULL DEFAULT 0, reference TEXT,
    status TEXT NOT NULL DEFAULT 'confirmed', note TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS support_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT, case_id INTEGER NOT NULL, label TEXT NOT NULL,
    url TEXT NOT NULL, public INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS support_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT, application_code TEXT NOT NULL UNIQUE,
    applicant_name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, governorate TEXT NOT NULL,
    area TEXT, request_type TEXT NOT NULL, beneficiary_relation TEXT, beneficiary_age TEXT,
    beneficiary_gender TEXT, need_summary TEXT NOT NULL, medical_details TEXT,
    requested_amount INTEGER NOT NULL DEFAULT 0, family_income TEXT, existing_support TEXT,
    document_urls TEXT, preferred_contact TEXT, consent INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending', admin_notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();

  // Verified campaign record supplied by MedLife. No names or sensitive beneficiary data are public.
  await db.prepare(`INSERT OR IGNORE INTO support_cases
    (code,type,title,summary,description,target_amount,funded_amount,status,urgent,governorate,public_notes,
     beneficiary_count,beneficiary_label,duration_months,monthly_per_beneficiary,spent_amount,amount_basis,financial_status,
     start_date,end_date,verification_status,support_type,areas,progress_stage,public_status_note)
    VALUES
    ('ML-IMPACT-ORPHANS-2026','project','دعم أكثر من 75 يتيماً لمدة 6 أشهر',
     'مبادرة دعم شهري مستمر لأكثر من 75 يتيماً في طرطوس وبانياس وجبلة وحماة.',
     'تم تنفيذ الدعم وفق معايير قبول موحدة تعتمد على ثبوت حالة اليتم، مستوى الاحتياج الاقتصادي والمعيشي، قدرة الأسرة على الرعاية، الاحتياجات التعليمية أو الصحية، وأولوية الحالات الأكثر هشاشة. تم تنظيم المستفيدين بحسب المنطقة وتوزيع الدعم شهرياً لمدة ستة أشهر مع الحفاظ على سرية بيانات الأطفال.',
     6750000,6750000,'funded',0,'عدة محافظات',
     'القيمة المرجعية المنشورة مبنية على 75 مستفيداً كحد أدنى × 15,000 ل.س جديدة شهرياً × 6 أشهر. العدد الفعلي كان أكثر من 75؛ لذلك لا يُعرض هذا الرقم كإجمالي صرف نهائي إلا وفق سجل الصرف الداخلي المعتمد.',
     75,'+75',6,15000,6750000,
     '15,000 ل.س جديدة لكل مستفيد شهرياً. الحد الأدنى الحسابي لـ75 مستفيداً لمدة 6 أشهر = 6,750,000 ل.س جديدة.',
     'verified','2026-01-01','2026-06-30','documented_internal','دعم شهري للأيتام','طرطوس • بانياس • جبلة • حماة','completed','مبادرة مكتملة؛ المستندات التفصيلية محفوظة ضمن السجلات الداخلية.');`).run();

  // Current real support request: amount and progress are explicit and public.
  await db.prepare(`INSERT OR IGNORE INTO support_cases
    (code,type,title,summary,description,target_amount,funded_amount,status,urgent,governorate,public_notes,
     beneficiary_count,beneficiary_label,duration_months,monthly_per_beneficiary,spent_amount,amount_basis,financial_status,
     verification_status,support_type,areas,progress_stage,public_status_note)
    VALUES
    ('ML-OPEN-ORPHAN-SCHOOL-2026','case','طفلة يتيمة بحاجة إلى دعم تعليمي ولوجستي',
     'حالة إنسانية في طرطوس تحتاج إلى دعم يساعد طفلة يتيمة على الاستمرار في تعليمها وتأمين احتياجاتها المدرسية واللوجستية.',
     'تشمل الاحتياجات المستلزمات المدرسية، الاحتياجات الشخصية المرتبطة بالمدرسة، المواصلات والتنقل، والاحتياجات التعليمية الأساسية. لا تُنشر أي معلومات تعريفية عن الطفلة حفاظاً على سلامتها وخصوصيتها.',
     10000,0,'active',1,'طرطوس',
     'تم اجتياز مرحلة التأكيد الأولي. الهدف الحالي لجمع الدعم هو 10,000 ل.س جديدة، ولم يتم تسجيل أي مساهمة بعد.',
     1,'طفلة واحدة',0,0,0,'هدف جمع الدعم المعتمد للحالة','not_published',
     'confirmed_initial','دعم تعليمي ولوجستي','طرطوس','fundraising','التأكيد الأولي مكتمل؛ جمع الدعم مفتوح حالياً.');`).run();

  const completed = [
    ['ML-SUP-2026-001','عملية جراحية','مساهمة في عملية جراحية لحالة محتاجة','12,500'],
    ['ML-SUP-2026-002','كرسي متحرك','تأمين كرسي متحرك لمستفيد بحاجة إلى وسيلة حركة','8,500'],
    ['ML-SUP-2026-003','أدوية مزمنة','تأمين أدوية علاجية لمريض مزمن','4,200'],
    ['ML-SUP-2026-004','فحوصات طبية','المساهمة في فحوصات واستقصاءات طبية','3,800'],
    ['ML-SUP-2026-005','سماعة أذن','تأمين سماعة أذن لمستفيد بحاجة إليها','11,000'],
    ['ML-SUP-2026-006','عملية عينية','المساهمة في تكاليف عملية عينية','9,500'],
    ['ML-SUP-2026-007','أدوات مساعدة للحركة','تأمين أدوات مساعدة على الحركة','2,750'],
    ['ML-SUP-2026-008','جلسات إعادة تأهيل','تغطية جلسات إعادة تأهيل','6,000'],
    ['ML-SUP-2026-009','حليب ومستلزمات طفل','تأمين حليب ومستلزمات أساسية لطفل','3,300'],
    ['ML-SUP-2026-010','علاج دوائي متخصص','المساهمة في علاج دوائي متخصص','7,200'],
    ['ML-SUP-2026-011','سرير طبي','تأمين سرير طبي ومستلزمات مرتبطة به','14,000'],
    ['ML-SUP-2026-012','علاج أسنان','المساهمة في علاج سني','5,000'],
    ['ML-SUP-2026-013','مستلزمات مدرسية','تأمين مستلزمات مدرسية لطفل محتاج','2,500'],
    ['ML-SUP-2026-014','مستلزمات علاجية','تأمين مستلزمات علاجية أساسية','4,600'],
    ['ML-SUP-2026-015','علاج ومتابعة طفل','المساهمة في علاج ومتابعة طفل','10,500']
  ];
  for(const [code,title,summary,amount] of completed){
    await db.prepare(`INSERT OR IGNORE INTO support_cases
      (code,type,title,summary,description,target_amount,funded_amount,status,urgent,governorate,public_notes,
       beneficiary_count,beneficiary_label,duration_months,monthly_per_beneficiary,spent_amount,amount_basis,financial_status,
       verification_status,support_type,areas,progress_stage,public_status_note)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
      code,'case',title,summary,
      `${summary}. تم تسجيل الحالة كسجل أثر مكتمل وفق بيانات المساعدة المقدمة من المؤسسة، مع عدم نشر أي معلومات تعريفية عن المستفيد. المستندات التفصيلية محفوظة ضمن السجلات الداخلية.`,
      Number(amount),Number(amount),'funded',0,'غير منشور',
      'المبلغ المعروض هو قيمة المساعدة المقدمة للحالة. حفاظاً على الخصوصية لا تُنشر هوية المستفيد.',
      1,'مستفيد واحد',0,0,Number(amount),`${amount} ل.س جديدة`,'verified',
      'documented_internal','دعم مباشر','غير منشور','completed','تمت المساعدة؛ التوثيق المالي محفوظ ضمن السجلات الداخلية.'
    ).run();
  }
}

function admin(request,env){return !!env.ADMIN_API_KEY && request.headers.get('X-Admin-Key')===env.ADMIN_API_KEY}
function cleanCase(x,docs=[]){
  const target=Number(x.target_amount||0), funded=Number(x.funded_amount||0);
  return {...x,urgent:Boolean(x.urgent),target_amount:target,funded_amount:funded,
    progress_percent:target>0?Math.min(100,Math.round((funded/target)*100)):100,
    beneficiary_count:Number(x.beneficiary_count||0),duration_months:Number(x.duration_months||0),
    monthly_per_beneficiary:Number(x.monthly_per_beneficiary||0),spent_amount:Number(x.spent_amount||0),
    documents:docs.filter(d=>d.public!==0)};
}
function text(v,max=5000){return String(v??'').trim().slice(0,max)}
function validPhone(v){return /^[+0-9()\-\s]{7,25}$/.test(String(v||'').trim())}

export async function onRequest({request,env}){
  if(!env.MEMBERS_DB)return json({success:false,error:'Database binding is not configured.'},500);
  try{
    await ensure(env.MEMBERS_DB);
    if(request.method==='GET'){
      const rows=await env.MEMBERS_DB.prepare(`SELECT * FROM support_cases WHERE status IN ('active','funded') ORDER BY CASE WHEN status='active' THEN 0 ELSE 1 END, urgent DESC, id DESC`).all();
      const cases=[]; for(const x of (rows.results||[])){const d=await env.MEMBERS_DB.prepare(`SELECT label,url,public FROM support_documents WHERE case_id=? AND public=1 ORDER BY id DESC`).bind(x.id).all(); cases.push(cleanCase(x,d.results||[]));}
      const total=await env.MEMBERS_DB.prepare(`SELECT COALESCE(SUM(CASE WHEN financial_status='verified' THEN spent_amount ELSE 0 END),0) total FROM support_cases`).first();
      return json({success:true,cases,totalFunded:Number(total?.total||0)});
    }
    if(request.method==='POST'){
      const body=await request.json();
      if(body.action==='apply'){
        if(body.website)return json({success:true,message:'تم استلام الطلب.'});
        const applicant=text(body.applicant_name,160),phone=text(body.phone,40),governorate=text(body.governorate,80),requestType=text(body.request_type,80),need=text(body.need_summary,2000);
        if(!applicant||!phone||!governorate||!requestType||!need||!body.consent)return json({success:false,error:'يرجى تعبئة الحقول المطلوبة والموافقة على معالجة الطلب.'},400);
        if(!validPhone(phone))return json({success:false,error:'يرجى إدخال رقم هاتف صحيح.'},400);
        const amount=Math.max(0,Math.min(100000000000,Number(body.requested_amount||0))); if(!Number.isFinite(amount))return json({success:false,error:'قيمة المبلغ غير صحيحة.'},400);
        const supabaseResponse = await fetch(SUPABASE_URL + '/rest/v1/rpc/support_submit_application', {
          method: 'POST',
          headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: 'Bearer ' + SUPABASE_PUBLISHABLE_KEY,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({p_payload: {
            applicant_name: applicant,
            phone,
            email: text(body.email,160),
            governorate,
            area: text(body.area,120),
            request_type: requestType,
            beneficiary_relation: text(body.beneficiary_relation,100),
            beneficiary_age: text(body.beneficiary_age,30),
            beneficiary_gender: text(body.beneficiary_gender,30),
            need_summary: need,
            medical_details: text(body.medical_details,3000),
            requested_amount: amount,
            family_income: text(body.family_income,500),
            existing_support: text(body.existing_support,1000),
            document_urls: Array.isArray(body.document_urls) ? body.document_urls.map(v=>text(v,600)).filter(Boolean).slice(0,10) : [],
            preferred_contact: text(body.preferred_contact,80),
            consent: true
          }})
        });
        const responseText = await supabaseResponse.text();
        let rpcResult = null;
        try { rpcResult = JSON.parse(responseText); } catch (_) {}
        const applicationCode = rpcResult?.application_code;
        if (!supabaseResponse.ok || rpcResult?.success !== true || typeof applicationCode !== 'string' || !applicationCode.startsWith('MSA-')) {
          console.error('Supabase support application submission failed', supabaseResponse.status, responseText.slice(0,300));
          return json({success:false,error:'تعذر حفظ الطلب حالياً. يرجى المحاولة لاحقاً.'},502);
        }
        return json({success:true,application_code:applicationCode,message:'تم استلام طلبك. سيقوم فريق ميدلايف بمراجعته والتواصل معك.'},201);
      }
      if(!admin(request,env))return json({success:false,error:'غير مصرح.'},401);
      const action=body.action;
      if(action==='create'){
        const code=text(body.code,80)||`ML-${Date.now().toString(36).toUpperCase()}`;
        const r=await env.MEMBERS_DB.prepare(`INSERT INTO support_cases(code,type,title,summary,description,target_amount,status,urgent,governorate,public_notes,beneficiary_count,beneficiary_label,duration_months,monthly_per_beneficiary,spent_amount,amount_basis,financial_status,start_date,end_date,verification_status,support_type,areas,progress_stage,public_status_note) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(code,text(body.type,30)||'case',text(body.title,180),text(body.summary,600),text(body.description,4000),Math.max(0,Number(body.target_amount||0)),text(body.status,30)||'active',body.urgent?1:0,text(body.governorate,80),text(body.public_notes,1500),Math.max(0,Number(body.beneficiary_count||0)),text(body.beneficiary_label,80),Math.max(0,Number(body.duration_months||0)),Math.max(0,Number(body.monthly_per_beneficiary||0)),Math.max(0,Number(body.spent_amount||0)),text(body.amount_basis,1500),text(body.financial_status,40)||'not_published',text(body.start_date,30),text(body.end_date,30),text(body.verification_status,40)||'internal_review',text(body.support_type,120),text(body.areas,300),text(body.progress_stage,60),text(body.public_status_note,500)).run();
        return json({success:true,id:r.meta?.last_row_id,code});
      }
      if(action==='applications'){
        const status=body.status?text(body.status,30):null; const q=status?await env.MEMBERS_DB.prepare(`SELECT * FROM support_applications WHERE status=? ORDER BY id DESC`).bind(status).all():await env.MEMBERS_DB.prepare(`SELECT * FROM support_applications ORDER BY id DESC`).all(); return json({success:true,applications:q.results||[]});
      }
      if(action==='application_update'){
        const id=Number(body.id);if(!id)return json({success:false,error:'معرف الطلب غير صحيح.'},400);const allowed=['pending','under_review','verified','approved','rejected','closed'];const status=allowed.includes(body.status)?body.status:'pending';await env.MEMBERS_DB.prepare(`UPDATE support_applications SET status=?,admin_notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(status,text(body.admin_notes,3000),id).run();return json({success:true,status});
      }
      if(action==='update'){
        const id=Number(body.id);const current=await env.MEMBERS_DB.prepare('SELECT * FROM support_cases WHERE id=?').bind(id).first();if(!current)return json({success:false,error:'الحالة غير موجودة.'},404);
        const target=Math.max(0,Number(body.target_amount??current.target_amount)),funded=Math.max(0,Number(body.funded_amount??current.funded_amount)),status=funded>=target&&target>0?'funded':(body.status||current.status);
        await env.MEMBERS_DB.prepare(`UPDATE support_cases SET title=?,summary=?,description=?,target_amount=?,funded_amount=?,status=?,urgent=?,governorate=?,public_notes=?,beneficiary_count=?,beneficiary_label=?,duration_months=?,monthly_per_beneficiary=?,spent_amount=?,amount_basis=?,financial_status=?,start_date=?,end_date=?,verification_status=?,support_type=?,areas=?,progress_stage=?,public_status_note=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(body.title??current.title,body.summary??current.summary,body.description??current.description,target,funded,status,body.urgent==null?current.urgent:(body.urgent?1:0),body.governorate??current.governorate,body.public_notes??current.public_notes,body.beneficiary_count==null?current.beneficiary_count:Math.max(0,Number(body.beneficiary_count)),body.beneficiary_label??current.beneficiary_label,body.duration_months==null?current.duration_months:Math.max(0,Number(body.duration_months)),body.monthly_per_beneficiary==null?current.monthly_per_beneficiary:Math.max(0,Number(body.monthly_per_beneficiary)),body.spent_amount==null?current.spent_amount:Math.max(0,Number(body.spent_amount)),body.amount_basis??current.amount_basis,body.financial_status??current.financial_status,body.start_date??current.start_date,body.end_date??current.end_date,body.verification_status??current.verification_status,body.support_type??current.support_type,body.areas??current.areas,body.progress_stage??current.progress_stage,body.public_status_note??current.public_status_note,id).run();return json({success:true,status});
      }
      if(action==='contribution'){
        const id=Number(body.case_id),amount=Math.max(0,Number(body.amount||0));if(!id||!amount)return json({success:false,error:'بيانات المساهمة غير مكتملة.'},400);await env.MEMBERS_DB.prepare(`INSERT INTO support_contributions(case_id,amount,donor_name,donor_public,reference,status,note) VALUES(?,?,?,?,?,?,?)`).bind(id,amount,body.donor_public?String(body.donor_name||'متبرع'):null,body.donor_public?1:0,text(body.reference,200),text(body.status,30)||'confirmed',text(body.note,1000)).run();await env.MEMBERS_DB.prepare(`UPDATE support_cases SET funded_amount=MIN(target_amount,funded_amount+?),status=CASE WHEN target_amount>0 AND funded_amount+?>=target_amount THEN 'funded' ELSE status END,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(amount,amount,id).run();return json({success:true});
      }
      if(action==='document'){const id=Number(body.case_id);if(!id||!body.label||!body.url)return json({success:false,error:'بيانات الوثيقة غير مكتملة.'},400);await env.MEMBERS_DB.prepare(`INSERT INTO support_documents(case_id,label,url,public) VALUES(?,?,?,?)`).bind(id,text(body.label,120),text(body.url,1000),body.public===false?0:1).run();return json({success:true});}
      if(action==='close'){const id=Number(body.id);await env.MEMBERS_DB.prepare(`UPDATE support_cases SET status='closed',updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(id).run();return json({success:true})}
      return json({success:false,error:'Unknown action.'},400);
    }
    return json({success:false,error:'Method not allowed.'},405);
  }catch(e){console.error(e);return json({success:false,error:'تعذر تنفيذ العملية حالياً.'},500)}
}
