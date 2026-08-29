import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

const api = axios.create({ baseURL: BASE_URL, timeout: 20000 });

export async function generateFeasibilityReport({ location, ownCapital, businessCategory, language }) {
  const { data } = await api.post("/feasibility/generate", {
    location,
    ownCapital: Number(ownCapital),
    businessCategory,
    language,
  });
  return data;
}

export default api;
