const API_URL = 'http://10.0.0.223:5001';

async function request(path, options = {}) {
  const url = `${API_URL}${path}`;
  console.log("Calling API:", url);

  const response = await fetch(url, {
    ...options,
  });

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  console.log("API response:", response.status, body);

  if (!response.ok) {
    throw body || { error: 'Request failed' };
  }

  return body;
}

export async function login(credentials) {
  console.log("Login credentials:", credentials);
  return request('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
}

export async function register(payload) {
  console.log("Register payload:", payload);

  return request('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function logout() {
  return request('/api/logout');
}

export async function getProfile() {
  return request('/api/profile');
}

export async function updateProfile(payload) {
  return request('/api/profile/update', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function searchFriends(query) {
  return request(`/api/friends/search?query=${encodeURIComponent(query)}`);
}

export async function friendsAction(userId, action) {
  return request(`/api/friends/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
}

export async function cancelFriendRequest(userId) {
  return request('/api/friends/cancel-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
}

export async function getFeed() {
  return request('/api/feed');
}

export async function getNotifications() {
  return request('/api/notifications');
}

export async function followRequestAction(senderId, action) {
  return request(`/api/follow-request/${action}/${senderId}`, {
    method: 'POST',
  });
}

export async function dismissNotification(id) {
  return request(`/api/notifications/dismiss/${id}`, {
    method: 'POST',
  });
}

export async function getCalendarEvents(from, to) {
  return request(`/api/calender?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
}

export async function getPosts({ userId, type }) {
  if (userId) {
    return request(`/api/posts/user/${userId}`);
  }

  return request(`/api/posts/${type || 'public'}`);
}

export async function getStartRunData() {
  return request('/api/start-run');
}

export async function startRun(payload) {
  return request('/api/start-run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function finishRun(payload) {
  return request('/api/runs/finish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
