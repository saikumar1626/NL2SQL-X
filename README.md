# 🧠 Natural Language to SQL (NL2SQL) GenAI Assistant

A powerful AI-powered web application that allows users to interact with a structured SQL database using plain English. Built with **React + TypeScript**, powered by **OpenAI's GPT API**, and styled for a clean, professional user experience.

---

## 🚀 Live Demo

🔗 https://lovable.dev/projects/f35125e5-d803-4222-93e4-ea453a5caac6

---

## 🎯 Features

✅ Natural language to SQL conversion using **GPT-4**  
✅ Interactive UI built with **React + Tailwind**  
✅ Connects to a **realistic e-commerce database**  
✅ **Schema explorer** with table relationships  
✅ **Interactive charts** (bar/line/pie) using Recharts  
✅ **Query history** with SQL + natural language pairing  
✅ **CSV export** of query results  
✅ **Safe SQL validator** (blocks DROP, DELETE, etc.)  
✅ Supports **dark mode** UI  

---

## 📊 Example Queries

Try asking:

- "Show total sales per customer"
- "Top 5 selling products in the last 30 days"
- "List customers who placed more than 2 orders"
- "Revenue per region this year"

---

## 🧠 How It Works

1. **User Input**: User types a plain English question.
2. **Prompting**: The app sends a schema-aware, few-shot engineered prompt to OpenAI.
3. **LLM Response**: GPT generates the SQL query.
4. **Validation**: SQL is validated and executed on the database.
5. **Results Display**: Returned as a table and visualized in a chart.
6. **History Logging**: Each query is saved with timestamp and result.

---

## 🗂️ Tech Stack

| Layer       | Tech                          |
|-------------|-------------------------------|
| Frontend    | React + TypeScript + Tailwind |
| AI Engine   | OpenAI GPT-4 API              |
| Charts      | Recharts                      |
| DB          | SQLite (mock backend schema)  |
| Deployment  | Vercel                        |

---

## 🛡️ SQL Safety

To ensure production safety:
- The app **blocks** queries that include `DROP`, `DELETE`, `UPDATE`, `INSERT`, or `TRUNCATE`.
- Only **SELECT** queries are allowed.
- Queries are run in a **read-only** context.

---

## 🔐 Environment Variables

Create a `.env` file in the root of your project:

```bash
REACT_APP_OPENAI_API_KEY=your_openai_api_key
