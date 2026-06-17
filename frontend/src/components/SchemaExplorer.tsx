import React, { useState } from 'react';
import { Database, ChevronDown, ChevronRight, Key, Link2 } from 'lucide-react';
interface Column {
  name: string;
  type: string;
  primary_key: boolean;
}
interface ForeignKey {
  column: string;
  referred_table: string;
  referred_column: string;
}
interface TableSchema {
  columns: Column[];
  foreign_keys: ForeignKey[];
}
interface SchemaMetadata {
  [tableName: string]: TableSchema;
}
interface SchemaExplorerProps {
  schema: SchemaMetadata | null;
  loading: boolean;
  error: string | null;
}
export const SchemaExplorer: React.FC<SchemaExplorerProps> = ({ schema, loading, error }) => {
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({
    orders: true, // Expand orders by default
  });
  const toggleTable = (tableName: string) => {
    setExpandedTables((prev) => ({
      ...prev,
      [tableName]: !prev[tableName],
    }));
  };
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-slate-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-blue border-t-transparent mb-2"></div>
        <span className="text-xs">Loading schema...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-4 text-xs text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg">
        {error}
      </div>
    );
  }
  if (!schema) {
    return (
      <div className="p-4 text-xs text-slate-500 italic text-center">
        No schema metadata available.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 px-2 pb-2 border-b border-slate-800/60">
        <Database className="h-4 w-4 text-brand-cyan" />
        <span className="text-sm font-semibold tracking-wider text-slate-200 uppercase">Schema Explorer</span>
      </div>
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {Object.entries(schema).map(([tableName, tableSchema]) => {
          const isExpanded = !!expandedTables[tableName];
          
          return (
            <div 
              key={tableName} 
              className="rounded-lg border border-slate-800/40 bg-slate-900/40 overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => toggleTable(tableName)}
                className="w-full flex items-center justify-between px-3 py-2 text-left bg-slate-900/65 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-brand-cyan font-mono">
                    {tableName}
                  </span>
                  <span className="text-[10px] text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded-md border border-slate-800/30">
                    {tableSchema.columns.length} cols
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                )}
              </button>
              {isExpanded && (
                <div className="p-2.5 bg-slate-950/25 border-t border-slate-900/50">
                  <table className="w-full text-[11px] text-left">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-800/40">
                        <th className="pb-1.5 font-medium">Column</th>
                        <th className="pb-1.5 font-medium text-right">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/30 font-mono">
                      {tableSchema.columns.map((col) => {
                        // Check if it's a foreign key
                        const fk = tableSchema.foreign_keys.find(f => f.column === col.name);
                        
                        return (
                          <tr key={col.name} className="hover:bg-slate-900/30">
                            <td className="py-1.5 flex items-center space-x-1 text-slate-300">
                              {col.primary_key && (
                                <span title="Primary Key" className="inline-flex shrink-0">
                                  <Key className="h-3 w-3 text-amber-400" />
                                </span>
                              )}
                              {fk && (
                                <span title={`Foreign Key referencing ${fk.referred_table}(${fk.referred_column})`} className="inline-flex shrink-0">
                                  <Link2 className="h-3 w-3 text-brand-indigo" />
                                </span>
                              )}
                              <span className={col.primary_key ? "text-amber-300/90 font-medium" : ""}>
                                {col.name}
                              </span>
                            </td>
                            <td className="py-1.5 text-right text-slate-500 uppercase text-[10px]">
                              {col.type}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {/* Render Relationships footer if any */}
                  {tableSchema.foreign_keys.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/30 space-y-1">
                      <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Relationships</div>
                      {tableSchema.foreign_keys.map((fk, idx) => (
                        <div key={idx} className="text-[10px] text-brand-indigo/80 font-mono flex items-center space-x-1">
                          <span className="text-slate-400">{fk.column}</span>
                          <span>➔</span>
                          <span className="text-brand-cyan">{fk.referred_table}</span>
                          <span className="text-slate-500">({fk.referred_column})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default SchemaExplorer;
