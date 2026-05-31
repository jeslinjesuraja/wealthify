# backend/database.py
import psycopg2
from psycopg2.extras import RealDictCursor

# Database Connection details
DB_URL = "postgresql://postgres:AcademyRootPassword@localhost:5432/wealthify"

def get_db_connection():
    """
    Creates and returns a raw connection to the PostgreSQL database.
    """
    return psycopg2.connect(DB_URL)


    