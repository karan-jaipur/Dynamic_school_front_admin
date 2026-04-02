import { Base_Url } from "../config";

const API_BASE = Base_Url.replace(/\/$/, "");

function getAuthToken() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("admin_token");
  } catch {
    return null;
  }
}

function buildHeaders() {
  const headers = {
    "Content-Type": "application/json",
  };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function handleResponse(response) {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (body?.message || body?.error) message = body.message || body.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const json = await response.json().catch(() => null);
  if (json && Object.prototype.hasOwnProperty.call(json, "data")) return json.data;
  return json;
}

function request(path, options = {}) {
  return fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: buildHeaders(),
    ...options,
  }).then(handleResponse);
}

export function listPages() {
  return request("/pages").then((pages = []) =>
    pages.map((page) => ({
      ...page,
      sections: Array.isArray(page.sections) ? page.sections : [],
      is_active: Boolean(page.is_active),
      order: Number(page.order || 1),
    }))
  );
}

export function getPage(id) {
  return request(`/pages/${id}`).then((page) => ({
    ...page,
    sections: Array.isArray(page.sections) ? page.sections : [],
    is_active: Boolean(page.is_active),
    order: Number(page.order || 1),
  }));
}

export function createPage(payload) {
  return request("/pages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updatePage(id, payload) {
  return request(`/pages/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function savePageContent(id, sections) {
  return request(`/pages/${id}/content`, {
    method: "PUT",
    body: JSON.stringify({ sections }),
  });
}
