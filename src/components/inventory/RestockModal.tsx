import React, { useState, useEffect } from 'react';
import type { Product } from '../../types';
import { db } from '../../db';
import { formatCurrency, formatUnitQuantity } from '../../utils/formatters';
import { useSettings } from '../../context/SettingsContext';
import { X, Truck, CheckCircle2 } from 'lucide-react';


interface RestockModalProps {
  product: Product | null;
  productsList: Product[];
  isOpen: boolean;
  onClose: () => void;
}

export const RestockModal: React.FC<RestockModalProps> = ({
  product,
  productsList,
  isOpen,
  onClose,
}) => {
  const { settings } = useSettings();

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [addedQuantity, setAddedQuantity] = useState<string>('10');
  const [costPerUnit, setCostPerUnit] = useState<string>('1.00');
  const [logAsExpense, setLogAsExpense] = useState<boolean>(true);
  const [supplierName, setSupplierName] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer'>('bank_transfer');

  useEffect(() => {
    if (product) {
      setSelectedProductId(product.id);
      setCostPerUnit(product.costPrice.toString());
      setSupplierName(product.notes || 'Local Wholesale Market');
    } else if (productsList.length > 0) {
      const first = productsList[0];
      setSelectedProductId(first.id);
      setCostPerUnit(first.costPrice.toString());
      setSupplierName(first.notes || 'Local Wholesale Market');
    }
  }, [product, productsList, isOpen]);

  if (!isOpen) return null;

  const currentProduct = productsList.find((p) => p.id === selectedProductId) || product;

  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    const p = productsList.find((x) => x.id === id);
    if (p) {
      setCostPerUnit(p.costPrice.toString());
      if (p.notes) setSupplierName(p.notes);
    }
  };

  const qty = parseFloat(addedQuantity) || 0;
  const unitCost = parseFloat(costPerUnit) || 0;
  const totalExpenseCost = qty * unitCost;
  const newStock = currentProduct ? Number((currentProduct.stockQuantity + qty).toFixed(2)) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct || qty <= 0) return;

    const now = new Date().toISOString();
    const todayStr = now.slice(0, 10);

    await db.transaction('rw', [db.products, db.stockLogs, db.expenses], async () => {
      // 1. Update Product Stock and wholesale cost
      await db.products.update(currentProduct.id, {
        stockQuantity: newStock,
        costPrice: unitCost,
        updatedAt: now,
      });

      // 2. Add Stock Log
      await db.stockLogs.add({
        id: `stock-log-${Date.now()}`,
        productId: currentProduct.id,
        productName: currentProduct.name,
        type: 'restock',
        quantityDelta: qty,
        costPerUnit: unitCost,
        reason: `Restocked from ${supplierName || 'Supplier'}`,
        timestamp: now,
      });

      // 3. Optional: Automatically write to Expenses table!
      if (logAsExpense && totalExpenseCost > 0) {
        await db.expenses.add({
          id: `exp-${Date.now()}`,
          title: `Restock: ${qty} ${currentProduct.unit} of ${currentProduct.name}`,
          category: 'inventory_restock',
          amount: Number(totalExpenseCost.toFixed(2)),
          paymentMethod,
          payee: supplierName.trim() || 'Wholesale Supplier',
          date: todayStr,
          notes: `Purchased at ${formatCurrency(unitCost, settings.currencySymbol)}/${currentProduct.unit}`,
          timestamp: now,
        });
      }
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Stock In / Restock Inventory</h3>
              <p className="text-xs text-slate-500">Record incoming stock deliveries and purchases</p>
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
          {/* Product Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductSelect(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              {productsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Current: {formatUnitQuantity(p.stockQuantity, p.unit)})
                </option>
              ))}
            </select>
          </div>

          {currentProduct && (
            <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-500">Current In-Stock:</span>
              <span className="font-bold text-slate-800">
                {formatUnitQuantity(currentProduct.stockQuantity, currentProduct.unit)}
              </span>
            </div>
          )}

          {/* Quantity & Unit Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity to Add {currentProduct && `(${currentProduct.unit})`}
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={addedQuantity}
                onChange={(e) => setAddedQuantity(e.target.value)}
                placeholder="10"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Wholesale Cost per Unit
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>

          {/* New Stock Preview */}
          {currentProduct && (
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between text-xs">
              <span className="text-blue-900 font-medium">New Stock after delivery:</span>
              <span className="text-sm font-extrabold text-blue-950">
                {formatUnitQuantity(newStock, currentProduct.unit)}
              </span>
            </div>
          )}

          {/* Auto Expense Toggle */}
          <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl space-y-3">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-emerald-950">
              <input
                type="checkbox"
                checked={logAsExpense}
                onChange={(e) => setLogAsExpense(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span>Automatically Log as Inventory Purchase Expense</span>
            </label>

            {logAsExpense && (
              <div className="space-y-3 pt-2 border-t border-emerald-100 animate-in fade-in duration-150">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-800 font-medium">Total Purchase Amount:</span>
                  <span className="text-sm font-bold text-emerald-900">
                    {formatCurrency(totalExpenseCost, settings.currencySymbol)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Supplier / Vendor
                    </label>
                    <input
                      type="text"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      placeholder="e.g. Metro Wholesale Foods"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash (Register Drawer)</option>
                      <option value="card">Business Card</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
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
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Confirm Restock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
