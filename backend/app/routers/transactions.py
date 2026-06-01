# backend/app/routers/transactions.py
from fastapi import APIRouter, Query, HTTPException, Body
from psycopg2.extras import RealDictCursor
from typing import Optional
from app.database import get_db_connection

router = APIRouter()

@router.get("/transactions")
def get_all_transactions(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """
    Retrieves individual transaction records.
    Allows users to see raw entries before modifying them.
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    query = """
        SELECT id, scheme, inv_name, pan, traddate, purprice, units, amount 
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
        
    query += " ORDER BY traddate DESC, id DESC"
    
    try:
        cursor.execute(query, params)
        results = cursor.fetchall()
        # Convert datetime objects to string format for easy JSON parsing on frontend
        for r in results:
            if r.get("traddate"):
                r["traddate"] = r["traddate"].strftime("%Y-%m-%d %H:%M:%S")
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.put("/transactions/{id}")
def update_transaction(
    id: int,
    scheme: str = Body(...),
    inv_name: str = Body(...),
    pan: str = Body(...),
    traddate: str = Body(...),
    purprice: float = Body(...),
    units: float = Body(...),
    amount: float = Body(...)
):
    """
    Updates specific transaction parameters (date, price, units, amount, etc.) by ID.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
        UPDATE transactions
        SET scheme = %s, inv_name = %s, pan = %s, traddate = %s, purprice = %s, units = %s, amount = %s
        WHERE id = %s
    """
    
    try:
        cursor.execute(query, (scheme, inv_name, pan, traddate, purprice, units, amount, id))
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return {"message": "Transaction updated successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()
