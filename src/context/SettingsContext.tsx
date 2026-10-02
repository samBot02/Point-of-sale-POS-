import React, { createContext, useContext, useEffect, useState } from 'react';
import type { StoreSettings } from '../types';
import { db } from '../db';
import { api } from '../services/api';
import { DEFAULT_STORE_SETTINGS } from '../db/initialData';

interface SettingsContextType {
  settings: StoreSettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  completeOnboarding: (customSettings: Partial<StoreSettings>) => Promise<void>;
  clearAllData: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initSettings = async () => {
      try {
        // Automatic cleanup of any previous demo/sample records in Dexie
        await db.transaction('rw', [db.products, db.expenses], async () => {
          const allProds = await db.products.toArray();
          const demoProdIds = allProds.filter((p) => /^prod-0\d+/.test(p.id)).map((p) => p.id);
          if (demoProdIds.length > 0) {
            await db.products.bulkDelete(demoProdIds);
          }

          const allExpenses = await db.expenses.toArray();
          const demoExpIds = allExpenses.filter((e) => /^exp-0\d+/.test(e.id)).map((e) => e.id);
          if (demoExpIds.length > 0) {
            await db.expenses.bulkDelete(demoExpIds);
          }
        });

        // Try to fetch settings from centralized backend
        try {
          const remoteSettings = await api.getSettings();
          if (remoteSettings && remoteSettings.storeName) {
            setSettings({ ...DEFAULT_STORE_SETTINGS, ...remoteSettings });
            await db.settings.put({ ...DEFAULT_STORE_SETTINGS, ...remoteSettings, id: 'current_settings' });
            setLoading(false);
            return;
          }
        } catch {
          // If offline or not initialized, fallback to Dexie
        }

        const stored = await db.settings.get('current_settings');
        if (stored) {
          setSettings(stored);
        } else {
          await db.settings.put(DEFAULT_STORE_SETTINGS);
          setSettings(DEFAULT_STORE_SETTINGS);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    initSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    const merged: StoreSettings = { ...settings, ...newSettings, id: 'current_settings' };
    try {
      await api.updateSettings(merged);
    } catch {
      // Ignore if cashier or server offline
    }
    await db.settings.put(merged);
    setSettings(merged);
  };

  const completeOnboarding = async (customSettings: Partial<StoreSettings>) => {
    const updated: StoreSettings = {
      ...settings,
      ...customSettings,
      hasCompletedOnboarding: true,
      id: 'current_settings',
    };
    try {
      await api.updateSettings(updated);
    } catch {
      // Ignore
    }
    await db.settings.put(updated);
    setSettings(updated);
  };

  const clearAllData = async () => {
    await db.transaction('rw', [db.products, db.sales, db.expenses, db.stockLogs, db.parkedSales], async () => {
      await db.products.clear();
      await db.sales.clear();
      await db.expenses.clear();
      await db.stockLogs.clear();
      await db.parkedSales.clear();
    });
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        updateSettings,
        completeOnboarding,
        clearAllData,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
