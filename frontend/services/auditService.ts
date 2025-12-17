import { USE_MOCK_DATA, ENDPOINTS } from '../config/index';
import { generateAuditResponse as generateMockResponse } from './geminiService';
import { GraphData, AuditStat, RiskItem, Document } from '../types/index';
import { MOCK_GRAPH_DATA, COMPLIANCE_STATS, RISK_STATS, MOCK_RISKS, MOCK_DOCUMENTS } from '../data/constants';

// 前端期望的响应接口
export interface AuditServiceResponse {
  answer: string;
  steps?: { node: string; status: string; detail: string }[];
}

/**
 * 与审计智能体对话
 */
export const sendAuditMessage = async (message: string): Promise<string | AuditServiceResponse> => {
  if (USE_MOCK_DATA) {
    console.log("[模式: 模拟] 生成本地模拟响应...");
    return await generateMockResponse(message);
  }

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
  if (USE_MOCK_DATA) {
    await new Promise(r => setTimeout(r, 500));
    return MOCK_GRAPH_DATA as unknown as GraphData;
  }

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
export const fetchDashboardStats = async (): Promise<{ compliance: AuditStat[], risk_distribution: AuditStat[] }> => {
  if (USE_MOCK_DATA) {
    await new Promise(r => setTimeout(r, 500));
    return { compliance: COMPLIANCE_STATS, risk_distribution: RISK_STATS };
  }

  try {
    const response = await fetch(ENDPOINTS.DASHBOARD_STATS);
    if (!response.ok) throw new Error("统计 API 调用失败");
    return await response.json();
  } catch (error) {
    console.error("API 错误:", error);
    return { compliance: [], risk_distribution: [] };
  }
};

/**
 * 获取风险列表
 */
export const fetchRisks = async (): Promise<RiskItem[]> => {
  if (USE_MOCK_DATA) {
    await new Promise(r => setTimeout(r, 500));
    return MOCK_RISKS;
  }

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
 * 获取文档列表
 */
export const fetchDocuments = async (): Promise<Document[]> => {
  if (USE_MOCK_DATA) {
    await new Promise(r => setTimeout(r, 500));
    return MOCK_DOCUMENTS;
  }

  try {
    const response = await fetch(ENDPOINTS.DOCUMENTS);
    if (!response.ok) throw new Error("文档 API 调用失败");
    return await response.json();
  } catch (error) {
    console.error("API 错误:", error);
    return [];
  }
};
