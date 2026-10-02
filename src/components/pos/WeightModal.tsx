import React, { useState } from 'react';
import type { Product } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { useSettings } from '../../context/SettingsContext';
import { Scale, X, Check } from 'lucide-react';

interface WeightModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (product: Product, quantity: number) => void;
}

export const WeightModal: React.FC<WeightModalProps> = ({
  product,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { settings } = useSettings();
  const [quantityStr, setQuantityStr] = useState<string>('1');

  if (!isOpen || !product) return null;

  const numericQty = parseFloat(quantityStr) || 0;
  const calculatedTotal = numericQty * product.sellingPrice;

  const handlePreset = (val: number) => {
    setQuantityStr(val.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericQty > 0) {
      onConfirm(product, numericQty);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">{product.name}</h3>
              <p className="text-xs text-slate-500">
                {formatCurrency(product.sellingPrice, settings.currencySymbol)} per {product.unit}
              </p>
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Enter Quantity / Weight ({product.unit})
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                autoFocus
                value={quantityStr}
                onChange={(e) => setQuantityStr(e.target.value)}
                className="w-full text-center text-3xl font-bold py-3 px-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
              />
              <span className="absolute right-4 top-4 text-sm font-semibold text-slate-400">
                {product.unit}
              </span>
            </div>
          </div>

          {/* Quick Presets for Produce / Weighted Goods */}
          {product.unit === 'kg' && (
            <div className="grid grid-cols-4 gap-2">
              {[0.25, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 5.0].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePreset(preset)}
                  className={`py-1.5 text-xs font-medium rounded-lg border transition ${
                    numericQty === preset
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {preset} kg
                </button>
              ))}
            </div>
          )}

          {/* Calculated Subtotal Display */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center justify-between">
            <span className="text-xs text-emerald-800 font-medium">Subtotal for item:</span>
            <span className="text-lg font-bold text-emerald-900">
              {formatCurrency(calculatedTotal, settings.currencySymbol)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={numericQty <= 0}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <Check className="w-4 h-4" /> Add to Cart
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
