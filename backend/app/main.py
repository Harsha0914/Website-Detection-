# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from slowapi import Limiter, _rate_limit_exceeded_handler
# pyrefly: ignore [missing-import]
from slowapi.util import get_remote_address
# pyrefly: ignore [missing-import]
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import engine, Base
import app.models  # Ensure all models are registered with Base

from app.routers import (
    auth,
    users,
    businesses,
    searches,
    website,
    chat,
    admin,
    whatsapp,
    ai_whatsapp_hub,
)

# Initialize database tables on startup
Base.metadata.create_all(bind=engine)

def _ensure_sqlite_columns():
    try:
        # Only run on SQLite
        if not str(engine.url).startswith("sqlite"):
            return
        # pyrefly: ignore [missing-import]
        from sqlalchemy import text
        with engine.connect() as conn:
            # Check businesses columns
            result = conn.execute(text("PRAGMA table_info(businesses)"))
            columns = [row[1] for row in result.fetchall()]
            if columns:
                if "short_address" not in columns:
                    conn.execute(text("ALTER TABLE businesses ADD COLUMN short_address VARCHAR(255)"))
                if "google_maps_uri" not in columns:
                    conn.execute(text("ALTER TABLE businesses ADD COLUMN google_maps_uri VARCHAR(500)"))
            
            # Check whatsapp_conversations columns
            res_c = conn.execute(text("PRAGMA table_info(whatsapp_conversations)"))
            c_cols = [row[1] for row in res_c.fetchall()]
            if c_cols:
                if "owner_name" not in c_cols:
                    conn.execute(text("ALTER TABLE whatsapp_conversations ADD COLUMN owner_name VARCHAR(255)"))
                if "lead_score" not in c_cols:
                    conn.execute(text("ALTER TABLE whatsapp_conversations ADD COLUMN lead_score INTEGER DEFAULT 20"))
                if "detected_intent" not in c_cols:
                    conn.execute(text("ALTER TABLE whatsapp_conversations ADD COLUMN detected_intent VARCHAR(50) DEFAULT 'UNKNOWN'"))
                if "sentiment" not in c_cols:
                    conn.execute(text("ALTER TABLE whatsapp_conversations ADD COLUMN sentiment VARCHAR(20) DEFAULT 'NEUTRAL'"))
                if "priority" not in c_cols:
                    conn.execute(text("ALTER TABLE whatsapp_conversations ADD COLUMN priority VARCHAR(20) DEFAULT 'MEDIUM'"))
                if "conversation_status" not in c_cols:
                    conn.execute(text("ALTER TABLE whatsapp_conversations ADD COLUMN conversation_status VARCHAR(50) DEFAULT 'AI_ACTIVE'"))
                if "assigned_user_id" not in c_cols:
                    conn.execute(text("ALTER TABLE whatsapp_conversations ADD COLUMN assigned_user_id INTEGER"))
                if "follow_up_date" not in c_cols:
                    conn.execute(text("ALTER TABLE whatsapp_conversations ADD COLUMN follow_up_date DATETIME"))
                if "follow_up_note" not in c_cols:
                    conn.execute(text("ALTER TABLE whatsapp_conversations ADD COLUMN follow_up_note TEXT"))
                if "opt_out" not in c_cols:
                    conn.execute(text("ALTER TABLE whatsapp_conversations ADD COLUMN opt_out BOOLEAN DEFAULT 0"))

            # Check whatsapp_messages columns
            res_m = conn.execute(text("PRAGMA table_info(whatsapp_messages)"))
            m_cols = [row[1] for row in res_m.fetchall()]
            if m_cols:
                if "intent" not in m_cols:
                    conn.execute(text("ALTER TABLE whatsapp_messages ADD COLUMN intent VARCHAR(50)"))
                if "confidence_score" not in m_cols:
                    conn.execute(text("ALTER TABLE whatsapp_messages ADD COLUMN confidence_score FLOAT DEFAULT 0.85"))
                if "ai_generated" not in m_cols:
                    conn.execute(text("ALTER TABLE whatsapp_messages ADD COLUMN ai_generated BOOLEAN DEFAULT 0"))
                if "tokens_used" not in m_cols:
                    conn.execute(text("ALTER TABLE whatsapp_messages ADD COLUMN tokens_used INTEGER DEFAULT 0"))

            conn.commit()
    except Exception as e:
        print(f"Database column migration note: {e}")

_ensure_sqlite_columns()

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Nearby Grocery & Shop Website Presence Detection Platform API",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list + [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://localhost:8001",
        "http://localhost",
        "http://127.0.0.1",
        "https://vercel.com",
    ],
    allow_origin_regex=r"https://.*(\.vercel\.app|\.pages\.dev|\.onrender\.com)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(businesses.router)
app.include_router(searches.router)
app.include_router(website.router)
app.include_router(chat.router)
app.include_router(admin.router)
app.include_router(whatsapp.router)
app.include_router(ai_whatsapp_hub.router)

@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "docs": "/docs"
    }

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

