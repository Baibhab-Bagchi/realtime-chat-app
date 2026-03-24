const API = import.meta.env.VITE_API_URL;

async function request(path, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
  }

  return data;
}

export const loginApi = (email, password) =>
  request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const registerApi = (name, email, password) =>
  request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });

export const getMyChatsApi = () =>
  request("/api/chats");

export const getMessagesApi = (chatId) =>
  request(`/api/messages/${chatId}`);

export const sendMessageApi = (chatId, text) =>
  request("/api/messages", {
    method: "POST",
    body: JSON.stringify({ chatId, text }),
  });

export const findUserByEmailApi = (email) =>
  request(`/api/users/find?email=${encodeURIComponent(email)}`);

export const createChatApi = (userId) =>
  request("/api/chats", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });