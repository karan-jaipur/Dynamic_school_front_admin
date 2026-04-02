import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { getManagedPage, savePageContent, updateManagedPage } from "@/api/adminClient";

const PAGE_COPY = {
  about: {
    label: "About",
    description: "Update the About page title, slug, sidebar order, active state, and structured content.",
    fields: [
      { key: "description", label: "Description", type: "textarea", rows: 5 },
      { key: "mission", label: "Mission", type: "textarea", rows: 4 },
      { key: "vision", label: "Vision", type: "textarea", rows: 4 },
    ],
  },
  academics: {
    label: "Academics",
    description: "Manage the academics page content with overview, curriculum points, and highlights.",
    fields: [
      { key: "overview", label: "Overview", type: "textarea", rows: 5 },
      { key: "curriculum", label: "Curriculum Points", type: "list", placeholder: "CBSE Curriculum" },
      { key: "highlights", label: "Highlights", type: "list", placeholder: "Smart classrooms" },
    ],
  },
  admission: {
    label: "Admission",
    description: "Control admission page content such as eligibility, fees, and the admission process.",
    fields: [
      { key: "eligibility", label: "Eligibility", type: "textarea", rows: 4 },
      { key: "fees", label: "Fees", type: "textarea", rows: 4 },
      { key: "admission_process", label: "Admission Process Steps", type: "list", placeholder: "Submit application" },
    ],
  },
  contact: {
    label: "Contact",
    description: "Edit the school contact information that appears on the contact page.",
    fields: [
      { key: "phone", label: "Phone", type: "text" },
      { key: "email", label: "Email", type: "email" },
      { key: "address", label: "Address", type: "textarea", rows: 4 },
    ],
  },
  gallery: {
    label: "Gallery",
    description: "Set the gallery page intro and featured albums shown in the user panel.",
    fields: [
      { key: "intro", label: "Intro", type: "textarea", rows: 5 },
      { key: "featured_albums", label: "Featured Albums", type: "list", placeholder: "Annual Day 2026" },
      { key: "gallery_note", label: "Gallery Note", type: "textarea", rows: 3 },
    ],
  },
};

const defaultMeta = {
  title: "",
  slug: "",
  order: 1,
  is_active: true,
};

function getDefaultContent(type) {
  switch (type) {
    case "about":
      return { description: "", mission: "", vision: "" };
    case "academics":
      return { overview: "", curriculum: [""], highlights: [""] };
    case "admission":
      return { eligibility: "", fees: "", admission_process: [""] };
    case "contact":
      return { phone: "", email: "", address: "" };
    case "gallery":
      return { intro: "", featured_albums: [""], gallery_note: "" };
    default:
      return {};
  }
}

function normalizeList(values) {
  return (values || []).map((item) => item.trim()).filter(Boolean);
}

function FieldRenderer({ field, value, onChange }) {
  if (field.type === "textarea") {
    return (
      <textarea
        rows={field.rows || 4}
        value={value || ""}
        onChange={(event) => onChange(field.key, event.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1E3A8A]"
      />
    );
  }

  if (field.type === "list") {
    const items = value?.length ? value : [""];
    return (
      <div className="mt-2 space-y-3">
        {items.map((item, index) => (
          <div key={`${field.key}-${index}`} className="flex gap-3">
            <input
              type="text"
              value={item}
              onChange={(event) => {
                const nextItems = [...items];
                nextItems[index] = event.target.value;
                onChange(field.key, nextItems);
              }}
              placeholder={field.placeholder}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1E3A8A]"
            />
            <button
              type="button"
              onClick={() => {
                const nextItems = items.filter((_, itemIndex) => itemIndex !== index);
                onChange(field.key, nextItems.length ? nextItems : [""]);
              }}
              className="rounded-xl border border-red-200 px-4 text-red-600 hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange(field.key, [...items, ""])}
          className="rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-600 hover:border-[#1E3A8A] hover:text-[#1E3A8A]"
        >
          Add Item
        </button>
      </div>
    );
  }

  return (
    <input
      type={field.type || "text"}
      value={value || ""}
      onChange={(event) => onChange(field.key, event.target.value)}
      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1E3A8A]"
    />
  );
}

export default function AdminManagedPage({ type }) {
  const queryClient = useQueryClient();
  const pageConfig = PAGE_COPY[type];
  const [meta, setMeta] = useState(defaultMeta);
  const [content, setContent] = useState(getDefaultContent(type));
  const [message, setMessage] = useState("");

  const { data: page, isLoading } = useQuery({
    queryKey: ["managed-page", type],
    queryFn: () => getManagedPage(type),
  });

  useEffect(() => {
    if (!page) return;
    setMeta({
      title: page.title || "",
      slug: page.slug || "",
      order: page.order || 1,
      is_active: Boolean(page.is_active),
    });
    setContent({
      ...getDefaultContent(type),
      ...(page.content || {}),
    });
  }, [page, type]);

  const hasContent = useMemo(() => Boolean(page?.has_content), [page]);

  const pageMutation = useMutation({
    mutationFn: (payload) => updateManagedPage(page._id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managed-pages"] });
      queryClient.invalidateQueries({ queryKey: ["managed-page", type] });
    },
  });

  const contentMutation = useMutation({
    mutationFn: (payload) => savePageContent(type, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managed-pages"] });
      queryClient.invalidateQueries({ queryKey: ["managed-page", type] });
    },
  });

  const handleContentChange = (key, value) => {
    setContent((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      await pageMutation.mutateAsync(meta);

      const normalizedContent = Object.fromEntries(
        Object.entries(content).map(([key, value]) => [
          key,
          Array.isArray(value) ? normalizeList(value) : value,
        ])
      );

      await contentMutation.mutateAsync(normalizedContent);
      setMessage("Page settings and content saved successfully.");
    } catch (error) {
      setMessage(error.message || "Unable to save page right now.");
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1E3A8A]">
              Configurable Page
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{pageConfig.label}</h2>
            <p className="mt-3 max-w-2xl text-slate-600">{pageConfig.description}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <div>Type: <span className="font-semibold text-slate-900">{type}</span></div>
            <div>Has content: <span className="font-semibold text-slate-900">{hasContent ? "Yes" : "No"}</span></div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_1.4fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">Page Settings</h3>
          <div className="mt-6 space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700">Title</label>
              <input
                type="text"
                value={meta.title}
                onChange={(event) => setMeta((current) => ({ ...current, title: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1E3A8A]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Slug</label>
              <input
                type="text"
                value={meta.slug}
                onChange={(event) => setMeta((current) => ({ ...current, slug: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1E3A8A]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Sidebar Order</label>
              <input
                type="number"
                min="1"
                max="5"
                value={meta.order}
                onChange={(event) =>
                  setMeta((current) => ({ ...current, order: Number(event.target.value) || 1 }))
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1E3A8A]"
              />
            </div>
            <label className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4">
              <span className="text-sm font-medium text-slate-700">Active in user panel</span>
              <input
                type="checkbox"
                checked={meta.is_active}
                onChange={(event) =>
                  setMeta((current) => ({ ...current, is_active: event.target.checked }))
                }
                className="h-5 w-5 accent-[#1E3A8A]"
              />
            </label>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">Structured Content</h3>
          <div className="mt-6 space-y-5">
            {pageConfig.fields.map((field) => (
              <div key={field.key}>
                <label className="text-sm font-medium text-slate-700">{field.label}</label>
                <FieldRenderer
                  field={field}
                  value={content[field.key]}
                  onChange={handleContentChange}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-sm ${message ? "text-slate-700" : "text-slate-400"}`}>
          {message || "Home and Settings stay fixed. Only these five pages are configurable."}
        </p>
        <button
          type="submit"
          disabled={pageMutation.isPending || contentMutation.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1E3A8A] px-6 py-3 font-semibold text-white hover:bg-[#173074] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {pageMutation.isPending || contentMutation.isPending ? "Saving..." : "Save Page"}
        </button>
      </div>
    </form>
  );
}
