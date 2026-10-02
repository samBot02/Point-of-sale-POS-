import React, { useState } from 'react';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { CartProvider } from './context/CartContext';
import { Navbar, type ActiveTab } from './components/layout/Navbar';

import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { PosScreen } from './components/pos/PosScreen';
import { InventoryScreen } from './components/inventory/InventoryScreen';
import { ExpensesScreen } from './components/expenses/ExpensesScreen';
import { ReportsScreen } from './components/analytics/ReportsScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const { loading } = useSettings();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-semibold text-slate-700">Loading Grocery POS & Inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* First-time setup onboarding modal */}
      <OnboardingModal />

      {/* Top Header */}
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Screen Views */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'pos' && <PosScreen />}
        {activeTab === 'inventory' && <InventoryScreen />}
        {activeTab === 'expenses' && <ExpensesScreen />}
        {activeTab === 'reports' && <ReportsScreen />}
        {activeTab === 'settings' && <SettingsScreen />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <SettingsProvider>
      <CartProvider>
        <MainLayout />
      </CartProvider>
    </SettingsProvider>
  );
}
