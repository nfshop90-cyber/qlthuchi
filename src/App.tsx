/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, 
  Wallet, 
  History, 
  TrendingDown, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Trash2,
  AlertCircle,
  PieChart as ChartIcon,
  Settings,
  Filter,
  Tag,
  Utensils,
  Car,
  ShoppingBag,
  Gamepad2,
  Home,
  MoreHorizontal,
  X,
  Edit2,
  BarChart as BarChartIcon
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  isSameMonth, 
  parseISO, 
  addMonths, 
  subMonths, 
  isWithinInterval,
  startOfDay,
  endOfDay,
  addDays,
  addWeeks,
  isAfter,
  isBefore,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import { cn, type AppData, type Expense, type MonthlyBudget, type Category, DEFAULT_CATEGORIES, type RecurringExpense, type Frequency } from './types';

const ICON_MAP: Record<string, any> = {
  Utensils,
  Car,
  ShoppingBag,
  Gamepad2,
  Home,
  MoreHorizontal,
  Tag,
  Calendar
};

export default function App() {
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem('expense_manager_data');
    return saved ? JSON.parse(saved) : {};
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('expense_manager_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>(() => {
    const saved = localStorage.getItem('expense_manager_recurring');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthKey = format(currentMonth, 'yyyy-MM');

  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'reports' | 'categories'>('overview');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Form states
  const [budgetInput, setBudgetInput] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState(categories[0]?.id || '');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<Frequency>('monthly');
  
  // Category form states
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState('#6366f1');
  const [catIcon, setCatIcon] = useState('Tag');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Filter states
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedReportCategory, setSelectedReportCategory] = useState<string | null>(null);
  const [reportDateRange, setReportDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  useEffect(() => {
    localStorage.setItem('expense_manager_data', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem('expense_manager_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('expense_manager_recurring', JSON.stringify(recurringExpenses));
  }, [recurringExpenses]);

  // Process recurring expenses on mount
  useEffect(() => {
    processRecurringExpenses();
  }, []);

  const processRecurringExpenses = () => {
    const now = new Date();
    let updatedRecurring = [...recurringExpenses];
    let newData = { ...data };
    let hasChanges = false;

    updatedRecurring = updatedRecurring.map(recurring => {
      const startDate = parseISO(recurring.startDate);
      const lastProcessed = recurring.lastProcessedDate ? parseISO(recurring.lastProcessedDate) : startDate;
      let nextDate = lastProcessed;
      let currentRecurring = { ...recurring };

      // Determine how many instances to generate
      while (true) {
        if (recurring.frequency === 'daily') nextDate = addDays(nextDate, 1);
        else if (recurring.frequency === 'weekly') nextDate = addWeeks(nextDate, 1);
        else if (recurring.frequency === 'monthly') nextDate = addMonths(nextDate, 1);

        if (isAfter(nextDate, now)) break;

        // Generate expense
        const mKey = format(nextDate, 'yyyy-MM');
        const newExpense: Expense = {
          id: crypto.randomUUID(),
          amount: recurring.amount,
          date: nextDate.toISOString(),
          categoryId: recurring.categoryId,
          recurringId: recurring.id
        };

        if (!newData[mKey]) {
          newData[mKey] = { month: mKey, initialAmount: 0, expenses: [] };
        }
        newData[mKey].expenses = [newExpense, ...newData[mKey].expenses];
        currentRecurring.lastProcessedDate = nextDate.toISOString();
        hasChanges = true;
      }
      return currentRecurring;
    });

    if (hasChanges) {
      setData(newData);
      setRecurringExpenses(updatedRecurring);
    }
  };

  const currentMonthData = useMemo((): MonthlyBudget | undefined => {
    return data[monthKey];
  }, [data, monthKey]);

  const filteredExpenses = useMemo(() => {
    if (!currentMonthData) return [];
    if (selectedCategoryFilter === 'all') return currentMonthData.expenses;
    return currentMonthData.expenses.filter(e => e.categoryId === selectedCategoryFilter);
  }, [currentMonthData, selectedCategoryFilter]);

  const groupedHistory = useMemo(() => {
    const groups: Record<string, { total: number, expenses: Expense[] }> = {};
    
    filteredExpenses.forEach(expense => {
      const dateKey = format(parseISO(expense.date), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = { total: 0, expenses: [] };
      }
      groups[dateKey].total += expense.amount;
      groups[dateKey].expenses.push(expense);
    });

    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredExpenses]);

  const totalSpent = useMemo(() => {
    if (!currentMonthData) return 0;
    return currentMonthData.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [currentMonthData]);

  const balance = useMemo(() => {
    if (!currentMonthData) return 0;
    return currentMonthData.initialAmount - totalSpent;
  }, [currentMonthData, totalSpent]);

  // Report Data
  const reportData = useMemo(() => {
    const start = startOfDay(parseISO(reportDateRange.start));
    const end = endOfDay(parseISO(reportDateRange.end));
    
    const allExpenses: Expense[] = (Object.values(data) as MonthlyBudget[]).flatMap(m => m.expenses);
    const filtered = allExpenses.filter(e => {
      const d = parseISO(e.date);
      return isWithinInterval(d, { start, end });
    });

    const byCategory = categories.map(cat => {
      const amount = filtered
        .filter(e => e.categoryId === cat.id)
        .reduce((sum, e) => sum + e.amount, 0);
      return { id: cat.id, name: cat.name, value: amount, color: cat.color };
    }).filter(c => c.value > 0);

    const total = filtered.reduce((sum, e) => sum + e.amount, 0);

    return { expenses: filtered, byCategory, total };
  }, [data, categories, reportDateRange]);

  const handleSetBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(budgetInput);
    if (isNaN(amount) || amount <= 0) return;

    setData(prev => ({
      ...prev,
      [monthKey]: {
        month: monthKey,
        initialAmount: amount,
        expenses: prev[monthKey]?.expenses || []
      }
    }));
    setBudgetInput('');
    setShowBudgetModal(false);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || amount <= 0) return;

    const newExpense: Expense = {
      id: crypto.randomUUID(),
      amount,
      date: new Date().toISOString(),
      categoryId: expenseCategory
    };

    if (isRecurring) {
      const newRecurring: RecurringExpense = {
        id: crypto.randomUUID(),
        amount,
        categoryId: expenseCategory,
        frequency: recurringFrequency,
        startDate: new Date().toISOString(),
        lastProcessedDate: new Date().toISOString()
      };
      setRecurringExpenses(prev => [...prev, newRecurring]);
    }

    setData(prev => {
      const monthData = prev[monthKey] || { month: monthKey, initialAmount: 0, expenses: [] };
      return {
        ...prev,
        [monthKey]: {
          ...monthData,
          expenses: [newExpense, ...monthData.expenses]
        }
      };
    });

    setExpenseAmount('');
    setIsRecurring(false);
    setShowAddModal(false);
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    if (editingCategory) {
      setCategories(prev => prev.map(c => 
        c.id === editingCategory.id 
          ? { ...c, name: catName, color: catColor, icon: catIcon }
          : c
      ));
    } else {
      const newCat: Category = {
        id: crypto.randomUUID(),
        name: catName,
        color: catColor,
        icon: catIcon
      };
      setCategories(prev => [...prev, newCat]);
    }

    setCatName('');
    setEditingCategory(null);
    setShowCategoryModal(false);
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const deleteRecurringExpense = (id: string) => {
    setRecurringExpenses(prev => prev.filter(r => r.id !== id));
  };

  const deleteExpense = (id: string) => {
    setData(prev => {
      const monthData = prev[monthKey];
      if (!monthData) return prev;
      return {
        ...prev,
        [monthKey]: {
          ...monthData,
          expenses: monthData.expenses.filter(e => e.id !== id)
        }
      };
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const changeMonth = (delta: number) => {
    setCurrentMonth(prev => delta > 0 ? addMonths(prev, 1) : subMonths(prev, 1));
  };

  const getCategory = (id?: string) => {
    return categories.find(c => c.id === id) || DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1];
  };

  const needsBudget = !currentMonthData || currentMonthData.initialAmount === 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 max-w-md mx-auto relative shadow-xl flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">Quản Lý Thu Chi</h1>
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full">
            <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold min-w-[100px] text-center capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: vi })}
            </span>
            <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {needsBudget && activeTab !== 'categories' && activeTab !== 'reports' ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center space-y-6"
          >
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
              <Wallet size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Thiết lập ngân sách</h2>
              <p className="text-slate-500 text-sm">Vui lòng nhập tổng số tiền bạn có trong tháng này để bắt đầu theo dõi.</p>
            </div>
            <form onSubmit={handleSetBudget} className="space-y-4">
              <input
                type="number"
                placeholder="Ví dụ: 10,000,000"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-center text-lg font-semibold"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                autoFocus
              />
              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                Bắt đầu tháng mới
              </button>
            </form>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Balance Card */}
                <motion.div 
                  layoutId="balance-card"
                  className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden"
                >
                  <div className="relative z-10 space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="text-indigo-100 text-sm font-medium">Số dư hiện tại</span>
                      <button 
                        onClick={() => {
                          setBudgetInput(currentMonthData?.initialAmount.toString() || '');
                          setShowBudgetModal(true);
                        }}
                        className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-md transition-colors"
                      >
                        Sửa ngân sách
                      </button>
                    </div>
                    <div className="text-3xl font-bold tracking-tight">
                      {formatCurrency(balance)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                      <div>
                        <span className="text-indigo-200 text-xs block mb-1">Ngân sách</span>
                        <span className="font-semibold">{formatCurrency(currentMonthData?.initialAmount || 0)}</span>
                      </div>
                      <div>
                        <span className="text-indigo-200 text-xs block mb-1">Đã chi</span>
                        <span className="font-semibold">{formatCurrency(totalSpent)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                  <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl" />
                </motion.div>

                {/* Category Filter */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                  <button 
                    onClick={() => setSelectedCategoryFilter('all')}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                      selectedCategoryFilter === 'all' 
                        ? "bg-indigo-600 text-white border-indigo-600" 
                        : "bg-white text-slate-500 border-slate-200"
                    )}
                  >
                    Tất cả
                  </button>
                  {categories.map(cat => (
                    <button 
                      key={cat.id}
                      onClick={() => setSelectedCategoryFilter(cat.id)}
                      className={cn(
                        "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2",
                        selectedCategoryFilter === cat.id 
                          ? "bg-indigo-600 text-white border-indigo-600" 
                          : "bg-white text-slate-500 border-slate-200"
                      )}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Gần đây</h3>
                    <button onClick={() => setActiveTab('history')} className="text-xs text-indigo-600 font-semibold">
                      Xem tất cả
                    </button>
                  </div>
                  {filteredExpenses.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400">
                      <p className="text-sm">Không tìm thấy khoản chi nào.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredExpenses.slice(0, 5).map(expense => {
                        const cat = getCategory(expense.categoryId);
                        const Icon = ICON_MAP[cat.icon] || Tag;
                        return (
                          <div key={expense.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                                <Icon size={18} />
                              </div>
                              <div>
                                <div className="font-semibold text-sm">{cat.name}</div>
                                <div className="text-[10px] text-slate-400">{format(parseISO(expense.date), 'dd/MM/yyyy HH:mm')}</div>
                              </div>
                            </div>
                            <div className="font-bold text-rose-600 text-sm">
                              -{formatCurrency(expense.amount)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">Lịch sử chi tiêu</h3>
                  <div className="flex items-center gap-2">
                    <Filter size={14} className="text-slate-400" />
                    <select 
                      value={selectedCategoryFilter}
                      onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                      className="text-xs bg-transparent font-semibold text-indigo-600 outline-none"
                    >
                      <option value="all">Tất cả danh mục</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-6">
                  {groupedHistory.map(([date, group]) => (
                    <div key={date} className="space-y-3">
                      <div className="flex items-center justify-between px-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {format(parseISO(date), 'dd MMMM yyyy', { locale: vi })}
                        </div>
                        <div className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Tổng: {formatCurrency(group.total)}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {group.expenses.map(expense => {
                          const cat = getCategory(expense.categoryId);
                          const Icon = ICON_MAP[cat.icon] || Tag;
                          return (
                            <div key={expense.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                                  <Icon size={18} />
                                </div>
                                <div>
                                  <div className="font-semibold text-sm">{cat.name}</div>
                                  <div className="text-[10px] text-slate-400">{format(parseISO(expense.date), 'HH:mm')}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="font-bold text-rose-600 text-sm">
                                  -{formatCurrency(expense.amount)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {groupedHistory.length === 0 && (
                    <div className="text-center py-12 text-slate-400 italic text-sm">
                      Không có dữ liệu chi tiêu
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div 
                key="reports"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Calendar size={18} className="text-indigo-600" />
                    Khoảng thời gian
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Từ ngày</label>
                      <input 
                        type="date" 
                        value={reportDateRange.start}
                        onChange={(e) => setReportDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="w-full text-xs font-semibold bg-slate-50 p-2 rounded-lg border border-slate-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Đến ngày</label>
                      <input 
                        type="date" 
                        value={reportDateRange.end}
                        onChange={(e) => setReportDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full text-xs font-semibold bg-slate-50 p-2 rounded-lg border border-slate-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Tổng chi tiêu</h3>
                    <span className="text-xl font-bold text-rose-600">{formatCurrency(reportData.total)}</span>
                  </div>
                  
                  {reportData.byCategory.length > 0 ? (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={reportData.byCategory}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {reportData.byCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-2xl">
                      Không có dữ liệu trong khoảng thời gian này
                    </div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Chi tiết theo danh mục</h3>
                    {selectedReportCategory && (
                      <button 
                        onClick={() => setSelectedReportCategory(null)}
                        className="text-xs text-indigo-600 font-semibold"
                      >
                        Thu gọn
                      </button>
                    )}
                  </div>
                  <div className="space-y-4">
                    {reportData.byCategory.map(cat => {
                      const isSelected = selectedReportCategory === cat.id;
                      const catExpenses = reportData.expenses.filter(e => e.categoryId === cat.id);
                      
                      // Group by date
                      const groupedByDate = catExpenses.reduce((acc, exp) => {
                        const dateKey = format(parseISO(exp.date), 'yyyy-MM-dd');
                        if (!acc[dateKey]) acc[dateKey] = [];
                        acc[dateKey].push(exp);
                        return acc;
                      }, {} as Record<string, Expense[]>);

                      const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

                      return (
                        <div key={cat.id} className="space-y-3">
                          <button 
                            onClick={() => setSelectedReportCategory(isSelected ? null : cat.id)}
                            className="w-full text-left space-y-2 group"
                          >
                            <div className="flex justify-between text-sm">
                              <span className="font-medium text-slate-600 group-hover:text-indigo-600 transition-colors">{cat.name}</span>
                              <span className="font-bold">{formatCurrency(cat.value)}</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full transition-all duration-500" 
                                style={{ 
                                  width: `${(cat.value / reportData.total) * 100}%`,
                                  backgroundColor: cat.color 
                                }} 
                              />
                            </div>
                          </button>

                          <AnimatePresence>
                            {isSelected && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden space-y-4 pl-4 border-l-2 border-slate-100 ml-1"
                              >
                                {sortedDates.map(date => (
                                  <div key={date} className="space-y-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                      {format(parseISO(date), 'dd MMMM yyyy', { locale: vi })}
                                    </div>
                                    <div className="space-y-2">
                                      {groupedByDate[date].map(exp => (
                                        <div key={exp.id} className="flex justify-between items-center text-xs">
                                          <span className="text-slate-500">{format(parseISO(exp.date), 'HH:mm')}</span>
                                          <span className="font-bold text-rose-600">-{formatCurrency(exp.amount)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'categories' && (
              <motion.div 
                key="categories"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">Danh mục chi tiêu</h3>
                  <button 
                    onClick={() => {
                      setEditingCategory(null);
                      setCatName('');
                      setCatColor('#6366f1');
                      setCatIcon('Tag');
                      setShowCategoryModal(true);
                    }}
                    className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1"
                  >
                    <PlusCircle size={14} /> Thêm mới
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {categories.map(cat => {
                    const Icon = ICON_MAP[cat.icon] || Tag;
                    return (
                      <div key={cat.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 relative group">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                          <Icon size={20} />
                        </div>
                        <div className="font-bold text-sm text-slate-700">{cat.name}</div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setEditingCategory(cat);
                              setCatName(cat.name);
                              setCatColor(cat.color);
                              setCatIcon(cat.icon);
                              setShowCategoryModal(true);
                            }}
                            className="text-slate-400 hover:text-indigo-600 p-1 transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => deleteCategory(cat.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {recurringExpenses.length > 0 && (
                  <div className="space-y-4 pt-4">
                    <h3 className="font-bold text-slate-800">Khoản chi định kỳ</h3>
                    <div className="space-y-3">
                      {recurringExpenses.map(recurring => {
                        const cat = getCategory(recurring.categoryId);
                        const Icon = ICON_MAP[cat.icon] || Tag;
                        return (
                          <div key={recurring.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                                <Icon size={18} />
                              </div>
                              <div>
                                <div className="font-semibold text-sm">{cat.name}</div>
                                <div className="text-[10px] text-slate-400 capitalize">
                                  {recurring.frequency === 'daily' ? 'Hàng ngày' : recurring.frequency === 'weekly' ? 'Hàng tuần' : 'Hàng tháng'} • {formatCurrency(recurring.amount)}
                                </div>
                              </div>
                            </div>
                            <button 
                              onClick={() => deleteRecurringExpense(recurring.id)}
                              className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between z-20">
        <button 
          onClick={() => setActiveTab('overview')}
          className={cn("flex flex-col items-center gap-1", activeTab === 'overview' ? "text-indigo-600" : "text-slate-400")}
        >
          <Wallet size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Ví</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={cn("flex flex-col items-center gap-1", activeTab === 'history' ? "text-indigo-600" : "text-slate-400")}
        >
          <History size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Lịch sử</span>
        </button>
        <div className="w-12" /> {/* Spacer for FAB */}
        <button 
          onClick={() => setActiveTab('reports')}
          className={cn("flex flex-col items-center gap-1", activeTab === 'reports' ? "text-indigo-600" : "text-slate-400")}
        >
          <ChartIcon size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Báo cáo</span>
        </button>
        <button 
          onClick={() => setActiveTab('categories')}
          className={cn("flex flex-col items-center gap-1", activeTab === 'categories' ? "text-indigo-600" : "text-slate-400")}
        >
          <Settings size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Cài đặt</span>
        </button>
      </nav>

      {/* Floating Action Button */}
      {!needsBudget && (
        <button 
          onClick={() => {
            setExpenseCategory(categories[0]?.id || '');
            setShowAddModal(true);
          }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-indigo-600 text-white p-4 rounded-full shadow-2xl shadow-indigo-400 hover:scale-110 active:scale-95 transition-all z-30"
        >
          <PlusCircle size={32} />
        </button>
      )}

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[32px] p-8 z-50 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
              <h2 className="text-xl font-bold mb-6">Thêm khoản chi mới</h2>
              <form onSubmit={handleAddExpense} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Số tiền</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-2xl font-bold text-rose-600"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Danh mục</label>
                  <div className="grid grid-cols-3 gap-2">
                    {categories.map(cat => {
                      const Icon = ICON_MAP[cat.icon] || Tag;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setExpenseCategory(cat.id)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                            expenseCategory === cat.id 
                              ? "bg-indigo-50 border-indigo-200 text-indigo-600" 
                              : "bg-white border-slate-100 text-slate-400"
                          )}
                        >
                          <Icon size={20} />
                          <span className="text-[10px] font-bold truncate w-full text-center">{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-indigo-600" />
                      <span className="text-sm font-bold text-slate-700">Khoản chi định kỳ</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRecurring(!isRecurring)}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative",
                        isRecurring ? "bg-indigo-600" : "bg-slate-300"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        isRecurring ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>
                  
                  {isRecurring && (
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                      {(['daily', 'weekly', 'monthly'] as Frequency[]).map(freq => (
                        <button
                          key={freq}
                          type="button"
                          onClick={() => setRecurringFrequency(freq)}
                          className={cn(
                            "py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border",
                            recurringFrequency === freq 
                              ? "bg-indigo-600 text-white border-indigo-600" 
                              : "bg-white text-slate-500 border-slate-200"
                          )}
                        >
                          {freq === 'daily' ? 'Ngày' : freq === 'weekly' ? 'Tuần' : 'Tháng'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                  Lưu khoản chi
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Category Modal */}
      <AnimatePresence>
        {showCategoryModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCategoryModal(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-3xl p-8 z-50 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{editingCategory ? 'Sửa danh mục' : 'Thêm danh mục'}</h2>
                <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCategorySubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tên danh mục</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Du lịch"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Màu sắc</label>
                  <div className="flex flex-wrap gap-3">
                    {['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setCatColor(color)}
                        className={cn(
                          "w-8 h-8 rounded-full transition-all border-2",
                          catColor === color ? "border-slate-800 scale-110" : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Biểu tượng</label>
                  <div className="flex flex-wrap gap-3">
                    {Object.keys(ICON_MAP).map(iconName => {
                      const Icon = ICON_MAP[iconName];
                      return (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setCatIcon(iconName)}
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all border",
                            catIcon === iconName ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-white border-slate-100 text-slate-400"
                          )}
                        >
                          <Icon size={20} />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                  {editingCategory ? 'Cập nhật' : 'Tạo danh mục'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Budget Modal */}
      <AnimatePresence>
        {showBudgetModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBudgetModal(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-3xl p-8 z-50 shadow-2xl"
            >
              <h2 className="text-xl font-bold mb-4">Điều chỉnh ngân sách</h2>
              <p className="text-slate-500 text-sm mb-6">Thay đổi tổng số tiền dự kiến cho tháng {format(currentMonth, 'MM/yyyy')}.</p>
              <form onSubmit={handleSetBudget} className="space-y-4">
                <input
                  type="number"
                  placeholder="Nhập số tiền mới"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-lg font-semibold"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowBudgetModal(false)}
                    className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                  >
                    Cập nhật
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
