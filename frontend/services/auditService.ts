import { ENDPOINTS, API_BASE_URL } from '../config/index';
import { GraphData, AuditStat, RiskItem, Document, RegulationClause, AuditReport, UserAccount } from '../types/index';

// 前端期望的响应接口
export interface AuditServiceResponse {
  answer: string;
  steps?: { node: string; status: string; detail: string }[];
}

const TOKEN_KEY = 'auditgraph_token';

export const setAuthToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearAuthToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const getAuthToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

const buildAuthHeaders = (headers?: HeadersInit) => {
  const token = getAuthToken();
  return {
    ...(headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const fetchWithAuth = (input: RequestInfo, init?: RequestInit) => {
  return fetch(input, {
    ...init,
    headers: buildAuthHeaders(init?.headers)
  });
};

/**
 * 与审计智能体对话
 */
export const sendAuditMessage = async (message: string): Promise<string | AuditServiceResponse> => {
  try {
    console.log("[模式: 真实] 调用后端 API...");
    const response = await fetchWithAuth(ENDPOINTS.CHAT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) throw new Error("后端 API 调用失败");
    
    const data = await response.json();
    // 如果包含步骤则返回完整对象，否则仅返回响应字符串
    if (data.steps) return data;
    return data.response; 
  } catch (error) {
    console.error("API 错误:", error);
    return "错误: 无法连接到 Python 后端。请确保 FastAPI 已在端口 8000 运行。";
  }
};

/**
 * 获取图谱数据 (Neo4j)
 */
export const fetchGraphData = async (): Promise<GraphData> => {
  try {
    const response = await fetchWithAuth(ENDPOINTS.GRAPH);
    if (!response.ok) throw new Error("图谱 API 调用失败");
    return await response.json();
  } catch (error) {
    console.error("API 错误:", error);
    return { nodes: [], links: [] };
  }
};

/**
 * 获取仪表盘统计数据
 */
export const fetchDashboardStats = async (): Promise<{ 
  compliance: AuditStat[], 
  risk_distribution: AuditStat[],
  summary: { total_nodes: number; total_documents: number }
}> => {
  try {
    const response = await fetchWithAuth(ENDPOINTS.DASHBOARD_STATS);
    if (!response.ok) throw new Error("统计 API 调用失败");
    return await response.json();
  } catch (error) {
    console.error("API 错误:", error);
    return { compliance: [], risk_distribution: [], summary: { total_nodes: 0, total_documents: 0 } };
  }
};

/**
 * 导出日志
 * 修改为直接触发浏览器下载
 */
export const exportLogs = async (): Promise<void> => {
  try {
    // Add timestamp to prevent caching
    const response = await fetchWithAuth(`${ENDPOINTS.EXPORT_LOGS}?t=${new Date().getTime()}`);
    if (!response.ok) throw new Error("导出日志 API 调用失败");
    
    // 获取 Blob 数据
    const blob = await response.blob();
    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Get filename from header or fallback
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = "system_audit.log";
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }
    
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error("API 错误:", error);
    throw error;
  }
};

/**
 * 启动全量审计
 */
export const startFullAudit = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(ENDPOINTS.START_AUDIT, {
      method: 'POST',
    });
    if (!response.ok) throw new Error("启动审计 API 调用失败");
    return await response.json();
  } catch (error) {
    console.error("API 错误:", error);
    return { message: "启动失败" };
  }
};

/**
 * 获取审计状态
 */
export const getAuditStatus = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(ENDPOINTS.AUDIT_STATUS);
    if (!response.ok) throw new Error("获取审计状态失败");
    return await response.json();
  } catch (error) {
    console.error("API 错误:", error);
    return { status: "unknown", progress: 0 };
  }
};

/**
 * 获取风险列表
 */
export const fetchRisks = async (params?: {
  search?: string;
  severity?: string;
  status?: string;
  category?: string;
  sort?: string;
}): Promise<RiskItem[]> => {
  try {
    const query = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') acc[key] = value;
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    const response = await fetchWithAuth(query ? `${ENDPOINTS.RISKS}?${query}` : ENDPOINTS.RISKS);
    if (!response.ok) throw new Error("风险 API 调用失败");
    return await response.json();
  } catch (error) {
    console.error("API 错误:", error);
    return [];
  }
};

export const createRisk = async (payload: {
  title: string;
  description: string;
  severity: RiskItem['severity'];
  category?: string;
  owner?: string;
}): Promise<RiskItem> => {
  const response = await fetchWithAuth(ENDPOINTS.RISKS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("新增风险失败");
  return await response.json();
};

/**
 * 生成修复建议 (AI)
 */
export const generateRemediationSuggestion = async (riskId: string): Promise<RiskItem> => {
  try {
    const response = await fetchWithAuth(`${ENDPOINTS.RISKS}/${riskId}/generate-suggestion`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error("生成修复建议失败");
    return await response.json();
  } catch (error) {
    console.error("API 错误:", error);
    throw error;
  }
};

/**
 * 保存修复建议 (Manual)
 */
export const saveRemediationSuggestion = async (riskId: string, suggestion: string): Promise<RiskItem> => {
  try {
    const response = await fetchWithAuth(`${ENDPOINTS.RISKS}/${riskId}/suggestion`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestion }),
    });
    if (!response.ok) throw new Error("保存修复建议失败");
    return await response.json();
  } catch (error) {
    console.error("API 错误:", error);
    throw error;
  }
};

/**
 * 启动风险修复流程
 */
export const remediateRisk = async (riskId: string): Promise<void> => {
  try {
    const response = await fetchWithAuth(`${ENDPOINTS.RISKS}/${riskId}/remediate`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error("启动修复流程失败");
  } catch (error) {
    console.error("API 错误:", error);
    throw error;
  }
};

/**
 * 标记风险为误报
 */
export const markFalsePositive = async (riskId: string): Promise<void> => {
  try {
    const response = await fetchWithAuth(`${ENDPOINTS.RISKS}/${riskId}/false-positive`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error("标记误报失败");
  } catch (error) {
    console.error("API 错误:", error);
    throw error;
  }
};

/**
 * 获取文档列表
 */
export const fetchDocuments = async (search?: string): Promise<Document[]> => {
  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await fetchWithAuth(`${ENDPOINTS.DOCUMENTS}${query}`);
    if (!response.ok) throw new Error("文档 API 调用失败");
    return await response.json();
  } catch (error) {
    console.error("API 错误:", error);
    return [];
  }
};

export const uploadDocuments = async (files: File[]): Promise<Document[]> => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const response = await fetchWithAuth(`${ENDPOINTS.DOCUMENTS}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error("上传文档失败");
  return await response.json();
};

export const downloadDocument = async (docId: string): Promise<void> => {
  const response = await fetchWithAuth(`${ENDPOINTS.DOCUMENTS}/${docId}/download`);
  if (!response.ok) throw new Error("下载文档失败");
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  const disposition = response.headers.get('Content-Disposition');
  const filename = disposition?.match(/filename="?([^"]+)"?/i)?.[1] || `${docId}`;
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const deleteDocument = async (docId: string): Promise<void> => {
  const response = await fetchWithAuth(`${ENDPOINTS.DOCUMENTS}/${docId}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error("删除文档失败");
};

/**
 * 获取法规树
 */
export const fetchRegulations = async (): Promise<RegulationClause[]> => {
  try {
    const response = await fetchWithAuth(ENDPOINTS.REGULATIONS);
    if (!response.ok) throw new Error("法规 API 调用失败");
    return await response.json();
  } catch (error) {
    console.error("API 错误:", error);
    return [];
  }
};

/**
 * 获取法规详情 (关联的风险和证据)
 */
export const fetchRegulationDetails = async (id: string): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${ENDPOINTS.REGULATIONS}/${id}/details`);
    if (!response.ok) throw new Error("法规详情 API 调用失败");
    return await response.json();
  } catch (error) {
    console.error("API 错误:", error);
    return null;
  }
};

/**
 * 获取审计报告
 */
export const fetchReports = async (): Promise<AuditReport[]> => {
  try {
    const response = await fetchWithAuth(ENDPOINTS.REPORTS);
    if (!response.ok) throw new Error("报告 API 调用失败");
    return await response.json();
  } catch (error) {
    console.error("API 错误:", error);
    return [];
  }
};

export const createReport = async (payload?: {
  title?: string;
  summary?: string;
  status?: string;
  findingsCount?: number;
}): Promise<AuditReport> => {
  const response = await fetchWithAuth(ENDPOINTS.REPORTS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  if (!response.ok) throw new Error("生成报告失败");
  return await response.json();
};

export const downloadReport = async (reportId: string): Promise<void> => {
  const response = await fetchWithAuth(`${ENDPOINTS.REPORTS}/${reportId}/download`);
  if (!response.ok) throw new Error("下载报告失败");
  const data = await response.json();
  const blob = new Blob([data.content], { type: "text/plain;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = data.filename || `${reportId}.txt`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const exportSystemLogs = async (): Promise<void> => {
  const response = await fetchWithAuth(`${ENDPOINTS.DASHBOARD_STATS.replace('/stats','')}/export-logs?t=${new Date().getTime()}`);
  if (!response.ok) throw new Error("导出日志失败");
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = "system_audit.log";
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const fetchSettings = async (): Promise<{
  modelName: string;
  temperature: number;
  maxTokens: number;
  retrievalTopK: number;
  useGraphRAG: boolean;
}> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/settings`);
  if (!response.ok) throw new Error("获取设置失败");
  return await response.json();
};

export const saveSettings = async (payload: {
  modelName: string;
  temperature: number;
  maxTokens: number;
  retrievalTopK: number;
  useGraphRAG: boolean;
}): Promise<{
  modelName: string;
  temperature: number;
  maxTokens: number;
  retrievalTopK: number;
  useGraphRAG: boolean;
}> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("保存设置失败");
  return await response.json();
};

export const login = async (username: string, password: string): Promise<string> => {
  const params = new URLSearchParams();
  params.set('username', username);
  params.set('password', password);
  const response = await fetch(ENDPOINTS.AUTH_LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });
  if (!response.ok) throw new Error("登录失败");
  const data = await response.json();
  setAuthToken(data.access_token);
  return data.access_token;
};

export const register = async (payload: {
  username: string;
  password: string;
  full_name?: string;
  email?: string;
}): Promise<UserAccount> => {
  const response = await fetch(ENDPOINTS.AUTH_REGISTER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error("注册失败");
  return await response.json();
};

export const fetchCurrentUser = async (): Promise<UserAccount> => {
  const response = await fetchWithAuth(ENDPOINTS.AUTH_ME);
  if (!response.ok) throw new Error("获取用户信息失败");
  return await response.json();
};

export const listUsers = async (): Promise<UserAccount[]> => {
  const response = await fetchWithAuth(ENDPOINTS.USERS);
  if (!response.ok) throw new Error("获取用户列表失败");
  return await response.json();
};

export const createUser = async (payload: {
  username: string;
  password: string;
  full_name?: string;
  email?: string;
  role?: 'admin' | 'user';
}): Promise<UserAccount> => {
  const response = await fetchWithAuth(ENDPOINTS.USERS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error("创建用户失败");
  return await response.json();
};

export const updateUser = async (username: string, payload: {
  full_name?: string;
  email?: string;
  role?: 'admin' | 'user';
  disabled?: boolean;
  password?: string;
}): Promise<UserAccount> => {
  const response = await fetchWithAuth(`${ENDPOINTS.USERS}/${username}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error("更新用户失败");
  return await response.json();
};

export const deleteUser = async (username: string): Promise<void> => {
  const response = await fetchWithAuth(`${ENDPOINTS.USERS}/${username}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error("删除用户失败");
};

export const startEtl = async (): Promise<{ status: string }> => {
  const response = await fetchWithAuth(`${ENDPOINTS.ETL}/run`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error("启动ETL失败");
  return await response.json();
};

export const getEtlStatus = async (): Promise<{
  status: string;
  progress: number;
  current_step: string;
  logs: string[];
  last_run_at?: string | null;
}> => {
  const response = await fetchWithAuth(`${ENDPOINTS.ETL}/status`);
  if (!response.ok) throw new Error("获取ETL状态失败");
  return await response.json();
};
