// ══════════════════════════════════════
// templates.js — hasil pecahan dari index.html (KniaWorld Prompt Generator)
// ══════════════════════════════════════

  // ── GAME SPECS ──
  // (dimuat dari Realtime Database setelah verifikasi kode akses —
  //  lihat loadProtectedContent() di atas)

  // ── BUILD MAIN PROMPT ──
  function buildPrompt() {
    const gameTypes = getVal('gameTypeChips','cGameType','cGameTypeInput').split(',').map(s=>s.trim()).filter(Boolean);
    const subjects  = getVal('subjectChips','cSubject','cSubjectInput').split(',').map(s=>s.trim()).filter(Boolean);
    const ages      = getVal('ageChips','cAge','cAgeInput').split(',').map(s=>s.trim()).filter(Boolean);
    const difficulty  = getVal('diffChips','cDiff','cDiffInput') || 'mudah dan menyenangkan';
    const features    = getVal('featureChips','cFeature','cFeatureInput');
    const brand       = (document.getElementById('brandName').value.trim() || 'kniaWorld');
    const color       = (getVal('colorChips','cColor','cColorInput') || 'hijau toska dan putih');
    const designNotes = document.getElementById('designNotes').value.trim();
    const extra       = document.getElementById('extraInstructions').value.trim();

    const finalGameType = gameTypes.length ? gameTypes.join(', ') : 'kuis pilihan ganda';
    const finalSubject  = subjects.length ? subjects.join(', ') : 'materi edukasi umum';
    const finalAge      = ages.length ? ages.join(' dan ') : '5-8 tahun';
    const featureText   = features ? `\n- Fitur tambahan: ${features}` : '';
    const designExtra   = designNotes ? `\n- Catatan desain: ${designNotes}` : '';
    const extraSection  = extra ? `\n\n📝 INSTRUKSI KHUSUS TAMBAHAN:\n${extra}` : '';

    const multiGame    = gameTypes.length > 1;
    const multiSubject = subjects.length > 1;
    const multiAge     = ages.length > 1;
    const needsMenu    = multiGame || multiSubject;

    const ageToneNote = `\n⚠️ SESUAIKAN NADA & GAYA DENGAN TARGET USIA (${finalAge}):\n- Jika target usia menunjukkan dewasa/remaja akhir/profesional (mis. "Dewasa", "18+", "17+", atau angka ≥ 17): gunakan nada bahasa matang, praktis, tidak kekanak-kanakan — HINDARI sebutan "anak", analogi mainan anak, sapaan "adik-adik", warna pastel/karakter maskot ala anak TK. Sebut pengguna sebagai "kamu"/"pemain"/"peserta".\n- Jika target usia menunjukkan anak-anak (di bawah 12 tahun, "TK", "PAUD", "SD"): gunakan nada ramah-anak, sederhana dan playful seperti biasa.\n- Jika target usia menunjukkan remaja (13-16 tahun, SMP/SMA): nada lebih santai tapi tetap tidak kekanak-kanakan.`;

    const varietyNote = `\n🎲 VARIASI KONTEN (WAJIB):\n- Hindari redaksi soal/konten yang generik dan template-y (pola kalimat yang sama persis di setiap nomor).\n- Variasikan gaya kalimat, konteks/skenario, dan urutan opsi jawaban antar soal — bahkan untuk materi yang sama dengan generate sebelumnya, buat pendekatan/contoh yang berbeda.\n- ID sesi acak (hanya untuk mendorong variasi internal, jangan ditampilkan ke user): ${Math.floor(Math.random()*1000000)}`;

    const adaptiveAgeNote = multiAge ? `\n⚠️ KONTEN ADAPTIF USIA:
Game ini dimainkan oleh pemain usia ${finalAge}. Buat konten yang berbeda per rentang usia:
- Usia lebih muda: lebih sederhana, lebih banyak visual, instruksi singkat
- Usia lebih tua: lebih kompleks, variasi soal lebih banyak
- Tampilkan pilihan usia di halaman intro sebelum game dimulai (tombol pilih usia, bukan menu terpisah)` : '';

    const primaryGameKey = gameTypes[0] || 'kuis pilihan ganda';
    const spec = GAME_SPECS[primaryGameKey] || DEFAULT_SPEC;

    if (!needsMenu) {
      return `Kamu adalah game developer dan educational content creator yang berpengalaman membuat game edukasi interaktif. Kamu memahami prinsip desain UI yang disesuaikan target usia, learning psychology, dan cara membuat kode yang bersih serta maintainable. Setiap game yang kamu buat harus terasa seperti produk final yang polished — bukan demo atau prototipe.


🎨 KETENTUAN VISUAL:
- MASKOT UTAMA: buat ilustrasi karakter yang relevan dengan materi "${finalSubject}" dan brand "${brand}". Tampilkan di halaman welcoming dengan animasi ringan (bounce/float).
- Gaya visual game: pilih 2D atau 3D (CSS 3D transform / perspective boleh dipakai) — sesuaikan yang paling cocok dan mudah dieksekusi untuk jenis game "${finalGameType}" dan usia target.
- Ikon, badge, feedback benar/salah, dan elemen visual lainnya: bebas ditentukan sendiri (emoji, Font Awesome, atau SVG) — pilih yang paling kontekstual dengan materi dan konsisten, jangan generik/asal tempel untuk semua jenis game.
- Semua elemen visual (termasuk gambar maskot) HARUS tergenerate dalam satu kali proses/respons — jangan minta generate atau upload aset terpisah setelahnya.

Buatkan game edukasi interaktif sesuai target usia yang ditentukan di bawah.

📋 SPESIFIKASI GAME:
- Jenis game: ${finalGameType}
- Materi/tema: ${finalSubject}
- Target usia: ${finalAge}
- Tingkat kesulitan: ${difficulty}${featureText}
- Brand: "${brand}", warna tema: ${color}${designExtra}
${adaptiveAgeNote}${ageToneNote}${varietyNote}

🎯 MANFAAT & TRANSFORMASI:
- Sebelum menyusun soal/konten, tentukan manfaat konkret mempelajari "${finalSubject}" bagi pemain, serta goal transformasi yang ingin dicapai setelah menyelesaikan game ini (misal dari belum paham → paham, dari ragu → percaya diri, dari lambat → cepat — sesuaikan dengan materinya sendiri, jangan generik).
- Selipkan pesan manfaat/transformasi ini secara natural di tagline halaman welcoming dan di pesan penyemangat pada halaman skor akhir.
- Rancang pengalaman mekanik game (interaksi, animasi, feedback) supaya terasa nyata dan sesuai konteks materi/jenis game "${finalGameType}" — bukan generik asal jadi. Contoh: kalau temanya berkaitan dengan aktivitas dunia nyata, buat interaksinya semirip mungkin dengan aktivitas aslinya.

📐 KETENTUAN TEKNIS:
- Responsive & mobile-first
- Semua soal/konten harus relevan dengan materi "${finalSubject}" (bukan soal generik)
- Font besar, mudah dibaca sesuai target usia — minimal 18px untuk teks soal
- Semua tombol & area tap: minimal ukuran 48x48px, nyaman disentuh

🏠 HALAMAN WELCOMING (WAJIB — LAYAR PERTAMA SEBELUM GAME):
- Background: warna tema yang kaya + ornamen/pola dekoratif (gelombang, bintang, atau bentuk geometris kecil)
- Maskot/karakter: ilustrasi sesuai ketentuan visual di atas, tampil besar, diberi animasi bounce atau float terus-menerus
- Nama brand "${brand}" ditampilkan besar dan mencolok (font tebal, bisa ada outline atau shadow)
- Tagline pendek yang mengundang, sesuaikan dengan materi
- Tombol CTA besar dan menarik untuk mulai bermain, dengan animasi pulse atau glow
- Transisi smooth dari halaman welcoming ke halaman game (fade atau slide)

🎮 LAYOUT & MEKANISME GAME (WAJIB IKUTI):
${spec.layout}

⚙️ ALUR GAME:
0. Halaman Welcoming → klik "Mulai Main!" → masuk game
${spec.flow}

🎨 DESAIN:
- Warna tema: ${color} — konsisten di semua halaman
- Gaya visual: sesuaikan dengan target usia (cerah & playful untuk anak, lebih clean/matang untuk usia dewasa)
- Animasi: transisi halaman smooth, feedback animasi saat benar/salah

🌐 BAHASA: Indonesia untuk instruksi, konten soal sesuai materi

🏆 SISTEM SKOR:
- Skor real-time di pojok kanan atas
- Skor akhir: nilai, bintang (1–3), pesan penyemangat, tombol "Main Lagi"${extraSection}
`;
    }

    let menuInstructions = '';
    if (multiGame && !multiSubject) {
      menuInstructions = `\n🗂️ MENU PILIH JENIS GAME (WAJIB ADA):\n${gameTypes.map((gt,i)=>`  ${i+1}. Card "${gt}"`).join('\n')}\n- Setiap card: ikon Font Awesome relevan + nama game + deskripsi singkat + tombol "Pilih"\n- Materi semua game: ${finalSubject}\n- Tombol "← Ganti Jenis Game" di dalam game\n\nSPESIFIKASI PER JENIS GAME:\n${gameTypes.map(gt=>{const s=GAME_SPECS[gt]||DEFAULT_SPEC;return `\n▶ "${gt}":\n  Layout: ${s.layout}\n  Alur: ${s.flow}`;}).join('\n')}`;
    } else if (!multiGame && multiSubject) {
      menuInstructions = `\n🗂️ MENU PILIH MATERI (WAJIB ADA):\n${subjects.map((s,i)=>`  ${i+1}. Card "${s}"`).join('\n')}\n- Setiap card: ikon Font Awesome relevan + nama materi + contoh soal singkat + tombol "Pilih"\n- Setiap materi punya set soal SENDIRI yang berbeda\n- Tombol "← Pilih Materi Lain" di dalam game`;
    } else {
      menuInstructions = `\n🗂️ MENU BERTINGKAT (2 LANGKAH):\nLangkah 1 — Pilih Jenis Game:\n${gameTypes.map((gt,i)=>`  ${i+1}. "${gt}"`).join('\n')}\nLangkah 2 — Pilih Materi:\n${subjects.map((s,i)=>`  ${i+1}. "${s}"`).join('\n')}\n- Setiap langkah = halaman tersendiri (bukan dropdown)\n- Konten soal disesuaikan kombinasi unik\n\nSPESIFIKASI PER JENIS GAME:\n${gameTypes.map(gt=>{const s=GAME_SPECS[gt]||DEFAULT_SPEC;return `\n▶ "${gt}":\n  Layout: ${s.layout}\n  Alur: ${s.flow}`;}).join('\n')}`;
    }

    return `Kamu adalah game developer dan educational content creator yang berpengalaman membuat game edukasi interaktif. Kamu memahami prinsip desain UI yang disesuaikan target usia, learning psychology, dan cara membuat kode yang bersih serta maintainable. Setiap game yang kamu buat harus terasa seperti produk final yang polished — bukan demo atau prototipe.


🎨 KETENTUAN VISUAL:
- MASKOT UTAMA: buat ilustrasi karakter yang relevan dengan materi "${finalSubject}" dan brand "${brand}". Tampilkan di halaman welcoming dengan animasi ringan (bounce/float).
- Gaya visual game: pilih 2D atau 3D (CSS 3D transform / perspective boleh dipakai) — sesuaikan yang paling cocok dan mudah dieksekusi untuk jenis game "${finalGameType}" dan usia target.
- Ikon, badge, feedback benar/salah, dan elemen visual lainnya: bebas ditentukan sendiri (emoji, Font Awesome, atau SVG) — pilih yang paling kontekstual dengan materi dan konsisten, jangan generik/asal tempel untuk semua jenis game.
- Semua elemen visual (termasuk gambar maskot) HARUS tergenerate dalam satu kali proses/respons — jangan minta generate atau upload aset terpisah setelahnya.

Buatkan game edukasi interaktif sesuai target usia yang ditentukan di bawah.

📋 SPESIFIKASI GAME:
- Jenis game tersedia: ${finalGameType}
- Materi/tema tersedia: ${finalSubject}
- Target usia: ${finalAge}
- Tingkat kesulitan: ${difficulty}${featureText}
- Brand: "${brand}", warna tema: ${color}${designExtra}
${adaptiveAgeNote}${ageToneNote}${varietyNote}

🎯 MANFAAT & TRANSFORMASI:
- Sebelum menyusun soal/konten, tentukan manfaat konkret mempelajari "${finalSubject}" bagi pemain, serta goal transformasi yang ingin dicapai setelah menyelesaikan game ini (misal dari belum paham → paham, dari ragu → percaya diri, dari lambat → cepat — sesuaikan dengan materinya sendiri, jangan generik).
- Selipkan pesan manfaat/transformasi ini secara natural di tagline halaman welcoming dan di pesan penyemangat pada halaman skor akhir.
- Rancang pengalaman mekanik game (interaksi, animasi, feedback) supaya terasa nyata dan sesuai konteks materi/jenis game "${finalGameType}" — bukan generik asal jadi. Contoh: kalau temanya berkaitan dengan aktivitas dunia nyata, buat interaksinya semirip mungkin dengan aktivitas aslinya.

📐 KETENTUAN TEKNIS:
- Responsive & mobile-first
- Font minimal 18px, tombol minimal 48x48px
${menuInstructions}

🏠 HALAMAN WELCOMING (LAYAR PERTAMA):
- Maskot ilustrasi sesuai ketentuan visual di atas, tampil besar beranimasi, brand "${brand}" mencolok, tagline mengundang
- Tombol CTA untuk mulai bermain dengan pulse animation, transisi smooth ke menu

🎨 DESAIN: ${color} — konsisten di semua halaman, cerah dan playful
🌐 BAHASA: Indonesia untuk instruksi, konten soal sesuai materi
🏆 SKOR AKHIR: nilai, bintang, pesan, tombol "Main Lagi" + "← Pilih Lagi"${extraSection}
`;
  }

  // ══════════════════════════════════════
  //  5 PRO TEMPLATE BUILDERS
  // ══════════════════════════════════════
  // ── TEMPLATE 15 MODE SWITCHER (global) ──
  let t15Mode = 'apk';
  function switchT15Mode(mode) {
    t15Mode = mode;
    const isAPK = mode === 'apk';
    // Mode toggle buttons no longer in DOM (selection now via main "toolMenu" dropdown) — guarded.
    const apkBtn = document.getElementById('t15_modeAPK');
    const pwaBtn = document.getElementById('t15_modePWA');
    if (apkBtn && pwaBtn) {
      if (isAPK) {
        apkBtn.style.border = '2px solid #10b981';
        apkBtn.style.background = 'linear-gradient(135deg,#ecfdf5,#d1fae5)';
        apkBtn.style.color = '#065f46';
        pwaBtn.style.border = '2px solid #e2e8f0';
        pwaBtn.style.background = '#f8fafc';
        pwaBtn.style.color = '#64748b';
      } else {
        pwaBtn.style.border = '2px solid #8b5cf6';
        pwaBtn.style.background = 'linear-gradient(135deg,#faf5ff,#ede9fe)';
        pwaBtn.style.color = '#5b21b6';
        apkBtn.style.border = '2px solid #e2e8f0';
        apkBtn.style.background = '#f8fafc';
        apkBtn.style.color = '#64748b';
      }
    }
    const infoAPK = document.getElementById('t15_infoAPK');
    const infoPWA = document.getElementById('t15_infoPWA');
    if (infoAPK) infoAPK.style.display = isAPK ? 'flex' : 'none';
    if (infoPWA) infoPWA.style.display = isAPK ? 'none' : 'flex';
    const pwaFields = document.getElementById('t15_pwaFields');
    if (pwaFields) pwaFields.style.display = isAPK ? 'none' : 'contents';
    const genLabel = document.getElementById('t15_genLabel');
    if (genLabel) genLabel.textContent = isAPK ? 'Generate Prompt APK' : 'Generate Prompt PWA';
    const genBtn = document.getElementById('t15_genBtn');
    if (genBtn) {
      genBtn.style.background = isAPK ? 'linear-gradient(135deg,#10b981,#06b6d4)' : 'linear-gradient(135deg,#8b5cf6,#6d28d9)';
      genBtn.style.boxShadow = isAPK ? '0 4px 14px rgba(16,185,129,0.35)' : '0 4px 14px rgba(139,92,246,0.35)';
    }
    const res = document.getElementById('t15_result');
    if (res) { res.style.display = 'none'; res.classList.remove('open'); }
    const copyBtn = document.getElementById('t15_copyBtn');
    if (copyBtn) copyBtn.style.display = 'none';
  }

  // ── UNIFIED TOOLS MENU SWITCHER ──
  const _TOOL_BLOCK_KEYS = ['revisi_soal','revisi_fitur','revisi_bug','bundling','worksheet','gambar','suara','audit','jadi'];
  function switchToolMenu() {
    const sel = document.getElementById('toolMenu');
    const val = sel.value;
    const showKey = (val === 'jadi_pwa' || val === 'jadi_android') ? 'jadi' : val;
    _TOOL_BLOCK_KEYS.forEach(key => {
      const el = document.getElementById('block_' + key);
      if (el) el.style.display = (key === showKey) ? 'block' : 'none';
    });
    if (val === 'jadi_pwa') switchT15Mode('pwa');
    if (val === 'jadi_android') switchT15Mode('apk');
    const shown = document.getElementById('block_' + showKey);
    if (shown) shown.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ── Toggle "tulis usia sendiri" custom text field when a Target Usia <select> = 'custom' ──
  function toggleCustomAge(selectEl, customInputId) {
    const customInput = document.getElementById(customInputId);
    if (!customInput) return;
    if (selectEl.value === 'custom') {
      customInput.style.display = 'block';
      customInput.focus();
    } else {
      customInput.style.display = 'none';
    }
  }

  // ── finalizePrompt: dulu menambahkan guard ikon/visual di akhir prompt.
  //    Sekarang dikosongkan supaya AI bebas menentukan gaya ikon/visual sendiri. ──
  function finalizePrompt(text) {
    return text;
  }

  function buildTemplatePrompt(tplId) {
    // ── SAFE FIELD READER (prevents null crash for templates without _usia etc.) ──
    function fv(id, fallback) {
      const el = document.getElementById(id);
      return el ? (el.value.trim() || fallback || '') : (fallback || '');
    }

    // ── USIA READER: pakai isian custom kalau user pilih "Tulis usia sendiri" ──
    function usiaVal(selectId, customId, fallback) {
      const sel = document.getElementById(selectId);
      if (!sel) return fallback || '';
      if (sel.value === 'custom') {
        const custom = document.getElementById(customId);
        const v = custom ? custom.value.trim() : '';
        return v || fallback || '';
      }
      return sel.value || fallback || '';
    }

    if (tplId === 1) {
      const materi = fv(`t1_materi`, 'materi edukasi');
      const brand  = fv(`t1_brand`, 'kniaWorld');
      const usia   = usiaVal('t1_usia','t1_usia_custom', '6-9 tahun');
      const warna  = fv(`t1_warna`, 'cerah dan playful, sesuai tema materi');
    return finalizePrompt(renderTpl('t1', {materi, brand, usia, warna}));
    } // end tplId===1

    if (tplId === 2) {
      const materi = fv(`t2_materi`, 'materi edukasi');
      const brand  = fv(`t2_brand`, 'kniaWorld');
      const usia   = usiaVal('t2_usia','t2_usia_custom', '8-10 tahun');
      const warna  = fv(`t2_warna`, 'cerah dan playful, sesuai tema materi');
    return finalizePrompt(renderTpl('t2', {materi, brand, usia, warna}));
    } // end tplId===2

    if (tplId === 3) {
      const materi = fv(`t3_materi`, 'materi edukasi');
      const brand  = fv(`t3_brand`, 'kniaWorld');
      const usia   = usiaVal('t3_usia','t3_usia_custom', '4-6 tahun');
      const warna  = fv(`t3_warna`, 'cerah dan playful, sesuai tema materi');
    return finalizePrompt(renderTpl('t3', {materi, brand, usia, warna}));
    } // end tplId===3

    if (tplId === 4) {
      const materi = fv(`t4_materi`, 'materi edukasi');
      const brand  = fv(`t4_brand`, 'kniaWorld');
      const usia   = usiaVal('t4_usia','t4_usia_custom', '8-11 tahun');
      const warna  = fv(`t4_warna`, 'cerah dan playful, sesuai tema materi');
    return finalizePrompt(renderTpl('t4', {materi, brand, usia, warna}));
    } // end tplId===4

    if (tplId === 5) {
      const materi = fv(`t5_materi`, 'materi edukasi');
      const brand  = fv(`t5_brand`, 'kniaWorld');
      const usia   = usiaVal('t5_usia','t5_usia_custom', '3-5 tahun');
      const warna  = fv(`t5_warna`, 'cerah dan playful, sesuai tema materi');
    return finalizePrompt(renderTpl('t5', {materi, brand, usia, warna}));
    } // end tplId===5

    if (tplId === 16) {
      const materi = fv(`t16_materi`, 'materi edukasi');
      const brand  = fv(`t16_brand`, 'kniaWorld');
      const usia   = usiaVal('t16_usia','t16_usia_custom', '7-10 tahun');
      const warna  = fv(`t16_warna`, 'cerah dan playful, sesuai tema materi');
    return finalizePrompt(renderTpl('t16', {materi, brand, usia, warna}));
    } // end tplId===16

    if (tplId === 17) {
      const materi = fv(`t17_materi`, 'materi edukasi');
      const brand  = fv(`t17_brand`, 'kniaWorld');
      const usia   = usiaVal('t17_usia','t17_usia_custom', '8-11 tahun');
      const warna  = fv(`t17_warna`, 'cerah dan playful, sesuai tema materi');
    return finalizePrompt(renderTpl('t17', {materi, brand, usia, warna}));
    } // end tplId===17

    // ── TEMPLATE 6: CODING ADVENTURE ──
    if (tplId === 6) {
      const topik  = fv('t6_topik', 'Dasar-Dasar Coding');
      const level6 = fv('t6_level', '5 level');
      const brand6 = fv('t6_brand', 'kniaWorld');
      const usia6  = usiaVal('t6_usia','t6_usia_custom', '9-12 tahun');
      const warna6 = fv('t6_warna', 'cerah dan playful, sesuai tema materi');
      return finalizePrompt(renderTpl('t6', {topik, level6, brand6, usia6, warna6}));
    }

    // ── TEMPLATE 7: SINGAPORE MATH ──
    if (tplId === 7) {
      const topik7  = fv('t7_topik', 'Number Bonds');
      const grade7  = usiaVal('t7_grade','t7_grade_custom', 'Primary 2 (Grade 2, usia 7-8 tahun)');
      const brand7  = fv('t7_brand', 'kniaWorld');
      const warna7  = fv('t7_warna', 'cerah dan playful, sesuai tema materi');
      return finalizePrompt(renderTpl('t7', {topik7, grade7, brand7, warna7}));
    }

    // ── TEMPLATE 8: ENGLISH QUEST ──
    if (tplId === 8) {
      const topik8 = fv('t8_topik', 'Vocabulary Building');
      const level8 = fv('t8_level', 'Beginner (A1)');
      const brand8 = fv('t8_brand', 'kniaWorld');
      const usia8  = usiaVal('t8_usia','t8_usia_custom', '6-10 tahun');
      const warna8 = fv('t8_warna', 'cerah dan playful, sesuai tema materi');
      return finalizePrompt(renderTpl('t8', {topik8, level8, brand8, usia8, warna8}));
    }

    // ── TEMPLATE 9: REVISI GANTI SOAL ──
    if (tplId === 9) {
      const jenis9  = fv('t9_jenis',  'ganti semua soal dengan materi baru');
      const materi9 = fv('t9_materi', 'materi baru');
      const extra9  = fv('t9_extra',  '');
      const extraLine = extra9 ? `\n- Instruksi khusus tambahan: ${extra9}` : '';
      return finalizePrompt(renderTpl('t9', {jenis9, materi9, extra9, extraLine}));
    }

    // ── TEMPLATE 10: REVISI UPGRADE FITUR ──
    if (tplId === 10) {
      const jenis10   = fv('t10_jenis',  'tambahkan sistem level baru dengan soal yang semakin sulit');
      const detail10  = fv('t10_detail', '');
      const extra10   = fv('t10_extra',  '');
      const detailLine   = detail10 ? `\n- Detail spesifikasi: ${detail10}` : '';
      const extraLine10  = extra10  ? `\n- Instruksi tambahan: ${extra10}`  : '';
      return finalizePrompt(renderTpl('t10', {jenis10, detail10, extra10, detailLine, extraLine10}));
    }

    // ── TEMPLATE 11: REVISI FIX BUG ──
    if (tplId === 11) {
      const jenis11   = fv('t11_jenis', 'perbaiki tampilan di mobile');
      const masalah11 = fv('t11_masalah', '');
      const warna11   = fv('t11_warna', '');
      return finalizePrompt(renderTpl('t11', {jenis11: jenis11, masalah11: masalah11, warna11: warna11}));
    }

    // ── TEMPLATE 12: BUNDLING ──
    if (tplId === 12) {
      const game12  = fv('t12_game',  'kuis pilihan ganda');
      const m1      = fv('t12_m1',    'Materi 1');
      const m2      = fv('t12_m2',    'Materi 2');
      const m3      = fv('t12_m3',    'Materi 3');
      const m4      = fv('t12_m4',    'Materi 4');
      const m5      = fv('t12_m5',    'Materi 5');
      const brand12 = fv('t12_brand', 'kniaWorld');
      const usia12  = usiaVal('t12_usia','t12_usia_custom', '7-10 tahun');
      const warna12 = fv('t12_warna', 'cerah dan playful, sesuai tema materi');
      return finalizePrompt(renderTpl('t12', {game12, m1, m2, m3, m4, m5, brand12, usia12, warna12}));
    }

    // ── TEMPLATE 13: WORKSHEET TO GAME ──
    if (tplId === 13) {
      const isi13    = fv('t13_isi', 'materi dari worksheet');
      const usia13   = usiaVal('t13_usia','t13_usia_custom', '7-10 tahun');
      const tujuan13 = fv('t13_tujuan', 'memahami materi dengan cara yang menyenangkan');
      const jenis13  = fv('t13_jenis', 'kuis pilihan ganda');
      const style13  = fv('t13_style', 'Playful & Bersih (ikon Font Awesome / SVG, tanpa emoji)');
      const brand13  = fv('t13_brand', 'kniaWorld');
      const warna13  = fv('t13_warna', 'cerah dan playful, sesuai tema materi');
      return finalizePrompt(renderTpl('t13', {isi13, usia13, tujuan13, jenis13, style13, brand13, warna13}));
    }

    // ── TEMPLATE 14: AUDIT GAME SIAP JUAL ──
    if (tplId === 14) {
      const nama14   = fv('t14_nama', 'Game Edukasi');
      const target14 = usiaVal('t14_target','t14_target_custom', '7-10 tahun');
      const harga14  = fv('t14_harga', 'Rp 25.000 – Rp 75.000');
      return finalizePrompt(renderTpl('t14', {nama14, target14, harga14}));
    }

    if (tplId === 15) {
      const topik   = fv('t15_topik', 'Sesuaikan dengan game yang dilampirkan');
      const fitur   = fv('t15_fitur', 'tombol besar touch-friendly, animasi tap');
      const appname = fv('t15_appname', 'EduGame');

      // Show correct next step panel
      const nextAPK = document.getElementById('t15_nextAPK');
      const nextPWA = document.getElementById('t15_nextPWA');
      if (nextAPK && nextPWA) {
        nextAPK.style.display = t15Mode === 'apk' ? 'block' : 'none';
        nextPWA.style.display = t15Mode === 'pwa' ? 'block' : 'none';
      }

      // ── APK MODE (client-side builder — game/kode sudah dilampirkan user) ──
      if (t15Mode === 'apk') {
        return finalizePrompt(`Kamu adalah frontend developer berpengalaman menyiapkan game edukasi HTML supaya siap di-wrap menjadi aplikasi Android.

📋 TUGAS: Sesuaikan game yang sudah saya buat (lihat file kode HTML yang saya lampirkan) supaya optimal saat di-wrap jadi APK Android lewat WebIntoApp/Gonative — JANGAN ubah desain, soal, atau fitur yang sudah ada.

📱 KONTEKS APLIKASI:
- Nama App: ${appname}
- Topik/Materi: ${topik}
- Fitur utama yang sudah ada: ${fitur}

⚙️ PENYESUAIAN TEKNIS YANG DIPERLUKAN:
- Pastikan viewport meta tag benar untuk tampilan mobile penuh (tanpa zoom, tanpa scroll horizontal)
- Nonaktifkan efek "pull to refresh" dan bounce scroll ala browser
- Pastikan semua tombol & interaksi tetap berfungsi normal di WebView Android (hindari fitur yang butuh browser chrome seperti address bar)
- Tambahkan meta tag untuk mencegah zoom pinch yang tidak sengaja
- Pastikan game tetap berjalan offline penuh (tidak ada request ke server luar)

🌐 Setelah selesai, tunjukkan bagian kode yang diubah saja supaya mudah saya cek.`);
      }

      // ── PWA MODE (client-side builder — game/kode sudah dilampirkan user) ──
      if (t15Mode === 'pwa') {
        const display = fv('t15_display', 'standalone');
        const folder  = appname.toLowerCase().replace(/\s+/g, '-') || 'game-pwa';
        return finalizePrompt(`Kamu adalah frontend developer berpengalaman mengubah game edukasi HTML menjadi PWA (Progressive Web App) yang bisa diinstall dari browser.

📋 TUGAS: Ubah game yang sudah saya buat (lihat file kode HTML yang saya lampirkan) menjadi PWA installable — JANGAN ubah desain, soal, atau fitur yang sudah ada.

📱 KONTEKS APLIKASI:
- Nama App: ${appname}
- Topik/Materi: ${topik}
- Fitur utama yang sudah ada: ${fitur}
- Display mode PWA: ${display}
- Nama folder saat di-zip nanti: ${folder}

⚙️ FILE YANG PERLU DIBUAT (3 file terpisah):
1. index.html — game asli saya + tag <link rel="manifest"> dan pendaftaran service worker
2. manifest.json — nama app "${appname}", display: "${display}", theme_color & background_color yang sesuai tema game, icon 192x192 & 512x512 (buat sebagai ikon SVG/CSS shape sederhana yang relevan dengan tema game — bukan emoji — kalau saya tidak lampirkan file ikon)
3. sw.js — service worker sederhana untuk cache-first offline support

🌐 Jangan ubah struktur/logic/desain game selain penambahan dukungan PWA di atas. Setelah selesai, tunjukkan isi ketiga file tersebut secara terpisah dan jelas.`);
      }
    }

    // ── TAMBAH/GANTI GAMBAR SENDIRI (client-side, no Firebase template needed) ──
    if (tplId === 'gambar') {
      const bagian = fv('tgambar_bagian', 'elemen visual yang generik di game (ikon default)');
      const file   = fv('tgambar_file', 'nama-file-gambar.png');
      const gaya   = fv('tgambar_gaya', '');
      const gayaLine = gaya ? `\n- Catatan gaya/ukuran: ${gaya}` : '';
      return finalizePrompt(`Kamu adalah frontend developer berpengalaman mengedit game edukasi HTML yang sudah jadi.

📋 TUGAS: Ganti/tambahkan gambar custom ke game yang sudah ada (lihat file kode HTML yang saya lampirkan).

🖼️ DETAIL PENGGANTIAN GAMBAR:
- Bagian yang diganti: ${bagian}
- File gambar yang saya lampirkan: ${file}${gayaLine}

⚙️ KETENTUAN TEKNIS:
- Gunakan file gambar yang saya lampirkan (embed sebagai base64 di dalam HTML, atau referensi sesuai instruksi saya)
- Jaga rasio & ukuran gambar tetap proporsional dan responsive di semua ukuran layar
- Jangan ubah struktur/logic game lain di luar bagian visual yang diminta
- Pastikan gambar tetap terlihat jelas dan tidak pecah/blur di layar HP

🌐 Setelah selesai, tunjukkan bagian kode yang diubah saja supaya mudah saya cek.`);
    }

    // ── TAMBAH SUARA/VOICE (client-side, no Firebase template needed) ──
    if (tplId === 'suara') {
      const jenisSuara = fv('tsuara_jenis', 'efek suara saat jawaban benar dan salah');
      const sumber     = fv('tsuara_sumber', 'gunakan Web Audio API untuk generate efek suara otomatis (tanpa file tambahan)');
      const fileAudio  = fv('tsuara_file', '');
      const fileLine   = fileAudio ? `\n- File audio yang saya lampirkan: ${fileAudio}` : '';
      return `Kamu adalah frontend developer berpengalaman menambahkan audio ke game edukasi HTML yang sudah jadi.

📋 TUGAS: Tambahkan elemen suara ke game yang sudah ada (lihat file kode HTML yang saya lampirkan).

🔊 DETAIL AUDIO:
- Jenis suara: ${jenisSuara}
- Sumber suara: ${sumber}${fileLine}

⚙️ KETENTUAN TEKNIS:
- Tambahkan tombol mute/unmute yang mudah dijangkau di pojok layar
- Suara tidak boleh mengganggu — durasi efek pendek (di bawah 1 detik), volume wajar
- Kalau pakai text-to-speech, gunakan Bahasa Indonesia (lang: 'id-ID') dan pastikan ada fallback kalau browser tidak support
- Jangan ubah struktur/logic game lain di luar penambahan audio ini

🌐 Setelah selesai, tunjukkan bagian kode yang diubah saja supaya mudah saya cek.`;
    }

  } // end buildTemplatePrompt

  // ── TEMPLATE ACTIONS — dengan fake loading animation ──
  const _tplPhrases = [
    ['🔍 Membaca template...', '🧩 Menyusun parameter...', '✨ Membangun prompt AI...', '🎯 Siap!'],
    ['📋 Menganalisis spesifikasi...', '🛠️ Merancang instruksi...', '🚀 Finalisasi...', '✅ Done!'],
    ['⚙️ Memproses input...', '💡 Mengoptimalkan prompt...', '🎨 Menambahkan detail...', '⚡ Generated!'],
    ['🌟 Membaca pilihan kamu...', '🔧 Merakit struktur prompt...', '📡 Generating...', '🎉 Selesai!'],
  ];
  function generateTemplate(tplId) {
    let prompt = buildTemplatePrompt(tplId);
    if (!prompt) return;
    // Append Instruksi Tambahan if filled
    const _tamEl = document.getElementById('t' + tplId + '_tambahan');
    const _tambahan = _tamEl ? _tamEl.value.trim() : '';
    if (_tambahan) {
      prompt += '\n\n\uD83D\uDCCC INSTRUKSI TAMBAHAN DARI PEMBUAT GAME:\n' + _tambahan;
    }
    // Find generate button for this template (numeric tplIds are unquoted in onclick, string tplIds are quoted)
    const genBtn = document.querySelector(`[onclick="generateTemplate(${tplId})"]`)
      || document.querySelector(`[onclick="generateTemplate('${tplId}')"]`);
    const phrases = _tplPhrases[Math.floor(Math.random() * _tplPhrases.length)];
    const delay = 1400 + Math.random() * 900; // 1.4s–2.3s total loading
    if (genBtn) {
      const origHtml = genBtn.innerHTML;
      genBtn.disabled = true;
      let pi = 0;
      genBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${phrases[0]}`;
      const phaseCount = 3;
      const phaseDelay = delay / phaseCount;
      const iv = setInterval(() => {
        pi++;
        if (pi < phaseCount) {
          genBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${phrases[pi]}`;
        } else {
          clearInterval(iv);
          genBtn.disabled = false;
          genBtn.innerHTML = origHtml;
          _showTemplateResult(tplId, prompt);
        }
      }, phaseDelay);
    } else {
      _showTemplateResult(tplId, prompt);
    }
  }

  function _showTemplateResult(tplId, prompt) {
    const el = document.getElementById(`t${tplId}_text`);
    const resultEl = document.getElementById(`t${tplId}_result`);
    const copyBtn = document.getElementById(`t${tplId}_copyBtn`);
    // Show result container dulu
    resultEl.classList.add('open');
    copyBtn.style.display = 'flex';
    el.textContent = '';
    // Type-writer streaming reveal
    let i = 0;
    const chunkSize = Math.max(4, Math.floor(prompt.length / 260));
    const speed = Math.max(1, Math.floor(7000 / prompt.length));
    function tick() {
      if (i < prompt.length) {
        el.textContent += prompt.slice(i, i + chunkSize);
        i += chunkSize;
        el.scrollTop = el.scrollHeight;
        setTimeout(tick, speed);
      }
    }
    tick();
    setTimeout(() => {
      resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }

  function copyTemplateResult(tplId) {
    const text = document.getElementById(`t${tplId}_text`).textContent;
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById(`t${tplId}_copyBtn`);
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Tersalin!';
      setTimeout(() => btn.innerHTML = orig, 2000);
      document.querySelectorAll(`#t${tplId}_result .btn-copy-full`).forEach(b => {
        const o = b.innerHTML;
        b.innerHTML = '<i class="fa-solid fa-circle-check"></i> Tersalin! Buka AI kamu';
        setTimeout(() => b.innerHTML = o, 2000);
      });
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    });
  }

  function closeResult(tplId) {
    document.getElementById(`t${tplId}_result`).classList.remove('open');
  }

  // ── MAIN GENERATE — dengan fake loading animation ──
  const _loadingPhrases = [
    ['🔍 Membaca parameter game...', '⚙️ Menyusun struktur prompt...', '✨ Mengoptimalkan instruksi...', '🎯 Prompt siap!'],
    ['📋 Menganalisis jenis game...', '🧠 Merancang spesifikasi AI...', '🚀 Memfinalisasi prompt...', '✅ Selesai!'],
    ['🎮 Memproses pilihan game...', '💡 Meracik instruksi terbaik...', '🔧 Menyesuaikan parameter...', '⚡ Prompt generated!'],
    ['🌟 Mendeteksi tema & usia...', '📐 Menyusun layout spesifikasi...', '🎨 Menambahkan detail desain...', '🎉 Siap digunakan!'],
    ['🔮 Memproses input kamu...', '🛠️ Merakit instruksi AI...', '📡 Mengirim ke generator...', '💫 Done!'],
  ];
  function generatePrompt() {
    const prompt = finalizePrompt(buildPrompt());
    // Pick random phrase set
    const phrases = _loadingPhrases[Math.floor(Math.random() * _loadingPhrases.length)];
    // Show loading overlay on button
    const btn = document.querySelector('#pageForm .btn-primary');
    if (btn) {
      const origHtml = btn.innerHTML;
      btn.disabled = true;
      let pi = 0;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${phrases[0]}`;
      const iv = setInterval(() => {
        pi++;
        if (pi < phrases.length) {
          btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${phrases[pi]}`;
        } else {
          clearInterval(iv);
          btn.disabled = false;
          btn.innerHTML = origHtml;
          _revealPromptResult(prompt);
        }
      }, 480 + Math.random() * 220);
    } else {
      _revealPromptResult(prompt);
    }
  }

  function _revealPromptResult(prompt) {
    goTo('pageResult');
    const el = document.getElementById('outputText');
    el.textContent = '';
    // Type-writer reveal — character by character (fast, like streaming)
    let i = 0;
    const speed = Math.max(1, Math.floor(8000 / prompt.length)); // ~8 detik total
    const chunkSize = Math.max(3, Math.floor(prompt.length / 300)); // keluar per chunk
    function tick() {
      if (i < prompt.length) {
        el.textContent += prompt.slice(i, i + chunkSize);
        i += chunkSize;
        el.scrollTop = el.scrollHeight;
        setTimeout(tick, speed);
      }
    }
    tick();
  }

  function copyPrompt() {
    const text = document.getElementById('outputText').textContent;
    return navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById('copyBtn');
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Tersalin!';
      setTimeout(() => btn.innerHTML = orig, 2000);
      return true;
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      return true;
    });
  }

  function openInClaude() {
    const text = document.getElementById('outputText').textContent;
    if (!text.trim()) return;
    copyToClipboard(text);
    window.open('https://claude.ai/new', '_blank');
  }

  function openInGemini() {
    const text = document.getElementById('outputText').textContent;
    if (!text.trim()) return;
    copyToClipboard(text);
    window.open('https://gemini.google.com/app', '_blank');
  }

  // ── TEMPLATE AI OPEN ──
  // Copy synchronously (execCommand) so window.open stays in same user-gesture
  function copyToClipboard(text) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;width:1px;height:1px;';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } catch(e) {}
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }

  function openInClaudeTemplate(tplId) {
    const text = document.getElementById(`t${tplId}_text`).textContent;
    if (!text.trim()) { alert('Generate prompt dulu ya!'); return; }
    copyToClipboard(text);
    window.open('https://claude.ai/new', '_blank');
  }

  function openInGeminiTemplate(tplId) {
    const text = document.getElementById(`t${tplId}_text`).textContent;
    if (!text.trim()) { alert('Generate prompt dulu ya!'); return; }
    copyToClipboard(text);
    window.open('https://gemini.google.com/app', '_blank');
  }

