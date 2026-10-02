import { ADMIN_SESSION_COOKIE, ensureAdminTables } from './_admin-auth.js';
import { verifyPassword, json } from './_auth.js';

const SESSION_COOKIE = 'medlife_member_session';
const SESSION_DAYS = 30;

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return json({ success: true });
  if (request.method !== 'POST') return json({ success: false, error: 'Method not allowed.' }, 405);

  const db = env.TEAM_DB;
  if (!db) return json({ success: false, error: 'TEAM_DB database binding is not configured.' }, 500);

  try {
    await ensureMemberAccounts(db);

    const body = await request.json().catch(() => ({}));
    const identifier = String(body.identifier || body.username || body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!identifier || !password) {
      return json({ success: false, error: 'يرجى إدخال البريد الإلكتروني أو اسم المستخدم وكلمة المرور.' }, 400);
    }

    const account = await db.prepare(`
      SELECT
        a.id AS account_id,
        a.member_id,
        a.username,
        a.password_hash AS account_password_hash,
        a.account_status,
        a.role,
        m.full_name,
        m.email,
        m.member_status
      FROM member_accounts a
      INNER JOIN members m ON m.id = a.member_id
      WHERE lower(a.username) = ?
         OR lower(COALESCE(m.email, '')) = ?
      LIMIT 1
    `).bind(identifier, identifier).first();

    if (!account) return json({ success: false, error: 'بيانات الدخول غير صحيحة.' }, 401);
    if (account.member_status !== 'active') {
      return json({ success: false, error: 'عضويتك غير مفعلة حالياً.' }, 403);
    }
    if (account.account_status !== 'active') {
      return json({ success: false, error: 'حسابك غير مفعل حالياً.' }, 403);
    }

    const valid = await verifyPassword(password, account.account_password_hash);
    if (!valid) return json({ success: false, error: 'بيانات الدخول غير صحيحة.' }, 401);

    await db.prepare(`
      UPDATE member_accounts
      SET last_login_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(account.account_id).run();

    await ensureSessionTable(db);
    const token = randomToken();
    const tokenHash = await sha256(token);
    await db.prepare(`
      INSERT INTO member_sessions_v2(id, token_hash, member_id, expires_at)
      VALUES (?, ?, ?, datetime('now', '+30 days'))
    `).bind(randomToken(), tokenHash, account.member_id).run();

    const adminRole = mapAdminRole(account.role);
    let redirect = '/members.html';
    let adminToken = null;

    if (adminRole) {
      await ensureAdminTables(db);
      await ensureRoutingTables(db);
      await db.prepare(`
        INSERT OR IGNORE INTO medlife_admin_user_roles(member_id, role_key)
        VALUES (?, ?)
      `).bind(account.member_id, adminRole).run();

      adminToken = await issueAdminSession(db, account.member_id);
      redirect = redirectForRole(adminRole);
    }

    const response = json({
      success: true,
      member: {
        id: account.member_id,
        full_name: account.full_name,
        email: account.email
      },
      redirect
    });

    const headers = new Headers(response.headers);
    headers.append('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(token)}; Max-Age=${SESSION_DAYS * 86400}; Path=/; HttpOnly; Secure; SameSite=Lax`);
    if (adminToken) {
      headers.append('Set-Cookie', `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(adminToken)}; Max-Age=${7 * 86400}; Path=/; HttpOnly; Secure; SameSite=Lax`);
    }

    return new Response(response.body, {
      status: response.status,
      headers
    });
  } catch (error) {
    console.error('unified member login error:', error?.message || error);
    return json({ success: false, error: 'حدث خطأ أثناء تنفيذ تسجيل الدخول.' }, 500);
  }
}

async function ensureMemberAccounts(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS member_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT,
    role TEXT NOT NULL DEFAULT 'member',
    account_status TEXT NOT NULL DEFAULT 'active',
    last_login_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();
}

async function ensureSessionTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS member_sessions_v2 (
    id TEXT PRIMARY KEY,
    token_hash TEXT NOT NULL UNIQUE,
    member_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();
}

async function ensureRoutingTables(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS medlife_admin_roles (
    role_key TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS medlife_admin_permissions (
    permission_key TEXT PRIMARY KEY,
    name TEXT NOT NULL
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS medlife_admin_role_permissions (
    role_key TEXT NOT NULL,
    permission_key TEXT NOT NULL,
    PRIMARY KEY(role_key, permission_key)
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS medlife_admin_user_roles (
    member_id INTEGER NOT NULL,
    role_key TEXT NOT NULL,
    PRIMARY KEY(member_id, role_key)
  )`).run();

  const roles = [
    ['system_admin', 'مدير النظام'],
    ['content_manager', 'مدير المحتوى'],
    ['content_editor', 'محرر المحتوى'],
    ['medical_reviewer', 'مراجع طبي'],
    ['members_manager', 'مدير الأعضاء'],
    ['support_manager', 'مدير الدعم'],
    ['complaints_manager', 'مدير الشكاوى']
  ];
  for (const [key, name] of roles) {
    await db.prepare(`INSERT OR IGNORE INTO medlife_admin_roles(role_key, name) VALUES (?, ?)`)
      .bind(key, name).run();
  }
  await db.prepare(`INSERT OR IGNORE INTO medlife_admin_permissions(permission_key, name)
    VALUES ('*', 'جميع الصلاحيات')`).run();
  await db.prepare(`INSERT OR IGNORE INTO medlife_admin_role_permissions(role_key, permission_key)
    VALUES ('system_admin', '*')`).run();
}

function mapAdminRole(role) {
  const value = String(role || '').toLowerCase();
  if (['admin', 'administrator', 'system_admin'].includes(value)) return 'system_admin';
  if (value === 'editor') return 'content_editor';
  if (value === 'reviewer') return 'medical_reviewer';
  if (value === 'members_manager') return 'members_manager';
  if (value === 'support_manager') return 'support_manager';
  if (value === 'complaints_manager') return 'complaints_manager';
  if (value === 'content_manager') return 'content_manager';
  return null;
}

function redirectForRole(role) {
  if (role === 'system_admin') return '/admin.html';
  if (['content_manager', 'content_editor', 'medical_reviewer'].includes(role)) return '/articles-admin';
  if (role === 'members_manager') return '/members-admin';
  if (role === 'support_manager') return '/support-admin';
  if (role === 'complaints_manager') return '/complaints-admin';
  return '/members.html';
}

async function issueAdminSession(db, memberId) {
  const token = randomToken();
  const tokenHash = await sha256(token);
  await db.prepare(`CREATE TABLE IF NOT EXISTS medlife_system_admin_sessions_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`INSERT INTO medlife_system_admin_sessions_v2(member_id, token_hash, expires_at)
    VALUES (?, ?, datetime('now', '+7 days'))`).bind(memberId, tokenHash).run();
  return token;
}

async function sha256(value) {
  return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))));
}

function randomToken() {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
}

function bytesToHex(bytes) {
  return [...bytes].map((x) => x.toString(16).padStart(2, '0')).join('');
}
