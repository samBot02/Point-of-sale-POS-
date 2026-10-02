import React from 'react';
import type { Product } from '../../types';
import { getDaysUntilExpiry, formatDateOnly, formatUnitQuantity } from '../../utils/formatters';
import { Clock } from 'lucide-react';


interface ExpiryTrackerWidgetProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onLogSpoilage: (product: Product) => void;
}

export const ExpiryTrackerWidget: React.FC<ExpiryTrackerWidgetProps> = ({
  products,
  onSelectProduct,
  onLogSpoilage,
}) => {
  const expiringItems = products
    .filter((p) => p.isPerishable && p.expiryDate && p.stockQuantity > 0)
    .map((p) => ({
      product: p,
      daysLeft: getDaysUntilExpiry(p.expiryDate) ?? 999,
    }))
    .filter((item) => item.daysLeft <= 14) // Within 2 weeks
    .sort((a, b) => a.daysLeft - b.daysLeft);

  if (expiringItems.length === 0) return null;

  const expiredCount = expiringItems.filter((i) => i.daysLeft < 0).length;
  const criticalCount = expiringItems.filter((i) => i.daysLeft >= 0 && i.daysLeft <= 3).length;

  return (
    <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-200/80 text-amber-800">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-amber-950">
              Perishables Shelf-Life Monitor
            </h4>
            <p className="text-[11px] text-amber-800">
              {expiredCount > 0 && <span className="font-bold text-rose-700">{expiredCount} expired items! </span>}
              {criticalCount > 0 && <span>{criticalCount} items expiring within 3 days.</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {expiringItems.slice(0, 6).map(({ product, daysLeft }) => {
          const isExpired = daysLeft < 0;
          const isUrgent = daysLeft >= 0 && daysLeft <= 3;

          return (
            <div
              key={product.id}
              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs bg-white shadow-xs ${
                isExpired
                  ? 'border-rose-300 bg-rose-50/30'
                  : isUrgent
                  ? 'border-amber-300'
                  : 'border-slate-200'
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-800 truncate">{product.name}</p>
                <p className="text-[10px] text-slate-500">
                  {formatUnitQuantity(product.stockQuantity, product.unit)} in stock
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      isExpired
                        ? 'bg-rose-100 text-rose-700'
                        : isUrgent
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isExpired ? 'EXPIRED' : daysLeft === 0 ? 'Expires Today' : `${daysLeft} days left`}
                  </span>
                  <span className="text-[10px] text-slate-400">({formatDateOnly(product.expiryDate)})</span>
                </div>
              </div>

              <div className="flex flex-col gap-1 shrink-0">
                <button
                  onClick={() => onLogSpoilage(product)}
                  className="px-2 py-1 text-[10px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition"
                >
                  Write-off
                </button>
                <button
                  onClick={() => onSelectProduct(product)}
                  className="px-2 py-1 text-[10px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition"
                >
                  Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
