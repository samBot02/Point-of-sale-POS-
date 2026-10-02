import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import type { Expense } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency, formatDateOnly } from '../../utils/formatters';
import { exportExpensesCSV } from '../../db/backupService';
import { ExpenseFormModal, EXPENSE_CATEGORIES_CONFIG } from './ExpenseFormModal';

import {
  Plus,
  FileSpreadsheet,
  Zap,
  Building,
  Truck,
  Trash2,
  Edit2,
  DollarSign
} from 'lucide-react';


export const ExpensesScreen: React.FC = () => {
  const { settings } = useSettings();
  const expenses = useLiveQuery(() => db.expenses.toArray(), []) || [];

  const [dateFilter, setDateFilter] = useState<'all' | 'this_month' | 'this_week' | 'today'>('this_month');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Date filtering logic
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

    // First day of current week (Monday)
    const dayOfWeek = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek + 1);
    const mondayStr = monday.toISOString().slice(0, 10);

    return expenses.filter((e) => {
      // Category filter
      if (categoryFilter !== 'all' && e.category !== categoryFilter) {
        return false;
      }

      // Date filter
      if (dateFilter === 'today' && e.date !== todayStr) return false;
      if (dateFilter === 'this_week' && e.date < mondayStr) return false;
      if (dateFilter === 'this_month' && e.date < firstDayOfMonth) return false;

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, dateFilter, categoryFilter]);

  // Totals calculations
  const totalExpenseAmount = useMemo(() => {
    return filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  }, [filteredExpenses]);

  const restockExpenseTotal = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.category === 'inventory_restock')
      .reduce((acc, e) => acc + e.amount, 0);
  }, [filteredExpenses]);

  const utilitiesExpenseTotal = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.category === 'utilities_cooling')
      .reduce((acc, e) => acc + e.amount, 0);
  }, [filteredExpenses]);

  const rentExpenseTotal = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.category === 'rent')
      .reduce((acc, e) => acc + e.amount, 0);
  }, [filteredExpenses]);

  // Breakdown by category
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });

    return Object.entries(map).map(([cat, amt]) => {
      const config = EXPENSE_CATEGORIES_CONFIG.find((c) => c.id === cat);
      const pct = totalExpenseAmount > 0 ? ((amt / totalExpenseAmount) * 100).toFixed(1) : '0';
      return {
        category: cat,
        name: config ? config.name : cat,
        amount: amt,
        percentage: pct,
        color: config?.color || 'bg-slate-100 text-slate-700',
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, totalExpenseAmount]);

  const handleDeleteExpense = async (id: string, title: string) => {
    if (confirm(`Delete expense record "${title}"?`)) {
      await db.expenses.delete(id);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 p-4 sm:p-6 space-y-5">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Expenses</span>
            <DollarSign className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-600">
            {formatCurrency(totalExpenseAmount, settings.currencySymbol)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5 capitalize">
            {dateFilter.replace('_', ' ')}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Stock Restocks</span>
            <Truck className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(restockExpenseTotal, settings.currencySymbol)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Wholesale stock purchases</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Cooling & Utilities</span>
            <Zap className="w-4 h-4 text-cyan-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(utilitiesExpenseTotal, settings.currencySymbol)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Electricity & Freezers</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Store Rent</span>
            <Building className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(rentExpenseTotal, settings.currencySymbol)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Premises lease</p>
        </div>
      </div>

      {/* Category Breakdown Bar */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Expense Category Distribution</span>
            <span className="text-slate-400">{filteredExpenses.length} expense logs</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {categoryBreakdown.map((cat) => (
              <div
                key={cat.category}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 text-xs bg-slate-50/50"
              >
                <span className="font-medium text-slate-700">{cat.name}:</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(cat.amount, settings.currencySymbol)}
                </span>
                <span className="text-[10px] text-slate-400">({cat.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Date Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setDateFilter('this_month')}
            className={`px-3 py-1.5 rounded-lg transition ${
              dateFilter === 'this_month'
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setDateFilter('this_week')}
            className={`px-3 py-1.5 rounded-lg transition ${
              dateFilter === 'this_week'
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setDateFilter('today')}
            className={`px-3 py-1.5 rounded-lg transition ${
              dateFilter === 'today'
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setDateFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              dateFilter === 'all'
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            All Time
          </button>
        </div>

        {/* Category filter & Actions */}
        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none"
          >
            <option value="all">All Categories</option>
            {EXPENSE_CATEGORIES_CONFIG.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={exportExpensesCSV}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
            title="Download CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export CSV
          </button>

          <button
            onClick={() => {
              setEditingExpense(null);
              setIsFormOpen(true);
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Log Expense
          </button>
        </div>
      </div>

      {/* Expenses List Table */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/90 text-slate-500 font-semibold sticky top-0 border-b border-slate-200 z-10">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Payee / Vendor</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No expense records found for this period. Click &quot;Log Expense&quot; to add one.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e) => {
                  const catConfig = EXPENSE_CATEGORIES_CONFIG.find((c) => c.id === e.category);

                  return (
                    <tr key={e.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {formatDateOnly(e.date)}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">{e.title}</p>
                        {e.notes && <p className="text-[10px] text-slate-400 mt-0.5">{e.notes}</p>}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${catConfig?.color || 'bg-slate-100 text-slate-700'}`}>
                          {catConfig?.name || e.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {e.payee || '—'}
                      </td>
                      <td className="py-3 px-3 text-slate-500 capitalize">
                        {e.paymentMethod.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600 text-sm">
                        {formatCurrency(e.amount, settings.currencySymbol)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingExpense(e);
                              setIsFormOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(e.id, e.title)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      <ExpenseFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        expenseToEdit={editingExpense}
      />
    </div>
  );
};
