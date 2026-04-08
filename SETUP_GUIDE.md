# Smart Finance Tracker - Setup Guide

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Installation](#installation)
5. [Database Setup](#database-setup)
6. [Running the Application](#running-the-application)
7. [Building for Production](#building-for-production)
8. [Troubleshooting](#troubleshooting)

## Overview

Smart Finance Tracker is a modern, production-ready web application for personal finance management. Built with React, TypeScript, Tailwind CSS, and Supabase, it provides a robust platform for tracking income and expenses.

### Tech Stack
- **Frontend:** React 18 with TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (JWT-based)
- **Build Tool:** Vite
- **Icons:** Lucide React

### Key Features (MVP)
- User authentication (signup/login)
- Add, view, and delete transactions
- Income and expense categorization
- Real-time financial overview (balance, income, expenses)
- Transaction history with filtering
- Responsive design for all devices

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm or yarn package manager
- A Supabase account (free tier available at https://supabase.com)

## Project Structure

```
smart-finance-tracker/
├── src/
│   ├── components/
│   │   ├── ui/                      # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── index.ts
│   │   ├── AddTransactionModal.tsx  # Modal for adding transactions
│   │   └── TransactionList.tsx      # Transaction list component
│   ├── contexts/
│   │   └── AuthContext.tsx          # Authentication context
│   ├── lib/
│   │   ├── supabase.ts              # Supabase client configuration
│   │   └── database.types.ts        # TypeScript types for database
│   ├── pages/
│   │   ├── Login.tsx                # Login page
│   │   ├── Signup.tsx               # Signup page
│   │   └── Dashboard.tsx            # Main dashboard
│   ├── App.tsx                      # Root component
│   ├── main.tsx                     # Application entry point
│   └── index.css                    # Global styles
├── .env                             # Environment variables
├── package.json                     # Dependencies
├── tailwind.config.js               # Tailwind configuration
├── vite.config.ts                   # Vite configuration
└── tsconfig.json                    # TypeScript configuration
```

## Installation

### Step 1: Clone or Download the Project

If you received this as a zip file, extract it. Otherwise:
```bash
git clone <repository-url>
cd smart-finance-tracker
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- React and React DOM
- TypeScript
- Tailwind CSS
- Supabase client library
- Lucide React (icons)
- Vite (build tool)

## Database Setup

### Step 1: Create a Supabase Project

1. Go to https://supabase.com and sign up for a free account
2. Click "New Project"
3. Fill in your project details:
   - Project name: "Smart Finance Tracker"
   - Database password: (choose a strong password)
   - Region: (select closest to you)
4. Click "Create new project"

### Step 2: Get Your API Credentials

1. Once your project is created, go to "Settings" → "API"
2. Copy the following values:
   - Project URL (under "Project URL")
   - Anon/Public key (under "Project API keys")

### Step 3: Configure Environment Variables

1. Open the `.env` file in the project root
2. Replace the placeholder values with your credentials:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Step 4: Database Schema

The database schema has already been applied automatically during setup. It includes:

**Tables:**
1. **categories** - Predefined and custom categories for transactions
   - Default income categories: Salary, Freelance, Investment, Gift, Other Income
   - Default expense categories: Food & Dining, Transportation, Shopping, Entertainment, Healthcare, Bills & Utilities, Education, Other Expense

2. **transactions** - User transactions
   - Fields: title, amount, type (income/expense), category, date, notes
   - Linked to user accounts
   - Automatic timestamp tracking

**Security:**
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- JWT-based authentication
- Secure policies for all operations (SELECT, INSERT, UPDATE, DELETE)

## Running the Application

### Development Mode

```bash
npm run dev
```

This will start the development server at `http://localhost:5173`

The application will automatically reload when you make changes to the code.

### First-Time User Flow

1. Open your browser and navigate to `http://localhost:5173`
2. You'll see the login page
3. Click "Sign Up" to create a new account
4. Enter your email and password (minimum 6 characters)
5. After signup, click "Go to Sign In"
6. Sign in with your credentials
7. You'll be redirected to the dashboard

### Using the Application

**Dashboard Overview:**
- Top section shows three cards: Total Balance, Total Income, Total Expenses
- Bottom section shows transaction history

**Adding a Transaction:**
1. Click "Add Transaction" button
2. Select type: Income or Expense
3. Fill in the details:
   - Title (e.g., "Groceries", "Salary")
   - Amount
   - Category
   - Date
   - Notes (optional)
4. Click "Add Transaction"

**Deleting a Transaction:**
1. Find the transaction in the list
2. Click the red trash icon
3. Confirm deletion

## Building for Production

### Step 1: Build the Application

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

### Step 2: Preview Production Build

```bash
npm run preview
```

This serves the production build locally for testing.

### Step 3: Deploy

You can deploy the `dist` folder to any static hosting service:
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages
- Firebase Hosting

**Important:** Make sure to set your environment variables in your hosting provider's dashboard.

## Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution:** Ensure your `.env` file has the correct credentials from your Supabase project.

### Issue: Build fails with TypeScript errors

**Solution:** Run `npm run typecheck` to see detailed errors. Ensure all dependencies are installed.

### Issue: Authentication not working

**Solution:**
1. Check that your Supabase URL and key are correct
2. Verify your Supabase project is active
3. Check browser console for error messages

### Issue: Transactions not appearing

**Solution:**
1. Check browser console for errors
2. Verify you're logged in
3. Try refreshing the page
4. Check Supabase dashboard to see if data is being saved

### Issue: Database tables not created

**Solution:** The migration should have been applied automatically. If not, you can apply it manually through the Supabase dashboard.

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript types |

## Next Steps

Now that you have the MVP running, consider these enhancements:

**Phase 2 Features:**
- Multiple account support
- EMI/Bill tracker
- Savings suggestions
- Expense visualization with charts
- Budget planning
- Recurring transactions

**Phase 3 Features:**
- AI-powered insights
- Automated categorization
- Bank statement upload and parsing
- Mobile app
- Export data to CSV/PDF
- Multi-currency support

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review Supabase documentation: https://supabase.com/docs
3. Check React documentation: https://react.dev

## License

This project is provided as-is for educational and commercial use.
