import React, { useState, useMemo } from 'react';
import { useStoreData } from '../../context/StoreDataContext';
import { useSettings } from '../../context/SettingsContext';

import { formatCurrency } from '../../utils/formatters';
import { exportSalesCSV } from '../../db/backupService';

import {
  TrendingUp,
  ShoppingCart,
  Banknote,
  CreditCard,
  Smartphone,
  FileSpreadsheet,
  Award
} from 'lucide-react';

export const ReportsScreen: React.FC = () => {
  const { settings } = useSettings();
  const { sales, expenses } = useStoreData();

  const [timeframe, setTimeframe] = useState<'today' | 'this_week' | 'this_month' | 'all'>('this_month');

  // Filter sales and expenses by timeframe
  const { filteredSales, filteredExpenses } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

    const dayOfWeek = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek + 1);
    const mondayStr = monday.toISOString().slice(0, 10);

    const fSales = sales.filter((s) => {
      const dateStr = s.timestamp.slice(0, 10);
      if (timeframe === 'today') return dateStr === todayStr;
      if (timeframe === 'this_week') return dateStr >= mondayStr;
      if (timeframe === 'this_month') return dateStr >= firstDayOfMonth;
      return true;
    });

    const fExpenses = expenses.filter((e) => {
      if (timeframe === 'today') return e.date === todayStr;
      if (timeframe === 'this_week') return e.date >= mondayStr;
      if (timeframe === 'this_month') return e.date >= firstDayOfMonth;
      return true;
    });

    return { filteredSales: fSales, filteredExpenses: fExpenses };
  }, [sales, expenses, timeframe]);

  // Financial Calculations
  const grossRevenue = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + s.total, 0);
  }, [filteredSales]);

  const costOfGoodsSold = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + s.totalCost, 0);
  }, [filteredSales]);

  const grossProfit = grossRevenue - costOfGoodsSold;
  const grossMarginPct = grossRevenue > 0 ? ((grossProfit / grossRevenue) * 100).toFixed(1) : '0';

  const totalOperatingExpenses = useMemo(() => {
    return filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  }, [filteredExpenses]);

  const netProfit = grossProfit - totalOperatingExpenses;
  const netMarginPct = grossRevenue > 0 ? ((netProfit / grossRevenue) * 100).toFixed(1) : '0';

  // Shift & Register breakdown
  const registerBreakdown = useMemo(() => {
    let cash = 0;
    let card = 0;
    let mobile = 0;

    filteredSales.forEach((s) => {
      if (s.paymentMethod === 'cash') cash += s.total;
      else if (s.paymentMethod === 'card') card += s.total;
      else if (s.paymentMethod === 'mobile_transfer') mobile += s.total;
    });

    const ordersCount = filteredSales.length;
    const avgBasket = ordersCount > 0 ? grossRevenue / ordersCount : 0;

    return { cash, card, mobile, ordersCount, avgBasket };
  }, [filteredSales, grossRevenue]);

  // Top Selling Products
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; unit: string; quantity: number; revenue: number; profit: number }> = {};

    filteredSales.forEach((s) => {
      s.items.forEach((item) => {
        if (!map[item.productId]) {
          map[item.productId] = {
            name: item.name,
            unit: item.unit,
            quantity: 0,
            revenue: 0,
            profit: 0,
          };
        }
        map[item.productId].quantity += item.quantity;
        map[item.productId].revenue += item.total;
        map[item.productId].profit += item.profit;
      });
    });

    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [filteredSales]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 p-4 sm:p-6 space-y-6">
      {/* Top Header & Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="font-bold text-slate-800 text-lg">Financial Performance & Analytics</h2>
          <p className="text-xs text-slate-400">
            Real-time P&L, register shift reconciliation, and grocery sales trends
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Timeframe Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setTimeframe('today')}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeframe === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeframe('this_week')}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeframe === 'this_week' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeframe('this_month')}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeframe === 'this_month' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeframe('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeframe === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              All Time
            </button>
          </div>

          <button
            onClick={exportSalesCSV}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0"
            title="Download Sales Transactions CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export Sales
          </button>
        </div>
      </div>

      {/* Primary Profit & Loss Statement (P&L Card) */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Profit & Loss (P&L) Statement</h3>
              <p className="text-xs text-slate-400 capitalize">{timeframe.replace('_', ' ')} Overview</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Net Margin</span>
            <p className={`text-lg font-black ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netMarginPct}%
            </p>
          </div>
        </div>

        {/* P&L Metric Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Revenue */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gross Sales</span>
            <p className="text-2xl font-black text-white mt-1">
              {formatCurrency(grossRevenue, settings.currencySymbol)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">{filteredSales.length} customer orders</p>
          </div>

          {/* COGS */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cost of Goods (COGS)</span>
            <p className="text-2xl font-black text-amber-300 mt-1">
              -{formatCurrency(costOfGoodsSold, settings.currencySymbol)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Wholesale inventory cost</p>
          </div>

          {/* Gross Profit */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gross Profit</span>
            <p className="text-2xl font-black text-emerald-300 mt-1">
              {formatCurrency(grossProfit, settings.currencySymbol)}
            </p>
            <p className="text-[11px] text-emerald-400 mt-1">{grossMarginPct}% gross margin</p>
          </div>

          {/* Operating Expenses */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Operating Expenses</span>
            <p className="text-2xl font-black text-rose-300 mt-1">
              -{formatCurrency(totalOperatingExpenses, settings.currencySymbol)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Rent, cooling, spoilage, etc.</p>
          </div>

          {/* True Net Profit */}
          <div className={`p-4 rounded-2xl border ${
            netProfit >= 0
              ? 'bg-emerald-500/10 border-emerald-500/40'
              : 'bg-rose-500/10 border-rose-500/40'
          }`}>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">True Net Profit</span>
            <p className={`text-2xl font-black mt-1 ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(netProfit, settings.currencySymbol)}
            </p>
            <p className="text-[11px] text-slate-300 mt-1">
              {netProfit >= 0 ? '✓ Profitable period' : '⚠ Operating at a deficit'}
            </p>
          </div>
        </div>
      </div>

      {/* Middle Row: Cash Register Reconciliation & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Register Shift Summary (1 col) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Register Shift Breakdown</h3>
              <p className="text-xs text-slate-400">Tender breakdown by payment method</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {/* Cash in drawer */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-600 text-white">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-emerald-950">Cash in Drawer</p>
                  <p className="text-[10px] text-emerald-700">Physical currency collected</p>
                </div>
              </div>
              <span className="font-black text-emerald-900 text-base">
                {formatCurrency(registerBreakdown.cash, settings.currencySymbol)}
              </span>
            </div>

            {/* Card payments */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600 text-white">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-blue-950">Card Terminal</p>
                  <p className="text-[10px] text-blue-700">Credit / Debit swipes & taps</p>
                </div>
              </div>
              <span className="font-black text-blue-900 text-base">
                {formatCurrency(registerBreakdown.card, settings.currencySymbol)}
              </span>
            </div>

            {/* Mobile payments */}
            <div className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-600 text-white">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-purple-950">Mobile / Transfer</p>
                  <p className="text-[10px] text-purple-700">Digital transfers & QR</p>
                </div>
              </div>
              <span className="font-black text-purple-900 text-base">
                {formatCurrency(registerBreakdown.mobile, settings.currencySymbol)}
              </span>
            </div>

            {/* Metrics */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Average Basket Size:</span>
              <span className="font-bold text-slate-800">
                {formatCurrency(registerBreakdown.avgBasket, settings.currencySymbol)}
              </span>
            </div>
          </div>
        </div>

        {/* Top Selling Grocery Products (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Top Selling Products</h3>
                <p className="text-xs text-slate-400">High velocity grocery items by revenue & units</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            {topProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-center">
                <ShoppingCart className="w-8 h-8 opacity-40 mb-2" />
                <p className="text-xs font-medium">No sales recorded in this period yet.</p>
                <p className="text-[11px] mt-0.5">Ring up sales on the POS screen to see top performers.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="pb-2.5">Product</th>
                    <th className="pb-2.5 text-center">Volume Sold</th>
                    <th className="pb-2.5 text-right">Revenue</th>
                    <th className="pb-2.5 text-right">Profit Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-2.5 font-semibold text-slate-800 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span>{p.name}</span>
                      </td>
                      <td className="py-2.5 text-center font-mono font-medium text-slate-700">
                        {p.quantity} {p.unit}
                      </td>
                      <td className="py-2.5 text-right font-bold text-slate-900">
                        {formatCurrency(p.revenue, settings.currencySymbol)}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-emerald-700">
                        +{formatCurrency(p.profit, settings.currencySymbol)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
