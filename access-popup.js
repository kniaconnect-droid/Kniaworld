// ══════════════════════════════════════
// access-popup.js — hasil pecahan dari index.html (KniaWorld Prompt Generator)
// ══════════════════════════════════════

  // ══════════════════════════════════════
  //  ACCESS CODE POPUP
  // ══════════════════════════════════════
  function popupFormatCode(el) {
    let val = el.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    const raw = val.replace(/-/g, '');
    if (raw.length <= 4) val = raw;
    else if (raw.length <= 8) val = raw.slice(0,4) + '-' + raw.slice(4);
    else val = raw.slice(0,4) + '-' + raw.slice(4,8) + '-' + raw.slice(8,12);
    el.value = val;
    document.getElementById('popupError').classList.remove('show');
  }

  async function popupVerify() {
    const code = document.getElementById('popupCodeInput').value.trim().toUpperCase();
    const errEl  = document.getElementById('popupError');
    const okEl   = document.getElementById('popupSuccess');
    const chkEl  = document.getElementById('popupChecking');
    const btn    = document.getElementById('popupUnlockBtn');
    const inp    = document.getElementById('popupCodeInput');

    errEl.classList.remove('show');
    okEl.classList.remove('show');

    // Basic local structure check first (cepat, hemat network — BUKAN
    // lapisan keamanan; keamanan sesungguhnya ada di Database Rules)
    if (!localValidCode(code)) {
      errEl.classList.add('show');
      inp.classList.add('error');
      setTimeout(() => inp.classList.remove('error'), 600);
      return;
    }

    chkEl.classList.add('show');
    btn.disabled = true;

    await _authReady; // pastikan sudah login anonim & punya _uid
    if (!_uid) {
      chkEl.classList.remove('show');
      btn.disabled = false;
      errEl.classList.add('show');
      return;
    }

    const codeId = code.split('-')[1];
    // Tulis ke verifiedUsers/{uid} — Database Rules akan MENOLAK request
    // ini kalau kode salah/nonaktif (dicek server-side lewat codes/{codeId}),
    // bukan divalidasi di JS ini.
    const ok = await fbSet(`verifiedUsers/${_uid}`, {
      codeId,
      code,
      verifiedAt: { '.sv': 'timestamp' }
    });

    let contentOk = false;
    if (ok) contentOk = await loadProtectedContent();

    chkEl.classList.remove('show');
    btn.disabled = false;

    if (ok && contentOk) {
      okEl.classList.add('show');
      setTimeout(() => { closePopup(); }, 1500);
    } else {
      errEl.classList.add('show');
      inp.classList.add('error');
      setTimeout(() => inp.classList.remove('error'), 600);
    }
  }

  function closePopup() {
    const overlay = document.getElementById('accessPopup');
    overlay.classList.add('hide');
    setTimeout(() => { overlay.style.display = 'none'; }, 280);
  }

  // ══════════════════════════════════════
  //  BONUS: AI ASISTEN PROMOSI POPUP
  // ══════════════════════════════════════
  function openBonusPopup() {
    const overlay = document.getElementById('bonusPopup');
    overlay.classList.remove('hide');
    overlay.style.display = 'flex';
  }

  function closeBonusPopup() {
    const overlay = document.getElementById('bonusPopup');
    overlay.classList.add('hide');
    setTimeout(() => { overlay.style.display = 'none'; }, 280);
  }

  // ══════════════════════════════════════
  //  ACCESS VIA EMAIL PEMBELI + 4 DIGIT WA
  //  (diisi otomatis oleh webhook Lynk.id setelah transaksi sukses —
  //  lihat /api/lynk-webhook.js dan /api/verify-buyer.js)
  // ══════════════════════════════════════
  function popupSwitchTab(tab) {
    document.getElementById('tabBtnEmail').classList.toggle('active', tab === 'email');
    document.getElementById('tabBtnCode').classList.toggle('active', tab === 'code');
    document.getElementById('panelEmail').classList.toggle('active', tab === 'email');
    document.getElementById('panelCode').classList.toggle('active', tab === 'code');
  }

  async function popupVerifyEmail() {
    const email = document.getElementById('popupEmailInput').value.trim().toLowerCase();
    const last4 = document.getElementById('popupLast4Input').value.trim();
    const errEl    = document.getElementById('popupEmailError');
    const errMsgEl = document.getElementById('popupEmailErrorMsg');
    const okEl     = document.getElementById('popupEmailSuccess');
    const chkEl    = document.getElementById('popupEmailChecking');
    const btn      = document.getElementById('popupEmailUnlockBtn');

    errEl.classList.remove('show');
    okEl.classList.remove('show');

    if (!email || !email.includes('@')) {
      errMsgEl.textContent = 'Masukkan email yang valid.';
      errEl.classList.add('show');
      return;
    }
    if (!/^\d{4}$/.test(last4)) {
      errMsgEl.textContent = 'Isi 4 digit terakhir nomor WA kamu.';
      errEl.classList.add('show');
      return;
    }

    chkEl.classList.add('show');
    btn.disabled = true;

    await _authReady; // pastikan sudah login anonim & punya _uid
    if (!_uid) {
      chkEl.classList.remove('show');
      btn.disabled = false;
      errMsgEl.textContent = 'Gagal memuat sesi, coba refresh halaman.';
      errEl.classList.add('show');
      return;
    }

    try {
      const r = await fetch('/api/verify-buyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, last4, uid: _uid })
      });
      const data = await r.json();

      let contentOk = false;
      if (data.ok) contentOk = await loadProtectedContent();

      chkEl.classList.remove('show');
      btn.disabled = false;

      if (data.ok && contentOk) {
        okEl.classList.add('show');
        setTimeout(() => { closePopup(); }, 1500);
      } else {
        errMsgEl.textContent = data.message || 'Email atau nomor WA tidak cocok.';
        errEl.classList.add('show');
      }
    } catch (e) {
      chkEl.classList.remove('show');
      btn.disabled = false;
      errMsgEl.textContent = 'Gagal menghubungi server, coba lagi.';
      errEl.classList.add('show');
    }
  }

  async function checkAccess() {
    await _authReady; // tunggu sign-in anonim (sesi persist per-perangkat)
    if (_uid) {
      const loaded = await loadProtectedContent();
      if (loaded) return; // sudah verified sebelumnya di perangkat ini
    }
    // Belum verified → tampilkan popup kode akses
    const overlay = document.getElementById('accessPopup');
    overlay.style.display = 'flex';
    setTimeout(() => document.getElementById('popupCodeInput').focus(), 350);
  }

  // ── DEPLOY GUIDE ACCORDION ──
  function toggleDeployGuide() {
    const guide = document.getElementById('deployGuide');
    const chevron = document.getElementById('deployChevron');
    const btn = document.getElementById('btnDeployToggle');
    const isOpen = guide.style.display !== 'none';
    if (isOpen) {
      guide.style.display = 'none';
      chevron.style.transform = '';
      btn.innerHTML = '<i class="fi fi-rr-angle-small-down" id="deployChevron" style="transition:transform 0.3s;font-size:10px;"></i> Lihat Cara Deploy';
    } else {
      guide.style.display = 'block';
      chevron.style.transform = 'rotate(180deg)';
      btn.innerHTML = '<i class="fi fi-rr-angle-small-up" id="deployChevron" style="transition:transform 0.3s;font-size:10px;"></i> Tutup Panduan Deploy';
      setTimeout(() => guide.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    }
  }

  function switchDeployTab(platform) {
    const platforms = ['netlify', 'vercel', 'cloudflare'];
    const colors = {
      netlify: 'linear-gradient(135deg,#7c3aed,#ec4899)',
      vercel: 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
      cloudflare: 'linear-gradient(135deg,#ea580c,#fb923c)'
    };
    platforms.forEach(p => {
      const tab = document.getElementById('tab-' + p);
      const content = document.getElementById('content-' + p);
      if (p === platform) {
        tab.style.background = colors[p];
        tab.style.color = 'white';
        tab.style.borderColor = 'transparent';
        content.style.display = 'block';
      } else {
        tab.style.background = 'white';
        tab.style.color = '#94a3b8';
        tab.style.borderColor = '#e2e8f0';
        content.style.display = 'none';
      }
    });
  }
