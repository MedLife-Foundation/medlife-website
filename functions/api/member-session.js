import { issueAdminSession, ADMIN_SESSION_COOKIE, ensureAdminTables } from './_admin-auth.js';
import { verifyPassword as verifyAuthPassword } from './_auth.js';

const SESSION_COOKIE = "medlife_member_session";
const SESSION_DAYS = 30;

export async function onRequest(context) {
    const { request, env } = context;
    if (request.method === "OPTIONS") return json({ success: true });
    const db = await findMembersDatabase(env);
    if (!db) return json({ success: false, error: "لم يتم العثور على قاعدة بيانات الأعضاء المرتبطة بالموقع." }, 500);
    const action = new URL(request.url).searchParams.get("action") || "me";
    try {
        if (request.method === "POST" && action === "login") return await login(request, db);
        if (request.method === "POST" && action === "logout") return await logout(request, db);
        if (request.method === "GET" && action === "me") return await me(request, db);
        return json({ success: false, error: "Method or action not allowed." }, 405);
    } catch (error) {
        console.error("member-session error:", error);
        return json({ success: false, error: "حدث خطأ أثناء تنفيذ تسجيل الدخول." }, 500);
    }
}

async function findMembersDatabase(env) {
    const candidates = [];
    if (env.MEMBERS_DB) candidates.push(env.MEMBERS_DB);
    if (env.DB && env.DB !== env.MEMBERS_DB) candidates.push(env.DB);
    if (env.TEAM_DB && !candidates.includes(env.TEAM_DB)) candidates.push(env.TEAM_DB);
    for (const db of candidates) {
        try {
            const table = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='members' LIMIT 1`).first();
            if (table) return db;
        } catch (error) { console.error("member DB detection error:", error); }
    }
    return null;
}

async function login(request, db) {
    await ensureAdminRoutingSchema(db);
    const body = await request.json();
    const identifier = String(body.identifier || body.username || body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!identifier || !password) return json({success:false, error:"يرجى إدخال البريد الإلكتروني أو اسم المستخدم وكلمة المرور."},400);

    const member = await db.prepare(`
        SELECT
            m.id,m.membership_number,m.full_name,m.email,m.account_email,
            m.password_hash AS legacy_password_hash,m.account_status,m.status,
            m.member_code,m.medlife_role,
            a.id AS account_id,a.username AS account_username,
            a.password_hash AS account_password_hash,a.password_salt,
            a.account_status AS member_account_status,a.role AS account_role
        FROM members m
        LEFT JOIN member_accounts a ON a.member_id=m.id
        WHERE lower(COALESCE(m.account_email,''))=?
           OR lower(COALESCE(m.email,''))=?
           OR lower(COALESCE(m.member_code,''))=?
           OR lower(COALESCE(a.username,''))=?
        ORDER BY CASE WHEN a.id IS NOT NULL THEN 0 ELSE 1 END
        LIMIT 1
    `).bind(identifier,identifier,identifier,identifier).first();

    if (!member) return json({success:false, error:"بيانات الدخول غير صحيحة."},401);
    if (!(member.status === "active" || member.status === "approved")) return json({success:false, error:"عضويتك لم تُعتمد بعد من الإدارة."},403);
    if (member.account_status && member.account_status !== "active") return json({success:false, error:"حسابك غير مفعل حالياً."},403);
    if (member.member_account_status && member.member_account_status !== "active") return json({success:false, error:"حسابك غير مفعل حالياً."},403);

    let valid = false;

    if (member.account_id && member.account_password_hash) {
        try {
            valid = await verifyAuthPassword(password, member.account_password_hash);
        } catch (error) {
            console.error("account password verification error:", error);
        }
    }

    if (!valid && member.legacy_password_hash) {
        try {
            valid = await verifyAuthPassword(password, member.legacy_password_hash);
        } catch (error) {
            console.error("legacy password verification error:", error);
        }
    }

    if (!valid) return json({success:false, error:"بيانات الدخول غير صحيحة."},401);

    const session = await createSession(db, member.id);
    const profile = await getMember(db, member.id);
    const redirect = await resolveRedirect(db,member.id,member.account_role);
    const adminToken = await hasAdminRole(db,member.id,member.account_role) ? await issueAdminSession(db,member.id) : null;

    return withCookies(json({success:true,member:profile,redirect}), session, adminToken);
}

async function ensureAdminRoutingSchema(db){
    await ensureAdminTables(db);
    await db.prepare(`CREATE TABLE IF NOT EXISTS medlife_admin_roles (role_key TEXT PRIMARY KEY,name TEXT NOT NULL,description TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();
    await db.prepare(`CREATE TABLE IF NOT EXISTS medlife_admin_permissions (permission_key TEXT PRIMARY KEY,name TEXT NOT NULL)`).run();
    await db.prepare(`CREATE TABLE IF NOT EXISTS medlife_admin_role_permissions (role_key TEXT NOT NULL,permission_key TEXT NOT NULL,PRIMARY KEY(role_key,permission_key))`).run();
    await db.prepare(`CREATE TABLE IF NOT EXISTS medlife_admin_user_roles (member_id INTEGER NOT NULL,role_key TEXT NOT NULL,PRIMARY KEY(member_id,role_key))`).run();
    const roles=[['system_admin','مدير النظام'],['content_manager','مدير المحتوى'],['content_editor','محرر المحتوى'],['medical_reviewer','مراجع طبي'],['members_manager','مدير الأعضاء'],['support_manager','مدير الدعم'],['complaints_manager','مدير الشكاوى']];
    for(const [key,name] of roles) await db.prepare(`INSERT OR IGNORE INTO medlife_admin_roles(role_key,name) VALUES(?,?)`).bind(key,name).run();
    await db.prepare(`INSERT OR IGNORE INTO medlife_admin_permissions(permission_key,name) VALUES('*','جميع الصلاحيات')`).run();
    await db.prepare(`INSERT OR IGNORE INTO medlife_admin_role_permissions(role_key,permission_key) VALUES('system_admin','*')`).run();
}

function legacyRoleToSystemRole(role){
    const map={
        admin:'system_admin',
        administrator:'system_admin',
        medical_director:'medical_reviewer',
        general_team_supervisor:'system_admin',
        advisor:'medical_reviewer',
        editor:'content_editor',
        reviewer:'medical_reviewer',
        content_manager:'content_manager',
        content_editor:'content_editor',
        medical_reviewer:'medical_reviewer',
        members_manager:'members_manager',
        support_manager:'support_manager',
        complaints_manager:'complaints_manager'
    };
    return map[String(role||'').toLowerCase()] || null;
}

async function ensureLegacyRoleMapping(db,memberId,accountRole){
    const mapped=legacyRoleToSystemRole(accountRole);
    if(!mapped) return;
    await db.prepare(`INSERT OR IGNORE INTO medlife_admin_user_roles(member_id,role_key) VALUES(?,?)`).bind(memberId,mapped).run();
}

async function hasAdminRole(db,memberId,accountRole){
    try{
        await ensureLegacyRoleMapping(db,memberId,accountRole);
        const row=await db.prepare(`SELECT 1 FROM medlife_admin_user_roles WHERE member_id=? LIMIT 1`).bind(memberId).first();
        return !!row;
    }catch{return false}
}

async function resolveRedirect(db, memberId, accountRole) {
    try {
        await ensureLegacyRoleMapping(db,memberId,accountRole);
        const roles = await db.prepare(`SELECT role_key FROM medlife_admin_user_roles WHERE member_id=?`).bind(memberId).all();
        const keys = new Set((roles.results || []).map(r => r.role_key));
        if (keys.has("system_admin")) return "/admin-system.html";
        if (keys.has("content_manager") || keys.has("content_editor") || keys.has("medical_reviewer")) return "/articles-admin";
        if (keys.has("members_manager")) return "/members-admin";
        if (keys.has("support_manager")) return "/support-admin";
        if (keys.has("complaints_manager")) return "/complaints-admin";
        const permissions = await db.prepare(`SELECT DISTINCT rp.permission_key FROM medlife_admin_user_roles ur JOIN medlife_admin_role_permissions rp ON rp.role_key=ur.role_key WHERE ur.member_id=?`).bind(memberId).all();
        const p = new Set((permissions.results || []).map(x => x.permission_key));
        if ([...p].some(x => x.startsWith("join."))) return "/join-admin";
        if ([...p].some(x => x.startsWith("support."))) return "/support-admin";
        if ([...p].some(x => x.startsWith("complaints."))) return "/complaints-admin";
    } catch (error) { console.error("admin redirect resolution error:", error); }
    return "/members.html";
}

async function me(request,db){const memberId=await authenticatedMemberId(request,db);if(!memberId)return json({success:false,authenticated:false},401);return json({success:true,authenticated:true,member:await getMember(db,memberId),redirect:await resolveRedirect(db,memberId,null)})}
async function logout(request,db){const token=getCookie(request,SESSION_COOKIE);if(token){await ensureSchema(db);await db.prepare(`DELETE FROM member_sessions_v2 WHERE token_hash=?`).bind(await sha256Hex(token)).run();}const response=json({success:true});const h=new Headers(response.headers);h.append("Set-Cookie",`${SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`);h.append("Set-Cookie",`${ADMIN_SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`);return new Response(response.body,{status:response.status,headers:h})}
async function ensureSchema(db){await db.prepare(`CREATE TABLE IF NOT EXISTS member_sessions_v2(id TEXT PRIMARY KEY,token_hash TEXT NOT NULL UNIQUE,member_id INTEGER NOT NULL,expires_at DATETIME NOT NULL,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run()}
async function createSession(db,memberId){await ensureSchema(db);const token=randomToken();await db.prepare(`INSERT INTO member_sessions_v2(id,token_hash,member_id,expires_at) VALUES(?,?,?,datetime('now','+30 days'))`).bind(token,await sha256Hex(token),memberId).run();return token}
async function authenticatedMemberId(request,db){const token=getCookie(request,SESSION_COOKIE);if(!token)return null;await ensureSchema(db);const hash=await sha256Hex(token);const row=await db.prepare(`SELECT member_id FROM member_sessions_v2 WHERE token_hash=? AND datetime(expires_at)>datetime('now') LIMIT 1`).bind(hash).first();if(!row)return null;await db.prepare(`UPDATE member_sessions_v2 SET last_seen_at=CURRENT_TIMESTAMP WHERE token_hash=?`).bind(hash).run();return row.member_id}
async function getMember(db,id){return await db.prepare(`SELECT id,membership_number,full_name,mother_name,national_id,email,account_email,phone,gender,education_level,study_year,university,resident_specialty,residency_year,residency_hospital,address,governorate,medlife_role,cell,field_location,join_date,volunteer_certificate,status,account_status,member_code FROM members WHERE id=? LIMIT 1`).bind(id).first()}
async function sha256Hex(v){return bytesToHex(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v))))}
function randomToken(){const b=new Uint8Array(32);crypto.getRandomValues(b);return bytesToHex(b)}
function bytesToHex(b){return [...b].map(x=>x.toString(16).padStart(2,"0")).join("")}
function getCookie(request,name){const raw=request.headers.get("Cookie")||"";for(const p of raw.split(";")){const x=p.trim();if(x.startsWith(name+"="))return decodeURIComponent(x.slice(name.length+1));}return null}
function withCookies(response,memberToken,adminToken){const h=new Headers(response.headers);h.append("Set-Cookie",`${SESSION_COOKIE}=${encodeURIComponent(memberToken)}; Max-Age=${SESSION_DAYS*86400}; Path=/; HttpOnly; Secure; SameSite=Lax`);if(adminToken)h.append("Set-Cookie",`${ADMIN_SESSION_COOKIE}=${encodeURIComponent(adminToken)}; Max-Age=${7*86400}; Path=/; HttpOnly; Secure; SameSite=Lax`);return new Response(response.body,{status:response.status,headers:h})}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=UTF-8","Cache-Control":"no-store","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"GET,POST,OPTIONS"}})}
