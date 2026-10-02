import React, { createContext, useContext, useState, useMemo } from 'react';
import type { CartItem, Product, ParkedSale } from '../types';
import { useSettings } from './SettingsContext';
import { api } from '../services/api';
import { db } from '../db';
import { sounds } from '../utils/audio';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemDiscount: (productId: string, discount: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  overallDiscount: number;
  setOverallDiscount: (discount: number) => void;
  parkCurrentSale: (label?: string) => Promise<void>;
  resumeParkedSale: (parkedSaleId: string) => Promise<void>;
  // Calculations
  subtotal: number;
  discountTotal: number;
  taxAmount: number;
  grandTotal: number;
  totalCost: number;
  estimatedProfit: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const { settings } = useSettings();

  const addToCart = (product: Product, quantity = 1) => {
    sounds.playAddBeep();
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const next = [...prev];
        const currentItem = next[existingIndex];
        const newQty = currentItem.quantity + quantity;
        const total = (currentItem.unitPrice * newQty) - currentItem.discount;
        next[existingIndex] = {
          ...currentItem,
          quantity: Number(newQty.toFixed(3)),
          total: Math.max(0, Number(total.toFixed(2))),
        };
        return next;
      } else {
        const total = (product.sellingPrice * quantity);
        return [
          ...prev,
          {
            product,
            quantity: Number(quantity.toFixed(3)),
            unitPrice: product.sellingPrice,
            discount: 0,
            total: Number(total.toFixed(2)),
          },
        ];
      }
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const total = (item.unitPrice * quantity) - item.discount;
          return {
            ...item,
            quantity: Number(quantity.toFixed(3)),
            total: Math.max(0, Number(total.toFixed(2))),
          };
        }
        return item;
      })
    );
  };

  const updateItemDiscount = (productId: string, discount: number) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const safeDiscount = Math.max(0, discount);
          const total = (item.unitPrice * item.quantity) - safeDiscount;
          return {
            ...item,
            discount: safeDiscount,
            total: Math.max(0, Number(total.toFixed(2))),
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
    setOverallDiscount(0);
  };

  const parkCurrentSale = async (customLabel?: string) => {
    if (cartItems.length === 0) return;
    const count = cartItems.reduce((acc, i) => acc + i.quantity, 0);
    const label = customLabel || `Order (${count} items) - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    
    const parked: ParkedSale = {
      id: `parked-${Date.now()}`,
      label,
      items: cartItems,
      timestamp: new Date().toISOString(),
    };

    try {
      await api.parkSale(parked);
    } catch {
      await db.parkedSales.add(parked);
    }
    clearCart();
  };

  const resumeParkedSale = async (parkedSaleId: string) => {
    try {
      const list = await api.getParkedSales();
      const match = list.find((p) => p.id === parkedSaleId);
      if (match) {
        setCartItems(match.items);
        await api.deleteParkedSale(parkedSaleId);
        return;
      }
    } catch {
      // Fallback
    }

    const parked = await db.parkedSales.get(parkedSaleId);
    if (!parked) return;
    setCartItems(parked.items);
    await db.parkedSales.delete(parkedSaleId);
  };

  // Financial Computations
  const { subtotal, discountTotal, taxAmount, grandTotal, totalCost, estimatedProfit, itemCount } = useMemo(() => {
    let rawSubtotal = 0;
    let itemsDiscount = 0;
    let cogs = 0;
    let totalItems = 0;

    cartItems.forEach((item) => {
      rawSubtotal += item.unitPrice * item.quantity;
      itemsDiscount += item.discount;
      cogs += item.product.costPrice * item.quantity;
      totalItems += item.quantity;
    });

    const totalDisc = itemsDiscount + overallDiscount;
    const taxableSubtotal = Math.max(0, rawSubtotal - totalDisc);

    let tax = 0;
    if (settings.taxRate > 0) {
      if (settings.taxInclusive) {
        // Tax is already built into the price
        tax = taxableSubtotal - (taxableSubtotal / (1 + settings.taxRate / 100));
      } else {
        // Tax is added on top
        tax = (taxableSubtotal * settings.taxRate) / 100;
      }
    }

    const finalGrandTotal = settings.taxInclusive ? taxableSubtotal : (taxableSubtotal + tax);
    const profit = Math.max(0, taxableSubtotal - cogs);

    return {
      subtotal: Number(rawSubtotal.toFixed(2)),
      discountTotal: Number(totalDisc.toFixed(2)),
      taxAmount: Number(tax.toFixed(2)),
      grandTotal: Number(finalGrandTotal.toFixed(2)),
      totalCost: Number(cogs.toFixed(2)),
      estimatedProfit: Number(profit.toFixed(2)),
      itemCount: Number(totalItems.toFixed(2)),
    };
  }, [cartItems, overallDiscount, settings.taxRate, settings.taxInclusive]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        updateItemDiscount,
        removeFromCart,
        clearCart,
        overallDiscount,
        setOverallDiscount,
        parkCurrentSale,
        resumeParkedSale,
        subtotal,
        discountTotal,
        taxAmount,
        grandTotal,
        totalCost,
        estimatedProfit,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
