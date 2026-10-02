import React from 'react';
import type { Product } from '../../types';
import { formatCurrency, formatUnitQuantity, getDaysUntilExpiry } from '../../utils/formatters';
import { useSettings } from '../../context/SettingsContext';
import { AlertCircle, Scale } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { settings } = useSettings();

  const isLowStock = product.stockQuantity <= product.minStockThreshold && product.stockQuantity > 0;
  const isOutOfStock = product.stockQuantity <= 0;
  const daysLeft = getDaysUntilExpiry(product.expiryDate);
  const isExpiringSoon = daysLeft !== null && daysLeft <= (settings.lowStockAlertDays || 7) && daysLeft >= 0;
  const isExpired = daysLeft !== null && daysLeft < 0;

  const isWeighted = product.unit === 'kg' || product.unit === 'g';

  return (
    <button
      onClick={() => onSelect(product)}
      disabled={isOutOfStock}
      className={`group relative flex flex-col text-left p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer select-none active:scale-[0.98] ${
        isOutOfStock
          ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
          : 'bg-white border-slate-200/80 hover:border-emerald-500/80 hover:shadow-md'
      }`}
    >
      {/* Category & Status Pill */}
      <div className="flex items-center justify-between w-full mb-2 gap-1.5">
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 truncate max-w-[120px]">
          {product.category}
        </span>

        {/* Stock pill */}
        {isOutOfStock ? (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
            Out of Stock
          </span>
        ) : isLowStock ? (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
            Low ({formatUnitQuantity(product.stockQuantity, product.unit)})
          </span>
        ) : (
          <span className="text-[10px] text-slate-400 font-medium">
            {formatUnitQuantity(product.stockQuantity, product.unit)}
          </span>
        )}
      </div>

      {/* Product Name */}
      <h3 className="font-semibold text-sm text-slate-800 line-clamp-2 leading-snug mb-1 group-hover:text-emerald-700 transition">
        {product.name}
      </h3>

      {/* Barcode / SKU */}
      <p className="text-[11px] font-mono text-slate-400 mb-2 truncate">
        {product.barcode || product.sku}
      </p>

      {/* Expiry Warning Alert if near */}
      {isExpired ? (
        <div className="flex items-center gap-1 text-[10px] font-medium text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded mb-2">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>Expired!</span>
        </div>
      ) : isExpiringSoon ? (
        <div className="flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mb-2">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>Expires in {daysLeft}d</span>
        </div>
      ) : null}

      {/* Price & Unit Footer */}
      <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between w-full">
        <div>
          <span className="text-base font-bold text-slate-900">
            {formatCurrency(product.sellingPrice, settings.currencySymbol)}
          </span>
          <span className="text-xs text-slate-500 ml-0.5">/{product.unit}</span>
        </div>

        {isWeighted && (
          <div className="p-1 rounded-lg bg-emerald-50 text-emerald-700" title="Weighted item">
            <Scale className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </button>
  );
};
