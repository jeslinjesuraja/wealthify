# backend/app/routers/funds.py
from fastapi import APIRouter, Query, HTTPException
from psycopg2.extras import RealDictCursor
from typing import Optional
from app.database import get_db_connection

router = APIRouter()

@router.get("/fund-purchases")
def get_fund_purchases(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """
    Mutual Fund-wise Summary per Investor
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    query = """
        SELECT 
            scheme, 
            inv_name, 
            pan, 
            SUM(amount) as total_amount, 
            SUM(units) as total_units
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
        
    query += " GROUP BY scheme, inv_name, pan ORDER BY scheme, inv_name"
    
    try:
        cursor.execute(query, params)
        results = cursor.fetchall()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.get("/funds")
def get_funds(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """
    Mutual Fund Summary (weighted average NAV)
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    query = """
        SELECT 
            scheme, 
            SUM(amount) as total_amount, 
            SUM(units) as total_units,
            CASE WHEN SUM(units) > 0 THEN SUM(amount) / SUM(units) ELSE 0 END as avg_nav
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
        
    query += " GROUP BY scheme ORDER BY total_amount DESC"
    
    try:
        cursor.execute(query, params)
        results = cursor.fetchall()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()
