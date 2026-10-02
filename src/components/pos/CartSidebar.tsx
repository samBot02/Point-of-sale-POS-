import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency, formatUnitQuantity } from '../../utils/formatters';
import type { CartItem } from '../../types';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  PauseCircle, 
  Tag, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';


interface CartSidebarProps {
  onOpenCheckout: () => void;
  onOpenParked: () => void;
  parkedCount: number;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  onOpenCheckout,
  onOpenParked,
  parkedCount,
}) => {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    parkCurrentSale,
    subtotal,
    discountTotal,
    taxAmount,
    grandTotal,
    estimatedProfit,
    itemCount,
    overallDiscount,
    setOverallDiscount,
  } = useCart();
  const { settings } = useSettings();

  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [discountVal, setDiscountVal] = useState(overallDiscount ? overallDiscount.toString() : '');

  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(discountVal) || 0;
    setOverallDiscount(val);
    setShowDiscountInput(false);
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200/80 shadow-xs">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm">Current Order</h2>
            <p className="text-xs text-slate-400">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} in cart
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Parked button */}
          <button
            onClick={onOpenParked}
            title="View Parked Orders"
            className="relative p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
          >
            <PauseCircle className="w-4 h-4" />
            {parkedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {parkedCount}
              </span>
            )}
          </button>

          {/* Hold current cart */}
          {cartItems.length > 0 && (
            <button
              onClick={() => parkCurrentSale()}
              title="Park / Hold this cart"
              className="p-2 text-amber-600 hover:text-amber-700 rounded-xl hover:bg-amber-50 text-xs font-semibold flex items-center gap-1 transition"
            >
              <span>Hold</span>
            </button>
          )}

          {/* Clear cart */}
          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              title="Clear Cart"
              className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-3">
              <ShoppingCart className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-600">Register is Ready</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              Scan barcodes or tap products from the catalog to begin ring up.
            </p>
          </div>
        ) : (
          cartItems.map((item: CartItem) => {
            const isWeighted = item.product.unit === 'kg' || item.product.unit === 'g';
            const step = isWeighted ? 0.25 : 1;

            return (
              <div
                key={item.product.id}
                className="p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/50 transition group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs text-slate-800 truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {formatCurrency(item.unitPrice, settings.currencySymbol)} / {item.product.unit}
                    </p>
                  </div>
                  <span className="font-bold text-xs text-slate-900 shrink-0">
                    {formatCurrency(item.total, settings.currencySymbol)}
                  </span>
                </div>

                {/* Controls Bar */}
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/80">
                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - step)}
                      className="p-1 text-slate-600 hover:text-slate-900 rounded-md hover:bg-white transition"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-slate-800 px-1.5 min-w-[28px] text-center font-mono">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + step)}
                      className="p-1 text-slate-600 hover:text-slate-900 rounded-md hover:bg-white transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {formatUnitQuantity(item.quantity, item.product.unit)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bill Calculation & Checkout Footer */}
      {cartItems.length > 0 && (
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/70 space-y-3">
          {/* Discount line toggle */}
          {showDiscountInput ? (
            <form onSubmit={handleApplyDiscount} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  autoFocus
                  placeholder="Discount amount"
                  value={discountVal}
                  onChange={(e) => setDiscountVal(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => setShowDiscountInput(false)}
                className="px-2 py-1.5 text-xs text-slate-500"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <button
                type="button"
                onClick={() => setShowDiscountInput(true)}
                className="text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-medium hover:underline cursor-pointer"
              >
                <Tag className="w-3 h-3" />
                <span>{overallDiscount > 0 ? `Discount: -${formatCurrency(overallDiscount, settings.currencySymbol)}` : '+ Add Order Discount'}</span>
              </button>
              {estimatedProfit > 0 && (
                <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Est. Margin: {formatCurrency(estimatedProfit, settings.currencySymbol)}
                </span>
              )}
            </div>
          )}

          {/* Subtotals */}
          <div className="space-y-1 text-xs text-slate-600 pt-1 border-t border-slate-200/60">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800">
                {formatCurrency(subtotal, settings.currencySymbol)}
              </span>
            </div>

            {discountTotal > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Total Discount:</span>
                <span>-{formatCurrency(discountTotal, settings.currencySymbol)}</span>
              </div>
            )}

            {settings.taxRate > 0 && (
              <div className="flex justify-between">
                <span>
                  Sales Tax ({settings.taxRate}%{settings.taxInclusive ? ' incl.' : ''}):
                </span>
                <span>{formatCurrency(taxAmount, settings.currencySymbol)}</span>
              </div>
            )}
          </div>

          {/* Grand Total */}
          <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Due</span>
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(grandTotal, settings.currencySymbol)}
            </span>
          </div>

          {/* Checkout Button */}
          <button
            onClick={onOpenCheckout}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <span>Pay / Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
