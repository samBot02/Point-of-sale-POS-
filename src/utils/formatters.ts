import type { ProductUnit } from '../types';

export const formatCurrency = (amount: number, symbol: string = '$'): string => {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}${symbol}${formatted}`;
};

export const formatUnitQuantity = (quantity: number, unit: ProductUnit): string => {
  // If unit is kg or g, display up to 2 decimal places if needed
  if (unit === 'kg' || unit === 'g' || unit === 'litre') {
    const formatted = Number.isInteger(quantity) ? quantity.toString() : quantity.toFixed(2);
    return `${formatted} ${unit}`;
  }
  return `${quantity} ${unit}`;
};

export const formatDateTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
};

export const formatDateOnly = (isoString?: string): string => {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
};

export const getDaysUntilExpiry = (expiryDateStr?: string): number | null => {
  if (!expiryDateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const generateReceiptNumber = (): string => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `REC-${dateStr}-${randomSuffix}`;
};

export const generateSKU = (category: string): string => {
  const prefix = category.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'ITM');
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${random}`;
};
