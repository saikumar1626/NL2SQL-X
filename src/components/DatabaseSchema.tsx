import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Table, Key, Link } from "lucide-react";
import { databaseSchema } from "@/data/mockDatabase";

export default function DatabaseSchema() {
  const tables = [
    {
      name: "customers",
      description: "Customer information and contact details",
      columns: [
        { name: "customer_id", type: "INTEGER", constraint: "PRIMARY KEY" },
        { name: "name", type: "TEXT", constraint: "NOT NULL" },
        { name: "email", type: "TEXT", constraint: "UNIQUE NOT NULL" }
      ]
    },
    {
      name: "orders",
      description: "Order transactions and totals",
      columns: [
        { name: "order_id", type: "INTEGER", constraint: "PRIMARY KEY" },
        { name: "customer_id", type: "INTEGER", constraint: "FOREIGN KEY" },
        { name: "order_date", type: "DATE", constraint: "NOT NULL" },
        { name: "total_amount", type: "FLOAT", constraint: "NOT NULL" }
      ]
    },
    {
      name: "order_items",
      description: "Individual items within each order",
      columns: [
        { name: "item_id", type: "INTEGER", constraint: "PRIMARY KEY" },
        { name: "order_id", type: "INTEGER", constraint: "FOREIGN KEY" },
        { name: "product_name", type: "TEXT", constraint: "NOT NULL" },
        { name: "quantity", type: "INTEGER", constraint: "NOT NULL" },
        { name: "price", type: "FLOAT", constraint: "NOT NULL" }
      ]
    }
  ];

  const getConstraintIcon = (constraint: string) => {
    if (constraint.includes("PRIMARY KEY")) return <Key className="h-3 w-3 text-ai-primary" />;
    if (constraint.includes("FOREIGN KEY")) return <Link className="h-3 w-3 text-ai-accent" />;
    return null;
  };

  const getConstraintColor = (constraint: string) => {
    if (constraint.includes("PRIMARY KEY")) return "bg-ai-primary/10 text-ai-primary border-ai-primary/20";
    if (constraint.includes("FOREIGN KEY")) return "bg-ai-accent/10 text-ai-accent border-ai-accent/20";
    if (constraint.includes("UNIQUE")) return "bg-warning/10 text-warning border-warning/20";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-r from-success to-primary-glow">
            <Database className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-success to-primary-glow bg-clip-text text-transparent">
            Database Schema
          </h2>
        </div>
        <p className="text-muted-foreground text-lg">
          Explore the structure of your e-commerce database
        </p>
      </div>

      {/* Tables Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((table) => (
          <Card key={table.name} className="border-border/50 hover:border-success/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Table className="h-5 w-5 text-success" />
                {table.name}
              </CardTitle>
              <CardDescription className="text-sm">
                {table.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {table.columns.map((column) => (
                <div key={column.name} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    {getConstraintIcon(column.constraint)}
                    <span className="font-mono text-sm font-medium">
                      {column.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs font-mono">
                      {column.type}
                    </Badge>
                    {column.constraint !== "NOT NULL" && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs font-mono ${getConstraintColor(column.constraint)}`}
                      >
                        {column.constraint.replace("PRIMARY KEY", "PK").replace("FOREIGN KEY", "FK")}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Schema SQL */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-success" />
            SQL Schema Definition
          </CardTitle>
          <CardDescription>
            Complete database schema in SQL format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono border border-border/50">
            <code>{databaseSchema}</code>
          </pre>
        </CardContent>
      </Card>

      {/* Relationships */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5 text-ai-accent" />
            Table Relationships
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-ai-primary rounded-full"></span>
                customers → orders
              </h4>
              <p className="text-sm text-muted-foreground">
                One customer can have many orders (1:N relationship)
              </p>
              <code className="text-xs bg-background px-2 py-1 rounded mt-2 block">
                customers.customer_id = orders.customer_id
              </code>
            </div>
            
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-ai-accent rounded-full"></span>
                orders → order_items
              </h4>
              <p className="text-sm text-muted-foreground">
                One order can have many items (1:N relationship)
              </p>
              <code className="text-xs bg-background px-2 py-1 rounded mt-2 block">
                orders.order_id = order_items.order_id
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}