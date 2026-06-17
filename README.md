<div align="center">

# 🧠 NL2SQL-X

**Natural Language to SQL GenAI Assistant**

[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_1.5_Flash-886FBF?style=flat-square&logo=googlegemini&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)

> Type a plain English question → Get SQL + results + charts instantly.
> Powered by Google Gemini API with a FastAPI backend and React frontend.

</div>

---

## 🎯 What is NL2SQL-X?

NL2SQL-X is an AI-powered web application that lets anyone interact with a structured SQL database using plain English — no SQL knowledge required. It uses Google Gemini to generate accurate, schema-aware SQL queries, executes them safely on a SQLite e-commerce database, and visualizes the results as interactive charts and sortable tables.

---

## 🏗️ Architecture

```
         User
           │
  React Frontend
  TypeScript + Tailwind CSS
           │
  FastAPI Backend (Python)
      ┌────┴────┐
      │         │
 Gemini API   SQLite DB
 gemini-1.5   database.db
   flash
```

---

## ✨ Features

- 🧠 **Natural Language to SQL** — powered by Gemini 1.5 Flash with schema-aware few-shot prompting
- 📊 **Auto Chart Detection** — bar, line, or pie chart based on query result shape
- 🔐 **SQL Safety Validator** — blocks DROP, DELETE, UPDATE, INSERT, TRUNCATE, ALTER
- 📋 **Schema Explorer** — collapsible sidebar showing all tables, columns, and relationships
- 🕐 **Query History** — saves last 20 queries, click to re-run
- 📥 **CSV Export** — download any result set instantly
- 🌙 **Dark Mode UI** — clean dark navy/slate theme
- ⌨️ **Keyboard Shortcut** — Ctrl+Enter to submit query

---

## 💬 Example Queries

```
"Show total sales per customer"
"Top 5 selling products in the last 30 days"
"List customers who placed more than 2 orders"
"Revenue per region this year"
"Average order value by product category"
```

---

## ⚙️ How It Works

1. **User Input** — types a plain English question
2. **Prompting** — schema-aware few-shot prompt sent to Gemini
3. **LLM Response** — Gemini generates the SQL query
4. **Validation** — SQL is safety-checked before execution
5. **Results Display** — returned as table + auto-detected chart
6. **History Logging** — query saved with timestamp and row count

---

## 🗄️ Database Schema

```
regions          customers           products
────────         ──────────          ────────
id (PK)          id (PK)             id (PK)
name             name                name
country          email               category
                 region (FK)         price
                 created_at          stock

orders
──────────────
id (PK)
customer_id (FK)
product_id (FK)
quantity
total_amount
order_date
status
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Tailwind CSS |
| Charts | Recharts |
| AI Engine | Google Gemini 1.5 Flash |
| Backend | Python FastAPI |
| Database | SQLite |
| Deployment | Vercel + Render |

---

## 🚀 Getting Started

### Backend
```bash
cd backend
pip install -r requirements.txt
# Add your Gemini API key to .env
cp .env.example .env
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
```
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=./database.db
```

---

## 🔐 SQL Safety

All queries are validated before execution:
- ✅ Only `SELECT` statements allowed
- ❌ Blocks: `DROP`, `DELETE`, `UPDATE`, `INSERT`, `TRUNCATE`, `ALTER`
- 🔒 Read-only database context

---

## 🗺️ Roadmap

- [ ] Support for PostgreSQL and MySQL
- [ ] User-defined schema upload
- [ ] Query explanation in plain English
- [ ] Multi-turn conversation support
- [ ] Query optimization suggestions

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

🧠 **NL2SQL-X — Talk to your database in plain English.**

</div>
