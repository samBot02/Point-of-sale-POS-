import type { Product, Expense, StoreSettings, ProductCategory } from '../types';

export const GROCERY_CATEGORIES: ProductCategory[] = [
  { id: 'produce', name: 'Fresh Produce', iconName: 'Apple', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { id: 'dairy', name: 'Dairy & Eggs', iconName: 'Egg', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'bakery', name: 'Bakery & Bread', iconName: 'Croissant', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { id: 'beverages', name: 'Beverages', iconName: 'Coffee', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { id: 'snacks', name: 'Snacks & Confectionery', iconName: 'Cookie', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { id: 'pantry', name: 'Canned & Pantry', iconName: 'Package', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { id: 'meat', name: 'Meat & Seafood', iconName: 'Fish', color: 'bg-rose-100 text-rose-800 border-rose-300' },
  { id: 'household', name: 'Household & Cleaning', iconName: 'Sparkles', color: 'bg-teal-100 text-teal-800 border-teal-300' },
];

// No pre-populated products - clean slate for the store
export const INITIAL_GROCERY_PRODUCTS: Product[] = [];

// No pre-populated expenses - clean slate for the store
export const INITIAL_EXPENSES: Expense[] = [];

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  id: 'current_settings',
  storeName: '',
  storeAddress: '',
  storePhone: '',
  currencySymbol: '$',
  currencyCode: 'USD',
  taxRate: 0,
  taxInclusive: false,
  receiptHeader: '',
  receiptFooter: 'Thank you for shopping with us! Please come again.',
  lowStockAlertDays: 7,
  hasCompletedOnboarding: false,
};
