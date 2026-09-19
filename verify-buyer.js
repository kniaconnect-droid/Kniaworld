// api/verify-buyer.js
//
// Dipanggil dari popup akses di index.html (tab "Baru Saja Beli").
// Mencocokkan email + 4 digit terakhir no. WA terhadap data yang sudah
// disimpan oleh /api/lynk-webhook.js waktu pembayaran sukses. Kalau cocok,
// tulis ke Firebase "verifiedUsers/{uid}" — path yang sama persis yang
// dipakai jalur kode akses lama, jadi begitu ini sukses, buyer langsung
// dianggap ter-verifikasi sama seperti orang yang masuk pakai kode.
//
// ENV VARS (sama dengan lynk-webhook.js):
//   FIREBASE_DB_URL, FIREBASE_DB_SECRET

const FIREBASE_DB_URL = process.env.FIREBASE_DB_URL;
const DB_SECRET = process.env.FIREBASE_DB_SECRET;

function safeEmailKey(email) {
  return email.trim().toLowerCase().replace(/[.#$[\]]/g, '_');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, message: 'Method not allowed' });
    return;
  }

  if (!FIREBASE_DB_URL || !DB_SECRET) {
    console.error('[verify-buyer] ENV VAR belum lengkap.');
    res.status(500).json({ ok: false, message: 'Server belum dikonfigurasi.' });
    return;
  }

  const { email, last4, uid } = req.body || {};

  if (!email || !last4 || !uid) {
    res.status(400).json({ ok: false, message: 'Data tidak lengkap.' });
    return;
  }

  const emailKey = safeEmailKey(email);

  try {
    const r = await fetch(`${FIREBASE_DB_URL}/buyers/${emailKey}.json?auth=${DB_SECRET}`);
    if (!r.ok) {
      console.error('[verify-buyer] Gagal baca Firebase:', r.status);
      res.status(500).json({ ok: false, message: 'Terjadi kesalahan server.' });
      return;
    }
    const buyer = await r.json();

    if (!buyer) {
      res.status(404).json({ ok: false, message: 'Email tidak ditemukan. Pastikan email sama dengan saat checkout di Lynk.id.' });
      return;
    }

    if (String(buyer.last4) !== String(last4)) {
      res.status(401).json({ ok: false, message: '4 digit terakhir nomor WA tidak cocok.' });
      return;
    }

    const writeRes = await fetch(`${FIREBASE_DB_URL}/verifiedUsers/${uid}.json?auth=${DB_SECRET}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerEmail: buyer.email,
        verifiedAt: { '.sv': 'timestamp' },
        source: 'webhook-email'
      })
    });

    if (!writeRes.ok) {
      const t = await writeRes.text();
      console.error('[verify-buyer] Gagal tulis verifiedUsers:', writeRes.status, t);
      res.status(500).json({ ok: false, message: 'Gagal menyimpan status verifikasi.' });
      return;
    }

    console.log('[verify-buyer] Berhasil verifikasi:', buyer.email);
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[verify-buyer] Error:', e);
    res.status(500).json({ ok: false, message: 'Terjadi kesalahan server.' });
  }
};
