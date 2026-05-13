import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

function withSource(source) {
  if (!source || source === "all") {
    return {};
  }

  return {
    params: {
      source,
    },
  };
}

export async function getHealth() {
  const response = await api.get("/health");
  return response.data;
}

export async function getAnalyticsSummary(source = "all") {
  const response = await api.get("/analytics/summary", withSource(source));
  return response.data;
}

export async function getSentimentAnalytics(source = "all") {
  const response = await api.get("/analytics/sentiment", withSource(source));
  return response.data;
}

export async function getTopicsAnalytics(source = "all") {
  const response = await api.get("/analytics/topics", withSource(source));
  return response.data;
}

export async function getTrendsAnalytics(source = "all") {
  const response = await api.get("/analytics/trends", withSource(source));
  return response.data;
}

export async function getTimelineAnalytics(source = "all") {
  const response = await api.get("/analytics/timeline", withSource(source));
  return response.data;
}

export async function getTopPoliticalPosts(source = "all") {
  const response = await api.get(
    "/analytics/top-political",
    withSource(source)
  );
  return response.data;
}