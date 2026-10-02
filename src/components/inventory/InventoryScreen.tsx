import React, { useState, useMemo } from 'react';
import { useStoreData } from '../../context/StoreDataContext';
import type { Product } from '../../types';
import { GROCERY_CATEGORIES } from '../../db/initialData';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency, formatUnitQuantity, formatDateOnly, getDaysUntilExpiry } from '../../utils/formatters';
import { exportInventoryCSV } from '../../db/backupService';

import { ProductFormModal } from './ProductFormModal';
import { RestockModal } from './RestockModal';
import { SpoilageModal } from './SpoilageModal';
import { ExpiryTrackerWidget } from './ExpiryTrackerWidget';

import {
  Package,
  Plus,
  Truck,
  Trash2,
  FileSpreadsheet,
  Search,
  AlertTriangle,
  Clock,
  Edit2,
  DollarSign
} from 'lucide-react';

export const InventoryScreen: React.FC = () => {
  const { settings } = useSettings();
  const { products, deleteProduct } = useStoreData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterTab, setFilterTab] = useState<'all' | 'low_stock' | 'expiring' | 'out_of_stock'>('all');

  // Modals state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [spoilageProduct, setSpoilageProduct] = useState<Product | null>(null);
  const [isSpoilageOpen, setIsSpoilageOpen] = useState(false);

  // Computed metrics
  const totalStockRetailVal = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.stockQuantity * p.sellingPrice), 0);
  }, [products]);

  const totalStockCostVal = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.stockQuantity * p.costPrice), 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stockQuantity <= p.minStockThreshold && p.stockQuantity > 0).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter((p) => p.stockQuantity <= 0).length;
  }, [products]);

  const expiringCount = useMemo(() => {
    return products.filter((p) => {
      if (!p.isPerishable || !p.expiryDate) return false;
      const days = getDaysUntilExpiry(p.expiryDate);
      return days !== null && days <= (settings.lowStockAlertDays || 7) && p.stockQuantity > 0;
    }).length;
  }, [products, settings.lowStockAlertDays]);

  // Filtered List
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'all' && p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Tab filter
      if (filterTab === 'low_stock' && !(p.stockQuantity <= p.minStockThreshold && p.stockQuantity > 0)) {
        return false;
      }
      if (filterTab === 'out_of_stock' && p.stockQuantity > 0) {
        return false;
      }
      if (filterTab === 'expiring') {
        const days = getDaysUntilExpiry(p.expiryDate);
        if (days === null || days > (settings.lowStockAlertDays || 7)) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          p.name.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [products, selectedCategory, filterTab, searchQuery, settings.lowStockAlertDays]);

  const handleDeleteProduct = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}" from inventory?`)) {
      try {
        await deleteProduct(id);
      } catch (err: any) {
        alert(err.message || 'Failed to delete product.');
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 p-4 sm:p-6 space-y-5">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total SKUs</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{products.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Active grocery items</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Low / Out of Stock</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-amber-600">{lowStockCount}</p>
            {outOfStockCount > 0 && (
              <span className="text-xs font-bold text-rose-600">({outOfStockCount} out)</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Needs reordering</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Expiring Perishables</span>
            <Clock className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-orange-600">{expiringCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Within {settings.lowStockAlertDays || 7} days</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Stock Retail Value</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
            {formatCurrency(totalStockRetailVal, settings.currencySymbol)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
            Cost: {formatCurrency(totalStockCostVal, settings.currencySymbol)}
          </p>
        </div>
      </div>

      {/* Perishables Expiry Alert Banner */}
      <ExpiryTrackerWidget
        products={products}
        onSelectProduct={(p) => {
          setEditingProduct(p);
          setIsProductFormOpen(true);
        }}
        onLogSpoilage={(p) => {
          setSpoilageProduct(p);
          setIsSpoilageOpen(true);
        }}
      />

      {/* Toolbar & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product by name, barcode, or SKU..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsProductFormOpen(true);
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>

            <button
              onClick={() => {
                setRestockProduct(null);
                setIsRestockOpen(true);
              }}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold border border-blue-200 transition cursor-pointer flex items-center gap-1.5"
            >
              <Truck className="w-4 h-4" /> Restock
            </button>

            <button
              onClick={() => {
                setSpoilageProduct(null);
                setIsSpoilageOpen(true);
              }}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold border border-rose-200 transition cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" /> Spoilage
            </button>

            <button
              onClick={exportInventoryCSV}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
              title="Download Excel / CSV spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
            </button>
          </div>
        </div>

        {/* Filter Tabs & Category Dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterTab === 'all'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              All ({products.length})
            </button>
            <button
              onClick={() => setFilterTab('low_stock')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterTab === 'low_stock'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Low Stock ({lowStockCount})
            </button>
            <button
              onClick={() => setFilterTab('expiring')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterTab === 'expiring'
                  ? 'bg-orange-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Expiring Soon ({expiringCount})
            </button>
            <button
              onClick={() => setFilterTab('out_of_stock')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterTab === 'out_of_stock'
                  ? 'bg-rose-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Out of Stock ({outOfStockCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none"
            >
              <option value="all">All Categories</option>
              {GROCERY_CATEGORIES.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/90 text-slate-500 font-semibold sticky top-0 border-b border-slate-200 z-10">
              <tr>
                <th className="py-3 px-4">Item & Code</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Wholesale Cost</th>
                <th className="py-3 px-3">Retail Price</th>
                <th className="py-3 px-3">Margin</th>
                <th className="py-3 px-3">In-Stock</th>
                <th className="py-3 px-3">Shelf Life</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No products matched current filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const margin = p.sellingPrice > 0 ? (((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100).toFixed(0) : '0';
                  const daysLeft = getDaysUntilExpiry(p.expiryDate);
                  const isLow = p.stockQuantity <= p.minStockThreshold && p.stockQuantity > 0;
                  const isOut = p.stockQuantity <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                        <p className="font-mono text-[11px] text-slate-400">
                          {p.barcode || p.sku}
                        </p>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                          {p.category}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-600">
                        {formatCurrency(p.costPrice, settings.currencySymbol)}
                        <span className="text-[10px] text-slate-400">/{p.unit}</span>
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {formatCurrency(p.sellingPrice, settings.currencySymbol)}
                        <span className="text-[10px] text-slate-400 font-normal">/{p.unit}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-emerald-700">{margin}%</span>
                      </td>

                      <td className="py-3 px-3">
                        {isOut ? (
                          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-rose-100 text-rose-700">
                            0 (Out of stock)
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-amber-100 text-amber-800">
                            {formatUnitQuantity(p.stockQuantity, p.unit)} (Low)
                          </span>
                        ) : (
                          <span className="font-medium text-slate-800">
                            {formatUnitQuantity(p.stockQuantity, p.unit)}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-[11px]">
                        {p.isPerishable && p.expiryDate ? (
                          daysLeft !== null && daysLeft < 0 ? (
                            <span className="font-bold text-rose-600">Expired ({formatDateOnly(p.expiryDate)})</span>
                          ) : daysLeft !== null && daysLeft <= 3 ? (
                            <span className="font-bold text-amber-700">{daysLeft}d left ({formatDateOnly(p.expiryDate)})</span>
                          ) : (
                            <span className="text-slate-600">{formatDateOnly(p.expiryDate)}</span>
                          )
                        ) : (
                          <span className="text-slate-400">Shelf-stable</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setRestockProduct(p);
                              setIsRestockOpen(true);
                            }}
                            title="Restock"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Truck className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setIsProductFormOpen(true);
                            }}
                            title="Edit"
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            title="Delete"
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ProductFormModal
        product={editingProduct}
        isOpen={isProductFormOpen}
        onClose={() => setIsProductFormOpen(false)}
      />

      <RestockModal
        product={restockProduct}
        productsList={products}
        isOpen={isRestockOpen}
        onClose={() => setIsRestockOpen(false)}
      />

      <SpoilageModal
        product={spoilageProduct}
        productsList={products}
        isOpen={isSpoilageOpen}
        onClose={() => setIsSpoilageOpen(false)}
      />
    </div>
  );
};
