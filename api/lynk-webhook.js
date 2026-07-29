// api/lynk-webhook.js
//
// Endpoint yang didaftarkan sebagai Webhook URL di dashboard Lynk.id
// (Settings → Integrations → Webhook). Setelah pembeli checkout sukses,
// Lynk.id mengirim POST ke sini.
//
// Yang dilakukan endpoint ini:
// 1. Verifikasi X-Lynk-Signature pakai merchant key (supaya tidak ada
//    orang lain yang bisa pura-pura jadi Lynk.id dan bikin akses palsu).
// 2. Ambil email + no. WA pembeli dari payload.
// 3. Simpan ke Firebase (node "buyers") pakai Database Secret — bukan
//    dari browser, jadi secret ini TIDAK PERNAH terlihat publik.
//
// ══════════════════════════════════════════════════════
// ENV VARS yang wajib diisi di Vercel (Project Settings → Environment Variables):
//   FIREBASE_DB_URL     = https://kniagame-c6567-default-rtdb.asia-southeast1.firebasedatabase.app
//   FIREBASE_DB_SECRET  = (Firebase Console → Project Settings → ikon gerigi →
//                          Service Accounts → tab "Database secrets" → Generate/Show)
//   LYNK_MERCHANT_KEY   = (muncul di dashboard Lynk.id SETELAH kamu simpan
//                          Webhook URL — Settings → Integrations → Webhook)
// ══════════════════════════════════════════════════════

const crypto = require('crypto');

const FIREBASE_DB_URL = process.env.FIREBASE_DB_URL;
const DB_SECRET = process.env.FIREBASE_DB_SECRET;
const MERCHANT_KEY = process.env.LYNK_MERCHANT_KEY;

function safeEmailKey(email) {
  // Firebase key tidak boleh mengandung . # $ [ ]
  return email.trim().toLowerCase().replace(/[.#$[\]]/g, '_');
}

function onlyDigits(str) {
  return (str || '').toString().replace(/\D/g, '');
}

// Cari field pertama yang ada isinya dari beberapa kemungkinan nama field.
// Dipakai karena nama field persis di payload Lynk.id belum kita konfirmasi
// 100% — lihat catatan TESTING di bawah.
function pick(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
  }
  return undefined;
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

  // ── CATATAN TESTING ──────────────────────────────────────────────────
  // Baris console.log di bawah ini SENGAJA dibiarkan untuk tahap awal.
  // Setelah ada transaksi asli (atau Lynk.id punya fitur "Test Webhook"),
  // buka Vercel → Project → Logs, lalu cek payload aslinya untuk pastikan
  // nama field email/no.WA sudah tertangkap benar oleh fungsi pick() di
  // bawah. Kalau belum ketemu, tambahkan nama field yang benar ke array
  // di pick(body, [...]) masing-masing.
  console.log('[lynk-webhook] payload masuk:', JSON.stringify(body));

  // ── Field untuk hitung ulang signature ──
  const refId      = String(pick(body, ['refId', 'ref_id']) ?? '');
  const grandTotal = String(pick(body, ['grandTotal', 'amount', 'grand_total']) ?? '');
  const messageId  = String(pick(body, ['message_id', 'messageId']) ?? '');

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

  // ── Data pembeli — coba beberapa kemungkinan nama field ──
  const email   = pick(body, ['email', 'buyerEmail', 'customer_email', 'customerEmail']);
  const phone   = pick(body, ['phone', 'buyerPhone', 'whatsapp', 'no_wa', 'phone_number', 'phoneNumber']);
  const name    = pick(body, ['name', 'buyerName', 'customer_name', 'customerName']) || '';
  const product = pick(body, ['productName', 'product_name', 'product']) || '';

  if (!email || !phone) {
    console.error('[lynk-webhook] Email/no.WA tidak ditemukan di payload — cek log payload di atas, lalu sesuaikan nama field di pick().');
    // Tetap balas 200 supaya Lynk.id tidak retry berkali-kali; errornya sudah tercatat di log.
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
    product,
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
      console.error('[lynk-webhook] Gagal simpan ke Firebase:', r.status, t);
      res.status(200).json({ ok: false, message: 'Failed to save to Firebase' });
      return;
    }
  } catch (e) {
    console.error('[lynk-webhook] Error koneksi Firebase:', e);
    res.status(200).json({ ok: false, message: 'Firebase error' });
    return;
  }

  console.log('[lynk-webhook] Sukses simpan buyer:', normalizedEmail);
  res.status(200).json({ ok: true });
};
