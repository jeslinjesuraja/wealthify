import os
import sys

# Resolve project root import paths
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import investors, funds, overview

app = FastAPI(
    title="Mutual Fund Transaction Dashboard API",
    description="FastAPI backend serving mutual fund statistics."
)

# Enable CORS for local cross-origin connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Populate database from CSV automatically on startup (creates tables, seeds data)
@app.on_event("startup")
def startup_db_populate():
    try:
        from app.import_csv import import_csv
        import_csv()
    except Exception as e:
        print(f"Error during auto data import on startup: {e}")

# Register modular api routers
app.include_router(overview.router, prefix="/api")
app.include_router(investors.router, prefix="/api")
app.include_router(funds.router, prefix="/api")

# Simple root endpoint
@app.get("/")
def root():
    return {"message": "Backend Running"}

if __name__ == "__main__":
    import uvicorn
    # Start Uvicorn on port 8000 when main.py is run directly
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
