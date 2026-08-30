import {
  Category,
  Product,
  Order,
  Offer,
  Coupon,
  SchoolPack,
  SchoolList,
  Supplier,
  StoreSettings,
  UserProfile,
  InventoryMovement,
  CashRegister,
  CashMovement,
  AiScanRecord,
} from '../types';

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: UserProfile;
  error?: string;
}

export interface BootstrapData {
  settings: StoreSettings;
  categories: Category[];
  products: Product[];
  orders: Order[];
  offers: Offer[];
  coupons: Coupon[];
  school_packs: SchoolPack[];
  school_lists: SchoolList[];
  suppliers: Supplier[];
  inventory_movements: InventoryMovement[];
  cash_registers: CashRegister[];
  cash_movements: CashMovement[];
  sales: any[];
  expenses?: any[];
  services?: any[];
  ai_scans: AiScanRecord[];
  activity_logs: any[];
  users: UserProfile[];
}

class BikieApiClient {
  private baseUrl = '';

  // Auth / Login (Strict Database Backend Validation)
  async login(email: string, pinOrPassword: string): Promise<LoginResponse> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPin = pinOrPassword.trim();

    try {
      const res = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, pin: cleanPin, password: cleanPin }),
      });

      const data = await res.json();
      if (data && data.success) {
        return data;
      }
      return {
        success: false,
        error: data?.error || 'Credenciales inválidas o usuario no registrado en la base de datos.',
      };
    } catch (err: any) {
      console.warn('Network / Server error during login:', err);
      return {
        success: false,
        error: 'No se pudo conectar con el servidor de base de datos. Verifica tu conexión.',
      };
    }
  }

  // Real-time Database Synchronization (Server-Sent Events)
  subscribeToRealtime(onEvent: (event: { type: string; data?: any }) => void): () => void {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      try {
        eventSource = new EventSource('/api/realtime/stream');

        eventSource.onmessage = (e) => {
          try {
            const parsed = JSON.parse(e.data);
            onEvent(parsed);
          } catch (err) {
            console.error('Error parsing SSE event data:', err);
          }
        };

        eventSource.onerror = (err) => {
          console.warn('Real-time SSE connection lost, reconnecting in 5s...', err);
          eventSource?.close();
          reconnectTimeout = setTimeout(connect, 5000);
        };
      } catch (err) {
        console.error('SSE initialization error:', err);
        reconnectTimeout = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) {
        eventSource.close();
      }
    };
  }

  // Generate User SQL & JSON for Direct DB Insertion
  async generateUserCode(userData: {
    name: string;
    email: string;
    phone?: string;
    role: string;
    password: string;
    points?: number;
  }): Promise<{ success: boolean; sql?: string; json?: string; error?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/users/generate-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al generar código' };
    }
  }

  // Bootstrap full state
  async getBootstrapData(): Promise<BootstrapData | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/bootstrap`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.error('Error fetching bootstrap data from database:', err);
      return null;
    }
  }

  // Users
  async getUsers(): Promise<UserProfile[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/users`);
      return await res.json();
    } catch (err) {
      console.error('Error fetching users from DB:', err);
      return [];
    }
  }

  async createUser(user: Partial<UserProfile> & { password?: string }): Promise<UserProfile | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      const data = await res.json();
      return data.user || null;
    } catch (err) {
      console.error('Error creating user in DB:', err);
      return null;
    }
  }

  async updateUser(id: string, updates: Partial<UserProfile> & { password?: string }): Promise<UserProfile | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      return data.user || null;
    } catch (err) {
      console.error('Error updating user in DB:', err);
      return null;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      return data.success;
    } catch (err) {
      console.error('Error deleting user from DB:', err);
      return false;
    }
  }

  // Products
  async getProducts(): Promise<Product[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/products`);
      return await res.json();
    } catch (err) {
      console.error('Error getting products:', err);
      return [];
    }
  }

  async createProduct(product: Partial<Product>): Promise<Product | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      const data = await res.json();
      return data.product || null;
    } catch (err) {
      console.error('Error creating product in DB:', err);
      return null;
    }
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      return data.product || null;
    } catch (err) {
      console.error('Error updating product in DB:', err);
      return null;
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      return data.success;
    } catch (err) {
      console.error('Error deleting product in DB:', err);
      return false;
    }
  }

  async saveProducts(products: Product[]): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/products`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(products),
      });
      return res.ok;
    } catch (err) {
      console.error('Error saving products in DB:', err);
      return false;
    }
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/categories`);
      return await res.json();
    } catch (err) {
      console.error('Error getting categories:', err);
      return [];
    }
  }

  async createCategory(category: Partial<Category>): Promise<Category | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      });
      const data = await res.json();
      return data.category || null;
    } catch (err) {
      console.error('Error creating category in DB:', err);
      return null;
    }
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      return data.category || null;
    } catch (err) {
      console.error('Error updating category in DB:', err);
      return null;
    }
  }

  async deleteCategory(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      return data.success;
    } catch (err) {
      console.error('Error deleting category in DB:', err);
      return false;
    }
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/orders`);
      return await res.json();
    } catch (err) {
      console.error('Error getting orders from DB:', err);
      return [];
    }
  }

  async createOrder(order: Partial<Order>): Promise<Order | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      const data = await res.json();
      return data.order || null;
    } catch (err) {
      console.error('Error creating order in DB:', err);
      return null;
    }
  }

  async updateOrderStatus(id: string, status: Order['status'], payment_status?: Order['payment_status']): Promise<Order | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, payment_status }),
      });
      const data = await res.json();
      return data.order || null;
    } catch (err) {
      console.error('Error updating order status in DB:', err);
      return null;
    }
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      return data.order || null;
    } catch (err) {
      console.error('Error updating order in DB:', err);
      return null;
    }
  }

  async deleteOrder(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/orders/${id}`, { method: 'DELETE' });
      const data = await res.json();
      return data.success;
    } catch (err) {
      console.error('Error deleting order in DB:', err);
      return false;
    }
  }

  async saveOrders(orders: Order[]): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/orders`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orders),
      });
      return res.ok;
    } catch (err) {
      console.error('Error saving orders in DB:', err);
      return false;
    }
  }

  // Sales (POS & Direct Services)
  async getSales(): Promise<any[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/sales`);
      return await res.json();
    } catch (err) {
      console.error('Error getting sales from DB:', err);
      return [];
    }
  }

  async createSale(sale: any): Promise<any | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sale),
      });
      const data = await res.json();
      return data.sale || null;
    } catch (err) {
      console.error('Error creating sale in DB:', err);
      return null;
    }
  }

  async updateSale(id: string, updates: any): Promise<any | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/sales/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      return data.sale || null;
    } catch (err) {
      console.error('Error updating sale in DB:', err);
      return null;
    }
  }

  async deleteSale(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/sales/${id}`, { method: 'DELETE' });
      const data = await res.json();
      return data.success;
    } catch (err) {
      console.error('Error deleting sale in DB:', err);
      return false;
    }
  }

  // Settings
  async getSettings(): Promise<StoreSettings | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/settings`);
      return await res.json();
    } catch (err) {
      console.error('Error getting settings from DB:', err);
      return null;
    }
  }

  async updateSettings(settings: Partial<StoreSettings>): Promise<StoreSettings | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      return data.settings || null;
    } catch (err) {
      console.error('Error updating settings in DB:', err);
      return null;
    }
  }

  // Cash registers & Movements
  async createCashRegister(reg: Partial<CashRegister>): Promise<CashRegister | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/cash-registers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reg),
      });
      const data = await res.json();
      return data.register || null;
    } catch (err) {
      console.error('Error creating cash register in DB:', err);
      return null;
    }
  }

  async updateCashRegister(id: string, updates: Partial<CashRegister>): Promise<CashRegister | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/cash-registers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      return data.register || null;
    } catch (err) {
      console.error('Error updating cash register in DB:', err);
      return null;
    }
  }

  async createCashMovement(mov: Partial<CashMovement>): Promise<CashMovement | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/cash-movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mov),
      });
      const data = await res.json();
      return data.movement || null;
    } catch (err) {
      console.error('Error creating cash movement in DB:', err);
      return null;
    }
  }

  // Inventory movements
  async addInventoryMovement(mov: Partial<InventoryMovement>): Promise<InventoryMovement | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/inventory-movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mov),
      });
      const data = await res.json();
      return data.movement || null;
    } catch (err) {
      console.error('Error creating inventory movement in DB:', err);
      return null;
    }
  }

  async createInventoryMovement(mov: Partial<InventoryMovement>): Promise<InventoryMovement | null> {
    return this.addInventoryMovement(mov);
  }

  // Suppliers
  async createSupplier(sup: Partial<Supplier>): Promise<Supplier | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sup),
      });
      const data = await res.json();
      return data.supplier || null;
    } catch (err) {
      console.error('Error creating supplier in DB:', err);
      return null;
    }
  }

  // Activity Log
  async logActivity(log: any): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/activity-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });
      return res.ok;
    } catch (err) {
      console.error('Error recording activity log in DB:', err);
      return false;
    }
  }

  async createAiScan(scan: Partial<AiScanRecord>): Promise<AiScanRecord | null> {
    return this.saveAiScan(scan);
  }

  // School lists & packs
  async saveSchoolPacks(packs: SchoolPack[]): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/school-packs`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packs),
      });
      return res.ok;
    } catch (err) {
      console.error('Error saving school packs:', err);
      return false;
    }
  }

  async saveSchoolLists(lists: SchoolList[]): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/school-lists`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lists),
      });
      return res.ok;
    } catch (err) {
      console.error('Error saving school lists:', err);
      return false;
    }
  }

  // Offers & Coupons
  async getOffers(): Promise<Offer[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/offers`);
      return await res.json();
    } catch (err) {
      console.error('Error getting offers from DB:', err);
      return [];
    }
  }

  async createOffer(offer: Partial<Offer>): Promise<Offer | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offer),
      });
      const data = await res.json();
      return data.offer || null;
    } catch (err) {
      console.error('Error creating offer in DB:', err);
      return null;
    }
  }

  async updateOffer(id: string, updates: Partial<Offer>): Promise<Offer | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/offers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      return data.offer || null;
    } catch (err) {
      console.error('Error updating offer in DB:', err);
      return null;
    }
  }

  async deleteOffer(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/offers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      return data.success;
    } catch (err) {
      console.error('Error deleting offer in DB:', err);
      return false;
    }
  }

  async saveOffers(offers: Offer[]): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/offers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offers),
      });
      return res.ok;
    } catch (err) {
      console.error('Error saving offers:', err);
      return false;
    }
  }

  async saveCoupons(coupons: Coupon[]): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/coupons`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coupons),
      });
      return res.ok;
    } catch (err) {
      console.error('Error saving coupons:', err);
      return false;
    }
  }

  // Suppliers
  async saveSuppliers(suppliers: Supplier[]): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/suppliers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(suppliers),
      });
      return res.ok;
    } catch (err) {
      console.error('Error saving suppliers:', err);
      return false;
    }
  }

  // AI Scans
  async saveAiScan(scan: Partial<AiScanRecord>): Promise<AiScanRecord | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/ai-scans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scan),
      });
      const data = await res.json();
      return data.scan || null;
    } catch (err) {
      console.error('Error saving AI scan in DB:', err);
      return null;
    }
  }

  // Expenses
  async getExpenses(): Promise<any[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/expenses`);
      return await res.json();
    } catch (err) {
      console.error('Error fetching expenses from DB:', err);
      return [];
    }
  }

  async createExpense(expense: any): Promise<any | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense),
      });
      const data = await res.json();
      return data.expense || null;
    } catch (err) {
      console.error('Error creating expense in DB:', err);
      return null;
    }
  }

  async updateExpense(id: string, updates: any): Promise<any | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      return data.expense || null;
    } catch (err) {
      console.error('Error updating expense in DB:', err);
      return null;
    }
  }

  async deleteExpense(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/expenses/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      return data.success;
    } catch (err) {
      console.error('Error deleting expense in DB:', err);
      return false;
    }
  }

  async saveExpenses(expenses: any[]): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/expenses`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenses),
      });
      return res.ok;
    } catch (err) {
      console.error('Error saving expenses to DB:', err);
      return false;
    }
  }

  // Services
  async getServices(): Promise<any[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/services`);
      return await res.json();
    } catch (err) {
      console.error('Error fetching services from DB:', err);
      return [];
    }
  }

  async createService(service: any): Promise<any | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(service),
      });
      const data = await res.json();
      return data.service || null;
    } catch (err) {
      console.error('Error creating service in DB:', err);
      return null;
    }
  }

  async updateService(id: string, updates: any): Promise<any | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      return data.service || null;
    } catch (err) {
      console.error('Error updating service in DB:', err);
      return null;
    }
  }

  async deleteService(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/services/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      return data.success;
    } catch (err) {
      console.error('Error deleting service in DB:', err);
      return false;
    }
  }

  async saveServices(services: any[]): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/services`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(services),
      });
      return res.ok;
    } catch (err) {
      console.error('Error saving services to DB:', err);
      return false;
    }
  }

  // Status check
  async checkDbStatus(): Promise<{ status: string; engine: string; users_count: number; products_count: number; categories_count: number } | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/db/status`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }
}

export const api = new BikieApiClient();
