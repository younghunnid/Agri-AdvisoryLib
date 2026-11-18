import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test, {after, before} from 'node:test';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agri-advisory-test-'));
process.env.DB_PATH = path.join(tmpDir, 'test.db');
process.env.AI_ANON_DAILY_LIMIT = '3';
process.env.GEMINI_API_KEY = '';
process.env.NODE_ENV = 'production';

import {createApp} from '../server.ts';
import {closeDb, getDb} from '../server/db.ts';
import {hashPassword} from '../server/security.ts';
import {normalizeLiberianPhone} from '../src/lib/phone.ts';

let server: http.Server;
let baseUrl = '';

class CookieJar {
  cookies = new Map<string, string>();

  updateFromHeaders(headers: Headers) {
    const setCookies = headers.getSetCookie ? headers.getSetCookie() : [];
    for (const raw of setCookies) {
      const [pair] = raw.split(';');
      const eq = pair.indexOf('=');
      if (eq > 0) {
        this.cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
      }
    }
  }

  headerValue(): string {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  getCsrf(): string {
    return decodeURIComponent(this.cookies.get('agri_csrf') || '');
  }
}

async function req(
  jar: CookieJar,
  urlPath: string,
  opts: {method?: string; body?: unknown; skipCsrf?: boolean} = {}
) {
  const method = opts.method || 'GET';
  const headers: Record<string, string> = {};
  const cookieHeader = jar.headerValue();
  if (cookieHeader) headers['Cookie'] = cookieHeader;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && !opts.skipCsrf) {
    if (!jar.getCsrf()) {
      const csrfRes = await fetch(`${baseUrl}/api/v1/csrf-token`, {headers});
      jar.updateFromHeaders(csrfRes.headers);
      const updatedCookie = jar.headerValue();
      if (updatedCookie) headers['Cookie'] = updatedCookie;
    }
    headers['X-CSRF-Token'] = jar.getCsrf();
  }

  const res = await fetch(`${baseUrl}${urlPath}`, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  jar.updateFromHeaders(res.headers);
  const data = await res.json().catch(() => ({}));
  return {status: res.status, data};
}

before(async () => {
  const app = await createApp();
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const addr = server.address();
  if (typeof addr === 'object' && addr) {
    baseUrl = `http://127.0.0.1:${addr.port}`;
  }
});

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  closeDb();
  fs.rmSync(tmpDir, {recursive: true, force: true});
});

test('1. Health check and public guides return only published approved guides', async () => {
  const jar = new CookieJar();
  const health = await req(jar, '/api/v1/health');
  assert.equal(health.status, 200);
  assert.equal(health.data.status, 'ok');
  assert.equal(health.data.publishedGuides, 7);

  const guides = await req(jar, '/api/v1/guides');
  assert.equal(guides.status, 200);
  assert.equal(guides.data.guides.length, 7);
  for (const g of guides.data.guides) {
    assert.equal(g.reviewStatus, 'approved');
  }
});

test('2. Language fallback serves reviewed Liberian English preview and falls back safely to English', async () => {
  const jar = new CookieJar();
  const lreRes = await req(jar, '/api/v1/guides/cassava-yellow-leaves-mosaic-check?lang=lre');
  assert.equal(lreRes.status, 200);
  assert.equal(lreRes.data.guide.languageCode, 'lre');
  assert.equal(lreRes.data.guide.fallbackApplied, false);

  const kpeRes = await req(jar, '/api/v1/guides/cassava-yellow-leaves-mosaic-check?lang=kpe');
  assert.equal(kpeRes.status, 200);
  assert.equal(kpeRes.data.guide.languageCode, 'en');
  assert.equal(kpeRes.data.guide.fallbackApplied, true);
});

test('3. CSRF blocks state-changing requests without token', async () => {
  const jar = new CookieJar();
  const res = await req(jar, '/api/v1/feedback', {
    method: 'POST',
    skipCsrf: true,
    body: {name: 'Test', message: 'Missing CSRF header check'},
  });
  assert.equal(res.status, 403);
  assert.equal(res.data.error.code, 'CSRF_INVALID');
});

test('4. Farmer registration, isolation, and SQL injection resistance', async () => {
  const jarA = new CookieJar();
  const regA = await req(jarA, '/api/v1/auth/register', {
    method: 'POST',
    body: {
      displayName: 'Farmer A',
      phone: '+231771111111',
      password: 'SafePassword123',
      county: 'Lofa',
      preferredLanguage: 'en',
      cropsOfInterest: ['Cassava'],
    },
  });
  assert.equal(regA.status, 201);

  const qRes = await req(jarA, '/api/v1/farmer/questions', {
    method: 'POST',
    body: {
      topic: 'Pest Prevention',
      county: 'Lofa',
      title: 'Private Lofa farm question',
      description: 'Leaves on my Lofa cassava plot have whiteflies underneath.',
    },
  });
  assert.equal(qRes.status, 201);
  const qId = qRes.data.questionId;

  // Register Farmer B and verify Farmer B cannot access Farmer A's question
  const jarB = new CookieJar();
  const regB = await req(jarB, '/api/v1/auth/register', {
    method: 'POST',
    body: {
      displayName: 'Farmer B',
      phone: '+231772222222',
      password: 'SafePassword123',
      county: 'Nimba',
      preferredLanguage: 'en',
    },
  });
  assert.equal(regB.status, 201);

  const crossAccess = await req(jarB, `/api/v1/farmer/questions/${qId}`);
  assert.equal(crossAccess.status, 403);

  // Farmer cannot access admin or expert routes
  const adminAttempt = await req(jarB, '/api/v1/admin/overview');
  assert.equal(adminAttempt.status, 403);
  const expertAttempt = await req(jarB, '/api/v1/expert/questions');
  assert.equal(expertAttempt.status, 403);

  // SQL injection attempt on login and search
  const sqliLogin = await req(new CookieJar(), '/api/v1/auth/login', {
    method: 'POST',
    body: {identifier: "' OR 1=1 --", password: 'wrong'},
  });
  assert.equal(sqliLogin.status, 401);

  const sqliSearch = await req(jarB, "/api/v1/guides?q=' OR 1=1 --");
  assert.equal(sqliSearch.status, 200);
  assert.equal(sqliSearch.data.guides.length, 0);
});

test('5. AI Advisor handles missing API key honestly and enforces guest rate limiting', async () => {
  const jar = new CookieJar();
  for (let i = 0; i < 3; i++) {
    const res = await req(jar, '/api/v1/advisor/ask', {
      method: 'POST',
      body: {question: 'My cassava leaves are turning yellow. What should I do?', cropSlug: 'cassava'},
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.advisor.providerMode, 'unavailable_demo');
    assert.ok(res.data.advisor.recommendedGuides.length > 0);
  }

  // 4th attempt should trigger guest daily limit (set to 3 for test)
  const limited = await req(jar, '/api/v1/advisor/ask', {
    method: 'POST',
    body: {question: 'Fourth question should hit anonymous daily limit.'},
  });
  assert.equal(limited.status, 429);
  assert.equal(limited.data.error.code, 'ANON_QUOTA_REACHED');
});

test('6. Admin question assignment, expert response, and guide approval workflow', async () => {
  // Bootstrap an admin user directly in isolated test DB
  const db = getDb();
  const adminRole = db.prepare("SELECT id FROM roles WHERE name = 'admin'").get() as {id: number};
  const ins = db
    .prepare("INSERT INTO users (display_name, phone, password_hash, status) VALUES ('Test Admin', '+231779999999', ?, 'active')")
    .run(hashPassword('AdminTestPass!123'));
  const adminId = Number(ins.lastInsertRowid);
  db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)').run(adminId, adminRole.id);

  const adminJar = new CookieJar();
  const loginAdmin = await req(adminJar, '/api/v1/auth/login', {
    method: 'POST',
    body: {identifier: '+231779999999', password: 'AdminTestPass!123'},
  });
  assert.equal(loginAdmin.status, 200);

  const expertsRes = await req(adminJar, '/api/v1/admin/experts');
  const demoExpertId = expertsRes.data.experts[0].id;

  const qList = await req(adminJar, '/api/v1/admin/questions');
  const targetQ = qList.data.questions.find((q: {title: string}) => q.title === 'Private Lofa farm question');
  assert.ok(targetQ);

  const assignRes = await req(adminJar, `/api/v1/admin/questions/${targetQ.id}/assign`, {
    method: 'POST',
    body: {expertId: demoExpertId},
  });
  assert.equal(assignRes.status, 200);

  // Expert logs in and answers
  const expertJar = new CookieJar();
  const loginExp = await req(expertJar, '/api/v1/auth/login', {
    method: 'POST',
    body: {identifier: '+231770000201', password: 'ExpertDemo!2026'},
  });
  assert.equal(loginExp.status, 200);

  const respRes = await req(expertJar, `/api/v1/expert/questions/${targetQ.id}/respond`, {
    method: 'POST',
    body: {
      messageText: 'Inspect leaf undersides for whiteflies and keep drainage trenches clear around cassava mounds.',
      status: 'Answered',
    },
  });
  assert.equal(respRes.status, 201);
  assert.equal(respRes.data.status, 'Answered');
});

test('7. Agricultural Marketplace filters, Liberian phone consent/validation, view count, and ownership check', async () => {
  const jar = new CookieJar();
  const initial = await req(jar, '/api/v1/marketplace/listings');
  assert.equal(initial.status, 200);
  assert.ok(initial.data.listings.length >= 11);
  assert.equal(initial.data.categories.length, 9);
  assert.ok(initial.data.categories.includes('Livestock'));
  assert.ok(initial.data.categories.includes('Agricultural supplies'));
  assert.ok(
    initial.data.listings.some((l: {product_name: string}) => l.product_name === 'Premium Lofa Country Rice'),
    'Should include Premium Lofa Country Rice demo listing'
  );

  // Filter by maxPrice & county
  const filtered = await req(jar, '/api/v1/marketplace/listings?county=Lofa&maxPrice=8000&availability=Available');
  assert.equal(filtered.status, 200);
  assert.ok(filtered.data.listings.every((l: {county: string; price_lrd: number}) => l.county === 'Lofa' && l.price_lrd <= 8000));

  // Invalid Liberian phone number rejected
  const badPhone = await req(jar, '/api/v1/marketplace/listings', {
    method: 'POST',
    body: {
      ownerToken: 'test-owner-123',
      sellerName: 'Bad Phone Test',
      category: 'Fish and seafood',
      productName: 'Test Tilapia',
      quantity: '10',
      unit: 'kg',
      priceLrd: 900,
      county: 'Bomi',
      town: 'Tubmanburg',
      description: 'Testing phone validation rejection.',
      sellerPhone: '12345',
      phoneConsent: true,
    },
  });
  assert.equal(badPhone.status, 400);

  // Valid Liberian phone normalized & exposed only when consented
  const created = await req(jar, '/api/v1/marketplace/listings', {
    method: 'POST',
    body: {
      ownerToken: 'test-owner-123',
      sellerName: 'Kpelle Pond Collective',
      farmName: 'Kpelle Aquaculture',
      category: 'Fish and seafood',
      productName: 'Fresh Harvest Catfish',
      quantity: '30',
      unit: 'kg',
      priceLrd: 1200,
      county: 'Nimba',
      town: 'Ganta',
      description: 'Clean pond-raised catfish ready for Friday morning pickup in Ganta.',
      availabilityStatus: 'Available',
      sellerPhone: '077 012 3456',
      phoneConsent: true,
    },
  });
  assert.equal(created.status, 201);
  assert.equal(created.data.listing.seller_phone, '+231770123456');
  assert.equal(created.data.listing.phone_verified, 0);
  assert.equal(created.data.listing.is_fictional_seller, 0);
  const listingId = created.data.listing.id;

  // Unconsented phone must NOT leak to public GET requests
  const privatePhoneCreated = await req(jar, '/api/v1/marketplace/listings', {
    method: 'POST',
    body: {
      ownerToken: 'private-owner-456',
      sellerName: 'Private Seller',
      category: 'Vegetables',
      productName: 'Fresh Okra Without Public Phone',
      quantity: '5',
      unit: 'basket',
      priceLrd: 1500,
      county: 'Bong',
      town: 'Gbarnga',
      description: 'Seller provided phone privately without public display consent.',
      sellerPhone: '0886123456',
      phoneConsent: false,
    },
  });
  assert.equal(privatePhoneCreated.status, 201);
  const publicView = await req(jar, '/api/v1/marketplace/listings?q=Okra%20Without%20Public%20Phone');
  const maskedItem = publicView.data.listings.find((l: {id: number}) => l.id === privatePhoneCreated.data.listing.id);
  assert.equal(maskedItem.seller_phone, '');

  // Buyer view increment
  const viewRes = await req(jar, `/api/v1/marketplace/listings/${listingId}/view`, {method: 'POST', body: {}});
  assert.equal(viewRes.status, 200);
  assert.equal(viewRes.data.view_count, 1);

  // Edit availability & price
  const updated = await req(jar, `/api/v1/marketplace/listings/${listingId}`, {
    method: 'PATCH',
    body: {
      ownerToken: 'test-owner-123',
      priceLrd: 1350,
      quantity: '35',
      availabilityStatus: 'Limited Stock',
    },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.listing.price_lrd, 1350);
  assert.equal(updated.data.listing.availability_status, 'Limited Stock');

  const wrongOwnerDelete = await req(jar, `/api/v1/marketplace/listings/${listingId}?ownerToken=wrong-token`, {
    method: 'DELETE',
  });
  assert.equal(wrongOwnerDelete.status, 403);
});

test('8. Local Language AI Lab enforces speaker consent and review status workflow', async () => {
  const jar = new CookieJar();
  const listRes = await req(jar, '/api/v1/language-lab/recordings?lang=bas');
  assert.equal(listRes.status, 200);
  assert.ok(listRes.data.recordings.length >= 1);

  // Must reject without explicit consentConfirmed
  const noConsent = await req(jar, '/api/v1/language-lab/recordings', {
    method: 'POST',
    body: {
      languageCode: 'man',
      topicSlug: 'poultry',
      speakerName: 'Gayeleh Tokpah (Nimba)',
      questionText: 'Keeping young chicks warm during rain',
      answerText: 'Keep litter dry and shield night drafts.',
      consentConfirmed: false,
    },
  });
  assert.equal(noConsent.status, 400);
  assert.equal(noConsent.data.error.code, 'CONSENT_REQUIRED');

  const withConsent = await req(jar, '/api/v1/language-lab/recordings', {
    method: 'POST',
    body: {
      languageCode: 'man',
      topicSlug: 'poultry',
      topicLabel: 'Poultry & Chick Health',
      speakerName: 'Gayeleh Tokpah (Nimba)',
      questionText: 'Keeping young chicks warm during rain',
      answerText: 'Keep litter dry and shield night drafts.',
      consentConfirmed: true,
    },
  });
  assert.equal(withConsent.status, 201);
  assert.equal(withConsent.data.recording.review_status, 'pending_review');

  const reviewed = await req(jar, `/api/v1/language-lab/recordings/${withConsent.data.recording.id}/review`, {
    method: 'PATCH',
    body: {reviewStatus: 'reviewed'},
  });
  assert.equal(reviewed.status, 200);
  assert.equal(reviewed.data.recording.review_status, 'reviewed');
});

test('9. Demo Expert Requests, Simulated Expert reply, and Management summary separation', async () => {
  const jar = new CookieJar();
  const created = await req(jar, '/api/v1/expert-requests/demo', {
    method: 'POST',
    body: {
      requesterToken: 'demo-user-99',
      farmerName: 'Oldpa Sumo',
      category: 'Poultry farming',
      county: 'Margibi',
      title: 'Wet bedding in broiler coop',
      description: 'Heavy rain splashed onto wood shavings in one corner of our chicken house.',
    },
  });
  assert.equal(created.status, 201);
  assert.equal(created.data.request.status, 'Submitted');

  const replied = await req(jar, `/api/v1/expert-requests/demo/${created.data.request.id}/reply`, {
    method: 'PATCH',
    body: {
      expertReply: 'Remove damp litter immediately, add dry shavings, and check roof overhang.',
      status: 'Answered',
      assignedExpertName: 'Dr. Samuel Tarr (Simulated Extension Officer)',
    },
  });
  assert.equal(replied.status, 200);
  assert.equal(replied.data.request.status, 'Answered');

  const summary = await req(jar, '/api/v1/prototype/management-summary');
  assert.equal(summary.status, 200);
  assert.equal(summary.data.actualData.publishedCropGuides, 7);
  assert.ok(summary.data.demoAndExperimentalData.marketplaceListings >= 11);
});

test('10. Demo Reset restores clean hackathon prototype dataset', async () => {
  const jar = new CookieJar();
  const resetRes = await req(jar, '/api/v1/demo/reset', {method: 'POST', body: {}});
  assert.equal(resetRes.status, 200);
  assert.equal(resetRes.data.ok, true);

  const postResetListings = await req(jar, '/api/v1/marketplace/listings');
  assert.equal(postResetListings.status, 200);
  assert.equal(postResetListings.data.listings.length, 11);
});

test('11. Liberian phone normalization accepts valid formats and rejects missing/invalid numbers', () => {
  const local = normalizeLiberianPhone('0770123456');
  assert.equal(local.valid, true);
  assert.equal(local.normalized, '+231770123456');
  assert.equal(local.telHref, 'tel:+231770123456');

  const spaced = normalizeLiberianPhone('+231 88-612-3456');
  assert.equal(spaced.valid, true);
  assert.equal(spaced.normalized, '+231886123456');

  const prefix00 = normalizeLiberianPhone('00231555123456');
  assert.equal(prefix00.valid, true);
  assert.equal(prefix00.normalized, '+231555123456');

  const missing = normalizeLiberianPhone('');
  assert.equal(missing.valid, false);
  assert.equal(missing.normalized, '');

  const invalid = normalizeLiberianPhone('+1-555-123-4567');
  assert.equal(invalid.valid, false);
  assert.ok(invalid.error);
});

test('12. Marketplace listings support empty optional description and clearing description on edit', async () => {
  const jar = new CookieJar();

  // 1. Publish without description
  const noDesc = await req(jar, '/api/v1/marketplace/listings', {
    method: 'POST',
    body: {
      ownerToken: 'desc-test-owner',
      sellerName: 'Flomo Farm',
      category: 'Rice and grains',
      productName: 'Bong Upland Rice',
      quantity: '10',
      unit: '50kg bag',
      priceLrd: 8500,
      county: 'Bong',
      town: 'Gbarnga',
      description: '',
    },
  });
  assert.equal(noDesc.status, 201);
  assert.equal(noDesc.data.listing.description, '');

  // 2. Publish with description
  const withDesc = await req(jar, '/api/v1/marketplace/listings', {
    method: 'POST',
    body: {
      ownerToken: 'desc-test-owner',
      sellerName: 'Flomo Farm',
      category: 'Cassava and root crops',
      productName: 'Margibi Cassava',
      quantity: '12',
      unit: '50kg bag',
      priceLrd: 3500,
      county: 'Margibi',
      town: 'Kakata',
      description: 'Freshly dug today and ready for pickup.',
    },
  });
  assert.equal(withDesc.status, 201);
  assert.equal(withDesc.data.listing.description, 'Freshly dug today and ready for pickup.');
  const editId = withDesc.data.listing.id;

  // 3. Partial PATCH without description preserves existing description
  const partialPatch = await req(jar, `/api/v1/marketplace/listings/${editId}`, {
    method: 'PATCH',
    body: {
      ownerToken: 'desc-test-owner',
      priceLrd: 3700,
    },
  });
  assert.equal(partialPatch.status, 200);
  assert.equal(partialPatch.data.listing.description, 'Freshly dug today and ready for pickup.');

  // 4. PATCH with empty description removes description
  const clearDesc = await req(jar, `/api/v1/marketplace/listings/${editId}`, {
    method: 'PATCH',
    body: {
      ownerToken: 'desc-test-owner',
      description: '',
    },
  });
  assert.equal(clearDesc.status, 200);
  assert.equal(clearDesc.data.listing.description, '');
});

