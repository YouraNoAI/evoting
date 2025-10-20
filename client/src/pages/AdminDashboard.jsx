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
        <div className="border border-black d-flex flex-row" style={{ minHeight: "100vh" }}>
            <div className="d-flex flex-column p-3 border border-3 border-black ">
                <h2>Admin Panel</h2>
                <button className="border border-3 border-black bg-warning m-1" onClick={() => navigate("/admin/voting-settings")}>Lihat Hasil Voting</button>
                <button className="border border-3 border-black bg-warning m-1" onClick={() => navigate("/admin/user-settings")}>Edit User</button>
                <button className="border border-3 border-black bg-warning m-1" onClick={handleLogout} >Logout</button>
            </div>
            <div className="border border-3 border-black flex-grow-1 p-3">
                <Outlet/>
            </div>
        </div>

    );
};

export default AdminDashboard;