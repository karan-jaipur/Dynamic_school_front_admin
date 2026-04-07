import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  FileText,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deletePage, listPages, savePageContent } from "@/api/adminClient";

function buildSectionLabel(section) {
  if (section.type === "hero") return section.title || "Hero Section";
  if (section.type === "content") return "Content Block";
  if (section.type === "gallery") return "Gallery Section";
  if (section.type === "extra") return "Extra Section";
  return "Section";
}

function getPreviewUrl(page) {
  if (typeof window === "undefined") return "/";
  const { protocol, hostname, port } = window.location;
  const previewOrigin =
    hostname === "localhost" && port === "5174"
      ? `${protocol}//${hostname}:5173`
      : window.location.origin.replace(":5174", ":5173");

  if (page?.isHome) {
    return `${previewOrigin}/`;
  }

  const slug = String(page?.slug || "").replace(/^\/+/, "");
  return slug ? `${previewOrigin}/${slug}` : `${previewOrigin}/`;
}

const FIXED_PAGES = [
  {
    _id: "home",
    title: "Home",
    slug: "",
    isHome: true,
    isFixed: true,
    description: "Homepage sections, stats, testimonials, and academic highlights.",
    sections: [{ order: 1, type: "content", title: "About Our School", key: "about_intro" }],
    editorRoute: "/home-editor",
  },
];

export default function AdminHome() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedPageId, setSelectedPageId] = useState("home");
  const { data: pages = [] } = useQuery({
    queryKey: ["pages"],
    queryFn: listPages,
  });
  const deletePageMutation = useMutation({
    mutationFn: deletePage,
    onSuccess: (_, deletedPageId) => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      if (selectedPageId === deletedPageId) {
        setSelectedPageId("home");
      }
    },
  });
  const deleteBlockMutation = useMutation({
    mutationFn: ({ pageId, sections }) => savePageContent(pageId, sections),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      if (selectedPage?._id) {
        queryClient.invalidateQueries({ queryKey: ["page", selectedPage._id] });
      }
    },
  });

  const normalizedPages = useMemo(
    () =>
      pages.map((page) => ({
        ...page,
        isFixed: false,
        sections: Array.isArray(page.sections) ? [...page.sections].sort((a, b) => a.order - b.order) : [],
      })),
    [pages]
  );

  const pageItems = useMemo(
    () => [...FIXED_PAGES, ...normalizedPages],
    [normalizedPages]
  );

  const selectedPage = pageItems.find((page) => page._id === selectedPageId) || pageItems[0];

  useEffect(() => {
    if (!selectedPage && pageItems.length > 0) {
      setSelectedPageId(pageItems[0]._id);
    }
  }, [pageItems, selectedPage]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("admin-page-builder-selection", {
        detail: selectedPage?.isHome
          ? { isHome: true, pageId: "home", title: selectedPage.title }
          : selectedPage?._id
            ? { isHome: false, pageId: selectedPage._id, title: selectedPage.title }
            : null,
      })
    );
  }, [selectedPage]);

  const selectedSections = selectedPage?.isHome
    ? selectedPage.sections
    : (selectedPage?.sections || []).map((section, index) => ({
        ...section,
        key: `${selectedPage.slug}_${section.type}_${index + 1}`,
      }));

  const handleDeletePage = (page) => {
    if (!page?._id || page.isFixed || deletePageMutation.isPending) return;
    const shouldDelete = window.confirm(`Delete "${page.title}" page?`);
    if (!shouldDelete) return;
    deletePageMutation.mutate(page._id);
  };

  const handlePreviewPage = (page = selectedPage) => {
    const previewUrl = getPreviewUrl(page);
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  };

  const handleOpenEditor = (page = selectedPage) => {
    if (!page) return;
    if (page.editorRoute) {
      navigate(page.editorRoute);
      return;
    }
    if (page.isHome) {
      navigate("/home-editor");
      return;
    }
    if (page._id) {
      navigate(`/page-builder/${page._id}`);
    }
  };

  const handleDeleteBlock = (sectionIndex) => {
    if (selectedPage?.isHome || !selectedPage?._id || deleteBlockMutation.isPending) return;
    const shouldDelete = window.confirm("Delete this block from the page?");
    if (!shouldDelete) return;
    const nextSections = (selectedPage.sections || []).filter((_, index) => index !== sectionIndex);
    deleteBlockMutation.mutate({ pageId: selectedPage._id, sections: nextSections });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[34px] font-bold tracking-[-0.03em] text-slate-900">Page Builder</h2>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("open-admin-create-page"))}
          className="inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Page
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
        <section className="rounded-[26px] border border-slate-200 bg-white px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <p className="px-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Pages
          </p>

          <div className="mt-4 space-y-1">
            {pageItems.map((page) => (
              <div
                key={page._id}
                className={`flex items-center gap-2 rounded-xl px-3 py-3 text-left text-sm ${
                  selectedPageId === page._id ? "bg-[#eef4ff] text-[#1c4ed8]" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <button
                  onClick={() => setSelectedPageId(page._id)}
                  className="flex min-w-0 flex-1 items-center justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate font-medium">{page.title}</span>
                  </div>
                  <span className="ml-3 text-xs text-slate-400">{page.sections?.length || 0}</span>
                </button>
                {!page.isFixed && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeletePage(page);
                    }}
                    className="rounded-lg p-2 text-slate-300 transition hover:bg-white hover:text-rose-500"
                    aria-label={`Delete ${page.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("open-admin-create-page"))}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-[#2563eb] hover:bg-[#f3f7ff]"
            >
              <Plus className="h-4 w-4" />
              New Page
            </button>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[30px] font-bold tracking-[-0.03em] text-slate-900">
                {selectedPage?.title || "Select a Page"}
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                {selectedSections.length} blocks · Drag to reorder
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!selectedPage?.isFixed && !selectedPage?.isHome && selectedPage?._id && (
                <button
                  type="button"
                  onClick={() => handleDeletePage(selectedPage)}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Page
                </button>
              )}
              <button
                onClick={() => {
                  handleOpenEditor(selectedPage);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white shadow-sm"
              >
                <Plus className="h-4 w-4" />
                {selectedPage?.isFixed && !selectedPage?.isHome ? "Open Editor" : "Add Block"}
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {selectedPage?.isFixed && !selectedPage?.isHome ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
                {selectedPage.description}
              </div>
            ) : selectedSections.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
                This page has no blocks yet.
              </div>
            ) : (
              selectedSections.map((section, index) => (
                <div
                  key={section.key || `${section.type}-${index}`}
                  className="flex items-center gap-4 rounded-2xl border border-slate-100 px-5 py-4 shadow-[0_4px_18px_rgba(15,23,42,0.03)]"
                >
                  <GripVertical className="h-4 w-4 text-slate-300" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[18px] font-semibold text-slate-800">
                        {buildSectionLabel(section)}
                      </p>
                      <span className="rounded-full bg-[#edf3ff] px-2 py-0.5 text-[11px] font-semibold text-[#4b74e6]">
                        {section.type}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">/{section.key || `${selectedPage?.slug}_${section.type}`}</p>
                  </div>
                  <span className="rounded-full bg-[#ecfdf3] px-3 py-1 text-xs font-semibold text-[#22a15a]">
                    Live
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePreviewPage(selectedPage)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEditor(selectedPage)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBlock(index)}
                    disabled={selectedPage?.isHome}
                    className="rounded-lg p-2 text-slate-300 hover:bg-slate-50 hover:text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {!selectedPage?.isFixed && !selectedPage?.isHome && selectedPage?._id && (
            <div className="mt-5">
              <Link
                to={`/page-builder/${selectedPage._id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
              >
                Open Full Editor
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
