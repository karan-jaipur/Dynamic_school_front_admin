import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AdminSidebar from "./AdminSidebar";
import { createPage } from "@/api/adminClient";

const defaultForm = {
  title: "",
  slug: "",
};

export default function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    const openHandler = () => setIsCreateOpen(true);
    window.addEventListener("open-admin-create-page", openHandler);
    return () => window.removeEventListener("open-admin-create-page", openHandler);
  }, []);

  const createMutation = useMutation({
    mutationFn: createPage,
    onSuccess: (page) => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      setIsCreateOpen(false);
      setForm(defaultForm);
      setError("");
      navigate(`/page-builder/${page._id}`);
    },
    onError: (mutationError) => {
      setError(mutationError.message || "Unable to create page.");
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    createMutation.mutate(form);
  };

  return (
    <div className="min-h-screen bg-[#eef3ff]">
      <div className="flex min-h-screen">
        <AdminSidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        {isMobileOpen && (
          <div
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-slate-950/45 z-30 lg:hidden"
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 p-4 sm:p-6">
            <div className="mb-4 lg:hidden">
              <button
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm"
                onClick={() => setIsMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
            <Outlet />
          </main>
        </div>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-[28px] border border-white/60 bg-white p-7 shadow-[0_30px_80px_rgba(15,23,42,0.28)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[28px] font-bold text-slate-900">New Page</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter a title and slug to create a new CMS page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-500"
              >
                Cancel
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Page Title</label>
                <input
                  type="text"
                  maxLength={50}
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-[#2563eb]"
                  placeholder="About"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-[#2563eb]"
                  placeholder="about"
                  required
                />
              </div>
            </div>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-2xl border border-slate-200 px-5 py-3 font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-2xl bg-[#2563eb] px-5 py-3 font-semibold text-white disabled:opacity-60"
              >
                {createMutation.isPending ? "Creating..." : "Create Page"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
