const BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

function getHeaders(includeContentType = true) {
  const headers = {};
  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }
  const user = localStorage.getItem("user");
  if (user) {
    try {
      const userData = JSON.parse(user);
      if (userData.id) {
        headers["user_id"] = userData.id.toString();
      }
    } catch (e) {
      console.error("Error parsing user data:", e);
    }
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

export async function get(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: getHeaders(false),
  });
  return res.json();
}
