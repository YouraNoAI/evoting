import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

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
        navigate("/votings");
      }
    } catch (err) {
      Swal.fire("Gagal", err.response?.data?.message || "Login gagal!", "error");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-md w-80"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Login E-Voting</h2>

        <input
          type="text"
          placeholder="Masukkan NIM"
          value={nim}
          onChange={(e) => setNim(e.target.value)}
          className="border w-full p-2 rounded mb-3"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border w-full p-2 rounded mb-3"
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;