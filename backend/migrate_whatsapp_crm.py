import sqlite3

def run_migration():
    conn = sqlite3.connect("shop_presence.db")
    cursor = conn.cursor()
    cols_conv = [
        ("lead_status", "TEXT DEFAULT 'CONTACTED'"),
        ("unread_count", "INTEGER DEFAULT 0"),
        ("human_takeover", "BOOLEAN DEFAULT 0"),
        ("business_details_extracted", "TEXT DEFAULT '{}'")
    ]
    for col, col_type in cols_conv:
        try:
            cursor.execute(f"ALTER TABLE whatsapp_conversations ADD COLUMN {col} {col_type}")
            print(f"Added {col} to whatsapp_conversations")
        except Exception as e:
            print(f"{col} exists or info:", e)

    try:
        cursor.execute("ALTER TABLE whatsapp_messages ADD COLUMN is_read BOOLEAN DEFAULT 1")
        print("Added is_read to whatsapp_messages")
    except Exception as e:
        print("is_read exists or info:", e)

    conn.commit()
    conn.close()
    print("WhatsApp CRM schema migration completed successfully!")

if __name__ == "__main__":
    run_migration()
