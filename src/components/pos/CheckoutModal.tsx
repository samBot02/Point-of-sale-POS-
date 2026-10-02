import React, { useState, useMemo } from 'react';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { useStoreData } from '../../context/StoreDataContext';
import { formatCurrency, generateReceiptNumber } from '../../utils/formatters';
import { sounds } from '../../utils/audio';
import { db } from '../../db';
import type { PaymentMethod, Sale } from '../../types';
import { 
  Banknote, 
  CreditCard, 
  Smartphone, 
  X, 
  CheckCircle2 
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleCompleted: (completedSale: Sale) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onSaleCompleted,
}) => {
  const { cartItems, grandTotal, subtotal, discountTotal, taxAmount, totalCost, estimatedProfit, clearCart } = useCart();
  const { settings } = useSettings();
  const { createSale } = useStoreData();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [tenderedStr, setTenderedStr] = useState<string>('');
  const [customerNote, setCustomerNote] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Suggested Cash Tender Amounts
  const cashSuggestions = useMemo(() => {
    const total = grandTotal;
    const suggestions: number[] = [total]; // Exact amount

    const roundedUp5 = Math.ceil(total / 5) * 5;
    const roundedUp10 = Math.ceil(total / 10) * 10;
    const roundedUp20 = Math.ceil(total / 20) * 20;
    const roundedUp50 = Math.ceil(total / 50) * 50;
    const roundedUp100 = Math.ceil(total / 100) * 100;

    [roundedUp5, roundedUp10, roundedUp20, roundedUp50, roundedUp100].forEach((amt) => {
      if (amt > total && !suggestions.includes(amt)) {
        suggestions.push(amt);
      }
    });

    return suggestions.slice(0, 5);
  }, [grandTotal]);

  const tenderedAmount = paymentMethod === 'cash' ? (parseFloat(tenderedStr) || 0) : grandTotal;
  const changeDue = Math.max(0, tenderedAmount - grandTotal);
  const remainingDue = Math.max(0, grandTotal - tenderedAmount);
  const canComplete = paymentMethod !== 'cash' || tenderedAmount >= grandTotal;

  if (!isOpen) return null;

  const handleCompleteSale = async () => {
    if (!canComplete || isProcessing || cartItems.length === 0) return;

    setIsProcessing(true);
    try {
      const receiptNumber = generateReceiptNumber();
      const now = new Date().toISOString();

      const sale: Sale = {
        id: `sale-${Date.now()}`,
        receiptNumber,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          barcode: item.product.barcode,
          unit: item.product.unit,
          costPrice: item.product.costPrice,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          discount: item.discount,
          total: item.total,
          profit: Number(((item.unitPrice * item.quantity) - (item.product.costPrice * item.quantity)).toFixed(2)),
        })),
        subtotal,
        discount: discountTotal,
        tax: taxAmount,
        total: grandTotal,
        totalCost,
        profit: estimatedProfit,
        paymentMethod,
        amountTendered: paymentMethod === 'cash' ? tenderedAmount : grandTotal,
        changeGiven: paymentMethod === 'cash' ? changeDue : 0,
        customerNote: customerNote.trim() || undefined,
        status: 'completed',
        timestamp: now,
      };

      // Atomic sale checkout on central SQLite backend (updates product stock & writes stock log)
      await createSale(sale);

      // Also mirror locally in Dexie for offline resilience
      try {
        await db.sales.add(sale);
      } catch {
        // Ignore
      }

      sounds.playSuccessChime();
      clearCart();
      onSaleCompleted(sale);
      onClose();
    } catch (err) {
      console.error('Failed to finalize sale:', err);
      sounds.playErrorTone();
      alert('An error occurred while saving the sale. Please check storage.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Checkout & Payment</h3>
            <p className="text-xs text-slate-500">
              Total to pay: <strong className="text-emerald-700 text-sm">{formatCurrency(grandTotal, settings.currencySymbol)}</strong> ({cartItems.length} line items)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('cash');
                  if (!tenderedStr) setTenderedStr(grandTotal.toString());
                }}
                className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition cursor-pointer select-none ${
                  paymentMethod === 'cash'
                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-800 font-semibold shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <Banknote className="w-6 h-6 mb-1 text-emerald-600" />
                <span className="text-sm">Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition cursor-pointer select-none ${
                  paymentMethod === 'card'
                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-800 font-semibold shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <CreditCard className="w-6 h-6 mb-1 text-blue-600" />
                <span className="text-sm">Card Terminal</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('mobile_transfer')}
                className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition cursor-pointer select-none ${
                  paymentMethod === 'mobile_transfer'
                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-800 font-semibold shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <Smartphone className="w-6 h-6 mb-1 text-purple-600" />
                <span className="text-sm">Mobile / Transfer</span>
              </button>
            </div>
          </div>

          {/* Cash Calculations */}
          {paymentMethod === 'cash' ? (
            <div className="space-y-4 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Cash Amount Tendered ({settings.currencySymbol})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    autoFocus
                    placeholder="0.00"
                    value={tenderedStr}
                    onChange={(e) => setTenderedStr(e.target.value)}
                    className="w-full text-center text-3xl font-bold py-2.5 px-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900"
                  />
                </div>
              </div>

              {/* Quick Cash Presets */}
              <div className="flex flex-wrap gap-2">
                {cashSuggestions.map((amt, idx) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTenderedStr(amt.toString())}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                      tenderedAmount === amt
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {idx === 0 ? 'Exact ' : ''}{formatCurrency(amt, settings.currencySymbol)}
                  </button>
                ))}
              </div>

              {/* Change Due Box */}
              <div className={`p-4 rounded-xl border transition-all ${
                changeDue > 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : remainingDue > 0
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-slate-100 border-slate-200 text-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {changeDue > 0 ? 'Change Due to Customer:' : remainingDue > 0 ? 'Remaining Amount Needed:' : 'Exact Tender Received:'}
                  </span>
                  <span className={`text-2xl font-black ${
                    changeDue > 0 ? 'text-emerald-700' : remainingDue > 0 ? 'text-rose-600' : 'text-slate-800'
                  }`}>
                    {formatCurrency(changeDue > 0 ? changeDue : remainingDue, settings.currencySymbol)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl">
                {paymentMethod === 'card' ? <CreditCard className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
              </div>
              <div className="text-xs text-blue-900">
                <p className="font-semibold text-sm">
                  {paymentMethod === 'card' ? 'Ready for Card Swipe / Tap / Chip' : 'Verify Mobile Transfer / QR Payment'}
                </p>
                <p className="text-blue-700 mt-0.5">
                  Confirm the transaction for <strong>{formatCurrency(grandTotal, settings.currencySymbol)}</strong> on your payment terminal.
                </p>
              </div>
            </div>
          )}

          {/* Customer Note (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Receipt / Customer Note (Optional)
            </label>
            <input
              type="text"
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder="e.g. Regular customer, delivery order #..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-100"
          >
            Back to Cart
          </button>

          <button
            type="button"
            disabled={!canComplete || isProcessing}
            onClick={handleCompleteSale}
            className="flex-1 py-3 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>
              {isProcessing ? 'Saving Transaction...' : `Complete Sale (${formatCurrency(grandTotal, settings.currencySymbol)})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
