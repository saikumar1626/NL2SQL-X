export interface ExportOptions {
  filename?: string;
  includeTimestamp?: boolean;
}

export function exportToCSV(data: any[], options: ExportOptions = {}) {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  const { filename = 'query-results', includeTimestamp = true } = options;
  
  // Get headers from the first row
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    // Header row
    headers.join(','),
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that contain commas, quotes, or newlines
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const timestamp = includeTimestamp ? `-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}` : '';
    link.setAttribute('download', `${filename}${timestamp}.csv`);
    
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function exportQueryHistory(history: any[], options: ExportOptions = {}) {
  if (!history || history.length === 0) {
    throw new Error('No query history to export');
  }

  const { filename = 'query-history', includeTimestamp = true } = options;
  
  // Transform history data for CSV export
  const exportData = history.map((query, index) => ({
    query_number: index + 1,
    question: query.question,
    sql: query.sql,
    result_count: query.results.length,
    timestamp: query.timestamp.toISOString(),
    execution_date: query.timestamp.toLocaleDateString(),
    execution_time: query.timestamp.toLocaleTimeString()
  }));

  exportToCSV(exportData, { filename, includeTimestamp });
}