/* =========================================================
   MEDLIFE MEMBERS ADMIN API
   GET    /api/members-admin
   PATCH  /api/members-admin

   Protected by ADMIN_KEY and backed by the same D1 binding as member auth: DB.
========================================================= */
const ALLOWED_STATUSES = ["active", "suspended", "inactive", "approved", "pending"];
export async function onRequest(context) {
 const { request, env } = context;
 if (request.method === "OPTIONS") return json({ success: true });
 if (!env.DB) return json({success:false,error:"Database binding 'DB' is not configured."},500);
 const adminKey = typeof env.ADMIN_KEY === "string" ? env.ADMIN_KEY.trim() : "";
 if (!adminKey) return json({success:false,error:"Admin secret 'ADMIN_KEY' is not available to this Production Pages Function."},500);
 if (!await isAuthorized(request,adminKey)) return json({success:false,error:"غير مصرح بالدخول إلى لوحة الإدارة."},401);
 try {
  if (request.method === "GET") return await listMembers(request,env.DB);
  if (request.method === "PATCH") return await updateMember(request,env.DB);
  return json({success:false,error:"Method not allowed."},405);
 } catch(error) { console.error("Members admin API error:",error); return json({success:false,error:"تعذر تنفيذ عملية الإدارة حالياً."},500); }
}
async function listMembers(request,db){
 const url=new URL(request.url),status=cleanFilter(url.searchParams.get("status")),role=cleanFilter(url.searchParams.get("role")),cell=cleanFilter(url.searchParams.get("cell")),governorate=cleanFilter(url.searchParams.get("governorate")),search=cleanFilter(url.searchParams.get("search"));
 const conditions=[],binds=[];
 if(status&&status!=="all"){conditions.push("status = ?");binds.push(status)}
 if(role&&role!=="all"){conditions.push("medlife_role = ?");binds.push(role)}
 if(cell&&cell!=="all"){conditions.push("cell = ?");binds.push(cell)}
 if(governorate&&governorate!=="all"){conditions.push("governorate = ?");binds.push(governorate)}
 if(search){conditions.push("(full_name LIKE ? OR phone LIKE ? OR email LIKE ? OR national_id LIKE ?)");const p=`%${search}%`;binds.push(p,p,p,p)}
 const where=conditions.length?`WHERE ${conditions.join(" AND ")}`:"";
 const result=await db.prepare(`SELECT id,membership_number,full_name,mother_name,national_id,date_of_birth,email,phone,gender,education_level,study_year,university,resident_specialty,residency_year,residency_hospital,address,governorate,medlife_role,cell,field_location,join_date,volunteer_certificate,status,created_at,updated_at,academic_status,faculty,graduation_year,profession,workplace FROM members ${where} ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 WHEN 'active' THEN 1 WHEN 'suspended' THEN 2 ELSE 3 END,datetime(created_at) DESC LIMIT 200`).bind(...binds).all();
 return json({success:true,members:result.results||[],summary:await getSummary(db)});
}
async function getSummary(db){const r=await db.prepare(`SELECT COUNT(*) AS total,SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending_count,SUM(CASE WHEN status IN ('active','approved') THEN 1 ELSE 0 END) AS active_count,SUM(CASE WHEN status='suspended' THEN 1 ELSE 0 END) AS suspended_count,SUM(CASE WHEN status='inactive' THEN 1 ELSE 0 END) AS inactive_count FROM members`).first();return{total:Number(r?.total||0),pending_count:Number(r?.pending_count||0),active_count:Number(r?.active_count||0),suspended_count:Number(r?.suspended_count||0),inactive_count:Number(r?.inactive_count||0)}}
async function updateMember(request,db){const body=await request.json(),id=Number(body.id),status=cleanFilter(body.status);if(!Number.isInteger(id)||id<=0)return json({success:false,error:"معرّف العضو غير صالح."},400);if(!ALLOWED_STATUSES.includes(status))return json({success:false,error:"حالة العضوية غير صالحة."},400);const member=await db.prepare(`SELECT id,membership_number,full_name FROM members WHERE id=? LIMIT 1`).bind(id).first();if(!member)return json({success:false,error:"العضو غير موجود."},404);let membershipNumber=member.membership_number||null;const nextStatus=status==='approved'?'active':status;if(nextStatus==='active'&&!membershipNumber)membershipNumber=`ML-${new Date().getFullYear()}-${String(id).padStart(6,'0')}`;await db.prepare(`UPDATE members SET status=?,membership_number=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(nextStatus,membershipNumber,id).run();return json({success:true,message:nextStatus==='active'?"تم قبول العضو وتفعيل عضويته بنجاح.":nextStatus==='suspended'?"تم تعليق العضوية بنجاح.":nextStatus==='inactive'?"تم إلغاء تفعيل العضوية بنجاح.":"تم تحديث حالة العضوية بنجاح.",id,status:nextStatus,membership_number:membershipNumber})}
async function isAuthorized(request,expectedKey){const header=request.headers.get("Authorization")||"",match=header.match(/^Bearer\s+(.+)$/i);if(!match)return false;const supplied=match[1].trim();if(!supplied||supplied.length>500||expectedKey.length>500)return false;const encoder=new TextEncoder();const[a,b]=await Promise.all([crypto.subtle.digest("SHA-256",encoder.encode(supplied)),crypto.subtle.digest("SHA-256",encoder.encode(expectedKey))]);const left=new Uint8Array(a),right=new Uint8Array(b);let diff=left.length^right.length;for(let i=0;i<Math.min(left.length,right.length);i++)diff|=left[i]^right[i];return diff===0}
function cleanFilter(value){return String(value??"").trim().slice(0,200)}
function json(data,status=200){return new Response(JSON.stringify(data,null,2),{status,headers:{"Content-Type":"application/json; charset=UTF-8","Cache-Control":"no-store","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Authorization, Content-Type","Access-Control-Allow-Methods":"GET, PATCH, OPTIONS"}})}
