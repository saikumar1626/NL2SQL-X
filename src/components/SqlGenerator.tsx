import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, Database, Sparkles, History, Eye, EyeOff, Download, AlertTriangle, CheckCircle, Settings } from "lucide-react";
import { executeSQL } from "@/data/mockDatabase";
import { useToast } from "@/hooks/use-toast";
import { OpenAIService, SQLGenerationResult } from "@/services/openai";
import { SQLValidator, ValidationResult } from "@/utils/sqlValidator";
import { exportToCSV, exportQueryHistory } from "@/utils/csvExport";
import QueryResultsChart from "./QueryResultsChart";
import ApiKeyManager from "./ApiKeyManager";

interface QueryResult {
  id: string;
  question: string;
  sql: string;
  results: any[];
  timestamp: Date;
  explanation?: string;
  confidence?: number;
  executionTime?: number;
}

export default function SqlGenerator() {
  const [question, setQuestion] = useState("");
  const [generatedSQL, setGeneratedSQL] = useState("");
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSQL, setShowSQL] = useState(true);
  const [queryHistory, setQueryHistory] = useState<QueryResult[]>([]);
  const [currentExplanation, setCurrentExplanation] = useState("");
  const [currentConfidence, setCurrentConfidence] = useState(0);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [openaiService, setOpenaiService] = useState<OpenAIService | null>(null);
  const { toast } = useToast();

  const handleApiKeyChange = (apiKey: string) => {
    if (apiKey && apiKey.trim()) {
      setOpenaiService(new OpenAIService({ apiKey }));
    } else {
      setOpenaiService(null);
    }
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
    const startTime = Date.now();
    
    try {
      // Generate SQL using OpenAI or mock
      let sqlResult: SQLGenerationResult;
      if (openaiService) {
        sqlResult = await openaiService.generateSQL(question);
      } else {
        // Fallback to mock service
        const mockService = new OpenAIService({ apiKey: 'mock' });
        sqlResult = await mockService.generateSQL(question);
      }
      
      const { sql, explanation, confidence } = sqlResult;
      
      // Validate SQL before execution
      const validation = SQLValidator.validate(sql);
      setValidationResult(validation);
      
      if (!validation.isValid) {
        toast({
          title: "SQL Validation Failed",
          description: validation.errors.join(", "),
          variant: "destructive"
        });
        setGeneratedSQL(sql);
        setCurrentExplanation(explanation);
        setCurrentConfidence(confidence);
        return;
      }
      
      if (validation.warnings.length > 0) {
        toast({
          title: "SQL Warnings",
          description: validation.warnings.join(", "),
          variant: "default"
        });
      }
      
      setGeneratedSQL(sql);
      setCurrentExplanation(explanation);
      setCurrentConfidence(confidence);
      
      // Execute SQL on mock database
      const results = executeSQL(validation.sanitizedSQL || sql);
      setQueryResults(results);
      
      const executionTime = Date.now() - startTime;
      
      // Add to history
      const newQuery: QueryResult = {
        id: Date.now().toString(),
        question,
        sql,
        results,
        timestamp: new Date(),
        explanation,
        confidence,
        executionTime
      };
      
      setQueryHistory(prev => [newQuery, ...prev.slice(0, 9)]); // Keep 10 queries
      
      toast({
        title: "Success",
        description: `Query executed in ${executionTime}ms with ${results.length} results`,
        variant: "default"
      });
      
    } catch (error) {
      console.error("Query generation/execution error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate or execute query.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportResults = () => {
    if (queryResults.length === 0) {
      toast({
        title: "No Data",
        description: "No results to export.",
        variant: "destructive"
      });
      return;
    }

    try {
      exportToCSV(queryResults, { filename: 'query-results' });
      toast({
        title: "Export Successful",
        description: "Results exported to CSV file.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export results.",
        variant: "destructive"
      });
    }
  };

  const handleExportHistory = () => {
    if (queryHistory.length === 0) {
      toast({
        title: "No History",
        description: "No query history to export.",
        variant: "destructive"
      });
      return;
    }

    try {
      exportQueryHistory(queryHistory, { filename: 'query-history' });
      toast({
        title: "Export Successful",
        description: "Query history exported to CSV file.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export query history.",
        variant: "destructive"
      });
    }
  };

  const exampleQuestions = [
    "Show me all customers and their orders",
    "What's the total sales amount?",
    "How many customers do we have?",
    "List all products and their quantities sold",
    "Show recent orders from this month",
    "Find customers who spent more than $200",
    "Which products are most popular?",
    "Show average order value by month"
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
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowApiConfig(!showApiConfig)}
            className="border-border/50"
          >
            <Settings className="h-4 w-4 mr-2" />
            API Settings
          </Button>
        </div>
      </div>

      {/* API Configuration */}
      {showApiConfig && (
        <div className="animate-fade-in">
          <ApiKeyManager onApiKeyChange={handleApiKeyChange} />
        </div>
      )}

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
            <div className="flex gap-2">
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
              
              {queryResults.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleExportResults}
                  className="border-border/50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
            
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

      {/* SQL Validation Results */}
      {validationResult && !validationResult.isValid && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <strong>SQL Validation Failed:</strong>
            <ul className="mt-1 ml-4 list-disc">
              {validationResult.errors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Generated SQL */}
      {generatedSQL && showSQL && (
        <Card className="border-border/50 animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-success" />
                Generated SQL Query
                {validationResult?.isValid && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
              {currentConfidence > 0 && (
                <Badge variant={currentConfidence > 0.8 ? "default" : "secondary"}>
                  {Math.round(currentConfidence * 100)}% confidence
                </Badge>
              )}
            </CardTitle>
            {currentExplanation && (
              <CardDescription>{currentExplanation}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono border border-border/50">
              <code>{generatedSQL}</code>
            </pre>
            {validationResult?.warnings && validationResult.warnings.length > 0 && (
              <Alert className="mt-4 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription>
                  <strong>Warnings:</strong>
                  <ul className="mt-1 ml-4 list-disc">
                    {validationResult.warnings.map((warning, index) => (
                      <li key={index} className="text-sm">{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Query Results with Charts */}
      {queryResults.length > 0 && (
        <QueryResultsChart data={queryResults} title="Query Results" />
      )}

      {/* Query History */}
      {queryHistory.length > 0 && (
        <Card className="border-border/50 animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-ai-accent" />
                Query History
                <Badge variant="secondary">{queryHistory.length} queries</Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportHistory}
                className="border-border/50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export History
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {queryHistory.map((query, index) => (
              <div key={query.id} className="space-y-2 hover-scale">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{query.question}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-xs text-muted-foreground">
                        {query.timestamp.toLocaleString()} • {query.results.length} results
                      </p>
                      {query.executionTime && (
                        <Badge variant="outline" className="text-xs">
                          {query.executionTime}ms
                        </Badge>
                      )}
                      {query.confidence && (
                        <Badge variant={query.confidence > 0.8 ? "default" : "secondary"} className="text-xs">
                          {Math.round(query.confidence * 100)}%
                        </Badge>
                      )}
                    </div>
                    {query.explanation && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        {query.explanation}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setQuestion(query.question);
                      setGeneratedSQL(query.sql);
                      setQueryResults(query.results);
                      setCurrentExplanation(query.explanation || "");
                      setCurrentConfidence(query.confidence || 0);
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