import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Product, Sale, Expense, StockLog, ParkedSale } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface StoreDataContextType {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  stockLogs: StockLog[];
  parkedSales: ParkedSale[];
  loading: boolean;
  refreshData: () => Promise<void>;
  createProduct: (data: Partial<Product>) => Promise<void>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  createSale: (saleData: Partial<Sale>) => Promise<Sale>;
  createExpense: (data: Partial<Expense>) => Promise<void>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  adjustStock: (data: {
    productId: string;
    quantityDelta: number;
    type: string;
    reason: string;
    costPerUnit?: number;
    logAsExpense?: boolean;
    expenseData?: Partial<Expense>;
  }) => Promise<void>;
  parkSale: (label: string, items: any[]) => Promise<void>;
  resumeParkedSale: (id: string) => Promise<any[]>;
  deleteParkedSale: (id: string) => Promise<void>;
}

const StoreDataContext = createContext<StoreDataContextType | undefined>(undefined);

export const StoreDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [parkedSales, setParkedSales] = useState<ParkedSale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const [prods, sls, exps, pSales, logs] = await Promise.all([
        api.getProducts().catch(() => []),
        api.getSales().catch(() => []),
        api.getExpenses().catch(() => []),
        api.getParkedSales().catch(() => []),
        api.getStockLogs().catch(() => []),
      ]);

      setProducts(prods);
      setSales(sls);
      setExpenses(exps);
      setParkedSales(pSales);
      setStockLogs(logs);
    } catch (err) {
      console.error('Failed to load store data:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
      // Optional polling every 10 seconds so all LAN devices stay in sync automatically
      const interval = setInterval(refreshData, 10000);
      return () => clearInterval(interval);
    } else {
      setProducts([]);
      setSales([]);
      setExpenses([]);
      setParkedSales([]);
      setStockLogs([]);
      setLoading(false);
    }
  }, [isAuthenticated, refreshData]);

  const createProduct = async (data: Partial<Product>) => {
    await api.createProduct(data);
    await refreshData();
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
    await api.updateProduct(id, data);
    await refreshData();
  };

  const deleteProduct = async (id: string) => {
    await api.deleteProduct(id);
    await refreshData();
  };

  const createSale = async (saleData: Partial<Sale>): Promise<Sale> => {
    await api.createSale(saleData);
    await refreshData();
    return saleData as Sale;
  };

  const createExpense = async (data: Partial<Expense>) => {
    await api.createExpense(data);
    await refreshData();
  };

  const updateExpense = async (id: string, data: Partial<Expense>) => {
    await api.updateExpense(id, data);
    await refreshData();
  };

  const deleteExpense = async (id: string) => {
    await api.deleteExpense(id);
    await refreshData();
  };

  const adjustStock = async (data: any) => {
    await api.adjustStock(data);
    await refreshData();
  };

  const parkSale = async (label: string, items: any[]) => {
    await api.parkSale({ label, items });
    await refreshData();
  };

  const resumeParkedSale = async (id: string): Promise<any[]> => {
    const found = parkedSales.find((p) => p.id === id);
    if (found) {
      await api.deleteParkedSale(id);
      await refreshData();
      return found.items;
    }
    return [];
  };

  const deleteParkedSale = async (id: string) => {
    await api.deleteParkedSale(id);
    await refreshData();
  };

  return (
    <StoreDataContext.Provider
      value={{
        products,
        sales,
        expenses,
        stockLogs,
        parkedSales,
        loading,
        refreshData,
        createProduct,
        updateProduct,
        deleteProduct,
        createSale,
        createExpense,
        updateExpense,
        deleteExpense,
        adjustStock,
        parkSale,
        resumeParkedSale,
        deleteParkedSale,
      }}
    >
      {children}
    </StoreDataContext.Provider>
  );
};

export const useStoreData = () => {
  const context = useContext(StoreDataContext);
  if (!context) {
    throw new Error('useStoreData must be used within a StoreDataProvider');
  }
  return context;
};
