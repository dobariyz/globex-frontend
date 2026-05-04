import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "");

export const getMarketData = async () => {
  const res = await axios.get(`${API_URL}/api/markets/live`);
  return res.data;
};
