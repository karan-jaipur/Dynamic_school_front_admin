import React, { useEffect, useState } from "react";
import {
  Globe,
  Mail,
  MapPin,
  Palette,
  Phone,
  Save,
  Search,
  Sparkles,
  Upload,
  UserCircle2,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSettings, updateSettings } from "@/api/adminClient";

const tabs = [
  { key: "general", label: "General", icon: Globe },
  { key: "principal", label: "Principal", icon: UserCircle2 },
  { key: "contact", label: "Contact", icon: MapPin },
  { key: "social", label: "Social", icon: Sparkles },
  { key: "theme", label: "Theme", icon: Palette },
];

const themes = [
  { name: "Royal Blue", primary: "#1E3A8A", secondary: "#3b82f6", accent: "#FACC15", text: "#0f172a" },
  { name: "Forest Green", primary: "#166534", secondary: "#22c55e", accent: "#facc15", text: "#102a1b" },
  { name: "Deep Purple", primary: "#4c1d95", secondary: "#7c3aed", accent: "#fbbf24", text: "#1f1147" },
  { name: "Crimson Red", primary: "#7F1D1D", secondary: "#DC2626", accent: "#FDE68A", text: "#3f1010" },
  { name: "Slate Gray", primary: "#334155", secondary: "#64748b", accent: "#f59e0b", text: "#111827" },
];

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[#2563eb] ${className}`}
    />
  );
}

function TextArea({ className = "", ...props }) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[#2563eb] ${className}`}
    />
  );
}

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const queryClient = useQueryClient();
  const { data: savedSettings } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: getSettings,
  });

  useEffect(() => {
    if (savedSettings && typeof savedSettings === "object") {
      setSettings(savedSettings);
      setLogoFile(null);
      setFaviconFile(null);
    }
  }, [savedSettings]);

  const mutation = useMutation({
    mutationFn: (data) => updateSettings(data, { logoFile, faviconFile }),
    onSuccess: () => {
      setSaving(false);
      setSaveError("");
      setSaveMessage("Settings saved successfully.");
      queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
      setLogoFile(null);
      setFaviconFile(null);
    },
    onError: (error) => {
      setSaving(false);
      setSaveMessage("");
      setSaveError(error?.message || "Failed to save settings.");
    },
  });

  const updateField = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleImageUpload = (key, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (key === "logo") setLogoFile(file);
    if (key === "favicon") setFaviconFile(file);
    updateField(key, url);
  };

  const clearImage = (key) => {
    if (key === "logo") setLogoFile(null);
    if (key === "favicon") setFaviconFile(null);
    updateField(key, "");
  };

  const handleSave = () => {
    setSaving(true);
    setSaveMessage("");
    setSaveError("");
    mutation.mutate(settings);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[34px] font-bold tracking-[-0.03em] text-slate-900">Theme & Settings</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save All"}
        </button>
      </div>

      {(saveMessage || saveError) && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            saveError ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {saveError || saveMessage}
        </div>
      )}

      <div className="inline-flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ${
              activeTab === tab.key ? "bg-slate-50 text-slate-900 shadow-sm" : "text-slate-500"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
        {activeTab === "general" && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-900">General Settings</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="School Name">
                <TextInput
                  value={settings.school_name || ""}
                  onChange={(e) => updateField("school_name", e.target.value)}
                  placeholder="Malhotra Public School"
                />
              </Field>
              <Field label="Tagline">
                <TextInput
                  value={settings.tagline || ""}
                  onChange={(e) => updateField("tagline", e.target.value)}
                  placeholder="Learning Today, Leading Tomorrow"
                />
              </Field>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Field label="School Logo">
                <div className="flex items-center gap-4">
                  {settings.logo ? (
                    <div className="relative">
                      <img src={settings.logo} alt="Logo" className="h-24 w-24 rounded-2xl object-cover border border-slate-200" />
                      <button
                        type="button"
                        onClick={() => clearImage("logo")}
                        className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
                      <Upload className="h-4 w-4" />
                      Upload Logo
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload("logo", e)} />
                    </label>
                  )}
                </div>
              </Field>
              <Field label="Favicon">
                <div className="flex items-center gap-4">
                  {settings.favicon ? (
                    <div className="relative">
                      <img src={settings.favicon} alt="Favicon" className="h-16 w-16 rounded-xl object-cover border border-slate-200" />
                      <button
                        type="button"
                        onClick={() => clearImage("favicon")}
                        className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
                      <Upload className="h-4 w-4" />
                      Upload Favicon
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload("favicon", e)} />
                    </label>
                  )}
                </div>
              </Field>
            </div>
          </div>
        )}

        {activeTab === "principal" && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-900">Principal Details</h3>
            <Field label="Principal Name">
              <TextInput placeholder="Dr. Rakesh Sharma" />
            </Field>
            <Field label="Qualification">
              <TextInput placeholder="Ph.D. in Education" />
            </Field>
            <Field label="Principal Message">
              <TextArea rows={4} placeholder="Education is the most powerful weapon..." />
            </Field>
            <Field label="Principal Photo">
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                  <Upload className="h-5 w-5" />
                </div>
                <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Library</button>
                <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Upload</button>
              </div>
            </Field>
          </div>
        )}

        {activeTab === "contact" && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-900">Contact Details</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Phone">
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <TextInput className="pl-11" value={settings.phone || ""} onChange={(e) => updateField("phone", e.target.value)} placeholder="+91 9876543210" />
                </div>
              </Field>
              <Field label="Email">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <TextInput className="pl-11" value={settings.email || ""} onChange={(e) => updateField("email", e.target.value)} placeholder="info@school.edu" />
                </div>
              </Field>
            </div>
            <Field label="Address">
              <TextArea rows={3} value={settings.address || ""} onChange={(e) => updateField("address", e.target.value)} placeholder="School address..." />
            </Field>
            <Field label="Google Maps Embed URL">
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <TextInput className="pl-11" value={settings.map_embed || ""} onChange={(e) => updateField("map_embed", e.target.value)} placeholder="https://www.google.com/maps/embed?..." />
              </div>
            </Field>
          </div>
        )}

        {activeTab === "social" && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-900">Social Links</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Facebook">
                <TextInput value={settings.facebook || ""} onChange={(e) => updateField("facebook", e.target.value)} placeholder="https://facebook.com/..." />
              </Field>
              <Field label="Instagram">
                <TextInput value={settings.instagram || ""} onChange={(e) => updateField("instagram", e.target.value)} placeholder="https://instagram.com/..." />
              </Field>
              <Field label="Twitter / X">
                <TextInput value={settings.twitter || ""} onChange={(e) => updateField("twitter", e.target.value)} placeholder="https://twitter.com/..." />
              </Field>
              <Field label="YouTube">
                <TextInput value={settings.youtube || ""} onChange={(e) => updateField("youtube", e.target.value)} placeholder="https://youtube.com/..." />
              </Field>
            </div>
          </div>
        )}

        {activeTab === "theme" && (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Color Theme</h3>
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                {themes.map((theme) => {
                  const isSelected =
                    settings.primary_color === theme.primary &&
                    settings.accent_color === theme.accent &&
                    (settings.text_color || "#0f172a") === theme.text;
                  return (
                    <button
                      key={theme.name}
                      onClick={() => {
                        updateField("primary_color", theme.primary);
                        updateField("accent_color", theme.accent);
                        updateField("text_color", theme.text);
                      }}
                      className={`rounded-[22px] border p-4 text-left ${
                        isSelected ? "border-[#7ba6ff] bg-[#eef4ff]" : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex gap-2">
                        <span className="h-6 w-6 rounded-full" style={{ backgroundColor: theme.primary }} />
                        <span className="h-6 w-6 rounded-full" style={{ backgroundColor: theme.secondary }} />
                        <span className="h-6 w-6 rounded-full" style={{ backgroundColor: theme.accent }} />
                      </div>
                      <p className="mt-4 font-semibold text-slate-800">{theme.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[24px] border border-dashed border-slate-200 p-5">
              <p className="font-semibold text-slate-800">Custom Colors</p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <Field label="Primary">
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-3 py-3">
                    <input type="color" value={settings.primary_color || "#1E3A8A"} onChange={(e) => updateField("primary_color", e.target.value)} className="h-8 w-8 rounded" />
                    <input value={settings.primary_color || "#1E3A8A"} onChange={(e) => updateField("primary_color", e.target.value)} className="w-full outline-none" />
                  </div>
                </Field>
                <Field label="Accent">
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-3 py-3">
                    <input type="color" value={settings.accent_color || "#FACC15"} onChange={(e) => updateField("accent_color", e.target.value)} className="h-8 w-8 rounded" />
                    <input value={settings.accent_color || "#FACC15"} onChange={(e) => updateField("accent_color", e.target.value)} className="w-full outline-none" />
                  </div>
                </Field>
                <Field label="Animations">
                  <label className="flex h-[54px] items-center gap-3 rounded-2xl border border-slate-200 px-4">
                    <input
                      type="checkbox"
                      checked={settings.animations_enabled !== "false"}
                      onChange={(e) => updateField("animations_enabled", e.target.checked ? "true" : "false")}
                      className="h-5 w-5 accent-[#2563eb]"
                    />
                    <span className="text-sm font-medium text-slate-700">Enable animations</span>
                  </label>
                </Field>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Text Color">
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-3 py-3">
                    <input type="color" value={settings.text_color || "#0f172a"} onChange={(e) => updateField("text_color", e.target.value)} className="h-8 w-8 rounded" />
                    <input value={settings.text_color || "#0f172a"} onChange={(e) => updateField("text_color", e.target.value)} className="w-full outline-none" />
                  </div>
                </Field>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-slate-900">SEO & Footer</h3>
              <div className="mt-4 space-y-5">
                <Field label="Meta Title">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <TextInput className="pl-11" value={settings.meta_title || ""} onChange={(e) => updateField("meta_title", e.target.value)} placeholder="Malhotra Public School..." />
                  </div>
                </Field>
                <Field label="Meta Description">
                  <TextArea rows={3} value={settings.meta_description || ""} onChange={(e) => updateField("meta_description", e.target.value)} placeholder="Description..." />
                </Field>
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-5 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        {saving ? "Saving..." : "Save All Settings"}
      </button>
    </div>
  );
}
