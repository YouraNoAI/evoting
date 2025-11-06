import { useContext, useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const AdminDashboard = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/admin" || location.pathname === "/admin/") {
      navigate("/admin/voting-settings", { replace: true });
    } else if (location.pathname === "/user" || location.pathname === "/user/") {
      navigate("/user", { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <h2>Admin Panel</h2>
        <button onClick={() => navigate("/admin/voting-settings")}>Lihat Hasil Voting</button>
        <button onClick={() => navigate("/admin/user-settings")}>Edit User</button>
        <button onClick={handleLogout}>Logout</button>
      </div>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminDashboard;

