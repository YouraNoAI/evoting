import axios from "axios";

export const BASE_URL = "http://192.168.1.8:4000"; // tinggal ubah ini pas hosting

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
