import React from 'react';
import type { Sale } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { Printer, X, CheckCircle } from 'lucide-react';


interface ReceiptModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  sale,
  isOpen,
  onClose,
}) => {
  const { settings } = useSettings();

  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Sale Completed!</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Thermal Receipt Container */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100/60 flex justify-center">
          <div
            id="printable-receipt"
            className="w-full max-w-[340px] bg-white p-6 shadow-sm border border-slate-200/70 rounded-xl text-slate-800 font-mono text-xs leading-relaxed"
          >
            {/* Header */}
            <div className="text-center pb-4 border-b border-dashed border-slate-300">
              <h2 className="text-base font-bold tracking-tight text-slate-900 font-sans">
                {settings.storeName}
              </h2>
              {settings.storeAddress && (
                <p className="text-[11px] text-slate-600 mt-0.5">{settings.storeAddress}</p>
              )}
              {settings.storePhone && (
                <p className="text-[11px] text-slate-600">Tel: {settings.storePhone}</p>
              )}
              {settings.receiptHeader && (
                <p className="text-[10px] text-slate-500 italic mt-1">{settings.receiptHeader}</p>
              )}
            </div>

            {/* Receipt Meta */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt #:</span>
                <span className="font-semibold">{sale.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date/Time:</span>
                <span>{formatDateTime(sale.timestamp)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment:</span>
                <span className="capitalize font-medium">{sale.paymentMethod.replace('_', ' ')}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-3 border-b border-dashed border-slate-300">
              <div className="flex justify-between text-[11px] font-bold text-slate-700 pb-1 border-b border-slate-200 mb-2">
                <span>Item</span>
                <span>Total</span>
              </div>

              <div className="space-y-2">
                {sale.items.map((item, idx) => (
                  <div key={idx} className="text-[11px]">
                    <div className="flex justify-between font-medium">
                      <span className="truncate pr-2">{item.name}</span>
                      <span className="shrink-0">{formatCurrency(item.total, settings.currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 pl-1">
                      <span>
                        {item.quantity} {item.unit} @ {formatCurrency(item.unitPrice, settings.currencySymbol)}
                        {item.discount > 0 && ` (-${formatCurrency(item.discount, settings.currencySymbol)})`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal:</span>
                <span>{formatCurrency(sale.subtotal, settings.currencySymbol)}</span>
              </div>

              {sale.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discount:</span>
                  <span>-{formatCurrency(sale.discount, settings.currencySymbol)}</span>
                </div>
              )}

              {sale.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Tax ({settings.taxRate}%):</span>
                  <span>{formatCurrency(sale.tax, settings.currencySymbol)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>TOTAL:</span>
                <span>{formatCurrency(sale.total, settings.currencySymbol)}</span>
              </div>

              {sale.paymentMethod === 'cash' && (
                <>
                  <div className="flex justify-between text-[10px] text-slate-600 pt-1">
                    <span>Cash Tendered:</span>
                    <span>{formatCurrency(sale.amountTendered, settings.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-900 font-bold">
                    <span>Change Given:</span>
                    <span>{formatCurrency(sale.changeGiven, settings.currencySymbol)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="text-center pt-4 text-[10px] text-slate-500 space-y-1">
              <p>{settings.receiptFooter || 'Thank you for shopping local!'}</p>
              <p className="text-[9px] text-slate-400">Powered by Local Grocery POS</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
          >
            Done (New Sale)
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> Print Thermal Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
