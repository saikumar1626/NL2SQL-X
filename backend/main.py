import os
import sys
import sqlite3
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv
# Load environment variables
load_dotenv()
# Make sure backend folder can import siblings
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.database import (
    init_db,
    execute_select_query,
    get_schema_metadata,
    log_query_history,
    get_query_history
)
from backend.safety import is_sql_safe
from backend.gemini_service import translate_nl_to_sql
# Initialize the SQLite database and populate mock data
init_db()
app = FastAPI(
    title="NL2SQL-X API",
    description="Natural Language to SQL translator for an E-commerce database.",
    version="1.0.0"
)
# Enable CORS for frontend communication during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class QueryRequest(BaseModel):
    question: str
def detect_chart_type(columns: list[str], results: list[dict]) -> str:
    """Detects the best chart type (bar, line, pie, or table) based on the dataset shape and contents."""
    if not results or len(columns) < 2:
        return "table"
        
    cols_lower = [c.lower() for c in columns]
    
    # 1. Date/Time columns -> Line Chart (Time Series)
    has_date = False
    for col in cols_lower:
        if any(k in col for k in ["date", "month", "year", "day", "time", "period"]):
            has_date = True
            break
            
    if has_date:
        return "line"
        
    # 2. Extract column data types from the first result row
    first_row = results[0]
    numeric_cols = []
    text_cols = []
    for col in columns:
        val = first_row.get(col)
        # Check if type is int/float and not a boolean (SQLite doesn't have boolean, but python translates it)
        if isinstance(val, (int, float)) and not isinstance(val, bool):
            if col.lower() == "id" or col.lower().endswith("_id"):
                text_cols.append(col)
            else:
                numeric_cols.append(col)
        else:
            text_cols.append(col)
            
    # 3. Label + Numeric combination
    if len(text_cols) >= 1 and len(numeric_cols) >= 1:
        # If there are few distinct text values (e.g. <= 6 categories), use a pie chart
        if len(results) <= 6:
            return "pie"
        return "bar"
        
    return "table"
@app.post("/api/query")
async def ask_question(request: QueryRequest):
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
        
    # Translate Natural Language to SQL
    try:
        generated_sql = translate_nl_to_sql(question)
    except Exception as e:
        print(f"Gemini API Error: {e}")
        raise HTTPException(status_code=503, detail="AI service unavailable, try again.")
        
    # Validate SQL query safety
    is_safe, safety_error = is_sql_safe(generated_sql)
    if not is_safe:
        raise HTTPException(status_code=400, detail=safety_error)
        
    # Run query on the database
    try:
        results, columns = execute_select_query(generated_sql)
    except sqlite3.Error as e:
        # In case the AI generates invalid SQL dialect, return a structured error
        print(f"SQLite execution error: {e} | SQL: {generated_sql}")
        raise HTTPException(
            status_code=400,
            detail=f"Could not execute SQL query: {str(e)}."
        )
        
    # Determine the best chart format
    chart_type = detect_chart_type(columns, results)
    
    # Log query in history
    log_query_history(question, generated_sql, len(results))
    
    return {
        "sql": generated_sql,
        "results": results,
        "columns": columns,
        "chart_type": chart_type
    }
@app.get("/api/schema")
async def get_schema():
    try:
        schema = get_schema_metadata()
        return schema
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database schema retrieval error: {str(e)}")
@app.get("/api/history")
async def get_history():
    try:
        history = get_query_history()
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database history retrieval error: {str(e)}")
# Mount compiled React build folder if it exists in the workspace
dist_path = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist"))
if os.path.exists(dist_path):
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="static")
    print(f"Mounted static frontend from: {dist_path}")
else:
    print(f"Static directory not found at: {dist_path}. Run frontend build first to compile assets.")
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
