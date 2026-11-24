import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const html = readFileSync('joinwithus.html', 'utf8');
const frontend = readFileSync('joinwithus.js', 'utf8');
const api = readFileSync('functions/api/management.js', 'utf8');
const middleware = readFileSync('functions/_middleware.js', 'utf8');
const legacyApi = readFileSync('functions/api/new-member.js', 'utf8');

const tracks = [
  'medical_content',
  'medical_content_formatting',
  'design',
  'video_editing',
  'visual_media',
  'field_work',
  'university_media',
  'voice_over',
  'it',
  'telegram',
  'instagram',
  'podcast_live',
  'medical_consultations',
];

test('dedicated page and correct application form, not membership renewal', () => {
  assert.match(html, /joinwithus\.js\?v=/);
  assert.doesNotMatch(html, /current-member\.html|الانتقال إلى تجديد العضوية/);
  assert.match(frontend, /const FORM_KEY = "new_volunteer_application"/);
  assert.match(frontend, /application_kind:"new_member"/);
  assert.match(frontend, /action:"new_volunteer_application"/);
});

test('all 13 professional domains remain available with stable stored codes', () => {
  const match = api.match(/const NEW_VOLUNTEER_CATEGORIES\s*=\s*\[([\s\S]*?)\];/);
  assert.ok(match, 'the canonical track list must exist');
  const actual = [...match[1].matchAll(/value:\s*"([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(actual, tracks);
  assert.match(frontend, /medical_consultations/);
  assert.match(frontend, /option\.disabled=restricted/);
});

test('the seven applicant steps are preserved', () => {
  assert.match(frontend, /const STEPS = \[/);
  const stepBlock = frontend.match(/const STEPS\s*=\s*\[([\s\S]*?)\];/);
  assert.ok(stepBlock);
  assert.equal([...stepBlock[1].matchAll(/name:/g)].length, 7);
});

test('no frontend filter callback mistakenly receives numeric index as a recursion Set', () => {
  assert.doesNotMatch(frontend, /\.filter\(visible\)/);
  assert.match(frontend, /\.filter\(field => visible\(field\)\)/);
});

test('recruitment does not require an email OTP or an identity challenge', () => {
  assert.doesNotMatch(frontend, /renderIdentityPanel|normalizedIdentity|state\.identity|join_identity_check|identity_challenge_id|identity_reverification_required|إرسال رمز التحقق إلى بريدي/);
  assert.doesNotMatch(api, /body\.identity_challenge_id|payload\.form_data\._join_identity_challenge|identity_reverification_required/);
  assert.match(api, /body\.action === "join_identity_check"[\s\S]{0,250}410/);
  assert.match(frontend, /action:"new_volunteer_application"/);
});

test('consultation demo link uses the deployed Worker', () => {
  assert.match(frontend, /https:\/\/medlife-care-intake-demo\.broad-frog-3978\.workers\.dev/);
  assert.doesNotMatch(frontend, /medlife-care-lab/);
});

test('preview submissions are blocked on both sides', () => {
  assert.match(frontend, /const PREVIEW_ONLY = location\.hostname/);
  assert.match(frontend, /if \(PREVIEW_ONLY\) \{setAlert/);
  assert.match(api, /hostname\.toLowerCase\(\)\.endsWith\("\.pages\.dev"\)/);
});

test('new-member identity duplicates lead to administration email and complaints box', () => {
  assert.match(html, /mailto:info@medlifesy\.org/);
  assert.match(html, /\/contact\.html#complaints/);
  assert.match(api, /code:\s*"duplicate_national_id"/);
  assert.match(api, /contact_email:\s*"info@medlifesy.org"/);
});

test('valid clinical consultation choices and 2-specialty limit are validated server-side', () => {
  assert.match(api, /preferences\.includes\("medical_consultations"\)/);
  assert.match(api, /chosen\.length<1 \|\| chosen\.length>2/);
  assert.match(api, /requiredEthics\.every/);
});

test('international WhatsApp phone and consent are checked by both client and server', () => {
  assert.match(frontend, /phone_country_code/);
  assert.match(frontend, /whatsapp_confirmed/);
  assert.match(api, /formData\.whatsapp_confirmed!=="yes"/);
  assert.match(api, /formData\.volunteer_commitment !== "1"/);
  assert.match(frontend, /privacy_consent:true/);
});

test('submission writes only to new member intake, never membership-renewal records', () => {
  assert.match(api, /: "public_volunteer_applications"/);
  assert.match(api, /if \(body\.action === "new_volunteer_application"\)/);
  assert.match(api, /payload\.requested_departments = \[\]/);
  assert.match(api, /payload\.id = crypto\.randomUUID\(\)/);
});

test('deployment keeps the real logo and versioned browser assets', () => {
  assert.match(html, /\/logo\.PNG/);
  assert.match(html, /joinwithus\.css\?v=/);
  assert.match(html, /joinwithus\.js\?v=20261125-3-no-otp/);
});

test('all previous new-member entrypoints lead to the current verified application', () => {
  assert.match(middleware, /"\/new-member\.html"/);
  assert.match(middleware, /Response\.redirect\(new URL\("\/joinwithus"/);
  assert.match(legacyApi, /code: "use_current_recruitment_form"/);
  assert.match(legacyApi, /https:\/\/medlifesy\.org\/joinwithus/);
  assert.doesNotMatch(legacyApi, /INSERT INTO new_member_applications/);
});
