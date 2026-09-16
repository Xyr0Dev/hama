/* ====================================================
   SA SOCIETY — MEMBER PANEL  |  script.js  v3
==================================================== */

// ── SUPABASE ──────────────────────────────────────
const { createClient } = supabase;
const db = createClient(
  "https://wleslngeddeshlbgwayn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZXNsbmdlZGRlc2hsYmd3YXluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjA4MjIsImV4cCI6MjEwNTEzNjgyMn0.9p_9WY6ZO73yVhMO4JF0FQVgdkDw2U7pZAKW0Ugy5B4"
);

// ── PARTICLES ──────────────────────────────────────
(function () {
  const cv  = document.getElementById('particleCanvas');
  const ctx = cv.getContext('2d');
  const N   = window.innerWidth < 640 ? 45 : 80;
  const D   = 120;
  let   pts = [];

  function resize() { cv.width = window.innerWidth; cv.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  function rnd(a, b) { return Math.random() * (b - a) + a; }

  for (let i = 0; i < N; i++) pts.push({
    x: rnd(0, cv.width), y: rnd(0, cv.height),
    vx: rnd(-0.25, 0.25), vy: rnd(-0.25, 0.25),
    r: rnd(0.8, 1.8),
  });

  (function tick() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const b = pts[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < D) {
          const t = 1 - d / D;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(255,255,255,${t * 0.3})`;
          ctx.lineWidth   = t * 1.1; ctx.stroke();
        }
      }
    }
    pts.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fill();
      p.x += p.vx; p.y += p.vy;
      if (p.x < -6) p.x = cv.width  + 6; else if (p.x > cv.width  + 6) p.x = -6;
      if (p.y < -6) p.y = cv.height + 6; else if (p.y > cv.height + 6) p.y = -6;
    });
    requestAnimationFrame(tick);
  })();
})();

// ── TOAST ──────────────────────────────────────────
function toast(msg, type = 'ok') {
  const el   = document.createElement('div');
  el.className = `toast toast-${type}`;
  const icon = type === 'ok'
    ? '<i class="fa-solid fa-circle-check"></i>'
    : '<i class="fa-solid fa-circle-exclamation"></i>';
  el.innerHTML = `${icon} ${msg}`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => {
    el.classList.add('toast-out');
    setTimeout(() => el.remove(), 250);
  }, 3200);
}

// ── NAVIGATION ─────────────────────────────────────
const ALL_BTNS = document.querySelectorAll('[data-page]');
const ALL_PGS  = document.querySelectorAll('.page');
const burger   = document.getElementById('burger');
const drawer   = document.getElementById('drawer');
const drawerBg = document.getElementById('drawerBg');

function go(id) {
  ALL_PGS.forEach(p => p.classList.remove('active'));
  ALL_BTNS.forEach(b => b.classList.toggle('active', b.dataset.page === id));
  const pg = document.getElementById(`page-${id}`);
  if (pg) pg.classList.add('active');
  closeDrawer();
  if (id === 'inventory') loadInventory();
}

function openDrawer() {
  drawer.classList.remove('hidden');
  drawerBg.classList.remove('hidden');
  requestAnimationFrame(() => drawer.classList.add('visible'));
}
function closeDrawer() {
  drawer.classList.remove('visible');
  drawerBg.classList.add('hidden');
  setTimeout(() => drawer.classList.add('hidden'), 220);
}

burger.addEventListener('click', () => {
  drawer.classList.contains('visible') ? closeDrawer() : openDrawer();
});
drawerBg.addEventListener('click', closeDrawer);
ALL_BTNS.forEach(b => b.addEventListener('click', () => go(b.dataset.page)));

// ── UTILS ──────────────────────────────────────────
function genHex(n = 9) {
  let s = '';
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 16).toString(16);
  return s;
}
function addDays(n) {
  const d = new Date(); d.setDate(d.getDate() + Number(n)); return d.toISOString();
}
function fmt(iso) {
  if (!iso) return '—';
  const d = new Date(iso), pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function toLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso), pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function sbadge(s) {
  return `<span class="sbadge s-${s}">${s}</span>`;
}
function tierLabel(t) {
  const cap = t.charAt(0).toUpperCase() + t.slice(1);
  return `<span class="t-${t}">${cap}</span>`;
}
function busy(btn, on) {
  if (on) {
    btn._orig = btn.innerHTML;
    btn.innerHTML = '<span class="spin" style="width:14px;height:14px;border-width:2px"></span>';
    btn.disabled = true;
  } else {
    btn.innerHTML = btn._orig || btn.innerHTML;
    btn.disabled = false;
  }
}
async function clip(text, label) {
  try { await navigator.clipboard.writeText(text); toast(`${label} copied`, 'ok'); }
  catch { toast('Copy failed', 'err'); }
}

// ── MODALS ─────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

document.querySelectorAll('[data-close]').forEach(el =>
  el.addEventListener('click', () => closeModal(el.dataset.close))
);
document.querySelectorAll('.overlay').forEach(o =>
  o.addEventListener('click', e => { if (e.target === o) closeModal(o.id); })
);

// ── MODULE LICENSE ─────────────────────────────────
let lastMod = '';

document.getElementById('btn-gen-mod').addEventListener('click', async () => {
  const rawHex = document.getElementById('mod-hex').value.trim();
  const days   = document.getElementById('mod-days').value;
  if (!days || Number(days) < 1) { toast('Enter a valid expiry duration', 'err'); return; }

  const h   = rawHex || genHex(9);
  const key = `SAS-VIP-MOD-${h}`;
  const exp = addDays(days);
  const btn = document.getElementById('btn-gen-mod');
  busy(btn, true);

  const { error } = await db.from('module_licenses').insert([{
    license_key: key, custom_hex: h, expired_at: exp, status: 'active',
  }]);
  busy(btn, false);

  if (error) { toast(error.message, 'err'); return; }
  lastMod = key;
  document.getElementById('result-mod-key').textContent = key;
  document.getElementById('result-mod-exp').textContent = fmt(exp);
  document.getElementById('result-mod').classList.remove('hidden');
  toast('Module license generated', 'ok');
});

document.getElementById('btn-copy-mod').addEventListener('click', () => clip(lastMod, 'License key'));
document.getElementById('btn-again-mod').addEventListener('click', () => {
  document.getElementById('result-mod').classList.add('hidden');
  document.getElementById('mod-hex').value  = '';
  document.getElementById('mod-days').value = '';
  lastMod = '';
});

// ── APP LICENSE ────────────────────────────────────
let lastAL = {};

document.getElementById('btn-gen-al').addEventListener('click', async () => {
  const rawHex = document.getElementById('al-hex').value.trim();
  const user   = document.getElementById('al-user').value.trim();
  const pass   = document.getElementById('al-pass').value.trim();
  const days   = document.getElementById('al-days').value;
  const tier   = document.getElementById('al-tier').value;

  if (!user) { toast('Username is required', 'err'); return; }
  if (!pass) { toast('Password is required', 'err'); return; }
  if (!days || Number(days) < 1) { toast('Enter a valid expiry duration', 'err'); return; }

  const h   = rawHex || genHex(9);
  const key = `SAS-VIP-APP-${h}`;
  const exp = addDays(days);
  const btn = document.getElementById('btn-gen-al');
  busy(btn, true);

  const { error } = await db.from('app_accounts').insert([{
    license_key: key, username: user, password: pass, tier, expired_at: exp, status: 'active',
  }]);
  busy(btn, false);

  if (error) { toast(error.message, 'err'); return; }
  lastAL = { key, user, pass, tier, exp };
  document.getElementById('result-al-key').textContent  = key;
  document.getElementById('result-al-user').textContent = user;
  document.getElementById('result-al-pass').textContent = pass;
  document.getElementById('result-al-tier').textContent = tier.charAt(0).toUpperCase() + tier.slice(1);
  document.getElementById('result-al-exp').textContent  = fmt(exp);
  document.getElementById('result-al').classList.remove('hidden');
  toast('App license generated', 'ok');
});

document.getElementById('btn-copy-al').addEventListener('click', () => {
  const t = [
    `License Key : ${lastAL.key}`,
    `Username    : ${lastAL.user}`,
    `Password    : ${lastAL.pass}`,
    `Tier        : ${lastAL.tier}`,
    `Expires     : ${fmt(lastAL.exp)}`,
  ].join('\n');
  clip(t, 'App license info');
});

document.getElementById('btn-again-al').addEventListener('click', () => {
  document.getElementById('result-al').classList.add('hidden');
  ['al-hex','al-user','al-pass','al-days'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('al-tier').value = 'basic';
  lastAL = {};
});

// ── INVENTORY ──────────────────────────────────────
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(x => x.classList.remove('active'));
  t.classList.add('active');
  document.getElementById(t.dataset.tab).classList.add('active');
}));

document.getElementById('btn-refresh').addEventListener('click', loadInventory);

function loadInventory() { fetchMod(); fetchApp(); }

// ── FETCH MODULE ───────────────────────────────────
async function fetchMod() {
  // desktop
  const ldD = document.getElementById('loading-mod-d');
  const tbD = document.getElementById('tbody-mod-d');
  const tD  = document.getElementById('table-mod-d');
  const emD = document.getElementById('empty-mod-d');
  // mobile
  const ldM = document.getElementById('loading-mod-m');
  const cM  = document.getElementById('cards-mod');
  const emM = document.getElementById('empty-mod-m');

  ldD.style.display = 'flex'; tD.style.display = 'none'; emD.classList.add('hidden');
  ldM.classList.remove('hidden'); ldM.style.display = 'flex'; cM.innerHTML = ''; emM.classList.add('hidden');

  const { data, error } = await db.from('module_licenses').select('*').order('created_at', { ascending: false });

  ldD.style.display = 'none'; ldM.classList.add('hidden');

  if (error) { toast(error.message, 'err'); return; }

  if (!data || !data.length) {
    emD.classList.remove('hidden'); tbD.innerHTML = '';
    emM.classList.remove('hidden'); return;
  }

  // Desktop table
  tD.style.display = '';
  tbD.innerHTML = data.map((r, i) => `
    <tr>
      <td class="td-num">${i + 1}</td>
      <td class="td-mono" title="${r.license_key}">${r.license_key}</td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--txt2)">${r.custom_hex || '—'}</td>
      <td class="td-dim">${fmt(r.expired_at)}</td>
      <td>${sbadge(r.status)}</td>
      <td class="td-dim">${fmt(r.created_at)}</td>
      <td><div class="row-acts">
        <button class="tbl-btn edit" data-id="${r.id}"><i class="fa-regular fa-pen-to-square"></i> Edit</button>
        <button class="tbl-btn del"  data-id="${r.id}"><i class="fa-regular fa-trash-can"></i></button>
      </div></td>
    </tr>
  `).join('');

  tbD.querySelectorAll('.tbl-btn.edit').forEach(b =>
    b.addEventListener('click', () => openEditMod(data.find(r => r.id == b.dataset.id)))
  );
  tbD.querySelectorAll('.tbl-btn.del').forEach(b =>
    b.addEventListener('click', () => askDel(b.dataset.id, 'mod'))
  );

  // Mobile cards
  cM.innerHTML = data.map(r => `
    <div class="rec-card">
      <div class="rec-card-head">
        <span class="rec-key" title="${r.license_key}">${r.license_key}</span>
        ${sbadge(r.status)}
      </div>
      <div class="rec-card-body">
        <div class="rec-field"><span class="rec-flab">Hex</span><span class="rec-fval" style="font-family:'JetBrains Mono',monospace;font-size:11px">${r.custom_hex || '—'}</span></div>
        <div class="rec-field"><span class="rec-flab">Expires</span><span class="rec-fval">${fmt(r.expired_at)}</span></div>
        <div class="rec-field"><span class="rec-flab">Created</span><span class="rec-fval">${fmt(r.created_at)}</span></div>
      </div>
      <div class="rec-card-foot">
        <button class="rec-btn edit" data-id="${r.id}"><i class="fa-regular fa-pen-to-square"></i> Edit</button>
        <button class="rec-btn del"  data-id="${r.id}"><i class="fa-regular fa-trash-can"></i> Delete</button>
      </div>
    </div>
  `).join('');

  cM.querySelectorAll('.rec-btn.edit').forEach(b =>
    b.addEventListener('click', () => openEditMod(data.find(r => r.id == b.dataset.id)))
  );
  cM.querySelectorAll('.rec-btn.del').forEach(b =>
    b.addEventListener('click', () => askDel(b.dataset.id, 'mod'))
  );
}

// ── FETCH APP ──────────────────────────────────────
async function fetchApp() {
  const ldD = document.getElementById('loading-app-d');
  const tbD = document.getElementById('tbody-app-d');
  const tD  = document.getElementById('table-app-d');
  const emD = document.getElementById('empty-app-d');
  const ldM = document.getElementById('loading-app-m');
  const cM  = document.getElementById('cards-app');
  const emM = document.getElementById('empty-app-m');

  ldD.style.display = 'flex'; tD.style.display = 'none'; emD.classList.add('hidden');
  ldM.classList.remove('hidden'); ldM.style.display = 'flex'; cM.innerHTML = ''; emM.classList.add('hidden');

  const { data, error } = await db.from('app_accounts').select('*').order('created_at', { ascending: false });

  ldD.style.display = 'none'; ldM.classList.add('hidden');

  if (error) { toast(error.message, 'err'); return; }

  if (!data || !data.length) {
    emD.classList.remove('hidden'); tbD.innerHTML = '';
    emM.classList.remove('hidden'); return;
  }

  // Desktop table
  tD.style.display = '';
  tbD.innerHTML = data.map((r, i) => `
    <tr>
      <td class="td-num">${i + 1}</td>
      <td class="td-mono" title="${r.license_key || ''}">${r.license_key || '<span style="color:var(--txt3)">—</span>'}</td>
      <td><strong style="font-size:13px">${r.username}</strong></td>
      <td>${tierLabel(r.tier)}</td>
      <td class="td-dim">${fmt(r.expired_at)}</td>
      <td>${sbadge(r.status)}</td>
      <td class="td-dim">${fmt(r.created_at)}</td>
      <td><div class="row-acts">
        <button class="tbl-btn edit" data-id="${r.id}"><i class="fa-regular fa-pen-to-square"></i> Edit</button>
        <button class="tbl-btn del"  data-id="${r.id}"><i class="fa-regular fa-trash-can"></i></button>
      </div></td>
    </tr>
  `).join('');

  tbD.querySelectorAll('.tbl-btn.edit').forEach(b =>
    b.addEventListener('click', () => openEditApp(data.find(r => r.id == b.dataset.id)))
  );
  tbD.querySelectorAll('.tbl-btn.del').forEach(b =>
    b.addEventListener('click', () => askDel(b.dataset.id, 'app'))
  );

  // Mobile cards
  cM.innerHTML = data.map(r => `
    <div class="rec-card">
      <div class="rec-card-head">
        <span class="rec-key" title="${r.license_key || ''}">${r.license_key || '—'}</span>
        ${sbadge(r.status)}
      </div>
      <div class="rec-card-body">
        <div class="rec-field"><span class="rec-flab">Username</span><span class="rec-fval"><strong>${r.username}</strong></span></div>
        <div class="rec-field"><span class="rec-flab">Tier</span><span class="rec-fval">${tierLabel(r.tier)}</span></div>
        <div class="rec-field"><span class="rec-flab">Expires</span><span class="rec-fval">${fmt(r.expired_at)}</span></div>
        <div class="rec-field"><span class="rec-flab">Created</span><span class="rec-fval">${fmt(r.created_at)}</span></div>
      </div>
      <div class="rec-card-foot">
        <button class="rec-btn edit" data-id="${r.id}"><i class="fa-regular fa-pen-to-square"></i> Edit</button>
        <button class="rec-btn del"  data-id="${r.id}"><i class="fa-regular fa-trash-can"></i> Delete</button>
      </div>
    </div>
  `).join('');

  cM.querySelectorAll('.rec-btn.edit').forEach(b =>
    b.addEventListener('click', () => openEditApp(data.find(r => r.id == b.dataset.id)))
  );
  cM.querySelectorAll('.rec-btn.del').forEach(b =>
    b.addEventListener('click', () => askDel(b.dataset.id, 'app'))
  );
}

// ── EDIT MODULE ────────────────────────────────────
function openEditMod(r) {
  document.getElementById('edit-mod-id').value     = r.id;
  document.getElementById('edit-mod-key').value    = r.license_key;
  document.getElementById('edit-mod-hex').value    = r.custom_hex || '';
  document.getElementById('edit-mod-exp').value    = toLocal(r.expired_at);
  document.getElementById('edit-mod-status').value = r.status;
  openModal('modal-edit-mod');
}

document.getElementById('btn-save-mod').addEventListener('click', async () => {
  const id  = document.getElementById('edit-mod-id').value;
  const hex = document.getElementById('edit-mod-hex').value.trim();
  const exp = document.getElementById('edit-mod-exp').value;
  const st  = document.getElementById('edit-mod-status').value;
  const btn = document.getElementById('btn-save-mod');
  busy(btn, true);
  const { error } = await db.from('module_licenses').update({
    custom_hex: hex || null,
    expired_at: exp ? new Date(exp).toISOString() : null,
    status: st,
  }).eq('id', id);
  busy(btn, false);
  if (error) { toast(error.message, 'err'); return; }
  toast('License updated', 'ok');
  closeModal('modal-edit-mod');
  fetchMod();
});

// ── EDIT APP ───────────────────────────────────────
function openEditApp(r) {
  document.getElementById('edit-app-id').value     = r.id;
  document.getElementById('edit-app-user').value   = r.username;
  document.getElementById('edit-app-pass').value   = r.password;
  document.getElementById('edit-app-tier').value   = r.tier;
  document.getElementById('edit-app-status').value = r.status;
  document.getElementById('edit-app-exp').value    = toLocal(r.expired_at);
  openModal('modal-edit-app');
}

document.getElementById('btn-save-app').addEventListener('click', async () => {
  const id   = document.getElementById('edit-app-id').value;
  const user = document.getElementById('edit-app-user').value.trim();
  const pass = document.getElementById('edit-app-pass').value.trim();
  const tier = document.getElementById('edit-app-tier').value;
  const st   = document.getElementById('edit-app-status').value;
  const exp  = document.getElementById('edit-app-exp').value;
  const btn  = document.getElementById('btn-save-app');
  if (!user) { toast('Username required', 'err'); return; }
  if (!pass) { toast('Password required', 'err'); return; }
  busy(btn, true);
  const { error } = await db.from('app_accounts').update({
    username: user, password: pass, tier, status: st,
    expired_at: exp ? new Date(exp).toISOString() : null,
  }).eq('id', id);
  busy(btn, false);
  if (error) { toast(error.message, 'err'); return; }
  toast('Account updated', 'ok');
  closeModal('modal-edit-app');
  fetchApp();
});

// ── DELETE ─────────────────────────────────────────
let pend = { id: null, type: null };

function askDel(id, type) {
  pend = { id, type };
  openModal('modal-confirm');
}

document.getElementById('btn-confirm-delete').addEventListener('click', async () => {
  const { id, type } = pend;
  if (!id) return;
  const btn   = document.getElementById('btn-confirm-delete');
  const table = type === 'mod' ? 'module_licenses' : 'app_accounts';
  busy(btn, true);
  const { error } = await db.from(table).delete().eq('id', id);
  busy(btn, false);
  if (error) { toast(error.message, 'err'); return; }
  toast('Record deleted', 'ok');
  closeModal('modal-confirm');
  pend = { id: null, type: null };
  type === 'mod' ? fetchMod() : fetchApp();
});

// ── BOOT ───────────────────────────────────────────
go('create-mod');
