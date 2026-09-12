const API_BASE = '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('urimai_admin_token') || localStorage.getItem('urimai_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  sendOTP: (phone) => request('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyOTP: (phone, code) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, code }) }),
  getProfile: () => request('/user/profile'),
  updateProfile: (name) => request('/user/profile', { method: 'PUT', body: JSON.stringify({ name }) }),
  saveEligibility: (data) => request('/user/eligibility', { method: 'POST', body: JSON.stringify(data) }),
  getSaved: () => request('/user/saved'),
  saveReservation: (reservationId) => request('/user/saved', { method: 'POST', body: JSON.stringify({ reservationId }) }),
  removeSaved: (reservationId) => request(`/user/saved/${reservationId}`, { method: 'DELETE' }),
  submitQuery: (data) => request('/queries', { method: 'POST', body: JSON.stringify(data) }),

  adminLogin: (username, password) => request('/admin/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  adminDashboard: () => request('/admin/dashboard'),
  adminUsers: () => request('/admin/users'),
  adminUserDetail: (id) => request(`/admin/users/${id}`),
  adminDeleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  adminQueries: (status) => request(`/admin/queries${status ? `?status=${status}` : ''}`),
  adminUpdateQuery: (id, data) => request(`/admin/queries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeleteQuery: (id) => request(`/admin/queries/${id}`, { method: 'DELETE' }),
  adminStats: () => request('/admin/stats'),
  adminChangePassword: (current, newPwd) => request('/admin/change-password', { method: 'PUT', body: JSON.stringify({ currentPassword: current, newPassword: newPwd }) }),
};
