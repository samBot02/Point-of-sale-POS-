import React, { useState, useMemo } from 'react';
import { useStoreData } from '../../context/StoreDataContext';
import type { Product, Sale } from '../../types';
import { GROCERY_CATEGORIES } from '../../db/initialData';
import { useCart } from '../../context/CartContext';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import { sounds } from '../../utils/audio';

import { ProductCard } from './ProductCard';
import { CartSidebar } from './CartSidebar';
import { WeightModal } from './WeightModal';
import { CheckoutModal } from './CheckoutModal';
import { ReceiptModal } from './ReceiptModal';
import { ParkedSalesModal } from './ParkedSalesModal';
import { CameraScannerModal } from './CameraScannerModal';

import { 
  Search, 
  Camera, 
  Barcode, 
  ShoppingBag
} from 'lucide-react';

export const PosScreen: React.FC = () => {
  const { addToCart, resumeParkedSale } = useCart();
  const { products, parkedSales } = useStoreData();

  // Local UI State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals state
  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [isParkedOpen, setIsParkedOpen] = useState<boolean>(false);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [scanNotification, setScanNotification] = useState<string | null>(null);

  // Common Barcode Lookup Handler (used by USB scanner & Camera scanner)
  const handleBarcodeScanned = (scannedCode: string) => {
    const code = scannedCode.trim();
    if (!code) return;

    const match = products.find(
      (p) => p.barcode === code || p.sku.toLowerCase() === code.toLowerCase()
    );

    if (match) {
      if (match.stockQuantity <= 0) {
        sounds.playErrorTone();
        showScanNotice(`"${match.name}" is OUT OF STOCK!`, true);
        return;
      }

      // If produce by kg, prompt for weight
      if (match.unit === 'kg' || match.unit === 'g') {
        setWeightModalProduct(match);
      } else {
        addToCart(match, 1);
        showScanNotice(`Added "${match.name}" to cart`);
      }
    } else {
      sounds.playErrorTone();
      showScanNotice(`No product found for code: "${code}"`, true);
    }
  };

  const showScanNotice = (msg: string, _isError = false) => {

    setScanNotification(msg);
    setTimeout(() => {
      setScanNotification(null);
    }, 2800);
  };

  // Keyboard Wedge Scanner Hook for physical barcode guns
  useBarcodeScanner({
    onScan: handleBarcodeScanned,
  });

  // Handle Product Card Click
  const handleProductClick = (product: Product) => {
    if (product.unit === 'kg' || product.unit === 'g') {
      setWeightModalProduct(product);
    } else {
      addToCart(product, 1);
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        selectedCategory === 'all' ||
        p.category.toLowerCase() === selectedCategory.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q);

      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-slate-50 relative">
      {/* Notification Toast for Scans */}
      {scanNotification && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="bg-slate-900/90 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-xl backdrop-blur flex items-center gap-2 border border-slate-700">
            <Barcode className="w-4 h-4 text-emerald-400" />
            <span>{scanNotification}</span>
          </div>
        </div>
      )}

      {/* LEFT: Catalog & Filter Pane */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Search & Camera Toolbar */}
        <div className="p-3 bg-white border-b border-slate-200/80 flex items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search grocery item by name, barcode, or SKU..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Camera Scanner Trigger */}
          <button
            onClick={() => setIsCameraOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold border border-emerald-200 transition cursor-pointer shrink-0"
            title="Scan with Camera / Webcam"
          >
            <Camera className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Camera Scan</span>
          </button>
        </div>

        {/* Category Pills Bar */}
        <div className="bg-white px-3 py-2 border-b border-slate-200/80 overflow-x-auto flex items-center gap-1.5 no-scrollbar shrink-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            All Items ({products.length})
          </button>

          {GROCERY_CATEGORIES.map((cat) => {
            const count = products.filter((p) => p.category.toLowerCase() === cat.name.toLowerCase()).length;
            const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Product Grid Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-400">
              <ShoppingBag className="w-12 h-12 text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600 text-sm">No grocery items found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                {searchQuery
                  ? `No products matched "${searchQuery}". Try a different keyword or barcode.`
                  : 'Add products in the Inventory tab to start selling.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={handleProductClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: POS Cart Sidebar */}
      <div className="w-full lg:w-96 h-80 lg:h-full shrink-0">
        <CartSidebar
          onOpenCheckout={() => setIsCheckoutOpen(true)}
          onOpenParked={() => setIsParkedOpen(true)}
          parkedCount={parkedSales.length}
        />
      </div>

      {/* MODALS */}
      <WeightModal
        product={weightModalProduct}
        isOpen={!!weightModalProduct}
        onClose={() => setWeightModalProduct(null)}
        onConfirm={(prod, qty) => addToCart(prod, qty)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSaleCompleted={(sale) => {
          setCompletedSale(sale);
          setIsReceiptOpen(true);
        }}
      />

      <ReceiptModal
        sale={completedSale}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />

      <ParkedSalesModal
        isOpen={isParkedOpen}
        onClose={() => setIsParkedOpen(false)}
        parkedSales={parkedSales}
        onResume={(id) => resumeParkedSale(id)}
      />

      <CameraScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScan={handleBarcodeScanned}
        title="Scan Barcode to Add Item"
      />
    </div>
  );
};
