import re
# List of forbidden SQL keywords to prevent database modifications, DDL, or unauthorized operations.
FORBIDDEN_KEYWORDS = [
    r"\bdrop\b",
    r"\bdelete\b",
    r"\bupdate\b",
    r"\binsert\b",
    r"\btruncate\b",
    r"\balter\b",
    r"\bcreate\b",
    r"\breplace\b",
    r"\bgrant\b",
    r"\brevoke\b",
    r"\bvacuum\b",
    r"\bpragma\b",
    r"\battach\b",
    r"\bdetach\b",
    r"\bexec\b",
    r"\bexecute\b"
]
def is_sql_safe(sql: str) -> tuple[bool, str]:
    """
    Validates the given SQL query for safety.
    Returns (is_safe, error_message).
    """
    # 1. Clean the SQL input
    cleaned_sql = sql.strip()
    
    # Remove single-line comments (-- comment)
    cleaned_sql = re.sub(r'--.*$', '', cleaned_sql, flags=re.MULTILINE)
    
    # Remove multi-line comments (/* comment */)
    cleaned_sql = re.sub(r'/\*.*?\*/', '', cleaned_sql, flags=re.DOTALL)
    
    cleaned_sql = cleaned_sql.strip()
    
    if not cleaned_sql:
        return False, "Query is empty"
    
    lower_sql = cleaned_sql.lower()
    
    # 2. Check for forbidden keywords using word boundary regexes
    for pattern in FORBIDDEN_KEYWORDS:
        if re.search(pattern, lower_sql):
            keyword_match = re.search(pattern, lower_sql).group(0)
            return False, f"This query is not allowed: Dangerous keyword '{keyword_match}' detected."
            
    # 3. Check if the query is a SELECT statement or a CTE (starts with WITH ... SELECT)
    # Ensure it starts with SELECT or WITH
    if not (lower_sql.startswith("select") or lower_sql.startswith("with")):
        return False, "This query is not allowed: Only SELECT queries are permitted."
            
    # 4. Check for multiple statements (semicolon abuse)
    # Allow a single trailing semicolon, but if there's a semicolon followed by more SQL commands, block it.
    # We split by semicolon and check if any subsequent statements contain non-whitespace text.
    statements = [s.strip() for s in cleaned_sql.split(';')]
    non_empty_statements = [s for s in statements if s]
    if len(non_empty_statements) > 1:
        return False, "This query is not allowed: Running multiple stacked queries is forbidden."
        
    return True, ""
