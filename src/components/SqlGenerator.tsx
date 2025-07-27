import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Brain, Database, Sparkles, History, Eye, EyeOff } from "lucide-react";
import { executeSQL } from "@/data/mockDatabase";
import { useToast } from "@/hooks/use-toast";

interface QueryResult {
  id: string;
  question: string;
  sql: string;
  results: any[];
  timestamp: Date;
}

export default function SqlGenerator() {
  const [question, setQuestion] = useState("");
  const [generatedSQL, setGeneratedSQL] = useState("");
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSQL, setShowSQL] = useState(true);
  const [queryHistory, setQueryHistory] = useState<QueryResult[]>([]);
  const { toast } = useToast();

  // Mock LLM function - in real app, this would call OpenAI API
  const generateSQL = async (naturalLanguageQuery: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const query = naturalLanguageQuery.toLowerCase();
    
    if (query.includes("total sales") || query.includes("sum") && query.includes("amount")) {
      return "SELECT SUM(total_amount) as total_sales FROM orders;";
    }
    
    if (query.includes("customer") && query.includes("count")) {
      return "SELECT COUNT(*) as total_customers FROM customers;";
    }
    
    if (query.includes("customer") && (query.includes("order") || query.includes("purchase"))) {
      return `SELECT c.name, c.email, o.order_date, o.total_amount 
               FROM customers c 
               JOIN orders o ON c.customer_id = o.customer_id 
               ORDER BY o.order_date DESC;`;
    }
    
    if (query.includes("product") || query.includes("item")) {
      return `SELECT product_name, SUM(quantity) as total_quantity, AVG(price) as avg_price 
               FROM order_items 
               GROUP BY product_name 
               ORDER BY total_quantity DESC;`;
    }
    
    if (query.includes("recent") || query.includes("last")) {
      return `SELECT * FROM orders 
               WHERE order_date >= '2024-03-01' 
               ORDER BY order_date DESC;`;
    }
    
    // Default query
    return "SELECT * FROM customers LIMIT 10;";
  };

  const handleGenerateAndExecute = async () => {
    if (!question.trim()) {
      toast({
        title: "Error",
        description: "Please enter a question first.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Generate SQL using mock LLM
      const sql = await generateSQL(question);
      setGeneratedSQL(sql);
      
      // Execute SQL on mock database
      const results = executeSQL(sql);
      setQueryResults(results);
      
      // Add to history
      const newQuery: QueryResult = {
        id: Date.now().toString(),
        question,
        sql,
        results,
        timestamp: new Date()
      };
      
      setQueryHistory(prev => [newQuery, ...prev.slice(0, 4)]);
      
      toast({
        title: "Success",
        description: "Query generated and executed successfully!",
        variant: "default"
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate or execute query.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exampleQuestions = [
    "Show me all customers and their orders",
    "What's the total sales amount?",
    "How many customers do we have?",
    "List all products and their quantities sold",
    "Show recent orders from this month"
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-r from-ai-primary to-ai-accent">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-ai-primary to-ai-accent bg-clip-text text-transparent">
            Ask My Database
          </h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Transform your questions into SQL queries instantly. Just ask in plain English and let AI handle the complex SQL generation.
        </p>
      </div>

      {/* Main Query Interface */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-ai-primary" />
            Natural Language Query
          </CardTitle>
          <CardDescription>
            Ask any question about your database in plain English
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="e.g., Show me total sales per customer for the last month"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="min-h-[100px] resize-none border-border/50 focus:border-ai-primary"
          />
          
          <div className="flex items-center justify-between">
            <Button
              onClick={handleGenerateAndExecute}
              disabled={isLoading || !question.trim()}
              className="bg-gradient-to-r from-ai-primary to-ai-accent hover:opacity-90 text-white px-6"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Generate & Execute SQL
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowSQL(!showSQL)}
              className="border-border/50"
            >
              {showSQL ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showSQL ? "Hide" : "Show"} SQL
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Example Questions */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Try These Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {exampleQuestions.map((example, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer hover:bg-ai-primary hover:text-white transition-colors p-2 text-sm"
                onClick={() => setQuestion(example)}
              >
                {example}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generated SQL */}
      {generatedSQL && showSQL && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-success" />
              Generated SQL Query
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono border border-border/50">
              <code>{generatedSQL}</code>
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Query Results */}
      {queryResults.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-success" />
              Query Results
              <Badge variant="secondary" className="ml-2">
                {queryResults.length} rows
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border/50">
                    {Object.keys(queryResults[0]).map((key) => (
                      <th key={key} className="text-left p-3 font-medium text-muted-foreground">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {queryResults.map((row, index) => (
                    <tr key={index} className="border-b border-border/20 hover:bg-muted/30">
                      {Object.values(row).map((value, cellIndex) => (
                        <td key={cellIndex} className="p-3 text-sm">
                          {typeof value === 'number' ? value.toLocaleString() : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Query History */}
      {queryHistory.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-ai-accent" />
              Query History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {queryHistory.map((query, index) => (
              <div key={query.id} className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{query.question}</p>
                    <p className="text-xs text-muted-foreground">
                      {query.timestamp.toLocaleString()} • {query.results.length} results
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setQuestion(query.question);
                      setGeneratedSQL(query.sql);
                      setQueryResults(query.results);
                    }}
                    className="text-ai-primary hover:text-ai-primary hover:bg-ai-primary/10"
                  >
                    Rerun
                  </Button>
                </div>
                {index < queryHistory.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}