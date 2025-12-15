// Audit Domain Types

export interface AuditStat {
  name: string;
  value: number;
  color: string;
  [key: string]: any;
}

export interface RiskItem {
  id: string;
  title: string;
  severity: 'High' | 'Medium' | 'Low';
  category: string;
  status: 'Open' | 'Mitigated' | 'Closed';
  description: string;
  dateIdentified: string;
  owner: string;
}

// Regulation / Standard Types
export interface RegulationClause {
  id: string;
  code: string;
  title: string;
  description: string;
  children?: RegulationClause[];
}

// Report Types
export interface AuditReport {
  id: string;
  title: string;
  date: string;
  status: 'Draft' | 'Finalized';
  summary: string;
  findingsCount: number;
}

// Graph Visualization Types
export interface GraphNode {
  id: string;
  group: number; // 1: Regulation, 2: Control, 3: Evidence, 4: Risk
  label: string;
  val: number; // Size
}

export interface GraphLink {
  source: string;
  target: string;
  type: string; // relationship label
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// Chat Types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isThinking?: boolean; // To simulate LangGraph "Agent" steps
  steps?: string[]; // Intermediate steps from the agent
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  status: 'Indexed' | 'Processing' | 'Error';
}

// Settings Type
export interface AgentSettings {
  modelName: string;
  temperature: number;
  maxTokens: number;
  retrievalTopK: number;
  useGraphRAG: boolean;
}