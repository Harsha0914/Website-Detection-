import sys
import os
import shutil

# Ensure backend directory is in sys.path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(root_dir, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# On Vercel serverless environment, copy shop.db to /tmp/shop.db
if os.environ.get("VERCEL"):
    tmp_db = "/tmp/shop.db"
    for candidate in [os.path.join(root_dir, "shop.db"), os.path.join(backend_dir, "shop.db")]:
        if os.path.exists(candidate) and not os.path.exists(tmp_db):
            try:
                shutil.copy2(candidate, tmp_db)
                break
            except Exception as e:
                print(f"Error copying SQLite db to /tmp: {e}")

from app.main import app
