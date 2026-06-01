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
    GET: Returns a list of raw transaction logs.
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
        # Format dates as strings for JSON response
        for r in results:
            if r.get("traddate"):
                r["traddate"] = r["traddate"].strftime("%Y-%m-%d %H:%M:%S")
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.post("/transactions")
def create_transaction(
    scheme: str = Body(...),
    inv_name: str = Body(...),
    pan: str = Body(...),
    traddate: str = Body(...),
    purprice: float = Body(...),
    units: float = Body(...),
    amount: float = Body(...)
):
    """
    POST: Adds a new transaction record permanently to the database.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
        INSERT INTO transactions (scheme, inv_name, pan, traddate, purprice, units, amount)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    
    try:
        cursor.execute(query, (scheme, inv_name, pan, traddate, purprice, units, amount))
        conn.commit()
        return {"message": "Transaction created successfully"}
    except Exception as e:
        conn.rollback()
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
    PUT: Modifies an existing transaction log in the database.
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

@router.delete("/transactions/{id}")
def delete_transaction(id: int):
    """
    DELETE: Removes a transaction log permanently from the database.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "DELETE FROM transactions WHERE id = %s"
    
    try:
        cursor.execute(query, (id,))
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return {"message": "Transaction deleted successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()
