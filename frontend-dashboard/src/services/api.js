import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

export async function getHealth() {
  const response = await api.get("/health");
  return response.data;
}

export async function getAnalyticsSummary() {
  const response = await api.get("/analytics/summary");
  return response.data;
}

export async function getSentimentAnalytics() {
  const response = await api.get("/analytics/sentiment");
  return response.data;
}

export async function getTopicsAnalytics() {
  const response = await api.get("/analytics/topics");
  return response.data;
}

export async function getTrendsAnalytics() {
  const response = await api.get("/analytics/trends");
  return response.data;
}

export async function getTopPoliticalPosts() {
  const response = await api.get("/analytics/top-political");
  return response.data;
}
