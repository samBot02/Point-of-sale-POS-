import React, { useState } from 'react';
import { Store, DollarSign, Percent, CheckCircle2, ShoppingBag } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

const CURRENCY_PRESETS = [
  { symbol: '$', code: 'USD', name: 'US Dollar ($)' },
  { symbol: '€', code: 'EUR', name: 'Euro (€)' },
  { symbol: '£', code: 'GBP', name: 'British Pound (£)' },
  { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar (C$)' },
  { symbol: 'A$', code: 'AUD', name: 'Australian Dollar (A$)' },
  { symbol: '₹', code: 'INR', name: 'Indian Rupee (₹)' },
  { symbol: '₦', code: 'NGN', name: 'Nigerian Naira (₦)' },
  { symbol: 'R', code: 'ZAR', name: 'South African Rand (R)' },
  { symbol: 'KSh', code: 'KES', name: 'Kenyan Shilling (KSh)' },
  { symbol: 'custom', code: 'CUSTOM', name: 'Custom Currency...' },
];

export const OnboardingModal: React.FC = () => {
  const { settings, completeOnboarding } = useSettings();

  const [storeName, setStoreName] = useState(settings.storeName || '');
  const [storeAddress, setStoreAddress] = useState(settings.storeAddress || '');
  const [storePhone, setStorePhone] = useState(settings.storePhone || '');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [customSymbol, setCustomSymbol] = useState('$');
  const [customCode, setCustomCode] = useState('USD');
  const [taxRate, setTaxRate] = useState(settings.taxRate ? settings.taxRate.toString() : '0');
  const [taxInclusive, setTaxInclusive] = useState(settings.taxInclusive);
  const [submitting, setSubmitting] = useState(false);

  // If already onboarded, don't show
  if (settings.hasCompletedOnboarding) return null;

  const handleCurrencySelect = (code: string) => {
    setSelectedCurrency(code);
    const found = CURRENCY_PRESETS.find((p) => p.code === code);
    if (found && code !== 'CUSTOM') {
      setCustomSymbol(found.symbol);
      setCustomCode(found.code);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const symbol = selectedCurrency === 'CUSTOM' ? customSymbol : (CURRENCY_PRESETS.find(p => p.code === selectedCurrency)?.symbol || '$');
      const code = selectedCurrency === 'CUSTOM' ? customCode : selectedCurrency;

      await completeOnboarding({
        storeName: storeName.trim() || 'My Grocery Shop',
        storeAddress: storeAddress.trim(),
        storePhone: storePhone.trim(),
        currencySymbol: symbol,
        currencyCode: code,
        taxRate: parseFloat(taxRate) || 0,
        taxInclusive,
        receiptHeader: `${storeName.trim() || 'Grocery Store'} - Fresh & Quality Daily`,
        receiptFooter: 'Thank you for shopping with us! Please come again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white text-center relative">
          <div className="inline-flex p-3 bg-white/20 rounded-2xl mb-3 backdrop-blur shadow-inner">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome to Your Grocery App!</h2>
          <p className="text-emerald-100 text-sm mt-1 max-w-md mx-auto">
            Let&apos;s set up your store name, preferred currency, and register preferences to get started.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Store Name & Contact */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-emerald-600" /> Store Profile
            </h4>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Store or Shop Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Green Valley Grocers"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Shop Address</label>
                <input
                  type="text"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  placeholder="Street / City"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  placeholder="(555) 000-0000"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Currency Configuration */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Currency & Pricing
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Select Currency</label>
                <select
                  value={selectedCurrency}
                  onChange={(e) => handleCurrencySelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                >
                  {CURRENCY_PRESETS.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCurrency === 'CUSTOM' ? (
                <div className="flex gap-2">
                  <div className="w-1/2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Symbol</label>
                    <input
                      type="text"
                      value={customSymbol}
                      onChange={(e) => setCustomSymbol(e.target.value)}
                      placeholder="$"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Code</label>
                    <input
                      type="text"
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value)}
                      placeholder="USD"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs mt-auto">
                  <span>Active Symbol: <strong className="text-emerald-700 text-sm ml-1">{customSymbol} ({selectedCurrency})</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Tax Rates */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-emerald-600" /> Sales Tax / VAT (Optional)
            </h4>
            <div className="flex items-center gap-4">
              <div className="w-36">
                <label className="block text-xs font-medium text-slate-700 mb-1">Tax Rate (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">%</span>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer mt-5 text-xs text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={taxInclusive}
                  onChange={(e) => setTaxInclusive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Prices already include tax (Tax Inclusive)</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Setting up store...' : 'Complete Setup & Open POS Register'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
