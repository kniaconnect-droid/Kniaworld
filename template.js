// ══════════════════════════════════════
// templates.js — hasil pecahan dari index.html (KniaWorld Prompt Generator)
// ══════════════════════════════════════

  // ── GAME SPECS ──
  // (dimuat dari Realtime Database setelah verifikasi kode akses —
  //  lihat loadProtectedContent() di atas)

  // ── PETA GAYA & MOOD → KEPUTUSAN UI ──
  // Isinya RENTANG/ARAH (bukan angka kaku) supaya AI tetap fleksibel,
  // tapi tidak melenceng dari karakter gaya yang dipilih user.
  const STYLE_TOKENS = {
    'minimal':        'tampilan tenang & lega: border 0-1px halus, radius sedang (8-14px), shadow sangat tipis atau tanpa shadow, tombol flat tanpa efek 3D, banyak ruang kosong, ikon/ilustrasi garis sederhana, font weight sedang (500-600)',
    'clean':          'rapi & modern: border 1px halus, radius 10-14px, shadow lembut satu lapis, tombol solid flat, hierarki tipografi jelas, ilustrasi sederhana tanpa outline tebal',
    'playful':        'ceria tapi tetap rapi: radius besar & membulat (16-24px), border tipis-sedang (0-2px), shadow lembut berwarna, tombol membulat dengan sedikit bounce, ilustrasi bentuk organik',
    'cartoon':        'gaya kartun: outline tegas boleh dipakai (2-3px), shadow offset solid boleh, tombol boleh agak chunky, warna jenuh — ini satu-satunya gaya yang memang boleh terlihat tebal',
    'storybook':      'buku cerita: tekstur kertas/watercolor halus, tanpa outline keras, bentuk organik tidak simetris, font ramah/serif lembut, ilustrasi seperti lukisan buku anak',
    'pixel-inspired': 'terinspirasi pixel art: sudut tajam (radius 0-4px), border bergaya pixel/blok, tanpa blur shadow, font pixel hanya untuk judul/skor (teks soal tetap mudah dibaca)',
    'hand-drawn':     'buatan tangan: garis sedikit tidak sempurna, border seperti sketsa tipis, tanpa shadow digital, tekstur kertas/krayon, ilustrasi seperti coretan tangan',
    'futuristic':     'futuristik: panel semi-transparan atau gelap, border 1px dengan glow tipis, radius kecil-sedang, tipografi tegas/geometris, aksen neon secukupnya (jangan semua elemen menyala)'
  };
  const MOOD_TOKENS = {
    'fun':         'aksen warna berani, mikro-animasi ceria, feedback yang menyenangkan',
    'adventurous': 'nuansa eksplorasi (peta, jalur, petualangan), aksen warna hangat, rasa "menemukan sesuatu"',
    'calm':        'palet lembut/tidak terlalu jenuh, animasi pelan dan halus, tanpa efek glow/pulse berlebihan, ruang napas lega',
    'energetic':   'kontras lebih tinggi, animasi cepat dan responsif, ritme visual dinamis',
    'curious':     'detail kecil yang mengundang dieksplorasi, hint/rasa ingin tahu di setiap layar',
    'friendly':    'sudut membulat, ilustrasi hangat, nada kata ramah dan menyapa',
    'challenging': 'tampilan lebih tegas, indikator level/progres jelas, nuansa "naik tingkat"'
  };


  // ── ALIAS JENIS GAME → KEY gameSpecs ──
  // Nama chip di UI berbeda dari key di Realtime Database; tanpa alias ini
  // 8 jenis game jatuh ke DEFAULT_SPEC (layout generik).
  const GAME_SPEC_ALIAS = {
    'card flip memory':         'memori kartu mencari pasangan',
    'adventure quest rpg':      'petualangan RPG bertahap',
    'spin wheel challenge':     'roda putar tantangan',
    'jigsaw puzzle':            'puzzle gambar potongan',
    'racing / speed challenge': 'balapan cepat menjawab',
    'board game':               'papan permainan berjalan',
    'hidden object':            'mencari objek tersembunyi',
    'rhythm & music game':      'ritme dan musik'
  };
  // Spec bisa punya `variants` (beberapa layout KONKRET). Kode memilih satu secara acak
  // (deterministik per seed + jenis game) — AI tetap menerima instruksi konkret, bukan
  // "bebas", tapi tiap generate bisa mendapat layout berbeda.
  function getSpec(name, seed) {
    const raw = (name || '').trim();
    const low = raw.toLowerCase();
    const spec = GAME_SPECS[raw] || GAME_SPECS[low] || GAME_SPECS[GAME_SPEC_ALIAS[low]] || DEFAULT_SPEC;
    let vars = spec && spec.variants;
    if (vars && !Array.isArray(vars)) vars = Object.values(vars);
    if (vars && vars.length && typeof seed === 'number') {
      let h = 0;
      for (let k = 0; k < low.length; k++) h = (h * 31 + low.charCodeAt(k)) % 9973;
      return { layout: vars[(seed + h) % vars.length], flow: spec.flow };
    }
    return spec;
  }

  // ── KOLAM ARSITIPE & KOMPOSISI (dipilih acak per generate, dibatasi oleh gaya) ──
  // Tujuannya: pilihan gaya/mood/materi yang SAMA tetap bisa menghasilkan
  // dunia visual berbeda, dan AI tidak selalu jatuh ke arsitipe favoritnya.
  const ARCHETYPE_POOL = {
    'minimal':        ['antarmuka modern minimalis ala aplikasi fokus', 'poster interaktif tipografis', 'dashboard belajar bersih'],
    'clean':          ['dashboard belajar modern', 'jurnal belajar rapi', 'poster interaktif bersih'],
    'playful':        ['dunia arkade ceria', 'peta petualangan berwarna', 'panggung sirkus/taman bermain', 'teman pendamping (character companion)'],
    'cartoon':        ['halaman komik dengan panel', 'dunia kartun layar penuh', 'studio animasi/panggung kartun'],
    'storybook':      ['buku cerita pop-up', 'jurnal petualangan bergambar', 'panggung teater kertas', 'peta harta karun di atas kertas tua'],
    'pixel-inspired': ['arcade retro', 'peta RPG 8-bit', 'terminal misi bergaya konsol lawas'],
    'hand-drawn':     ['buku sketsa/jurnal coretan', 'papan tulis kelas', 'meja kerja dengan benda-benda tempel'],
    'futuristic':     ['kontrol misi luar angkasa', 'laboratorium holografik', 'antarmuka HUD futuristik'],
    '_default':       ['peta petualangan', 'laboratorium eksperimen', 'scene eksplorasi layar penuh', 'jurnal misi', 'dunia arkade', 'ruang kelas bergaya unik']
  };
  const COMPOSITION_POOL = [
    'scene layar penuh — elemen interaktif hidup di dalam ilustrasi (bukan panel terpisah)',
    'komposisi asimetris — fokus utama bergeser ke satu sisi, panel pendukung melayang di sisi lain',
    'split screen — satu sisi konteks/ilustrasi, sisi lain area interaksi',
    'peta atau jalur — progres divisualkan sebagai perjalanan, bukan bar angka',
    'panel berlapis (layered cards) dengan kedalaman nyata',
    'komposisi radial — elemen utama melingkar mengelilingi satu pusat',
    'objek-di-atas-permukaan — item tersebar natural seperti benda di meja/papan, bukan grid kaku'
  ];
  function pickFrom(arr, seed, offset) { return arr[(seed + (offset || 0)) % arr.length]; }
  function pickArchetypes(visualStyle, seed) {
    const first = (visualStyle || '').split(',')[0].trim().toLowerCase();
    const pool = ARCHETYPE_POOL[first] || ARCHETYPE_POOL._default;
    const a = pickFrom(pool, seed, 0);
    const b = pool.length > 1 ? pickFrom(pool, seed, 1) : '';
    return { primary: a, alt: b === a ? '' : b };
  }

  // ── BENTUK PER LAYAR (konkret & wajib; dipilih acak per generate) ──
  // Welcome, menu, area jawaban, dan layar hasil adalah 4 tempat yang dulu selalu
  // berbentuk sama (judul → gambar → teks → tombol; tumpukan kartu; kolom tombol).
  const WELCOME_FORMS = [
    'judul besar miring di sudut atas, maskot SANGAT besar menyembul dari tepi bawah-kanan layar (sebagian terpotong), tagline di balon ucapan kecil, tombol mulai berbentuk benda tematik (bukan persegi panjang) di kiri bawah',
    'scene layar penuh berlapis (minimal 3 lapis: langit/latar, objek tengah, objek depan); maskot kecil di dalam scene, judul menggantung seperti papan/spanduk, tombol mulai menyatu sebagai objek di scene',
    'split diagonal: separuh layar ilustrasi besar, separuh lagi judul + tagline + tombol, dipisah garis diagonal',
    'poster tipografis: judul sangat besar memenuhi lebar layar, maskot menumpuk di atas huruf-hurufnya, tombol mulai mengambang di bawah dengan label besar',
    'jalur melengkung turun dari judul ke tombol mulai, maskot berdiri di atas jalur, dekorasi tematik di kiri-kanan jalur'
  ];
  const MENU_FORMS = [
    'pilihan = lokasi/landmark berbeda bentuk dan ukuran di satu peta/scene (tiap game satu landmark + label), BUKAN kartu seragam',
    'pilihan = pintu/gerbang/jendela dengan bentuk berbeda, berjajar tidak sejajar (tinggi dan sudut berbeda)',
    'pilihan = benda tematik berbeda di atas satu permukaan (rak/meja/papan) dengan posisi dan kemiringan berbeda',
    'pilihan = kartu bertingkat (stagger) dengan ukuran berbeda, satu pilihan utama dibuat lebih besar',
    'pilihan = papan penunjuk arah bercabang dari satu tiang, tiap papan berbeda panjang dan arah',
    'pilihan = tombol besar menempel bergantian di tepi kiri dan kanan layar, maskot di tengah memberi penjelasan'
  ];
  const RESULT_FORMS = [
    'medali/piala/lencana besar sebagai pusat layar, bintang dan skor menempel di pita/dasarnya',
    'scene perayaan penuh dengan maskot beraksi, skor tampil sebagai papan/spanduk di dalam scene',
    'lembar jurnal/halaman buku berisi stempel bintang dan catatan pesan, tombol sebagai stiker/label',
    'papan skor ala arcade dengan angka besar dan bintang menyala satu per satu',
    'peta dengan jejak langkah dari awal sampai akhir, skor muncul di titik tujuan'
  ];
  function pickScreenForms(seed) {
    return {
      welcome: pickFrom(WELCOME_FORMS, seed, 0),
      menu:    pickFrom(MENU_FORMS, Math.floor(seed / 5), 0),
      result:  pickFrom(RESULT_FORMS, Math.floor(seed / 29), 0)
    };
  }

  // Cari token berdasarkan teks bebas (chip atau input custom). Kalau tidak dikenali,
  // kembalikan '' → AI diminta menafsirkan sendiri teks gaya tersebut.
  function lookupTokens(map, raw) {
    if (!raw) return [];
    return raw.split(',').map(s => s.trim()).filter(Boolean).map(name => {
      const key = name.toLowerCase();
      return { name, tokens: map[key] || '' };
    });
  }

  // Blok "KONTEKS VISUAL" — menghubungkan gaya + mood + materi + jenis game + usia
  // jadi satu arahan yang konsisten. Fleksibel (rentang), bukan template kaku.
  function buildStyleContextBlock({ visualStyle, mood, finalSubject, finalGameType, finalAge, color }) {
    const styles = lookupTokens(STYLE_TOKENS, visualStyle);
    const moods  = lookupTokens(MOOD_TOKENS, mood);

    const styleLines = styles.length
      ? styles.map(s => s.tokens
          ? `- Gaya "${s.name}": ${s.tokens}`
          : `- Gaya "${s.name}": tafsirkan sendiri secara konsisten dan jujur pada gaya ini (border, radius, shadow, tombol, tipografi, ilustrasi harus terasa seperti gaya "${s.name}")`
        ).join('\n')
      : `- Gaya visual tidak dipilih → pakai arah netral yang bersih: radius sedang, border tipis (1-2px), shadow lembut, tombol flat; lalu sesuaikan karakternya dengan usia (${finalAge}), materi, dan jenis game di bawah. JANGAN default ke tampilan "game anak yang tebal & gemuk".`;

    const moodLines = moods.length
      ? moods.map(m => m.tokens
          ? `- Mood "${m.name}": ${m.tokens}`
          : `- Mood "${m.name}": tafsirkan lewat warna, tempo animasi, dan nada kata`
        ).join('\n')
      : `- Mood tidak dipilih → tentukan sendiri mood yang paling cocok dengan materi dan usia.`;

    return `🎯 KONTEKS VISUAL (PRIORITAS TERTINGGI — gaya & mood pilihan user mengalahkan semua default tampilan lain di prompt ini):
${styleLines}
${moodLines}
- Warna tema: ${color} (boleh diperkaya aksen, tapi karakter warna tetap ikut mood: mood tenang → lebih lembut, mood energik → lebih kontras)

🔗 SELARASKAN 5 HAL INI (fleksibel — kamu bebas berkreasi, tapi jangan melenceng jauh):
- Gaya & mood di atas → menentukan karakter semua komponen UI: tombol, card, input, badge, progress bar, popup. Semua komponen harus terasa satu keluarga.
- Materi "${finalSubject}" → menentukan ilustrasi, ikon, dekorasi, dan istilah di UI (bukan elemen generik).
- Jenis game "${finalGameType}" → menentukan bentuk interaksi elemen utamanya (kartu, roda, papan, jalur, slot, dsb.) — terapkan gaya & mood ke elemen-elemen itu juga, bukan hanya ke tombol.
- Usia ${finalAge} → menentukan ukuran teks, kepadatan elemen, kerumitan, dan nada bahasa. Usia sangat muda: lebih besar, lebih sedikit elemen, lebih banyak visual. Usia lebih tua/dewasa: lebih ringkas, lebih matang.
- Jika ada dua arahan yang tampak bertabrakan (misal usia TK + gaya Minimal): pertahankan gaya & mood pilihan user, lalu sesuaikan ukuran dan kejelasan untuk usia — bukan sebaliknya.

📏 TENTANG UKURAN & KETEBALAN:
- "Besar" berarti area sentuh nyaman (minimal 48x48px) dan teks mudah dibaca — BUKAN border tebal, tombol gemuk, atau shadow keras.
- Tebal border/outline, bentuk tombol, dan shadow ditentukan oleh gaya yang dipilih. Border tebal (>2px), shadow offset keras, tombol 3D, dan outline pada teks hanya dipakai bila gaya yang dipilih memang memintanya (mis. Cartoon).
- Hindari efek berlebihan (glow, pulse, bounce) di semua elemen sekaligus; pakai seperlunya sesuai mood.`;
  }

  // ── BUILD MAIN PROMPT ──
  function buildPrompt() {
    const gameTypes = getVal('gameTypeChips','cGameType','cGameTypeInput').split(',').map(s=>s.trim()).filter(Boolean);
    const subjects  = getValMulti(['subjectChips','subjectChipsMath','subjectChipsLang','subjectChipsScience','subjectChipsWorld','subjectChipsLife'],'cSubject','cSubjectInput').split(',').map(s=>s.trim()).filter(Boolean);
    const ages      = getVal('ageChips','cAge','cAgeInput').split(',').map(s=>s.trim()).filter(Boolean);
    const difficulty  = getVal('diffChips','cDiff','cDiffInput') || 'mudah dan menyenangkan';
    const features    = getVal('featureChips','cFeature','cFeatureInput');
    const brand       = (document.getElementById('brandName').value.trim() || 'kniaWorld');
    const color       = (getVal('colorChips','cColor','cColorInput') || 'hijau toska dan putih');
    const designNotes = document.getElementById('designNotes').value.trim();
    const extra       = document.getElementById('extraInstructions').value.trim();
    const visualStyle = getVal('visualStyleChips','cVisualStyle','cVisualStyleInput');
    const mood        = getVal('moodChips','cMood','cMoodInput');
    const learningTopicEl = document.getElementById('learningTopic');
    const learningGoalEl  = document.getElementById('learningGoal');
    const learningTopic = learningTopicEl ? learningTopicEl.value.trim() : '';
    const learningGoal  = learningGoalEl ? learningGoalEl.value.trim() : '';

    const finalGameType = gameTypes.length ? gameTypes.join(', ') : 'kuis pilihan ganda';
    const finalSubject  = subjects.length ? subjects.join(', ') : 'materi edukasi umum';
    const finalAge      = ages.length ? ages.join(' dan ') : '5-8 tahun';
    const featureText   = features ? `\n- Fitur tambahan: ${features}` : '';
    const designExtra   = designNotes ? `\n- Catatan desain: ${designNotes}` : '';
    const extraSection  = extra ? `\n\n📝 INSTRUKSI KHUSUS TAMBAHAN:\n${extra}` : '';
    const topicLine     = learningTopic ? `\n- Topik spesifik: ${learningTopic}` : '';
    const visualStyleLine = visualStyle ? `, gaya visual "${visualStyle}"` : '';
    const moodLine         = mood ? `, mood/nuansa: ${mood}` : '';
    const styleContextBlock = buildStyleContextBlock({ visualStyle, mood, finalSubject, finalGameType, finalAge, color });

    // 🎨 ARAH VISUAL — dibikin kayak "art direction brief" (arah + batasan), bukan
    // checklist prosedural. AI tetap bebas nentuin detail ilustrasi/maskot/gaya
    // selama nyambung sama tema dan hindarin tampilan generik ala-AI.
    const _seed = Math.floor(Math.random()*1000000);
    const _arch = pickArchetypes(visualStyle, _seed);
    const _comp = pickFrom(COMPOSITION_POOL, Math.floor(_seed / 11), 0);
    const visualDirectionBlock = `🎨 VISUAL DNA & DIREKSI PENGALAMAN (jenis game menentukan CARA MAIN-nya; Visual DNA menentukan RASA & TAMPILANNYA — jangan perlakukan jenis game sebagai template visual tetap):
Sebelum menulis kode, rumuskan singkat Visual DNA untuk game ini dari kombinasi: jenis game + materi "${finalSubject}" + usia ${finalAge} + gaya${visualStyle ? ` "${visualStyle}"` : ''} + mood${mood ? ` "${mood}"` : ''} + warna ${color}. Tentukan: konsep visual, hierarki warna, kepribadian tipografi (sebut nama font Google Fonts yang dipakai), bahasa bentuk, teknik ilustrasi (SVG/CSS), karakter/maskot, lingkungan/background, tekstur, kedalaman, dan kepribadian animasi. Tulis ringkasannya 5-6 baris sebagai komentar HTML di awal kode, lalu pakai konsisten di SEMUA layar. Simpan semua keputusan visual sebagai CSS variables terpusat agar mudah diubah.

🧭 ARAH WAJIB (pakai arsitipe dan komposisi ini; hanya boleh diganti bila benar-benar tidak cocok dengan materi — jika diganti, tulis alasannya satu baris di komentar Visual DNA):
- Arsitipe UI: ${_arch.primary}${_arch.alt ? ` (alternatif: ${_arch.alt})` : ''}
- Komposisi layar: ${_comp}
- Dunia visual harus lahir dari MATERI "${finalSubject}" (mis. matematika → objek geometris/manipulatif; hewan → habitat; sains → laboratorium/observasi; bahasa → buku/dialog) — bukan sekadar mengganti teks di template yang sama.

🔁 VARIATION CHECK (wajib sebelum finalisasi): "Kalau user mengganti gaya atau tema, apakah tampilan ini masih hampir sama?" Jika ya, rancang ulang komposisi. Yang BOLEH berubah total: background, komposisi, bentuk kartu/tombol, tipografi, gaya ilustrasi, metafora interaksi, visual progres, visual reward. Yang TETAP: mekanik game dan alur di bawah.

🚫 HINDARI default generik: gradasi ungu-pink, glassmorphism berlebihan, kartu putih membulat seragam, shadow abu-abu rata, blob abstrak tanpa makna, ikon asal tempel, grid tombol 2x2 di tengah layar, atau komposisi terpusat — kecuali memang paling cocok untuk gaya yang dipilih.

✅ UX TETAP AMAN: interaksi harus jelas, area tap nyaman, teks terbaca dan kontras cukup, feedback benar/salah mudah dipahami, dekorasi tidak boleh mengalahkan tugas belajar. Maskot/karakter tetap tampil di halaman welcoming dengan animasi ringan sesuai mood, desainnya khusus untuk game ini dan mengikuti gaya visual.`;

    const _forms = pickScreenForms(_seed);
    const screenFormsBlock = `🧩 BENTUK TIAP LAYAR (WAJIB — tiap layar harus punya komposisi BERBEDA satu sama lain, bukan susunan vertikal "judul → gambar → teks → tombol" yang diulang):
- Layar welcome: ${_forms.welcome}
- Layar menu/pilihan: ${_forms.menu}
- Layar hasil: ${_forms.result}
Untuk gaya Minimal/Clean: pakai versi paling sederhana dari bentuk di atas (tanpa ornamen), tapi tetap bedakan posisi dan ukuran elemen.
🚫 DILARANG: (1) menu berupa tumpukan kartu seragam, (2) semua layar memakai tata letak yang sama, (3) hanya mengganti warna dan emoji pada template yang sama. (Layout area game mengikuti spesifikasi per jenis game di bawah.)`;

    const finalCheckBlock = `\n\n🔎 CEK AKHIR (periksa kodemu sebelum mengirim; kalau ada jawaban "tidak", perbaiki dulu):
[ ] Layar welcome, menu, game, dan hasil punya komposisi yang berbeda satu sama lain (bukan susunan vertikal yang sama)?
[ ] Layout area game sama persis dengan LAYOUT di spesifikasi jenis game (bukan susunan lain yang lebih generik)?
[ ] Ada ilustrasi/scene yang detail (minimal 3 lapis) dan elemen khas materi, bukan sekadar emoji?
[ ] Bentuk tiap layar mengikuti "BENTUK TIAP LAYAR" dan arsitipe di atas?
[ ] Huruf/teks penting (termasuk huruf Arab) selalu terbaca tegak, tidak terbalik atau miring?
Kode yang terlalu pendek/sederhana berarti belum selesai — kerjakan sampai visualnya benar-benar terasa dibuat khusus untuk game ini.`;

    // 🎯 Tujuan Pembelajaran — kalau diisi user, ini jadi acuan WAJIB dan menggantikan
    // instruksi generik "tentukan sendiri manfaat/goal transformasi"; kalau kosong,
    // AI tetap diminta merumuskan sendiri (perilaku lama tetap jalan).
    const learningGoalBlock = learningGoal
      ? `🎯 TUJUAN PEMBELAJARAN (WAJIB DICAPAI):\n- Capaian belajar yang ditargetkan: "${learningGoal}"${topicLine}\n- Seluruh soal/konten, urutan kesulitan, dan mekanik game HARUS dirancang secara sengaja untuk mengantarkan pemain mencapai capaian ini — bukan sekadar materi umum yang mirip-mirip.\n- Selipkan tujuan ini secara natural (bukan verbatim/kaku) di tagline halaman welcoming dan pesan penyemangat di halaman skor akhir, supaya orang tua/guru juga paham manfaatnya.`
      : `🎯 MANFAAT & TRANSFORMASI:\n- Sebelum menyusun soal/konten, tentukan manfaat konkret mempelajari "${finalSubject}"${topicLine ? ` (${learningTopic})` : ''} bagi pemain, serta goal transformasi yang ingin dicapai setelah menyelesaikan game ini (misal dari belum paham → paham, dari ragu → percaya diri, dari lambat → cepat — sesuaikan dengan materinya sendiri, jangan generik).\n- Selipkan pesan manfaat/transformasi ini secara natural di tagline halaman welcoming dan di pesan penyemangat pada halaman skor akhir.`;

    const multiGame    = gameTypes.length > 1;
    const multiSubject = subjects.length > 1;
    const multiAge     = ages.length > 1;
    const needsMenu    = multiGame || multiSubject;

    const ageToneNote = `\n⚠️ SESUAIKAN NADA & GAYA DENGAN TARGET USIA (${finalAge}):\n- Jika target usia menunjukkan dewasa/remaja akhir/profesional (mis. "Dewasa", "18+", "17+", atau angka ≥ 17): gunakan nada bahasa matang, praktis, tidak kekanak-kanakan — HINDARI sebutan "anak", analogi mainan anak, sapaan "adik-adik", warna pastel/karakter maskot ala anak TK. Sebut pengguna sebagai "kamu"/"pemain"/"peserta".\n- Jika target usia menunjukkan anak-anak (di bawah 12 tahun, "TK", "PAUD", "SD"): gunakan nada ramah-anak dan sederhana; tingkat "playful"-nya mengikuti gaya & mood yang dipilih (jangan dipaksa ramai kalau gayanya Minimal/Calm).\n- Jika target usia menunjukkan remaja (13-16 tahun, SMP/SMA): nada lebih santai tapi tetap tidak kekanak-kanakan.`;

    const varietyNote = `\n🎲 VARIASI KONTEN (WAJIB):\n- Hindari redaksi soal/konten yang generik dan template-y (pola kalimat yang sama persis di setiap nomor).\n- Variasikan gaya kalimat, konteks/skenario, dan urutan opsi jawaban antar soal — bahkan untuk materi yang sama dengan generate sebelumnya, buat pendekatan/contoh yang berbeda.\n- ID sesi acak (hanya untuk mendorong variasi internal, jangan ditampilkan ke user): ${Math.floor(Math.random()*1000000)}`;

    const adaptiveAgeNote = multiAge ? `\n⚠️ KONTEN ADAPTIF USIA:
Game ini dimainkan oleh pemain usia ${finalAge}. Buat konten yang berbeda per rentang usia:
- Usia lebih muda: lebih sederhana, lebih banyak visual, instruksi singkat
- Usia lebih tua: lebih kompleks, variasi soal lebih banyak
- Tampilkan pilihan usia di halaman intro sebelum game dimulai (tombol pilih usia, bukan menu terpisah)` : '';

    const primaryGameKey = gameTypes[0] || 'kuis pilihan ganda';
    const spec = getSpec(primaryGameKey, _seed);

    if (!needsMenu) {
      return `Kamu adalah game developer dan educational content creator yang berpengalaman membuat game edukasi interaktif. Kamu memahami prinsip desain UI yang disesuaikan target usia, learning psychology, dan cara membuat kode yang bersih serta maintainable. Setiap game yang kamu buat harus terasa seperti produk final yang polished — bukan demo atau prototipe.


${styleContextBlock}

${visualDirectionBlock}

${screenFormsBlock}

Buatkan game edukasi interaktif sesuai target usia yang ditentukan di bawah.

📋 SPESIFIKASI GAME:
- Jenis game: ${finalGameType}
- Materi/tema: ${finalSubject}
- Target usia: ${finalAge}
- Tingkat kesulitan: ${difficulty}${featureText}
- Brand: "${brand}", warna tema: ${color}${designExtra}
${adaptiveAgeNote}${ageToneNote}${varietyNote}

${learningGoalBlock}
- Rancang pengalaman mekanik game (interaksi, animasi, feedback) supaya terasa nyata dan sesuai konteks materi/jenis game "${finalGameType}" — bukan generik asal jadi. Contoh: kalau temanya berkaitan dengan aktivitas dunia nyata, buat interaksinya semirip mungkin dengan aktivitas aslinya.

📐 KETENTUAN TEKNIS:
- Responsive & mobile-first (mobile-first bukan berarti satu kolom vertikal — komposisi tetap mengikuti BENTUK TIAP LAYAR)
- Huruf/teks penting (termasuk huruf Arab dan label di roda/papan) harus selalu terbaca tegak — jangan diputar terbalik atau miring mengikuti posisi elemennya
- Semua soal/konten harus relevan dengan materi "${finalSubject}" (bukan soal generik)
- Teks mudah dibaca sesuai target usia — minimal 18px untuk teks soal (ketebalan font mengikuti gaya visual, tidak harus bold)
- Semua tombol & area tap: area sentuh minimal 48x48px, nyaman disentuh (ini soal ukuran area tap, bukan ketebalan border/tampilan tombol — tampilan tombol ikut gaya visual)
- Semua elemen visual (termasuk ilustrasi maskot) HARUS tergenerate dalam satu kali proses/respons — jangan minta generate atau upload aset terpisah setelahnya

🏠 HALAMAN WELCOMING (WAJIB — LAYAR PERTAMA SEBELUM GAME):
- Komposisi layar (WAJIB): ${_forms.welcome}
- Background: warna tema + ornamen/pola dekoratif yang sesuai gaya & mood (mis. gelombang, bintang, bentuk geometris kecil, atau tekstur) — kerapatan ornamen mengikuti mood
- Maskot/karakter: ilustrasi sesuai ketentuan visual di atas, tampil jelas sebagai fokus, diberi animasi ringan yang sesuai mood
- Nama brand "${brand}" tampil jelas sebagai fokus visual; gaya font, ketebalan, dan efek (outline/shadow hanya bila sesuai gaya terpilih) mengikuti gaya visual
- Tagline pendek yang mengundang, sesuaikan dengan materi
- Tombol CTA yang jelas dan menarik untuk mulai bermain, bentuknya mengikuti gaya visual; animasi (pulse/glow/lainnya) dipilih sesuai mood dan secukupnya
- Transisi smooth dari halaman welcoming ke halaman game (fade atau slide)

🎮 LAYOUT & MEKANISME GAME (WAJIB IKUTI — gaya visual, warna, dan ilustrasinya mengikuti Visual DNA):
${spec.layout}

⚙️ ALUR GAME:
0. Halaman Welcoming → klik "Mulai Main!" → masuk game
${spec.flow}

🎨 DESAIN:
- Warna tema: ${color}${visualStyleLine}${moodLine} — konsisten di semua halaman
- Gaya visual: ikuti KONTEKS VISUAL di atas. Jika user tidak memilih gaya, sesuaikan dengan target usia (lebih ramah & berwarna untuk anak, lebih clean/matang untuk usia dewasa) tanpa jatuh ke tampilan tebal/gemuk
- Animasi: transisi halaman smooth, feedback animasi saat benar/salah — tempo & intensitas mengikuti mood

🌐 BAHASA: Indonesia untuk instruksi, konten soal sesuai materi

🏆 SISTEM SKOR:
- Skor real-time di pojok kanan atas
- Skor akhir: nilai, bintang (1–3), pesan penyemangat, tombol "Main Lagi"${finalCheckBlock}${extraSection}
`;
    }

    let menuInstructions = '';
    if (multiGame && !multiSubject) {
      menuInstructions = `\n🗂️ MENU PILIH JENIS GAME (WAJIB ADA):\n${gameTypes.map((gt,i)=>`  ${i+1}. "${gt}"`).join('\n')}\n- Bentuk menu: ${_forms.menu}\n- Setiap pilihan: ikon/ilustrasi relevan (Font Awesome atau SVG buatan sendiri) + nama game + deskripsi singkat + penanda "Pilih" yang jelas\n- Materi semua game: ${finalSubject}\n- Tombol "← Ganti Jenis Game" di dalam game\n\nSPESIFIKASI PER JENIS GAME (WAJIB IKUTI layout dan alur; gaya visual mengikuti Visual DNA):\n${gameTypes.map(gt=>{const s=getSpec(gt, _seed);return `\n▶ "${gt}":\n  Layout: ${s.layout}\n  Alur: ${s.flow}`;}).join('\n')}`;
    } else if (!multiGame && multiSubject) {
      menuInstructions = `\n🗂️ MENU PILIH MATERI (WAJIB ADA):\n${subjects.map((s,i)=>`  ${i+1}. "${s}"`).join('\n')}\n- Bentuk menu: ${_forms.menu}\n- Setiap pilihan: ikon/ilustrasi relevan (Font Awesome atau SVG buatan sendiri) + nama materi + contoh soal singkat + penanda "Pilih" yang jelas\n- Setiap materi punya set soal SENDIRI yang berbeda\n- Tombol "← Pilih Materi Lain" di dalam game`;
    } else {
      menuInstructions = `\n🗂️ MENU BERTINGKAT (2 LANGKAH):\nLangkah 1 — Pilih Jenis Game:\n${gameTypes.map((gt,i)=>`  ${i+1}. "${gt}"`).join('\n')}\nLangkah 2 — Pilih Materi:\n${subjects.map((s,i)=>`  ${i+1}. "${s}"`).join('\n')}\n- Setiap langkah = halaman tersendiri (bukan dropdown), bentuk pilihan: ${_forms.menu}\n- Konten soal disesuaikan kombinasi unik\n\nSPESIFIKASI PER JENIS GAME (WAJIB IKUTI layout dan alur; gaya visual mengikuti Visual DNA):\n${gameTypes.map(gt=>{const s=getSpec(gt, _seed);return `\n▶ "${gt}":\n  Layout: ${s.layout}\n  Alur: ${s.flow}`;}).join('\n')}`;
    }

    return `Kamu adalah game developer dan educational content creator yang berpengalaman membuat game edukasi interaktif. Kamu memahami prinsip desain UI yang disesuaikan target usia, learning psychology, dan cara membuat kode yang bersih serta maintainable. Setiap game yang kamu buat harus terasa seperti produk final yang polished — bukan demo atau prototipe.


${styleContextBlock}

${visualDirectionBlock}

${screenFormsBlock}

Buatkan game edukasi interaktif sesuai target usia yang ditentukan di bawah.

📋 SPESIFIKASI GAME:
- Jenis game tersedia: ${finalGameType}
- Materi/tema tersedia: ${finalSubject}
- Target usia: ${finalAge}
- Tingkat kesulitan: ${difficulty}${featureText}
- Brand: "${brand}", warna tema: ${color}${designExtra}
${adaptiveAgeNote}${ageToneNote}${varietyNote}

${learningGoalBlock}
- Rancang pengalaman mekanik game (interaksi, animasi, feedback) supaya terasa nyata dan sesuai konteks materi/jenis game "${finalGameType}" — bukan generik asal jadi. Contoh: kalau temanya berkaitan dengan aktivitas dunia nyata, buat interaksinya semirip mungkin dengan aktivitas aslinya.

📐 KETENTUAN TEKNIS:
- Responsive & mobile-first (mobile-first bukan berarti satu kolom vertikal — komposisi tetap mengikuti BENTUK TIAP LAYAR)
- Huruf/teks penting (termasuk huruf Arab dan label di roda/papan) harus selalu terbaca tegak — jangan diputar terbalik atau miring mengikuti posisi elemennya
- Teks minimal 18px, area sentuh tombol minimal 48x48px (tampilan tombol ikut gaya visual yang dipilih)
- Semua elemen visual (termasuk ilustrasi maskot) HARUS tergenerate dalam satu kali proses/respons — jangan minta generate atau upload aset terpisah setelahnya
${menuInstructions}

🏠 HALAMAN WELCOMING (LAYAR PERTAMA):
- Komposisi layar (WAJIB): ${_forms.welcome}
- Maskot ilustrasi sesuai ketentuan visual di atas, tampil jelas dengan animasi ringan sesuai mood, brand "${brand}" tampil jelas (gaya font mengikuti gaya visual), tagline mengundang
- Tombol CTA untuk mulai bermain dengan pulse animation, transisi smooth ke menu

🎨 DESAIN: ${color}${visualStyleLine}${moodLine} — konsisten di semua halaman dan semua mode/menu, ikuti KONTEKS VISUAL di atas
🌐 BAHASA: Indonesia untuk instruksi, konten soal sesuai materi
🏆 SKOR AKHIR: nilai, bintang, pesan, tombol "Main Lagi" + "← Pilih Lagi"${finalCheckBlock}${extraSection}
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

    if (tplId === 18) {
      const topik   = fv(`t18_topik`, 'objek edukatif sesuai tema');
      const keping  = fv(`t18_keping`, '6');
      const brand   = fv(`t18_brand`, 'kniaWorld');
      const usia    = usiaVal('t18_usia','t18_usia_custom', '6-8 tahun');
      const warna   = fv(`t18_warna`, 'cerah dan playful, sesuai tema materi');
      const tambahan = fv(`t18_tambahan`, '');
    return finalizePrompt(renderTpl('t18', {topik, keping, brand, usia, warna, tambahan}));
    } // end tplId===18

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

  // Lovable "Build with URL" — prefill prompt lewat #prompt=, TIDAK auto-submit
  // (user tetap harus klik kirim di sana). Batas 50.000 karakter per dokumentasi Lovable.
  function openInLovable() {
    const text = document.getElementById('outputText').textContent;
    if (!text.trim()) return;
    copyToClipboard(text);
    window.open('https://lovable.dev/#prompt=' + encodeURIComponent(text), '_blank');
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

  function openInLovableTemplate(tplId) {
    const text = document.getElementById(`t${tplId}_text`).textContent;
    if (!text.trim()) { alert('Generate prompt dulu ya!'); return; }
    copyToClipboard(text);
    window.open('https://lovable.dev/#prompt=' + encodeURIComponent(text), '_blank');
  }

