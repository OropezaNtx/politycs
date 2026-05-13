import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

export async function getHealth() {
  const response = await api.get("/");
  return response.data;
}

export async function getAnalyticsSummary(source = "all") {
  const response = await api.get(
    `/analytics/summary?source=${source}`
  );

  return response.data;
}

export async function getSentimentAnalytics(source = "all") {
  const response = await api.get(
    `/analytics/sentiment?source=${source}`
  );

  return response.data;
}

export async function getTopicsAnalytics(source = "all") {
  const response = await api.get(
    `/analytics/topics?source=${source}`
  );

  return response.data;
}

export async function getTrendsAnalytics(source = "all") {
  const response = await api.get(
    `/analytics/trends?source=${source}`
  );

  return response.data;
}

export async function getTimelineAnalytics(source = "all") {
  const response = await api.get(
    `/analytics/trends?source=${source}`
  );

  return response.data;
}

export async function getTopPoliticalPosts(source = "all") {
  const response = await api.get(
    `/analytics/top-political?limit=10&source=${source}`
  );

  return response.data;
}

export async function getRelevantPosts(source = "all") {
  return getTopPoliticalPosts(source);
}

export async function getAvailableSources() {
  const response = await api.get("/analytics/sources");
  return response.data;
}


export async function ingestRssNews() {
  const response = await api.post("/rss/ingest");
  return response.data;
}