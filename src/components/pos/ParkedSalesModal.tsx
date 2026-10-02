import React from 'react';
import type { ParkedSale } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { useSettings } from '../../context/SettingsContext';
import { db } from '../../db';
import { ShoppingCart, Play, Trash2, X, Clock } from 'lucide-react';

interface ParkedSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  parkedSales: ParkedSale[];
  onResume: (id: string) => void;
}

export const ParkedSalesModal: React.FC<ParkedSalesModalProps> = ({
  isOpen,
  onClose,
  parkedSales,
  onResume,
}) => {
  const { settings } = useSettings();

  if (!isOpen) return null;

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Discard this held cart?')) {
      await db.parkedSales.delete(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Parked / Held Carts</h3>
              <p className="text-xs text-slate-500">{parkedSales.length} cart(s) on hold</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {parkedSales.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No parked carts.</p>
              <p className="text-xs mt-1">You can park carts from the register when customers step aside.</p>
            </div>
          ) : (
            parkedSales.map((sale) => {
              const totalAmount = sale.items.reduce((acc, item) => acc + item.total, 0);
              const totalItems = sale.items.reduce((acc, item) => acc + item.quantity, 0);

              return (
                <div
                  key={sale.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500/60 bg-white hover:bg-emerald-50/20 transition flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-800 text-sm truncate">{sale.label}</h4>
                      <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {totalItems} items
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Parked at: {formatDateTime(sale.timestamp)}
                    </p>
                    <p className="text-sm font-bold text-emerald-700 mt-1">
                      {formatCurrency(totalAmount, settings.currencySymbol)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => handleDelete(sale.id, e)}
                      title="Discard cart"
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        onResume(sale.id);
                        onClose();
                      }}
                      className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Resume
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
