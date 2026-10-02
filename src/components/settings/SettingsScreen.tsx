import React, { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { exportDatabaseJSON, importDatabaseJSON, exportInventoryCSV, exportSalesCSV, exportExpensesCSV } from '../../db/backupService';
import { 
  Store, 
  DollarSign, 
  Receipt, 
  ShieldCheck, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Trash2, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const { settings, updateSettings, clearAllData } = useSettings();



  const [storeName, setStoreName] = useState(settings.storeName);
  const [storeAddress, setStoreAddress] = useState(settings.storeAddress);
  const [storePhone, setStorePhone] = useState(settings.storePhone);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);
  const [currencyCode, setCurrencyCode] = useState(settings.currencyCode);
  const [taxRate, setTaxRate] = useState(settings.taxRate.toString());
  const [taxInclusive, setTaxInclusive] = useState(settings.taxInclusive);
  const [receiptHeader, setReceiptHeader] = useState(settings.receiptHeader);
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter);
  const [lowStockAlertDays, setLowStockAlertDays] = useState(settings.lowStockAlertDays.toString());

  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      storeName: storeName.trim(),
      storeAddress: storeAddress.trim(),
      storePhone: storePhone.trim(),
      currencySymbol: currencySymbol.trim() || '$',
      currencyCode: currencyCode.trim() || 'USD',
      taxRate: parseFloat(taxRate) || 0,
      taxInclusive,
      receiptHeader: receiptHeader.trim(),
      receiptFooter: receiptFooter.trim(),
      lowStockAlertDays: parseInt(lowStockAlertDays, 10) || 7,
    });

    setSaveStatus('Settings successfully saved!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (confirm('Importing this backup will restore stored products, sales, and expenses. Continue?')) {
      const result = await importDatabaseJSON(file);
      setImportStatus(result);
      setTimeout(() => setImportStatus(null), 5000);
    }
    e.target.value = '';
  };

  const handleClearAll = async () => {
    if (confirm('WARNING: Are you sure you want to delete ALL inventory, sales, and expense data? This cannot be undone!')) {
      if (confirm('Please confirm once more: All sales and inventory will be wiped.')) {
        await clearAllData();
        alert('All store data has been cleared.');
      }
    }
  };


  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="font-bold text-slate-800 text-lg">Store Settings & Data Safety</h2>
          <p className="text-xs text-slate-400">Configure business information, receipts, currencies, and backups</p>
        </div>

        {saveStatus && (
          <div className="bg-emerald-50 text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{saveStatus}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form */}
        <form onSubmit={handleSaveSettings} className="lg:col-span-2 space-y-6">
          {/* Store Profile */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-600" /> Shop Profile & Contact
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Store / Grocery Name</label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address / Street</label>
                <input
                  type="text"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Store Telephone</label>
                <input
                  type="text"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Currency & Tax */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" /> Currency & Tax Configuration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Currency Symbol</label>
                <input
                  type="text"
                  required
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  placeholder="$"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-sm text-center"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Currency Code</label>
                <input
                  type="text"
                  required
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                  placeholder="USD"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sales Tax (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="sm:col-span-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={taxInclusive}
                    onChange={(e) => setTaxInclusive(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Prices are tax-inclusive (tax is already included in product selling prices)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Receipts & Alerts */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" /> Receipt Notes & Alerts
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Receipt Header Line</label>
                <input
                  type="text"
                  value={receiptHeader}
                  onChange={(e) => setReceiptHeader(e.target.value)}
                  placeholder="Fresh produce & quality groceries"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Receipt Footer Note</label>
                <input
                  type="text"
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  placeholder="Thank you for shopping local! Please visit again."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Perishables Expiry Alert Horizon (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={lowStockAlertDays}
                  onChange={(e) => setLowStockAlertDays(e.target.value)}
                  className="w-32 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Shows shelf-life warning for items expiring within this number of days.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Save Store Settings
              </button>
            </div>
          </div>
        </form>

        {/* Right 1 Col: Data Safety & Backups */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Backup & Recovery
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              All grocery inventory, sales transactions, and expenses are stored locally in your browser storage. Download periodic backups to keep your store safe.
            </p>

            {importStatus && (
              <div className={`p-3 rounded-xl text-xs font-medium border ${
                importStatus.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {importStatus.message}
              </div>
            )}

            <div className="space-y-2.5 pt-1">
              <button
                onClick={exportDatabaseJSON}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" /> Export Full JSON Backup
              </button>

              <label className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Restore Backup from File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-xs font-semibold text-slate-600">Spreadsheet CSV Exports</span>
              <div className="flex flex-col gap-2">
                <button
                  onClick={exportInventoryCSV}
                  className="text-xs text-left px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-between transition cursor-pointer"
                >
                  <span>Inventory Catalog CSV</span>
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                </button>
                <button
                  onClick={exportSalesCSV}
                  className="text-xs text-left px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-between transition cursor-pointer"
                >
                  <span>Sales Receipts CSV</span>
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                </button>
                <button
                  onClick={exportExpensesCSV}
                  className="text-xs text-left px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-between transition cursor-pointer"
                >
                  <span>Expense Records CSV</span>
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Data Maintenance */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Store Data Maintenance
            </h4>

            <button
              onClick={() => updateSettings({ hasCompletedOnboarding: false })}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Re-run Welcome Setup Wizard</span>
            </button>


            <button
              onClick={handleClearAll}
              className="w-full py-2.5 px-3 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Reset & Wipe Store Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
