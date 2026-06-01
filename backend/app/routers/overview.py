# backend/app/routers/overview.py
from fastapi import APIRouter, Query, HTTPException
from psycopg2.extras import RealDictCursor
from typing import Optional
from app.database import get_db_connection

router = APIRouter()

@router.get("/overview")
def get_overview(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """
    Overview stats for the selected date range.
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    query = """
        SELECT 
            COALESCE(SUM(amount), 0) as total_invested,
            COALESCE(SUM(units), 0) as total_units,
            COUNT(DISTINCT pan) as total_investors,
            COUNT(DISTINCT scheme) as total_funds
        FROM transactions
    """
    
    params = []
    where_clauses = []
    if start_date:
        where_clauses.append("traddate >= %s")
        params.append(start_date)
    if end_date:
        where_clauses.append("traddate <= %s")
        params.append(f"{end_date} 23:59:59")
        
    if where_clauses:
        query += " WHERE " + " AND ".join(where_clauses)
        
    try:
        cursor.execute(query, params)
        result = cursor.fetchone()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()
