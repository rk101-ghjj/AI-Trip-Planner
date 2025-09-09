const API_BASE = '';

export async function signup({ name, email, password }) {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  
  let data;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error('Server connection failed. Please try again.');
  }
  
  if (!res.ok) throw new Error(data.error || 'Signup failed');
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data;
}

export async function login({ email, password }) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  let data;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error('Server connection failed. Please try again.');
  }
  
  if (!res.ok) throw new Error(data.error || 'Login failed');
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getToken() {
  return localStorage.getItem('token');
}

export function getUser() {
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
}

export async function authFetch(path, opts = {}) {
  const token = getToken();
  const headers = opts.headers ? { ...opts.headers } : {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  try {
    const res = await fetch(path, { ...opts, headers });
    if (res.status === 401) {
      logout();
    }
    return res;
  } catch (error) {
    throw new Error('Network error. Please check your connection.');
  }
}


