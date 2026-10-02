import React from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { formatCurrency, getDaysUntilExpiry } from '../../utils/formatters';
import {
  ShoppingCart,
  Package,
  Receipt,
  TrendingUp,
  Settings,
  ShoppingBag
} from 'lucide-react';


export type ActiveTab = 'pos' | 'inventory' | 'expenses' | 'reports' | 'settings';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const { settings } = useSettings();

  // Low stock / expiring count for badge
  const products = useLiveQuery(() => db.products.toArray(), []) || [];
  const sales = useLiveQuery(() => db.sales.toArray(), []) || [];

  const attentionCount = products.filter((p) => {
    const isLow = p.stockQuantity <= p.minStockThreshold;
    const days = getDaysUntilExpiry(p.expiryDate);
    const isExpiring = days !== null && days <= (settings.lowStockAlertDays || 7) && p.stockQuantity > 0;
    return isLow || isExpiring;
  }).length;

  // Today's total sales
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySales = sales
    .filter((s) => s.timestamp.slice(0, 10) === todayStr)
    .reduce((acc, s) => acc + s.total, 0);

  const navItems: { id: ActiveTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'pos', label: 'POS Register', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventory & Stock', icon: Package, badge: attentionCount > 0 ? attentionCount : undefined },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'reports', label: 'Reports & P&L', icon: TrendingUp },
    { id: 'settings', label: 'Settings & Backup', icon: Settings },
  ];

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shrink-0">
      <div className="flex items-center justify-between px-3 sm:px-6 h-16">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-slate-900 text-base leading-tight truncate">
              {settings.storeName || 'Corner Grocery'}
            </h1>
            <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              POS Register Active
            </p>
          </div>
        </div>

        {/* Center: Navigation Pills */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`relative px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-500'}`} />
                <span>{item.label}</span>

                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Today's Shift Quick Metric */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Today&apos;s Sales</span>
            <span className="text-sm font-black text-emerald-800">
              {formatCurrency(todaySales, settings.currencySymbol)}
            </span>
          </div>

          {/* Mobile Navigation Dropdown/Buttons */}
          <div className="flex md:hidden items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  title={item.label}
                  className={`p-2 rounded-xl relative ${
                    isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.badge !== undefined && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
