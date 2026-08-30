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
  INITIAL_USERS,
  INITIAL_SETTINGS,
  INITIAL_SERVICES,
  INITIAL_EXPENSES,
} from './mockData';
import { api, BootstrapData } from './api';
import { supabase, isSupabaseConfigured } from './supabase';

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
    console.error(`Error caching data [${key}]:`, err);
  }
}

export const DEFAULT_GUEST_USER: UserProfile = {
  id: 'usr-guest-customer',
  name: 'Cliente Invitado',
  email: 'invitado@bikie.gq',
  phone: '',
  role: 'admin', // placeholder typing, UI checks if authenticated
  points: 0,
  created_at: new Date().toISOString(),
};

const ADMIN_SESSION_KEY = 'bikie_admin_session_auth_v1';
const ADMIN_SESSION_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes strict security expiration

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
    setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
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
        if (data.sales) setItem(STORAGE_KEYS.SALES, data.sales);
        if (data.activity_logs) setItem(STORAGE_KEYS.ACTIVITY_LOGS, data.activity_logs);
        if (data.expenses) setItem(STORAGE_KEYS.EXPENSES, data.expenses);
        if (data.services?.length) setItem(STORAGE_KEYS.SERVICES, data.services);
        return data;
      }
    } catch (err) {
      console.error('Error in storageService.syncWithDatabase:', err);
    }
    return null;
  },

  // Settings
  getSettings: (): StoreSettings => getItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS),
  saveSettings: (settings: StoreSettings) => {
    setItem(STORAGE_KEYS.SETTINGS, settings);
    api.updateSettings(settings).catch((e) => console.error(e));
  },

  // Categories
  getCategories: (): Category[] => getItem(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES),
  saveCategory: (category: Category) => {
    const list = storageService.getCategories();
    const idx = list.findIndex((c) => c.id === category.id);
    if (idx >= 0) {
      list[idx] = category;
    } else {
      list.push(category);
    }
    setItem(STORAGE_KEYS.CATEGORIES, list);
    api.createCategory(category).catch((e) => console.error(e));
  },
  addCategory: (category: Category) => {
    storageService.saveCategory(category);
  },
  updateCategory: (id: string, updates: Partial<Category>) => {
    const list = storageService.getCategories();
    const idx = list.findIndex((c) => c.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates };
      setItem(STORAGE_KEYS.CATEGORIES, list);
      api.updateCategory(id, updates).catch((e) => console.error(e));
    }
  },
  saveCategories: (categories: Category[]) => {
    setItem(STORAGE_KEYS.CATEGORIES, categories);
  },
  deleteCategory: (id: string) => {
    const list = storageService.getCategories().filter((c) => c.id !== id);
    setItem(STORAGE_KEYS.CATEGORIES, list);
    api.deleteCategory(id).catch((e) => console.error(e));
  },

  // Products
  getProducts: (): Product[] => getItem(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS),
  getProductById: (id: string): Product | undefined => {
    return storageService.getProducts().find((p) => p.id === id);
  },
  saveProduct: (product: Product) => {
    const list = storageService.getProducts();
    const idx = list.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      list[idx] = product;
    } else {
      list.unshift(product);
    }
    setItem(STORAGE_KEYS.PRODUCTS, list);
    api.createProduct(product).catch((e) => console.error(e));
  },
  addProduct: (product: Product) => {
    storageService.saveProduct(product);
  },
  updateProduct: (id: string, updates: Partial<Product>) => {
    const list = storageService.getProducts();
    const idx = list.findIndex((p) => p.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates };
      setItem(STORAGE_KEYS.PRODUCTS, list);
      api.updateProduct(id, updates).catch((e) => console.error(e));
    }
  },
  saveProducts: (products: Product[]) => {
    setItem(STORAGE_KEYS.PRODUCTS, products);
    api.saveProducts(products).catch((e) => console.error(e));
  },
  deleteProduct: (id: string) => {
    const list = storageService.getProducts().filter((p) => p.id !== id);
    setItem(STORAGE_KEYS.PRODUCTS, list);
    api.deleteProduct(id).catch((e) => console.error(e));
  },
  updateProductStock: (id: string, newStock: number, reason: string, userName: string = 'Administradora') => {
    const list = storageService.getProducts();
    const p = list.find((item) => item.id === id);
    if (!p) return;
    const prev = p.stock;
    p.stock = Math.max(0, newStock);
    if (p.stock === 0) p.status = 'out_of_stock';
    else if (p.status === 'out_of_stock' && p.stock > 0) p.status = 'active';
    setItem(STORAGE_KEYS.PRODUCTS, list);

    const movement: InventoryMovement = {
      id: `mov-${Date.now()}`,
      product_id: p.id,
      product_name: p.name,
      type: newStock > prev ? 'adjustment' : 'sale',
      quantity: Math.abs(newStock - prev),
      previous_stock: prev,
      new_stock: p.stock,
      reason,
      user_name: userName,
      created_at: new Date().toISOString(),
    };
    storageService.addInventoryMovement(movement);
    api.updateProduct(p.id, { stock: p.stock, status: p.status }).catch((e) => console.error(e));
  },

  // Stock Management (Single or Bulk Deduction)
  deductStock: (
    itemsOrId: { product_id: string; quantity: number }[] | string,
    reasonOrQty?: string | number,
    userName = 'Sistema de Ventas'
  ): { success: boolean; error?: string } => {
    const list = storageService.getProducts();
    
    if (typeof itemsOrId === 'string') {
      const p = list.find((item) => item.id === itemsOrId);
      if (!p) return { success: false, error: 'Producto no encontrado' };
      const qty = typeof reasonOrQty === 'number' ? reasonOrQty : 1;
      const prev = p.stock;
      p.stock = Math.max(0, p.stock - qty);
      if (p.stock === 0) p.status = 'out_of_stock';
      setItem(STORAGE_KEYS.PRODUCTS, list);

      const movement: InventoryMovement = {
        id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        product_id: p.id,
        product_name: p.name,
        type: 'sale',
        quantity: qty,
        previous_stock: prev,
        new_stock: p.stock,
        reason: 'Venta realizada',
        user_name: userName,
        created_at: new Date().toISOString(),
      };
      storageService.addInventoryMovement(movement);
      api.updateProduct(p.id, { stock: p.stock, status: p.status }).catch((e) => console.error(e));
      return { success: true };
    }

    // Bulk items array
    const items = itemsOrId;
    const reason = typeof reasonOrQty === 'string' ? reasonOrQty : 'Venta web / pedido';

    // Verify stock availability
    for (const item of items) {
      const p = list.find((prod) => prod.id === item.product_id);
      if (p && p.stock < item.quantity) {
        return {
          success: false,
          error: `Stock insuficiente para ${p.name}. Disponible: ${p.stock}, Solicitado: ${item.quantity}`,
        };
      }
    }

    // Deduct stock and record movements
    for (const item of items) {
      const p = list.find((prod) => prod.id === item.product_id);
      if (p) {
        const prev = p.stock;
        p.stock = Math.max(0, p.stock - item.quantity);
        if (p.stock === 0) p.status = 'out_of_stock';

        const movement: InventoryMovement = {
          id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          product_id: p.id,
          product_name: p.name,
          type: 'sale',
          quantity: item.quantity,
          previous_stock: prev,
          new_stock: p.stock,
          reason,
          user_name: userName,
          created_at: new Date().toISOString(),
        };
        storageService.addInventoryMovement(movement);
        api.updateProduct(p.id, { stock: p.stock, status: p.status }).catch((e) => console.error(e));
      }
    }

    setItem(STORAGE_KEYS.PRODUCTS, list);
    return { success: true };
  },

  // Services
  getServices: (): ServiceItem[] => getItem(STORAGE_KEYS.SERVICES, INITIAL_SERVICES),
  saveService: (service: ServiceItem) => {
    const list = storageService.getServices();
    const idx = list.findIndex((s) => s.id === service.id);
    if (idx >= 0) {
      list[idx] = service;
    } else {
      list.push(service);
    }
    setItem(STORAGE_KEYS.SERVICES, list);
    api.createService(service).catch((e) => console.error(e));
  },
  deleteService: (id: string) => {
    const list = storageService.getServices().filter((s) => s.id !== id);
    setItem(STORAGE_KEYS.SERVICES, list);
    api.deleteService(id).catch((e) => console.error(e));
  },

  // Expenses
  getExpenses: (): Expense[] => getItem(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES),
  saveExpense: (expense: Expense) => {
    const list = storageService.getExpenses();
    const idx = list.findIndex((e) => e.id === expense.id);
    if (idx >= 0) {
      list[idx] = expense;
    } else {
      list.unshift(expense);
    }
    setItem(STORAGE_KEYS.EXPENSES, list);
    api.createExpense(expense).catch((e) => console.error(e));
  },
  deleteExpense: (id: string) => {
    const list = storageService.getExpenses().filter((e) => e.id !== id);
    setItem(STORAGE_KEYS.EXPENSES, list);
    api.deleteExpense(id).catch((e) => console.error(e));
  },

  // Orders
  getOrders: (): Order[] => getItem(STORAGE_KEYS.ORDERS, []),
  saveOrder: (order: Order) => {
    const list = storageService.getOrders();
    const idx = list.findIndex((o) => o.id === order.id);
    if (idx >= 0) {
      list[idx] = order;
    } else {
      list.unshift(order);
    }
    setItem(STORAGE_KEYS.ORDERS, list);
    api.createOrder(order).catch((e) => console.error(e));
  },
  saveOrders: (orders: Order[]) => {
    setItem(STORAGE_KEYS.ORDERS, orders);
    api.saveOrders(orders).catch((e) => console.error(e));
  },
  updateOrderStatus: (id: string, status: Order['status'], payment_status?: Order['payment_status']) => {
    const list = storageService.getOrders();
    const order = list.find((o) => o.id === id);
    if (order) {
      order.status = status;
      if (payment_status) order.payment_status = payment_status;
      setItem(STORAGE_KEYS.ORDERS, list);
      api.updateOrderStatus(id, status, payment_status).catch((e) => console.error(e));
    }
  },

  // Sales (POS & Online)
  getSales: (): Sale[] => getItem(STORAGE_KEYS.SALES, []),
  saveSale: (sale: Sale) => {
    const list = storageService.getSales();
    list.unshift(sale);
    setItem(STORAGE_KEYS.SALES, list);
    api.createSale(sale).catch((e) => console.error(e));
  },

  // Inventory Movements (Kardex)
  getInventoryMovements: (): InventoryMovement[] => getItem(STORAGE_KEYS.INVENTORY_MOVEMENTS, []),
  addInventoryMovement: (movement: InventoryMovement) => {
    const list = storageService.getInventoryMovements();
    list.unshift(movement);
    setItem(STORAGE_KEYS.INVENTORY_MOVEMENTS, list);
    api.createInventoryMovement(movement).catch((e) => console.error(e));
  },

  // Cash Register
  getCashRegisters: (): CashRegister[] => getItem(STORAGE_KEYS.CASH_REGISTERS, []),
  getCurrentCashRegister: (): CashRegister | undefined => {
    const list = storageService.getCashRegisters();
    return list.find((c) => c.status === 'open');
  },
  saveCashRegister: (reg: CashRegister) => {
    const list = storageService.getCashRegisters();
    const idx = list.findIndex((c) => c.id === reg.id);
    if (idx >= 0) {
      list[idx] = reg;
    } else {
      list.unshift(reg);
    }
    setItem(STORAGE_KEYS.CASH_REGISTERS, list);
    api.createCashRegister(reg).catch((e) => console.error(e));
  },
  getCashMovements: (): CashMovement[] => getItem(STORAGE_KEYS.CASH_MOVEMENTS, []),
  addCashMovement: (movement: CashMovement) => {
    const list = storageService.getCashMovements();
    list.unshift(movement);
    setItem(STORAGE_KEYS.CASH_MOVEMENTS, list);
    api.createCashMovement(movement).catch((e) => console.error(e));
  },

  // Suppliers & Purchases
  getSuppliers: (): Supplier[] => getItem(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS),
  saveSupplier: (sup: Supplier) => {
    const list = storageService.getSuppliers();
    const idx = list.findIndex((s) => s.id === sup.id);
    if (idx >= 0) {
      list[idx] = sup;
    } else {
      list.push(sup);
    }
    setItem(STORAGE_KEYS.SUPPLIERS, list);
    api.createSupplier(sup).catch((e) => console.error(e));
  },
  saveSuppliers: (suppliers: Supplier[]) => {
    setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
    api.saveSuppliers(suppliers).catch((e) => console.error(e));
  },
  getPurchases: (): Purchase[] => getItem(STORAGE_KEYS.PURCHASES, []),
  savePurchase: (purchase: Purchase) => {
    const list = storageService.getPurchases();
    const idx = list.findIndex((p) => p.id === purchase.id);
    if (idx >= 0) {
      list[idx] = purchase;
    } else {
      list.unshift(purchase);
    }
    setItem(STORAGE_KEYS.PURCHASES, list);
  },

  // Offers & Coupons
  getOffers: (): Offer[] => getItem(STORAGE_KEYS.OFFERS, INITIAL_OFFERS),
  saveOffer: (offer: Offer) => {
    const list = storageService.getOffers();
    const idx = list.findIndex((o) => o.id === offer.id);
    if (idx >= 0) list[idx] = offer;
    else list.push(offer);
    setItem(STORAGE_KEYS.OFFERS, list);
  },
  deleteOffer: (id: string) => {
    const list = storageService.getOffers().filter((o) => o.id !== id);
    setItem(STORAGE_KEYS.OFFERS, list);
  },
  getCoupons: (): Coupon[] => getItem(STORAGE_KEYS.COUPONS, INITIAL_COUPONS),
  saveCoupon: (coupon: Coupon) => {
    const list = storageService.getCoupons();
    const idx = list.findIndex((c) => c.id === coupon.id);
    if (idx >= 0) list[idx] = coupon;
    else list.push(coupon);
    setItem(STORAGE_KEYS.COUPONS, list);
  },
  deleteCoupon: (id: string) => {
    const list = storageService.getCoupons().filter((c) => c.id !== id);
    setItem(STORAGE_KEYS.COUPONS, list);
  },

  // School Packs & Lists
  getSchoolPacks: (): SchoolPack[] => getItem(STORAGE_KEYS.SCHOOL_PACKS, INITIAL_SCHOOL_PACKS),
  saveSchoolPack: (pack: SchoolPack) => {
    const list = storageService.getSchoolPacks();
    const idx = list.findIndex((p) => p.id === pack.id);
    if (idx >= 0) list[idx] = pack;
    else list.push(pack);
    setItem(STORAGE_KEYS.SCHOOL_PACKS, list);
  },
  deleteSchoolPack: (id: string) => {
    const list = storageService.getSchoolPacks().filter((p) => p.id !== id);
    setItem(STORAGE_KEYS.SCHOOL_PACKS, list);
  },
  getSchoolLists: (): SchoolList[] => getItem(STORAGE_KEYS.SCHOOL_LISTS, INITIAL_SCHOOL_LISTS),
  saveSchoolList: (schoolList: SchoolList) => {
    const list = storageService.getSchoolLists();
    const idx = list.findIndex((l) => l.id === schoolList.id);
    if (idx >= 0) list[idx] = schoolList;
    else list.push(schoolList);
    setItem(STORAGE_KEYS.SCHOOL_LISTS, list);
  },
  deleteSchoolList: (id: string) => {
    const list = storageService.getSchoolLists().filter((l) => l.id !== id);
    setItem(STORAGE_KEYS.SCHOOL_LISTS, list);
  },

  // AI Scans Records
  getAiScans: (): AiScanRecord[] => getItem(STORAGE_KEYS.AI_SCANS, []),
  saveAiScan: (scan: AiScanRecord) => {
    const list = storageService.getAiScans();
    list.unshift(scan);
    setItem(STORAGE_KEYS.AI_SCANS, list);
    api.createAiScan(scan).catch((e) => console.error(e));
  },
  addAiScan: (scan: Partial<AiScanRecord>): AiScanRecord => {
    const item: AiScanRecord = {
      id: scan.id || `scan-${Date.now()}`,
      raw_text: scan.raw_text || '',
      detected_items_count: scan.detected_items_count || (scan as any).items_detected || 0,
      matched_items_count: scan.matched_items_count || (scan as any).matched_products || 0,
      confidence_avg: scan.confidence_avg || 85,
      total_estimated: scan.total_estimated || (scan as any).total_estimated_xaf || 0,
      created_at: scan.created_at || new Date().toISOString(),
      items: scan.items || [],
      ...scan,
    };
    storageService.saveAiScan(item);
    return item;
  },

  // Notifications
  addNotification: (notification: any) => {
    const list = getItem('bikie_notifications', []);
    list.unshift({
      id: `notif-${Date.now()}`,
      ...notification,
      created_at: new Date().toISOString(),
    });
    setItem('bikie_notifications', list.slice(0, 50));
  },

  // Activity Logs
  getActivityLogs: (): ActivityLog[] => getItem(STORAGE_KEYS.ACTIVITY_LOGS, []),
  logActivity: (actionOrObj: string | any, entity?: string, entity_id?: string, details?: string, userName = 'María Lidia (Administradora)', userRole = 'admin') => {
    let log: ActivityLog;
    if (typeof actionOrObj === 'object' && actionOrObj !== null) {
      log = {
        id: actionOrObj.id || `log-${Date.now()}`,
        user_name: actionOrObj.user_name || userName,
        user_role: actionOrObj.user_role || userRole,
        action: actionOrObj.action || 'Acción',
        entity: actionOrObj.entity,
        entity_id: actionOrObj.entity_id,
        details: actionOrObj.details,
        created_at: actionOrObj.created_at || new Date().toISOString(),
      };
    } else {
      log = {
        id: `log-${Date.now()}`,
        user_name: userName,
        user_role: userRole,
        action: String(actionOrObj),
        entity,
        entity_id,
        details,
        created_at: new Date().toISOString(),
      };
    }
    const list = storageService.getActivityLogs();
    list.unshift(log);
    setItem(STORAGE_KEYS.ACTIVITY_LOGS, list.slice(0, 200));
    api.logActivity(log).catch((e) => console.error(e));
  },
  addActivityLog: (actionOrObj: string | any, entity?: string, entity_id?: string, details?: string, userName = 'María Lidia (Administradora)', userRole = 'admin') => {
    storageService.logActivity(actionOrObj, entity, entity_id, details, userName, userRole);
  },

  // Expenses helper methods
  addExpense: (expense: Partial<Expense>): Expense => {
    const item: Expense = {
      id: expense.id || `exp-${Date.now()}`,
      concept: expense.concept || '',
      category: (expense.category as any) || 'other',
      amount: Number(expense.amount) || 0,
      date: expense.date || new Date().toISOString().split('T')[0],
      beneficiary: expense.beneficiary || '',
      payment_method: (expense.payment_method as any) || 'cash',
      registered_by: expense.registered_by || 'Administradora',
      notes: expense.notes || '',
      created_at: expense.created_at || new Date().toISOString(),
      ...expense,
    };
    storageService.saveExpense(item);
    return item;
  },
  updateExpense: (id: string, updates: Partial<Expense>) => {
    const list = storageService.getExpenses();
    const idx = list.findIndex((e) => e.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates };
      setItem(STORAGE_KEYS.EXPENSES, list);
      api.updateExpense(id, updates).catch((e) => console.error(e));
    }
  },

  // Offers helper methods
  createOffer: (offer: Partial<Offer>) => {
    const item: Offer = {
      id: offer.id || `off-${Date.now()}`,
      name: offer.name || (offer as any).title || 'Oferta Especial',
      description: offer.description || '',
      type: offer.type || 'percentage',
      discount_value: offer.discount_value !== undefined ? offer.discount_value : ((offer as any).discount_percentage || 10),
      product_ids: offer.product_ids || [],
      category_ids: offer.category_ids || [],
      start_date: offer.start_date || new Date().toISOString(),
      end_date: offer.end_date || (offer as any).valid_until || new Date(Date.now() + 30 * 86400000).toISOString(),
      status: offer.status || 'active',
      ...offer,
    };
    storageService.saveOffer(item);
    return item;
  },
  updateOffer: (idOrOffer: string | Offer, updates?: Partial<Offer>) => {
    if (typeof idOrOffer === 'string') {
      const list = storageService.getOffers();
      const idx = list.findIndex((o) => o.id === idOrOffer);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...(updates || {}) };
        setItem(STORAGE_KEYS.OFFERS, list);
      }
    } else {
      storageService.saveOffer(idOrOffer);
    }
  },

  // Orders and Sales helper methods
  updateOrder: (idOrOrder: string | Order, updates?: Partial<Order>) => {
    if (typeof idOrOrder === 'string') {
      const list = storageService.getOrders();
      const idx = list.findIndex((o) => o.id === idOrOrder);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...(updates || {}) };
        setItem(STORAGE_KEYS.ORDERS, list);
      }
    } else {
      storageService.saveOrder(idOrOrder);
    }
  },
  deleteOrder: (id: string) => {
    const list = storageService.getOrders().filter((o) => o.id !== id);
    setItem(STORAGE_KEYS.ORDERS, list);
    api.deleteOrder(id).catch((e) => console.error(e));
  },
  addSale: (sale: Sale) => {
    storageService.saveSale(sale);
  },
  updateSale: (idOrSale: string | Sale, updates?: Partial<Sale>) => {
    if (typeof idOrSale === 'string') {
      const list = storageService.getSales();
      const idx = list.findIndex((s) => s.id === idOrSale);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...(updates || {}) };
        setItem(STORAGE_KEYS.SALES, list);
        api.createSale(list[idx]).catch((e) => console.error(e));
      }
    } else {
      const list = storageService.getSales();
      const idx = list.findIndex((s) => s.id === idOrSale.id);
      if (idx >= 0) list[idx] = idOrSale;
      else list.unshift(idOrSale);
      setItem(STORAGE_KEYS.SALES, list);
      api.createSale(idOrSale).catch((e) => console.error(e));
    }
  },
  deleteSale: (id: string) => {
    const list = storageService.getSales().filter((s) => s.id !== id);
    setItem(STORAGE_KEYS.SALES, list);
  },
  updateCashRegister: (idOrReg: string | CashRegister, updates?: Partial<CashRegister>) => {
    if (typeof idOrReg === 'string') {
      const list = storageService.getCashRegisters();
      const idx = list.findIndex((c) => c.id === idOrReg);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...(updates || {}) };
        setItem(STORAGE_KEYS.CASH_REGISTERS, list);
        api.updateCashRegister(idOrReg, updates || {}).catch((e) => console.error(e));
      }
    } else {
      storageService.saveCashRegister(idOrReg);
    }
  },
  saveCashRegisters: (registers: CashRegister[]) => {
    setItem(STORAGE_KEYS.CASH_REGISTERS, registers);
  },

  // Services helper methods
  addService: (service: Partial<ServiceItem>): ServiceItem => {
    const item: ServiceItem = {
      id: service.id || `srv-${Date.now()}`,
      name: service.name || '',
      price: Number(service.price) || 0,
      category: (service.category as any) || 'other',
      unit: service.unit || 'unidad',
      is_active: service.is_active !== undefined ? service.is_active : true,
      created_at: service.created_at || new Date().toISOString(),
      ...service,
    };
    storageService.saveService(item);
    return item;
  },
  updateService: (idOrService: string | ServiceItem, updates?: Partial<ServiceItem>) => {
    if (typeof idOrService === 'string') {
      const list = storageService.getServices();
      const idx = list.findIndex((s) => s.id === idOrService);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...(updates || {}) };
        setItem(STORAGE_KEYS.SERVICES, list);
        api.updateService(idOrService, updates || {}).catch((e) => console.error(e));
      }
    } else {
      storageService.saveService(idOrService);
    }
  },
  resetDefaultServices: () => {
    setItem(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
    api.saveServices(INITIAL_SERVICES).catch((e) => console.error(e));
  },

  // Users (Admin Profile) - Stored in sessionStorage with strict expiration timestamp
  getUsers: (): UserProfile[] => getItem(STORAGE_KEYS.USERS, INITIAL_USERS),
  getCurrentUser: (): UserProfile => {
    try {
      if (typeof window === 'undefined') return DEFAULT_GUEST_USER;
      const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
      if (!raw) return DEFAULT_GUEST_USER;
      const parsed = JSON.parse(raw);
      if (parsed?.user && parsed?.expiresAt) {
        if (Date.now() > parsed.expiresAt) {
          sessionStorage.removeItem(ADMIN_SESSION_KEY);
          return DEFAULT_GUEST_USER;
        }
        return parsed.user;
      }
      return DEFAULT_GUEST_USER;
    } catch {
      return DEFAULT_GUEST_USER;
    }
  },
  setCurrentUser: (user: UserProfile) => {
    try {
      if (typeof window === 'undefined') return;
      if (user.id === DEFAULT_GUEST_USER.id) {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
      } else {
        sessionStorage.setItem(
          ADMIN_SESSION_KEY,
          JSON.stringify({
            user,
            loginTime: Date.now(),
            expiresAt: Date.now() + ADMIN_SESSION_MAX_AGE_MS,
          })
        );
      }
    } catch (e) {
      console.warn('Could not store session in sessionStorage:', e);
    }
  },
  clearAdminSession: () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
      }
    } catch (e) {
      console.warn('Error clearing admin session:', e);
    }
  },
};
