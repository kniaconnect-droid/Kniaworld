// ══════════════════════════════════════
// ui-nav.js — hasil pecahan dari index.html (KniaWorld Prompt Generator)
// ══════════════════════════════════════

  // ── STATE ──
  // All users are PRO — no demo limits
  const isPro = true;

  function updateProUI() {
    const proBadge  = document.getElementById('proBadgeHeader');
    if (proBadge)  proBadge.style.display = 'inline-flex';
  }

  // ── NAVIGATION ──
  function goTo(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const subs = {
      pageGuide:    'Bikin game edukasi anak dalam hitungan detik!',
      pageForm:     'Isi form sesuai kebutuhan game kamu',
      pageResult:   'Prompt siap! Tinggal copy & paste ke Claude / Gemini',
      pageTemplate: '✨ Template Pro Eksklusif — kniaWorld'
    };
    document.getElementById('headerSub').textContent = subs[pageId] || '';
    updateProUI();
  }

  function goToForm() { goTo('pageForm'); }

  function goToTemplatePage() { goTo('pageTemplate'); }

  function switchProTab(tabId) {
    document.querySelectorAll('.pro-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.pro-nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    const map = { tabGen: 'navGen', tabTemplates: 'navTpl', tabSubject: 'navSubj', tabTools: 'navTools' };
    if (map[tabId]) document.getElementById(map[tabId]).classList.add('active');
  }

  // ── CHIPS ──
  const multiSelectIds = ['featureChips', 'subjectChips', 'gameTypeChips', 'ageChips'];
  document.querySelectorAll('.chip-group').forEach(group => {
    const isMulti = multiSelectIds.includes(group.id);
    group.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        if (isMulti) { chip.classList.toggle('active'); }
        else { group.querySelectorAll('.chip').forEach(c => c.classList.remove('active')); chip.classList.add('active'); }
        chip.classList.add('pop');
        chip.addEventListener('animationend', () => chip.classList.remove('pop'), { once: true });
      });
    });
  });

  // Placeholder contoh materi menyesuaikan mekanik game yang dipilih di Game Bundling,
  // supaya user tahu jenis konten yang cocok untuk tiap mekanik.
  const BUNDLE_PLACEHOLDER_BY_MECHANIC = {
    'kuis pilihan ganda': [
      'Matematika — Perkalian 1-10', 'Bahasa Indonesia — Sinonim & Antonim',
      'IPA — Sistem Tata Surya', 'Bahasa Inggris — Kosakata Dasar', 'PPKn — Simbol Negara'
    ],
    'card flip memory game': [
      'Pasangan Angka & Lambang Bilangan', 'Pasangan Ibu Kota & Negara',
      'Pasangan Hewan & Habitatnya', 'Pasangan Kata & Sinonim',
      'Pasangan Rumus & Nama Bangun Datar'
    ],
    'drag and drop puzzle': [
      'Puzzle Angka 1-10', 'Puzzle Huruf Alfabet',
      'Puzzle Bentuk Bangun Datar', 'Puzzle Bendera Negara ASEAN',
      'Puzzle Anggota Tubuh'
    ],
    'speed challenge (jawab cepat)': [
      'Perkalian Cepat 1-10', 'Tebak Ibu Kota Provinsi',
      'Tebak Sinonim Kilat', 'Tebak Kosakata Bahasa Inggris',
      'Tebak Lambang Sila Pancasila'
    ],
    'mencocokkan gambar dengan kata': [
      'Nama Buah & Gambarnya', 'Nama Hewan & Gambarnya',
      'Nama Profesi & Gambarnya', 'Nama Alat Musik & Gambarnya',
      'Nama Kendaraan & Gambarnya'
    ]
  };
  function updateBundleFieldHints() {
    const mechanic = document.getElementById('t12_game').value;
    const examples = BUNDLE_PLACEHOLDER_BY_MECHANIC[mechanic] || BUNDLE_PLACEHOLDER_BY_MECHANIC['kuis pilihan ganda'];
    for (let i = 1; i <= 5; i++) {
      const input = document.getElementById('t12_m' + i);
      if (input) input.placeholder = 'Contoh: ' + examples[i - 1];
    }
  }

  function toggleCustom(id) {
    const el = document.getElementById(id);
    el.classList.toggle('open');
    if (el.classList.contains('open')) {
      const inp = el.querySelector('input, textarea');
      if (inp) setTimeout(() => inp.focus(), 50);
    }
  }

  function getChipVals(groupId) {
    return Array.from(document.querySelectorAll(`#${groupId} .chip.active`)).map(c => c.dataset.val);
  }

  function getVal(chipGroupId, customWrapId, customInputId) {
    const wrap = document.getElementById(customWrapId);
    const inp  = document.getElementById(customInputId);
    if (wrap && wrap.classList.contains('open') && inp && inp.value.trim()) return inp.value.trim();
    const chips = getChipVals(chipGroupId);
    return chips.length ? chips.join(', ') : '';
  }
