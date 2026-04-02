import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FileText, Home, LogOut, PanelLeft, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listPages } from "@/api/adminClient";

export default function AdminSidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) {
  const location = useLocation();
  const { data: pages = [] } = useQuery({
    queryKey: ["pages"],
    queryFn: listPages,
  });

  const items = [
    { label: "Home", icon: Home, to: "/home" },
    ...pages.map((page) => ({
      label: page.title,
      icon: FileText,
      to: `/pages/${page._id}`,
    })),
  ];

  return (
    <aside
      className={`fixed lg:static top-0 left-0 h-screen bg-[#1E3A8A] text-white z-40 transform transition-transform duration-300 ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 ${isCollapsed ? "w-20" : "w-72"}`}
    >
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
            <span className="text-blue-900 font-bold text-lg">M</span>
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-lg leading-none">MPS CMS</h1>
              <p className="text-xs text-gray-300">Home + created pages</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setIsMobileOpen(false)} className="lg:hidden">
            <X className="w-5 h-5" />
          </button>
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden lg:block">
            <PanelLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      <nav className="p-4 space-y-2 overflow-y-auto">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setIsMobileOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
              location.pathname === item.to ? "bg-yellow-400 text-blue-900" : "hover:bg-white/10"
            }`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => {
            localStorage.removeItem("admin_token");
            window.location.href = "/login";
          }}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-red-500/20 transition"
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
