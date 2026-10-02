import React, { useState } from 'react';
import type { Expense, ExpenseCategory } from '../../types';
import { useStoreData } from '../../context/StoreDataContext';
import { db } from '../../db';
import { useSettings } from '../../context/SettingsContext';
import { Receipt, X, CheckCircle2 } from 'lucide-react';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: Expense | null;
}

export const EXPENSE_CATEGORIES_CONFIG: { id: ExpenseCategory; name: string; color: string }[] = [
  { id: 'inventory_restock', name: 'Inventory & Supplier Purchases', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { id: 'rent', name: 'Store Rent & Lease', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  { id: 'utilities_cooling', name: 'Electricity, Cooling & Utilities', color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
  { id: 'wages', name: 'Staff & Cashier Wages', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  { id: 'packaging', name: 'Bags & Packaging Materials', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { id: 'spoilage_waste', name: 'Food Spoilage & Damaged Goods', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  { id: 'maintenance', name: 'Equipment Maintenance & Repairs', color: 'text-slate-700 bg-slate-100 border-slate-300' },
  { id: 'other', name: 'Other Operating Expenses', color: 'text-slate-600 bg-slate-50 border-slate-200' },
];

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  expenseToEdit,
}) => {
  const { settings } = useSettings();
  const { createExpense, updateExpense } = useStoreData();

  const [title, setTitle] = useState(expenseToEdit?.title || '');
  const [category, setCategory] = useState<ExpenseCategory>(expenseToEdit?.category || 'utilities_cooling');
  const [amount, setAmount] = useState(expenseToEdit?.amount.toString() || '');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer'>(expenseToEdit?.paymentMethod || 'cash');
  const [payee, setPayee] = useState(expenseToEdit?.payee || '');
  const [date, setDate] = useState(expenseToEdit?.date || new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState(expenseToEdit?.notes || '');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount) || 0;
    if (val <= 0 || !title.trim()) return;

    const now = new Date().toISOString();

    const expenseData: Expense = {
      id: expenseToEdit?.id || `exp-${Date.now()}`,
      title: title.trim(),
      category,
      amount: val,
      paymentMethod,
      payee: payee.trim() || undefined,
      date,
      notes: notes.trim() || undefined,
      timestamp: expenseToEdit?.timestamp || now,
    };

    try {
      if (expenseToEdit) {
        await updateExpense(expenseData.id, expenseData);
      } else {
        await createExpense(expenseData);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save expense.');
      return;
    }

    try {
      if (expenseToEdit) {
        await db.expenses.put(expenseData);
      } else {
        await db.expenses.add(expenseData);
      }
    } catch {
      // Ignore
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                {expenseToEdit ? 'Edit Expense Record' : 'Record Grocery Shop Expense'}
              </h3>
              <p className="text-xs text-slate-500">Track operating costs for accurate Net Profit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Expense Description <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Monthly Electricity for Display Coolers"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount ({settings.currencySymbol}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              {EXPENSE_CATEGORIES_CONFIG.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method & Payee */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Paid Via</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value="cash">Cash (From Register Drawer)</option>
                <option value="card">Business Debit/Credit Card</option>
                <option value="bank_transfer">Bank Transfer / Online</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payee / Vendor</label>
              <input
                type="text"
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                placeholder="e.g. City Electric Co., Landlord"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reference Notes (Optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Receipt #9843, invoice paid in full"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {expenseToEdit ? 'Save Changes' : 'Log Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
