import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu, Plus } from "lucide-react";
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

  const createMutation = useMutation({
    mutationFn: createPage,
    onSuccess: (page) => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      setIsCreateOpen(false);
      setForm(defaultForm);
      setError("");
      navigate(`/pages/${page._id}`);
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
    <div className="flex min-h-screen bg-slate-100 relative">
      <AdminSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
        />
      )}

      <div className="flex-1">
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200 px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileOpen(true)} className="lg:hidden">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-[#1E3A8A] font-semibold">
                School CMS
              </p>
              <h1 className="text-xl font-bold text-slate-900">Dynamic Page Builder</h1>
            </div>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#1E3A8A] px-5 py-3 text-white font-semibold hover:bg-[#173074]"
          >
            <Plus className="h-4 w-4" />
            Add Page
          </button>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-slate-900">Create New Page</h2>
            <p className="mt-2 text-slate-600">
              Add the title and slug first. The multi-step form opens immediately after creation.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Title</label>
                <input
                  type="text"
                  maxLength={50}
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1E3A8A]"
                  placeholder="About Campus"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#1E3A8A]"
                  placeholder="about-campus"
                  required
                />
              </div>
            </div>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  setError("");
                }}
                className="rounded-2xl border border-slate-200 px-5 py-3 font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-2xl bg-[#1E3A8A] px-5 py-3 font-semibold text-white hover:bg-[#173074] disabled:opacity-60"
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
