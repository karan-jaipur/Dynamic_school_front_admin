import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import AdminLayout from "./components/admin/AdminLayout.jsx";
import AdminHome from "./components/AdminHome.jsx";
import AdminPageEditor from "./components/AdminPageEditor.jsx";
import Login from "./components/Login.jsx";

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<AdminHome />} />
        <Route path="pages/:pageId" element={<AdminPageEditor />} />
      </Route>
    </Routes>
  );
};

export default App;
