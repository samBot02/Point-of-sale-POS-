import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

// Database file path
const dbPath = path.resolve(process.cwd(), 'database.sqlite');
export const db = new Database(dbPath);

// Enable SQLite Write-Ahead Logging (WAL) for high concurrency across multiple LAN devices
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  // 1. Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      displayName TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'cashier')),
      passwordHash TEXT NOT NULL,
      pin TEXT,
      active INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL
    )
  `);

  // 2. Products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      barcode TEXT NOT NULL,
      sku TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      costPrice REAL NOT NULL,
      sellingPrice REAL NOT NULL,
      stockQuantity REAL NOT NULL,
      minStockThreshold REAL NOT NULL,
      expiryDate TEXT,
      isPerishable INTEGER DEFAULT 0,
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // 3. Sales table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      receiptNumber TEXT UNIQUE NOT NULL,
      itemsJson TEXT NOT NULL,
      subtotal REAL NOT NULL,
      discount REAL NOT NULL,
      tax REAL NOT NULL,
      total REAL NOT NULL,
      totalCost REAL NOT NULL,
      profit REAL NOT NULL,
      paymentMethod TEXT NOT NULL,
      amountTendered REAL NOT NULL,
      changeGiven REAL NOT NULL,
      customerNote TEXT,
      cashierId TEXT,
      cashierName TEXT,
      status TEXT NOT NULL,
      timestamp TEXT NOT NULL
    )
  `);

  // 4. Expenses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      paymentMethod TEXT NOT NULL,
      payee TEXT,
      date TEXT NOT NULL,
      notes TEXT,
      timestamp TEXT NOT NULL
    )
  `);

  // 5. Stock Logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_logs (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      productName TEXT NOT NULL,
      type TEXT NOT NULL,
      quantityDelta REAL NOT NULL,
      costPerUnit REAL,
      reason TEXT,
      timestamp TEXT NOT NULL
    )
  `);

  // 6. Parked Sales table
  db.exec(`
    CREATE TABLE IF NOT EXISTS parked_sales (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      itemsJson TEXT NOT NULL,
      timestamp TEXT NOT NULL
    )
  `);

  // 7. Store Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Seed default admin and cashier if no users exist
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const now = new Date().toISOString();
    const adminPasswordHash = bcrypt.hashSync('admin', 10);
    const cashierPasswordHash = bcrypt.hashSync('cashier', 10);

    const insertUser = db.prepare(`
      INSERT INTO users (id, username, displayName, role, passwordHash, pin, active, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Admin account (username: admin, password: admin, PIN: 1234)
    insertUser.run(
      'user-admin-1',
      'admin',
      'Store Manager',
      'admin',
      adminPasswordHash,
      '1234',
      1,
      now
    );

    // Cashier account (username: cashier, password: cashier, PIN: 0000)
    insertUser.run(
      'user-cashier-1',
      'cashier',
      'Cashier 1',
      'cashier',
      cashierPasswordHash,
      '0000',
      1,
      now
    );

    console.log('Seeded default users: admin (PIN: 1234) and cashier (PIN: 0000)');
  }

  // Seed default settings if empty
  const settingsRow = db.prepare("SELECT value FROM settings WHERE key = 'store_config'").get();
  if (!settingsRow) {
    const defaultSettings = {
      storeName: 'Corner Fresh Grocery',
      storeAddress: '',
      storePhone: '',
      currencySymbol: '$',
      currencyCode: 'USD',
      taxRate: 0,
      taxInclusive: false,
      receiptHeader: '',
      receiptFooter: 'Thank you for shopping with us! Please come again.',
      lowStockAlertDays: 7,
      hasCompletedOnboarding: false,
    };
    db.prepare("INSERT INTO settings (key, value) VALUES ('store_config', ?)").run(
      JSON.stringify(defaultSettings)
    );
  }
}
