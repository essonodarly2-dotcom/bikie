import {
  Product,
  Category,
  Order,
  Offer,
  Coupon,
  SchoolPack,
  SchoolList,
  InventoryMovement,
  Sale,
  CashRegister,
  CashMovement,
  Supplier,
  Purchase,
  Invoice,
  AiScanRecord,
  ActivityLog,
  StoreSettings,
  AppNotification,
  UserProfile,
  Expense,
  ServiceItem,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_OFFERS,
  INITIAL_COUPONS,
  INITIAL_SCHOOL_PACKS,
  INITIAL_SCHOOL_LISTS,
  INITIAL_SUPPLIERS,
  INITIAL_DEMO_USERS,
  INITIAL_SETTINGS,
  INITIAL_SERVICES,
  INITIAL_EXPENSES,
} from './mockData';
import { api, BootstrapData } from './api';

const STORAGE_KEYS = {
  SETTINGS: 'bikie_settings_v1',
  CATEGORIES: 'bikie_categories_v1',
  PRODUCTS: 'bikie_products_v1',
  ORDERS: 'bikie_orders_v1',
  OFFERS: 'bikie_offers_v1',
  COUPONS: 'bikie_coupons_v1',
  SCHOOL_PACKS: 'bikie_school_packs_v1',
  SCHOOL_LISTS: 'bikie_school_lists_v1',
  INVENTORY_MOVEMENTS: 'bikie_inventory_movements_v1',
  SALES: 'bikie_sales_v1',
  CASH_REGISTERS: 'bikie_cash_registers_v1',
  CASH_MOVEMENTS: 'bikie_cash_movements_v1',
  SUPPLIERS: 'bikie_suppliers_v1',
  PURCHASES: 'bikie_purchases_v1',
  INVOICES: 'bikie_invoices_v1',
  AI_SCANS: 'bikie_ai_scans_v1',
  ACTIVITY_LOGS: 'bikie_activity_logs_v1',
  USERS: 'bikie_users_v1',
  NOTIFICATIONS: 'bikie_notifications_v1',
  FAVORITES: 'bikie_favorites_v1',
  CURRENT_USER: 'bikie_current_user_v1',
  EXPENSES: 'bikie_expenses_v1',
  SERVICES: 'bikie_services_v1',
};

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving to localStorage [${key}]:`, err);
  }
}

// Initial state bootstrapping
export function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    setItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    setItem(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    setItem(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.OFFERS)) {
    setItem(STORAGE_KEYS.OFFERS, INITIAL_OFFERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.COUPONS)) {
    setItem(STORAGE_KEYS.COUPONS, INITIAL_COUPONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SCHOOL_PACKS)) {
    setItem(STORAGE_KEYS.SCHOOL_PACKS, INITIAL_SCHOOL_PACKS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SCHOOL_LISTS)) {
    setItem(STORAGE_KEYS.SCHOOL_LISTS, INITIAL_SCHOOL_LISTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SUPPLIERS)) {
    setItem(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    setItem(STORAGE_KEYS.USERS, INITIAL_DEMO_USERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
    setItem(STORAGE_KEYS.CURRENT_USER, INITIAL_DEMO_USERS[0]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
    setItem(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.EXPENSES)) {
    setItem(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
  }
}

// Storage Accessors with Live Database Sync
export const storageService = {
  // Sync all entities with backend DB
  syncWithDatabase: async (): Promise<BootstrapData | null> => {
    try {
      const data = await api.getBootstrapData();
      if (data) {
        if (data.settings) setItem(STORAGE_KEYS.SETTINGS, data.settings);
        if (data.categories?.length) setItem(STORAGE_KEYS.CATEGORIES, data.categories);
        if (data.products?.length) setItem(STORAGE_KEYS.PRODUCTS, data.products);
        if (data.orders) setItem(STORAGE_KEYS.ORDERS, data.orders);
        if (data.offers) setItem(STORAGE_KEYS.OFFERS, data.offers);
        if (data.coupons) setItem(STORAGE_KEYS.COUPONS, data.coupons);
        if (data.school_packs) setItem(STORAGE_KEYS.SCHOOL_PACKS, data.school_packs);
        if (data.school_lists) setItem(STORAGE_KEYS.SCHOOL_LISTS, data.school_lists);
        if (data.suppliers) setItem(STORAGE_KEYS.SUPPLIERS, data.suppliers);
        if (data.users?.length) setItem(STORAGE_KEYS.USERS, data.users);
        if (data.cash_registers) setItem(STORAGE_KEYS.CASH_REGISTERS, data.cash_registers);
        if (data.cash_movements) setItem(STORAGE_KEYS.CASH_MOVEMENTS, data.cash_movements);
        if (data.inventory_movements) setItem(STORAGE_KEYS.INVENTORY_MOVEMENTS, data.inventory_movements);
        if (data.expenses?.length) setItem(STORAGE_KEYS.EXPENSES, data.expenses);
        if (data.services?.length) setItem(STORAGE_KEYS.SERVICES, data.services);
        if (data.ai_scans) setItem(STORAGE_KEYS.AI_SCANS, data.ai_scans);
      }
      return data;
    } catch (err) {
      console.error('Error syncing with database:', err);
      return null;
    }
  },

  getSettings: (): StoreSettings => getItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS),
  saveSettings: (settings: StoreSettings) => {
    setItem(STORAGE_KEYS.SETTINGS, settings);
    api.updateSettings(settings).catch((e) => console.error('DB updateSettings err:', e));
  },

  getCategories: (): Category[] => getItem(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES),
  saveCategories: (categories: Category[]) => {
    setItem(STORAGE_KEYS.CATEGORIES, categories);
  },

  addCategory: async (category: Category) => {
    const list = getItem<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    setItem(STORAGE_KEYS.CATEGORIES, [...list, category]);
    await api.createCategory(category);
  },

  updateCategory: async (id: string, updates: Partial<Category>) => {
    const list = getItem<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    const updated = list.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setItem(STORAGE_KEYS.CATEGORIES, updated);
    await api.updateCategory(id, updates);
  },

  deleteCategory: async (id: string) => {
    const list = getItem<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    setItem(STORAGE_KEYS.CATEGORIES, list.filter((c) => c.id !== id));
    await api.deleteCategory(id);
  },

  getProducts: (): Product[] => getItem(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS),
  saveProducts: (products: Product[]) => {
    setItem(STORAGE_KEYS.PRODUCTS, products);
  },

  deductStock: (
    itemsToDeduct: { product_id: string; quantity: number }[],
    reason: string = 'Venta',
    userName: string = 'Sistema'
  ): { success: boolean; error?: string } => {
    const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    
    // Check stock availability
    for (const item of itemsToDeduct) {
      const prod = products.find((p) => p.id === item.product_id);
      if (!prod) {
        return { success: false, error: `Producto no encontrado en inventario.` };
      }
      if (prod.stock < item.quantity) {
        return {
          success: false,
          error: `Stock insuficiente para "${prod.name}". Disponible: ${prod.stock}, Solicitado: ${item.quantity}`,
        };
      }
    }

    // Apply deduction
    const updated = products.map((p) => {
      const it = itemsToDeduct.find((item) => item.product_id === p.id);
      if (it) {
        const prev = p.stock;
        const next = Math.max(0, prev - it.quantity);
        
        // Log movement
        storageService.addInventoryMovement({
          id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          product_id: p.id,
          product_name: p.name,
          type: 'sale',
          quantity: -it.quantity,
          previous_stock: prev,
          new_stock: next,
          reason,
          user_name: userName,
          created_at: new Date().toISOString(),
        });

        // Update in backend API asynchronously
        api.updateProduct(p.id, { stock: next, status: next === 0 ? 'out_of_stock' : p.status }).catch(console.error);

        return {
          ...p,
          stock: next,
          status: next === 0 ? 'out_of_stock' : p.status,
        };
      }
      return p;
    });

    setItem(STORAGE_KEYS.PRODUCTS, updated);
    return { success: true };
  },

  increaseStock: (
    productId: string,
    quantity: number,
    reason: string = 'Reabastecimiento',
    userName: string = 'Administración'
  ): boolean => {
    const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const prod = products.find((p) => p.id === productId);
    if (!prod) return false;

    const prev = prod.stock;
    const next = prev + quantity;

    const updated = products.map((p) =>
      p.id === productId
        ? {
            ...p,
            stock: next,
            status: p.status === 'out_of_stock' ? 'active' : p.status,
          }
        : p
    );

    setItem(STORAGE_KEYS.PRODUCTS, updated);

    storageService.addInventoryMovement({
      id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      product_id: prod.id,
      product_name: prod.name,
      type: 'purchase',
      quantity,
      previous_stock: prev,
      new_stock: next,
      reason,
      user_name: userName,
      created_at: new Date().toISOString(),
    });

    api.updateProduct(productId, { stock: next, status: prod.status === 'out_of_stock' ? 'active' : prod.status }).catch(console.error);
    return true;
  },

  addProduct: async (product: Product) => {
    const list = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    setItem(STORAGE_KEYS.PRODUCTS, [product, ...list]);
    await api.createProduct(product);
  },

  updateProduct: async (id: string, updates: Partial<Product>) => {
    const list = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const updated = list.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setItem(STORAGE_KEYS.PRODUCTS, updated);
    await api.updateProduct(id, updates);
  },

  deleteProduct: async (id: string) => {
    const list = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    setItem(STORAGE_KEYS.PRODUCTS, list.filter((p) => p.id !== id));
    await api.deleteProduct(id);
  },

  getOrders: (): Order[] => getItem(STORAGE_KEYS.ORDERS, []),
  saveOrders: (orders: Order[]) => setItem(STORAGE_KEYS.ORDERS, orders),
  createOrder: async (order: Order) => {
    const list = getItem<Order[]>(STORAGE_KEYS.ORDERS, []);
    setItem(STORAGE_KEYS.ORDERS, [order, ...list]);
    await api.createOrder(order);
  },

  updateOrderStatus: async (id: string, status: Order['status'], payment_status?: Order['payment_status']) => {
    const list = getItem<Order[]>(STORAGE_KEYS.ORDERS, []);
    const updated = list.map((o) =>
      o.id === id ? { ...o, status, ...(payment_status ? { payment_status } : {}) } : o
    );
    setItem(STORAGE_KEYS.ORDERS, updated);
    await api.updateOrderStatus(id, status, payment_status);
  },

  updateOrder: async (id: string, updates: Partial<Order>) => {
    const list = getItem<Order[]>(STORAGE_KEYS.ORDERS, []);
    const updated = list.map((o) => (o.id === id ? { ...o, ...updates } : o));
    setItem(STORAGE_KEYS.ORDERS, updated);
    await api.updateOrder(id, updates);
  },

  deleteOrder: async (id: string) => {
    const list = getItem<Order[]>(STORAGE_KEYS.ORDERS, []);
    setItem(STORAGE_KEYS.ORDERS, list.filter((o) => o.id !== id));
    await api.deleteOrder(id);
  },

  getOffers: (): Offer[] => getItem(STORAGE_KEYS.OFFERS, INITIAL_OFFERS),
  saveOffers: (offers: Offer[]) => {
    setItem(STORAGE_KEYS.OFFERS, offers);
    api.saveOffers(offers).catch(console.error);
  },
  addOffer: async (offer: Offer) => {
    const list = getItem<Offer[]>(STORAGE_KEYS.OFFERS, INITIAL_OFFERS);
    setItem(STORAGE_KEYS.OFFERS, [offer, ...list]);
    await api.createOffer(offer);
  },
  createOffer: async (offer: Offer) => {
    const list = getItem<Offer[]>(STORAGE_KEYS.OFFERS, INITIAL_OFFERS);
    setItem(STORAGE_KEYS.OFFERS, [offer, ...list]);
    await api.createOffer(offer);
  },
  updateOffer: async (id: string, updates: Partial<Offer>) => {
    const list = getItem<Offer[]>(STORAGE_KEYS.OFFERS, INITIAL_OFFERS);
    const updated = list.map((o) => (o.id === id ? { ...o, ...updates } : o));
    setItem(STORAGE_KEYS.OFFERS, updated);
    await api.updateOffer(id, updates);
  },
  deleteOffer: async (id: string) => {
    const list = getItem<Offer[]>(STORAGE_KEYS.OFFERS, INITIAL_OFFERS);
    setItem(STORAGE_KEYS.OFFERS, list.filter((o) => o.id !== id));
    await api.deleteOffer(id);
  },

  getCoupons: (): Coupon[] => getItem(STORAGE_KEYS.COUPONS, INITIAL_COUPONS),
  saveCoupons: (coupons: Coupon[]) => {
    setItem(STORAGE_KEYS.COUPONS, coupons);
    api.saveCoupons(coupons).catch(console.error);
  },

  getSchoolPacks: (): SchoolPack[] => getItem(STORAGE_KEYS.SCHOOL_PACKS, INITIAL_SCHOOL_PACKS),
  saveSchoolPacks: (packs: SchoolPack[]) => {
    setItem(STORAGE_KEYS.SCHOOL_PACKS, packs);
    api.saveSchoolPacks(packs).catch(console.error);
  },

  getSchoolLists: (): SchoolList[] => getItem(STORAGE_KEYS.SCHOOL_LISTS, INITIAL_SCHOOL_LISTS),
  saveSchoolLists: (lists: SchoolList[]) => {
    setItem(STORAGE_KEYS.SCHOOL_LISTS, lists);
    api.saveSchoolLists(lists).catch(console.error);
  },

  getInventoryMovements: (): InventoryMovement[] => getItem(STORAGE_KEYS.INVENTORY_MOVEMENTS, []),
  addInventoryMovement: (movement: InventoryMovement) => {
    const list = getItem<InventoryMovement[]>(STORAGE_KEYS.INVENTORY_MOVEMENTS, []);
    setItem(STORAGE_KEYS.INVENTORY_MOVEMENTS, [movement, ...list]);
    api.addInventoryMovement(movement).catch(console.error);
  },

  getSales: (): Sale[] => getItem(STORAGE_KEYS.SALES, []),
  saveSales: (sales: Sale[]) => setItem(STORAGE_KEYS.SALES, sales),
  addSale: async (sale: Sale) => {
    const sales = getItem<Sale[]>(STORAGE_KEYS.SALES, []);
    setItem(STORAGE_KEYS.SALES, [sale, ...sales]);
    await api.createSale(sale);
  },
  updateSale: async (id: string, updates: Partial<Sale>) => {
    const sales = getItem<Sale[]>(STORAGE_KEYS.SALES, []);
    const updated = sales.map((s) => (s.id === id ? { ...s, ...updates } : s));
    setItem(STORAGE_KEYS.SALES, updated);
    await api.updateSale(id, updates);
  },
  deleteSale: async (id: string) => {
    const sales = getItem<Sale[]>(STORAGE_KEYS.SALES, []);
    setItem(STORAGE_KEYS.SALES, sales.filter((s) => s.id !== id));
    await api.deleteSale(id);
  },

  getCashRegisters: (): CashRegister[] => getItem(STORAGE_KEYS.CASH_REGISTERS, []),
  saveCashRegisters: (registers: CashRegister[]) => setItem(STORAGE_KEYS.CASH_REGISTERS, registers),
  createCashRegister: async (register: CashRegister) => {
    const list = getItem<CashRegister[]>(STORAGE_KEYS.CASH_REGISTERS, []);
    setItem(STORAGE_KEYS.CASH_REGISTERS, [register, ...list]);
    await api.createCashRegister(register);
  },
  updateCashRegister: async (id: string, updates: Partial<CashRegister>) => {
    const list = getItem<CashRegister[]>(STORAGE_KEYS.CASH_REGISTERS, []);
    const updated = list.map((r) => (r.id === id ? { ...r, ...updates } : r));
    setItem(STORAGE_KEYS.CASH_REGISTERS, updated);
    await api.updateCashRegister(id, updates);
  },
  getCurrentCashRegister: (): CashRegister | undefined => {
    const list = getItem<CashRegister[]>(STORAGE_KEYS.CASH_REGISTERS, []);
    return list.find((r) => r.status === 'open');
  },

  getCashMovements: (): CashMovement[] => getItem(STORAGE_KEYS.CASH_MOVEMENTS, []),
  addCashMovement: async (movement: CashMovement) => {
    const list = getItem<CashMovement[]>(STORAGE_KEYS.CASH_MOVEMENTS, []);
    setItem(STORAGE_KEYS.CASH_MOVEMENTS, [movement, ...list]);
    await api.createCashMovement(movement);
  },

  getSuppliers: (): Supplier[] => getItem(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS),
  saveSuppliers: (suppliers: Supplier[]) => {
    setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
    api.saveSuppliers(suppliers).catch(console.error);
  },

  getPurchases: (): Purchase[] => getItem(STORAGE_KEYS.PURCHASES, []),
  savePurchases: (purchases: Purchase[]) => setItem(STORAGE_KEYS.PURCHASES, purchases),

  getInvoices: (): Invoice[] => getItem(STORAGE_KEYS.INVOICES, []),
  saveInvoices: (invoices: Invoice[]) => setItem(STORAGE_KEYS.INVOICES, invoices),

  getAiScans: (): AiScanRecord[] => getItem(STORAGE_KEYS.AI_SCANS, []),
  addAiScan: async (scan: AiScanRecord) => {
    const list = getItem<AiScanRecord[]>(STORAGE_KEYS.AI_SCANS, []);
    setItem(STORAGE_KEYS.AI_SCANS, [scan, ...list]);
    await api.saveAiScan(scan);
  },

  getActivityLogs: (): ActivityLog[] => getItem(STORAGE_KEYS.ACTIVITY_LOGS, []),
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'created_at'>) => {
    const list = getItem<ActivityLog[]>(STORAGE_KEYS.ACTIVITY_LOGS, []);
    const entry: ActivityLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      created_at: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.ACTIVITY_LOGS, [entry, ...list]);
  },

  getUsers: (): UserProfile[] => getItem(STORAGE_KEYS.USERS, INITIAL_DEMO_USERS),
  saveUsers: (users: UserProfile[]) => setItem(STORAGE_KEYS.USERS, users),
  createUser: async (user: Partial<UserProfile> & { password?: string }) => {
    const res = await api.createUser(user);
    if (res) {
      const list = getItem<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_DEMO_USERS);
      setItem(STORAGE_KEYS.USERS, [...list, res]);
    }
    return res;
  },

  getCurrentUser: (): UserProfile => getItem(STORAGE_KEYS.CURRENT_USER, INITIAL_DEMO_USERS[0]),
  setCurrentUser: (user: UserProfile) => setItem(STORAGE_KEYS.CURRENT_USER, user),

  getNotifications: (): AppNotification[] => getItem(STORAGE_KEYS.NOTIFICATIONS, []),
  saveNotifications: (notifications: AppNotification[]) =>
    setItem(STORAGE_KEYS.NOTIFICATIONS, notifications),
  addNotification: (notification: Omit<AppNotification, 'id' | 'created_at' | 'read'>) => {
    const list = getItem<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const entry: AppNotification = {
      ...notification,
      id: `notif-${Date.now()}`,
      read: false,
      created_at: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.NOTIFICATIONS, [entry, ...list]);
  },

  getFavorites: (): string[] => getItem(STORAGE_KEYS.FAVORITES, ['prod-01', 'prod-04']),
  saveFavorites: (favorites: string[]) => setItem(STORAGE_KEYS.FAVORITES, favorites),

  // Expenses Management
  getExpenses: (): Expense[] => getItem(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES),
  saveExpenses: (expenses: Expense[]) => {
    setItem(STORAGE_KEYS.EXPENSES, expenses);
    api.saveExpenses(expenses).catch(console.error);
  },
  addExpense: (expense: Omit<Expense, 'id' | 'created_at'>) => {
    const list = getItem<Expense[]>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
    const newEntry: Expense = {
      ...expense,
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.EXPENSES, [newEntry, ...list]);
    api.createExpense(newEntry).catch(console.error);
    return newEntry;
  },
  updateExpense: (id: string, updates: Partial<Expense>) => {
    const list = getItem<Expense[]>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
    const updated = list.map((e) => (e.id === id ? { ...e, ...updates } : e));
    setItem(STORAGE_KEYS.EXPENSES, updated);
    api.updateExpense(id, updates).catch(console.error);
  },
  deleteExpense: (id: string) => {
    const list = getItem<Expense[]>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
    setItem(STORAGE_KEYS.EXPENSES, list.filter((e) => e.id !== id));
    api.deleteExpense(id).catch(console.error);
  },

  // Services & Copy Prices Management
  getServices: (): ServiceItem[] => getItem(STORAGE_KEYS.SERVICES, INITIAL_SERVICES),
  saveServices: (services: ServiceItem[]) => {
    setItem(STORAGE_KEYS.SERVICES, services);
    api.saveServices(services).catch(console.error);
  },
  addService: (service: Omit<ServiceItem, 'id' | 'created_at'>) => {
    const list = getItem<ServiceItem[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
    const newService: ServiceItem = {
      ...service,
      id: `srv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.SERVICES, [...list, newService]);
    api.createService(newService).catch(console.error);
    return newService;
  },
  updateService: (id: string, updates: Partial<ServiceItem>) => {
    const list = getItem<ServiceItem[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
    const updated = list.map((s) => (s.id === id ? { ...s, ...updates } : s));
    setItem(STORAGE_KEYS.SERVICES, updated);
    api.updateService(id, updates).catch(console.error);
  },
  deleteService: (id: string) => {
    const list = getItem<ServiceItem[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
    setItem(STORAGE_KEYS.SERVICES, list.filter((s) => s.id !== id));
    api.deleteService(id).catch(console.error);
  },
  resetDefaultServices: () => {
    setItem(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
    api.saveServices(INITIAL_SERVICES).catch(console.error);
    return INITIAL_SERVICES;
  },
};
