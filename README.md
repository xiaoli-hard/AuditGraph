# AuditGraph AI - 智能审计知识图谱系统

AuditGraph AI 是一个企业级智能审计助手，深度融合了**知识图谱 (Neo4j)** 与 **大语言模型 (LangGraph/LangChain)** 技术。它能够将非结构化的审计文档（如法规、控制项、证据）转化为结构化的图谱数据，提供实时的风险分析、合规性监控以及基于上下文的智能问答能力。

## 🚀 核心功能

- **全景知识图谱**：交互式可视化展示审计实体（法规、控制、风险、证据）及其多维关联，支持节点穿透与路径分析。
- **智能审计助手**：内置基于 LangGraph 的 AI Agent，具备上下文记忆与推理能力，可回答复杂的审计合规问题。
- **实时风险看板**：基于真实数据驱动的动态仪表盘，实时统计合规率、高危风险分布及系统健康度。
- **自动化 ETL 管道**：提供标准化的数据导入工具，支持将 CSV 等格式的审计源数据自动构建为图谱网络。
- **法规穿透分析**：从法规条款到具体落地控制项及证据链的完整追溯视图。

## 🛠 技术架构

### 前端 (Frontend)
- **核心框架**: React 19, TypeScript
- **构建工具**: Vite
- **UI 组件库**: Tailwind CSS, Lucide React
- **可视化**: Recharts (统计图表), D3.js (图谱渲染)
- **状态管理**: React Hooks

### 后端 (Backend)
- **API 框架**: Python FastAPI
- **AI 编排**: LangGraph, LangChain
- **图数据库驱动**: Neo4j Python Driver
- **数据处理**: Pandas
- **认证安全**: OAuth2 + JWT (后端已就绪)

### 数据设施
- **图数据库**: Neo4j (存储实体关系)
- **大模型支持**: Google Gemini / 豆包 (火山引擎) / OpenAI

## 📂 项目结构

```
.
├── backend/                # Python FastAPI 后端
│   ├── app/
│   │   ├── api/            # REST API 端点 (Auth, Chat, Dashboard, Graph)
│   │   ├── core/           # 系统配置与安全鉴权
│   │   ├── db/             # Neo4j 数据库连接层
│   │   ├── langgraph_agent/# AI Agent 核心逻辑 (RAG, Graph RAG)
│   │   ├── scripts/        # ETL 数据导入脚本
│   │   └── main.py         # 应用入口
│   ├── data/               # 初始审计数据源 (CSV)
│   ├── Dockerfile          # 后端容器构建文件
│   └── requirements.txt    # Python 依赖清单
├── frontend/               # React 前端工程
│   ├── components/         # 业务组件 (Dashboard, Chat, GraphView)
│   ├── services/           # API 调用封装
│   ├── types/              # TypeScript 类型定义
│   ├── Dockerfile          # 前端容器构建文件
│   └── vite.config.ts      # Vite 配置
├── docker-compose.yml      # 容器编排配置
└── README.md               # 项目文档
```

## 🏁 快速开始 (本地开发)

### 前置要求
- **Node.js** (v18+)
- **Python** (v3.10+)
- **Neo4j** (Desktop 或 AuraDB，版本 5.x+)
- **LLM API Key** (Google Gemini 或 豆包)

### 1. 后端设置

1.  进入后端目录并创建虚拟环境：
    ```bash
    cd backend
    python -m venv venv
    # Windows
    .\venv\Scripts\activate
    # macOS/Linux
    source venv/bin/activate
    ```

2.  安装依赖：
    ```bash
    pip install -r requirements.txt
    ```

3.  配置环境变量：
    在 `backend` 目录下创建 `.env` 文件：
    ```ini
    # Neo4j 连接配置
    NEO4J_URI=bolt://localhost:7687
    NEO4J_USERNAME=neo4j
    NEO4J_PASSWORD=your_password

    # LLM API 配置 (以豆包为例)
    ARK_API_KEY=your_volcengine_ark_api_key
    DOUBAO_API_KEY=your_doubao_api_key
    DOUBAO_MODEL=doubao-pro-32k
    
    # 安全配置
    SECRET_KEY=your_secret_key_for_jwt
    ```

4.  **数据初始化 (ETL)**：
    将 CSV 数据导入 Neo4j 数据库（**重要：首次运行前必须执行**）：
    ```bash
    python -m app.scripts.etl_pipeline
    ```
    *注：此脚本会读取 `backend/data/` 下的 `risks.csv`, `controls.csv`, `relationships.csv` 并构建图谱。*

5.  启动后端服务：
    ```bash
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    ```
    API 文档地址: `http://localhost:8000/docs`

### 2. 前端设置

1.  进入前端目录：
    ```bash
    cd frontend
    ```

2.  安装依赖：
    ```bash
    npm install
    ```

3.  启动开发服务器：
    ```bash
    npm run dev
    ```
    访问地址: `http://localhost:3000`

## 🐳 Docker 容器化部署

本项目支持一键 Docker 部署，包含 Neo4j、Backend 和 Frontend 服务。

1.  确保根目录下已配置好 `.env` 文件（参考后端设置中的配置）。
2.  运行 Docker Compose：
    ```bash
    docker-compose up -d --build
    ```
3.  服务访问：
    - **Frontend**: `http://localhost:80`
    - **Backend API**: `http://localhost:8000`
    - **Neo4j Browser**: `http://localhost:7474`

## 📝 开发注意事项

- **真实数据模式**：项目已完全移除 Mock 数据，前端所有请求均直接连接后端 API。请确保后端服务正常运行且 Neo4j 数据库已通过 ETL 脚本填充数据。
- **鉴权模块**：后端已实现 OAuth2 接口 (`/api/login`)，前端鉴权页面尚在开发中。

##   许可证

个人毕业项目，请勿用于商业行为！！！！！