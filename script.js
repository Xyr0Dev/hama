/* ====================================================
   SA SOCIETY — MEMBER PANEL  |  script.js  v7
   Login + expiry check + role-based inventory + tokens
==================================================== */

// ── SUPABASE ──────────────────────────────────────
const { createClient } = supabase;
const SUPABASE_URL = "https://ljjzgddqbwpervtablgj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqanpnZGRxYndwZXJ2dGFibGdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NTY0NzgsImV4cCI6MjEwNTEzMjQ3OH0.4FDByk8iEv3RWpx6t2dj7sgLn3DUqL3HQh-tvX0LPss";

const DB = createClient(SUPABASE_URL, SUPABASE_KEY);
const db = DB;

// ── SESSION ───────────────────────────────────────
let SESSION = JSON.parse(localStorage.getItem('sa_session') || 'null');
// SESSION = { id, username, role, token_quota, token_used }

// ── PARTICLES ─────────────────────────────────────
(function(){
  const cv  = document.getElementById('particleCanvas');
  const ctx = cv.getContext('2d');
  const N   = window.innerWidth < 640 ? 40 : 85;
  const D   = 120;
  let pts = [];
  function resize(){ cv.width=window.innerWidth; cv.height=window.innerHeight; }
  resize(); window.addEventListener('resize', resize);
  function rnd(a,b){ return Math.random()*(b-a)+a; }
  for(let i=0;i<N;i++) pts.push({x:rnd(0,cv.width),y:rnd(0,cv.height),vx:rnd(-0.25,0.25),vy:rnd(-0.25,0.25),r:rnd(0.8,1.8)});
  (function tick(){
    ctx.clearRect(0,0,cv.width,cv.height);
    for(let i=0;i<pts.length;i++){
      const a=pts[i];
      for(let j=i+1;j<pts.length;j++){
        const b=pts[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.sqrt(dx*dx+dy*dy);
        if(d<D){const t=1-d/D;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=`rgba(255,255,255,${t*0.28})`;ctx.lineWidth=t*1.1;ctx.stroke();}
      }
    }
    pts.forEach(p=>{
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,.4)';ctx.fill();
      p.x+=p.vx;p.y+=p.vy;
      if(p.x<-6)p.x=cv.width+6;else if(p.x>cv.width+6)p.x=-6;
      if(p.y<-6)p.y=cv.height+6;else if(p.y>cv.height+6)p.y=-6;
    });
    requestAnimationFrame(tick);
  })();
})();

// ── TOAST ─────────────────────────────────────────
function toast(msg, type='ok'){
  const el=document.createElement('div');
  el.className=`toast toast-${type}`;
  el.innerHTML=`${type==='ok'?'<i class="fa-solid fa-circle-check"></i>':'<i class="fa-solid fa-circle-exclamation"></i>'} ${msg}`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(()=>{el.classList.add('toast-out');setTimeout(()=>el.remove(),250);},3200);
}

// ── UTILS ─────────────────────────────────────────
function genHex(n=9){let s='';for(let i=0;i<n;i++)s+=Math.floor(Math.random()*16).toString(16);return s;}
function addDays(n){const d=new Date();d.setDate(d.getDate()+Number(n));return d.toISOString();}
function fmt(iso){
  if(!iso)return'—';
  const d=new Date(iso),pad=n=>String(n).padStart(2,'0');
  return`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function toLocal(iso){
  if(!iso)return'';
  const d=new Date(iso),pad=n=>String(n).padStart(2,'0');
  return`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function sbadge(s){return`<span class="sbadge s-${s}">${s}</span>`;}
function tierHtml(t){return`<span class="t-${t}">${t.charAt(0).toUpperCase()+t.slice(1)}</span>`;}
function busy(btn,on){
  if(on){btn._h=btn.innerHTML;btn.innerHTML='<span class="spin" style="width:14px;height:14px;border-width:2px"></span>';btn.disabled=true;}
  else{btn.innerHTML=btn._h||btn.innerHTML;btn.disabled=false;}
}
async function clip(text,label){
  try{await navigator.clipboard.writeText(text);toast(`${label} copied`,'ok');}
  catch{toast('Copy failed','err');}
}

// ── MODALS ────────────────────────────────────────
function openModal(id){document.getElementById(id).classList.remove('hidden');}
function closeModal(id){document.getElementById(id).classList.add('hidden');}
document.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',()=>closeModal(el.dataset.close)));
document.querySelectorAll('.overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)closeModal(o.id);}));

// ══════════════════════════════════════════════════
// AUTH & SESSION
// ══════════════════════════════════════════════════
const loginScreen = document.getElementById('loginScreen');
const panel       = document.getElementById('panel');

function updateTokenUI(){
  if(!SESSION) return;
  const badge      = document.getElementById('tokenBadge');
  const usedEl     = document.getElementById('tokenUsed');
  const quotaEl    = document.getElementById('tokenQuota');
  const drawerTok  = document.getElementById('drawerToken');
  const drawerTVal = document.getElementById('drawerTokenVal');
  const warnMod    = document.getElementById('tokenWarnMod');
  const warnApp    = document.getElementById('tokenWarnApp');

  if(SESSION.role === 'reseller'){
    const used  = SESSION.token_used  || 0;
    const quota = SESSION.token_quota || 0;
    const full  = used >= quota;

    badge.classList.remove('hidden');
    usedEl.textContent  = used;
    quotaEl.textContent = quota;
    badge.classList.toggle('danger', full);

    drawerTok.classList.remove('hidden');
    drawerTVal.textContent = `${used}/${quota}`;

    warnMod.classList.toggle('hidden', !full);
    warnApp.classList.toggle('hidden', !full);
    // disable generate buttons if quota full
    document.getElementById('btnGenMod').disabled = full;
    document.getElementById('btnGenAl').disabled  = full;
  } else {
    badge.classList.add('hidden');
    drawerTok.classList.add('hidden');
    warnMod.classList.add('hidden');
    warnApp.classList.add('hidden');
    document.getElementById('btnGenMod').disabled = false;
    document.getElementById('btnGenAl').disabled  = false;
  }
}

function applySession(s){
  SESSION = s;
  localStorage.setItem('sa_session', JSON.stringify(s));

  // Pill
  document.getElementById('pillName').textContent = s.username;
  const pillRole = document.getElementById('pillRole');
  pillRole.textContent = s.role;
  pillRole.className   = `pill-role role-${s.role}`;

  // Drawer
  document.getElementById('drawerName').textContent = s.username;
  document.getElementById('drawerRole').textContent = s.role.charAt(0).toUpperCase()+s.role.slice(1);
  document.getElementById('invSubLabel').textContent = s.role==='admin' ? 'All records' : 'Your records';

  // Token UI
  updateTokenUI();

  // Show panel
  loginScreen.classList.add('hidden');
  panel.classList.remove('hidden');
}

function doLogout(){
  SESSION = null;
  localStorage.removeItem('sa_session');
  panel.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  document.getElementById('loginUser').value='';
  document.getElementById('loginPass').value='';
  closeDrawer();
}


// ── PREFILL / SESSION RESTORE ──────────────────────
(async function initLogin(){
  try {
    const res = await fetch('/api/session', { cache: 'no-store' });
    if (res.ok) {
      const cli = await res.json();
      if (cli && cli.username) {
        // Pre-fill username from CLI session so user only needs to enter password
        const userInp = document.getElementById('loginUser');
        const passInp = document.getElementById('loginPass');
        if (userInp) userInp.value = cli.username;
        if (passInp) passInp.focus();
        return;
      }
    }
  } catch (_) { /* Standalone web or server not running */ }

  // Fallback: restore saved session if previously logged in on web
  if (SESSION) {
    applySession(SESSION);
  }
})();

// Eye toggle
document.getElementById('eyeBtn').addEventListener('click',()=>{
  const inp=document.getElementById('loginPass'),icon=document.getElementById('eyeIcon');
  if(inp.type==='password'){inp.type='text';icon.className='fa-regular fa-eye-slash';}
  else{inp.type='password';icon.className='fa-regular fa-eye';}
});
document.getElementById('loginUser').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('loginPass').focus();});
document.getElementById('loginPass').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('btnLogin').click();});

// LOGIN
document.getElementById('btnLogin').addEventListener('click', async ()=>{
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  if(!user){toast('Enter username','err');return;}
  if(!pass){toast('Enter password','err');return;}

  const btn=document.getElementById('btnLogin');
  busy(btn,true);

  const { data, error } = await DB
    .from('users')
    .select('id, username, role, token_quota, token_used, expired_at')
    .eq('username', user)
    .eq('password', pass)
    .maybeSingle();

  busy(btn,false);

  if(error){
    console.error('Supabase DB error:', error);
    toast('Supabase error: ' + (error.message || 'Cannot connect to API'), 'err');
    return;
  }
  if(!data){
    toast('Invalid username or password','err');
    return;
  }

  // Check account expiry
  if(data.expired_at && new Date(data.expired_at) < new Date()){
    toast('Your account has expired. Contact admin.','err');
    return;
  }

  applySession({
    id:          data.id,
    username:    data.username,
    role:        data.role,
    token_quota: data.token_quota || 0,
    token_used:  data.token_used  || 0,
  });
  go('create-mod');
  toast(`Welcome, ${data.username}`,'ok');
});

document.getElementById('btnLogout').addEventListener('click', doLogout);
document.getElementById('btnLogoutMob').addEventListener('click', doLogout);

// ── Increment token (reseller only) ───────────────
async function useToken(){
  if(!SESSION || SESSION.role !== 'reseller') return true; // admin: always allow
  const newUsed = (SESSION.token_used || 0) + 1;
  const { error } = await DB
    .from('users')
    .update({ token_used: newUsed })
    .eq('id', SESSION.id);
  if(error){ toast('Token update failed: '+error.message,'err'); return false; }
  SESSION.token_used = newUsed;
  localStorage.setItem('sa_session', JSON.stringify(SESSION));
  updateTokenUI();
  return true;
}

// ══════════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════════
const ALL_BTNS = document.querySelectorAll('[data-page]');
const ALL_PGS  = document.querySelectorAll('.page');
const burger   = document.getElementById('burger');
const drawer   = document.getElementById('drawer');
const drawerBg = document.getElementById('drawerBg');

function go(id){
  ALL_PGS.forEach(p=>p.classList.remove('active'));
  ALL_BTNS.forEach(b=>b.classList.toggle('active',b.dataset.page===id));
  const pg=document.getElementById(`page-${id}`);
  if(pg)pg.classList.add('active');
  closeDrawer();
  if(id==='inventory')loadInventory();
}
function openDrawer(){drawer.classList.remove('hidden');drawerBg.classList.remove('hidden');requestAnimationFrame(()=>drawer.classList.add('visible'));}
function closeDrawer(){drawer.classList.remove('visible');drawerBg.classList.add('hidden');setTimeout(()=>drawer.classList.add('hidden'),220);}
burger.addEventListener('click',()=>drawer.classList.contains('visible')?closeDrawer():openDrawer());
drawerBg.addEventListener('click',closeDrawer);
ALL_BTNS.forEach(b=>b.addEventListener('click',()=>go(b.dataset.page)));

// ══════════════════════════════════════════════════
// GENERATE: MODULE LICENSE
// ══════════════════════════════════════════════════
let lastMod='';

document.getElementById('btnGenMod').addEventListener('click', async ()=>{
  if(!SESSION){toast('Not logged in','err');return;}
  if(SESSION.role==='reseller' && SESSION.token_used>=SESSION.token_quota){
    toast('Token quota reached','err');return;
  }
  const rawHex=document.getElementById('modHex').value.trim();
  const days=document.getElementById('modDays').value;
  if(!days||Number(days)<1){toast('Enter a valid expiry duration','err');return;}

  const h=rawHex||genHex(9), key=`SAS-VIP-MOD-${h}`, exp=addDays(days);
  const btn=document.getElementById('btnGenMod');
  busy(btn,true);

  const { error } = await DB.from('module_licenses').insert([{
    license_key:key, custom_hex:h, expired_at:exp, status:'active', created_by:SESSION.username,
  }]);

  if(error){busy(btn,false);toast(error.message,'err');return;}

  // Consume token
  const ok = await useToken();
  busy(btn,false);
  if(!ok) return;

  lastMod=key;
  document.getElementById('resultModKey').textContent=key;
  document.getElementById('resultModExp').textContent=fmt(exp);
  document.getElementById('resultMod').classList.remove('hidden');
  toast('Module license generated','ok');
});

document.getElementById('copyMod').addEventListener('click',()=>clip(lastMod,'License key'));
document.getElementById('againMod').addEventListener('click',()=>{
  document.getElementById('resultMod').classList.add('hidden');
  document.getElementById('modHex').value='';document.getElementById('modDays').value='';lastMod='';
});

// ══════════════════════════════════════════════════
// GENERATE: APP LICENSE
// ══════════════════════════════════════════════════
let lastAL={};

document.getElementById('btnGenAl').addEventListener('click', async ()=>{
  if(!SESSION){toast('Not logged in','err');return;}
  if(SESSION.role==='reseller' && SESSION.token_used>=SESSION.token_quota){
    toast('Token quota reached','err');return;
  }
  const rawHex=document.getElementById('alHex').value.trim();
  const user=document.getElementById('alUser').value.trim();
  const pass=document.getElementById('alPass').value.trim();
  const days=document.getElementById('alDays').value;
  const tier=document.getElementById('alTier').value;

  if(!user){toast('Username is required','err');return;}
  if(!pass){toast('Password is required','err');return;}
  if(!days||Number(days)<1){toast('Enter a valid expiry duration','err');return;}

  const h=rawHex||genHex(9), key=`SAS-VIP-APP-${h}`, exp=addDays(days);
  const btn=document.getElementById('btnGenAl');
  busy(btn,true);

  const { error } = await DB.from('app_accounts').insert([{
    license_key:key, username:user, password:pass, tier, expired_at:exp, status:'active', created_by:SESSION.username,
  }]);

  if(error){busy(btn,false);toast(error.message,'err');return;}

  const ok = await useToken();
  busy(btn,false);
  if(!ok) return;

  lastAL={key,user,pass,tier,exp};
  document.getElementById('resultAlKey').textContent=key;
  document.getElementById('resultAlUser').textContent=user;
  document.getElementById('resultAlPass').textContent=pass;
  document.getElementById('resultAlTier').textContent=tier.charAt(0).toUpperCase()+tier.slice(1);
  document.getElementById('resultAlExp').textContent=fmt(exp);
  document.getElementById('resultAl').classList.remove('hidden');
  toast('App license generated','ok');
});

document.getElementById('copyAl').addEventListener('click',()=>{
  clip([`License Key : ${lastAL.key}`,`Username    : ${lastAL.user}`,`Password    : ${lastAL.pass}`,`Tier        : ${lastAL.tier}`,`Expires     : ${fmt(lastAL.exp)}`].join('\n'),'App license info');
});
document.getElementById('againAl').addEventListener('click',()=>{
  document.getElementById('resultAl').classList.add('hidden');
  ['alHex','alUser','alPass','alDays'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('alTier').value='basic';lastAL={};
});

// ══════════════════════════════════════════════════
// INVENTORY — role-based filter
// ══════════════════════════════════════════════════
document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(x=>x.classList.remove('active'));
  t.classList.add('active');document.getElementById(t.dataset.tab).classList.add('active');
}));
document.getElementById('btnRefresh').addEventListener('click',loadInventory);

function loadInventory(){
  const desc=document.getElementById('invDesc');
  if(SESSION){
    desc.innerHTML=SESSION.role==='admin'
      ?'Viewing <strong>all records</strong> (admin access)'
      :`Viewing records created by <strong>${SESSION.username}</strong>`;
  }
  fetchMod();fetchApp();
}

function buildQuery(table){
  let q=DB.from(table).select('*').order('created_at',{ascending:false});
  if(SESSION && SESSION.role==='reseller') q=q.eq('created_by',SESSION.username);
  return q;
}

// ── FETCH MODULE ──────────────────────────────────
async function fetchMod(){
  const ldD=document.getElementById('ldModD'),tbD=document.getElementById('tbodyModD'),
        tD=document.getElementById('tblModD'),emD=document.getElementById('emModD'),
        ldM=document.getElementById('ldModM'),cM=document.getElementById('cardsModM'),
        emM=document.getElementById('emModM');
  ldD.style.display='flex';tD.style.display='none';emD.classList.add('hidden');
  ldM.style.display='flex';ldM.classList.remove('hidden');cM.innerHTML='';emM.classList.add('hidden');

  const {data,error}=await buildQuery('module_licenses');
  ldD.style.display='none';ldM.style.display='none';ldM.classList.add('hidden');
  if(error){toast(error.message,'err');return;}
  if(!data||!data.length){emD.classList.remove('hidden');tbD.innerHTML='';emM.classList.remove('hidden');return;}

  tD.style.display='';
  tbD.innerHTML=data.map((r,i)=>`
    <tr>
      <td class="td-num">${i+1}</td>
      <td class="td-mono" title="${r.license_key}">${r.license_key}</td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--txt2)">${r.custom_hex||'—'}</td>
      <td class="td-dim">${fmt(r.expired_at)}</td>
      <td>${sbadge(r.status)}</td>
      <td class="td-by">${r.created_by||'—'}</td>
      <td class="td-dim">${fmt(r.created_at)}</td>
      <td><div class="row-acts">
        <button class="tbl-btn edit" data-id="${r.id}"><i class="fa-regular fa-pen-to-square"></i> Edit</button>
        <button class="tbl-btn del"  data-id="${r.id}"><i class="fa-regular fa-trash-can"></i></button>
      </div></td>
    </tr>`).join('');
  tbD.querySelectorAll('.tbl-btn.edit').forEach(b=>b.addEventListener('click',()=>openEditMod(data.find(r=>r.id==b.dataset.id))));
  tbD.querySelectorAll('.tbl-btn.del').forEach(b=>b.addEventListener('click',()=>askDel(b.dataset.id,'mod')));

  cM.innerHTML=data.map(r=>`
    <div class="rec-card">
      <div class="rec-head"><span class="rec-key" title="${r.license_key}">${r.license_key}</span>${sbadge(r.status)}</div>
      <div class="rec-body">
        <div class="rec-f"><span class="rec-lab">Hex</span><span class="rec-val" style="font-family:'JetBrains Mono',monospace;font-size:11px">${r.custom_hex||'—'}</span></div>
        <div class="rec-f"><span class="rec-lab">Expires</span><span class="rec-val">${fmt(r.expired_at)}</span></div>
        <div class="rec-f"><span class="rec-lab">Created By</span><span class="rec-val" style="color:var(--acc);font-weight:600">${r.created_by||'—'}</span></div>
        <div class="rec-f"><span class="rec-lab">Created At</span><span class="rec-val">${fmt(r.created_at)}</span></div>
      </div>
      <div class="rec-foot">
        <button class="rec-btn edit" data-id="${r.id}"><i class="fa-regular fa-pen-to-square"></i> Edit</button>
        <button class="rec-btn del"  data-id="${r.id}"><i class="fa-regular fa-trash-can"></i> Delete</button>
      </div>
    </div>`).join('');
  cM.querySelectorAll('.rec-btn.edit').forEach(b=>b.addEventListener('click',()=>openEditMod(data.find(r=>r.id==b.dataset.id))));
  cM.querySelectorAll('.rec-btn.del').forEach(b=>b.addEventListener('click',()=>askDel(b.dataset.id,'mod')));
}

// ── FETCH APP ─────────────────────────────────────
async function fetchApp(){
  const ldD=document.getElementById('ldAppD'),tbD=document.getElementById('tbodyAppD'),
        tD=document.getElementById('tblAppD'),emD=document.getElementById('emAppD'),
        ldM=document.getElementById('ldAppM'),cM=document.getElementById('cardsAppM'),
        emM=document.getElementById('emAppM');
  ldD.style.display='flex';tD.style.display='none';emD.classList.add('hidden');
  ldM.style.display='flex';ldM.classList.remove('hidden');cM.innerHTML='';emM.classList.add('hidden');

  const {data,error}=await buildQuery('app_accounts');
  ldD.style.display='none';ldM.style.display='none';ldM.classList.add('hidden');
  if(error){toast(error.message,'err');return;}
  if(!data||!data.length){emD.classList.remove('hidden');tbD.innerHTML='';emM.classList.remove('hidden');return;}

  tD.style.display='';
  tbD.innerHTML=data.map((r,i)=>`
    <tr>
      <td class="td-num">${i+1}</td>
      <td class="td-mono" title="${r.license_key||''}">${r.license_key||'<span style="color:var(--txt3)">—</span>'}</td>
      <td><strong style="font-size:13px">${r.username}</strong></td>
      <td>${tierHtml(r.tier)}</td>
      <td class="td-dim">${fmt(r.expired_at)}</td>
      <td>${sbadge(r.status)}</td>
      <td class="td-by">${r.created_by||'—'}</td>
      <td class="td-dim">${fmt(r.created_at)}</td>
      <td><div class="row-acts">
        <button class="tbl-btn edit" data-id="${r.id}"><i class="fa-regular fa-pen-to-square"></i> Edit</button>
        <button class="tbl-btn del"  data-id="${r.id}"><i class="fa-regular fa-trash-can"></i></button>
      </div></td>
    </tr>`).join('');
  tbD.querySelectorAll('.tbl-btn.edit').forEach(b=>b.addEventListener('click',()=>openEditApp(data.find(r=>r.id==b.dataset.id))));
  tbD.querySelectorAll('.tbl-btn.del').forEach(b=>b.addEventListener('click',()=>askDel(b.dataset.id,'app')));

  cM.innerHTML=data.map(r=>`
    <div class="rec-card">
      <div class="rec-head"><span class="rec-key" title="${r.license_key||''}">${r.license_key||'—'}</span>${sbadge(r.status)}</div>
      <div class="rec-body">
        <div class="rec-f"><span class="rec-lab">Username</span><span class="rec-val"><strong>${r.username}</strong></span></div>
        <div class="rec-f"><span class="rec-lab">Tier</span><span class="rec-val">${tierHtml(r.tier)}</span></div>
        <div class="rec-f"><span class="rec-lab">Expires</span><span class="rec-val">${fmt(r.expired_at)}</span></div>
        <div class="rec-f"><span class="rec-lab">Created By</span><span class="rec-val" style="color:var(--acc);font-weight:600">${r.created_by||'—'}</span></div>
      </div>
      <div class="rec-foot">
        <button class="rec-btn edit" data-id="${r.id}"><i class="fa-regular fa-pen-to-square"></i> Edit</button>
        <button class="rec-btn del"  data-id="${r.id}"><i class="fa-regular fa-trash-can"></i> Delete</button>
      </div>
    </div>`).join('');
  cM.querySelectorAll('.rec-btn.edit').forEach(b=>b.addEventListener('click',()=>openEditApp(data.find(r=>r.id==b.dataset.id))));
  cM.querySelectorAll('.rec-btn.del').forEach(b=>b.addEventListener('click',()=>askDel(b.dataset.id,'app')));
}

// ── EDIT MODULE ───────────────────────────────────
function openEditMod(r){
  document.getElementById('editModId').value=r.id;
  document.getElementById('editModKey').value=r.license_key;
  document.getElementById('editModHex').value=r.custom_hex||'';
  document.getElementById('editModExp').value=toLocal(r.expired_at);
  document.getElementById('editModStatus').value=r.status;
  openModal('modalEditMod');
}
document.getElementById('btnSaveMod').addEventListener('click', async ()=>{
  const id=document.getElementById('editModId').value;
  const hex=document.getElementById('editModHex').value.trim();
  const exp=document.getElementById('editModExp').value;
  const st=document.getElementById('editModStatus').value;
  const btn=document.getElementById('btnSaveMod');
  busy(btn,true);
  const {error}=await DB.from('module_licenses').update({custom_hex:hex||null,expired_at:exp?new Date(exp).toISOString():null,status:st}).eq('id',id);
  busy(btn,false);
  if(error){toast(error.message,'err');return;}
  toast('License updated','ok');closeModal('modalEditMod');fetchMod();
});

// ── EDIT APP ──────────────────────────────────────
function openEditApp(r){
  document.getElementById('editAppId').value=r.id;
  document.getElementById('editAppUser').value=r.username;
  document.getElementById('editAppPass').value=r.password;
  document.getElementById('editAppTier').value=r.tier;
  document.getElementById('editAppStatus').value=r.status;
  document.getElementById('editAppExp').value=toLocal(r.expired_at);
  openModal('modalEditApp');
}
document.getElementById('btnSaveApp').addEventListener('click', async ()=>{
  const id=document.getElementById('editAppId').value;
  const user=document.getElementById('editAppUser').value.trim();
  const pass=document.getElementById('editAppPass').value.trim();
  const tier=document.getElementById('editAppTier').value;
  const st=document.getElementById('editAppStatus').value;
  const exp=document.getElementById('editAppExp').value;
  const btn=document.getElementById('btnSaveApp');
  if(!user){toast('Username required','err');return;}
  if(!pass){toast('Password required','err');return;}
  busy(btn,true);
  const {error}=await DB.from('app_accounts').update({username:user,password:pass,tier,status:st,expired_at:exp?new Date(exp).toISOString():null}).eq('id',id);
  busy(btn,false);
  if(error){toast(error.message,'err');return;}
  toast('Account updated','ok');closeModal('modalEditApp');fetchApp();
});

// ── DELETE ────────────────────────────────────────
let pend={id:null,type:null};
function askDel(id,type){pend={id,type};openModal('modalConfirm');}
document.getElementById('btnConfirmDel').addEventListener('click', async ()=>{
  const {id,type}=pend;if(!id)return;
  const btn=document.getElementById('btnConfirmDel');
  busy(btn,true);
  const {error}=await DB.from(type==='mod'?'module_licenses':'app_accounts').delete().eq('id',id);
  busy(btn,false);
  if(error){toast(error.message,'err');return;}
  toast('Record deleted','ok');closeModal('modalConfirm');
  pend={id:null,type:null};
  type==='mod'?fetchMod():fetchApp();
});

