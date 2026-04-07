import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  Eye,
  FileImage,
  FileText,
  FolderOpen,
  GalleryHorizontal,
  LayoutDashboard,
  LogOut,
  Megaphone,
  PanelLeftClose,
  Settings,
  Users,
} from "lucide-react";

function getWebsiteUrl() {
  if (typeof window === "undefined") return "/";
  const { protocol, hostname, port, origin } = window.location;
  if (hostname === "localhost" && port === "5174") {
    return `${protocol}//${hostname}:5173/`;
  }
  return `${origin.replace(":5174", ":5173").replace(/\/$/, "")}/`;
}

function GroupLabel({ children, isCollapsed }) {
  if (isCollapsed) return null;
  return (
    <p className="px-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/35">
      {children}
    </p>
  );
}

function NavItem({ to, icon: Icon, label, isActive, isCollapsed, onClick, trailingDot = false }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
        isActive
          ? "bg-[#101f3d] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
          : "text-white/72 hover:bg-white/6 hover:text-white"
      }`}
    >
      <Icon className={`h-4.5 w-4.5 flex-shrink-0 ${isActive ? "text-[#f6c945]" : "text-white/55"}`} />
      {!isCollapsed && (
        <>
          <span className="truncate">{label}</span>
          {trailingDot && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#f6c945]" />}
        </>
      )}
    </Link>
  );
}

export default function AdminSidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) {
  const location = useLocation();

  const contentLinks = [
    { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
    { label: "Page Builder", icon: FileText, to: "/page-builder" },
    { label: "Banners", icon: FileImage, to: "/banners" },
    { label: "Notices", icon: Megaphone, to: "/notices" },
    { label: "Gallery", icon: GalleryHorizontal, to: "/gallery" },
    { label: "Media Library", icon: FolderOpen, to: "/media-library" },
  ];

  const siteLinks = [
    { label: "Admissions", icon: Users, to: "/admissions" },
    { label: "Navigation", icon: Settings, to: "/navigation" },
    { label: "Settings", icon: Settings, to: "/settings" },
  ];

  const isActive = (path) => {
    if (path === "/page-builder") {
      return location.pathname === "/page-builder" || location.pathname.startsWith("/page-builder/");
    }
    return location.pathname === path;
  };

  const handleViewWebsite = () => {
    window.open(getWebsiteUrl(), "_blank", "noopener,noreferrer");
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/10 bg-[#081425] text-white transition-transform duration-300 lg:sticky lg:translate-x-0 ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      } ${isCollapsed ? "w-[92px]" : "w-[235px]"}`}
    >
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f6b400] shadow-[0_10px_22px_rgba(246,180,0,0.28)]">
              <span className="text-base font-bold text-[#09172d]">G</span>
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="truncate text-[17px] font-semibold">MPS Admin</h1>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">CMS Panel</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsMobileOpen(false)}
            className="rounded-xl p-2 text-white/55 hover:bg-white/6 hover:text-white lg:hidden"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden rounded-xl p-2 text-white/55 hover:bg-white/6 hover:text-white lg:block"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-4 py-5">
        <div className="space-y-6">
          <div className="space-y-2">
            <GroupLabel isCollapsed={isCollapsed}>Overview</GroupLabel>
            {contentLinks.map((item) => (
              <NavItem
                key={item.label}
                {...item}
                isActive={isActive(item.to)}
                isCollapsed={isCollapsed}
                trailingDot={item.label === "Dashboard" || item.label === "Page Builder"}
                onClick={() => setIsMobileOpen(false)}
              />
            ))}
          </div>

          <div className="space-y-2">
            <GroupLabel isCollapsed={isCollapsed}>Site Config</GroupLabel>
            {siteLinks.map((item) => (
              <NavItem
                key={item.label}
                {...item}
                isActive={isActive(item.to)}
                isCollapsed={isCollapsed}
                onClick={() => setIsMobileOpen(false)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4">
        <button
          onClick={handleViewWebsite}
          className="mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/72 transition hover:bg-white/6 hover:text-white"
        >
          <Eye className="h-4.5 w-4.5 text-white/55" />
          {!isCollapsed && <span>View Website</span>}
        </button>
        <button
          onClick={() => {
            localStorage.removeItem("admin_token");
            window.location.href = "/login";
          }}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#ff9aa3] transition hover:bg-[#ff5d6c]/10"
        >
          <LogOut className="h-4.5 w-4.5" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
