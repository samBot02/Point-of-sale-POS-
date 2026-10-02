import express, { Request, Response } from 'express';
import cors from 'cors';
import os from 'os';
import bcrypt from 'bcryptjs';
import { db, initDatabase } from './db';
import { authMiddleware, requireAdmin, generateToken, AuthenticatedRequest } from './auth';

// Initialize SQLite tables
initDatabase();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Helper to get local network IP addresses
function getLanIpAddresses(): string[] {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];

  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (iface) {
      for (const info of iface) {
        // Skip internal (loopback 127.0.0.1) and IPv6 addresses
        if (info.family === 'IPv4' && !info.internal && !info.address.startsWith('169.254')) {
          addresses.push(info.address);
        }
      }
    }
  }

  return addresses.length > 0 ? addresses : ['localhost'];
}

// ==========================================
// 1. SYSTEM & LAN INFO
// ==========================================
app.get('/api/lan-info', (_req: Request, res: Response) => {
  const ips = getLanIpAddresses();
  const port = 5173; // Vite frontend port
  const urls = ips.map((ip) => `http://${ip}:${port}`);

  res.json({
    ips,
    port,
    urls,
    recommendedUrl: urls[0] || `http://localhost:${port}`,
  });
});

// ==========================================
// 2. AUTHENTICATION (Password or Quick PIN)
// ==========================================
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password, pin } = req.body;

  let user: any = null;

  // 1. PIN-based login (Super fast for cashiers at the counter)
  if (pin && typeof pin === 'string') {
    const cleanPin = pin.trim();
    user = db.prepare('SELECT * FROM users WHERE pin = ? AND active = 1').get(cleanPin);

    if (!user) {
      return res.status(401).json({ error: 'Invalid PIN entered. Please try again.' });
    }
  } 
  // 2. Username + Password login
  else if (username && password) {
    const cleanUsername = username.trim().toLowerCase();
    user = db.prepare('SELECT * FROM users WHERE LOWER(username) = ? AND active = 1').get(cleanUsername);

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }
  } else {
    return res.status(400).json({ error: 'Please provide either a PIN or Username and Password.' });
  }

  const authUser = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  };

  const token = generateToken(authUser);
  res.json({ token, user: authUser });
});

app.get('/api/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

app.post('/api/auth/change-credentials', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { newPassword, newPin, displayName } = req.body;

  const updates: string[] = [];
  const params: any[] = [];

  if (displayName && displayName.trim()) {
    updates.push('displayName = ?');
    params.push(displayName.trim());
  }

  if (newPassword && newPassword.trim()) {
    updates.push('passwordHash = ?');
    params.push(bcrypt.hashSync(newPassword.trim(), 10));
  }

  if (newPin !== undefined) {
    updates.push('pin = ?');
    params.push(newPin ? newPin.trim() : null);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields provided to update.' });
  }

  params.push(userId);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const updatedUser: any = db.prepare('SELECT id, username, displayName, role FROM users WHERE id = ?').get(userId);
  res.json({ success: true, user: updatedUser });
});

// ==========================================
// 3. USER MANAGEMENT (Admin Only)
// ==========================================
app.get('/api/users', authMiddleware, requireAdmin, (_req: Request, res: Response) => {
  const users = db.prepare('SELECT id, username, displayName, role, pin, active, createdAt FROM users ORDER BY createdAt ASC').all();
  res.json(users);
});

app.post('/api/users', authMiddleware, requireAdmin, (req: Request, res: Response) => {
  const { username, displayName, role, password, pin } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Username, password, and role are required.' });
  }

  try {
    const id = `user-${Date.now()}`;
    const passwordHash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, username, displayName, role, passwordHash, pin, active, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, username.trim().toLowerCase(), displayName || username, role, passwordHash, pin ? pin.trim() : null, 1, now);

    res.json({
      id,
      username: username.trim().toLowerCase(),
      displayName: displayName || username,
      role,
      pin: pin ? pin.trim() : null,
      active: 1,
      createdAt: now,
    });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(400).json({ error: 'That username is already taken.' });
    }
    res.status(500).json({ error: err.message || 'Failed to create user.' });
  }
});

app.put('/api/users/:id', authMiddleware, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { displayName, role, password, pin, active } = req.body;

  const updates: string[] = [];
  const params: any[] = [];

  if (displayName) {
    updates.push('displayName = ?');
    params.push(displayName.trim());
  }
  if (role) {
    updates.push('role = ?');
    params.push(role);
  }
  if (password && password.trim()) {
    updates.push('passwordHash = ?');
    params.push(bcrypt.hashSync(password.trim(), 10));
  }
  if (pin !== undefined) {
    updates.push('pin = ?');
    params.push(pin ? pin.trim() : null);
  }
  if (active !== undefined) {
    updates.push('active = ?');
    params.push(active ? 1 : 0);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update.' });
  }

  params.push(id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  res.json({ success: true });
});

app.delete('/api/users/:id', authMiddleware, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  if (id === req.user?.id) {
    return res.status(400).json({ error: 'You cannot delete your own account while logged in.' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ success: true });
});

// ==========================================
// 4. PRODUCTS & INVENTORY
// ==========================================
app.get('/api/products', authMiddleware, (_req: Request, res: Response) => {
  const products = db.prepare('SELECT * FROM products ORDER BY name ASC').all();
  // Map SQLite integers back to boolean for isPerishable
  const mapped = products.map((p: any) => ({
    ...p,
    isPerishable: Boolean(p.isPerishable),
  }));
  res.json(mapped);
});

app.post('/api/products', authMiddleware, (req: Request, res: Response) => {
  const p = req.body;
  const now = new Date().toISOString();
  const id = p.id || `prod-${Date.now()}`;

  db.prepare(`
    INSERT INTO products (id, name, barcode, sku, category, unit, costPrice, sellingPrice, stockQuantity, minStockThreshold, expiryDate, isPerishable, notes, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    p.name,
    p.barcode,
    p.sku || p.barcode,
    p.category,
    p.unit,
    p.costPrice || 0,
    p.sellingPrice || 0,
    p.stockQuantity || 0,
    p.minStockThreshold || 5,
    p.expiryDate || null,
    p.isPerishable ? 1 : 0,
    p.notes || null,
    p.createdAt || now,
    now
  );

  res.json({ ...p, id, createdAt: p.createdAt || now, updatedAt: now });
});

app.put('/api/products/:id', authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const p = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE products SET
      name = ?, barcode = ?, sku = ?, category = ?, unit = ?,
      costPrice = ?, sellingPrice = ?, stockQuantity = ?, minStockThreshold = ?,
      expiryDate = ?, isPerishable = ?, notes = ?, updatedAt = ?
    WHERE id = ?
  `).run(
    p.name,
    p.barcode,
    p.sku || p.barcode,
    p.category,
    p.unit,
    p.costPrice,
    p.sellingPrice,
    p.stockQuantity,
    p.minStockThreshold,
    p.expiryDate || null,
    p.isPerishable ? 1 : 0,
    p.notes || null,
    now,
    id
  );

  res.json({ success: true, updatedAt: now });
});

app.delete('/api/products/:id', authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  res.json({ success: true });
});

// ==========================================
// 5. SALES & TRANSACTIONS (Atomic POS Checkout)
// ==========================================
app.get('/api/sales', authMiddleware, (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM sales ORDER BY timestamp DESC').all();
  const sales = rows.map((s: any) => ({
    ...s,
    items: JSON.parse(s.itemsJson || '[]'),
  }));
  res.json(sales);
});

app.post('/api/sales', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const sale = req.body;
  const now = new Date().toISOString();
  const id = sale.id || `sale-${Date.now()}`;

  // Execute checkout as an atomic transaction: save sale + deduct product inventory + log movement
  const executeSale = db.transaction(() => {
    // 1. Insert sale row
    db.prepare(`
      INSERT INTO sales (
        id, receiptNumber, itemsJson, subtotal, discount, tax, total, totalCost,
        profit, paymentMethod, amountTendered, changeGiven, customerNote,
        cashierId, cashierName, status, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      sale.receiptNumber,
      JSON.stringify(sale.items),
      sale.subtotal,
      sale.discount || 0,
      sale.tax || 0,
      sale.total,
      sale.totalCost || 0,
      sale.profit || 0,
      sale.paymentMethod,
      sale.amountTendered || sale.total,
      sale.changeGiven || 0,
      sale.customerNote || null,
      req.user?.id || null,
      req.user?.displayName || null,
      'completed',
      sale.timestamp || now
    );

    // 2. Deduct inventory & record stock movement logs
    for (const item of sale.items) {
      const prod: any = db.prepare('SELECT stockQuantity, costPrice, name FROM products WHERE id = ?').get(item.productId);
      if (prod) {
        const newStock = Number((prod.stockQuantity - item.quantity).toFixed(3));
        db.prepare('UPDATE products SET stockQuantity = ?, updatedAt = ? WHERE id = ?').run(newStock, now, item.productId);

        db.prepare(`
          INSERT INTO stock_logs (id, productId, productName, type, quantityDelta, costPerUnit, reason, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          item.productId,
          prod.name,
          'sale_deduction',
          -item.quantity,
          prod.costPrice,
          `Sale #${sale.receiptNumber}`,
          now
        );
      }
    }
  });

  try {
    executeSale();
    res.json({ success: true, id, receiptNumber: sale.receiptNumber });
  } catch (err: any) {
    console.error('Checkout transaction error:', err);
    res.status(500).json({ error: err.message || 'Failed to complete transaction.' });
  }
});

// ==========================================
// 6. EXPENSES
// ==========================================
app.get('/api/expenses', authMiddleware, (_req: Request, res: Response) => {
  const expenses = db.prepare('SELECT * FROM expenses ORDER BY date DESC, timestamp DESC').all();
  res.json(expenses);
});

app.post('/api/expenses', authMiddleware, (req: Request, res: Response) => {
  const e = req.body;
  const now = new Date().toISOString();
  const id = e.id || `exp-${Date.now()}`;

  db.prepare(`
    INSERT INTO expenses (id, title, category, amount, paymentMethod, payee, date, notes, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    e.title,
    e.category,
    e.amount,
    e.paymentMethod || 'cash',
    e.payee || null,
    e.date || now.slice(0, 10),
    e.notes || null,
    e.timestamp || now
  );

  res.json({ ...e, id, timestamp: e.timestamp || now });
});

app.put('/api/expenses/:id', authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const e = req.body;

  db.prepare(`
    UPDATE expenses SET
      title = ?, category = ?, amount = ?, paymentMethod = ?,
      payee = ?, date = ?, notes = ?
    WHERE id = ?
  `).run(
    e.title,
    e.category,
    e.amount,
    e.paymentMethod,
    e.payee || null,
    e.date,
    e.notes || null,
    id
  );

  res.json({ success: true });
});

app.delete('/api/expenses/:id', authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
  res.json({ success: true });
});

// ==========================================
// 7. STOCK LOGS (Restock & Spoilage Adjustments)
// ==========================================
app.get('/api/stock-logs', authMiddleware, (_req: Request, res: Response) => {
  const logs = db.prepare('SELECT * FROM stock_logs ORDER BY timestamp DESC LIMIT 200').all();
  res.json(logs);
});

app.post('/api/stock-adjustments', authMiddleware, (req: Request, res: Response) => {
  const { productId, quantityDelta, type, reason, costPerUnit, logAsExpense, expenseData } = req.body;
  const now = new Date().toISOString();

  const executeAdjustment = db.transaction(() => {
    const prod: any = db.prepare('SELECT stockQuantity, name, costPrice FROM products WHERE id = ?').get(productId);
    if (!prod) throw new Error('Product not found.');

    const newStock = Math.max(0, Number((prod.stockQuantity + quantityDelta).toFixed(3)));
    db.prepare('UPDATE products SET stockQuantity = ?, updatedAt = ? WHERE id = ?').run(newStock, now, productId);

    db.prepare(`
      INSERT INTO stock_logs (id, productId, productName, type, quantityDelta, costPerUnit, reason, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `log-${Date.now()}`,
      productId,
      prod.name,
      type,
      quantityDelta,
      costPerUnit || prod.costPrice,
      reason,
      now
    );

    // If an associated expense was requested (e.g. restock purchase or food waste write-off)
    if (logAsExpense && expenseData) {
      db.prepare(`
        INSERT INTO expenses (id, title, category, amount, paymentMethod, payee, date, notes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `exp-${Date.now()}`,
        expenseData.title,
        expenseData.category,
        expenseData.amount,
        expenseData.paymentMethod || 'cash',
        expenseData.payee || null,
        expenseData.date || now.slice(0, 10),
        expenseData.notes || null,
        now
      );
    }
  });

  try {
    executeAdjustment();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to adjust stock.' });
  }
});

// ==========================================
// 8. PARKED SALES
// ==========================================
app.get('/api/parked-sales', authMiddleware, (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM parked_sales ORDER BY timestamp DESC').all();
  const list = rows.map((r: any) => ({
    ...r,
    items: JSON.parse(r.itemsJson || '[]'),
  }));
  res.json(list);
});

app.post('/api/parked-sales', authMiddleware, (req: Request, res: Response) => {
  const { id, label, items, timestamp } = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO parked_sales (id, label, itemsJson, timestamp)
    VALUES (?, ?, ?, ?)
  `).run(id || `parked-${Date.now()}`, label, JSON.stringify(items), timestamp || now);

  res.json({ success: true });
});

app.delete('/api/parked-sales/:id', authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  db.prepare('DELETE FROM parked_sales WHERE id = ?').run(id);
  res.json({ success: true });
});

// ==========================================
// 9. STORE SETTINGS
// ==========================================
app.get('/api/settings', (_req: Request, res: Response) => {
  const row: any = db.prepare("SELECT value FROM settings WHERE key = 'store_config'").get();
  res.json(row ? JSON.parse(row.value) : {});
});

app.put('/api/settings', authMiddleware, requireAdmin, (req: Request, res: Response) => {
  const config = req.body;
  db.prepare(`
    INSERT INTO settings (key, value) VALUES ('store_config', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(JSON.stringify(config));

  res.json({ success: true, settings: config });
});

// ==========================================
// 10. BACKUP & RESTORE
// ==========================================
app.get('/api/backup', authMiddleware, requireAdmin, (_req: Request, res: Response) => {
  const products = db.prepare('SELECT * FROM products').all().map((p: any) => ({
    ...p,
    isPerishable: Boolean(p.isPerishable),
  }));
  const sales = db.prepare('SELECT * FROM sales').all().map((s: any) => ({
    ...s,
    items: JSON.parse(s.itemsJson || '[]'),
  }));
  const expenses = db.prepare('SELECT * FROM expenses').all();
  const stockLogs = db.prepare('SELECT * FROM stock_logs').all();
  const settingsRow: any = db.prepare("SELECT value FROM settings WHERE key = 'store_config'").get();

  res.json({
    version: 2,
    timestamp: new Date().toISOString(),
    storeSettings: settingsRow ? JSON.parse(settingsRow.value) : {},
    products,
    sales,
    expenses,
    stockLogs,
  });
});

app.post('/api/backup/restore', authMiddleware, requireAdmin, (req: Request, res: Response) => {
  const data = req.body;
  if (!data.products || !Array.isArray(data.products)) {
    return res.status(400).json({ error: 'Invalid backup file structure.' });
  }

  const restoreTx = db.transaction(() => {
    db.prepare('DELETE FROM products').run();
    db.prepare('DELETE FROM sales').run();
    db.prepare('DELETE FROM expenses').run();
    db.prepare('DELETE FROM stock_logs').run();

    const insertProd = db.prepare(`
      INSERT INTO products (id, name, barcode, sku, category, unit, costPrice, sellingPrice, stockQuantity, minStockThreshold, expiryDate, isPerishable, notes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of data.products) {
      insertProd.run(p.id, p.name, p.barcode, p.sku || p.barcode, p.category, p.unit, p.costPrice, p.sellingPrice, p.stockQuantity, p.minStockThreshold, p.expiryDate || null, p.isPerishable ? 1 : 0, p.notes || null, p.createdAt, p.updatedAt);
    }

    if (data.sales && Array.isArray(data.sales)) {
      const insertSale = db.prepare(`
        INSERT INTO sales (id, receiptNumber, itemsJson, subtotal, discount, tax, total, totalCost, profit, paymentMethod, amountTendered, changeGiven, customerNote, cashierId, cashierName, status, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const s of data.sales) {
        insertSale.run(s.id, s.receiptNumber, JSON.stringify(s.items), s.subtotal, s.discount || 0, s.tax || 0, s.total, s.totalCost || 0, s.profit || 0, s.paymentMethod, s.amountTendered || s.total, s.changeGiven || 0, s.customerNote || null, s.cashierId || null, s.cashierName || null, s.status || 'completed', s.timestamp);
      }
    }

    if (data.expenses && Array.isArray(data.expenses)) {
      const insertExp = db.prepare(`
        INSERT INTO expenses (id, title, category, amount, paymentMethod, payee, date, notes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const e of data.expenses) {
        insertExp.run(e.id, e.title, e.category, e.amount, e.paymentMethod || 'cash', e.payee || null, e.date, e.notes || null, e.timestamp);
      }
    }

    if (data.storeSettings) {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('store_config', ?)").run(
        JSON.stringify(data.storeSettings)
      );
    }
  });

  try {
    restoreTx();
    res.json({ success: true, count: data.products.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to restore backup.' });
  }
});

// Start Express Server
app.listen(PORT, '0.0.0.0', () => {
  const ips = getLanIpAddresses();
  console.log(`\n======================================================`);
  console.log(`🚀 Grocery POS Backend Server running on port ${PORT}`);
  console.log(`📡 Local Network Access URLs:`);
  ips.forEach((ip) => {
    console.log(`   👉 http://${ip}:5173 (POS Client)`);
    console.log(`   👉 http://${ip}:${PORT} (API Backend)`);
  });
  console.log(`======================================================\n`);
});
