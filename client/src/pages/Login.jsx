import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "../assets/css/login.css"

const Login = () => {
  const [nim, setNim] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", { nim, password });
      login(res.data.token);
      Swal.fire("Berhasil", "Login sukses!", "success");
      if (res.data.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/users");
      }
    } catch (err) {
      Swal.fire("Gagal", err.response?.data?.message || "Login gagal!", "error");
    }
  };

  return (
    <div className="LoginPage">
      <form
        onSubmit={handleSubmit}
        className="box"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Login E-Voting</h2>

        <div className="contents">
          <img src="/HIMATIF.png" className="brand" />
          <div className="features">
            <input
              type="text"
              placeholder="Masukkan NIM"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              className="input"
              required
            />
            <input
              type="text"
              placeholder="Masukan Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              required
            />
            <button
              type="submit"
              className="input input-submit"
            >
              Login
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Login;