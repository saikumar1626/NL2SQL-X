import React, { useState, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { Send, Sparkles, HelpCircle } from 'lucide-react';
interface QueryInputProps {
  onSubmit: (question: string) => void;
  loading: boolean;
  initialValue?: string;
}
const EXAMPLE_QUERIES = [
  "Show total sales per customer",
  "Top 5 selling products in the last 30 days",
  "List customers who placed more than 2 orders",
  "Revenue per region this year",
  "Average order value by product category"
];
export const QueryInput: React.FC<QueryInputProps> = ({ onSubmit, loading, initialValue = "" }) => {
  const [question, setQuestion] = useState(initialValue);
  // Sync with initial value changes (like when selecting from history)
  useEffect(() => {
    setQuestion(initialValue);
  }, [initialValue]);
  const handleSubmit = () => {
    const trimmed = question.trim();
    if (trimmed && !loading) {
      onSubmit(trimmed);
    }
  };
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };
  const handleExampleClick = (q: string) => {
    if (!loading) {
      setQuestion(q);
      onSubmit(q);
    }
  };
  return (
    <div className="space-y-4">
      <div className="relative rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 focus-within:border-brand-blue/50 transition-all duration-200">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800/40">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-brand-cyan animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Natural Language Prompt</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Press <kbd className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-400">Ctrl + Enter</kbd> to ask
          </span>
        </div>
        
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          rows={3}
          className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none font-sans"
          placeholder="Ask a question about your e-commerce data in plain English (e.g. 'What is our total revenue?')"
        />
        <div className="flex justify-end mt-2 pt-2 border-t border-slate-800/30">
          <button
            onClick={handleSubmit}
            disabled={loading || !question.trim()}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all duration-200 ${
              loading || !question.trim()
                ? 'bg-slate-850 border border-slate-800 text-slate-500 cursor-not-allowed'
                : 'glow-button hover:opacity-95'
            }`}
          >
            {loading ? (
              <>
                <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent"></div>
                <span>Translating...</span>
              </>
            ) : (
              <>
                <span>Generate SQL</span>
                <Send className="h-3 w-3" />
              </>
            )}
          </button>
        </div>
      </div>
      {/* Examples Panel */}
      <div className="space-y-2">
        <div className="flex items-center space-x-1.5 px-1">
          <HelpCircle className="h-3.5 w-3.5 text-brand-cyan/80" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Example Prompts</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUERIES.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleExampleClick(q)}
              disabled={loading}
              className={`text-xs text-left px-3 py-1.5 rounded-lg border border-slate-800/80 bg-slate-900/20 text-slate-400 hover:text-brand-cyan hover:border-brand-cyan/30 hover:bg-slate-900/60 transition-all duration-200 ${
                loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              }`}
            >
              "{q}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
export default QueryInput;
