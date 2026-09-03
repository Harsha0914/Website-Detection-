from sqlalchemy import text
from app.database import engine, Base
from app.models import whatsapp, business, user, conversation

# 1. Create all missing tables
Base.metadata.create_all(bind=engine)

# 2. Add columns if not already present
with engine.connect() as conn:
    cols_conv = [
        ("lead_status", "TEXT DEFAULT 'CONTACTED'"),
        ("unread_count", "INTEGER DEFAULT 0"),
        ("human_takeover", "BOOLEAN DEFAULT 0"),
        ("business_details_extracted", "TEXT DEFAULT '{}'")
    ]
    for col, col_type in cols_conv:
        try:
            conn.execute(text(f"ALTER TABLE whatsapp_conversations ADD COLUMN {col} {col_type}"))
            print(f"Added {col} to whatsapp_conversations")
        except Exception as e:
            print(f"{col} already in whatsapp_conversations or: {e}")

    try:
        conn.execute(text("ALTER TABLE whatsapp_messages ADD COLUMN is_read BOOLEAN DEFAULT 1"))
        print("Added is_read to whatsapp_messages")
    except Exception as e:
        print(f"is_read already in whatsapp_messages or: {e}")

    conn.commit()

print("Schema migration completed successfully via SQLAlchemy engine!")
