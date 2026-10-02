import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { StoreDataProvider } from './context/StoreDataContext';
import { CartProvider } from './context/CartContext';
import { Navbar, type ActiveTab } from './components/layout/Navbar';

import { LoginScreen } from './components/auth/LoginScreen';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { PosScreen } from './components/pos/PosScreen';
import { InventoryScreen } from './components/inventory/InventoryScreen';
import { ExpensesScreen } from './components/expenses/ExpensesScreen';
import { ReportsScreen } from './components/analytics/ReportsScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const { loading: settingsLoading } = useSettings();
  const { isAuthenticated, loading: authLoading, isCashier } = useAuth();

  if (authLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-semibold text-slate-700">Connecting to Grocery POS Server...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Safe fallback if cashier somehow has manager tab selected
  const currentTab = (isCashier && (activeTab === 'expenses' || activeTab === 'reports' || activeTab === 'settings'))
    ? 'pos'
    : activeTab;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* First-time setup onboarding modal */}
      <OnboardingModal />

      {/* Top Header */}
      <Navbar activeTab={currentTab} onTabChange={setActiveTab} />

      {/* Screen Views */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {currentTab === 'pos' && <PosScreen />}
        {currentTab === 'inventory' && <InventoryScreen />}
        {currentTab === 'expenses' && <ExpensesScreen />}
        {currentTab === 'reports' && <ReportsScreen />}
        {currentTab === 'settings' && <SettingsScreen />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <StoreDataProvider>
          <CartProvider>
            <MainLayout />
          </CartProvider>
        </StoreDataProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
