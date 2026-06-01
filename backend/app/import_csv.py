# backend/app/import_csv.py
import os
import csv
import sys
from datetime import datetime
import psycopg2

# Resolve import paths
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import DB_URL

def import_csv():
    # Resolve CSV file path in the backend/ root directory
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    csv_path = os.path.join(base_dir, "dataset.csv")

    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        return

    print("Connecting to database...")
    conn = psycopg2.connect(DB_URL)
    cursor = conn.cursor()

    # Create table if it doesn't exist
    print("Ensuring transactions table exists...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id SERIAL PRIMARY KEY,
            scheme VARCHAR(255) NOT NULL,
            inv_name VARCHAR(255) NOT NULL,
            pan VARCHAR(20) NOT NULL,
            traddate TIMESTAMP NOT NULL,
            purprice DECIMAL(18, 4) NOT NULL,
            units DECIMAL(18, 4) NOT NULL,
            amount DECIMAL(18, 2) NOT NULL
        );
    """)

    # Clear old entries
    print("Clearing old transactions...")
    cursor.execute("TRUNCATE TABLE transactions;")

    # Parse and import CSV rows
    print(f"Parsing CSV records from {csv_path}...")
    with open(csv_path, mode='r', encoding='utf-8') as f:
        reader = csv.reader(f, quotechar="'", skipinitialspace=True)
        headers = next(reader)
        headers = [h.strip().strip("'").upper() for h in headers]

        # Get column positions
        scheme_idx = headers.index("SCHEME")
        inv_name_idx = headers.index("INV_NAME")
        pan_idx = headers.index("PAN")
        traddate_idx = headers.index("TRADDATE")
        purprice_idx = headers.index("PURPRICE")
        units_idx = headers.index("UNITS")
        amount_idx = headers.index("AMOUNT")

        count = 0
        for row in reader:
            if not row:
                continue

            scheme = row[scheme_idx].strip().strip("'").strip()
            inv_name = row[inv_name_idx].strip().strip("'").strip()
            pan = row[pan_idx].strip().strip("'").strip()
            traddate_str = row[traddate_idx].strip().strip("'").strip()
            
            purprice = float(row[purprice_idx].strip().strip("'").strip() or 0)
            units = float(row[units_idx].strip().strip("'").strip() or 0)
            amount = float(row[amount_idx].strip().strip("'").strip() or 0)

            if not scheme or not inv_name or not pan or not traddate_str:
                continue

            # Convert date format "5/27/2025 12:00:00 AM"
            traddate = datetime.strptime(traddate_str, "%m/%d/%Y %I:%M:%S %p")

            cursor.execute(
                """
                INSERT INTO transactions (scheme, inv_name, pan, traddate, purprice, units, amount)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (scheme, inv_name, pan, traddate, purprice, units, amount)
            )
            count += 1

    conn.commit()
    cursor.close()
    conn.close()
    print(f"Import process complete. Loaded {count} transactions.")

if __name__ == "__main__":
    import_csv()
