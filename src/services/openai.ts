import { databaseSchema } from "@/data/mockDatabase";

export interface OpenAIConfig {
  apiKey: string;
  model?: string;
}

export interface SQLGenerationResult {
  sql: string;
  explanation: string;
  confidence: number;
}

export class OpenAIService {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(config: OpenAIConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-4.1-2025-04-14';
  }

  private getFewShotExamples() {
    return `
Examples of natural language to SQL conversions:

Q: "Show me all customers and their orders"
A: SELECT c.name, c.email, o.order_date, o.total_amount FROM customers c JOIN orders o ON c.customer_id = o.customer_id ORDER BY o.order_date DESC;

Q: "What's the total sales amount?"
A: SELECT SUM(total_amount) as total_sales FROM orders;

Q: "How many customers do we have?"
A: SELECT COUNT(*) as total_customers FROM customers;

Q: "List products with their total quantities sold"
A: SELECT product_name, SUM(quantity) as total_quantity, AVG(price) as avg_price FROM order_items GROUP BY product_name ORDER BY total_quantity DESC;

Q: "Show recent orders from this month"
A: SELECT * FROM orders WHERE order_date >= '2024-03-01' ORDER BY order_date DESC;

Q: "Find customers who spent more than $200"
A: SELECT c.name, c.email, SUM(o.total_amount) as total_spent FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id, c.name, c.email HAVING SUM(o.total_amount) > 200;
`;
  }

  private getSystemPrompt() {
    return `You are an expert SQL assistant. Your task is to convert natural language questions into syntactically correct SQL queries.

Database Schema:
${databaseSchema}

${this.getFewShotExamples()}

CRITICAL RULES:
1. ONLY generate SELECT statements - never DROP, DELETE, INSERT, UPDATE, or ALTER
2. Use proper JOIN syntax when connecting tables
3. Include appropriate WHERE clauses for filtering
4. Use GROUP BY and aggregate functions when needed
5. Always ORDER BY relevant columns for better results
6. Column names must exactly match the schema
7. Use proper SQL syntax and formatting
8. If the question is ambiguous, make reasonable assumptions

Response format:
{
  "sql": "your SQL query here",
  "explanation": "brief explanation of what the query does",
  "confidence": 0.95
}`;
  }

  async generateSQL(question: string): Promise<SQLGenerationResult> {
    if (!this.apiKey || this.apiKey === 'your-openai-api-key') {
      // Fallback to mock generation for demo
      return this.mockGenerateSQL(question);
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: this.getSystemPrompt() },
            { role: 'user', content: question }
          ],
          temperature: 0.1,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      try {
        const parsed = JSON.parse(content);
        return {
          sql: parsed.sql,
          explanation: parsed.explanation || 'SQL query generated successfully',
          confidence: parsed.confidence || 0.9
        };
      } catch {
        // Fallback if response isn't JSON
        return {
          sql: content.replace(/```sql|```/g, '').trim(),
          explanation: 'SQL query generated successfully',
          confidence: 0.8
        };
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
      // Fallback to mock generation on error
      return this.mockGenerateSQL(question);
    }
  }

  private async mockGenerateSQL(question: string): Promise<SQLGenerationResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const query = question.toLowerCase();
    let sql = "";
    let explanation = "";
    
    if (query.includes("total sales") || (query.includes("sum") && query.includes("amount"))) {
      sql = "SELECT SUM(total_amount) as total_sales FROM orders;";
      explanation = "Calculates the total sales amount from all orders";
    } else if (query.includes("customer") && query.includes("count")) {
      sql = "SELECT COUNT(*) as total_customers FROM customers;";
      explanation = "Counts the total number of customers";
    } else if (query.includes("customer") && (query.includes("order") || query.includes("purchase"))) {
      sql = `SELECT c.name, c.email, o.order_date, o.total_amount 
             FROM customers c 
             JOIN orders o ON c.customer_id = o.customer_id 
             ORDER BY o.order_date DESC;`;
      explanation = "Shows customers with their order details";
    } else if (query.includes("product") || query.includes("item")) {
      sql = `SELECT product_name, SUM(quantity) as total_quantity, AVG(price) as avg_price 
             FROM order_items 
             GROUP BY product_name 
             ORDER BY total_quantity DESC;`;
      explanation = "Lists products with their sales statistics";
    } else if (query.includes("recent") || query.includes("last")) {
      sql = `SELECT * FROM orders 
             WHERE order_date >= '2024-03-01' 
             ORDER BY order_date DESC;`;
      explanation = "Shows recent orders from March 2024";
    } else {
      sql = "SELECT * FROM customers LIMIT 10;";
      explanation = "Shows first 10 customers as default result";
    }
    
    return {
      sql,
      explanation,
      confidence: 0.85
    };
  }
}