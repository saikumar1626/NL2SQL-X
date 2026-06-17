import os
import google.generativeai as genai
from database import get_schema_metadata
# Configure Gemini API client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
def translate_nl_to_sql(question: str) -> str:
    """
    Translates a natural language question into a SQLite SQL query using gemini-1.5-flash.
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY environment variable is not set.")
    
    genai.configure(api_key=GEMINI_API_KEY)
    
    # 1. Fetch schema details to include in the system prompt
    schema = get_schema_metadata()
    schema_str = ""
    for table_name, details in schema.items():
        schema_str += f"- Table: {table_name}\n"
        schema_str += "  Columns:\n"
        for col in details["columns"]:
            pk_suffix = " (PRIMARY KEY)" if col["primary_key"] else ""
            schema_str += f"    - {col['name']} ({col['type']}){pk_suffix}\n"
        
        if details["foreign_keys"]:
            schema_str += "  Relationships:\n"
            for fk in details["foreign_keys"]:
                schema_str += f"    - {fk['column']} references {fk['referred_table']}({fk['referred_column']})\n"
        schema_str += "\n"
    # 2. Build the detailed system prompt with few-shot examples
    system_prompt = f"""You are an expert SQL translator converting English questions into standard SQLite SELECT queries.
You must generate SQLite SQL statements based on the database schema below.
DATABASE SCHEMA:
{schema_str}
STRICT INSTRUCTIONS:
1. ONLY return a single SELECT query. Do NOT return DML or DDL statements (like INSERT, UPDATE, DELETE, CREATE, DROP, ALTER).
2. Return ONLY the raw SQL code. Do NOT wrap it in markdown block quotes (such as ```sql ... ```), and do NOT provide any explanation or comments.
3. Make sure to perform correct table joins using the foreign key relationships:
   - To join customer region with region names, join `customers.region = regions.id`.
   - To join orders with customers, join `orders.customer_id = customers.id`.
   - To join orders with products, join `orders.product_id = products.id`.
4. Use standard SQLite functions (e.g., DATE('now'), DATE('now', '-30 days'), DATE('now', 'start of year'), AVG, SUM, COUNT, strftime).
5. Give meaningful column aliases (e.g. SUM(o.total_amount) AS revenue) so results are easy to display.
6. Order the results logically when aggregating (e.g. highest sales first).
EXAMPLES:
---
Question: Show total sales per customer
SQL: SELECT c.name, SUM(o.total_amount) AS total_sales FROM orders o JOIN customers c ON o.customer_id = c.id GROUP BY c.name ORDER BY total_sales DESC;
Question: Top 5 selling products in the last 30 days
SQL: SELECT p.name, SUM(o.quantity) AS total_sold FROM orders o JOIN products p ON o.product_id = p.id WHERE o.order_date >= DATE('now', '-30 days') GROUP BY p.name ORDER BY total_sold DESC LIMIT 5;
Question: List customers who placed more than 2 orders
SQL: SELECT c.name, COUNT(o.id) AS order_count FROM orders o JOIN customers c ON o.customer_id = c.id GROUP BY c.name HAVING order_count > 2;
Question: Revenue per region this year
SQL: SELECT r.name AS region_name, SUM(o.total_amount) AS revenue FROM orders o JOIN customers c ON o.customer_id = c.id JOIN regions r ON c.region = r.id WHERE o.order_date >= DATE('now', 'start of year') GROUP BY r.name;
Question: Average order value by product category
SQL: SELECT p.category, AVG(o.total_amount) AS avg_order_value FROM orders o JOIN products p ON o.product_id = p.id GROUP BY p.category;
---
Generate the SQLite query for the following question:
"{question}"
"""
    # 3. Call the Gemini API
    model = genai.GenerativeModel('gemini-2.0-flash')
    response = model.generate_content(
    contents=system_prompt,
    generation_config=genai.types.GenerationConfig(
        temperature=0.0,
        max_output_tokens=1000
    )
)
    
    # 4. Clean and strip the returned text (handling potential LLM formatting artifacts)
    sql = clean_gemini_sql(response.text)
    return sql
def clean_gemini_sql(sql: str) -> str:
    """Helper to strip any markdown wrappers or surrounding clutter from the LLM response."""
    sql = sql.strip()
    
    # Remove markdown code block delimiters (e.g., ```sql ... ```)
    if sql.startswith("```"):
        lines = sql.split("\n")
        if lines[0].strip().startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        sql = "\n".join(lines).strip()
        
    # Remove starting/trailing quotes if they got generated
    if sql.startswith("'") and sql.endswith("'"):
        sql = sql[1:-1].strip()
    if sql.startswith('"') and sql.endswith('"'):
        sql = sql[1:-1].strip()
        
    # Remove any trailing semicolons or single quotes
    sql = sql.strip()
    return sql
