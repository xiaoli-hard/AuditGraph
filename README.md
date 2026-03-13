# AuditGraph AI - 智能审计知识图谱系统

AuditGraph AI 是一个企业级智能审计助手，深度融合了**知识图谱 (Neo4j)** 与 **大语言模型 (LangGraph/LangChain)** 技术。它能够将非结构化的审计文档（如法规、控制项、证据）转化为结构化的图谱数据，提供实时的风险分析、合规性监控以及基于上下文的智能问答能力。

## 🚀 核心功能模块

### 审计用户功能模块
- **登录注册与安全认证**：支持用户注册、登录、Token 鉴权、密码加密存储（Neo4j）、前端路由保护。
- **审计全景仪表盘**：实时展示合规率统计、风险分布图表、知识图谱概览、实时日志动态。
- **知识图谱可视化交互**：基于 D3.js 实现力导向图，支持节点筛选、缩放、拖拽及详情查看。
- **智能审计助手问答**：集成 LangGraph Agent，支持流式对话、多跳推理及图谱查询 (`query_graph`)。
- **法规与文档溯源**：
    - **法规**：树状浏览法规条款及关联控制项。
    - **文档**：支持文件上传、下载、搜索及删除管理。
- **风险评估与报告**：
    - **风险管理**：风险项的增删改查、状态流转及 AI 生成修复建议。
    - **报告生成**：自动生成审计报告并支持下载。

### 系统后台管理模块
- **管理员登录与权限控制**：区分 Admin/User 角色，管理员拥有专属管理面板及高级操作权限。
- **数据导入与处理**：提供一键运行 ETL 功能，支持实时查看数据导入进度与构建日志。
- **大模型服务配置**：支持在线修改 AI 模型参数（模型选择、温度、TopK、RAG 开关）并持久化存储。
- **系统日志与运行监控**：实时监控数据库与 API 连接状态，支持导出系统运行日志。

## 🛠 技术架构

### 前端 (Frontend)
- **核心框架**: React 19, TypeScript
- **构建工具**: Vite
- **UI 组件库**: Tailwind CSS, Lucide React
- **可视化**: Recharts (统计图表), D3.js (图谱渲染)
- **状态管理**: React Hooks
- **路由管理**: React Router (带权限保护)

### 后端 (Backend)
- **API 框架**: Python FastAPI
- **AI 编排**: LangGraph, LangChain
- **图数据库驱动**: Neo4j Python Driver
- **数据处理**: Pandas
- **认证安全**: OAuth2 + JWT + BCrypt
- **任务调度**: BackgroundTasks (ETL)

### 数据设施
- **图数据库**: Neo4j (存储实体关系与用户数据)
- **大模型支持**: Google Gemini / 豆包 (火山引擎) / OpenAI

## 📂 项目结构

```
.
├── backend/                # Python FastAPI 后端
│   ├── app/
│   │   ├── api/            # REST API 端点 (Auth, Chat, Dashboard, Graph, Users, ETL)
│   │   ├── core/           # 系统配置与安全鉴权
│   │   ├── db/             # Neo4j 数据库连接层
│   │   ├── langgraph_agent/# AI Agent 核心逻辑 (RAG, Graph RAG)
│   │   ├── scripts/        # ETL 数据导入脚本
│   │   └── main.py         # 应用入口
│   ├── data/               # 初始审计数据源 (CSV)
│   ├── Dockerfile          # 后端容器构建文件
│   └── requirements.txt    # Python 依赖清单
├── frontend/               # React 前端工程
│   ├── components/         # 业务组件 (Dashboard, Chat, Settings, RiskRegister)
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
    DOUBAO_MODEL=doubao-seed-1-6-250615
    
    # 安全配置
    SECRET_KEY=your_secret_key_for_jwt
    
    # 管理员初始化配置
    ADMIN_USERNAME=admin
    ADMIN_PASSWORD=admin
    ADMIN_EMAIL=admin@example.com
    ```

4.  启动后端服务：
    ```bash
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    ```
    *注：首次启动会自动检查并创建默认管理员账号，ETL 数据导入可在前端“系统配置”页面操作。*
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
    访问地址: `http://localhost:5173` (或 3000，视 Vite 配置而定)

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

- **真实数据模式**：项目已完全移除 Mock 数据，前端所有请求均直接连接后端 API。
- **默认账号**：系统初始化后，默认管理员账号为 `admin` / `admin`。请登录后及时修改密码。
- **ETL 数据初始化**：初次部署后，请使用管理员账号登录，进入“系统配置”页面，点击“运行 ETL”以初始化图谱数据。

##   许可证

个人毕业项目，请勿用于商业行为！！！！！
