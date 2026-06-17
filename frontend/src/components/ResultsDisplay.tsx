import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Copy, Check, Download, Table, BarChart3, Code2, AlertCircle, ArrowUpDown 
} from 'lucide-react';
interface ResultsDisplayProps {
  sql: string | null;
  results: Record<string, any>[] | null;
  columns: string[] | null;
  chartType: string | null;
  error: string | null;
}
const COLORS = [
  '#3b82f6', // blue
  '#06b6d4', // cyan
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
];
export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  sql,
  results,
  columns,
  chartType,
  error
}) => {
  const [activeTab, setActiveTab] = useState<'chart' | 'table' | 'sql'>('chart');
  const [copied, setCopied] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  // Reset tab to chart when new results come in
  React.useEffect(() => {
    if (results && results.length > 0) {
      // If we have chart coordinates, default to chart, else table
      if (chartType && chartType !== 'table') {
        setActiveTab('chart');
      } else {
        setActiveTab('table');
      }
    }
  }, [results, chartType]);
  // Copy SQL to clipboard
  const handleCopySQL = () => {
    if (sql) {
      navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  // Export results to CSV
  const handleExportCSV = () => {
    if (!results || !columns) return;
    
    // Create header row
    const csvRows = [columns.join(',')];
    
    // Add value rows
    for (const row of results) {
      const values = columns.map(col => {
        const val = row[col];
        // Handle values containing commas
        if (typeof val === 'string' && val.includes(',')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val === null ? '' : val;
      });
      csvRows.push(values.join(','));
    }
    
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nl2sql_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  // Sorting Handler
  const handleSort = (column: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === column && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: column, direction });
  };
  // Sorted Results Memo
  const sortedResults = useMemo(() => {
    if (!results) return null;
    if (!sortConfig) return results;
    return [...results].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      
      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [results, sortConfig]);
  // Determine chart metrics mapping
  const chartConfig = useMemo(() => {
    if (!results || !columns || results.length === 0) return null;
    const xAxisKey = columns[0];
    const yAxisKeys: string[] = [];
    // All columns except the first one that hold numeric values
    const firstRow = results[0];
    columns.slice(1).forEach(col => {
      const val = firstRow[col];
      if (typeof val === 'number') {
        yAxisKeys.push(col);
      }
    });
    // Fallback: if no numeric columns found, just use the second column
    if (yAxisKeys.length === 0 && columns.length > 1) {
      yAxisKeys.push(columns[1]);
    }
    return { xAxisKey, yAxisKeys };
  }, [results, columns]);
  // Render Error state
  if (error) {
    return (
      <div className="rounded-xl border border-red-900/35 bg-red-950/15 p-5 flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-red-200">Execution Error</h4>
          <p className="mt-1 text-xs text-red-300/90 leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }
  // Render Empty/No Data state
  if (results && results.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-8 text-center">
        <AlertCircle className="h-6 w-6 text-slate-500 mx-auto mb-2" />
        <h4 className="text-sm font-medium text-slate-300">No data found for your query</h4>
        <p className="mt-1 text-xs text-slate-500">The database returned 0 rows for this query.</p>
        {sql && (
          <div className="mt-4 max-w-lg mx-auto text-left">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">Generated SQL:</span>
            <code className="text-xs font-mono text-brand-cyan bg-slate-950 p-2.5 rounded border border-slate-900 block overflow-x-auto whitespace-nowrap">
              {sql}
            </code>
          </div>
        )}
      </div>
    );
  }
  if (!results || !columns || !chartConfig) {
    return (
      <div className="rounded-xl border border-dashed border-slate-850 p-12 text-center text-slate-500 text-xs">
        Submit a question above to see data translation and visualizations.
      </div>
    );
  }
  const { xAxisKey, yAxisKeys } = chartConfig;
  // Custom Chart Tooltip styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/95 border border-slate-800 p-3 rounded-lg shadow-xl font-sans text-xs">
          <p className="font-semibold text-slate-200 mb-1.5">{label}</p>
          {payload.map((pld: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-6 py-0.5">
              <span className="text-slate-400" style={{ color: pld.color }}>
                {pld.name}:
              </span>
              <span className="font-mono font-bold text-slate-100">
                {typeof pld.value === 'number' ? (pld.value % 1 === 0 ? pld.value : pld.value.toFixed(2)) : pld.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };
  return (
    <div className="space-y-4">
      {/* Tabs and Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
        <div className="flex bg-slate-950/70 p-0.5 rounded-lg border border-slate-900">
          {chartType && chartType !== 'table' && (
            <button
              onClick={() => setActiveTab('chart')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
                activeTab === 'chart' 
                  ? 'bg-slate-800/80 text-brand-cyan shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Visual Chart</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('table')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
              activeTab === 'table' 
                ? 'bg-slate-800/80 text-brand-cyan shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="h-3.5 w-3.5" />
            <span>Data Table</span>
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
              activeTab === 'sql' 
                ? 'bg-slate-800/80 text-brand-cyan shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>SQL Query</span>
          </button>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center space-x-1.5 px-3.5 py-1.5 rounded-lg border border-slate-800/80 bg-slate-900/20 text-xs font-semibold text-slate-300 hover:text-brand-cyan hover:border-brand-cyan/20 transition-all"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export CSV</span>
        </button>
      </div>
      {/* Tab Panels */}
      <div className="rounded-xl border border-slate-800/70 bg-slate-900/15 p-4 min-h-[300px] flex flex-col justify-center">
        
        {/* CHART PANEL */}
        {activeTab === 'chart' && chartType && chartType !== 'table' && (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={results} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                  <XAxis dataKey={xAxisKey} stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
                  {yAxisKeys.map((key, idx) => (
                    <Bar 
                      key={key} 
                      dataKey={key} 
                      fill={COLORS[idx % COLORS.length]} 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={45}
                    />
                  ))}
                </BarChart>
              ) : chartType === 'line' ? (
                <LineChart data={results} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                  <XAxis dataKey={xAxisKey} stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 10 }} />
                  {yAxisKeys.map((key, idx) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={COLORS[idx % COLORS.length]}
                      strokeWidth={2}
                      activeDot={{ r: 5 }}
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              ) : chartType === 'pie' ? (
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 10 }} />
                  <Pie
                    data={results}
                    dataKey={yAxisKeys[0]}
                    nameKey={xAxisKey}
                    cx="50%"
                    cy="45%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={3}
                    label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    labelLine={true}
                  >
                    {results.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                  Chart type not supported.
                </div>
              )}
            </ResponsiveContainer>
          </div>
        )}
        {/* DATA TABLE PANEL */}
        {activeTab === 'table' && (
          <div className="overflow-x-auto max-h-[320px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                  {columns.map(col => {
                    const isSorted = sortConfig?.key === col;
                    return (
                      <th 
                        key={col} 
                        onClick={() => handleSort(col)}
                        className="py-2.5 px-3 font-semibold hover:text-slate-100 cursor-pointer select-none transition-colors"
                      >
                        <div className="flex items-center space-x-1.5 uppercase tracking-wider text-[10px]">
                          <span>{col.replace(/_/g, ' ')}</span>
                          <ArrowUpDown className={`h-3 w-3 ${isSorted ? 'text-brand-cyan' : 'text-slate-600'}`} />
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/50">
                {sortedResults?.map((row, idx) => (
                  <tr 
                    key={idx} 
                    className="hover:bg-slate-900/20 transition-colors"
                  >
                    {columns.map(col => {
                      const val = row[col];
                      return (
                        <td key={col} className="py-2 px-3 font-mono text-slate-300">
                          {val === null ? (
                            <span className="text-slate-600 italic">null</span>
                          ) : typeof val === 'number' ? (
                            val % 1 === 0 ? val : val.toFixed(2)
                          ) : (
                            String(val)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* SQL QUERY PANEL */}
        {activeTab === 'sql' && (
          <div className="relative">
            <div className="absolute right-2 top-2 z-10">
              <button
                onClick={handleCopySQL}
                className="flex items-center space-x-1 p-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 transition-all"
                title="Copy SQL"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400 px-1 font-semibold">Copied!</span>
                  </>
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            
            <pre className="p-4 bg-slate-950 rounded-lg border border-slate-900 font-mono text-xs text-brand-cyan overflow-x-auto leading-relaxed max-h-[300px]">
              <code>{sql}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
export default ResultsDisplay;
