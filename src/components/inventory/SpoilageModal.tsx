import React, { useState, useEffect } from 'react';
import type { Product } from '../../types';
import { useStoreData } from '../../context/StoreDataContext';
import { db } from '../../db';
import { formatCurrency, formatUnitQuantity } from '../../utils/formatters';
import { useSettings } from '../../context/SettingsContext';
import { X, Trash2 } from 'lucide-react';

interface SpoilageModalProps {
  product: Product | null;
  productsList: Product[];
  isOpen: boolean;
  onClose: () => void;
}

export const SpoilageModal: React.FC<SpoilageModalProps> = ({
  product,
  productsList,
  isOpen,
  onClose,
}) => {
  const { settings } = useSettings();
  const { adjustStock } = useStoreData();

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [wasteQuantity, setWasteQuantity] = useState<string>('1');
  const [reason, setReason] = useState<string>('Expired / Past Best-by Date');
  const [logAsExpense, setLogAsExpense] = useState<boolean>(true);

  useEffect(() => {
    if (product) {
      setSelectedProductId(product.id);
    } else if (productsList.length > 0) {
      setSelectedProductId(productsList[0].id);
    }
  }, [product, productsList, isOpen]);

  if (!isOpen) return null;

  const currentProduct = productsList.find((p) => p.id === selectedProductId) || product;
  const qty = parseFloat(wasteQuantity) || 0;
  const lossValue = currentProduct ? qty * currentProduct.costPrice : 0;
  const remainingStock = currentProduct ? Math.max(0, Number((currentProduct.stockQuantity - qty).toFixed(2))) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct || qty <= 0) return;

    const now = new Date().toISOString();
    const todayStr = now.slice(0, 10);

    try {
      await adjustStock({
        productId: currentProduct.id,
        quantityDelta: -qty,
        type: 'spoilage_waste',
        reason: `${reason} (${qty} ${currentProduct.unit})`,
        costPerUnit: currentProduct.costPrice,
        logAsExpense,
        expenseData: logAsExpense && lossValue > 0 ? {
          title: `Spoilage Loss: ${qty} ${currentProduct.unit} of ${currentProduct.name}`,
          category: 'spoilage_waste',
          amount: Number(lossValue.toFixed(2)),
          paymentMethod: 'cash',
          payee: 'Store Food Waste',
          date: todayStr,
          notes: `Reason: ${reason}`,
        } : undefined,
      });
    } catch (err: any) {
      alert(err.message || 'Failed to adjust stock on server.');
      return;
    }

    // Mirror in local Dexie for offline resilience
    try {
      await db.products.update(currentProduct.id, {
        stockQuantity: remainingStock,
        updatedAt: now,
      });
    } catch {
      // Ignore
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-rose-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Log Food Waste / Spoilage</h3>
              <p className="text-xs text-slate-500">Record damaged, bruised, or expired groceries</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Select Product */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 font-medium"
            >
              {productsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stock: {formatUnitQuantity(p.stockQuantity, p.unit)})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity Wasted */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quantity to Write Off {currentProduct && `(${currentProduct.unit})`}
            </label>
            <input
              type="number"
              step="0.05"
              min="0.05"
              required
              value={wasteQuantity}
              onChange={(e) => setWasteQuantity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Waste</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
            >
              <option value="Expired / Past Best-by Date">Expired / Past Best-by Date</option>
              <option value="Bruised / Overripe Produce">Bruised / Overripe Produce</option>
              <option value="Broken Container / Spillage">Broken Container / Spillage</option>
              <option value="Cold Storage Failure">Cold Storage / Freezer Temperature Failure</option>
              <option value="Inventory Discrepancy">Inventory Discrepancy / Shrinkage</option>
            </select>
          </div>

          {/* Loss Calculation */}
          {currentProduct && (
            <div className="p-3.5 bg-rose-50/70 border border-rose-100 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Wholesale Cost Value Lost:</span>
                <span className="font-bold text-rose-700">
                  {formatCurrency(lossValue, settings.currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 pt-1 border-t border-rose-100">
                <span>Remaining Stock after write-off:</span>
                <span className="font-semibold text-slate-700">
                  {formatUnitQuantity(remainingStock, currentProduct.unit)}
                </span>
              </div>
            </div>
          )}

          {/* Option to log as expense */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={logAsExpense}
                onChange={(e) => setLogAsExpense(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
              />
              <span>Record financial loss in Expense Tracker (Spoilage & Waste)</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={qty <= 0}
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" /> Confirm Write-Off
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
