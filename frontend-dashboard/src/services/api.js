import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({ baseURL: API_URL, timeout: 10000 });

export async function getHealth() { const response = await api.get("/"); return response.data; }
export async function getAnalyticsSummary(source = "all") { const response = await api.get(`/analytics/summary?source=${source}`); return response.data; }
export async function getSentimentAnalytics(source = "all") { const response = await api.get(`/analytics/sentiment?source=${source}`); return response.data; }
export async function getTopicsAnalytics(source = "all") { const response = await api.get(`/analytics/topics?source=${source}`); return response.data; }
export async function getTrendsAnalytics(source = "all") { const response = await api.get(`/analytics/trends?source=${source}`); return response.data; }
export async function getTimelineAnalytics(source = "all") { return getTrendsAnalytics(source); }
export async function getTopPoliticalPosts(source = "all") { const response = await api.get(`/analytics/top-political?limit=10&source=${source}`); return response.data; }
export async function getRelevantPosts(source = "all") { return getTopPoliticalPosts(source); }
export async function getAvailableSources() { const response = await api.get("/analytics/sources"); return response.data; }
export async function ingestRssNews() { const response = await api.post("/rss/ingest"); return response.data; }
export async function getGeoAnalytics(source = "all") { const response = await api.get(`/analytics/geo?source=${source}`); return response.data; }
export async function getPlatformSummary() { const response = await api.get("/analytics/platform-summary"); return response.data; }
export async function getRecentPosts(source = "all") { const response = await api.get(`/posts/recent?source=${source}&limit=15`); return response.data; }
export async function getCrisisAnalytics(source = "all") { const response = await api.get(`/analytics/crisis?source=${source}`); return response.data; }
export async function getNarrativeAnalytics(source = "all") { const response = await api.get(`/analytics/narratives?source=${source}`); return response.data; }
export async function getEmergingTopics(source = "all") { const response = await api.get(`/analytics/emerging-topics?source=${source}`); return response.data; }
export async function getConfiguredRssFeeds() { const response = await api.get("/rss/feeds"); return response.data; }

function intelligenceParams({ source = "all", projectId = null, windowHours = 24, baselineDays = 30 } = {}) {
  const params = { source, window_hours: windowHours, baseline_days: baselineDays };
  if (projectId) params.project_id = projectId;
  return params;
}

export async function getTemporalIntelligence(options = {}) {
  const response = await api.get("/intelligence/v2/temporal", { params: intelligenceParams(options) });
  return response.data;
}

export async function getCrisisIntelligenceV2(options = {}) {
  const response = await api.get("/intelligence/v2/crisis", { params: intelligenceParams(options) });
  return response.data;
}

export async function getGeoIntelligenceV2({ source = "all", projectId = null, windowHours = 168 } = {}) {
  const params = { source, window_hours: windowHours };
  if (projectId) params.project_id = projectId;
  const response = await api.get("/intelligence/v2/geo", { params });
  return response.data;
}

export async function getNarrativeIntelligenceV2({ source = "all", projectId = null } = {}) {
  const params = { source };
  if (projectId) params.project_id = projectId;
  const response = await api.get("/intelligence/v2/narratives", { params });
  return response.data;
}

export async function getIntelligenceBrief(options = {}) {
  const response = await api.get("/intelligence/v2/brief", { params: intelligenceParams(options) });
  return response.data;
}

export async function getIntelligenceEvidence({ source = "all", projectId = null, topic = null, territory = null, limit = 25 } = {}) {
  const params = { source, limit };
  if (projectId) params.project_id = projectId;
  if (topic) params.topic = topic;
  if (territory) params.territory = territory;
  const response = await api.get("/intelligence/v2/evidence", { params });
  return response.data;
}

export async function getMonitoringProjects() { const response = await api.get("/projects"); return response.data; }
export async function createMonitoringProject(payload) { const response = await api.post("/projects", payload); return response.data; }
export async function updateMonitoringProject(projectId, payload) { const response = await api.put(`/projects/${projectId}`, payload); return response.data; }
export async function deleteMonitoringProject(projectId) { const response = await api.delete(`/projects/${projectId}`); return response.data; }
