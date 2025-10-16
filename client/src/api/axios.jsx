import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
  withCredentials: true, // kalo pake cookie
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // atau sessionStorage
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
