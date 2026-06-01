# Wealthify Backend Service

FastAPI web service serving Mutual Fund Dashboard.

## Setup Instructions

### 1. Requirements
Ensure Python and PostgreSQL are installed.

### 2. Configure Environment variables
Ensure `backend/.env` is configured with:
```env
DATABASE_URL=postgresql://postgres:AcademyRootPassword@localhost:5432/wealthify
```

### 3. Install packages
Run this command from inside the `backend/` directory:
```bash
pip install -r requirements.txt
```

### 4. Run the Service
Run this command from inside the `backend/` directory to launch the server:
```bash
uvicorn app.main:app --reload
```

FastAPI will start on `http://127.0.0.1:8000/`.

On startup, the server will automatically:
1. Connect to PostgreSQL.
2. Initialize tables.
3. Import records from `dataset.csv` into database.
4. Serve the HTML dashboard directly on `http://127.0.0.1:8000/`.
