// API 基础 URL
export const API_BASE_URL = "http://localhost:8000/api";

// API 端点配置
export const ENDPOINTS = {
  CHAT: `${API_BASE_URL}/chat`,           // 聊天
  GRAPH: `${API_BASE_URL}/graph`,         // 图谱数据
  DOCUMENTS: `${API_BASE_URL}/documents`, // 文档列表
  RISKS: `${API_BASE_URL}/risks`,         // 风险列表
  DASHBOARD_STATS: `${API_BASE_URL}/dashboard/stats`, // 仪表盘统计
  REGULATIONS: `${API_BASE_URL}/regulations`, // 法规树
  REPORTS: `${API_BASE_URL}/reports`, // 审计报告
};
