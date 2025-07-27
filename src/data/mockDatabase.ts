// Mock database with sample e-commerce data
export interface Customer {
  customer_id: number;
  name: string;
  email: string;
}

export interface Order {
  order_id: number;
  customer_id: number;
  order_date: string;
  total_amount: number;
}

export interface OrderItem {
  item_id: number;
  order_id: number;
  product_name: string;
  quantity: number;
  price: number;
}

export const customers: Customer[] = [
  { customer_id: 1, name: "Alice Johnson", email: "alice@example.com" },
  { customer_id: 2, name: "Bob Smith", email: "bob@example.com" },
  { customer_id: 3, name: "Carol Williams", email: "carol@example.com" },
  { customer_id: 4, name: "David Brown", email: "david@example.com" },
  { customer_id: 5, name: "Eva Davis", email: "eva@example.com" },
  { customer_id: 6, name: "Frank Miller", email: "frank@example.com" },
  { customer_id: 7, name: "Grace Wilson", email: "grace@example.com" },
  { customer_id: 8, name: "Henry Moore", email: "henry@example.com" },
  { customer_id: 9, name: "Ivy Taylor", email: "ivy@example.com" },
  { customer_id: 10, name: "Jack Anderson", email: "jack@example.com" }
];

export const orders: Order[] = [
  { order_id: 1, customer_id: 1, order_date: "2024-01-15", total_amount: 250.99 },
  { order_id: 2, customer_id: 2, order_date: "2024-01-18", total_amount: 89.50 },
  { order_id: 3, customer_id: 1, order_date: "2024-01-22", total_amount: 156.75 },
  { order_id: 4, customer_id: 3, order_date: "2024-01-25", total_amount: 445.20 },
  { order_id: 5, customer_id: 4, order_date: "2024-02-02", total_amount: 78.99 },
  { order_id: 6, customer_id: 2, order_date: "2024-02-05", total_amount: 329.80 },
  { order_id: 7, customer_id: 5, order_date: "2024-02-12", total_amount: 199.99 },
  { order_id: 8, customer_id: 3, order_date: "2024-02-15", total_amount: 567.45 },
  { order_id: 9, customer_id: 6, order_date: "2024-02-20", total_amount: 123.75 },
  { order_id: 10, customer_id: 7, order_date: "2024-02-28", total_amount: 298.50 },
  { order_id: 11, customer_id: 8, order_date: "2024-03-05", total_amount: 412.30 },
  { order_id: 12, customer_id: 9, order_date: "2024-03-12", total_amount: 89.99 },
  { order_id: 13, customer_id: 10, order_date: "2024-03-18", total_amount: 234.75 },
  { order_id: 14, customer_id: 1, order_date: "2024-03-25", total_amount: 178.90 },
  { order_id: 15, customer_id: 4, order_date: "2024-03-30", total_amount: 367.25 }
];

export const orderItems: OrderItem[] = [
  { item_id: 1, order_id: 1, product_name: "Laptop", quantity: 1, price: 899.99 },
  { item_id: 2, order_id: 1, product_name: "Mouse", quantity: 2, price: 25.50 },
  { item_id: 3, order_id: 2, product_name: "Keyboard", quantity: 1, price: 79.99 },
  { item_id: 4, order_id: 3, product_name: "Monitor", quantity: 1, price: 299.99 },
  { item_id: 5, order_id: 4, product_name: "Smartphone", quantity: 1, price: 699.99 },
  { item_id: 6, order_id: 4, product_name: "Phone Case", quantity: 2, price: 15.99 },
  { item_id: 7, order_id: 5, product_name: "Headphones", quantity: 1, price: 149.99 },
  { item_id: 8, order_id: 6, product_name: "Tablet", quantity: 1, price: 399.99 },
  { item_id: 9, order_id: 7, product_name: "Speaker", quantity: 1, price: 89.99 },
  { item_id: 10, order_id: 8, product_name: "Camera", quantity: 1, price: 549.99 },
  { item_id: 11, order_id: 9, product_name: "Smartwatch", quantity: 1, price: 299.99 },
  { item_id: 12, order_id: 10, product_name: "Wireless Earbuds", quantity: 2, price: 129.99 },
  { item_id: 13, order_id: 11, product_name: "Gaming Mouse", quantity: 1, price: 79.99 },
  { item_id: 14, order_id: 12, product_name: "USB Drive", quantity: 3, price: 19.99 },
  { item_id: 15, order_id: 13, product_name: "Power Bank", quantity: 1, price: 49.99 },
  { item_id: 16, order_id: 14, product_name: "Webcam", quantity: 1, price: 89.99 },
  { item_id: 17, order_id: 15, product_name: "Router", quantity: 1, price: 129.99 }
];

export const databaseSchema = `
-- Database Schema
CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL
);

CREATE TABLE orders (
  order_id INTEGER PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(customer_id),
  order_date DATE NOT NULL,
  total_amount FLOAT NOT NULL
);

CREATE TABLE order_items (
  item_id INTEGER PRIMARY KEY,
  order_id INTEGER REFERENCES orders(order_id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price FLOAT NOT NULL
);
`;

// Simple SQL executor for demo purposes
export function executeSQL(sql: string): any[] {
  const normalizedSQL = sql.toLowerCase().trim();
  
  // Simple SELECT parser for demo
  if (normalizedSQL.includes('select') && normalizedSQL.includes('customers')) {
    if (normalizedSQL.includes('count') || normalizedSQL.includes('total')) {
      return [{ total_customers: customers.length }];
    }
    return customers;
  }
  
  if (normalizedSQL.includes('select') && normalizedSQL.includes('orders')) {
    if (normalizedSQL.includes('sum') && normalizedSQL.includes('total_amount')) {
      const total = orders.reduce((sum, order) => sum + order.total_amount, 0);
      return [{ total_sales: total.toFixed(2) }];
    }
    if (normalizedSQL.includes('count')) {
      return [{ total_orders: orders.length }];
    }
    return orders;
  }
  
  if (normalizedSQL.includes('select') && normalizedSQL.includes('order_items')) {
    return orderItems;
  }
  
  // Join queries (simplified)
  if (normalizedSQL.includes('join') || normalizedSQL.includes('customers') && normalizedSQL.includes('orders')) {
    return orders.map(order => {
      const customer = customers.find(c => c.customer_id === order.customer_id);
      return {
        ...order,
        customer_name: customer?.name,
        customer_email: customer?.email
      };
    });
  }
  
  // Default fallback
  return [{ result: "Query executed successfully", rows_affected: 0 }];
}