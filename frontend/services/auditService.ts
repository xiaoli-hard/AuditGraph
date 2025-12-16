import { USE_MOCK_DATA, ENDPOINTS } from '../config/index';
import { generateAuditResponse as generateMockResponse } from './geminiService';
import { GraphData, AuditStat, RiskItem, Document } from '../types/index';
import { MOCK_GRAPH_DATA, COMPLIANCE_STATS, RISK_STATS, MOCK_RISKS, MOCK_DOCUMENTS } from '../data/constants';

// Interface for what the frontend expects
export interface AuditServiceResponse {
  answer: string;
  steps?: { node: string; status: string; detail: string }[];
}

/**
 * Chat with the Audit Agent
 */
export const sendAuditMessage = async (message: string): Promise<string | AuditServiceResponse> => {
  if (USE_MOCK_DATA) {
    console.log("[Mode: MOCK] Generating local simulation...");
    return await generateMockResponse(message);
  }

  try {
    console.log("[Mode: REAL] Calling Backend API...");
    const response = await fetch(ENDPOINTS.CHAT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) throw new Error("Backend API Failed");
    
    const data = await response.json();
    // Return full object if it has steps, or just response string
    if (data.steps) return data;
    return data.response; 
  } catch (error) {
    console.error("API Error:", error);
    return "Error: Could not connect to Python Backend. Please ensure FastAPI is running on port 8000.";
  }
};

/**
 * Fetch Graph Data (Neo4j)
 */
export const fetchGraphData = async (): Promise<GraphData> => {
  if (USE_MOCK_DATA) {
    await new Promise(r => setTimeout(r, 500));
    return MOCK_GRAPH_DATA as unknown as GraphData;
  }

  try {
    const response = await fetch(ENDPOINTS.GRAPH);
    if (!response.ok) throw new Error("Graph API Failed");
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return { nodes: [], links: [] };
  }
};

/**
 * Fetch Dashboard Stats
 */
export const fetchDashboardStats = async (): Promise<{ compliance: AuditStat[], risk_distribution: AuditStat[] }> => {
  if (USE_MOCK_DATA) {
    await new Promise(r => setTimeout(r, 500));
    return { compliance: COMPLIANCE_STATS, risk_distribution: RISK_STATS };
  }

  try {
    const response = await fetch(ENDPOINTS.DASHBOARD_STATS);
    if (!response.ok) throw new Error("Stats API Failed");
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return { compliance: [], risk_distribution: [] };
  }
};

/**
 * Fetch Risks
 */
export const fetchRisks = async (): Promise<RiskItem[]> => {
  if (USE_MOCK_DATA) {
    await new Promise(r => setTimeout(r, 500));
    return MOCK_RISKS;
  }

  try {
    const response = await fetch(ENDPOINTS.RISKS);
    if (!response.ok) throw new Error("Risks API Failed");
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
};

/**
 * Fetch Documents
 */
export const fetchDocuments = async (): Promise<Document[]> => {
  if (USE_MOCK_DATA) {
    await new Promise(r => setTimeout(r, 500));
    return MOCK_DOCUMENTS;
  }

  try {
    const response = await fetch(ENDPOINTS.DOCUMENTS);
    if (!response.ok) throw new Error("Documents API Failed");
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
};
