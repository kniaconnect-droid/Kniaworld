// ══════════════════════════════════════
// firebase-core.js — hasil pecahan dari index.html (KniaWorld Prompt Generator)
// ══════════════════════════════════════

  // ══════════════════════════════════════
  //  FIREBASE CONFIG
  //  Nilai-nilai ini BUKAN rahasia (aman terlihat publik di browser),
  //  keamanan sebenarnya ada di Realtime Database Rules + status
  //  login anonim + isi verifiedUsers, bukan di sini.
  // ══════════════════════════════════════
  const FIREBASE_DB_URL = 'https://kniagame-c6567-default-rtdb.asia-southeast1.firebasedatabase.app';
  const firebaseConfig = {
    apiKey:            "AIzaSyBov8zR5lIyp_X-hmVNbvxjnPOGLCLCQuY",
    authDomain:        "kniagame-c6567.firebaseapp.com",
    databaseURL:       "https://kniagame-c6567-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId:         "kniagame-c6567",
    storageBucket:     "kniagame-c6567.firebasestorage.app",
    messagingSenderId: "136892911397",
    appId:             "1:136892911397:web:81d9e845517ec05d0e14cc"
  };
  firebase.initializeApp(firebaseConfig);
  const fbAuth = firebase.auth();

  // Diisi otomatis setelah sign-in anonim berhasil
  let _idToken = null;
  let _uid = null;
  let _authReadyResolve;
  const _authReady = new Promise(res => { _authReadyResolve = res; });

  fbAuth.onAuthStateChanged(async (user) => {
    if (user) {
      _uid = user.uid;
      _idToken = await user.getIdToken();
    } else {
      _uid = null;
      _idToken = null;
    }
    _authReadyResolve();
  });

  // Kalau belum ada sesi sama sekali, mulai sign-in anonim.
  // (Kalau browser masih menyimpan sesi anonim sebelumnya, Firebase akan
  // otomatis restore sesi yang SAMA — makanya UID & verifiedUsers persist
  // per-perangkat, mirip cara localStorage bekerja sebelumnya.)
  fbAuth.signInAnonymously().catch(err => console.error('Anon sign-in gagal:', err));

  function _authQuery() {
    return _idToken ? `?auth=${_idToken}` : '';
  }

  async function fbGet(path) {
    try {
      const r = await fetch(`${FIREBASE_DB_URL}/${path}.json${_authQuery()}`);
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  }

  async function fbSet(path, data) {
    try {
      const r = await fetch(`${FIREBASE_DB_URL}/${path}.json${_authQuery()}`, {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(data)
      });
      return r.ok;
    } catch { return false; }
  }

  async function fbDelete(path) {
    try {
      const r = await fetch(`${FIREBASE_DB_URL}/${path}.json${_authQuery()}`, { method: 'DELETE' });
      return r.ok;
    } catch { return false; }
  }

  // ══════════════════════════════════════
  //  KONTEN PROMPT — dimuat dari Realtime Database
  //  HANYA setelah kode akses terverifikasi oleh Database Rules.
  //  Sebelum itu, TPL_CACHE / GAME_SPECS kosong — tidak ada isi
  //  prompt yang ikut terkirim ke browser.
  // ══════════════════════════════════════
  let TPL_CACHE = {};
  let GAME_SPECS = {};
  let DEFAULT_SPEC = { layout: '', flow: '' };
  let _contentLoaded = false;

  async function loadProtectedContent() {
    if (_contentLoaded) return true;
    const [specs, tpls, cfg] = await Promise.all([
      fbGet('gameSpecs'),
      fbGet('proTemplates'),
      fbGet('appConfig/defaultSpec')
    ]);
    if (!specs || !tpls) return false; // rules menolak → belum verified
    GAME_SPECS = specs;
    TPL_CACHE = tpls;
    if (cfg) DEFAULT_SPEC = cfg;
    _contentLoaded = true;
    return true;
  }

  // Menjalankan "cetakan" prompt yang tersimpan di Realtime Database.
  // Cetakan ini adalah kode JS tepercaya (hanya admin yang bisa menulis
  // ke /proTemplates lewat Database Rules) — bukan input dari user,
  // jadi aman dievaluasi secara terbatas seperti ini.
  function renderTpl(key, vars) {
    const entry = TPL_CACHE[key];
    if (!entry || !entry.code) return 'Konten template belum termuat. Coba buka ulang halaman ini.';
    const names = Object.keys(vars);
    const vals = names.map(k => vars[k]);
    try {
      return new Function(...names, entry.code)(...vals);
    } catch (e) {
      console.error('Render error for', key, e);
      return 'Terjadi kesalahan saat menyusun prompt. Coba lagi ya.';
    }
  }

  // ══════════════════════════════════════
  //  CODE VALIDATION (checksum stays for offline fallback)
  // ══════════════════════════════════════
  function calcChecksum(part) {
    let val = 0;
    for (let i = 0; i < part.length; i++) {
      val = (val ^ (part.charCodeAt(i) * 31 + i * 7)) & 0xFFFF;
    }
    val = (val ^ 0xB4AD) & 0xFFFF;
    return val.toString(16).toUpperCase().padStart(4, '0');
  }

  function buildCode(xxxx) {
    const part = xxxx.toUpperCase();
    return `KNIA-${part}-${calcChecksum(part)}`;
  }

  function localValidCode(code) {
    const clean = code.toUpperCase().replace(/\s/g, '');
    const parts = clean.split('-');
    if (parts.length !== 3) return false;
    if (parts[0] !== 'KNIA') return false;
    if (parts[1].length !== 4 || parts[2].length !== 4) return false;
    return calcChecksum(parts[1]) === parts[2];
  }
