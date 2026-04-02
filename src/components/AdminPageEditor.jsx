import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Save } from "lucide-react";
import { getPage, savePageContent, updatePage } from "@/api/adminClient";

const steps = [
  { key: "hero", label: "Hero" },
  { key: "content", label: "Content" },
  { key: "gallery", label: "Gallery" },
  { key: "extra", label: "Extra" },
];

function defaultSections() {
  return {
    hero: {
      type: "hero",
      title: "",
      subtitle: "",
      content: "",
      image: "",
      buttons: [{ label: "", link: "" }],
    },
    content: { type: "content", text: "" },
    gallery: { type: "gallery", images: [{ url: "", category: "", size_bytes: 0 }] },
    extra: {
      type: "extra",
      layout: "grid-1",
      stats: [{ label: "", value: "" }],
      testimonials: [{ name: "", quote: "" }],
    },
  };
}

function replaceAt(items, index, value) {
  return items.map((item, itemIndex) => (itemIndex === index ? value : item));
}

function hasFilledHero(section, fallbackTitle) {
  const hasButtons = (section.buttons || []).some(
    (button) => (button.label || "").trim() && (button.link || "").trim()
  );
  return Boolean(
    (section.title || fallbackTitle || "").trim() ||
      (section.subtitle || "").trim() ||
      (section.content || "").trim() ||
      (section.image || "").trim() ||
      hasButtons
  );
}

function hasFilledContent(section) {
  return Boolean((section.text || "").trim());
}

function hasFilledGallery(section) {
  return (section.images || []).some((image) => (image.url || "").trim());
}

function hasFilledExtra(section) {
  const hasStats = (section.stats || []).some(
    (item) => (item.label || "").trim() && (item.value || "").trim()
  );
  const hasTestimonials = (section.testimonials || []).some(
    (item) => (item.name || "").trim() && (item.quote || "").trim()
  );
  return hasStats || hasTestimonials;
}

function buildPayloadSections(sections, metaTitle) {
  const payload = [];

  if (hasFilledHero(sections.hero, metaTitle)) {
    payload.push({
      type: "hero",
      title: (sections.hero.title || metaTitle || "").trim(),
      subtitle: (sections.hero.subtitle || "").trim(),
      content: (sections.hero.content || "").trim(),
      image: (sections.hero.image || "").trim(),
      buttons: (sections.hero.buttons || [])
        .filter((button) => (button.label || "").trim() && (button.link || "").trim())
        .map((button) => ({
          label: button.label.trim(),
          link: button.link.trim(),
        })),
    });
  }

  if (hasFilledContent(sections.content)) {
    payload.push({
      type: "content",
      text: (sections.content.text || "").trim(),
    });
  }

  if (hasFilledGallery(sections.gallery)) {
    payload.push({
      type: "gallery",
      images: (sections.gallery.images || [])
        .filter((image) => (image.url || "").trim())
        .map((image) => ({
          url: (image.url || "").trim(),
          category: (image.category || "").trim(),
          size_bytes: Number(image.size_bytes) || 0,
        })),
    });
  }

  if (hasFilledExtra(sections.extra)) {
    payload.push({
      type: "extra",
      layout: sections.extra.layout === "grid-2" ? "grid-2" : "grid-1",
      stats: (sections.extra.stats || [])
        .filter((item) => (item.label || "").trim() && (item.value || "").trim())
        .map((item) => ({
          label: item.label.trim(),
          value: item.value.trim(),
        })),
      testimonials: (sections.extra.testimonials || [])
        .filter((item) => (item.name || "").trim() && (item.quote || "").trim())
        .map((item) => ({
          name: item.name.trim(),
          quote: item.quote.trim(),
        })),
    });
  }

  return payload.map((section, index) => ({
    ...section,
    order: index + 1,
  }));
}

export default function AdminPageEditor() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState("hero");
  const [meta, setMeta] = useState({ title: "", slug: "", is_active: true, order: 1 });
  const [sections, setSections] = useState(defaultSections());
  const [message, setMessage] = useState("");

  const { data: page, isLoading } = useQuery({
    queryKey: ["page", pageId],
    queryFn: () => getPage(pageId),
  });

  useEffect(() => {
    if (!page) return;
    setMeta({
      title: page.title,
      slug: page.slug,
      is_active: page.is_active,
      order: page.order,
    });

    const nextSections = defaultSections();
    page.sections.forEach((section) => {
      nextSections[section.type] = {
        ...nextSections[section.type],
        ...section,
      };
    });
    setSections(nextSections);
  }, [page]);

  const metadataMutation = useMutation({
    mutationFn: (payload) => updatePage(pageId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      queryClient.invalidateQueries({ queryKey: ["page", pageId] });
    },
  });

  const contentMutation = useMutation({
    mutationFn: (payload) => savePageContent(pageId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      queryClient.invalidateQueries({ queryKey: ["page", pageId] });
    },
  });

  const orderedSections = useMemo(
    () => buildPayloadSections(sections, meta.title),
    [sections, meta.title]
  );

  const handleSave = async () => {
    setMessage("");
    try {
      await metadataMutation.mutateAsync(meta);
      if (orderedSections.length === 0) {
        setMessage("Page settings saved. Add at least one filled section to make the page visible in the user panel.");
        return;
      }
      await contentMutation.mutateAsync(orderedSections);
      setMessage("Page and sections saved successfully.");
    } catch (error) {
      setMessage(error.message || "Unable to save page.");
    }
  };

  if (isLoading) {
    return <div className="rounded-3xl bg-white p-8 shadow-sm">Loading page editor...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1E3A8A]">
              Multi-Step Page Builder
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">{meta.title || "New Page"}</h2>
            <p className="mt-3 text-slate-600">Build the page top to bottom: Hero, Content, Gallery, and Extra blocks.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {steps.map((step) => (
              <button
                key={step.key}
                type="button"
                onClick={() => setActiveStep(step.key)}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                  activeStep === step.key ? "bg-[#1E3A8A] text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                {step.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.5fr]">
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200 space-y-5">
          <h3 className="text-xl font-bold text-slate-900">Page Settings</h3>
          <div>
            <label className="text-sm font-medium text-slate-700">Title</label>
            <input
              type="text"
              maxLength={50}
              value={meta.title}
              onChange={(event) => setMeta((current) => ({ ...current, title: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1E3A8A]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Slug</label>
            <input
              type="text"
              value={meta.slug}
              onChange={(event) => setMeta((current) => ({ ...current, slug: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1E3A8A]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Order</label>
            <input
              type="number"
              min="1"
              value={meta.order}
              onChange={(event) => setMeta((current) => ({ ...current, order: Number(event.target.value) || 1 }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1E3A8A]"
            />
          </div>
          <label className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4">
            <span className="text-sm font-medium text-slate-700">Active in user panel</span>
            <input
              type="checkbox"
              checked={meta.is_active}
              onChange={(event) => setMeta((current) => ({ ...current, is_active: event.target.checked }))}
              className="h-5 w-5 accent-[#1E3A8A]"
            />
          </label>
          <button
            type="button"
            onClick={() => navigate("/home")}
            className="w-full rounded-2xl border border-slate-200 px-5 py-3 font-medium text-slate-700"
          >
            Back to Home
          </button>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
          {activeStep === "hero" && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900">Hero Section</h3>
              <div>
                <label className="text-sm font-medium text-slate-700">Hero Title</label>
                <input
                  type="text"
                  maxLength={50}
                  value={sections.hero.title}
                  onChange={(event) => setSections((current) => ({ ...current, hero: { ...current.hero, title: event.target.value } }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1E3A8A]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Subtitle</label>
                <textarea
                  rows="3"
                  value={sections.hero.subtitle}
                  onChange={(event) => setSections((current) => ({ ...current, hero: { ...current.hero, subtitle: event.target.value } }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1E3A8A]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Hero Content</label>
                <textarea
                  rows="5"
                  maxLength={1000}
                  value={sections.hero.content}
                  onChange={(event) => setSections((current) => ({ ...current, hero: { ...current.hero, content: event.target.value } }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1E3A8A]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Hero Image URL</label>
                <input
                  type="text"
                  value={sections.hero.image}
                  onChange={(event) => setSections((current) => ({ ...current, hero: { ...current.hero, image: event.target.value } }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1E3A8A]"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Hero Buttons</label>
                  <button
                    type="button"
                    onClick={() =>
                      setSections((current) => ({
                        ...current,
                        hero: {
                          ...current.hero,
                          buttons: [...(current.hero.buttons || []), { label: "", link: "" }],
                        },
                      }))
                    }
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                  >
                    Add Button
                  </button>
                </div>
                {(sections.hero.buttons || []).map((button, index) => (
                  <div key={`hero-button-${index}`} className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                    <input
                      type="text"
                      value={button.label}
                      placeholder="Button name"
                      onChange={(event) =>
                        setSections((current) => ({
                          ...current,
                          hero: {
                            ...current.hero,
                            buttons: replaceAt(current.hero.buttons || [], index, {
                              ...button,
                              label: event.target.value,
                            }),
                          },
                        }))
                      }
                      className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1E3A8A]"
                    />
                    <input
                      type="text"
                      value={button.link}
                      placeholder="Button link"
                      onChange={(event) =>
                        setSections((current) => ({
                          ...current,
                          hero: {
                            ...current.hero,
                            buttons: replaceAt(current.hero.buttons || [], index, {
                              ...button,
                              link: event.target.value,
                            }),
                          },
                        }))
                      }
                      className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1E3A8A]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setSections((current) => ({
                          ...current,
                          hero: {
                            ...current.hero,
                            buttons: (current.hero.buttons || []).filter((_, buttonIndex) => buttonIndex !== index),
                          },
                        }))
                      }
                      className="rounded-2xl border border-red-200 px-4 py-3 text-sm text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeStep === "content" && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900">Content Section</h3>
              <p className="text-sm text-slate-500">Maximum 1000 characters.</p>
              <textarea
                rows="12"
                maxLength={1000}
                value={sections.content.text}
                onChange={(event) => setSections((current) => ({ ...current, content: { ...current.content, text: event.target.value } }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1E3A8A]"
              />
              <p className="text-right text-sm text-slate-500">{sections.content.text.length}/1000</p>
            </div>
          )}

          {activeStep === "gallery" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Gallery Section</h3>
                  <p className="text-sm text-slate-500">Maximum 10 images. Each image must be 2MB or smaller.</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSections((current) => ({
                      ...current,
                      gallery: {
                        ...current.gallery,
                        images: [...current.gallery.images, { url: "", category: "", size_bytes: 0 }].slice(0, 10),
                      },
                    }))
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Add Image
                </button>
              </div>

              {sections.gallery.images.map((image, index) => (
                <div key={`image-${index}`} className="grid gap-3 rounded-2xl bg-slate-50 p-4 lg:grid-cols-3">
                  <input
                    type="text"
                    value={image.url}
                    placeholder="Image URL"
                    onChange={(event) =>
                      setSections((current) => ({
                        ...current,
                        gallery: {
                          ...current.gallery,
                          images: replaceAt(current.gallery.images, index, { ...image, url: event.target.value }),
                        },
                      }))
                    }
                    className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1E3A8A]"
                  />
                  <input
                    type="text"
                    value={image.category}
                    placeholder="Optional category"
                    onChange={(event) =>
                      setSections((current) => ({
                        ...current,
                        gallery: {
                          ...current.gallery,
                          images: replaceAt(current.gallery.images, index, { ...image, category: event.target.value }),
                        },
                      }))
                    }
                    className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1E3A8A]"
                  />
                  <input
                    type="number"
                    min="0"
                    value={image.size_bytes}
                    placeholder="Size in bytes"
                    onChange={(event) =>
                      setSections((current) => ({
                        ...current,
                        gallery: {
                          ...current.gallery,
                          images: replaceAt(current.gallery.images, index, { ...image, size_bytes: Number(event.target.value) || 0 }),
                        },
                      }))
                    }
                    className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1E3A8A]"
                  />
                </div>
              ))}
            </div>
          )}

          {activeStep === "extra" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Extra Section</h3>
                <p className="text-sm text-slate-500">Choose a 1-column or 2-column grid and add optional stats/testimonials.</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Grid Layout</label>
                <select
                  value={sections.extra.layout}
                  onChange={(event) => setSections((current) => ({ ...current, extra: { ...current.extra, layout: event.target.value } }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1E3A8A]"
                >
                  <option value="grid-1">1 Column</option>
                  <option value="grid-2">2 Columns</option>
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-900">Stats</h4>
                  <button
                    type="button"
                    onClick={() =>
                      setSections((current) => ({
                        ...current,
                        extra: { ...current.extra, stats: [...current.extra.stats, { label: "", value: "" }] },
                      }))
                    }
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                  >
                    Add Stat
                  </button>
                </div>
                {sections.extra.stats.map((stat, index) => (
                  <div key={`stat-${index}`} className="grid gap-3 lg:grid-cols-2">
                    <input
                      type="text"
                      value={stat.label}
                      placeholder="Label"
                      onChange={(event) =>
                        setSections((current) => ({
                          ...current,
                          extra: {
                            ...current.extra,
                            stats: replaceAt(current.extra.stats, index, { ...stat, label: event.target.value }),
                          },
                        }))
                      }
                      className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1E3A8A]"
                    />
                    <input
                      type="text"
                      value={stat.value}
                      placeholder="Value"
                      onChange={(event) =>
                        setSections((current) => ({
                          ...current,
                          extra: {
                            ...current.extra,
                            stats: replaceAt(current.extra.stats, index, { ...stat, value: event.target.value }),
                          },
                        }))
                      }
                      className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1E3A8A]"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-900">Testimonials</h4>
                  <button
                    type="button"
                    onClick={() =>
                      setSections((current) => ({
                        ...current,
                        extra: {
                          ...current.extra,
                          testimonials: [...current.extra.testimonials, { name: "", quote: "" }],
                        },
                      }))
                    }
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                  >
                    Add Testimonial
                  </button>
                </div>
                {sections.extra.testimonials.map((testimonial, index) => (
                  <div key={`testimonial-${index}`} className="grid gap-3">
                    <input
                      type="text"
                      value={testimonial.name}
                      placeholder="Name"
                      onChange={(event) =>
                        setSections((current) => ({
                          ...current,
                          extra: {
                            ...current.extra,
                            testimonials: replaceAt(current.extra.testimonials, index, { ...testimonial, name: event.target.value }),
                          },
                        }))
                      }
                      className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1E3A8A]"
                    />
                    <textarea
                      rows="3"
                      value={testimonial.quote}
                      placeholder="Quote"
                      onChange={(event) =>
                        setSections((current) => ({
                          ...current,
                          extra: {
                            ...current.extra,
                            testimonials: replaceAt(current.extra.testimonials, index, { ...testimonial, quote: event.target.value }),
                          },
                        }))
                      }
                      className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1E3A8A]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <p className={`text-sm ${message ? "text-slate-700" : "text-slate-400"}`}>
              {message || "Sections render top to bottom on the user site in this same step order."}
            </p>
            <button
              type="button"
              onClick={handleSave}
              disabled={metadataMutation.isPending || contentMutation.isPending}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#1E3A8A] px-6 py-3 text-white font-semibold hover:bg-[#173074] disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {metadataMutation.isPending || contentMutation.isPending ? "Saving..." : "Save Page"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
