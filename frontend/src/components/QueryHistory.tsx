import React from 'react';
import { History, Play, Terminal, Calendar, Layers } from 'lucide-react';
interface HistoryItem {
  question: string;
  sql_query: string;
  row_count: number;
  timestamp: string;
}
interface QueryHistoryProps {
  history: HistoryItem[];
  onSelectQuery: (question: string) => void;
  loading: boolean;
}
export const QueryHistory: React.FC<QueryHistoryProps> = ({ history, onSelectQuery, loading }) => {
  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr.replace(" ", "T")); // Handle SQLite datetime format compatibility
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeStr;
    }
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 px-2 pb-2 border-b border-slate-800/60">
        <History className="h-4 w-4 text-brand-cyan" />
        <span className="text-sm font-semibold tracking-wider text-slate-200 uppercase">Query History</span>
      </div>
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {history.length === 0 ? (
          <div className="p-4 text-xs text-slate-500 italic text-center">
            No queries in history yet.
          </div>
        ) : (
          history.map((item, idx) => (
            <div
              key={idx}
              onClick={() => !loading && onSelectQuery(item.question)}
              className={`group p-3 rounded-lg border border-slate-800 bg-slate-900/35 hover:bg-slate-850/60 hover:border-brand-blue/30 cursor-pointer transition-all duration-200 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-1.5">
                <p className="text-xs font-medium text-slate-300 line-clamp-2 leading-relaxed group-hover:text-slate-200">
                  {item.question}
                </p>
                <div className="h-5 w-5 shrink-0 rounded bg-slate-950 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-slate-800">
                  <Play className="h-2.5 w-2.5 text-brand-cyan fill-brand-cyan/20" />
                </div>
              </div>
              {/* Truncated SQL preview */}
              <div className="mt-2 flex items-center space-x-1.5 text-[10px] font-mono text-slate-500 bg-slate-950/60 py-1 px-1.5 rounded border border-slate-900/40">
                <Terminal className="h-3 w-3 text-slate-600 shrink-0" />
                <span className="truncate w-full block">
                  {item.sql_query}
                </span>
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[9px] text-slate-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-2.5 w-2.5" />
                  <span>{formatTime(item.timestamp)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Layers className="h-2.5 w-2.5 text-brand-cyan/80" />
                  <span className="font-semibold text-slate-400">{item.row_count} rows</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default QueryHistory;
