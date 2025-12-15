import { USE_MOCK_DATA, ENDPOINTS } from '../config/index';
import { generateAuditResponse as generateMockResponse } from './geminiService';
import { GraphData } from '../types/index';
import { MOCK_GRAPH_DATA } from '../data/constants';

// Interface for what the frontend expects
export interface AuditServiceResponse {
  answer: string;
  steps?: { node: string; status: string; detail: string }[];
}

/**
 * Chat with the Audit Agent
 */
export const sendAuditMessage = async (message: string): Promise<string> => {
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
    return data.response; // Assuming backend returns { response: "..." }
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
    // Simulate network delay for realism
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