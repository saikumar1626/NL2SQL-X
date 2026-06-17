import { useState, useEffect } from 'react';
import { SchemaExplorer } from './SchemaExplorer';
import { QueryHistory } from './QueryHistory';
import { QueryInput } from './QueryInput';
import { ResultsDisplay } from './ResultsDisplay';
import { Terminal, Cpu, Info } from 'lucide-react';

interface HistoryItem {
  question: string;
  sql_query: string;
  row_count: number;
  timestamp: string;
}

export default function App() {
  const [schema, setSchema] = useState<any>(null);
  const [schemaLoading, setSchemaLoading] = useState(true);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [sql, setSql] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>[] | null>(null);
  const [columns, setColumns] = useState<string[] | null>(null);
  const [chartType, setChartType] = useState<string | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  const fetchSchema = async () => {
    setSchemaLoading(true);
    setSchemaError(null);
    try {
      const res = await fetch('/api/schema');
      if (!res.ok) throw new Error(`Failed to fetch schema (Status: ${res.status})`);
      const data = await res.json();
      setSchema(data);
    } catch (err: any) {
      setSchemaError(err.message || "Failed to load database schema.");
    } finally {
      setSchemaLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  useEffect(() => {
    fetchSchema();
    fetchHistory();
  }, []);

  const handleQuerySubmit = async (question: string) => {
    setCurrentQuestion(question);
    setQueryLoading(true);
    setQueryError(null);
    setSql(null);
    setResults(null);
    setColumns(null);
    setChartType(null);
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "An unexpected error occurred.");
      setSql(data.sql);
      setResults(data.results);
      setColumns(data.columns);
      setChartType(data.chart_type);
      fetchHistory();
    } catch (err: any) {
      setQueryError(err.message || "AI service unavailable, try again.");
    } finally {
      setQueryLoading(false);
    }
  };

  const selectHistoryQuery = (question: string) => {
    setCurrentQuestion(question);
    handleQuerySubmit(question);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <div className="absolute top-0 left-1/4 right-0 h-64 bg-gradient-to-b from-blue-900/10 via-transparent to-transparent pointer-events-none z-0" />
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[150px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none z-0" />

      <div className="flex-1 max-w-[1500px] w-full mx-auto px-4 py-5 grid grid-cols-1 lg:grid-cols-4 gap-6 z-10">

        <aside className="lg:col-span-1 flex flex-col space-y-5 h-fit lg:h-[calc(100vh-40px)] lg:sticky lg:top-5">

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center">
              <Cpu className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-md font-bold tracking-tight text-white flex items-center space-x-1">
                <span>NL2SQL</span>
                <span className="text-cyan-400 font-extrabold">-X</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">AI SQL Engine</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 flex-1 overflow-hidden flex flex-col min-h-[300px]">
            <SchemaExplorer
              schema={schema}
              loading={schemaLoading}
              error={schemaError}
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 flex-1 overflow-hidden flex flex-col min-h-[250px]">
            <QueryHistory
              history={history}
              onSelectQuery={selectHistoryQuery}
              loading={queryLoading}
            />
          </div>
        </aside>

        <main className="lg:col-span-3 flex flex-col space-y-6">

          <div className="p-4 rounded-xl bg-slate-900 border-l-4 border-l-cyan-500 border border-slate-700 flex items-start space-x-3">
            <Info className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-200 block mb-0.5">Welcome to NL2SQL-X!</span>
              Type plain English questions to query the e-commerce database. Results are shown as tables and auto-detected charts.
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900 border border-slate-700">
            <QueryInput
              onSubmit={handleQuerySubmit}
              loading={queryLoading}
              initialValue={currentQuestion}
            />
          </div>

          <div className="p-5 rounded-xl bg-slate-900 border border-slate-700">
            <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-slate-800">
              <Terminal className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Query Outputs & Visualizations</span>
            </div>
            <ResultsDisplay
              sql={sql}
              results={results}
              columns={columns}
              chartType={chartType}
              error={queryError}
            />
          </div>
        </main>
      </div>

      <footer className="py-4 border-t border-slate-900 text-center text-[10px] text-slate-600 font-mono tracking-wider">
        NL2SQL-X &bull; GOOGLE GEMINI POWERED &bull; SQLite dialect
      </footer>
    </div>
  );
}