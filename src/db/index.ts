import Dexie, { type Table } from 'dexie';
import type { Product, Sale, Expense, StockLog, StoreSettings, ParkedSale } from '../types';

export class GroceryDatabase extends Dexie {
  products!: Table<Product, string>;
  sales!: Table<Sale, string>;
  expenses!: Table<Expense, string>;
  stockLogs!: Table<StockLog, string>;
  parkedSales!: Table<ParkedSale, string>;
  settings!: Table<StoreSettings, string>;

  constructor() {
    super('GroceryStoreDB');
    this.version(1).stores({
      products: 'id, name, barcode, sku, category, stockQuantity, expiryDate, isPerishable',
      sales: 'id, receiptNumber, timestamp, paymentMethod, status',
      expenses: 'id, category, date, timestamp',
      stockLogs: 'id, productId, type, timestamp',
      parkedSales: 'id, timestamp',
      settings: 'id',
    });
  }
}

export const db = new GroceryDatabase();
