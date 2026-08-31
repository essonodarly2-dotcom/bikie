import {
  Product,
  Category,
  Order,
  OrderItem,
  PaymentMethod,
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
import { supabase, isSupabaseConfigured, supabaseDbService } from './supabase';

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
  // Sync all entities with backend DB and Supabase
  syncWithDatabase: async (): Promise<BootstrapData | null> => {
    try {
      // 1. Try direct Supabase bootstrap first
      const supabaseData = await supabaseDbService.bootstrapAll();
      if (supabaseData) {
        if (supabaseData.settings) setItem(STORAGE_KEYS.SETTINGS, supabaseData.settings);
        if (supabaseData.categories?.length) setItem(STORAGE_KEYS.CATEGORIES, supabaseData.categories);
        if (supabaseData.products?.length) setItem(STORAGE_KEYS.PRODUCTS, supabaseData.products);
        if (supabaseData.orders) setItem(STORAGE_KEYS.ORDERS, supabaseData.orders);
        if (supabaseData.offers) setItem(STORAGE_KEYS.OFFERS, supabaseData.offers);
        if (supabaseData.coupons) setItem(STORAGE_KEYS.COUPONS, supabaseData.coupons);
        if (supabaseData.school_packs) setItem(STORAGE_KEYS.SCHOOL_PACKS, supabaseData.school_packs);
        if (supabaseData.school_lists) setItem(STORAGE_KEYS.SCHOOL_LISTS, supabaseData.school_lists);
        if (supabaseData.suppliers) setItem(STORAGE_KEYS.SUPPLIERS, supabaseData.suppliers);
        if (supabaseData.cash_registers) setItem(STORAGE_KEYS.CASH_REGISTERS, supabaseData.cash_registers);
        if (supabaseData.cash_movements) setItem(STORAGE_KEYS.CASH_MOVEMENTS, supabaseData.cash_movements);
        if (supabaseData.inventory_movements) setItem(STORAGE_KEYS.INVENTORY_MOVEMENTS, supabaseData.inventory_movements);
        if (supabaseData.sales) setItem(STORAGE_KEYS.SALES, supabaseData.sales);
        if (supabaseData.activity_logs) setItem(STORAGE_KEYS.ACTIVITY_LOGS, supabaseData.activity_logs);
        if (supabaseData.expenses) setItem(STORAGE_KEYS.EXPENSES, supabaseData.expenses);
        if (supabaseData.services?.length) setItem(STORAGE_KEYS.SERVICES, supabaseData.services);
        if (supabaseData.ai_scans) setItem(STORAGE_KEYS.AI_SCANS, supabaseData.ai_scans);
        return supabaseData as BootstrapData;
      }

      // 2. Fallback to API bootstrap
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
    supabaseDbService.updateSettings(settings).catch((e) => console.error(e));
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
    supabaseDbService.saveCategory(category).catch((e) => console.error(e));
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
      supabaseDbService.saveCategory(list[idx]).catch((e) => console.error(e));
      api.updateCategory(id, updates).catch((e) => console.error(e));
    }
  },
  saveCategories: (categories: Category[]) => {
    setItem(STORAGE_KEYS.CATEGORIES, categories);
    categories.forEach((cat) => supabaseDbService.saveCategory(cat).catch((e) => console.error(e)));
  },
  deleteCategory: (id: string) => {
    const list = storageService.getCategories().filter((c) => c.id !== id);
    setItem(STORAGE_KEYS.CATEGORIES, list);
    supabaseDbService.deleteCategory(id).catch((e) => console.error(e));
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
    supabaseDbService.saveProduct(product).catch((e) => console.error(e));
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
      supabaseDbService.saveProduct(list[idx]).catch((e) => console.error(e));
      api.updateProduct(id, updates).catch((e) => console.error(e));
    }
  },
  saveProducts: (products: Product[]) => {
    setItem(STORAGE_KEYS.PRODUCTS, products);
    products.forEach((p) => supabaseDbService.saveProduct(p).catch((e) => console.error(e)));
    api.saveProducts(products).catch((e) => console.error(e));
  },
  deleteProduct: (id: string) => {
    const list = storageService.getProducts().filter((p) => p.id !== id);
    setItem(STORAGE_KEYS.PRODUCTS, list);
    supabaseDbService.deleteProduct(id).catch((e) => console.error(e));
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
    supabaseDbService.saveProduct(p).catch((e) => console.error(e));
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
      supabaseDbService.saveProduct(p).catch((e) => console.error(e));
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
        supabaseDbService.saveProduct(p).catch((e) => console.error(e));
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
    supabaseDbService.saveService(service).catch((e) => console.error(e));
    api.createService(service).catch((e) => console.error(e));
  },
  deleteService: (id: string) => {
    const list = storageService.getServices().filter((s) => s.id !== id);
    setItem(STORAGE_KEYS.SERVICES, list);
    supabaseDbService.deleteService(id).catch((e) => console.error(e));
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
    supabaseDbService.createExpense(expense).catch((e) => console.error(e));
    api.createExpense(expense).catch((e) => console.error(e));
  },
  deleteExpense: (id: string) => {
    const list = storageService.getExpenses().filter((e) => e.id !== id);
    setItem(STORAGE_KEYS.EXPENSES, list);
    supabaseDbService.deleteExpense(id).catch((e) => console.error(e));
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
    supabaseDbService.createOrder(order).catch((e) => console.error(e));
    api.createOrder(order).catch((e) => console.error(e));
  },
  saveOrders: (orders: Order[]) => {
    setItem(STORAGE_KEYS.ORDERS, orders);
    orders.forEach((o) => supabaseDbService.createOrder(o).catch((e) => console.error(e)));
    api.saveOrders(orders).catch((e) => console.error(e));
  },
  updateOrderStatus: (
    id: string,
    status: Order['status'],
    payment_status?: Order['payment_status'],
    actorName = 'María Lidia (Administradora)',
    note?: string
  ) => {
    const list = storageService.getOrders();
    const order = list.find((o) => o.id === id);
    if (order) {
      const prevStatus = order.status;
      order.status = status;
      if (payment_status) order.payment_status = payment_status;
      order.updated_at = new Date().toISOString();

      if (!order.history) order.history = [];
      order.history.push({
        status,
        timestamp: new Date().toISOString(),
        actor: actorName,
        note: note || `Cambio de estado: ${prevStatus} ➔ ${status}`,
      });

      setItem(STORAGE_KEYS.ORDERS, list);
      supabaseDbService.createOrder(order).catch((e) => console.error(e));
      api.createOrder(order).catch((e) => console.error(e));

      storageService.addActivityLog({
        user_name: actorName,
        user_role: 'admin',
        action: `Actualizó estado del pedido ${order.code}`,
        entity: 'order',
        entity_id: order.id,
        details: `Nuevo estado: ${status}${note ? ' (' + note + ')' : ''}`,
      });
    }
  },

  acceptOrder: (id: string, actorName = 'María Lidia (Administradora)'): { success: boolean; error?: string } => {
    const list = storageService.getOrders();
    const order = list.find((o) => o.id === id);
    if (!order) return { success: false, error: 'Pedido no encontrado' };

    order.status = 'confirmed';
    order.accepted_at = new Date().toISOString();
    order.accepted_by = actorName;
    order.updated_at = new Date().toISOString();

    if (!order.history) order.history = [];
    order.history.push({
      status: 'confirmed',
      timestamp: new Date().toISOString(),
      actor: actorName,
      note: 'Pedido aceptado y confirmado para preparación',
    });

    setItem(STORAGE_KEYS.ORDERS, list);
    supabaseDbService.createOrder(order).catch((e) => console.error(e));
    api.createOrder(order).catch((e) => console.error(e));

    storageService.addActivityLog({
      user_name: actorName,
      user_role: 'admin',
      action: `Aceptó pedido ${order.code}`,
      entity: 'order',
      entity_id: order.id,
      details: `Pedido confirmado por ${actorName} - Total: ${order.total} FCFA`,
    });

    return { success: true };
  },

  cancelOrderAndRestock: (
    id: string,
    reason: string = 'Cancelado por administración',
    actorName = 'María Lidia (Administradora)'
  ): { success: boolean; error?: string } => {
    const list = storageService.getOrders();
    const order = list.find((o) => o.id === id);
    if (!order) return { success: false, error: 'Pedido no encontrado' };
    if (order.status === 'cancelled') return { success: false, error: 'El pedido ya está cancelado' };

    // Restore stock for all items
    const products = storageService.getProducts();
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        const prod = products.find((p) => p.id === item.product_id);
        if (prod) {
          const prev = prod.stock;
          prod.stock = prod.stock + item.quantity;
          if (prod.stock > 0 && prod.status === 'out_of_stock') prod.status = 'active';

          const mov: InventoryMovement = {
            id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            product_id: prod.id,
            product_name: prod.name,
            type: 'return',
            quantity: item.quantity,
            previous_stock: prev,
            new_stock: prod.stock,
            reason: `Devolución de stock por cancelación de pedido ${order.code}: ${reason}`,
            user_name: actorName,
            created_at: new Date().toISOString(),
          };
          storageService.addInventoryMovement(mov);
          supabaseDbService.saveProduct(prod).catch((e) => console.error(e));
          api.updateProduct(prod.id, { stock: prod.stock, status: prod.status }).catch((e) => console.error(e));
        }
      }
      setItem(STORAGE_KEYS.PRODUCTS, products);
    }

    order.status = 'cancelled';
    order.cancellation_reason = reason;
    order.cancelled_at = new Date().toISOString();
    order.updated_at = new Date().toISOString();

    if (!order.history) order.history = [];
    order.history.push({
      status: 'cancelled',
      timestamp: new Date().toISOString(),
      actor: actorName,
      note: `Pedido cancelado: ${reason}. Stock reintegrado al inventario.`,
    });

    setItem(STORAGE_KEYS.ORDERS, list);
    supabaseDbService.createOrder(order).catch((e) => console.error(e));
    api.createOrder(order).catch((e) => console.error(e));

    storageService.addActivityLog({
      user_name: actorName,
      user_role: 'admin',
      action: `Canceló pedido ${order.code}`,
      entity: 'order',
      entity_id: order.id,
      details: `Motivo: ${reason}. Stock devuelto al inventario.`,
    });

    return { success: true };
  },

  chargeOrder: (
    id: string,
    paymentMethod: Order['payment_method'] = 'store',
    actorName = 'María Lidia (Administradora)',
    notes?: string
  ): { success: boolean; error?: string; sale?: Sale } => {
    const list = storageService.getOrders();
    const order = list.find((o) => o.id === id);
    if (!order) return { success: false, error: 'Pedido no encontrado' };
    if (order.payment_status === 'paid') return { success: false, error: 'Este pedido ya ha sido cobrado previamente' };

    const invoiceNumber = `FAC-ORD-${order.code.replace('BIKIE-', '')}`;

    order.payment_status = 'paid';
    order.payment_method = paymentMethod;
    order.paid_at = new Date().toISOString();
    order.paid_by = actorName;
    order.invoice_number = invoiceNumber;
    order.updated_at = new Date().toISOString();

    if (!order.history) order.history = [];
    order.history.push({
      status: order.status,
      timestamp: new Date().toISOString(),
      actor: actorName,
      note: `Cobro registrado: ${order.total} FCFA (${paymentMethod}). Factura: ${invoiceNumber}`,
    });

    setItem(STORAGE_KEYS.ORDERS, list);
    supabaseDbService.createOrder(order).catch((e) => console.error(e));
    api.createOrder(order).catch((e) => console.error(e));

    // Register sale
    const sale: Sale = {
      id: `sale-ord-${order.id}`,
      code: invoiceNumber,
      type: 'online',
      order_id: order.id,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      items: order.items,
      subtotal: order.subtotal,
      discount: order.discount,
      total: order.total,
      payment_method: paymentMethod,
      cashier_name: actorName,
      notes: notes ? `Cobro pedido ${order.code} - ${notes}` : `Cobro pedido ${order.code}`,
      status: 'completed',
      created_at: new Date().toISOString(),
    };
    storageService.saveSale(sale);

    // If payment is in cash/store, update open cash register
    if (paymentMethod === 'store') {
      const openReg = storageService.getCurrentCashRegister();
      if (openReg) {
        openReg.total_sales = Number(openReg.total_sales || 0) + order.total;
        openReg.total_in = Number(openReg.total_in || 0) + order.total;
        openReg.expected_amount = Number(openReg.expected_amount || 0) + order.total;
        storageService.saveCashRegister(openReg);

        const movement: CashMovement = {
          id: `csh-${Date.now()}`,
          register_id: openReg.id,
          type: 'sale',
          amount: order.total,
          reason: `Cobro Pedido ${order.code} (${order.customer_name})`,
          cashier_name: actorName,
          created_at: new Date().toISOString(),
        };
        storageService.addCashMovement(movement);
      }
    }

    storageService.addActivityLog({
      user_name: actorName,
      user_role: 'admin',
      action: `Cobró pedido ${order.code}`,
      entity: 'order',
      entity_id: order.id,
      details: `Cobro de ${order.total} FCFA registrado con éxito (${paymentMethod}). Factura: ${invoiceNumber}`,
    });

    return { success: true, sale };
  },

  // Sales (POS & Online)
  getSales: (): Sale[] => getItem(STORAGE_KEYS.SALES, []),
  saveSale: (sale: Sale) => {
    const list = storageService.getSales();
    const idx = list.findIndex((s) => s.id === sale.id);
    if (idx >= 0) {
      list[idx] = sale;
    } else {
      list.unshift(sale);
    }
    setItem(STORAGE_KEYS.SALES, list);
    supabaseDbService.createSale(sale).catch((e) => console.error(e));
    api.createSale(sale).catch((e) => console.error(e));
  },

  // Register a POS Counter Sale with full stock deduction, movement, cash register update, and Supabase sync
  registerPosSale: (
    saleData: {
      items: OrderItem[];
      subtotal: number;
      discount: number;
      total: number;
      payment_method: PaymentMethod;
      customer_name?: string;
      customer_phone?: string;
      cashier_name?: string;
      notes?: string;
    }
  ): { success: boolean; sale?: Sale; error?: string } => {
    const cashier = saleData.cashier_name || 'María Lidia (Administradora)';
    const customer = saleData.customer_name || 'Cliente Mostrador';

    // 1. Deduct stock for all items
    const stockRes = storageService.deductStock(
      saleData.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      `Venta mostrador POS: ${customer}`,
      cashier
    );
    if (!stockRes.success) {
      return { success: false, error: stockRes.error || 'Stock insuficiente' };
    }

    // 2. Generate unique sale code
    const existingSales = storageService.getSales();
    const saleCode = `BIK-POS-${(existingSales.length + 1).toString().padStart(6, '0')}`;

    const newSale: Sale = {
      id: `pos-${Date.now()}`,
      code: saleCode,
      type: 'pos',
      customer_name: customer,
      customer_phone: saleData.customer_phone,
      items: saleData.items,
      subtotal: saleData.subtotal,
      discount: saleData.discount,
      total: saleData.total,
      payment_method: saleData.payment_method,
      cashier_name: cashier,
      notes: saleData.notes,
      status: 'completed',
      created_at: new Date().toISOString(),
    };
    storageService.saveSale(newSale);

    // 3. Update cash register if cash
    if (saleData.payment_method === 'store') {
      const openReg = storageService.getCurrentCashRegister();
      if (openReg) {
        openReg.total_sales = Number(openReg.total_sales || 0) + newSale.total;
        openReg.total_in = Number(openReg.total_in || 0) + newSale.total;
        openReg.expected_amount = Number(openReg.expected_amount || 0) + newSale.total;
        storageService.saveCashRegister(openReg);

        const movement: CashMovement = {
          id: `csh-${Date.now()}`,
          register_id: openReg.id,
          type: 'sale',
          amount: newSale.total,
          reason: `Venta POS #${newSale.code}`,
          cashier_name: cashier,
          created_at: new Date().toISOString(),
        };
        storageService.addCashMovement(movement);
      }
    }

    // 4. Log activity
    storageService.addActivityLog({
      user_name: cashier,
      user_role: 'admin',
      action: `Registró venta mostrador POS ${newSale.code}`,
      entity: 'sale',
      entity_id: newSale.id,
      details: `Venta ${newSale.code} por ${newSale.total} FCFA (${newSale.payment_method})`,
    });

    return { success: true, sale: newSale };
  },

  // Inventory Movements (Kardex)
  getInventoryMovements: (): InventoryMovement[] => getItem(STORAGE_KEYS.INVENTORY_MOVEMENTS, []),
  addInventoryMovement: (movement: InventoryMovement) => {
    const list = storageService.getInventoryMovements();
    list.unshift(movement);
    setItem(STORAGE_KEYS.INVENTORY_MOVEMENTS, list);
    supabaseDbService.addInventoryMovement(movement).catch((e) => console.error(e));
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
    supabaseDbService.saveCashRegister(reg).catch((e) => console.error(e));
    api.createCashRegister(reg).catch((e) => console.error(e));
  },
  getCashMovements: (): CashMovement[] => getItem(STORAGE_KEYS.CASH_MOVEMENTS, []),
  addCashMovement: (movement: CashMovement) => {
    const list = storageService.getCashMovements();
    list.unshift(movement);
    setItem(STORAGE_KEYS.CASH_MOVEMENTS, list);
    supabaseDbService.addCashMovement(movement).catch((e) => console.error(e));
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
    supabaseDbService.saveSupplier(sup).catch((e) => console.error(e));
    api.createSupplier(sup).catch((e) => console.error(e));
  },
  saveSuppliers: (suppliers: Supplier[]) => {
    setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
    suppliers.forEach((sup) => supabaseDbService.saveSupplier(sup).catch((e) => console.error(e)));
    api.saveSuppliers(suppliers).catch((e) => console.error(e));
  },
  deleteSupplier: (id: string) => {
    const list = storageService.getSuppliers().filter((s) => s.id !== id);
    setItem(STORAGE_KEYS.SUPPLIERS, list);
    supabaseDbService.deleteSupplier(id).catch((e) => console.error(e));
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
    supabaseDbService.saveOffer(offer).catch((e) => console.error(e));
  },
  deleteOffer: (id: string) => {
    const list = storageService.getOffers().filter((o) => o.id !== id);
    setItem(STORAGE_KEYS.OFFERS, list);
    supabaseDbService.deleteOffer(id).catch((e) => console.error(e));
  },
  getCoupons: (): Coupon[] => getItem(STORAGE_KEYS.COUPONS, INITIAL_COUPONS),
  saveCoupon: (coupon: Coupon) => {
    const list = storageService.getCoupons();
    const idx = list.findIndex((c) => c.id === coupon.id);
    if (idx >= 0) list[idx] = coupon;
    else list.push(coupon);
    setItem(STORAGE_KEYS.COUPONS, list);
    supabaseDbService.saveCoupon(coupon).catch((e) => console.error(e));
  },
  deleteCoupon: (id: string) => {
    const list = storageService.getCoupons().filter((c) => c.id !== id);
    setItem(STORAGE_KEYS.COUPONS, list);
    supabaseDbService.deleteCoupon(id).catch((e) => console.error(e));
  },

  // School Packs & Lists
  getSchoolPacks: (): SchoolPack[] => getItem(STORAGE_KEYS.SCHOOL_PACKS, INITIAL_SCHOOL_PACKS),
  saveSchoolPack: (pack: SchoolPack) => {
    const list = storageService.getSchoolPacks();
    const idx = list.findIndex((p) => p.id === pack.id);
    if (idx >= 0) list[idx] = pack;
    else list.push(pack);
    setItem(STORAGE_KEYS.SCHOOL_PACKS, list);
    supabaseDbService.saveSchoolPack(pack).catch((e) => console.error(e));
  },
  deleteSchoolPack: (id: string) => {
    const list = storageService.getSchoolPacks().filter((p) => p.id !== id);
    setItem(STORAGE_KEYS.SCHOOL_PACKS, list);
    supabaseDbService.deleteSchoolPack(id).catch((e) => console.error(e));
  },
  getSchoolLists: (): SchoolList[] => getItem(STORAGE_KEYS.SCHOOL_LISTS, INITIAL_SCHOOL_LISTS),
  saveSchoolList: (schoolList: SchoolList) => {
    const list = storageService.getSchoolLists();
    const idx = list.findIndex((l) => l.id === schoolList.id);
    if (idx >= 0) list[idx] = schoolList;
    else list.push(schoolList);
    setItem(STORAGE_KEYS.SCHOOL_LISTS, list);
    supabaseDbService.saveSchoolList(schoolList).catch((e) => console.error(e));
  },
  deleteSchoolList: (id: string) => {
    const list = storageService.getSchoolLists().filter((l) => l.id !== id);
    setItem(STORAGE_KEYS.SCHOOL_LISTS, list);
    supabaseDbService.deleteSchoolList(id).catch((e) => console.error(e));
  },

  // AI Scans Records
  getAiScans: (): AiScanRecord[] => getItem(STORAGE_KEYS.AI_SCANS, []),
  saveAiScan: (scan: AiScanRecord) => {
    const list = storageService.getAiScans();
    list.unshift(scan);
    setItem(STORAGE_KEYS.AI_SCANS, list);
    supabaseDbService.addAiScan(scan).catch((e) => console.error(e));
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
    supabaseDbService.logActivity(log).catch((e) => console.error(e));
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
      supabaseDbService.createExpense(list[idx]).catch((e) => console.error(e));
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
        supabaseDbService.saveOffer(list[idx]).catch((e) => console.error(e));
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
        supabaseDbService.createOrder(list[idx]).catch((e) => console.error(e));
      }
    } else {
      storageService.saveOrder(idOrOrder);
    }
  },
  deleteOrder: (id: string) => {
    const list = storageService.getOrders().filter((o) => o.id !== id);
    setItem(STORAGE_KEYS.ORDERS, list);
    supabaseDbService.deleteOrder(id).catch((e) => console.error(e));
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
        supabaseDbService.createSale(list[idx]).catch((e) => console.error(e));
        api.createSale(list[idx]).catch((e) => console.error(e));
      }
    } else {
      const list = storageService.getSales();
      const idx = list.findIndex((s) => s.id === idOrSale.id);
      if (idx >= 0) list[idx] = idOrSale;
      else list.unshift(idOrSale);
      setItem(STORAGE_KEYS.SALES, list);
      supabaseDbService.createSale(idOrSale).catch((e) => console.error(e));
      api.createSale(idOrSale).catch((e) => console.error(e));
    }
  },
  deleteSale: (id: string) => {
    const list = storageService.getSales().filter((s) => s.id !== id);
    setItem(STORAGE_KEYS.SALES, list);
    supabaseDbService.deleteSale(id).catch((e) => console.error(e));
  },
  updateCashRegister: (idOrReg: string | CashRegister, updates?: Partial<CashRegister>) => {
    if (typeof idOrReg === 'string') {
      const list = storageService.getCashRegisters();
      const idx = list.findIndex((c) => c.id === idOrReg);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...(updates || {}) };
        setItem(STORAGE_KEYS.CASH_REGISTERS, list);
        supabaseDbService.saveCashRegister(list[idx]).catch((e) => console.error(e));
        api.updateCashRegister(idOrReg, updates || {}).catch((e) => console.error(e));
      }
    } else {
      storageService.saveCashRegister(idOrReg);
    }
  },
  saveCashRegisters: (registers: CashRegister[]) => {
    setItem(STORAGE_KEYS.CASH_REGISTERS, registers);
    registers.forEach((r) => supabaseDbService.saveCashRegister(r).catch((e) => console.error(e)));
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
        supabaseDbService.saveService(list[idx]).catch((e) => console.error(e));
        api.updateService(idOrService, updates || {}).catch((e) => console.error(e));
      }
    } else {
      storageService.saveService(idOrService);
    }
  },
  resetDefaultServices: () => {
    setItem(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
    INITIAL_SERVICES.forEach((s) => supabaseDbService.saveService(s).catch((e) => console.error(e)));
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
