import { useContext } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../assets/css/admin.css";

const AdminDashboard = () => {
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <div className="admin-container">
            <div className="admin-sidebar">
                <h2>Admin Panel</h2>
                <button onClick={() => navigate("/admin/create-voting")}>Buat Voting</button>
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
