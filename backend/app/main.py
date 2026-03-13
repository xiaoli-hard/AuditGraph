from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import dashboard, risks, documents, graph, chat, auth, regulations, reports, settings as settings_router, users, etl
from app.api.deps import get_current_user
from app.core import security
from app.core.config import settings as app_settings
from app.db.neo4j_client import neo4j_client

app = FastAPI(title="AuditGraph API")

# Configure CORS
origins = [
    "http://localhost:5173",  # Vite default port
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def ensure_default_admin():
    existing = neo4j_client.get_user(app_settings.ADMIN_USERNAME)
    if not existing:
        neo4j_client.create_user({
            "username": app_settings.ADMIN_USERNAME,
            "password_hash": security.get_password_hash(app_settings.ADMIN_PASSWORD),
            "full_name": app_settings.ADMIN_FULL_NAME,
            "email": app_settings.ADMIN_EMAIL,
            "role": "admin",
            "disabled": False
        })

# Include Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(
    dashboard.router,
    prefix="/api/dashboard",
    tags=["Dashboard"],
    dependencies=[Depends(get_current_user)]
)
app.include_router(
    risks.router,
    prefix="/api/risks",
    tags=["Risks"],
    dependencies=[Depends(get_current_user)]
)
app.include_router(
    documents.router,
    prefix="/api/documents",
    tags=["Documents"],
    dependencies=[Depends(get_current_user)]
)
app.include_router(
    graph.router,
    prefix="/api/graph",
    tags=["Graph"],
    dependencies=[Depends(get_current_user)]
)
app.include_router(
    chat.router,
    prefix="/api/chat",
    tags=["Chat"],
    dependencies=[Depends(get_current_user)]
)
app.include_router(
    regulations.router,
    prefix="/api/regulations",
    tags=["Regulations"],
    dependencies=[Depends(get_current_user)]
)
app.include_router(
    reports.router,
    prefix="/api/reports",
    tags=["Reports"],
    dependencies=[Depends(get_current_user)]
)
app.include_router(
    settings_router.router,
    prefix="/api/settings",
    tags=["Settings"],
    dependencies=[Depends(get_current_user)]
)
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(etl.router, prefix="/api/etl", tags=["ETL"])

@app.get("/")
async def root():
    return {"message": "AuditGraph Backend is Running"}
