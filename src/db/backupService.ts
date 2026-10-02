import { db } from './index';
import type { Product, Sale, Expense } from '../types';

export interface BackupData {
  version: number;
  timestamp: string;
  storeSettings?: unknown;
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  stockLogs: unknown[];
  parkedSales: unknown[];
}

export const exportDatabaseJSON = async () => {
  const products = await db.products.toArray();
  const sales = await db.sales.toArray();
  const expenses = await db.expenses.toArray();
  const stockLogs = await db.stockLogs.toArray();
  const parkedSales = await db.parkedSales.toArray();
  const settings = await db.settings.get('current_settings');

  const backupData: BackupData = {
    version: 1,
    timestamp: new Date().toISOString(),
    storeSettings: settings,
    products,
    sales,
    expenses,
    stockLogs,
    parkedSales,
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = `grocery_backup_${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importDatabaseJSON = async (file: File): Promise<{ success: boolean; message: string }> => {
  try {
    const text = await file.text();
    const data = JSON.parse(text) as Partial<BackupData>;

    if (!data.products || !Array.isArray(data.products)) {
      return { success: false, message: 'Invalid backup file format: missing products table.' };
    }

    await db.transaction('rw', [db.products, db.sales, db.expenses, db.stockLogs, db.parkedSales, db.settings], async () => {
      await db.products.clear();
      await db.sales.clear();
      await db.expenses.clear();
      await db.stockLogs.clear();
      await db.parkedSales.clear();

      if (data.products?.length) await db.products.bulkAdd(data.products);
      if (data.sales?.length) await db.sales.bulkAdd(data.sales);
      if (data.expenses?.length) await db.expenses.bulkAdd(data.expenses);
      if (data.stockLogs?.length) await db.stockLogs.bulkAdd(data.stockLogs as any);
      if (data.parkedSales?.length) await db.parkedSales.bulkAdd(data.parkedSales as any);
      if (data.storeSettings) await db.settings.put(data.storeSettings as any);
    });

    return { success: true, message: `Successfully restored ${data.products.length} products, ${data.sales?.length || 0} sales, and ${data.expenses?.length || 0} expenses.` };
  } catch (err: any) {
    return { success: false, message: `Failed to import backup: ${err.message || err}` };
  }
};

export const exportInventoryCSV = async () => {
  const products = await db.products.toArray();
  const headers = ['SKU', 'Barcode', 'Name', 'Category', 'Unit', 'Cost Price', 'Selling Price', 'Margin %', 'Stock Quantity', 'Min Stock Threshold', 'Expiry Date', 'Perishable'];
  
  const rows = products.map((p) => {
    const margin = p.sellingPrice > 0 ? (((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100).toFixed(1) : '0';
    return [
      `"${p.sku}"`,
      `"${p.barcode}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      `"${p.unit}"`,
      p.costPrice.toFixed(2),
      p.sellingPrice.toFixed(2),
      `"${margin}%"`,
      p.stockQuantity,
      p.minStockThreshold,
      `"${p.expiryDate || ''}"`,
      p.isPerishable ? 'Yes' : 'No',
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  downloadCSV(csvContent, `grocery_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
};

export const exportSalesCSV = async () => {
  const sales = await db.sales.toArray();
  const headers = ['Receipt Number', 'Date', 'Time', 'Items Count', 'Subtotal', 'Discount', 'Tax', 'Total Amount', 'COGS Cost', 'Gross Profit', 'Payment Method', 'Status'];

  const rows = sales.map((s) => {
    const date = new Date(s.timestamp);
    return [
      `"${s.receiptNumber}"`,
      `"${date.toISOString().slice(0, 10)}"`,
      `"${date.toLocaleTimeString()}"`,
      s.items.reduce((acc, item) => acc + item.quantity, 0),
      s.subtotal.toFixed(2),
      s.discount.toFixed(2),
      s.tax.toFixed(2),
      s.total.toFixed(2),
      s.totalCost.toFixed(2),
      s.profit.toFixed(2),
      `"${s.paymentMethod}"`,
      `"${s.status}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  downloadCSV(csvContent, `grocery_sales_${new Date().toISOString().slice(0, 10)}.csv`);
};

export const exportExpensesCSV = async () => {
  const expenses = await db.expenses.toArray();
  const headers = ['Date', 'Title', 'Category', 'Amount', 'Payment Method', 'Payee', 'Notes'];

  const rows = expenses.map((e) => [
    `"${e.date}"`,
    `"${e.title.replace(/"/g, '""')}"`,
    `"${e.category}"`,
    e.amount.toFixed(2),
    `"${e.paymentMethod}"`,
    `"${(e.payee || '').replace(/"/g, '""')}"`,
    `"${(e.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  downloadCSV(csvContent, `grocery_expenses_${new Date().toISOString().slice(0, 10)}.csv`);
};

const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
