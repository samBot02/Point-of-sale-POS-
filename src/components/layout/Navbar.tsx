import React, { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useStoreData } from '../../context/StoreDataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, getDaysUntilExpiry } from '../../utils/formatters';
import { UserManagementModal } from '../users/UserManagementModal';
import {
  ShoppingCart,
  Package,
  Receipt,
  TrendingUp,
  Settings,
  ShoppingBag,
  LogOut,
  Users,
  Wifi,
  ShieldCheck,
  UserCheck,
  Check,
  Copy
} from 'lucide-react';

export type ActiveTab = 'pos' | 'inventory' | 'expenses' | 'reports' | 'settings';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const { settings } = useSettings();
  const { products, sales } = useStoreData();
  const { user, isAdmin, isCashier, logout, lanInfo } = useAuth();

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [showLanTooltip, setShowLanTooltip] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Low stock / expiring count for badge
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

  const allNavItems: { id: ActiveTab; label: string; icon: React.ElementType; badge?: number; adminOnly?: boolean }[] = [
    { id: 'pos', label: 'POS Register', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventory & Stock', icon: Package, badge: attentionCount > 0 ? attentionCount : undefined },
    { id: 'expenses', label: 'Expenses', icon: Receipt, adminOnly: true },
    { id: 'reports', label: 'Reports & P&L', icon: TrendingUp, adminOnly: true },
    { id: 'settings', label: 'Settings & Backup', icon: Settings, adminOnly: true },
  ];

  // Cashiers only see POS and Inventory
  const navItems = isCashier
    ? allNavItems.filter((item) => !item.adminOnly)
    : allNavItems;

  const handleCopyLanUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const primaryLanUrl = lanInfo?.recommendedUrl || `http://localhost:5173`;

  return (
    <>
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shrink-0">
        <div className="flex items-center justify-between px-3 sm:px-6 h-16 gap-2">
          {/* Left: Brand & LAN Status */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-slate-900 text-base leading-tight truncate">
                {settings.storeName || 'Corner Grocery'}
              </h1>
              
              {/* Network Wi-Fi indicator */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowLanTooltip(!showLanTooltip)}
                  className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  title="Click to view Wi-Fi address for other devices"
                >
                  <Wifi className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="truncate max-w-[120px] sm:max-w-none">
                    LAN: {lanInfo?.ips?.[0] ? `${lanInfo.ips[0]}:5173` : 'Active'}
                  </span>
                </button>

                {/* LAN Popover */}
                {showLanTooltip && (
                  <div className="absolute left-0 top-6 z-50 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-3.5 text-xs animate-in fade-in">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Wifi className="w-3.5 h-3.5 text-emerald-600" /> Wi-Fi Multi-Device Access
                      </span>
                      <button
                        onClick={() => setShowLanTooltip(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2.5">
                      Open this URL on any phone, tablet, or terminal on shop Wi-Fi:
                    </p>
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono text-[11px] text-slate-800">
                      <span className="truncate">{primaryLanUrl}</span>
                      <button
                        onClick={() => handleCopyLanUrl(primaryLanUrl)}
                        className="ml-2 px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0"
                      >
                        {copiedUrl ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedUrl ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center: Navigation Pills */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`relative px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
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

          {/* Right: Today Sales + User Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Today&apos;s Sales</span>
              <span className="text-sm font-black text-emerald-800">
                {formatCurrency(todaySales, settings.currencySymbol)}
              </span>
            </div>

            {/* Staff / Till User Badge */}
            {user && (
              <div className="flex items-center gap-1.5 bg-slate-100/90 border border-slate-200/80 rounded-2xl p-1 sm:pl-2.5 sm:pr-1.5">
                <div className="hidden sm:flex items-center gap-1.5 text-xs">
                  {isAdmin ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <div className="text-left leading-none">
                    <p className="font-bold text-slate-800 text-[11px] truncate max-w-[90px]">
                      {user.displayName || user.username}
                    </p>
                    <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                      {user.role}
                    </p>
                  </div>
                </div>

                {/* Admin-only Staff Accounts Button */}
                {isAdmin && (
                  <button
                    onClick={() => setIsUserModalOpen(true)}
                    title="Staff & Cashier Accounts"
                    className="p-1.5 text-slate-600 hover:text-purple-700 hover:bg-white rounded-xl transition cursor-pointer"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                )}

                {/* Lock Till / Logout Button */}
                <button
                  onClick={logout}
                  title="Lock Till / Sign Out"
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white rounded-xl transition cursor-pointer flex items-center gap-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline text-[11px] font-bold pr-1">Lock</span>
                </button>
              </div>
            )}

            {/* Mobile Navigation Dropdown/Buttons */}
            <div className="flex lg:hidden items-center gap-1">
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

      {/* Staff Accounts Management Modal (Admin only) */}
      {isAdmin && (
        <UserManagementModal
          isOpen={isUserModalOpen}
          onClose={() => setIsUserModalOpen(false)}
        />
      )}
    </>
  );
};
