// 将此项设置为 false 以启用后端 Python FastAPI 服务
export const USE_MOCK_DATA = false;

// API 基础 URL
export const API_BASE_URL = "http://localhost:8000/api";

// API 端点配置
export const ENDPOINTS = {
  CHAT: `${API_BASE_URL}/chat`,           // 聊天
  GRAPH: `${API_BASE_URL}/graph`,         // 图谱数据
  DOCUMENTS: `${API_BASE_URL}/documents`, // 文档列表
  RISKS: `${API_BASE_URL}/risks`,         // 风险列表
  DASHBOARD_STATS: `${API_BASE_URL}/dashboard/stats`, // 仪表盘统计
};
