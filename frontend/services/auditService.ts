import { ENDPOINTS } from '../config/index';
import { GraphData, AuditStat, RiskItem, Document, RegulationClause, AuditReport } from '../types/index';

// 前端期望的响应接口
export interface AuditServiceResponse {
  answer: string;
  steps?: { node: string; status: string; detail: string }[];
}

/**
 * 与审计智能体对话
 */
export const sendAuditMessage = async (message: string): Promise<string | AuditServiceResponse> => {
  try {
    console.log("[模式: 真实] 调用后端 API...");
    const response = await fetch(ENDPOINTS.CHAT, {
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
    const response = await fetch(ENDPOINTS.GRAPH);
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
    const response = await fetch(ENDPOINTS.DASHBOARD_STATS);
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
    const response = await fetch(`${ENDPOINTS.EXPORT_LOGS}?t=${new Date().getTime()}`);
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
    const response = await fetch(ENDPOINTS.START_AUDIT, {
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
    const response = await fetch(ENDPOINTS.AUDIT_STATUS);
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
export const fetchRisks = async (): Promise<RiskItem[]> => {
  try {
    const response = await fetch(ENDPOINTS.RISKS);
    if (!response.ok) throw new Error("风险 API 调用失败");
    return await response.json();
  } catch (error) {
    console.error("API 错误:", error);
    return [];
  }
};

/**
 * 生成修复建议 (AI)
 */
export const generateRemediationSuggestion = async (riskId: string): Promise<RiskItem> => {
  try {
    const response = await fetch(`${ENDPOINTS.RISKS}/${riskId}/generate-suggestion`, {
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
    const response = await fetch(`${ENDPOINTS.RISKS}/${riskId}/suggestion`, {
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
    const response = await fetch(`${ENDPOINTS.RISKS}/${riskId}/remediate`, {
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
    const response = await fetch(`${ENDPOINTS.RISKS}/${riskId}/false-positive`, {
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
export const fetchDocuments = async (): Promise<Document[]> => {
  try {
    const response = await fetch(ENDPOINTS.DOCUMENTS);
    if (!response.ok) throw new Error("文档 API 调用失败");
    return await response.json();
  } catch (error) {
    console.error("API 错误:", error);
    return [];
  }
};

/**
 * 获取法规树
 */
export const fetchRegulations = async (): Promise<RegulationClause[]> => {
  try {
    const response = await fetch(ENDPOINTS.REGULATIONS);
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
    const response = await fetch(`${ENDPOINTS.REGULATIONS}/${id}/details`);
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
    const response = await fetch(ENDPOINTS.REPORTS);
    if (!response.ok) throw new Error("报告 API 调用失败");
    return await response.json();
  } catch (error) {
    console.error("API 错误:", error);
    return [];
  }
};
