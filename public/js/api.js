/* Shared API helper: wraps fetch, attaches JWT access token, and
   transparently refreshes it once if a request comes back 401. */

const API_BASE = '/api';

function getAccessToken() {
  return localStorage.getItem('accessToken');
}
function setAccessToken(token) {
  if (token) localStorage.setItem('accessToken', token);
  else localStorage.removeItem('accessToken');
}
function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); }
  catch { return null; }
}
function setStoredUser(user) {
  if (user) localStorage.setItem('user', JSON.stringify(user));
  else localStorage.removeItem('user');
}

async function refreshAccessToken() {
  const res = await fetch(`${API_BASE}/auth/refresh`, { method: 'POST', credentials: 'include' });
  if (!res.ok) return null;
  const data = await res.json();
  setAccessToken(data.accessToken);
  return data.accessToken;
}

async function apiFetch(path, options = {}) {
  const doFetch = (token) => fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let token = getAccessToken();
  let res = await doFetch(token);

  if (res.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await doFetch(newToken);
    }
  }

  let data = null;
  try { data = await res.json(); } catch { /* no body */ }

  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// Multipart uploads need to skip the JSON Content-Type header (the browser
// sets the correct multipart boundary itself) but still need auth + refresh handling.
async function apiUpload(path, formData) {
  const doFetch = (token) => fetch(`${API_BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  let token = getAccessToken();
  let res = await doFetch(token);

  if (res.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) res = await doFetch(newToken);
  }

  let data = null;
  try { data = await res.json(); } catch { /* no body */ }

  if (!res.ok) {
    const err = new Error((data && data.error) || `Upload failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

const api = {
  get: (path) => apiFetch(path, { method: 'GET' }),
  post: (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body || {}) }),
  put: (path, body) => apiFetch(path, { method: 'PUT', body: JSON.stringify(body || {}) }),
  del: (path) => apiFetch(path, { method: 'DELETE' }),
  upload: (path, formData) => apiUpload(path, formData),
};

function logoutUser() {
  setAccessToken(null);
  setStoredUser(null);
  api.post('/auth/logout').catch(() => {});
  window.location.href = '/index.html';
}

function requireAuth(redirectTo = '/login.html') {
  if (!getAccessToken()) {
    window.location.href = `${redirectTo}?next=${encodeURIComponent(window.location.pathname)}`;
    return false;
  }
  return true;
}

function requireAdmin() {
  const user = getStoredUser();
  if (!getAccessToken() || !user || user.role !== 'admin') {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

function formatNaira(amount) {
  return '\u20A6' + Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function showToast(message, isError = false) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2800);
}

function starsHtml(rating, filledClass = 'filled') {
  const rounded = Math.round(Number(rating) || 0);
  let html = '<span class="stars">';
  for (let i = 1; i <= 5; i++) {
    html += `<span class="star ${i <= rounded ? filledClass : ''}">\u2605</span>`;
  }
  html += '</span>';
  return html;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}
