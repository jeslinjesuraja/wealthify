# backend/app/database.py
import os
import psycopg2
from psycopg2.extras import RealDictCursor

# Resolve path to the backend/ root directory and read local .env file
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(base_dir, ".env")

if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            # Skip empty lines, comments, or lines without '='
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip()

# Use DATABASE_URL from environment (Render default), fallback to local default
DB_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:AcademyRootPassword@localhost:5432/wealthify")

# Rewrite "postgres://" to "postgresql://" if needed (Render PostgreSQL URL format)
if DB_URL.startswith("postgres://"):
    DB_URL = DB_URL.replace("postgres://", "postgresql://", 1)

def get_db_connection():
    """
    Creates and returns a connection to the PostgreSQL database.
    """
    return psycopg2.connect(DB_URL)
