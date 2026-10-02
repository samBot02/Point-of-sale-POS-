import type { Product, Sale, Expense, StockLog, StoreSettings, ParkedSale } from '../types';

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'cashier';
  pin?: string;
  active?: number;
  createdAt?: string;
}

export interface LanInfo {
  ips: string[];
  port: number;
  urls: string[];
  recommendedUrl: string;
}

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('pos_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Clear token if expired or invalid
      localStorage.removeItem('pos_token');
      localStorage.removeItem('pos_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    if (!response.ok) {
      let errMsg = `Request failed (${response.status})`;
      try {
        const errJson = await response.json();
        errMsg = errJson.error || errJson.message || errMsg;
      } catch {
        // Fallback to text
      }
      throw new Error(errMsg);
    }

    return response.json();
  }

  // 1. System LAN Info
  async getLanInfo(): Promise<LanInfo> {
    return this.request<LanInfo>('/api/lan-info');
  }

  // 2. Authentication
  async login(credentials: { username?: string; password?: string; pin?: string }): Promise<{ token: string; user: User }> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getMe(): Promise<{ user: User }> {
    return this.request('/api/auth/me');
  }

  async changeCredentials(data: { newPassword?: string; newPin?: string; displayName?: string }): Promise<{ success: boolean; user: User }> {
    return this.request('/api/auth/change-credentials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 3. User Management (Admin)
  async getUsers(): Promise<User[]> {
    return this.request('/api/users');
  }

  async createUser(data: { username: string; displayName: string; role: 'admin' | 'cashier'; password: string; pin?: string }): Promise<User> {
    return this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: Partial<User & { password?: string }>): Promise<{ success: boolean }> {
    return this.request(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/users/${id}`, {
      method: 'DELETE',
    });
  }

  // 4. Products & Stock
  async getProducts(): Promise<Product[]> {
    return this.request('/api/products');
  }

  async createProduct(data: Partial<Product>): Promise<Product> {
    return this.request('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<{ success: boolean }> {
    return this.request(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/products/${id}`, {
      method: 'DELETE',
    });
  }

  // 5. Sales Checkout
  async getSales(): Promise<Sale[]> {
    return this.request('/api/sales');
  }

  async createSale(saleData: Partial<Sale>): Promise<{ success: boolean; id: string; receiptNumber: string }> {
    return this.request('/api/sales', {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
  }

  // 6. Expenses
  async getExpenses(): Promise<Expense[]> {
    return this.request('/api/expenses');
  }

  async createExpense(data: Partial<Expense>): Promise<Expense> {
    return this.request('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateExpense(id: string, data: Partial<Expense>): Promise<{ success: boolean }> {
    return this.request(`/api/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteExpense(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  // 7. Stock Adjustments (Restock / Spoilage)
  async getStockLogs(): Promise<StockLog[]> {
    return this.request('/api/stock-logs');
  }

  async adjustStock(data: {
    productId: string;
    quantityDelta: number;
    type: string;
    reason: string;
    costPerUnit?: number;
    logAsExpense?: boolean;
    expenseData?: Partial<Expense>;
  }): Promise<{ success: boolean }> {
    return this.request('/api/stock-adjustments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 8. Parked Sales
  async getParkedSales(): Promise<ParkedSale[]> {
    return this.request('/api/parked-sales');
  }

  async parkSale(data: { id?: string; label: string; items: any[]; timestamp?: string }): Promise<{ success: boolean }> {
    return this.request('/api/parked-sales', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteParkedSale(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/parked-sales/${id}`, {
      method: 'DELETE',
    });
  }

  // 9. Store Settings
  async getSettings(): Promise<StoreSettings> {
    return this.request('/api/settings');
  }

  async updateSettings(settings: Partial<StoreSettings>): Promise<{ success: boolean; settings: StoreSettings }> {
    return this.request('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // 10. Backup & Restore
  async getBackupData(): Promise<any> {
    return this.request('/api/backup');
  }

  async restoreBackup(data: any): Promise<{ success: boolean; count: number }> {
    return this.request('/api/backup/restore', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiService();
