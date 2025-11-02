const USERS_KEY = 'rbac_users_v1';
const SESSION_KEY = 'rbac_session_v1';
const PW_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const app = document.getElementById('app');
const nav = document.getElementById('nav');
const pageTitle = document.getElementById('pageTitle');
const sidebar = document.getElementById('sidebar');
const sideNav = document.getElementById('sideNav');
const toastContainer = document.getElementById('toastContainer');
const confirmModal = document.getElementById('confirmModal');
const confirmTitle = document.getElementById('confirmTitle');
const confirmMessage = document.getElementById('confirmMessage');
const confirmOk = document.getElementById('confirmOk');
const confirmCancel = document.getElementById('confirmCancel');
function showToast(message, type='info', ms=3000){
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<div class="t-icon">${type === 'success' ? '✓' : type === 'error' ? '!' : 'i'}</div><div class="t-body"><div style="font-weight:700">${message}</div></div>`;
  toastContainer.appendChild(el);
  setTimeout(()=> el.remove(), ms);
}
function showConfirm({title='Confirm', message='Are you sure?', okText='OK', danger=false} = {}){
  return new Promise((resolve) => {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmOk.textContent = okText;
    confirmOk.className = `btn ${danger ? 'danger' : ''}`;
    confirmModal.classList.remove('hidden');
    confirmModal.setAttribute('aria-hidden', 'false');
    function cleanup(result){
      confirmModal.classList.add('hidden');
      confirmModal.setAttribute('aria-hidden', 'true');
      confirmOk.removeEventListener('click', onOk);
      confirmCancel.removeEventListener('click', onCancel);
      resolve(result);
    }
    function onOk(){ cleanup(true); }
    function onCancel(){ cleanup(false); }
    confirmOk.addEventListener('click', onOk);
    confirmCancel.addEventListener('click', onCancel);
  });
}
function loadUsers(){ try{ const raw = localStorage.getItem(USERS_KEY); return raw ? JSON.parse(raw) : []; }catch(e){ return [] } }
function saveUsers(users){ localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
function loadSession(){ try{ return JSON.parse(localStorage.getItem(SESSION_KEY)); }catch(e){ return null } }
function saveSession(s){ localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
function clearSession(){ localStorage.removeItem(SESSION_KEY); }
async function hashPassword(password){
  const enc = new TextEncoder();
  const data = enc.encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const arr = Array.from(new Uint8Array(digest));
  return arr.map(b => b.toString(16).padStart(2,'0')).join('');
}
(async function seedAdminIfNeeded(){
  let users = loadUsers();
  if(users.length === 0){
    const pw = 'Admin@123';
    const hashed = await hashPassword(pw);
    users.push({ email: 'admin@example.com', name: 'Administrator', passwordHash: hashed, role: 'Admin', createdAt: new Date().toISOString() });
    saveUsers(users);
  }
  init();
})();
async function createUser({email, name, password, role='Student'}){
  const users = loadUsers();
  if(!email || !name || !password) throw new Error('All fields required');
  if(users.find(u => u.email.toLowerCase() === email.toLowerCase())) throw new Error('Email already registered');
  if(!PW_REGEX.test(password)) throw new Error('Password does not meet complexity rules');
  const hash = await hashPassword(password);
  const u = { email: email.toLowerCase(), name, passwordHash: hash, role, createdAt: new Date().toISOString() };
  users.push(u); saveUsers(users);
  return u;
}
async function verifyCredentials(email, password){
  const users = loadUsers();
  const u = users.find(x => x.email.toLowerCase() === (email||'').toLowerCase());
  if(!u) throw new Error('Wrong email or password');
  const hash = await hashPassword(password);
  if(hash !== u.passwordHash) throw new Error('Wrong email or password');
  return u;
}
function signIn(user){
  saveSession({ email: user.email, name: user.name, role: user.role, createdAt: new Date().toISOString() });
}
function signOut(){
  clearSession();
  renderNav();
  window.location.hash = '#/login';
  showToast('Signed out', 'info', 2200);
}
async function changePassword(email, currentPassword, newPassword){
  const users = loadUsers();
  const idx = users.findIndex(u => u.email === email);
  if(idx === -1) throw new Error('User not found');
  const curHash = await hashPassword(currentPassword);
  if(curHash !== users[idx].passwordHash) throw new Error('Current password is incorrect');
  if(!PW_REGEX.test(newPassword)) throw new Error('New password does not meet complexity requirements');
  users[idx].passwordHash = await hashPassword(newPassword);
  saveUsers(users);
  return true;
}
function deleteUser(email){
  if(!email) return false;
  const users = loadUsers();
  const emailNorm = String(email).toLowerCase();
  const filtered = users.filter(u => (u.email||'').toLowerCase() !== emailNorm);
  if(filtered.length === users.length) return false;
  saveUsers(filtered);
  return true;
}
function escapeHtml(s=''){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
function initials(name=''){ return String(name||'').split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase() || '?'; }
function avatarColor(email=''){ const colors = ['#6b21a8','#0ea5e9','#ef4444','#f97316','#10b981','#0f172a']; let code=0; for(const ch of String(email)) code = (code*31 + ch.charCodeAt(0))|0; return colors[Math.abs(code)%colors.length]; }
function renderNav(){
  const session = loadSession();
  sideNav.innerHTML = '';
  nav.innerHTML = '';
  pageTitle.textContent = 'Welcome';
  if(session){
    const links = [
      {href:'#/welcome', text:'Welcome', icon:'🏠'},
      {href:'#/change-password', text:'Change Password', icon:'🔒'}
    ];
    if(session.role === 'Admin') links.splice(1,0,{href:'#/admin', text:'Admin Dashboard', icon:'🧭'});
    links.forEach(l=>{
      const a = document.createElement('a');
      a.href = l.href;
      a.innerHTML = `<span class="small">${l.icon}</span><span class="small">${l.text}</span>`;
      sideNav.appendChild(a);
    });
    const info = document.createElement('span');
    info.innerHTML = `<strong style="margin-right:8px">${escapeHtml(session.name)}</strong><span class="small" style="opacity:.8">${escapeHtml(session.role)}</span>`;
    nav.appendChild(info);
    const btnLogout = document.createElement('button');
    btnLogout.className = 'btn ghost';
    btnLogout.textContent = 'Logout';
    btnLogout.onclick = () => signOut();
    nav.appendChild(btnLogout);
  }else{
    const aLogin = document.createElement('a');
    aLogin.href = '#/login'; aLogin.className='btn ghost'; aLogin.textContent='Login';
    const aRegister = document.createElement('a'); aRegister.href = '#/register'; aRegister.className='btn'; aRegister.textContent='Register';
    nav.appendChild(aLogin); nav.appendChild(aRegister);
    const a = document.createElement('button'); a.className='small'; a.textContent='Public - please log in';
    sideNav.appendChild(a);
  }
}
function requireAuth(){ const s = loadSession(); if(!s){ showToast('Please login', 'error', 1800); window.location.hash='#/login'; return false } return s; }
function requireRole(role){ const s = loadSession(); if(!s){ showToast('Please login', 'error',1800); window.location.hash='#/login'; return false } if(s.role !== role){ showToast('Unauthorized', 'error',2000); window.location.hash='#/welcome'; return false } return s; }
function renderLogin(){
  pageTitle.textContent = 'Login';
  renderNav();
  app.innerHTML = `<section class="card"><h2>Sign in</h2><p class="small">Enter your account credentials.</p><form id="loginForm"><div class="form-row"><div class="field"><label>Email</label><input type="email" id="loginEmail" /></div><div class="field"><label>Password</label><input type="password" id="loginPassword" /></div></div><div style="display:flex; gap:10px"><button class="btn" type="submit">Login</button><a href="#/register" class="btn ghost" style="align-self:center">Register (Student)</a></div></form></section>`;
  document.getElementById('loginForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const pw = document.getElementById('loginPassword').value;
    if(!email || !pw){ showToast('Fill all fields', 'error'); return; }
    try{
      const user = await verifyCredentials(email, pw);
      signIn(user);
      renderNav();
      showToast('Welcome back!', 'success');
      window.location.hash = user.role === 'Admin' ? '#/admin' : '#/welcome';
    }catch(err){ showToast(err.message, 'error'); }
  });
}
function renderRegister(){
  pageTitle.textContent = 'Register';
  renderNav();
  app.innerHTML = `<section class="card"><h2>Create Student Account</h2><p class="small">Registrations here create <strong>Student</strong> accounts only.</p><form id="regForm"><div class="form-row"><div class="field"><label>Full name</label><input id="regName" /></div><div class="field"><label>Email</label><input id="regEmail" type="email" /></div></div><div class="form-row"><div class="field"><label>Password</label><input id="regPassword" type="password" /></div><div class="field"><label>Confirm</label><input id="regPassword2" type="password" /></div></div><div style="display:flex; gap:10px"><button class="btn" type="submit">Register</button><a href="#/login" class="btn ghost">Sign in</a></div><p class="small" style="margin-top:8px">Password: min 8 chars with upper, lower, number, and special.</p></form></section>`;
  document.getElementById('regForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pw = document.getElementById('regPassword').value;
    const pw2 = document.getElementById('regPassword2').value;
    if(!name||!email||!pw||!pw2){ showToast('Fill all fields','error'); return; }
    if(pw !== pw2){ showToast('Passwords do not match','error'); return; }
    try{
      const user = await createUser({name, email, password: pw, role:'Student'});
      signIn(user); renderNav(); showToast('Registered and signed in', 'success'); window.location.hash = '#/welcome';
    }catch(err){ showToast(err.message, 'error'); }
  });
}
function renderWelcome(){
  const s = requireAuth(); if(!s) return;
  pageTitle.textContent = 'Welcome';
  renderNav();
  const users = loadUsers();
  const totalUsers = users.length;
  const admins = users.filter(u=>u.role==='Admin').length;
  const students = users.filter(u=>u.role==='Student').length;
  app.innerHTML = `<div class="stats"><div class="card stat" style="background:linear-gradient(90deg,#fff,#f3f4ff)"><div style="flex:1"><h3>Total users</h3><p class="small">${totalUsers}</p></div><div class="icon" style="background:#111827">👥</div></div><div class="card stat" style="background:linear-gradient(90deg,#fff,#fff8f1)"><div style="flex:1"><h3>Admins</h3><p class="small">${admins}</p></div><div class="icon" style="background:#fde68a">🛡️</div></div><div class="card stat" style="background:linear-gradient(90deg,#fff,#eff6ff)"><div style="flex:1"><h3>Students</h3><p class="small">${students}</p></div><div class="icon" style="background:#60a5fa">🎓</div></div></div><section class="card"><h2>Welcome, ${escapeHtml(s.name)}</h2><p class="small">You are signed in as <strong>${escapeHtml(s.role)}</strong>. Use the sidebar to navigate.</p></section>`;
}
function renderChangePassword(){
  const s = requireAuth(); if(!s) return;
  pageTitle.textContent = 'Change Password';
  renderNav();
  app.innerHTML = `<section class="card"><h2>Change Password</h2><form id="cpForm"><div class="form-row"><div class="field"><label>Current password</label><input id="currentPw" type="password"/></div></div><div class="form-row"><div class="field"><label>New password</label><input id="newPw" type="password"/></div><div class="field"><label>Confirm new</label><input id="newPw2" type="password"/></div></div><div style="display:flex; gap:10px"><button class="btn" type="submit">Change</button><a href="#/welcome" class="btn ghost">Back</a></div></form></section>`;
  document.getElementById('cpForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const cur = document.getElementById('currentPw').value;
    const n = document.getElementById('newPw').value;
    const n2 = document.getElementById('newPw2').value;
    if(!cur||!n||!n2){ showToast('Fill all fields','error'); return; }
    if(n !== n2){ showToast('New passwords must match','error'); return; }
    try{
      await changePassword(loadSession().email, cur, n);
      showToast('Password changed. Please sign in again.', 'success');
      signOut();
    }catch(err){ showToast(err.message, 'error'); }
  });
}
function renderAdmin(){
  const s = requireRole('Admin'); if(!s) return;
  pageTitle.textContent = 'Admin Dashboard';
  renderNav();
  app.innerHTML = `<section class="card"><div style="display:flex; justify-content:space-between; align-items:center; gap:12px"><div><h2>Users</h2><p class="small">Search, filter, create, and manage users</p></div><div style="display:flex; gap:8px; align-items:center"><input id="qSearch" placeholder="Search name or email" style="padding:8px 10px; border-radius:8px; border:1px solid #e6e9ef"/><select id="filterRole" style="padding:8px 10px; border-radius:8px;"><option value="">All roles</option><option value="Admin">Admin</option><option value="Student">Student</option></select><select id="sortBy" style="padding:8px 10px; border-radius:8px;"><option value="name_asc">Name ↑</option><option value="name_desc">Name ↓</option><option value="date_desc">Newest</option><option value="date_asc">Oldest</option></select></div></div><div style="display:flex; gap:16px; margin-top:12px; flex-wrap:wrap"><div style="flex:1; min-width:420px;"><div class="card"><div id="usersTableContainer"></div></div></div><div style="width:360px;"><div class="card"><h3>Create user</h3><form id="createUserForm"><div class="form-row"><div class="field"><label>Full name</label><input id="newName"/></div></div><div class="form-row"><div class="field"><label>Email</label><input id="newEmail" type="email"/></div></div><div class="form-row"><div class="field"><label>Password</label><input id="newPassword" type="password"/></div><div class="field"><label>Role</label><select id="newRole"><option>Student</option><option>Admin</option></select></div></div><div style="display:flex; gap:8px"><button class="btn" type="submit">Create</button><button type="button" id="resetCreate" class="btn ghost">Reset</button></div><p class="small" style="margin-top:8px">Password policy: min 8 chars, uppercase, lowercase, number, special.</p></form></div></div></div></section>`;
  function renderUsersTable(){
    let users = loadUsers().slice();
    const query = document.getElementById('qSearch').value.trim().toLowerCase();
    const roleFilter = document.getElementById('filterRole').value;
    const sortBy = document.getElementById('sortBy').value;
    if(query){
      users = users.filter(u => (u.name||'').toLowerCase().includes(query) || (u.email||'').toLowerCase().includes(query));
    }
    if(roleFilter) users = users.filter(u => u.role === roleFilter);
    if(sortBy === 'name_asc') users.sort((a,b)=> a.name.localeCompare(b.name));
    else if(sortBy === 'name_desc') users.sort((a,b)=> b.name.localeCompare(a.name));
    else if(sortBy === 'date_asc') users.sort((a,b)=> new Date(a.createdAt)-new Date(b.createdAt));
    else users.sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt));
    const container = document.getElementById('usersTableContainer');
    if(users.length === 0){
      container.innerHTML = `<p class="small">No users found.</p>`; return;
    }
    const rows = users.map(u => `<tr><td style="width:48px"><div class="avatar" style="background:${avatarColor(u.email)}">${initials(u.name)}</div></td><td><div style="font-weight:700">${escapeHtml(u.name)}</div><div class="small" style="opacity:.8">${escapeHtml(u.email)}</div></td><td><div class="tag ${u.role==='Admin' ? 'role-admin' : 'role-student'}">${u.role}</div></td><td>${new Date(u.createdAt).toLocaleString()}</td><td><button class="btn ghost deleteBtn" data-email="${u.email}">Delete</button></td></tr>`).join('');
    container.innerHTML = `<table class="user-list"><thead><tr><th></th><th>Name / Email</th><th>Role</th><th>Created</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table>`;
    container.querySelectorAll('.deleteBtn').forEach(btn=>{
      btn.addEventListener('click', async (ev)=>{
        const email = ev.currentTarget.getAttribute('data-email');
        const session = loadSession();
        if(!session){ showToast('Session expired', 'error'); window.location.hash = '#/login'; return; }
        if((email||'').toLowerCase() === (session.email||'').toLowerCase()){ showToast("You can't delete your own account while signed in", 'error'); return; }
        const usersAll = loadUsers();
        const admins = usersAll.filter(u=>u.role==='Admin');
        const target = usersAll.find(u=>u.email.toLowerCase()===email.toLowerCase());
        if(target && target.role === 'Admin' && admins.length <= 1){ showToast('Cannot delete the last Admin account', 'error'); return; }
        const ok = await showConfirm({title:'Delete user', message:`Delete ${email}? This cannot be undone.`, okText:'Delete', danger:true});
        if(!ok) return;
        const deleted = deleteUser(email);
        if(deleted){ showToast('User deleted', 'success'); renderUsersTable(); renderNav(); }else{ showToast('User not found', 'error'); renderUsersTable(); }
      });
    });
  }
  document.getElementById('qSearch').addEventListener('input', renderUsersTable);
  document.getElementById('filterRole').addEventListener('change', renderUsersTable);
  document.getElementById('sortBy').addEventListener('change', renderUsersTable);
  renderUsersTable();
  const createForm = document.getElementById('createUserForm');
  createForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const name = document.getElementById('newName').value.trim();
    const email = document.getElementById('newEmail').value.trim();
    const pw = document.getElementById('newPassword').value;
    const role = document.getElementById('newRole').value;
    if(!name||!email||!pw){ showToast('Fill all fields','error'); return; }
    try{
      await createUser({name, email, password: pw, role});
      showToast('User created', 'success');
      createForm.reset();
      renderUsersTable();
    }catch(err){ showToast(err.message, 'error'); }
  });
  document.getElementById('resetCreate').addEventListener('click', ()=> createForm.reset());
}
function route(){
  const hash = window.location.hash || '#/login';
  if(hash === '#/login') return renderLogin();
  if(hash === '#/register') return renderRegister();
  if(hash === '#/welcome') return renderWelcome();
  if(hash === '#/admin') return renderAdmin();
  if(hash === '#/change-password') return renderChangePassword();
  renderLogin();
}
function init(){
  window.addEventListener('hashchange', route);
  document.getElementById('toggleSidebar').addEventListener('click', ()=> sidebar.classList.toggle('collapsed'));
  renderNav();
  const session = loadSession();
  if(!window.location.hash || window.location.hash === '#/'){
    if(session) window.location.hash = session.role === 'Admin' ? '#/admin' : '#/welcome';
    else window.location.hash = '#/login';
  }else{
    route();
  }
}
window.appHelpers = { loadUsers, loadSession, deleteUser, createUser };
window.init = init;
