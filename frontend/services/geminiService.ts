import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

const getClient = () => {
  if (!client && process.env.API_KEY) {
    client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return client;
};

export const generateAuditResponse = async (
  prompt: string, 
  context: string = ""
): Promise<string> => {
  const ai = getClient();
  if (!ai) {
    return `[系统: 模拟后端模式]
    
**LangGraph 执行追踪:**
1. 节点: **意图分类器** -> '合规性检查'
2. 节点: **图谱查询生成器** -> 已生成 Cypher 语句
3. 节点: **Neo4j执行器** -> 检索到 5 个相关节点

**生成的 Cypher 查询语句:**
\`\`\`cypher
MATCH (c:Control)-[:MITIGATES]->(r:Risk)
WHERE c.id STARTS WITH 'A.9'
RETURN c, r
\`\`\`

**审计响应:**
基于 Neo4j 知识图谱的检索结果，关于 "${prompt}" 的查询关联到 **ISO 27001 控制项 A.9 (访问控制)**。
图谱分析显示存在一个高危风险 **R-001** (管理员账号缺少 MFA)，该风险违反了此控制项要求。
    `;
  }

  try {
    // We inject simulated "Graph Context" into the system prompt so the LLM acts like it has access to Neo4j.
    const systemInstruction = `
      你叫 "AuditGraph"，是一个基于 LangGraph 和 Neo4j 的高级审计助手。
      
      你的架构:
      1. 你是 GraphRAG 工作流中的 "生成器 (Generator)" 节点。
      2. 你已经从 "Neo4j 检索器 (Retriever)" 节点接收了上下文数据。
      
      任务:
      - 专业地回答用户的审计问题。
      - **关键**: 你必须编造并展示一个有效的 Neo4j CYPHER 查询语句，表明是“用来”查找这个答案的。请将其放在代码块中。
      - 引用 "节点 (Nodes)" 和 "关系 (Relationships)" (例如: "控制项节点 A.9 通过 MITIGATES 关系连接到风险节点 R-001")。
      
      上下文数据 (模拟的图谱检索结果):
      - 控制项: A.9 访问控制
      - 控制项: A.12 操作安全
      - 风险: R-001 (缺少 MFA), R-002 (备份失败)
      - 证据: 密码策略.pdf, 服务器日志
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "未生成响应。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "与 AI 智能体通信时发生错误。";
  }
};