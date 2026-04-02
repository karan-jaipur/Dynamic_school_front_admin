import React from "react";
import { ArrowUpDown, Eye, EyeOff, FileText } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listPages, updatePage } from "@/api/adminClient";

export default function AdminHome() {
  const queryClient = useQueryClient();
  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["pages"],
    queryFn: listPages,
  });

  const mutation = useMutation({
    mutationFn: ({ id, data }) => updatePage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
    },
  });

  if (isLoading) {
    return <div className="rounded-3xl bg-white p-8 shadow-sm">Loading pages...</div>;
  }

  const normalizedPages = pages.map((page) => ({
    ...page,
    sections: Array.isArray(page.sections) ? page.sections : [],
    order: Number(page.order || 1),
    is_active: Boolean(page.is_active),
  }));

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1E3A8A]">
          Home Page
        </p>
        <h2 className="mt-3 text-3xl font-bold text-slate-900">
          Home is fixed and always visible
        </h2>
        <p className="mt-3 max-w-3xl text-slate-600">
          Manage created pages here. You can reorder pages, toggle active state, and decide what appears in the user navbar.
        </p>
      </section>

      <section className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Created Pages</h3>
            <p className="mt-2 text-slate-600">
              Pages show in the user panel only when active and when they already have sections.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Total pages: <span className="font-semibold text-slate-900">{normalizedPages.length}</span>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {normalizedPages.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
              <FileText className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3">No custom pages yet. Use "Add Page" in the header to create one.</p>
            </div>
          )}

          {normalizedPages.map((page) => (
            <div
              key={page._id}
              className="grid gap-4 rounded-2xl border border-slate-200 p-5 lg:grid-cols-[1.6fr_0.8fr_0.8fr_0.8fr]"
            >
              <div>
                <h4 className="text-lg font-semibold text-slate-900">{page.title}</h4>
                <p className="mt-1 text-sm text-slate-500">/{page.slug}</p>
                <p className="mt-2 text-sm text-slate-600">
                  Sections: <span className="font-semibold">{page.sections.length}</span>
                </p>
              </div>

              <label className="rounded-2xl bg-slate-50 px-4 py-3">
                <span className="text-xs uppercase tracking-[0.15em] text-slate-500">Order</span>
                <div className="mt-2 flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-slate-400" />
                  <input
                    type="number"
                    min="1"
                    value={page.order}
                    onChange={(event) =>
                      mutation.mutate({
                        id: page._id,
                        data: { order: Number(event.target.value) || page.order },
                      })
                    }
                    className="w-full bg-transparent outline-none"
                  />
                </div>
              </label>

              <label className="rounded-2xl bg-slate-50 px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-[0.15em] text-slate-500">Active</span>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {page.is_active ? "Visible" : "Hidden"}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={page.is_active}
                  onChange={(event) =>
                    mutation.mutate({
                      id: page._id,
                      data: { is_active: event.target.checked },
                    })
                  }
                  className="h-5 w-5 accent-[#1E3A8A]"
                />
              </label>

              <div className="rounded-2xl bg-slate-50 px-4 py-3 flex items-center gap-3">
                {page.is_active ? (
                  <Eye className="h-5 w-5 text-emerald-600" />
                ) : (
                  <EyeOff className="h-5 w-5 text-slate-400" />
                )}
                <div>
                  <span className="text-xs uppercase tracking-[0.15em] text-slate-500">Status</span>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {page.is_active && page.sections.length > 0
                      ? "Shown in user panel"
                      : "Not shown in user panel"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
