import React from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  FileText,
  FolderOpen,
  Image,
  Megaphone,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listAdmissions, listGalleries, listNotices, listPages } from "@/api/adminClient";

const statCards = [
  { key: "applications", label: "Applications", icon: Users, color: "bg-[#3b82f6]" },
  { key: "notices", label: "Notices", icon: Bell, color: "bg-[#22c55e]" },
  { key: "media", label: "Media Files", icon: FolderOpen, color: "bg-[#a855f7]" },
  { key: "pages", label: "Page Sections", icon: FileText, color: "bg-[#f97316]" },
];

export default function AdminDashboard() {
  const { data: admissions = [] } = useQuery({
    queryKey: ["admissions"],
    queryFn: listAdmissions,
  });
  const { data: notices = [] } = useQuery({
    queryKey: ["notices"],
    queryFn: listNotices,
  });
  const { data: images = [] } = useQuery({
    queryKey: ["galleryImages"],
    queryFn: listGalleries,
  });
  const { data: pages = [] } = useQuery({
    queryKey: ["pages"],
    queryFn: listPages,
  });

  const values = {
    applications: admissions.length,
    notices: notices.length,
    media: images.length,
    pages: pages.reduce(
      (count, page) => count + (Array.isArray(page.sections) ? page.sections.length : 0),
      0
    ),
  };

  const pendingApplications = admissions.filter((item) => item.status === "pending").slice(0, 4);

  const quickLinks = [
    {
      label: "Page Builder",
      desc: "Edit custom page blocks",
      icon: FileText,
      to: "/page-builder",
      color: "text-[#5b8def]",
    },
    {
      label: "Banners",
      desc: "Manage home page banners",
      icon: Image,
      to: "/banners",
      color: "text-[#f59e0b]",
    },
    {
      label: "Gallery",
      desc: "Manage home gallery photos",
      icon: FolderOpen,
      to: "/gallery",
      color: "text-[#a855f7]",
    },
    {
      label: "Media Library",
      desc: "Browse all uploaded media",
      icon: Megaphone,
      to: "/media-library",
      color: "text-[#22c55e]",
    },
  ];

  return (
    <div className="space-y-7">
      <h2 className="text-[34px] font-bold tracking-[-0.03em] text-slate-900">Dashboard</h2>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.key}
            className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
          >
            <div className="flex items-start justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.color}`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
              <span className="text-slate-300">-&gt;</span>
            </div>
            <div className="mt-10">
              <p className="text-4xl font-bold text-slate-900">{values[card.key]}</p>
              <p className="mt-2 text-sm font-medium text-slate-500">{card.label}</p>
              <p className="mt-1 text-xs text-slate-400">
                {card.key === "applications"
                  ? `${pendingApplications.length} pending`
                  : `In ${card.label.toLowerCase()}`}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_0.8fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between">
            <h3 className="text-[26px] font-bold tracking-[-0.03em] text-slate-900">
              Recent Applications
            </h3>
            <Link to="/admissions" className="text-sm font-semibold text-[#4b74e6]">
              View all -&gt;
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {pendingApplications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-500">
                No pending applications right now.
              </div>
            ) : (
              pendingApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef4ff] text-sm font-semibold text-[#4b74e6]">
                      {(app.student_name || "A").charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{app.student_name}</p>
                      <p className="text-sm text-slate-500">
                        {app.class_applying} · {app.father_name || "Parent not set"}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#fff7d6] px-3 py-1 text-xs font-semibold text-[#d39b09]">
                    {app.status || "pending"}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <h3 className="text-[26px] font-bold tracking-[-0.03em] text-slate-900">Quick Actions</h3>

          <div className="mt-5 space-y-3">
            {quickLinks.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="flex items-center gap-4 rounded-2xl border border-slate-100 px-4 py-4 transition hover:bg-slate-50"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{item.label}</p>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
                <span className="text-slate-300">-&gt;</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
