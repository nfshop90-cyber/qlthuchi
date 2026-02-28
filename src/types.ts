import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export type Frequency = 'daily' | 'weekly' | 'monthly';

export interface RecurringExpense {
  id: string;
  amount: number;
  categoryId: string;
  frequency: Frequency;
  startDate: string; // ISO string
  lastProcessedDate?: string; // ISO string
}

export interface Expense {
  id: string;
  amount: number;
  date: string; // ISO string
  categoryId?: string;
  recurringId?: string; // To track if it was generated from a recurring expense
}

export interface MonthlyBudget {
  month: string; // YYYY-MM
  initialAmount: number;
  expenses: Expense[];
}

export type AppData = Record<string, MonthlyBudget>;

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Ăn uống', icon: 'Utensils', color: '#f87171' },
  { id: 'cat-2', name: 'Di chuyển', icon: 'Car', color: '#60a5fa' },
  { id: 'cat-3', name: 'Mua sắm', icon: 'ShoppingBag', color: '#fbbf24' },
  { id: 'cat-4', name: 'Giải trí', icon: 'Gamepad2', color: '#a78bfa' },
  { id: 'cat-5', name: 'Nhà cửa', icon: 'Home', color: '#4ade80' },
  { id: 'cat-6', name: 'Khác', icon: 'MoreHorizontal', color: '#94a3b8' },
];
