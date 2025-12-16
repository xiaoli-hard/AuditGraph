// Toggle this to false when you have your Python FastAPI backend running
export const USE_MOCK_DATA = false;

export const API_BASE_URL = "http://localhost:8000/api";

export const ENDPOINTS = {
  CHAT: `${API_BASE_URL}/chat`,
  GRAPH: `${API_BASE_URL}/graph`,
  DOCUMENTS: `${API_BASE_URL}/documents`,
  RISKS: `${API_BASE_URL}/risks`,
  DASHBOARD_STATS: `${API_BASE_URL}/dashboard/stats`,
};
