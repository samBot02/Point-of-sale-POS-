export type ProductUnit = 'pcs' | 'kg' | 'g' | 'pack' | 'litre' | 'box';

export interface Product {
  id: string;
  name: string;
  barcode: string;
  sku: string;
  category: string;
  unit: ProductUnit;
  costPrice: number;       // Wholesale purchase cost
  sellingPrice: number;    // Retail shelf price
  stockQuantity: number;   // Current in-stock quantity (supports decimal for kg/g)
  minStockThreshold: number; // Low stock alert level (e.g. 5)
  expiryDate?: string;     // ISO date YYYY-MM-DD
  isPerishable: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;        // supports decimal for kg, e.g. 1.35
  unitPrice: number;       // can be overridden if discounted
  discount: number;        // fixed amount or % discount
  total: number;
}

export interface SaleItem {
  productId: string;
  name: string;
  barcode: string;
  unit: ProductUnit;
  costPrice: number;
  unitPrice: number;
  quantity: number;
  discount: number;
  total: number;
  profit: number;          // (unitPrice * quantity) - (costPrice * quantity)
}

export type PaymentMethod = 'cash' | 'card' | 'mobile_transfer' | 'split';

export interface Sale {
  id: string;
  receiptNumber: string;   // e.g. "REC-20261002-0001"
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  totalCost: number;       // COGS
  profit: number;          // Gross profit
  paymentMethod: PaymentMethod;
  amountTendered: number;
  changeGiven: number;
  customerNote?: string;
  status: 'completed' | 'refunded';
  timestamp: string;       // ISO timestamp
}

export interface ParkedSale {
  id: string;
  label: string;           // e.g. "Customer #1 - 3 items"
  items: CartItem[];
  timestamp: string;
}

export type ExpenseCategory = 
  | 'inventory_restock' 
  | 'rent' 
  | 'utilities_cooling' 
  | 'wages' 
  | 'packaging' 
  | 'spoilage_waste' 
  | 'maintenance' 
  | 'other';

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'bank_transfer';
  payee?: string;
  date: string;            // YYYY-MM-DD
  notes?: string;
  timestamp: string;
}

export type StockLogType = 
  | 'restock' 
  | 'spoilage_waste' 
  | 'sale_deduction' 
  | 'manual_adjustment' 
  | 'refund_return';

export interface StockLog {
  id: string;
  productId: string;
  productName: string;
  type: StockLogType;
  quantityDelta: number;   // +10 or -2.5
  costPerUnit?: number;
  reason?: string;
  timestamp: string;
}

export interface StoreSettings {
  id?: string;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  currencySymbol: string;  // e.g. "$", "€", "£", "₹", "₦", "R"
  currencyCode: string;    // e.g. "USD", "EUR", "GBP"
  taxRate: number;         // e.g. 0 or 8.5
  taxInclusive: boolean;
  receiptHeader: string;
  receiptFooter: string;
  lowStockAlertDays: number; // Alert if expiring within X days (default 7)
  hasCompletedOnboarding: boolean;
}

export interface ProductCategory {
  id: string;
  name: string;
  iconName: string;
  color: string;
}
