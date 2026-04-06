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

function buildAuthHeaders() {
  const headers = {};
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

export function deletePage(id) {
  return apiDelete(`/pages/${id}`);
}

export function apiGet(path) {
  return request(path);
}

export function apiPost(path, body) {
  return request(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function apiPut(path, body) {
  return request(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function apiDelete(path) {
  return request(path, {
    method: "DELETE",
  });
}

export async function listAdmissions() {
  const data = await apiGet("/admissions");
  return (data || []).map((item) => ({
    id: item._id,
    student_name: item.studentName,
    father_name: item.parentName,
    class_applying: item.class,
    email: item.email,
    phone: item.phone,
    address: item.address,
    date_of_birth: item.dob,
    created_date: item.createdAt,
    status: item.isContacted ? "contacted" : "pending",
  }));
}

export async function listNotices() {
  const data = await apiGet("/notices");
  return (data || []).map((item) => ({
    id: item._id,
    title: item.title,
    description: item.description,
    date: item.date,
    is_highlighted: item.isHighlighted === true,
    is_published: item.isPublished !== false,
    attachment_url: item.attachmentUrl || "",
  }));
}

export async function listGalleries() {
  const data = await apiGet("/gallery");
  const images = [];
  (data || []).forEach((gallery) => {
    (gallery.images || []).forEach((image, index) => {
      images.push({
        id: `${gallery._id}-${index}`,
        galleryId: gallery._id,
        title: gallery.title,
        category: gallery.category,
        description: gallery.description,
        image_url: image.url,
      });
    });
  });
  return images;
}

export async function getSettings() {
  const data = await apiGet("/settings");
  if (!data) return {};
  return {
    primary_color: data.themeColor,
    accent_color: data.accentColor,
    text_color: data.textColor || "#0f172a",
    font_family: data.fontFamily || "Inter, system-ui, sans-serif",
    meta_title: data.seoTitle,
    meta_description: data.seoDescription,
    meta_keywords: data.metaKeywords || "",
    google_analytics: data.googleAnalytics,
    logo: data.logo,
    favicon: data.favicon || "",
    animations_enabled: data.animationsEnabled !== false,
    school_name: data.schoolName || "",
    tagline: data.tagline || "",
    phone: data.phone || "",
    email: data.email || "",
    address: data.address || "",
    map_embed: data.mapEmbed || "",
    facebook: data.facebook || "",
    twitter: data.twitter || "",
    instagram: data.instagram || "",
    youtube: data.youtube || "",
    linkedin: data.linkedin || "",
  };
}

export function updateSettings(settings, files = {}) {
  const { logoFile = null, faviconFile = null } = files;
  const payload = {
    schoolName: settings.school_name,
    tagline: settings.tagline,
    phone: settings.phone,
    email: settings.email,
    address: settings.address,
    mapEmbed: settings.map_embed,
    seoTitle: settings.meta_title,
    seoDescription: settings.meta_description,
    metaKeywords: settings.meta_keywords,
    googleAnalytics: settings.google_analytics,
    themeColor: settings.primary_color,
    accentColor: settings.accent_color,
    textColor: settings.text_color,
    fontFamily: settings.font_family,
    animationsEnabled:
      settings.animations_enabled === true || settings.animations_enabled === "true",
    facebook: settings.facebook,
    twitter: settings.twitter,
    instagram: settings.instagram,
    youtube: settings.youtube,
    linkedin: settings.linkedin,
    logo: settings.logo || "",
    favicon: settings.favicon || "",
  };

  if (!logoFile && !faviconFile) {
    return apiPut("/settings", payload);
  }

  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    formData.append(key, value ?? "");
  });
  if (logoFile) formData.append("logo", logoFile);
  if (faviconFile) formData.append("favicon", faviconFile);

  return fetch(`${API_BASE}/settings`, {
    method: "PUT",
    credentials: "include",
    headers: buildAuthHeaders(),
    body: formData,
  }).then(handleResponse);
}

export async function listTestimonials() {
  const data = await apiGet("/testimonials");
  return (data || []).map((item) => ({
    id: item._id,
    name: item.name,
    role: item.role,
    content: item.content,
    image_url: item.image,
    rating: item.rating,
    is_featured: item.isActive,
  }));
}

export function createTestimonial(form) {
  return apiPost("/testimonials", {
    name: form.name,
    role: form.role || "Parent",
    content: form.content,
    rating: form.rating ?? 5,
    isActive: form.is_featured ?? true,
    image: form.image_url || "",
  });
}

export function updateTestimonial(id, form) {
  return apiPut(`/testimonials/${id}`, {
    name: form.name,
    role: form.role || "Parent",
    content: form.content,
    rating: form.rating ?? 5,
    isActive: form.is_featured ?? true,
    image: form.image_url || "",
  });
}

export function deleteTestimonial(id) {
  return apiDelete(`/testimonials/${id}`);
}

export async function listAcademicPrograms() {
  const data = await apiGet("/AcademicProg");
  return (data || []).map((item) => ({
    id: item._id,
    title: item.title,
    grades: item.grades,
    description: item.description,
  }));
}

export function createAcademicProgram(form) {
  return apiPost("/AcademicProg/add", {
    title: form.title,
    grades: form.grades,
    description: form.description,
  });
}

export function updateAcademicProgram(id, form) {
  return apiPut(`/AcademicProg/${id}`, {
    title: form.title,
    grades: form.grades,
    description: form.description,
  });
}

export function deleteAcademicProgram(id) {
  return apiDelete(`/AcademicProg/delete/${id}`);
}

export async function listStats() {
  const data = await apiGet("/Statistic");
  return (data || []).map((item) => ({
    id: item._id,
    label: item.label,
    value: item.value,
    suffix: item.suffix || "+",
  }));
}

export function createStat(form) {
  return apiPost("/Statistic/add", form);
}

export function updateStat(id, form) {
  return apiPut(`/Statistic/new/${id}`, form);
}

export function deleteStat(id) {
  return apiDelete(`/Statistic/del/${id}`);
}

export function updateAdmissionContactStatus(id, status) {
  return apiPut(`/admissions/${id}/status`, {
    isContacted: status === "contacted" || status === "enrolled",
  });
}

export function deleteAdmission(id) {
  return apiDelete(`/admissions/${id}`);
}

export async function listBanners() {
  const data = await apiGet("/banners");
  return (data || []).map((item) => ({
    id: item._id,
    title: item.title || "",
    subtitle: item.subtitle || "",
    image_url: item.image || "",
    cta_primary_text: item.buttonText || "Learn More",
    cta_primary_link: item.buttonLink || "#",
    cta_secondary_text: "",
    cta_secondary_link: "",
    order: Number(item.order || 0),
    is_active: item.isActive !== false,
  }));
}

function appendBannerFormData(formData, form) {
  formData.append("title", form.title || "");
  formData.append("subtitle", form.subtitle || "");
  formData.append("buttonText", form.cta_primary_text || "Learn More");
  formData.append("buttonLink", form.cta_primary_link || "#");
  formData.append("order", String(Number(form.order || 0)));
  formData.append("isActive", String(form.is_active !== false));
}

export function createBanner(form) {
  const formData = new FormData();
  appendBannerFormData(formData, form);
  if (form.imageFile) formData.append("image", form.imageFile);
  return fetch(`${API_BASE}/banners`, {
    method: "POST",
    credentials: "include",
    headers: buildAuthHeaders(),
    body: formData,
  }).then(handleResponse);
}

export function updateBanner(id, form) {
  const formData = new FormData();
  appendBannerFormData(formData, form);
  if (form.imageFile) formData.append("image", form.imageFile);
  return fetch(`${API_BASE}/banners/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: buildAuthHeaders(),
    body: formData,
  }).then(handleResponse);
}

export function deleteBanner(id) {
  return apiDelete(`/banners/${id}`);
}

export function createNotice(form) {
  return apiPost("/notices", {
    title: form.title,
    description: form.description || "",
    date: form.date,
    isHighlighted: Boolean(form.is_highlighted),
    isPublished: form.is_published !== false,
    attachmentUrl: form.attachment_url || "",
  });
}

export function updateNotice(id, form) {
  return apiPut(`/notices/${id}`, {
    title: form.title,
    description: form.description || "",
    date: form.date,
    isHighlighted: Boolean(form.is_highlighted),
    isPublished: form.is_published !== false,
    attachmentUrl: form.attachment_url || "",
  });
}

export function deleteNotice(id) {
  return apiDelete(`/notices/${id}`);
}

export async function listGalleryCategories() {
  const data = await apiGet("/gallery/categories");
  return (data || []).map((item) => ({
    id: item,
    name: item.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    slug: item,
  }));
}

export function createGalleryCategory(category) {
  return apiPost("/gallery/addCateg", { category });
}

export function createGalleryImage(form) {
  const formData = new FormData();
  formData.append("title", form.title || "Untitled");
  formData.append("category", form.category || "media-library");
  formData.append("description", form.description || "");
  if (form.imageFile) {
    formData.append("images", form.imageFile);
  }
  return fetch(`${API_BASE}/gallery`, {
    method: "POST",
    credentials: "include",
    headers: buildAuthHeaders(),
    body: formData,
  }).then(handleResponse);
}

export function updateGallery(id, form) {
  const formData = new FormData();
  formData.append("title", form.title || "Untitled");
  formData.append("category", form.category || "media-library");
  formData.append("description", form.description || "");
  const existingImages = Array.isArray(form.images)
    ? form.images
    : form.image_url
      ? [{ url: form.image_url, caption: "" }]
      : [];
  formData.append("images", JSON.stringify(existingImages));
  if (form.imageFile) {
    formData.append("images", form.imageFile);
  }
  return fetch(`${API_BASE}/gallery/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: buildAuthHeaders(),
    body: formData,
  }).then(handleResponse);
}

export function deleteGallery(id) {
  return apiDelete(`/gallery/${id}`);
}

export async function listNavItems() {
  const data = await apiGet("/nav");
  return (data || []).map((item) => ({
    id: item._id,
    label: item.label,
    link: item.link,
    order: Number(item.order || 0),
    is_active: item.isActive !== false,
    open_in_new_tab: Boolean(item.isExternal),
    parent_id: item.parentId || "",
  }));
}

export function createNavItem(form) {
  return apiPost("/nav", {
    label: form.label,
    link: form.link,
    order: Number(form.order || 0),
    isExternal: Boolean(form.open_in_new_tab),
    parentId: form.parent_id || null,
  });
}

export function updateNavItem(id, form) {
  return apiPut(`/nav/${id}`, {
    label: form.label,
    link: form.link,
    order: Number(form.order || 0),
    isExternal: Boolean(form.open_in_new_tab),
    parentId: form.parent_id || null,
  });
}

export function deleteNavItem(id) {
  return apiDelete(`/nav/${id}`);
}
