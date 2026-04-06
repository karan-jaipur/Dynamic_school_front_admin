import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import AdminLayout from "./components/admin/AdminLayout.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import AdminAdmissions from "./components/AdminAdmissions.jsx";
import AdminBanners from "./components/AdminBanners.jsx";
import AdminGallery from "./components/AdminGallery.jsx";
import AdminHome from "./components/AdminHome.jsx";
import AdminHomePage from "./components/AdminHomePage.jsx";
import AdminNavigation from "./components/AdminNavigation.jsx";
import AdminNotices from "./components/AdminNotices.jsx";
import AdminPageEditor from "./components/AdminPageEditor.jsx";
import AdminSettings from "./components/AdminSettings.jsx";
import AdminPages from "./components/AdminPages.jsx";
import Login from "./components/Login.jsx";

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="home" element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="admissions" element={<AdminAdmissions />} />
        <Route path="notices" element={<AdminNotices />} />
        <Route path="page-builder" element={<AdminHome />} />
        <Route path="page-builder/:pageId" element={<AdminPageEditor />} />
        <Route path="pages" element={<AdminPages />} />
        <Route path="home-editor" element={<AdminHomePage />} />
        <Route path="gallery" element={<AdminGallery mode="gallery" />} />
        <Route path="media-library" element={<AdminGallery mode="library" />} />
        <Route path="banners" element={<AdminBanners />} />
        <Route path="navigation" element={<AdminNavigation />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="pages/:pageId" element={<AdminPageEditor />} />
      </Route>
    </Routes>
  );
};

export default App;
