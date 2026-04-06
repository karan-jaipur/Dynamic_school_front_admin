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
import { useQuery } from "@tanstack/react-query";
import { listPages } from "@/api/adminClient";

function buildSectionLabel(section) {
  if (section.type === "hero") return section.title || "Hero Section";
  if (section.type === "content") return "Content Block";
  if (section.type === "gallery") return "Gallery Section";
  if (section.type === "extra") return "Extra Section";
  return "Section";
}

export default function AdminHome() {
  const navigate = useNavigate();
  const [selectedPageId, setSelectedPageId] = useState("home");
  const { data: pages = [] } = useQuery({
    queryKey: ["pages"],
    queryFn: listPages,
  });

  const normalizedPages = useMemo(
    () =>
      pages.map((page) => ({
        ...page,
        sections: Array.isArray(page.sections) ? [...page.sections].sort((a, b) => a.order - b.order) : [],
      })),
    [pages]
  );

  const selectedPage =
    selectedPageId === "home"
      ? {
          _id: "home",
          title: "Home Page",
          slug: "home",
          sections: [{ order: 1, type: "content", title: "About Our School", key: "about_intro" }],
          isHome: true,
        }
      : normalizedPages.find((page) => page._id === selectedPageId) || normalizedPages[0];

  useEffect(() => {
    if (selectedPageId === "home") return;
    if (!selectedPage && normalizedPages.length > 0) {
      setSelectedPageId(normalizedPages[0]._id);
    }
  }, [normalizedPages, selectedPage, selectedPageId]);

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
            <button
              onClick={() => setSelectedPageId("home")}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm ${
                selectedPageId === "home" ? "bg-[#eef4ff] text-[#1c4ed8]" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4" />
                <span className="font-medium">Home</span>
              </div>
              <span className="text-xs text-slate-400">1</span>
            </button>

            {normalizedPages.map((page) => (
              <button
                key={page._id}
                onClick={() => setSelectedPageId(page._id)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm ${
                  selectedPageId === page._id ? "bg-[#eef4ff] text-[#1c4ed8]" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">{page.title}</span>
                </div>
                <span className="text-xs text-slate-400">{page.sections.length}</span>
              </button>
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
            <button
              onClick={() => {
                if (selectedPage?.isHome) navigate("/home-editor");
                else if (selectedPage?._id) navigate(`/page-builder/${selectedPage._id}`);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Block
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {selectedSections.length === 0 ? (
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
                  <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (selectedPage?.isHome) navigate("/home-editor");
                      else if (selectedPage?._id) navigate(`/page-builder/${selectedPage._id}`);
                    }}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button className="rounded-lg p-2 text-slate-300 hover:bg-slate-50 hover:text-slate-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {!selectedPage?.isHome && selectedPage?._id && (
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
