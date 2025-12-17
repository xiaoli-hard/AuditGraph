# AuditGraph - AI 驱动的审计知识图谱

AuditGraph 是一个智能审计助手，利用知识图谱 (Neo4j) 和大型语言模型 (LangGraph) 提供实时风险分析、文档洞察和交互式数据可视化。它架起了非结构化审计文档与结构化风险数据之间的桥梁。

## 🚀 功能特性

- **知识图谱可视化**：交互式图表视图，展示审计实体、风险、控制措施及其相互关系。
- **AI 助手**：基于 LangGraph 的上下文感知聊天界面，支持智能审计查询和推理。
- **风险仪表盘**：实时统计高风险领域、缓解状态和控制措施的有效性。
- **文档分析**：智能解析审计文档并将其链接到知识图谱。
- **风险登记册**：全面跟踪和管理已识别的风险。

## 🛠 技术栈

- **前端**：React 19, TypeScript, Vite, Tailwind CSS, Recharts, Lucide React
- **后端**：Python 3.10+, FastAPI
- **AI & 代理工作流**：LangGraph, LangChain (支持 OpenAI / Google Gemini / 豆包)
- **数据库**：Neo4j (图数据库)

## 📂 项目结构

```
.
├── backend/                # Python FastAPI 后端
│   ├── app/                # 应用源代码
│   │   ├── api/            # API 端点 (REST)
│   │   ├── core/           # 配置与安全设置
│   │   ├── db/             # 数据库连接 (Neo4j)
│   │   ├── langgraph_agent/# LangGraph 代理工作流与逻辑
│   │   ├── scripts/        # 实用脚本 (如数据库填充)
│   │   └── main.py         # 应用入口点
│   ├── .env.example        # 环境变量模板 (需创建 .env)
│   └── requirements.txt    # Python 依赖
├── frontend/               # 前端源代码
│   ├── components/         # React 组件
│   ├── config/             # 应用配置
│   ├── services/           # API 服务
│   └── ...
├── index.html              # 前端入口点
├── package.json            # 前端依赖
└── vite.config.ts          # Vite 配置
```

## 🏁 快速开始

### 先决条件

- **Node.js** (v18 或更高版本)
- **Python** (v3.10 或更高版本)
- **Neo4j 数据库** (Neo4j Desktop 或 AuraDB)
- **API 密钥** (OpenAI, Google Gemini, 或 豆包/火山引擎)

### 1. 后端设置

1. 进入后端目录：
   ```bash
   cd backend
   ```

2. 创建虚拟环境（可选但推荐）：
   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```

3. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```

4. 配置环境变量：
   - 在 `backend` 目录下创建一个 `.env` 文件。
   - 填入你的 Neo4j 凭据和 LLM API 密钥。

   示例 `.env` 内容：
   ```ini
   # Neo4j 设置
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USERNAME=neo4j
   NEO4J_PASSWORD=your_password

   # LLM 设置 (选择一个配置)
   # Google Gemini
   GOOGLE_API_KEY=your_google_api_key
   
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key

   # 豆包 (火山引擎)
   ARK_API_KEY=your_ark_api_key
   DOUBAO_API_KEY=your_doubao_api_key
   DOUBAO_MODEL=doubao-seed-1-6-250615
   ```

5. 填充数据库 (可选)：
   初始化 Neo4j 数据库并写入测试数据：
   ```bash
   python app/scripts/seed_db.py
   ```

6. 启动服务器：
   ```bash
   uvicorn app.main:app --reload
   ```
   API 将在 `http://localhost:8000` 运行。API 文档可在 `http://localhost:8000/docs` 查看。

### 2. 前端设置

1. 返回项目根目录：
   ```bash
   cd ..
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 配置数据源 (可选)：
   默认情况下，前端会尝试连接后端 API。如果你想使用本地模拟数据运行前端（无需后端），请修改 `frontend/config/index.ts`：
   ```typescript
   export const USE_MOCK_DATA = true; // 设置为 true 启用模拟数据
   ```

4. 启动开发服务器：
   ```bash
   npm run dev
   ```
   应用通常会在 `http://localhost:5173` 运行。

## 📝 许可证

MIT
