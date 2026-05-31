import os
import sys

# Resolve project root import paths
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import investors, funds, overview

app = FastAPI(
    title="Mutual Fund Transaction Dashboard API",
    description="FastAPI application serving Mutual Fund Transaction reports."
)

# Enable CORS for local cross-origin API calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Mutual Fund API is running."}

# Register the separate routers under the /api prefix
app.include_router(overview.router, prefix="/api")
app.include_router(investors.router, prefix="/api")
app.include_router(funds.router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    # Launch Uvicorn on localhost:8000 when running directly
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
