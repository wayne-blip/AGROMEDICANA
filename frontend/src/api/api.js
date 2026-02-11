const BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

function getHeaders(includeContentType = true) {
  const headers = {};
  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add JWT token from localStorage if available
  const token = localStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
}

export async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: getHeaders(true),
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function put(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: getHeaders(true),
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function del(path) {
  const res = await fetch(`${BASE}${path}`, {
    method: "DELETE",
    headers: getHeaders(false),
  });
  return res.json();
}

export async function get(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: getHeaders(false),
  });
  return res.json();
}

export function getBase() {
  return BASE;
}

export function authHeaders() {
  return getHeaders(false);
}
