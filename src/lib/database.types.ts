export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          type: 'income' | 'expense'
          icon: string
          color: string
          is_default: boolean
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'income' | 'expense'
          icon?: string
          color?: string
          is_default?: boolean
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'income' | 'expense'
          icon?: string
          color?: string
          is_default?: boolean
          user_id?: string | null
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          title: string
          amount: number
          type: 'income' | 'expense'
          category_id: string
          date: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          amount: number
          type: 'income' | 'expense'
          category_id: string
          date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          amount?: number
          type?: 'income' | 'expense'
          category_id?: string
          date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Category = Database['public']['Tables']['categories']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type TransactionWithCategory = Transaction & { categories: Category };

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  occupation: string | null;
  monthly_income: number | null;
  savings_goal_pct: number;
  currency: string;
  avatar_url: string | null;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreditCard {
  id: string;
  user_id: string;
  card_name: string;
  bank_name: string;
  last_four: string;
  card_type: 'visa' | 'mastercard' | 'rupay' | 'amex' | 'other';
  credit_limit: number;
  current_balance: number;
  billing_date: number;
  due_date: number;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PaymentMethod = 'cash' | 'upi' | 'debit_card' | 'credit_card' | 'net_banking' | 'wallet' | 'cheque' | 'other';

export interface SIPInvestment {
  id: string;
  user_id: string;
  fund_name: string;
  amc: string;
  fund_type: 'equity' | 'debt' | 'hybrid' | 'elss' | 'index' | 'other';
  monthly_amount: number;
  sip_date: number;
  start_date: string;
  end_date: string | null;
  status: 'active' | 'paused' | 'completed';
  color: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
