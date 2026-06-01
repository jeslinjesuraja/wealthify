# backend/app/routers/investors.py
from fastapi import APIRouter, Query, HTTPException
from psycopg2.extras import RealDictCursor
from typing import Optional
from app.database import get_db_connection

router = APIRouter()

@router.get("/investor-purchases")
def get_investor_purchases(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """
    Investor-wise Purchase Summary per Mutual Fund
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    query = """
        SELECT 
            inv_name, 
            pan, 
            scheme, 
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
        
    query += " GROUP BY inv_name, pan, scheme ORDER BY inv_name, scheme"
    
    try:
        cursor.execute(query, params)
        results = cursor.fetchall()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.get("/investors")
def get_investors(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """
    Investor List with Purchase Details within date range
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    query = """
        SELECT 
            inv_name, 
            pan, 
            SUM(amount) as total_amount
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
        
    query += " GROUP BY inv_name, pan ORDER BY total_amount DESC"
    
    try:
        cursor.execute(query, params)
        results = cursor.fetchall()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()
