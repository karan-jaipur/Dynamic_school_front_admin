import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Save, Upload, X } from "lucide-react";
import {
  createGalleryImage,
  getPage,
  listGalleries,
  savePageContent,
  updatePage,
} from "@/api/adminClient";

const blockOptions = [
  { key: "hero", label: "Hero / Banner" },
  { key: "content", label: "Text Block" },
  { key: "gallery", label: "Gallery" },
  { key: "extra", label: "Stats / Testimonials" },
];

const emptySections = () => ({
  hero: {
    type: "hero",
    title: "",
    subtitle: "",
    content: "",
    image: "",
    buttons: [{ label: "", link: "" }],
  },
  content: { type: "content", text: "" },
  gallery: {
    type: "gallery",
    images: [{ url: "", category: "", size_bytes: 0 }],
  },
  extra: {
    type: "extra",
    layout: "grid-1",
    stats: [{ label: "", value: "" }],
    testimonials: [{ name: "", quote: "" }],
  },
});

const replaceAt = (items, index, value) =>
  items.map((item, itemIndex) => (itemIndex === index ? value : item));

function Input({ label, ...props }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        {...props}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#2563eb]"
      />
    </div>
  );
}

function TextArea({ label, rows = 4, ...props }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        rows={rows}
        {...props}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#2563eb]"
      />
    </div>
  );
}

function toPayload(sections, metaTitle) {
  const payload = [];
  if (
    sections.hero.title ||
    sections.hero.subtitle ||
    sections.hero.content ||
    sections.hero.image
  ) {
    payload.push({
      type: "hero",
      title: sections.hero.title || metaTitle,
      subtitle: sections.hero.subtitle || "",
      content: sections.hero.content || "",
      image: sections.hero.image || "",
      buttons: (sections.hero.buttons || []).filter(
        (item) => item.label && item.link,
      ),
      order: payload.length + 1,
    });
  }
  if ((sections.content.text || "").trim()) {
    payload.push({
      type: "content",
      text: sections.content.text.trim(),
      order: payload.length + 1,
    });
  }
  const galleryImages = (sections.gallery.images || []).filter((item) =>
    (item.url || "").trim(),
  );
  if (galleryImages.length) {
    payload.push({
      type: "gallery",
      images: galleryImages.map((item) => ({
        url: item.url,
        category: item.category || "",
        size_bytes: Number(item.size_bytes) || 0,
      })),
      order: payload.length + 1,
    });
  }
  const stats = (sections.extra.stats || []).filter(
    (item) => item.label && item.value,
  );
  const testimonials = (sections.extra.testimonials || []).filter(
    (item) => item.name && item.quote,
  );
  if (stats.length || testimonials.length) {
    payload.push({
      type: "extra",
      layout: sections.extra.layout === "grid-2" ? "grid-2" : "grid-1",
      stats,
      testimonials,
      order: payload.length + 1,
    });
  }
  return payload;
}

export default function AdminPageEditor() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const uploadInputRef = useRef(null);
  const [activeBlock, setActiveBlock] = useState("content");
  const [meta, setMeta] = useState({
    title: "",
    slug: "",
    is_active: true,
    order: 1,
  });
  const [sections, setSections] = useState(emptySections());
  const [message, setMessage] = useState("");
  const [pickerTarget, setPickerTarget] = useState(null);

  const { data: page, isLoading } = useQuery({
    queryKey: ["page", pageId],
    queryFn: () => getPage(pageId),
  });

  const { data: mediaImages = [] } = useQuery({
    queryKey: ["galleryImages"],
    queryFn: listGalleries,
  });

  useEffect(() => {
    if (!page) return;
    setMeta({
      title: page.title,
      slug: page.slug,
      is_active: page.is_active,
      order: page.order,
    });
    const nextSections = emptySections();
    (page.sections || []).forEach((section) => {
      nextSections[section.type] = {
        ...nextSections[section.type],
        ...section,
      };
    });
    setSections(nextSections);
    if (page.sections?.[0]?.type) setActiveBlock(page.sections[0].type);
  }, [page]);

  const orderedSections = useMemo(
    () => toPayload(sections, meta.title),
    [sections, meta.title],
  );

  const metaMutation = useMutation({
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

  const uploadMutation = useMutation({
    mutationFn: (file) =>
      createGalleryImage({
        title: file.name.replace(/\.[^.]+$/, ""),
        category: "media-library",
        description: "Page builder upload",
        imageFile: file,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleryImages"] });
    },
  });

  const setPickedImage = (url) => {
    if (!pickerTarget) return;
    if (pickerTarget.kind === "hero") {
      setSections((current) => ({
        ...current,
        hero: { ...current.hero, image: url },
      }));
    } else {
      setSections((current) => ({
        ...current,
        gallery: {
          ...current.gallery,
          images: replaceAt(current.gallery.images, pickerTarget.index, {
            ...current.gallery.images[pickerTarget.index],
            url,
          }),
        },
      }));
    }
    setPickerTarget(null);
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !pickerTarget) return;
    const created = await uploadMutation.mutateAsync(file);
    const url = created?.images?.[0]?.url || created?.image || "";
    if (url) setPickedImage(url);
    event.target.value = "";
  };

  const handleSave = async () => {
    setMessage("");
    try {
      await metaMutation.mutateAsync(meta);
      await contentMutation.mutateAsync(orderedSections);
      setMessage("Page saved successfully.");
      navigate("/page-builder");
    } catch (error) {
      setMessage(error.message || "Unable to save page.");
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        Loading page editor...
      </div>
    );
  }

  return (
    <>
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />

      <div className="mx-auto w-full max-w-[980px] rounded-[30px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-[32px] font-bold tracking-[-0.03em] text-slate-900">
              Page Builder
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose a block type and edit its content.
            </p>
          </div>
          <button
            onClick={() => navigate("/page-builder")}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[78vh] overflow-y-auto px-6 py-6">
          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Page" value={meta.slug || "page"} readOnly />
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Block Type
              </label>
              <select
                value={activeBlock}
                onChange={(e) => setActiveBlock(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#2563eb]"
              >
                {blockOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Input
              label="Section Key"
              value={`${meta.slug || "page"}_${activeBlock}`}
              readOnly
            />
            <Input
              label="Display Title"
              value={activeBlock === "hero" ? sections.hero.title : meta.title}
              onChange={(e) =>
                activeBlock === "hero"
                  ? setSections((current) => ({
                      ...current,
                      hero: { ...current.hero, title: e.target.value },
                    }))
                  : setMeta((current) => ({
                      ...current,
                      title: e.target.value,
                    }))
              }
            />
          </div>

          {activeBlock === "hero" && (
            <div className="mt-5 space-y-4">
              <TextArea
                label="Subtitle"
                value={sections.hero.subtitle}
                onChange={(e) =>
                  setSections((current) => ({
                    ...current,
                    hero: { ...current.hero, subtitle: e.target.value },
                  }))
                }
              />
              <TextArea
                label="Content"
                rows={6}
                value={sections.hero.content}
                onChange={(e) =>
                  setSections((current) => ({
                    ...current,
                    hero: { ...current.hero, content: e.target.value },
                  }))
                }
              />
              <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex h-56 items-center justify-center rounded-[22px] border border-dashed border-slate-300 bg-white">
                  {sections.hero.image ? (
                    <img
                      src={sections.hero.image}
                      alt="Hero"
                      className="h-full w-full rounded-[20px] object-cover"
                    />
                  ) : (
                    "No image selected"
                  )}
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPickerTarget({ kind: "hero" })}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                  >
                    Choose from Library
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPickerTarget({ kind: "hero" });
                      uploadInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                  >
                    <Upload className="h-4 w-4" /> Upload New
                  </button>
                </div>
                <div className="mt-4">
                  <Input
                    label="Hero Image URL"
                    value={sections.hero.image}
                    onChange={(e) =>
                      setSections((current) => ({
                        ...current,
                        hero: { ...current.hero, image: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {activeBlock === "content" && (
            <div className="mt-5">
              <TextArea
                label="Content"
                rows={12}
                value={sections.content.text}
                onChange={(e) =>
                  setSections((current) => ({
                    ...current,
                    content: { ...current.content, text: e.target.value },
                  }))
                }
              />
            </div>
          )}

          {activeBlock === "gallery" && (
            <div className="mt-5 space-y-4">
              {sections.gallery.images.map((image, index) => (
                <div
                  key={`image-${index}`}
                  className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setPickerTarget({ kind: "gallery", index })
                      }
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                    >
                      Choose from Library
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPickerTarget({ kind: "gallery", index });
                        uploadInputRef.current?.click();
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                    >
                      <Upload className="h-4 w-4" /> Upload New
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Image URL"
                      value={image.url}
                      onChange={(e) =>
                        setSections((current) => ({
                          ...current,
                          gallery: {
                            ...current.gallery,
                            images: replaceAt(current.gallery.images, index, {
                              ...image,
                              url: e.target.value,
                            }),
                          },
                        }))
                      }
                    />
                    <Input
                      label="Category"
                      value={image.category}
                      onChange={(e) =>
                        setSections((current) => ({
                          ...current,
                          gallery: {
                            ...current.gallery,
                            images: replaceAt(current.gallery.images, index, {
                              ...image,
                              category: e.target.value,
                            }),
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setSections((current) => ({
                    ...current,
                    gallery: {
                      ...current.gallery,
                      images: [
                        ...current.gallery.images,
                        { url: "", category: "", size_bytes: 0 },
                      ],
                    },
                  }))
                }
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
              >
                Add Image
              </button>
            </div>
          )}

          {activeBlock === "extra" && (
            <div className="mt-5 grid gap-4">
              <TextArea
                label="Stats (one per line: Label|Value)"
                rows={5}
                value={(sections.extra.stats || [])
                  .map((item) => `${item.label}|${item.value}`)
                  .join("\n")}
                onChange={(e) =>
                  setSections((current) => ({
                    ...current,
                    extra: {
                      ...current.extra,
                      stats: e.target.value
                        .split("\n")
                        .filter(Boolean)
                        .map((line) => {
                          const [label = "", value = ""] = line.split("|");
                          return { label: label.trim(), value: value.trim() };
                        }),
                    },
                  }))
                }
              />
              <TextArea
                label="Testimonials (one per line: Name|Quote)"
                rows={5}
                value={(sections.extra.testimonials || [])
                  .map((item) => `${item.name}|${item.quote}`)
                  .join("\n")}
                onChange={(e) =>
                  setSections((current) => ({
                    ...current,
                    extra: {
                      ...current.extra,
                      testimonials: e.target.value
                        .split("\n")
                        .filter(Boolean)
                        .map((line) => {
                          const [name = "", quote = ""] = line.split("|");
                          return { name: name.trim(), quote: quote.trim() };
                        }),
                    },
                  }))
                }
              />
            </div>
          )}

          <div className="mt-6 grid gap-5 border-t border-slate-100 pt-5 md:grid-cols-3 ">
            <Input
              label="Order"
              type="number"
              value={meta.order}
              onChange={(e) =>
                setMeta((current) => ({
                  ...current,
                  order: Number(e.target.value) || 1,
                }))
              }
            />

            <label className="flex h-[50px] items-center mt-[30px]  gap-3 rounded-2xl border border-slate-200 px-4">
              <input
                type="checkbox"
                checked={meta.is_active}
                onChange={(e) =>
                  setMeta((current) => ({
                    ...current,
                    is_active: e.target.checked,
                  }))
                }
                className="h-5 w-5 accent-[#22c55e]"
              />
              <span className="text-sm text-slate-700">Visible</span>
            </label>
            <Input
              label="Status"
              value={meta.is_active ? "Published" : "Draft"}
              readOnly
            />
          </div>

          {message && <p className="mt-4 text-sm text-slate-500">{message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 px-6 py-5">
          <button
            type="button"
            onClick={() => navigate("/page-builder")}
            className="rounded-2xl border border-slate-200 px-5 py-3 font-medium text-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={
              metaMutation.isPending ||
              contentMutation.isPending ||
              uploadMutation.isPending
            }
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2563eb] px-5 py-3 font-semibold text-white disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {metaMutation.isPending || contentMutation.isPending
              ? "Saving..."
              : "Save Page"}
          </button>
        </div>
      </div>

      {pickerTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="max-h-[85vh] w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.28)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <h3 className="text-2xl font-bold text-slate-900">
                Choose from Media Library
              </h3>
              <button
                type="button"
                onClick={() => setPickerTarget(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid max-h-[70vh] gap-4 overflow-y-auto p-6 md:grid-cols-3 xl:grid-cols-4">
              {mediaImages.map((image) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setPickedImage(image.image_url)}
                  className="overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50 text-left transition hover:shadow-md"
                >
                  <div className="aspect-square overflow-hidden bg-slate-100">
                    <img
                      src={image.image_url}
                      alt={image.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <p className="truncate font-semibold text-slate-900">
                      {image.title || "Untitled"}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                      {image.category}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
