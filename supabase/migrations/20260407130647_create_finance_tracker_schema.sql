/*
  # Smart Finance Tracker - Database Schema

  ## Overview
  This migration creates the core database schema for the Smart Finance Tracker MVP.
  It includes tables for categories and transactions with proper security policies.

  ## New Tables

  ### 1. categories
  - `id` (uuid, primary key) - Unique identifier for each category
  - `name` (text) - Category name (e.g., "Salary", "Food", "Transport")
  - `type` (text) - Transaction type: "income" or "expense"
  - `icon` (text) - Icon name for UI display
  - `color` (text) - Color code for visual representation
  - `is_default` (boolean) - Whether this is a system default category
  - `user_id` (uuid, nullable) - User who created custom category (null for defaults)
  - `created_at` (timestamptz) - Timestamp of creation

  ### 2. transactions
  - `id` (uuid, primary key) - Unique identifier for each transaction
  - `user_id` (uuid, foreign key) - References auth.users
  - `title` (text) - Transaction description/title
  - `amount` (decimal) - Transaction amount (positive value)
  - `type` (text) - Transaction type: "income" or "expense"
  - `category_id` (uuid, foreign key) - References categories table
  - `date` (date) - Transaction date
  - `notes` (text, nullable) - Optional notes about the transaction
  - `created_at` (timestamptz) - Timestamp of creation
  - `updated_at` (timestamptz) - Timestamp of last update

  ## Security
  - Enable RLS on all tables
  - Users can only view and manage their own transactions
  - Default categories are visible to all authenticated users
  - Users can create and manage their own custom categories

  ## Indexes
  - Created on user_id and date columns for efficient queries
  - Created on category_id for join performance
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  icon text NOT NULL DEFAULT 'circle',
  color text NOT NULL DEFAULT '#6B7280',
  is_default boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  amount decimal(12, 2) NOT NULL CHECK (amount > 0),
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Categories RLS Policies

-- Allow authenticated users to view default categories and their own custom categories
CREATE POLICY "Users can view default categories and own custom categories"
  ON categories FOR SELECT
  TO authenticated
  USING (is_default = true OR user_id = auth.uid());

-- Allow authenticated users to create their own custom categories
CREATE POLICY "Users can create own categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_default = false);

-- Allow users to update their own custom categories
CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND is_default = false)
  WITH CHECK (user_id = auth.uid() AND is_default = false);

-- Allow users to delete their own custom categories
CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND is_default = false);

-- Transactions RLS Policies

-- Allow users to view only their own transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow users to create their own transactions
CREATE POLICY "Users can create own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow users to update their own transactions
CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow users to delete their own transactions
CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for transactions updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories for income
INSERT INTO categories (name, type, icon, color, is_default) VALUES
  ('Salary', 'income', 'banknote', '#10B981', true),
  ('Freelance', 'income', 'briefcase', '#059669', true),
  ('Investment', 'income', 'trending-up', '#34D399', true),
  ('Gift', 'income', 'gift', '#6EE7B7', true),
  ('Other Income', 'income', 'plus-circle', '#A7F3D0', true)
ON CONFLICT DO NOTHING;

-- Insert default categories for expenses
INSERT INTO categories (name, type, icon, color, is_default) VALUES
  ('Food & Dining', 'expense', 'utensils', '#EF4444', true),
  ('Transportation', 'expense', 'car', '#F97316', true),
  ('Shopping', 'expense', 'shopping-bag', '#F59E0B', true),
  ('Entertainment', 'expense', 'tv', '#EC4899', true),
  ('Healthcare', 'expense', 'heart-pulse', '#8B5CF6', true),
  ('Bills & Utilities', 'expense', 'receipt', '#3B82F6', true),
  ('Education', 'expense', 'graduation-cap', '#06B6D4', true),
  ('Other Expense', 'expense', 'minus-circle', '#6B7280', true)
ON CONFLICT DO NOTHING;