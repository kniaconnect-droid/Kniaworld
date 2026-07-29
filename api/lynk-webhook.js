// api/lynk-webhook.js
//
// Endpoint yang didaftarkan sebagai Webhook URL di dashboard Lynk.id
// (Settings → Integrations → Webhook). Setelah pembeli checkout sukses,
// Lynk.id mengirim POST ke sini.
//
// PENTING: Lynk.id cuma punya SATU slot Webhook URL per akun — jadi
// endpoint ini akan menerima notifikasi untuk SEMUA produk yang dijual
// di akun Lynk kamu, bukan cuma produk kniaWorld. Makanya di bawah ada
// pengecekan nama produk (lihat EXPECTED_PRODUCT_TITLE) — transaksi
// produk lain akan diabaikan (tidak dibuatkan akses kniaWorld).
//
// Yang dilakukan endpoint ini:
// 1. Verifikasi X-Lynk-Signature pakai merchant key.
// 2. Cek nama produk yang dibeli — lanjut HANYA kalau cocok dengan
//    produk kniaWorld Prompt Generator.
// 3. Ambil email + no. WA pembeli dari payload.
// 4. Simpan ke Firebase (node "buyers") pakai Database Secret — bukan
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

// Nama produk persis seperti di judul produk Lynk.id kamu.
// Kalau item yang dibeli beda dari ini, webhook diabaikan (bukan error —
// artinya itu transaksi produk lain di akun Lynk yang sama).
const EXPECTED_PRODUCT_TITLE = 'Tools Prompt Generator Build Game Edukasi pake AI (Vibe coding) by Kniaconnect';

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
    'data.message_data.ref_id', 'refId', 'ref_id'
  ]) ?? '');

  const grandTotal = String(pick(body, [
    'data.message_data.totals.grand_total', 'grandTotal', 'amount', 'grand_total'
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

  // ── Cek produk apa yang dibeli ──
  // "items" biasanya array (bisa lebih dari 1 barang dalam 1 transaksi),
  // jadi kita cek apakah salah satu itemnya adalah produk kniaWorld.
  const items = pick(body, ['data.message_data.items', 'items']) || [];
  const itemTitles = Array.isArray(items) ? items.map(it => pick(it, ['title', 'name', 'productName'])) : [];
  // Fallback kalau ternyata bukan array items, coba field produk tunggal.
  const singleProduct = pick(body, ['data.message_data.product', 'productName', 'product_name', 'product']);
  if (singleProduct) itemTitles.push(singleProduct);

  const isThisProduct = itemTitles.some(t => normalizeTitle(t) === normalizeTitle(EXPECTED_PRODUCT_TITLE));

  console.log('[lynk-webhook] Produk di transaksi:', itemTitles, '| cocok kniaWorld?', isThisProduct);

  if (!isThisProduct) {
    console.log('[lynk-webhook] Transaksi produk LAIN (bukan kniaWorld) — diabaikan, tidak dibuatkan akses.');
    res.status(200).json({ ok: true, message: 'Produk lain, dilewati.' });
    return;
  }

  // ── Data pembeli ──
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
    console.error('[lynk-webhook] Email/no.WA tidak ditemukan di payload — cek log payload di atas, lalu sesuaikan path di pick().');
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
      console.error('[lynk-webhook] Gagal simpan ke Firebase:', r.status, t);
      res.status(200).json({ ok: false, message: 'Failed to save to Firebase' });
      return;
    }
  } catch (e) {
    console.error('[lynk-webhook] Error koneksi Firebase:', e);
    res.status(200).json({ ok: false, message: 'Firebase error' });
    return;
  }

  console.log('[lynk-webhook] Sukses simpan buyer kniaWorld:', normalizedEmail);
  res.status(200).json({ ok: true });
};
