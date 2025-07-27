import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Table } from "lucide-react";

interface QueryResultsChartProps {
  data: any[];
  title?: string;
}

type ChartType = 'table' | 'bar' | 'line' | 'pie';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff', '#00ffff', '#ff0000'];

export default function QueryResultsChart({ data, title = "Query Results" }: QueryResultsChartProps) {
  const [chartType, setChartType] = useState<ChartType>('table');

  if (!data || data.length === 0) {
    return null;
  }

  // Analyze data to determine best chart types
  const columns = Object.keys(data[0]);
  const numericColumns = columns.filter(col => 
    data.every(row => typeof row[col] === 'number' || !isNaN(Number(row[col])))
  );
  const stringColumns = columns.filter(col => 
    data.some(row => typeof row[col] === 'string' && isNaN(Number(row[col])))
  );

  const canShowCharts = numericColumns.length > 0 && data.length > 1;
  const canShowPieChart = numericColumns.length === 1 && stringColumns.length >= 1 && data.length <= 10;

  // Prepare chart data
  const getChartData = () => {
    if (!canShowCharts) return [];
    
    return data.map(row => {
      const item: any = {};
      // Use first string column as label/x-axis
      if (stringColumns.length > 0) {
        item.name = String(row[stringColumns[0]]).slice(0, 20); // Truncate long names
      } else {
        item.name = `Row ${data.indexOf(row) + 1}`;
      }
      
      // Add numeric values
      numericColumns.forEach(col => {
        item[col] = Number(row[col]);
      });
      
      return item;
    });
  };

  const chartData = getChartData();

  const renderChart = () => {
    if (!canShowCharts) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Charts not available for this data type</p>
            <p className="text-sm">Try queries with numeric results</p>
          </div>
        </div>
      );
    }

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip />
              {numericColumns.map((col, index) => (
                <Bar 
                  key={col} 
                  dataKey={col} 
                  fill={COLORS[index % COLORS.length]}
                  name={col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip />
              {numericColumns.map((col, index) => (
                <Line 
                  key={col} 
                  type="monotone" 
                  dataKey={col} 
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  name={col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        if (!canShowPieChart) {
          return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <PieChartIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Pie chart not suitable for this data</p>
                <p className="text-sm">Need one numeric column and categorical data</p>
              </div>
            </div>
          );
        }

        const pieData = data.map((row, index) => ({
          name: String(row[stringColumns[0]]).slice(0, 15),
          value: Number(row[numericColumns[0]]),
          fill: COLORS[index % COLORS.length]
        }));

        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'table':
      default:
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border/50">
                  {columns.map((key) => (
                    <th key={key} className="text-left p-3 font-medium text-muted-foreground">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={index} className="border-b border-border/20 hover:bg-muted/30 animate-fade-in">
                    {columns.map((key, cellIndex) => (
                      <td key={cellIndex} className="p-3 text-sm">
                        {typeof row[key] === 'number' ? row[key].toLocaleString() : String(row[key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
    }
  };

  return (
    <Card className="border-border/50 animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-success" />
              {title}
              <Badge variant="secondary" className="ml-2">
                {data.length} rows
              </Badge>
            </CardTitle>
            <CardDescription>
              {canShowCharts ? 'Switch between different visualization types' : 'Table view only'}
            </CardDescription>
          </div>
          
          <div className="flex gap-1">
            <Button
              variant={chartType === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('table')}
              className="px-2"
            >
              <Table className="h-4 w-4" />
            </Button>
            
            {canShowCharts && (
              <>
                <Button
                  variant={chartType === 'bar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('bar')}
                  className="px-2"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                
                <Button
                  variant={chartType === 'line' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('line')}
                  className="px-2"
                >
                  <LineChartIcon className="h-4 w-4" />
                </Button>
                
                {canShowPieChart && (
                  <Button
                    variant={chartType === 'pie' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartType('pie')}
                    className="px-2"
                  >
                    <PieChartIcon className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
}