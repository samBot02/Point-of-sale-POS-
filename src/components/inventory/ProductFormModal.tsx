import React, { useState, useEffect } from 'react';
import type { Product, ProductUnit } from '../../types';
import { GROCERY_CATEGORIES } from '../../db/initialData';
import { generateSKU } from '../../utils/formatters';
import { useStoreData } from '../../context/StoreDataContext';
import { db } from '../../db';
import { CameraScannerModal } from '../pos/CameraScannerModal';
import { 
  PackagePlus, 
  X, 
  Camera, 
  Sparkles, 
  Calendar 
} from 'lucide-react';

interface ProductFormModalProps {
  product: Product | null; // null if adding new
  isOpen: boolean;
  onClose: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { createProduct, updateProduct } = useStoreData();
  const isEditing = !!product;

  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Fresh Produce');
  const [unit, setUnit] = useState<ProductUnit>('pcs');
  const [costPrice, setCostPrice] = useState('1.00');
  const [sellingPrice, setSellingPrice] = useState('1.99');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [minStockThreshold, setMinStockThreshold] = useState('5');
  const [isPerishable, setIsPerishable] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');

  const [isCameraScanOpen, setIsCameraScanOpen] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setBarcode(product.barcode);
      setSku(product.sku);
      setCategory(product.category);
      setUnit(product.unit);
      setCostPrice(product.costPrice.toString());
      setSellingPrice(product.sellingPrice.toString());
      setStockQuantity(product.stockQuantity.toString());
      setMinStockThreshold(product.minStockThreshold.toString());
      setIsPerishable(product.isPerishable);
      setExpiryDate(product.expiryDate || '');
      setNotes(product.notes || '');
    } else {
      setName('');
      const defaultCat = 'Fresh Produce';
      setCategory(defaultCat);
      const generated = generateSKU(defaultCat);
      setSku(generated);
      setBarcode(generated.replace('-', ''));
      setUnit('pcs');
      setCostPrice('1.00');
      setSellingPrice('1.99');
      setStockQuantity('15');
      setMinStockThreshold('5');
      setIsPerishable(false);
      setExpiryDate('');
      setNotes('');
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  // Margin calculation
  const cPrice = parseFloat(costPrice) || 0;
  const sPrice = parseFloat(sellingPrice) || 0;
  const marginPct = sPrice > 0 ? (((sPrice - cPrice) / sPrice) * 100).toFixed(1) : '0';
  const profitPerUnit = Math.max(0, sPrice - cPrice).toFixed(2);

  const handleGenerateBarcode = () => {
    const newSku = generateSKU(category);
    setSku(newSku);
    setBarcode(newSku.replace('-', ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();

    const productData: Product = {
      id: product?.id || `prod-${Date.now()}`,
      name: name.trim(),
      barcode: barcode.trim(),
      sku: sku.trim() || barcode.trim(),
      category,
      unit,
      costPrice: parseFloat(costPrice) || 0,
      sellingPrice: parseFloat(sellingPrice) || 0,
      stockQuantity: parseFloat(stockQuantity) || 0,
      minStockThreshold: parseFloat(minStockThreshold) || 5,
      isPerishable,
      expiryDate: isPerishable && expiryDate ? expiryDate : undefined,
      notes: notes.trim() || undefined,
      createdAt: product?.createdAt || now,
      updatedAt: now,
    };

    try {
      if (isEditing) {
        await updateProduct(productData.id, productData);
      } else {
        await createProduct(productData);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save product to server.');
      return;
    }

    try {
      if (isEditing) {
        await db.products.put(productData);
      } else {
        await db.products.add(productData);
      }
    } catch {
      // Ignore
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                {isEditing ? `Edit Product: ${product.name}` : 'Add New Grocery Product'}
              </h3>
              <p className="text-xs text-slate-400">Specify pricing, barcode, inventory and shelf-life details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Organic Red Gala Apples"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          {/* Barcode & SKU Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Barcode (UPC/EAN) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCameraScanOpen(true)}
                    className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Camera className="w-3 h-3" /> Scan
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateBarcode}
                    className="text-[11px] text-slate-500 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Auto
                  </button>
                </div>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Scan or enter barcode"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SKU / Item Code</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. PRO-1002"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          {/* Category & Unit of Measure */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                {GROCERY_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as ProductUnit)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilogram (kg) - Weighed</option>
                <option value="g">Gram (g) - Weighed</option>
                <option value="pack">Pack / Bundle</option>
                <option value="litre">Litre (L)</option>
                <option value="box">Box / Carton</option>
              </select>
            </div>
          </div>

          {/* Pricing & Profit Margin Preview */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Pricing & Profit Margin
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Wholesale Cost Price</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Retail Selling Price</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-xs text-emerald-800"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 px-1">
              <span className="text-slate-500">
                Gross Margin: <strong className="text-emerald-700">{marginPct}%</strong>
              </span>
              <span className="text-slate-500">
                Profit / {unit}: <strong className="text-emerald-700">${profitPerUnit}</strong>
              </span>
            </div>
          </div>

          {/* Stock Quantities */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Stock ({unit})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Low Stock Threshold ({unit})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={minStockThreshold}
                onChange={(e) => setMinStockThreshold(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          {/* Perishables & Expiry Tracker */}
          <div className="p-4 border border-slate-200/80 rounded-2xl space-y-3 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPerishable}
                  onChange={(e) => setIsPerishable(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Perishable Item (Track Expiry Date)</span>
              </label>
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>

            {isPerishable && (
              <div className="animate-in fade-in duration-150">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Supplier</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Local Organic Farm, Shelf B4"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          {/* Submit */}
          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/20"
            >
              {isEditing ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>

      {/* Embedded Camera Scanner for Barcode Field */}
      <CameraScannerModal
        isOpen={isCameraScanOpen}
        onClose={() => setIsCameraScanOpen(false)}
        onScan={(code) => {
          setBarcode(code);
          setIsCameraScanOpen(false);
        }}
        title="Scan Barcode for Product"
      />
    </div>
  );
};
