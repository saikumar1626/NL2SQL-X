import os
import sqlite3
from datetime import datetime, timedelta
import random
DATABASE_FILE = os.getenv("DATABASE_URL", "./database.db")
# Ensure the database filepath is resolved correctly
if DATABASE_FILE.startswith("./"):
    # Resolve relative to the current script dir or the backend folder
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, DATABASE_FILE[2:])
else:
    db_path = DATABASE_FILE
def get_db_connection():
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    # Enable foreign keys in SQLite
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn
def init_db():
    """Initializes the database, creates tables, and populates mock data if tables are empty."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Create tables
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS regions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        country TEXT NOT NULL
    );
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        region INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (region) REFERENCES regions(id)
    );
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        stock INTEGER NOT NULL
    );
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        total_amount REAL NOT NULL,
        order_date DATETIME NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    );
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS query_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT NOT NULL,
        sql_query TEXT NOT NULL,
        row_count INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    conn.commit()
    
    # 2. Populate tables with mock data if empty
    cursor.execute("SELECT COUNT(*) FROM regions;")
    if cursor.fetchone()[0] == 0:
        # Insert regions
        regions = [
            ("North America", "United States"),
            ("Europe", "United Kingdom"),
            ("Asia", "Japan"),
            ("LATAM", "Brazil"),
            ("Oceania", "Australia")
        ]
        cursor.executemany("INSERT INTO regions (name, country) VALUES (?, ?);", regions)
        conn.commit()
        
        # Insert customers
        cursor.execute("SELECT id FROM regions;")
        region_ids = [row[0] for row in cursor.fetchall()]
        
        customers = [
            ("Alice Smith", "alice.smith@example.com", region_ids[0], "2025-01-15 10:00:00"),
            ("Bob Jones", "bob.jones@example.com", region_ids[1], "2025-02-20 11:30:00"),
            ("Charlie Brown", "charlie.brown@example.com", region_ids[2], "2025-03-05 09:15:00"),
            ("David Silva", "david.silva@example.com", region_ids[3], "2025-03-25 14:00:00"),
            ("Eva Miller", "eva.miller@example.com", region_ids[4], "2025-04-12 16:45:00"),
            ("Frank Wilson", "frank.wilson@example.com", region_ids[0], "2025-05-01 08:00:00"),
            ("Grace Taylor", "grace.taylor@example.com", region_ids[1], "2025-05-18 13:20:00"),
            ("Henry Tanaka", "henry.tanaka@example.com", region_ids[2], "2025-06-02 10:10:00"),
            ("Isabella Santos", "isabella.santos@example.com", region_ids[3], "2025-06-20 15:30:00"),
            ("Jack Davies", "jack.davies@example.com", region_ids[4], "2025-07-04 11:00:00"),
            ("Karen White", "karen.white@example.com", region_ids[0], "2025-07-22 09:40:00"),
            ("Liam Johnson", "liam.johnson@example.com", region_ids[1], "2025-08-14 17:15:00"),
            ("Mia Wong", "mia.wong@example.com", region_ids[2], "2025-09-01 12:00:00"),
            ("Noah Garcia", "noah.garcia@example.com", region_ids[3], "2025-09-19 14:25:00"),
            ("Olivia Martin", "olivia.martin@example.com", region_ids[4], "2025-10-05 10:50:00"),
            ("Peter Parker", "spidey@example.com", region_ids[0], "2025-10-25 16:00:00"),
            ("Quinn Hughes", "quinn@example.com", region_ids[1], "2025-11-12 08:30:00"),
            ("Ryu Hayabusa", "ninja@example.com", region_ids[2], "2025-11-30 15:00:00"),
            ("Sofia Rodriguez", "sofia@example.com", region_ids[3], "2025-12-10 11:15:00"),
            ("Thomas Wright", "thomas@example.com", region_ids[4], "2025-12-25 14:00:00")
        ]
        cursor.executemany("INSERT INTO customers (name, email, region, created_at) VALUES (?, ?, ?, ?);", customers)
        conn.commit()
        
        # Insert products
        products = [
            # Electronics
            ("Quantum Laptop Pro", "Electronics", 1299.99, 45),
            ("Apex Smartphone", "Electronics", 799.99, 80),
            ("Sonic ANC Headphones", "Electronics", 199.99, 120),
            # Apparel
            ("Classic Denim Jacket", "Apparel", 89.99, 150),
            ("Slim Fit Jeans", "Apparel", 49.99, 200),
            ("Premium Wool T-Shirt", "Apparel", 29.99, 300),
            # Home
            ("Smart Drip Coffee Maker", "Home", 119.99, 60),
            ("LED Architect Desk Lamp", "Home", 39.99, 100),
            ("RoboVac 3000", "Home", 249.99, 35),
            # Sports
            ("Eco Grip Yoga Mat", "Sports", 24.99, 250),
            ("Hex Rubber Dumbbells (Set)", "Sports", 69.99, 90),
            ("Trail Blazer Running Shoes", "Sports", 99.99, 110)
        ]
        cursor.executemany("INSERT INTO products (name, category, price, stock) VALUES (?, ?, ?, ?);", products)
        conn.commit()
        
        # Insert orders (dynamic relative dates to ensure date queries never break)
        cursor.execute("SELECT id, name FROM customers;")
        cust_list = [row[0] for row in cursor.fetchall()]
        
        cursor.execute("SELECT id, price FROM products;")
        prod_list = [(row[0], row[1]) for row in cursor.fetchall()]
        
        statuses = ["Completed", "Processing", "Shipped", "Cancelled"]
        
        # Generate ~60 orders distributed across the last 180 days
        orders = []
        now = datetime.now()
        
        # We want to create specific orders to guarantee example queries return good data:
        # e.g., "Top 5 selling products in the last 30 days"
        # We will make sure several orders happened in the last 15 days for specific products.
        
        for i in range(60):
            # Select random customer and product
            cust_id = random.choice(cust_list)
            prod_id, price = random.choice(prod_list)
            qty = random.randint(1, 4)
            total = round(qty * price, 2)
            
            # Distribute dates: some very recent, some older
            if i < 15:
                # Last 15 days
                days_ago = random.randint(1, 14)
            elif i < 35:
                # Last 30 days
                days_ago = random.randint(15, 29)
            else:
                # Last 180 days
                days_ago = random.randint(30, 180)
                
            order_date = now - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
            order_date_str = order_date.strftime("%Y-%m-%d %H:%M:%S")
            
            status = random.choice(statuses)
            # Ensure cancelled orders don't dominate, but exist
            if status == "Cancelled" and random.random() > 0.3:
                status = "Completed"
                
            orders.append((cust_id, prod_id, qty, total, order_date_str, status))
            
        # Ensure a few customers have > 2 orders for "List customers who placed more than 2 orders"
        # We will force customer 1 and customer 2 to have at least 3 orders
        for cust_id in cust_list[:2]:
            cursor.execute("SELECT COUNT(*) FROM orders WHERE customer_id = ?;", (cust_id,))
            cnt = cursor.fetchone()[0]
            if cnt < 3:
                for _ in range(3 - cnt):
                    prod_id, price = random.choice(prod_list)
                    qty = 1
                    total = price
                    days_ago = random.randint(5, 50)
                    order_date = now - timedelta(days=days_ago)
                    order_date_str = order_date.strftime("%Y-%m-%d %H:%M:%S")
                    orders.append((cust_id, prod_id, qty, total, order_date_str, "Completed"))
        
        cursor.executemany("""
        INSERT INTO orders (customer_id, product_id, quantity, total_amount, order_date, status)
        VALUES (?, ?, ?, ?, ?, ?);
        """, orders)
        conn.commit()
        
    conn.close()
def get_schema_metadata() -> dict:
    """Returns the full schema of the e-commerce tables, including columns, types, and foreign keys."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Tables to explore (exclude query_history)
    tables = ["regions", "customers", "products", "orders"]
    schema = {}
    
    for table in tables:
        # Get columns and primary key details
        cursor.execute(f"PRAGMA table_info({table});")
        columns_info = cursor.fetchall()
        
        columns = []
        for col in columns_info:
            columns.append({
                "name": col["name"],
                "type": col["type"],
                "primary_key": bool(col["pk"])
            })
            
        # Get foreign keys
        cursor.execute(f"PRAGMA foreign_key_list({table});")
        fk_info = cursor.fetchall()
        
        foreign_keys = []
        for fk in fk_info:
            foreign_keys.append({
                "column": fk["from"],
                "referred_table": fk["table"],
                "referred_column": fk["to"]
            })
            
        schema[table] = {
            "columns": columns,
            "foreign_keys": foreign_keys
        }
        
    conn.close()
    return schema
def execute_select_query(sql: str) -> tuple[list[dict], list[str]]:
    """Executes a SELECT SQL query and returns rows as dictionaries, along with column headers."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(sql)
        rows = cursor.fetchall()
        
        # Extract column headers
        columns = [description[0] for description in cursor.description] if cursor.description else []
        
        # Convert sqlite3.Row objects to dictionaries
        results = [dict(row) for row in rows]
        return results, columns
    finally:
        conn.close()
def log_query_history(question: str, sql_query: str, row_count: int):
    """Saves a query transaction in the query_history table."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO query_history (question, sql_query, row_count, timestamp)
        VALUES (?, ?, ?, ?);
        """, (question, sql_query, row_count, datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
        conn.commit()
    except Exception as e:
        print(f"Error logging query history: {e}")
    finally:
        conn.close()
def get_query_history() -> list[dict]:
    """Retrieves the last 20 queries from history."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        SELECT question, sql_query, row_count, timestamp
        FROM query_history
        ORDER BY id DESC
        LIMIT 20;
        """)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()
