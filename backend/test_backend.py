import os
import unittest
import sqlite3
from unittest.mock import patch
from fastapi.testclient import TestClient
# Ensure we configure environment for test db
os.environ["DATABASE_URL"] = "./test_database.db"
# Import items to test
from backend.safety import is_sql_safe
from backend.database import (
    init_db,
    get_db_connection,
    get_schema_metadata,
    execute_select_query,
    log_query_history,
    get_query_history,
    db_path
)
from backend.main import app, detect_chart_type
class TestNL2SQLBackend(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        # Remove old test DB if exists
        if os.path.exists(db_path):
            try:
                os.remove(db_path)
            except Exception:
                pass
        # Initialize test DB
        init_db()
    @classmethod
    def tearDownClass(cls):
        # Clean up test DB file
        if os.path.exists(db_path):
            try:
                os.remove(db_path)
            except Exception:
                pass
    def test_sql_safety_validator(self):
        # Safe queries
        safe_queries = [
            "SELECT * FROM customers;",
            "select name, email from customers where region = 1",
            "WITH recent_orders AS (SELECT * FROM orders WHERE order_date > '2025-01-01') SELECT * FROM recent_orders;",
            "SELECT name AS customer_name FROM customers ORDER BY created_at DESC;"
        ]
        for q in safe_queries:
            is_safe, msg = is_sql_safe(q)
            self.assertTrue(is_safe, f"Query should be safe: {q}. Msg: {msg}")
        # Unsafe queries
        unsafe_queries = [
            "DROP TABLE customers;",
            "DELETE FROM orders WHERE id = 1;",
            "UPDATE products SET price = 0.0;",
            "INSERT INTO regions (name, country) VALUES ('Mars', 'Space');",
            "TRUNCATE TABLE query_history;",
            "ALTER TABLE customers ADD COLUMN age INTEGER;",
            "CREATE TABLE hack (id INTEGER);"
        ]
        for q in unsafe_queries:
            is_safe, msg = is_sql_safe(q)
            self.assertFalse(is_safe, f"Query should be blocked: {q}")
            self.assertIn("Dangerous keyword", msg)
        # Non-SELECT statements
        self.assertFalse(is_sql_safe("SHOW TABLES;")[0])
        self.assertFalse(is_sql_safe("EXPLAIN QUERY PLAN SELECT * FROM customers;")[0])
        # Stacked/Multiple queries
        self.assertFalse(is_sql_safe("SELECT * FROM customers; DROP TABLE orders;")[0])
    def test_database_initialization_and_seeding(self):
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Test tables count
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        self.assertIn("regions", tables)
        self.assertIn("customers", tables)
        self.assertIn("products", tables)
        self.assertIn("orders", tables)
        self.assertIn("query_history", tables)
        
        # Check rows exist (seeded successfully)
        cursor.execute("SELECT COUNT(*) FROM regions;")
        self.assertGreater(cursor.fetchone()[0], 0)
        
        cursor.execute("SELECT COUNT(*) FROM customers;")
        self.assertGreater(cursor.fetchone()[0], 0)
        
        cursor.execute("SELECT COUNT(*) FROM products;")
        self.assertGreater(cursor.fetchone()[0], 0)
        
        cursor.execute("SELECT COUNT(*) FROM orders;")
        self.assertGreater(cursor.fetchone()[0], 0)
        
        conn.close()
    def test_schema_explorer_metadata(self):
        schema = get_schema_metadata()
        self.assertIn("regions", schema)
        self.assertIn("customers", schema)
        self.assertIn("products", schema)
        self.assertIn("orders", schema)
        
        customers_schema = schema["customers"]
        column_names = [col["name"] for col in customers_schema["columns"]]
        self.assertIn("id", column_names)
        self.assertIn("name", column_names)
        self.assertIn("email", column_names)
        
        # Check relationships
        fkeys = customers_schema["foreign_keys"]
        self.assertEqual(len(fkeys), 1)
        self.assertEqual(fkeys[0]["column"], "region")
        self.assertEqual(fkeys[0]["referred_table"], "regions")
        self.assertEqual(fkeys[0]["referred_column"], "id")
    def test_query_history_logging(self):
        # Initial history count
        history = get_query_history()
        initial_len = len(history)
        
        # Log new query
        log_query_history("Who are the customers?", "SELECT name FROM customers LIMIT 5;", 5)
        
        # New history count
        new_history = get_query_history()
        self.assertEqual(len(new_history), initial_len + 1)
        self.assertEqual(new_history[0]["question"], "Who are the customers?")
        self.assertEqual(new_history[0]["sql_query"], "SELECT name FROM customers LIMIT 5;")
        self.assertEqual(new_history[0]["row_count"], 5)
    def test_chart_type_heuristics(self):
        # 1. Line Chart: date columns
        self.assertEqual(
            detect_chart_type(["order_date", "revenue"], [{"order_date": "2025-06-01", "revenue": 150.0}]),
            "line"
        )
        
        # 2. Pie Chart: text + numeric with <= 6 items
        self.assertEqual(
            detect_chart_type(
                ["category", "total"],
                [
                    {"category": "Electronics", "total": 500},
                    {"category": "Apparel", "total": 300}
                ]
            ),
            "pie"
        )
        
        # 3. Bar Chart: text + numeric with > 6 items
        self.assertEqual(
            detect_chart_type(
                ["category", "total"],
                [
                    {"category": "Cat 1", "total": 10},
                    {"category": "Cat 2", "total": 10},
                    {"category": "Cat 3", "total": 10},
                    {"category": "Cat 4", "total": 10},
                    {"category": "Cat 5", "total": 10},
                    {"category": "Cat 6", "total": 10},
                    {"category": "Cat 7", "total": 10}
                ]
            ),
            "bar"
        )
        
        # 4. Table: multiple fields or non-numeric
        self.assertEqual(
            detect_chart_type(["id", "name", "email"], [{"id": 1, "name": "Alice", "email": "a@b.com"}]),
            "table"
        )
    @patch("backend.main.translate_nl_to_sql")
    def test_api_routes(self, mock_translate):
        # Set up API client
        client = TestClient(app)
        
        # 1. Test /api/schema
        response = client.get("/api/schema")
        self.assertEqual(response.status_code, 200)
        self.assertIn("products", response.json())
        
        # 2. Test /api/history
        response = client.get("/api/history")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)
        
        # 3. Test /api/query success
        mock_translate.return_value = "SELECT name, price FROM products WHERE price < 50 LIMIT 2;"
        response = client.post("/api/query", json={"question": "cheap products"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["sql"], "SELECT name, price FROM products WHERE price < 50 LIMIT 2;")
        self.assertIn("results", data)
        self.assertEqual(data["columns"], ["name", "price"])
        self.assertEqual(data["chart_type"], "pie") # 2 rows <= 6 -> pie
        
        # 4. Test /api/query safety violation
        mock_translate.return_value = "DROP TABLE products;"
        response = client.post("/api/query", json={"question": "nuke products"})
        self.assertEqual(response.status_code, 400)
        self.assertIn("not allowed", response.json()["detail"])
if __name__ == "__main__":
    unittest.main()
