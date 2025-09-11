// src/components/RequireRole.jsx
import React from "react";
import { useSelector } from "react-redux";
import { selectRoles } from "../redux/authSlice";

export default function RequireRole({ role, fallback = null, children }) {
  const roles = useSelector(selectRoles);
  if (!roles?.includes(role)) return fallback ?? <div>Erişim yok</div>;
  return <>{children}</>;
}

// Kullanım:
// <RequireRole role="Instructor"><InstructorDashboard /></RequireRole>
