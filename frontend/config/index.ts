// API 基础 URL
export const API_BASE_URL = "http://localhost:8000/api";

// API 端点配置
export const ENDPOINTS = {
  CHAT: `${API_BASE_URL}/chat`,           // 聊天
  GRAPH: `${API_BASE_URL}/graph`,         // 图谱数据
  DOCUMENTS: `${API_BASE_URL}/documents`, // 文档列表
  RISKS: `${API_BASE_URL}/risks`,         // 风险列表
  DASHBOARD_STATS: `${API_BASE_URL}/dashboard/stats`, // 仪表盘统计
  EXPORT_LOGS: `${API_BASE_URL}/dashboard/export-logs`, // 导出日志
  START_AUDIT: `${API_BASE_URL}/dashboard/start-audit`, // 启动审计
  AUDIT_STATUS: `${API_BASE_URL}/dashboard/audit-status`, // 审计状态
  REGULATIONS: `${API_BASE_URL}/regulations`, // 法规树
  REPORTS: `${API_BASE_URL}/reports`, // 审计报告
  AUTH_LOGIN: `${API_BASE_URL}/auth/login`,
  AUTH_REGISTER: `${API_BASE_URL}/auth/register`,
  AUTH_ME: `${API_BASE_URL}/auth/me`,
  USERS: `${API_BASE_URL}/users`,
  ETL: `${API_BASE_URL}/etl`
};
