// api/lynk-webhook.js
//
// Endpoint yang didaftarkan sebagai Webhook URL di dashboard Lynk.id
// (Settings → Integrations → Webhook). Setelah pembeli checkout sukses,
// Lynk.id mengirim POST ke sini.
//
// PENTING: Lynk.id cuma punya SATU slot Webhook URL per akun — jadi
// endpoint ini menerima notifikasi untuk SEMUA produk yang dijual di akun
// Lynk kamu (kniaWorld, ecourse VibeCoding, dan produk lain), bukan cuma
// satu produk. Makanya di bawah ada 3 cabang:
//
//   1. Item = produk kniaWorld Prompt Generator → simpan ke Firebase
//      Realtime Database project kniaworld (node "buyers"), seperti biasa.
//   2. Item = produk ecourse VibeCoding with Claude → buat akun Firebase
//      Auth + Firestore di project ecourseclaude (login pakai email
//      checkout + 4 digit terakhir no. HP, password = "EC-" + 4digit,
//      sama persis dengan buildBuyerPassword() di index.html ecourseclaude).
//   3. Item = produk lain (bukan keduanya) → diabaikan, tidak diproses.
//
// Dulu (sebelum ini) ada rencana pakai gateway terpisah di Cloudflare Pages
// (ecourseclaude.pages.dev/api/lynk-webhook) yang meneruskan ke endpoint
// ini, tapi terus-terusan 405 nggak jelas sebabnya — jadi logic-nya
// dipindah & digabung langsung ke sini aja, satu webhook, dua produk.
//
// ══════════════════════════════════════════════════════
// ENV VARS yang wajib diisi di Vercel (Project Settings → Environment Variables):
//   FIREBASE_DB_URL          = https://kniagame-c6567-default-rtdb.asia-southeast1.firebasedatabase.app
//   FIREBASE_DB_SECRET       = (Firebase Console project kniaworld → Project Settings →
//                               ikon gerigi → Service Accounts → tab "Database secrets")
//   LYNK_MERCHANT_KEY        = (muncul di dashboard Lynk.id SETELAH kamu simpan
//                               Webhook URL — Settings → Integrations → Webhook)
//   ECOURSE_FIREBASE_API_KEY     = Web API key project Firebase ecourseclaude
//   ECOURSE_FIREBASE_PROJECT_ID  = ecourseclaude
// ══════════════════════════════════════════════════════

const crypto = require('crypto');

const FIREBASE_DB_URL = process.env.FIREBASE_DB_URL;
const DB_SECRET = process.env.FIREBASE_DB_SECRET;
const MERCHANT_KEY = process.env.LYNK_MERCHANT_KEY;
const ECOURSE_API_KEY = process.env.ECOURSE_FIREBASE_API_KEY;
const ECOURSE_PROJECT_ID = process.env.ECOURSE_FIREBASE_PROJECT_ID;

// Nama produk persis seperti di judul produk Lynk.id kamu.
const EXPECTED_PRODUCT_TITLE = 'Tools Prompt Generator Build Game Edukasi pake AI (Vibe coding) by Kniaconnect';

// uuid produk ecourse (terkonfirmasi stabil dari payload transaksi asli —
// sama seperti uuid kniaWorld di bawah, uuid tetap sama walau ada
// affiliate/addon berbeda).
const ECOURSE_ITEM_UUIDS = ['69e45103cea9c749e9d94574-9773-6065981297-1776570627004'];
const ECOURSE_KEYWORDS = ['ecourse 30days', 'ecourse 30 days', 'kniacornerdigital', 'rinantihasari'];

// uuid produk kniaWorld (terkonfirmasi dari payload transaksi asli).
const KNIAWORLD_ITEM_UUIDS = ['6a072a992060ed9366ddf1ac-7926-3971851336-1778854553501'];

function safeEmailKey(email) {
  // Firebase key tidak boleh mengandung . # $ [ ]
  return email.trim().toLowerCase().replace(/[.#$[\]]/g, '_');
}

function onlyDigits(str) {
  return (str || '').toString().replace(/\D/g, '');
}

// Cari field pertama yang ada isinya dari beberapa kemungkinan nama field
// (mendukung path bertingkat lewat titik, misal 'data.message_data.ref_id').
function pick(obj, paths) {
  for (const path of paths) {
    const val = path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
    if (val !== undefined && val !== null && val !== '') return val;
  }
  return undefined;
}

// Cocokkan judul produk secara longgar (huruf besar/kecil, spasi ekstra)
// supaya tidak gagal cuma gara-gara perbedaan kapitalisasi kecil.
function normalizeTitle(t) {
  return (t || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
}

// Cek apakah salah satu item di transaksi cocok dengan daftar uuid, atau
// (fallback) judulnya mengandung salah satu keyword.
function matchesItems(items, uuidList, keywordList) {
  const itemUuids = items.map((it) => String(pick(it, ['uuid']) || ''));
  if (uuidList.some((u) => itemUuids.includes(u))) return true;

  const titles = items
    .flatMap((it) => [pick(it, ['title', 'name', 'productName']), ...(Array.isArray(it.addons) ? it.addons.map((a) => a.name) : [])])
    .filter(Boolean)
    .map((t) => normalizeTitle(t));
  return keywordList.some((kw) => titles.some((t) => t.includes(normalizeTitle(kw))));
}

function buildBuyerPassword(last4) {
  // HARUS SAMA PERSIS dengan buildBuyerPassword() di index.html ecourseclaude.
  return 'EC-' + last4;
}

function generateRandomPassword(length = 14) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

async function sendEcoursePasswordResetEmail(email) {
  try {
    await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${ECOURSE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestType: 'PASSWORD_RESET', email }),
    });
  } catch (e) {
    console.error('[lynk-webhook] Gagal kirim email set-password ecourse:', e);
  }
}

// Buat akun Firebase Auth + dokumen Firestore untuk buyer ecourse, di
// project ecourseclaude (project Firebase yang beda dari kniaworld).
async function provisionEcourseBuyer({ email, name, phoneRaw, refId, messageId }) {
  const phoneDigits = onlyDigits(phoneRaw);
  const last4 = phoneDigits.length >= 4 ? phoneDigits.slice(-4) : null;
  const password = last4 ? buildBuyerPassword(last4) : generateRandomPassword();

  const signUpRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${ECOURSE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const signUpData = await signUpRes.json();

  if (signUpData.error) {
    const code = signUpData.error.message;
    if (code === 'EMAIL_EXISTS') {
      await sendEcoursePasswordResetEmail(email);
      return { ok: true, message: 'Email ecourse sudah terdaftar — link set-password dikirim ulang' };
    }
    console.error('[lynk-webhook] Gagal signUp Firebase ecourse:', code);
    return { ok: false, message: 'Gagal membuat akun ecourse: ' + code };
  }

  const uid = signUpData.localId;
  const idToken = signUpData.idToken;
  const now = new Date().toISOString();

  const firestoreRes = await fetch(
    `https://firestore.googleapis.com/v1/projects/${ECOURSE_PROJECT_ID}/databases/(default)/documents/users/${uid}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({
        fields: {
          email: { stringValue: email },
          name: { stringValue: name },
          phone: { stringValue: phoneRaw },
          photoURL: { stringValue: '' },
          createdAt: { timestampValue: now },
          lastLogin: { timestampValue: now },
          moduleProgress: { mapValue: { fields: {} } },
          completedModules: { arrayValue: { values: [] } },
          streak: { integerValue: 0 },
          lastActiveDate: { stringValue: '' },
          totalStudyMinutes: { integerValue: 0 },
          lynkRefId: { stringValue: String(refId) },
          lynkMessageId: { stringValue: String(messageId) },
        },
      }),
    }
  );

  if (!firestoreRes.ok) {
    const errData = await firestoreRes.json().catch(() => ({}));
    console.error('[lynk-webhook] Gagal tulis Firestore ecourse:', errData);
    return { ok: false, message: 'Akun ecourse dibuat tapi gagal simpan data course' };
  }

  await sendEcoursePasswordResetEmail(email);

  return { ok: true, message: `Akun ecourse ${email} berhasil didaftarkan` };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, message: 'Method not allowed' });
    return;
  }

  if (!FIREBASE_DB_URL || !DB_SECRET || !MERCHANT_KEY) {
    console.error('[lynk-webhook] ENV VAR belum lengkap. Cek FIREBASE_DB_URL, FIREBASE_DB_SECRET, LYNK_MERCHANT_KEY di Vercel.');
    res.status(500).json({ ok: false, message: 'Server belum dikonfigurasi.' });
    return;
  }

  const body = req.body || {};

  console.log('[lynk-webhook] payload masuk:', JSON.stringify(body));

  // ── Tombol "Test" di dashboard Lynk.id cuma ping konektivitas —
  // payloadnya generik ({"event":"test_event",...}) dan TIDAK dikirim
  // dengan signature asli. Balas 200 langsung di sini supaya tombol Test
  // menunjukkan sukses, tanpa melonggarkan validasi signature untuk
  // transaksi sungguhan di bawah.
  if (body.event === 'test_event') {
    console.log('[lynk-webhook] Ini ping "Test" dari dashboard Lynk.id, bukan transaksi asli — dibalas OK.');
    res.status(200).json({ ok: true, message: 'Test ping received' });
    return;
  }

  // ── Field untuk hitung ulang signature ──
  // Struktur utama Lynk.id: { data: { message_data: { ref_id, customer:{}, items:[], totals:{}, ... } } }
  // Tetap sertakan beberapa nama alternatif flat sebagai cadangan kalau
  // ternyata strukturnya beda dari dugaan.
  const refId = String(pick(body, [
    'data.message_data.refId', 'data.message_data.ref_id', 'refId', 'ref_id'
  ]) ?? '');

  const grandTotal = String(pick(body, [
    'data.message_data.totals.grandTotal', 'data.message_data.totals.grand_total', 'grandTotal', 'amount', 'grand_total'
  ]) ?? '');

  const messageId = String(pick(body, [
    'data.message_id', 'data.message_data.message_id', 'message_id', 'messageId'
  ]) ?? '');

  const receivedSignature = req.headers['x-lynk-signature'] || req.headers['X-Lynk-Signature'];
  const signatureString = grandTotal + refId + messageId + MERCHANT_KEY;
  const expectedSignature = crypto.createHash('sha256').update(signatureString).digest('hex');

  console.log('[lynk-webhook] refId:', refId, '| grandTotal:', grandTotal, '| messageId:', messageId);
  console.log('[lynk-webhook] signature diterima:', receivedSignature, '| dihitung:', expectedSignature);

  if (!receivedSignature || receivedSignature !== expectedSignature) {
    console.error('[lynk-webhook] Signature TIDAK COCOK — request ditolak.');
    res.status(401).json({ ok: false, message: 'Invalid signature' });
    return;
  }

  // ── Cuma proses transaksi yang statusnya sukses ──
  const messageAction = pick(body, ['data.message_action', 'message_action']);
  if (messageAction && messageAction !== 'SUCCESS') {
    console.log('[lynk-webhook] message_action bukan SUCCESS ("' + messageAction + '") — diabaikan.');
    res.status(200).json({ ok: true, message: 'Bukan transaksi sukses, dilewati.' });
    return;
  }

  // ── Cek produk apa yang dibeli: kniaWorld, ecourse, atau lainnya ──
  const items = pick(body, ['data.message_data.items', 'items']) || [];
  const itemsArr = Array.isArray(items) ? items : [];

  const isKniaworld = matchesItems(itemsArr, KNIAWORLD_ITEM_UUIDS, [normalizeTitle(EXPECTED_PRODUCT_TITLE)]);
  const isEcourse = !isKniaworld && matchesItems(itemsArr, ECOURSE_ITEM_UUIDS, ECOURSE_KEYWORDS);

  console.log('[lynk-webhook] Produk di transaksi:', itemsArr.map((it) => pick(it, ['title'])), '| kniaWorld?', isKniaworld, '| ecourse?', isEcourse);

  // ══ CABANG 1: produk kniaWorld → proses seperti biasa (RTDB) ══
  if (isKniaworld) {
    const email = pick(body, [
      'data.message_data.customer.email', 'email', 'buyerEmail', 'customer_email', 'customerEmail'
    ]);
    const phone = pick(body, [
      'data.message_data.customer.phone', 'phone', 'buyerPhone', 'whatsapp', 'no_wa', 'phone_number', 'phoneNumber'
    ]);
    const name = pick(body, [
      'data.message_data.customer.name', 'name', 'buyerName', 'customer_name', 'customerName'
    ]) || '';

    if (!email || !phone) {
      console.error('[lynk-webhook] Email/no.WA tidak ditemukan di payload kniaWorld — cek Vercel logs.');
      res.status(200).json({ ok: false, message: 'Missing buyer email/phone in payload — cek Vercel logs' });
      return;
    }

    const normalizedEmail = email.toString().trim().toLowerCase();
    const last4 = onlyDigits(phone).slice(-4);
    const emailKey = safeEmailKey(normalizedEmail);

    const buyerRecord = {
      email: normalizedEmail,
      last4,
      name,
      product: EXPECTED_PRODUCT_TITLE,
      refId,
      grandTotal,
      createdAt: new Date().toISOString()
    };

    try {
      const url = `${FIREBASE_DB_URL}/buyers/${emailKey}.json?auth=${DB_SECRET}`;
      const r = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buyerRecord)
      });
      if (!r.ok) {
        const t = await r.text();
        console.error('[lynk-webhook] Gagal simpan ke Firebase kniaWorld:', r.status, t);
        res.status(200).json({ ok: false, message: 'Failed to save to Firebase' });
        return;
      }
    } catch (e) {
      console.error('[lynk-webhook] Error koneksi Firebase kniaWorld:', e);
      res.status(200).json({ ok: false, message: 'Firebase error' });
      return;
    }

    console.log('[lynk-webhook] Sukses simpan buyer kniaWorld:', normalizedEmail);
    res.status(200).json({ ok: true });
    return;
  }

  // ══ CABANG 2: produk ecourse VibeCoding → buat akun Firebase Auth + Firestore ecourseclaude ══
  if (isEcourse) {
    if (!ECOURSE_API_KEY || !ECOURSE_PROJECT_ID) {
      console.error('[lynk-webhook] ENV VAR ecourse belum lengkap. Cek ECOURSE_FIREBASE_API_KEY, ECOURSE_FIREBASE_PROJECT_ID di Vercel.');
      res.status(500).json({ ok: false, message: 'Server belum dikonfigurasi untuk ecourse.' });
      return;
    }

    const email = pick(body, [
      'data.message_data.customer.email', 'email', 'buyerEmail', 'customer_email', 'customerEmail'
    ]);
    const phoneRaw = String(pick(body, [
      'data.message_data.customer.phone', 'phone', 'buyerPhone', 'whatsapp', 'no_wa', 'phone_number', 'phoneNumber'
    ]) || '');
    const name = pick(body, [
      'data.message_data.customer.name', 'name', 'buyerName', 'customer_name', 'customerName'
    ]) || (email ? String(email).split('@')[0] : 'Student');

    if (!email) {
      console.error('[lynk-webhook] Email tidak ditemukan di payload ecourse — cek Vercel logs.');
      res.status(200).json({ ok: false, message: 'Missing buyer email in payload — cek Vercel logs' });
      return;
    }

    const normalizedEmail = email.toString().trim().toLowerCase();

    try {
      const result = await provisionEcourseBuyer({
        email: normalizedEmail,
        name,
        phoneRaw,
        refId,
        messageId,
      });
      console.log('[lynk-webhook] Hasil provisioning ecourse:', result);
      res.status(200).json({ ok: result.ok, message: result.message });
    } catch (e) {
      console.error('[lynk-webhook] Error provisioning ecourse:', e);
      res.status(200).json({ ok: false, message: 'Ecourse provisioning error' });
    }
    return;
  }

  // ══ CABANG 3: produk lain → diabaikan ══
  console.log('[lynk-webhook] Transaksi produk LAIN (bukan kniaWorld/ecourse) — diabaikan.');
  res.status(200).json({ ok: true, message: 'Produk lain, dilewati.' });
};
