# 🛒 Grocery POS, Inventory & Expense Tracker

A lightweight, modern, touch-friendly, and **100% offline-first** Point of Sale (POS), Inventory Management, and Expense Tracking system built specifically for small grocery shops, minimarts, and convenience stores.

![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?logo=tailwind-css&logoColor=white)
![Dexie.js](https://img.shields.io/badge/IndexedDB-Dexie.js-FFA500?logoColor=white)
![Offline First](https://img.shields.io/badge/Offline-100%25_Reliable-success)

---

## 🌟 Overview

Small grocery stores have unique daily operational requirements:
- **Fast counter checkout** with minimal clicks and zero latency.
- **Produce & weighted sales** (selling packaged items by count and fruits/vegetables by weight in `kg` or `g`).
- **Perishables & spoilage tracking** (monitoring expiration dates on milk, bread, produce, and logging damaged goods).
- **Expense tracking & true Net Profit** (factoring in shop overhead like electricity/cold storage, store lease, wages, and vendor restocks alongside sales).
- **Zero-downtime offline reliability** (the cash register must keep running seamlessly even if internet or Wi-Fi drops).

This app runs locally in the browser with **Dexie.js (IndexedDB)**—meaning no monthly cloud database subscription, complete data privacy, and instant response times.

---

## ✨ Key Features

### 1. 🛒 POS Cash Register
- **Dual Barcode Scanning**:
  - **USB & Bluetooth Handheld Barcode Guns**: Automatic keyboard-wedge detection for instant item addition.
  - **Built-in Device Camera / Webcam Scanner**: High-speed scanner with targeting reticle, flashlight/torch toggle, and continuous scanning mode.
- **Produce Weighing & Fractional Quantities**:
  - Easily weigh and ring up goods sold by `kg` or `g` (e.g., 0.85 kg bananas @ $1.89/kg = $1.61).
  - Quick weight preset buttons (`0.25`, `0.5`, `1.0`, `1.5`, `2.0`, `2.5`, `3.0`, `5.0 kg`).
- **Cart & Order Actions**:
  - **Park / Hold Cart**: Cashiers can hold an active sale when a customer steps aside to grab another item and retrieve it anytime.
  - Line-item quantity steppers, item discounts, and overall order discounts.
  - Real-time estimated gross profit margin preview for the cashier.
- **Fast Checkout & Change Calculator**:
  - Payment modes: **Cash**, **Card Terminal**, and **Mobile / Bank Transfer**.
  - Suggested cash tender buttons (`Exact`, `$5`, `$10`, `$20`, `$50`, `$100`).
  - Prominent **Change Due** display in high-visibility green to eliminate mental arithmetic mistakes.
  - Synthesized Web Audio API sound effects (scan beep, cart click, success chime).
- **Thermal Receipt Printing**:
  - Clean receipt format tailored for standard **80mm & 58mm thermal receipt paper rolls**.
  - Direct browser print dialog integration (`@media print`) that automatically formats receipts and hides UI controls.

### 2. 📦 Inventory & Shelf-Life Management
- **Perishables Shelf-Life Monitor**:
  - Automatic expiry warnings: Critical red alert for expired items, orange warning for items expiring within 3 days, and yellow for items within 7 days.
  - One-click shortcuts to write off spoiled stock or discount items.
- **Product Catalog**:
  - Tracks Name, Barcode/UPC, SKU, Category, Unit (`pcs`, `kg`, `g`, `pack`, `litre`, `box`), Wholesale Cost, Retail Selling Price, and Min Stock Alert Threshold.
  - Real-time Gross Margin % and Profit per Unit preview while adding/editing products.
  - Built-in automatic SKU and Barcode generator.
- **Restock Deliveries with Automated Expense Logging**:
  - Log incoming supplier deliveries with updated cost prices.
  - **Automated Expense Recording**: Checkbox automatically creates a matching entry in the Expense Tracker under *Inventory Restock*, eliminating double-entry bookkeeping.
- **Spoilage & Food Waste Write-Offs**:
  - Log damaged produce, expired items, or broken containers with specific reasons.
  - Automatically writes off inventory stock and records the loss in the financial reports.

### 3. 💳 Operating Expense Tracker
- **Grocery-Specific Expense Categories**:
  - 🚚 *Inventory & Supplier Purchases*
  - 🏢 *Store Rent & Lease*
  - ⚡ *Electricity, Cooling & Refrigeration* (crucial for grocery cold displays)
  - 👥 *Staff & Cashier Wages*
  - 🛍️ *Bags & Packaging Materials*
  - ⚠️ *Food Spoilage & Damaged Goods*
  - 🔧 *Equipment Maintenance & Repairs*
  - 📋 *Other Operating Expenses*
- **Filtering & Insights**:
  - Filter by date range: *Today*, *This Week*, *This Month*, or *All Time*.
  - Category distribution breakdown showing spending percentages.

### 4. 📊 Financial Performance & Real-Time P&L
- **True Net Profit Statement**:
  $$\text{Net Profit} = \text{Gross Sales (Revenue)} - \text{Cost of Goods Sold (COGS)} - \text{Operating Expenses}$$
- **Register Shift Reconciliation**:
  - Cash collected in drawer vs. Card terminal payments vs. Mobile transfers.
  - Total order count and average customer basket size.
- **Top-Selling Grocery Items**:
  - Ranked by revenue, unit volume, and profit contribution.

### 5. 🛡️ Data Safety, Offline Reliability & Backups
- **100% Offline-First**: Operates seamlessly without internet connection; data is stored securely in the browser's IndexedDB.
- **One-Click JSON Database Backup & Restore**:
  - Download full database snapshot (`grocery_backup_YYYY-MM-DD.json`).
  - Restore backup with automatic schema verification and error checking.
- **Spreadsheet CSV Exports**:
  - Export **Inventory Catalog CSV** (opens in Microsoft Excel or Google Sheets).
  - Export **Sales Receipts CSV**.
  - Export **Expense Records CSV**.
- **First-Time Setup Onboarding**:
  - Automatically guides the user on first launch to configure their store name, currency symbol, and tax rate.

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React 19** | Modern UI components and reactive state |
| **TypeScript** | Strict type safety and data models |
| **Vite 8** | High-speed frontend build tooling and HMR |
| **Tailwind CSS v4** | Clean, responsive POS styling with receipt print styles |
| **Dexie.js** | IndexedDB wrapper for local, relational client-side storage |
| **@zxing/browser** | Real-time camera barcode and QR decoding |
| **Lucide React** | Clean, accessible iconography |
| **Web Audio API** | Native synthesized audio beeps and checkout chimes |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0 or newer recommended)
- `npm` (version 9.0 or newer)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/grocery-pos-inventory-app.git
   cd grocery-pos-inventory-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to the local URL displayed in the terminal (typically `http://localhost:5173`).

---

## 💻 Available Scripts

- **`npm run dev`**: Starts Vite development server with Hot Module Replacement (HMR).
- **`npm run build`**: Runs TypeScript compilation (`tsc -b`) and bundles production assets into `dist/`.
- **`npm run preview`**: Serves the production build locally for testing.

---

## 📖 Quick Usage Guide

### First-Time Launch
1. When you first open the app, the **Welcome Setup Wizard** appears.
2. Enter your **Shop Name**, **Address**, and **Phone Number**.
3. Choose your preferred **Currency Symbol** (e.g. `$`, `€`, `£`, `₹`, `₦`, `R`, etc.).
4. Set your optional **Sales Tax / VAT** percentage and click **Complete Setup**.

### Operating the POS Register
1. **Adding Items**:
   - Tap any product card from the catalog grid, or
   - Scan a barcode with a USB barcode gun, or
   - Click **Camera Scan** to scan barcodes using your phone, tablet, or laptop camera.
2. **Weighing Produce**: For items measured in `kg` or `g`, a weight popup will appear allowing you to enter the exact weight or pick a quick preset.
3. **Parked Sales**: If a customer steps aside, click **Hold** to park the cart. You can ring up other customers and click the pause icon to resume the parked order at any time.
4. **Checkout**: Click **Pay / Checkout**, choose the payment method (Cash, Card, or Mobile), click a quick-cash preset button, observe the calculated change, and complete the sale.
5. **Print Receipt**: Click **Print Thermal Receipt** to send the formatted receipt to your printer.

### Inventory & Stock Control
1. Go to the **Inventory & Stock** tab to view all active items.
2. Click **+ Add Product** to add a new grocery item with wholesale cost and retail price (profit margin is calculated live).
3. Check the **Perishables Shelf-Life Monitor** at the top for goods approaching their expiration date.
4. Use **Restock** to log incoming supplier deliveries and optionally record the expense automatically.
5. Use **Spoilage** to write off expired or damaged food items.

### Backups & Data Export
1. Go to **Settings & Backup**.
2. Click **Export Full JSON Backup** to save a snapshot of your database to your downloads folder.
3. Use the **CSV Export** buttons to export your inventory, sales, or expenses to spreadsheets.

---

## 🖨️ Hardware & Scanner Compatibility

- **Barcode Scanners**:
  - Standard USB or Bluetooth handheld barcode scanners (acts as a keyboard wedge).
  - Any built-in camera or USB webcam on Android tablets, iPads, Windows laptops, and phones.
- **Receipt Printers**:
  - Any 58mm or 80mm thermal receipt printer supported by your operating system.
  - Standard desktop printers (Letter/A4).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
