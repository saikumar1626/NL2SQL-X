export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedSQL?: string;
}

export class SQLValidator {
  private static readonly FORBIDDEN_KEYWORDS = [
    'DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE', 'TRUNCATE',
    'EXEC', 'EXECUTE', 'GRANT', 'REVOKE', 'COMMIT', 'ROLLBACK'
  ];

  private static readonly DANGEROUS_PATTERNS = [
    /;\s*DROP/i,
    /;\s*DELETE/i,
    /;\s*INSERT/i,
    /;\s*UPDATE/i,
    /--/,  // SQL comments can be used for injection
    /\/\*/,  // Block comments
    /xp_/i,  // Extended procedures
    /sp_/i   // System procedures
  ];

  static validate(sql: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let sanitizedSQL = sql.trim();

    // Basic null/empty check
    if (!sql || sql.trim().length === 0) {
      errors.push('SQL query cannot be empty');
      return { isValid: false, errors, warnings };
    }

    // Check for forbidden keywords
    const upperSQL = sql.toUpperCase();
    for (const keyword of this.FORBIDDEN_KEYWORDS) {
      if (upperSQL.includes(keyword)) {
        errors.push(`Forbidden keyword detected: ${keyword}`);
      }
    }

    // Check for dangerous patterns
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(sql)) {
        errors.push(`Potentially dangerous pattern detected: ${pattern.source}`);
      }
    }

    // Check if it's a SELECT statement
    if (!upperSQL.trim().startsWith('SELECT')) {
      errors.push('Only SELECT statements are allowed');
    }

    // Check for multiple statements (basic check)
    const statements = sql.split(';').filter(s => s.trim().length > 0);
    if (statements.length > 1) {
      errors.push('Multiple statements are not allowed');
    }

    // Basic syntax validation
    if (!this.hasBasicSelectSyntax(sql)) {
      warnings.push('Query may have syntax errors');
    }

    // Check for proper table/column names (basic validation)
    if (!this.hasValidTableReferences(sql)) {
      warnings.push('Query may reference invalid tables or columns');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedSQL: errors.length === 0 ? sanitizedSQL : undefined
    };
  }

  private static hasBasicSelectSyntax(sql: string): boolean {
    const upperSQL = sql.toUpperCase().trim();
    
    // Must start with SELECT
    if (!upperSQL.startsWith('SELECT')) return false;
    
    // Must have FROM clause (unless it's a simple SELECT with literals)
    if (upperSQL.includes('FROM')) {
      // Basic FROM syntax check
      const fromIndex = upperSQL.indexOf('FROM');
      const afterFrom = upperSQL.substring(fromIndex + 4).trim();
      if (afterFrom.length === 0) return false;
    }

    return true;
  }

  private static hasValidTableReferences(sql: string): boolean {
    const validTables = ['customers', 'orders', 'order_items'];
    const upperSQL = sql.toUpperCase();
    
    // Check if referenced tables exist in our schema
    for (const table of validTables) {
      if (upperSQL.includes(table.toUpperCase())) {
        return true;
      }
    }
    
    // If no table references found, it might be a simple SELECT
    return !upperSQL.includes('FROM');
  }

  static sanitizeSQL(sql: string): string {
    let sanitized = sql.trim();
    
    // Remove dangerous characters/patterns
    sanitized = sanitized.replace(/--.*$/gm, ''); // Remove line comments
    sanitized = sanitized.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove block comments
    
    // Ensure single statement
    const statements = sanitized.split(';');
    sanitized = statements[0].trim();
    
    return sanitized;
  }
}