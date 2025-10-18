import { useContext, useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const AdminDashboard = () => {
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // jika path persis /admin (belum punya nested route), redirect ke results
        if (location.pathname === "/admin" || location.pathname === "/admin/") {
            navigate("/admin/results", { replace: true });
        }
    }, [location.pathname, navigate]);

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <div className="admin-container">
            <div className="admin-sidebar">
                <h2>Admin Panel</h2>
                <button onClick={() => navigate("/admin/results")}>Lihat Hasil Voting</button>
                <button onClick={() => navigate("/admin/users")}>Edit User</button>
                <button onClick={handleLogout}>Logout</button>
            </div>
            <div className="admin-contents">
                <Outlet/>
            </div>
        </div>

    );
};

export default AdminDashboard;