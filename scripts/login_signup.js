// ── Tab switcher ─────────────────────────────────────────────────────────────
function switchTab(tab) {
  const loginForm  = document.getElementById('form-login');
  const signupForm = document.getElementById('form-signup');
  const tabLogin   = document.getElementById('tab-login');
  const tabSignup  = document.getElementById('tab-signup');
  const indicator  = document.getElementById('tab-indicator');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    loginForm.classList.add('visible');
    signupForm.classList.add('hidden');
    signupForm.classList.remove('visible');
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    indicator.style.transform = 'translateX(0)';
  } else {
    signupForm.classList.remove('hidden');
    signupForm.classList.add('visible');
    loginForm.classList.add('hidden');
    loginForm.classList.remove('visible');
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
    indicator.style.transform = 'translateX(100%)';
  }
}

// ── Sign Up ──────────────────────────────────────────────────────────────────
async function handleSignup() {
  const student_id = document.getElementById('signup-sid').value.trim();
  const first_name = document.getElementById('signup-first').value.trim();
  const last_name  = document.getElementById('signup-last').value.trim();
  const email      = document.getElementById('signup-email').value.trim();
  const password   = document.getElementById('signup-password').value.trim();
  const msg        = document.getElementById('signup-msg');

  // ── Validation ───────────────────────────────────────────────────────────────
  if (!first_name || !last_name)   { msg.textContent = 'First and last name are required.'; return; }
  if (!student_id)                 { msg.textContent = 'Student ID is required.'; return; }
  if (!email)                      { msg.textContent = 'Email is required.'; return; }
  if (!/\S+@\S+\.\S+/.test(email)) { msg.textContent = 'Please enter a valid email.'; return; }
  if (!password)                   { msg.textContent = 'Password is required.'; return; }
  if (password.length < 6)         { msg.textContent = 'Password must be at least 6 characters.'; return; }

  const body = new FormData();
  body.append('student_id', student_id);
  body.append('first_name', first_name);
  body.append('last_name',  last_name);
  body.append('email',      email);
  body.append('password',   password);

  try {
    const res      = await fetch('../api/adduser.php', { method: 'POST', body });
    const rawText  = await res.text();      
    console.log('Signup raw response:', rawText);
    const data     = JSON.parse(rawText);   

    if (data.success) {
      msg.textContent = 'Account created successfully!';
      ['signup-sid', 'signup-first', 'signup-last', 'signup-email', 'signup-password']
        .forEach(id => document.getElementById(id).value = '');
    } else {
      msg.textContent = data.message;
    }
  } catch (err) {
    console.error('Signup error:', err);
    msg.textContent = 'Something went wrong. Check the console.';
  }
}

// ── Log In ───────────────────────────────────────────────────────────────────
async function handleLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();
  const msg      = document.getElementById('login-msg');

  // ── Validation ───────────────────────────────────────────────────────────────
  if (!email)                      { msg.textContent = 'Email is required.'; return; }
  if (!/\S+@\S+\.\S+/.test(email)) { msg.textContent = 'Please enter a valid email.'; return; }
  if (!password)                   { msg.textContent = 'Password is required.'; return; }

  const body = new FormData();
  body.append('email',    email);
  body.append('password', password);

  try {
    const res     = await fetch('../api/login.php', { method: 'POST', body });
    const rawText = await res.text();
    console.log('Login raw response:', rawText);
    const data    = JSON.parse(rawText);

    if (data.success) {
      window.location.href = 'browse.html';
    } else {
      msg.textContent = data.message || 'Invalid email or password.';
    }
  } catch (err) {
    console.error('Login error:', err);
    msg.textContent = 'Something went wrong. Check the console.';
  }
}

// ── Event Listeners ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tab-login') .addEventListener('click', () => switchTab('login'));
  document.getElementById('tab-signup').addEventListener('click', () => switchTab('signup'));

  document.querySelectorAll('[data-switch]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.switch));
  });

  document.getElementById('btn-login') .addEventListener('click', handleLogin);
  document.getElementById('btn-signup').addEventListener('click', handleSignup);
});