import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useContext(AuthContext);

  // kalau belum login
  if (!user) return <Navigate to="/" replace />;

  // kalau harus admin tapi user bukan admin
  if (adminOnly && user.role !== "admin") return <Navigate to="/" replace />;

  return children;
};

export default ProtectedRoute; // <- wajib default export
