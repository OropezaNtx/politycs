import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

export async function getHealth() {
  const response = await api.get("/");
  return response.data;
}

export async function getAnalyticsSummary() {
  const response = await api.get("/analytics/summary");
  return response.data;
}

export async function getRelevantPosts() {
  const response = await api.get("/posts/relevant");
  return response.data;
}

export async function getTrends() {
  const response = await api.get("/analytics/trends");
  return response.data;
}
