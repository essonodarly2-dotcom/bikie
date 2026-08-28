import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Store,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Users,
  Settings,
  Database,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Printer,
  MessageCircle,
  Truck,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileText,
  Tag,
  RefreshCw,
  Barcode,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Building,
  Check,
  Eye,
  Camera,
  LogOut,
  Folder,
  GraduationCap,
  Briefcase,
  PenTool,
  BookOpen,
  Palette,
  Backpack,
  Laptop,
  Calculator,
  Upload,
  Link,
  Image as ImageIcon,
  X,
  Coffee,
  Receipt,
  FileCheck,
} from 'lucide-react';
import {
  Product,
  Category,
  Order,
  Offer,
  Coupon,
  Supplier,
  Purchase,
  CashRegister,
  CashMovement,
  InventoryMovement,
  Sale,
  UserProfile,
  StoreSettings,
  ActivityLog,
  AiScanRecord,
} from '../types';
import { formatXAF, formatDate, getOrderStatusLabel } from '../utils/formatters';
import { storageService } from '../lib/storage';
import { BIKIE_COMPLETE_SQL_SCHEMA, isSupabaseConfigured, downloadDatabaseSchemaSql } from '../lib/supabase';
import { ServicesAndSalesManager } from './ServicesAndSalesManager';
import { SalesHistoryAndReports } from './SalesHistoryAndReports';
import { OffersManager } from './OffersManager';

interface AdminDashboardProps {
  currentUser: UserProfile;
  settings: StoreSettings;
  onSaveSettings: (s: StoreSettings) => void;
  products: Product[];
  categories: Category[];
  orders: Order[];
  offers: Offer[];
  coupons: Coupon[];
  suppliers: Supplier[];
  users: UserProfile[];
  onRefreshData: () => void;
  onCloseAdmin: () => void;
  onOpenInvoiceModal: (order: Order) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  settings,
  onSaveSettings,
  products,
  categories,
  orders,
  offers,
  coupons,
  suppliers,
  users,
  onRefreshData,
  onCloseAdmin,
  onOpenInvoiceModal,
}) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Product Form state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productImageTab, setProductImageTab] = useState<'url' | 'file'>('url');

  // Category Form state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryImageTab, setCategoryImageTab] = useState<'url' | 'file'>('url');

  // POS State
  const [posSearch, setPosSearch] = useState('');
  const [posCart, setPosCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [posCustomerName, setPosCustomerName] = useState('Cliente Tienda');
  const [posPaymentMethod, setPosPaymentMethod] = useState<'store' | 'transfer' | 'online'>('store');
  const [posNotice, setPosNotice] = useState<string | null>(null);

  // Cash Register State
  const [currentCashReg, setCurrentCashReg] = useState<CashRegister | undefined>(
    storageService.getCurrentCashRegister()
  );
  const [cashActionModal, setCashActionModal] = useState<'open' | 'movement' | 'close' | null>(null);
  const [cashAmountInput, setCashAmountInput] = useState<number>(0);
  const [cashReasonInput, setCashReasonInput] = useState<string>('');

  // Supplier / Purchase State
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierCompany, setNewSupplierCompany] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  // Store Settings Form state
  const [settingsForm, setSettingsForm] = useState<StoreSettings>({ ...settings });
  const [settingsSavedNotice, setSettingsSavedNotice] = useState(false);

  // Copied SQL schema indicator
  const [copiedSql, setCopiedSql] = useState(false);

  // Role permissions check
  const isAdmin = currentUser.role === 'admin';
  const isInventory = currentUser.role === 'admin' || currentUser.role === 'inventory_manager';
  const isCashier = currentUser.role === 'admin' || currentUser.role === 'employee';

  // KPI Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = orders
    .filter((o) => o.created_at.startsWith(todayStr))
    .reduce((sum, o) => sum + o.total, 0);

  const totalMonthlySales = orders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending' || o.status === 'preparing').length;
  const lowStockProducts = products.filter((p) => p.stock <= p.min_stock);

  // Order Status Updater
  const handleUpdateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o));
    storageService.saveOrders(updated);
    storageService.addActivityLog({
      user_name: currentUser.name,
      user_role: currentUser.role,
      action: `Cambió estado de pedido ${orderId} a ${newStatus}`,
      entity: 'order',
      entity_id: orderId,
      details: `Estado actualizado a ${newStatus}`,
    });
    onRefreshData();
  };

  // WhatsApp Message to Customer for order updates
  const handleSendWhatsAppNotification = (order: Order) => {
    const phone = order.customer_phone.replace(/[^0-9]/g, '');
    let msg = `Hola ${order.customer_name}, te informamos desde BIKIE Papelería que tu pedido *${order.code}* `;
    if (order.status === 'ready_for_pickup') {
      msg += `está *LISTO PARA RECOGER* en nuestra tienda en Malabo. ¡Te esperamos!`;
    } else if (order.status === 'shipped') {
      msg += `ha sido *ENVIADO* a tu dirección (${order.delivery_address || 'Malabo'}). El repartidor se pondrá en contacto.`;
    } else {
      msg += `se encuentra actualmente en estado: *${order.status}*. Total: ${formatXAF(order.total)}.`;
    }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // ==========================================
  // PRODUCT MANAGEMENT HANDLERS
  // ==========================================
  const handleOpenNewProductModal = () => {
    const defaultCat = categories[0] || { id: 'cat-escolar', name: 'Material escolar' };
    setEditingProduct({
      id: `prod-${Date.now()}`,
      name: '',
      slug: '',
      brand: 'BIKIE',
      sku: `BIK-${Math.floor(1000 + Math.random() * 9000)}`,
      category_id: defaultCat.id,
      category_name: defaultCat.name,
      purchase_price: 1000,
      sale_price: 1500,
      stock: 20,
      min_stock: 5,
      status: 'active',
      is_featured: false,
      is_new: true,
      is_offer: false,
      image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80',
      gallery: [],
      tags: ['escolar', 'nuevo'],
      description: 'Producto de alta calidad garantizada para estudiantes y profesionales.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setProductImageTab('url');
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (prod: Product) => {
    setEditingProduct({ ...prod });
    setProductImageTab('url');
    setIsProductModalOpen(true);
  };

  const handleProductFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingProduct) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setEditingProduct({
            ...editingProduct,
            image: reader.result,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    // Ensure category_name matches category_id
    const targetCat = categories.find((c) => c.id === editingProduct.category_id);
    const resolvedCatName = targetCat ? targetCat.name : editingProduct.category_name;
    const finalProduct = {
      ...editingProduct,
      category_name: resolvedCatName,
      slug: editingProduct.slug || editingProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      updated_at: new Date().toISOString(),
    };

    if (products.some((p) => p.id === finalProduct.id)) {
      storageService.updateProduct(finalProduct.id, finalProduct);
      storageService.addActivityLog({
        user_name: currentUser.name,
        user_role: currentUser.role,
        action: `Actualizó producto: ${finalProduct.name}`,
        entity: 'product',
        entity_id: finalProduct.id,
        details: `Categoría: ${resolvedCatName}, SKU: ${finalProduct.sku}, Stock: ${finalProduct.stock}`,
      });
    } else {
      storageService.addProduct(finalProduct);
      storageService.addActivityLog({
        user_name: currentUser.name,
        user_role: currentUser.role,
        action: `Creó nuevo producto: ${finalProduct.name}`,
        entity: 'product',
        entity_id: finalProduct.id,
        details: `Categoría: ${resolvedCatName}, SKU: ${finalProduct.sku}, Precio: ${finalProduct.sale_price}`,
      });
    }

    setIsProductModalOpen(false);
    setEditingProduct(null);
    onRefreshData();
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el producto "${name}"?`)) {
      storageService.deleteProduct(id);
      storageService.addActivityLog({
        user_name: currentUser.name,
        user_role: currentUser.role,
        action: `Eliminó producto: ${name}`,
        entity: 'product',
        entity_id: id,
        details: `ID producto: ${id}`,
      });
      onRefreshData();
    }
  };

  // ==========================================
  // CATEGORY MANAGEMENT HANDLERS
  // ==========================================
  const handleOpenNewCategoryModal = () => {
    setEditingCategory({
      id: `cat-${Date.now()}`,
      name: '',
      slug: '',
      description: '',
      icon: 'BookOpen',
      image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80',
      display_order: categories.length + 1,
      created_at: new Date().toISOString(),
    });
    setCategoryImageTab('url');
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCategory({ ...cat });
    setCategoryImageTab('url');
    setIsCategoryModalOpen(true);
  };

  const handleCategoryFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingCategory) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setEditingCategory({
            ...editingCategory,
            image: reader.result,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name.trim()) return;

    const generatedSlug =
      editingCategory.slug.trim() ||
      editingCategory.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

    const finalCategory: Category = {
      ...editingCategory,
      slug: generatedSlug,
    };

    if (categories.some((c) => c.id === finalCategory.id)) {
      storageService.updateCategory(finalCategory.id, finalCategory);
      storageService.addActivityLog({
        user_name: currentUser.name,
        user_role: currentUser.role,
        action: `Actualizó categoría: ${finalCategory.name}`,
        entity: 'category',
        entity_id: finalCategory.id,
        details: `Slug: ${finalCategory.slug}`,
      });
    } else {
      storageService.addCategory(finalCategory);
      storageService.addActivityLog({
        user_name: currentUser.name,
        user_role: currentUser.role,
        action: `Creó nueva categoría: ${finalCategory.name}`,
        entity: 'category',
        entity_id: finalCategory.id,
        details: `Slug: ${finalCategory.slug}, Icono: ${finalCategory.icon}`,
      });
    }

    setIsCategoryModalOpen(false);
    setEditingCategory(null);
    onRefreshData();
  };

  const handleDeleteCategory = (catId: string, catName: string) => {
    const productsInCat = products.filter((p) => p.category_id === catId);
    if (productsInCat.length > 0) {
      if (
        !confirm(
          `La categoría "${catName}" tiene ${productsInCat.length} producto(s) asignados. ¿Deseas eliminarla igualmente?`
        )
      ) {
        return;
      }
    } else {
      if (!confirm(`¿Eliminar la categoría "${catName}"?`)) return;
    }

    storageService.deleteCategory(catId);
    storageService.addActivityLog({
      user_name: currentUser.name,
      user_role: currentUser.role,
      action: `Eliminó categoría: ${catName}`,
      entity: 'category',
      entity_id: catId,
      details: `ID: ${catId}`,
    });
    onRefreshData();
  };

  // Helper to render dynamic Lucide icon for categories
  const renderCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5" />;
      case 'Briefcase':
        return <Briefcase className="w-5 h-5" />;
      case 'PenTool':
        return <PenTool className="w-5 h-5" />;
      case 'Palette':
        return <Palette className="w-5 h-5" />;
      case 'Backpack':
        return <Backpack className="w-5 h-5" />;
      case 'FileText':
        return <FileText className="w-5 h-5" />;
      case 'Laptop':
        return <Laptop className="w-5 h-5" />;
      case 'Calculator':
        return <Calculator className="w-5 h-5" />;
      case 'Folder':
        return <Folder className="w-5 h-5" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5" />;
      case 'BookOpen':
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  // ==========================================
  // POS & CASH MANAGEMENT
  // ==========================================
  const handlePosAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('Producto sin existencias');
      return;
    }
    const exist = posCart.find((i) => i.product.id === product.id);
    if (exist) {
      if (exist.quantity >= product.stock) {
        alert(`Stock máximo disponible alcanzado (${product.stock} uds)`);
        return;
      }
      setPosCart(
        posCart.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setPosCart([...posCart, { product, quantity: 1 }]);
    }
  };

  const handlePosCheckout = () => {
    if (posCart.length === 0) return;
    const total = posCart.reduce((s, i) => s + i.product.sale_price * i.quantity, 0);

    const newOrder: Order = {
      id: `ord-pos-${Date.now()}`,
      code: `POS-${Math.floor(100000 + Math.random() * 900000)}`,
      customer_id: 'usr-tia-admin-01',
      customer_name: posCustomerName || 'Venta Mostrador',
      customer_email: 'ventas@bikie.gq',
      customer_phone: '+240 222 111 000',
      delivery_type: 'pickup',
      city: 'Malabo',
      status: 'delivered',
      payment_method: posPaymentMethod,
      payment_status: 'paid',
      subtotal: total,
      discount: 0,
      total: total,
      items: posCart.map((i) => ({
        product_id: i.product.id,
        product_name: i.product.name,
        sku: i.product.sku,
        quantity: i.quantity,
        unit_price: i.product.sale_price,
        total_price: i.product.sale_price * i.quantity,
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Update stocks
    const updatedProducts = products.map((p) => {
      const sold = posCart.find((i) => i.product.id === p.id);
      if (sold) {
        const newStock = Math.max(0, p.stock - sold.quantity);
        storageService.addInventoryMovement({
          id: `mov-${Date.now()}-${p.id}`,
          product_id: p.id,
          product_name: p.name,
          type: 'sale',
          quantity: -sold.quantity,
          previous_stock: p.stock,
          new_stock: newStock,
          reason: `Venta POS Mostrador #${newOrder.code}`,
          user_name: currentUser.name,
          created_at: new Date().toISOString(),
        });
        return { ...p, stock: newStock };
      }
      return p;
    });

    storageService.saveProducts(updatedProducts);
    storageService.saveOrders([newOrder, ...orders]);
    storageService.addActivityLog({
      user_name: currentUser.name,
      user_role: currentUser.role,
      action: `Realizó venta en mostrador POS: ${newOrder.code}`,
      entity: 'order',
      entity_id: newOrder.id,
      details: `Total: ${formatXAF(total)}, Método: ${posPaymentMethod}`,
    });

    setPosCart([]);
    setPosCustomerName('Cliente Tienda');
    setPosNotice(`¡Venta #${newOrder.code} completada con éxito (${formatXAF(total)})!`);
    setTimeout(() => setPosNotice(null), 4000);
    onRefreshData();
  };

  // Cash Register Submit
  const handleCashRegisterSubmit = () => {
    if (cashActionModal === 'open') {
      const reg: CashRegister = {
        id: `csh-${Date.now()}`,
        opened_at: new Date().toISOString(),
        initial_amount: cashAmountInput,
        total_sales: 0,
        total_in: 0,
        total_out: 0,
        expected_amount: cashAmountInput,
        cashier_name: currentUser.name,
        status: 'open',
      };
      storageService.saveCashRegisters([
        reg,
        ...storageService.getCashRegisters().filter((r) => r.id !== reg.id),
      ]);
      setCurrentCashReg(reg);
    } else if (cashActionModal === 'movement' && currentCashReg) {
      storageService.addCashMovement({
        id: `mov-${Date.now()}`,
        register_id: currentCashReg.id,
        type: cashAmountInput >= 0 ? 'in' : 'out',
        amount: Math.abs(cashAmountInput),
        reason: cashReasonInput || 'Ajuste manual de caja',
        cashier_name: currentUser.name,
        created_at: new Date().toISOString(),
      });
      const isPositive = cashAmountInput >= 0;
      const updated: CashRegister = {
        ...currentCashReg,
        total_in: isPositive ? currentCashReg.total_in + cashAmountInput : currentCashReg.total_in,
        total_out: !isPositive ? currentCashReg.total_out + Math.abs(cashAmountInput) : currentCashReg.total_out,
        expected_amount: currentCashReg.expected_amount + cashAmountInput,
      };
      storageService.saveCashRegisters([
        updated,
        ...storageService.getCashRegisters().filter((r) => r.id !== updated.id),
      ]);
      setCurrentCashReg(updated);
    } else if (cashActionModal === 'close' && currentCashReg) {
      const diff = cashAmountInput - currentCashReg.expected_amount;
      const updated: CashRegister = {
        ...currentCashReg,
        counted_amount: cashAmountInput,
        difference: diff,
        status: 'closed',
        closed_at: new Date().toISOString(),
        notes: cashReasonInput,
      };
      storageService.saveCashRegisters([
        updated,
        ...storageService.getCashRegisters().filter((r) => r.id !== updated.id),
      ]);
      setCurrentCashReg(undefined);
    }
    setCashActionModal(null);
    setCashAmountInput(0);
    setCashReasonInput('');
  };

  // Supplier
  const handleSaveNewSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName.trim()) return;
    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      name: newSupplierName,
      company: newSupplierCompany || newSupplierName,
      phone: newSupplierPhone,
      email: '',
      address: 'Malabo',
      created_at: new Date().toISOString(),
    };
    const currentList = storageService.getSuppliers();
    storageService.saveSuppliers([...currentList, newSup]);
    setIsSupplierModalOpen(false);
    setNewSupplierName('');
    setNewSupplierCompany('');
    setNewSupplierPhone('');
    onRefreshData();
  };

  // Save Settings
  const handleSaveStoreSettings = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveSettings(settingsForm);
    onSaveSettings(settingsForm);
    setSettingsSavedNotice(true);
    setTimeout(() => setSettingsSavedNotice(false), 2500);
  };

  // Copy SQL
  const handleCopySql = () => {
    navigator.clipboard.writeText(BIKIE_COMPLETE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const activityLogs = storageService.getActivityLogs();
  const aiScans = storageService.getAiScans();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Header */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black font-['Outfit'] text-xl shadow-md">
            B
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black font-['Outfit'] text-white">
                <span className="text-red-600">B</span>IKIE Administración
              </h1>
              <span className="bg-red-950 text-red-300 border border-red-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md">
                Panel Propietaria
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sesión activa: <strong className="text-white">{currentUser.name}</strong> (Control Total)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCloseAdmin}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Store className="w-4 h-4" />
            <span>Volver a la Tienda</span>
          </button>
        </div>
      </header>

      {/* Main Admin Content Layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-64 bg-slate-950/80 border-r border-slate-800 p-4 space-y-1.5 shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Resumen & Métricas</span>
          </button>

          {/* Categories Tab */}
          <button
            onClick={() => setActiveTab('categories')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Folder className="w-4 h-4 text-red-400" />
              <span>Categorías & Secciones</span>
            </div>
            <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {categories.length}
            </span>
          </button>

          {/* Catalog Tab */}
          <button
            onClick={() => setActiveTab('catalog')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Package className="w-4 h-4 text-red-400" />
              <span>Catálogo & Productos</span>
            </div>
            <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {products.length}
            </span>
          </button>

          {/* Orders Tab */}
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-4 h-4 text-red-400" />
              <span>Gestión de Pedidos</span>
            </div>
            {pendingOrdersCount > 0 && (
              <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                {pendingOrdersCount}
              </span>
            )}
          </button>

          {/* Services Income Tab (Copias, Redacción, Impresión, Zumos) */}
          <button
            onClick={() => setActiveTab('services')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeTab === 'services'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Coffee className="w-4 h-4 text-orange-400" />
            <div className="flex-1 truncate">
              <span>Copias, Redacción & Zumos</span>
            </div>
            <span className="bg-orange-950 text-orange-300 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-orange-800">
              Caja
            </span>
          </button>

          {/* Sales History & Printable Reports (Diario, Semanal, Anual) */}
          <button
            onClick={() => setActiveTab('sales_reports')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeTab === 'sales_reports'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <div className="flex-1 truncate">
              <span>Historial & Reportes BD</span>
            </div>
            <span className="bg-emerald-950 text-emerald-300 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-emerald-800">
              D/S/A
            </span>
          </button>

          {/* POS & Cash */}
          <button
            onClick={() => setActiveTab('pos')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeTab === 'pos'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Punto de Venta (POS)</span>
          </button>

          <button
            onClick={() => setActiveTab('cash')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeTab === 'cash'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Building className="w-4 h-4 text-amber-400" />
            <span>Control de Caja</span>
          </button>

          {/* Stock & Movements */}
          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Stock & Almacén</span>
            </div>
            {lowStockProducts.length > 0 && (
              <span className="bg-rose-500 text-white font-black text-[10px] px-1.5 py-0.2 rounded-full">
                {lowStockProducts.length}
              </span>
            )}
          </button>

          {/* Suppliers */}
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeTab === 'suppliers'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Truck className="w-4 h-4 text-emerald-400" />
            <span>Proveedores & Compras</span>
          </button>

          {/* Commercial Offers Manager */}
          <button
            onClick={() => setActiveTab('offers')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
              activeTab === 'offers'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Tag className="w-4 h-4 text-yellow-400" />
              <span>Gestión de Ofertas</span>
            </div>
            <span className="bg-yellow-950 text-yellow-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-800">
              {offers.length}
            </span>
          </button>

          {/* AI Scans */}
          <button
            onClick={() => setActiveTab('ai_audit')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeTab === 'ai_audit'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4 text-yellow-400" />
            <span>Auditoría Escaneos IA</span>
          </button>

          {/* Activity Logs */}
          <button
            onClick={() => setActiveTab('logs')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Registro de Actividad</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Ajustes de Tienda</span>
          </button>

          {/* Supabase Hub */}
          <button
            onClick={() => setActiveTab('supabase')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeTab === 'supabase'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Supabase & Base de Datos</span>
          </button>
        </aside>

        {/* Right Content Panel */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* TAB: DASHBOARD KPI */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <h2 className="text-xl font-black font-['Outfit'] text-white">
                Panel General & Indicadores
              </h2>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                    <span>Ventas Hoy</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-black font-['Outfit'] text-white">
                    {formatXAF(todaySales)}
                  </p>
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Actualizado en tiempo real
                  </p>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                    <span>Ventas Totales</span>
                    <DollarSign className="w-4 h-4 text-red-400" />
                  </div>
                  <p className="text-2xl font-black font-['Outfit'] text-white">
                    {formatXAF(totalMonthlySales)}
                  </p>
                  <p className="text-[11px] text-red-300 font-semibold">
                    {orders.length} pedidos registrados
                  </p>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                    <span>Pedidos Pendientes</span>
                    <ShoppingBag className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-2xl font-black font-['Outfit'] text-amber-400">
                    {pendingOrdersCount}
                  </p>
                  <p className="text-[11px] text-slate-400 font-semibold">Requieren empaquetado</p>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                    <span>Alertas Stock Bajo</span>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  </div>
                  <p className="text-2xl font-black font-['Outfit'] text-rose-400">
                    {lowStockProducts.length}
                  </p>
                  <p className="text-[11px] text-rose-300 font-semibold">Por debajo del mínimo</p>
                </div>
              </div>

              {/* Recent Orders Section */}
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black font-['Outfit'] text-white">
                    Últimos Pedidos Web & Mostrador
                  </h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-red-400 hover:text-red-300 font-bold underline cursor-pointer"
                  >
                    Ver todos los pedidos
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="pb-3">Código</th>
                        <th className="pb-3">Cliente</th>
                        <th className="pb-3">Fecha</th>
                        <th className="pb-3">Tipo</th>
                        <th className="pb-3">Total</th>
                        <th className="pb-3">Estado</th>
                        <th className="pb-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {orders.slice(0, 5).map((o) => {
                        const statusBadge = getOrderStatusLabel(o.status);

                        return (
                          <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 font-bold text-red-400">{o.code}</td>
                            <td className="py-3">
                              <p className="font-semibold text-white">{o.customer_name}</p>
                              <p className="text-[10px] text-slate-400">{o.customer_phone}</p>
                            </td>
                            <td className="py-3 text-slate-400">{formatDate(o.created_at)}</td>
                            <td className="py-3 capitalize text-slate-300">
                              {o.delivery_type === 'pickup' ? 'Recogida' : 'Domicilio'}
                            </td>
                            <td className="py-3 font-black text-white">{formatXAF(o.total)}</td>
                            <td className="py-3">
                              <span
                                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${statusBadge.bg} ${statusBadge.text}`}
                              >
                                {statusBadge.label}
                              </span>
                            </td>
                            <td className="py-3 text-right space-x-1.5">
                              <button
                                onClick={() => onOpenInvoiceModal(o)}
                                className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 cursor-pointer"
                                title="Imprimir Factura"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleSendWhatsAppNotification(o)}
                                className="p-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer"
                                title="Notificar por WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CATEGORÍAS & DEPARTAMENTOS */}
          {activeTab === 'categories' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-black font-['Outfit'] text-white flex items-center gap-2">
                    <Folder className="w-5 h-5 text-red-500" />
                    Gestión de Categorías & Departamentos
                  </h2>
                  <p className="text-xs text-slate-400">
                    Crea secciones, organiza los productos de tu papelería y sube portadas por foto o enlace.
                  </p>
                </div>

                <button
                  onClick={handleOpenNewCategoryModal}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-950 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nueva Categoría</span>
                </button>
              </div>

              {/* Categories Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => {
                  const productCount = products.filter((p) => p.category_id === cat.id).length;

                  return (
                    <div
                      key={cat.id}
                      className="bg-slate-800/60 border border-slate-700/70 rounded-3xl p-5 flex flex-col justify-between space-y-4 hover:border-red-500/50 transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
                              {renderCategoryIcon(cat.icon)}
                            </div>
                            <div>
                              <h3 className="font-bold text-sm text-white">{cat.name}</h3>
                              <span className="text-[10px] text-slate-400 font-mono">
                                /{cat.slug}
                              </span>
                            </div>
                          </div>

                          <span className="px-2.5 py-1 rounded-full bg-slate-900 text-red-400 border border-slate-700 text-[10px] font-bold">
                            {productCount} {productCount === 1 ? 'producto' : 'productos'}
                          </span>
                        </div>

                        {cat.image && (
                          <div className="w-full h-28 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700">
                            <img
                              src={cat.image}
                              alt={cat.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                          {cat.description || 'Sin descripción detallada.'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">
                          Orden #{cat.display_order || 1}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEditCategory(cat)}
                            className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors cursor-pointer"
                            title="Editar Categoría"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/40 text-rose-300 transition-colors cursor-pointer"
                            title="Eliminar Categoría"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: CATALOG & PRODUCTS */}
          {activeTab === 'catalog' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-black font-['Outfit'] text-white">
                    Catálogo de Productos & Inventario
                  </h2>
                  <p className="text-xs text-slate-400">
                    Administra los artículos de papelería, precios, imágenes y asignación a categorías.
                  </p>
                </div>

                <button
                  onClick={handleOpenNewProductModal}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-950 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Producto</span>
                </button>
              </div>

              {/* Products Table */}
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-5 overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="pb-3">Imagen & Nombre</th>
                      <th className="pb-3">Categoría</th>
                      <th className="pb-3">SKU</th>
                      <th className="pb-3">Precio Compra</th>
                      <th className="pb-3">Precio Venta</th>
                      <th className="pb-3">Stock</th>
                      <th className="pb-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-10 h-10 rounded-xl object-cover bg-slate-900 border border-slate-700 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-white leading-tight">{p.name}</p>
                            <p className="text-[10px] text-slate-400">{p.brand}</p>
                          </div>
                        </td>
                        <td className="py-3 text-red-400 font-semibold">{p.category_name}</td>
                        <td className="py-3 font-mono text-slate-300">{p.sku}</td>
                        <td className="py-3 text-slate-400">{formatXAF(p.purchase_price)}</td>
                        <td className="py-3 font-black text-white">{formatXAF(p.sale_price)}</td>
                        <td className="py-3">
                          <span
                            className={`font-black ${
                              p.stock <= p.min_stock ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {p.stock} uds
                          </span>
                        </td>
                        <td className="py-3 text-right space-x-1.5">
                          <button
                            onClick={() => handleEditProduct(p)}
                            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800/40 text-rose-300 transition-colors cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-black font-['Outfit'] text-white">
                    Gestión Integral de Pedidos
                  </h2>
                  <p className="text-xs text-slate-400">
                    Cambio de estados, emisión de tickets/facturas y avisos por WhatsApp
                  </p>
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-5 overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="pb-3">Código</th>
                      <th className="pb-3">Cliente</th>
                      <th className="pb-3">Artículos</th>
                      <th className="pb-3">Total</th>
                      <th className="pb-3">Estado Actual</th>
                      <th className="pb-3">Cambiar Estado</th>
                      <th className="pb-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {orders.map((o) => {
                      const statusBadge = getOrderStatusLabel(o.status);

                      return (
                        <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 font-bold text-red-400">{o.code}</td>
                          <td className="py-3">
                            <p className="font-semibold text-white">{o.customer_name}</p>
                            <p className="text-[10px] text-slate-400">{o.customer_phone}</p>
                          </td>
                          <td className="py-3 text-slate-300">
                            {o.items.length} {o.items.length === 1 ? 'producto' : 'productos'}
                          </td>
                          <td className="py-3 font-black text-white">{formatXAF(o.total)}</td>
                          <td className="py-3">
                            <span
                              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${statusBadge.bg} ${statusBadge.text}`}
                            >
                              {statusBadge.label}
                            </span>
                          </td>
                          <td className="py-3">
                            <select
                              value={o.status}
                              onChange={(e) =>
                                handleUpdateOrderStatus(o.id, e.target.value as Order['status'])
                              }
                              className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs cursor-pointer"
                            >
                              <option value="pending">Pendiente</option>
                              <option value="confirmed">Confirmado</option>
                              <option value="preparing">En Preparación</option>
                              <option value="ready_for_pickup">Listo para Recoger</option>
                              <option value="shipped">Enviado a Domicilio</option>
                              <option value="delivered">Entregado</option>
                              <option value="cancelled">Cancelado</option>
                            </select>
                          </td>
                          <td className="py-3 text-right space-x-1.5">
                            <button
                              onClick={() => onOpenInvoiceModal(o)}
                              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 cursor-pointer"
                              title="Imprimir Factura"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleSendWhatsAppNotification(o)}
                              className="p-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer"
                              title="Notificar por WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: POS */}
          {activeTab === 'pos' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-150">
              {/* Product Grid */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={posSearch}
                      onChange={(e) => setPosSearch(e.target.value)}
                      placeholder="Buscar por nombre, SKU o código de barras..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-2xl text-xs text-white"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[550px] overflow-y-auto pr-1">
                  {products
                    .filter(
                      (p) =>
                        p.name.toLowerCase().includes(posSearch.toLowerCase()) ||
                        p.sku.toLowerCase().includes(posSearch.toLowerCase())
                    )
                    .map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handlePosAddToCart(p)}
                        className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3 cursor-pointer hover:border-red-500 transition-all flex flex-col justify-between"
                      >
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-24 object-cover rounded-xl mb-2 bg-slate-900"
                        />
                        <div>
                          <p className="font-bold text-xs text-white truncate">{p.name}</p>
                          <p className="text-[10px] text-slate-400">{p.sku}</p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-700 flex justify-between items-center">
                          <span className="font-black text-red-400 text-xs">
                            {formatXAF(p.sale_price)}
                          </span>
                          <span className="text-[10px] text-slate-400">{p.stock} uds</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* POS Cart & Checkout */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center justify-between pb-3 border-b border-slate-700">
                    <span>Ticket Actual</span>
                    <span className="text-red-400 font-mono text-xs">
                      {posCart.reduce((s, i) => s + i.quantity, 0)} items
                    </span>
                  </h3>

                  {posNotice && (
                    <div className="mt-2 p-2.5 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs font-bold">
                      {posNotice}
                    </div>
                  )}

                  <div className="space-y-2 mt-3 max-h-64 overflow-y-auto pr-1">
                    {posCart.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-8">Carrito vacío</p>
                    ) : (
                      posCart.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-xs"
                        >
                          <div className="truncate pr-2">
                            <p className="font-bold text-white truncate">{item.product.name}</p>
                            <p className="text-[10px] text-slate-400">
                              {formatXAF(item.product.sale_price)} x {item.quantity}
                            </p>
                          </div>
                          <span className="font-black text-white">
                            {formatXAF(item.product.sale_price * item.quantity)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-700">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Nombre Cliente
                    </label>
                    <input
                      type="text"
                      value={posCustomerName}
                      onChange={(e) => setPosCustomerName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Método de Pago
                    </label>
                    <select
                      value={posPaymentMethod}
                      onChange={(e) => setPosPaymentMethod(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                    >
                      <option value="store">Efectivo / Mostrador</option>
                      <option value="transfer">Transferencia Bancaria</option>
                      <option value="online">Pago Electrónico</option>
                    </select>
                  </div>

                  <div className="flex justify-between items-baseline pt-2">
                    <span className="text-xs font-bold text-slate-400">Total a Cobrar:</span>
                    <span className="text-xl font-black text-white font-['Outfit']">
                      {formatXAF(posCart.reduce((s, i) => s + i.product.sale_price * i.quantity, 0))}
                    </span>
                  </div>

                  <button
                    onClick={handlePosCheckout}
                    disabled={posCart.length === 0}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs disabled:opacity-50 transition-all cursor-pointer"
                  >
                    Completar Cobro & Registrar Venta
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CASH CONTROL */}
          {activeTab === 'cash' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-black font-['Outfit'] text-white">
                    Arqueo & Control de Caja
                  </h2>
                  <p className="text-xs text-slate-400">
                    Apertura de turno, entradas, salidas y cuadre final
                  </p>
                </div>

                <div className="flex gap-2">
                  {!currentCashReg ? (
                    <button
                      onClick={() => {
                        setCashActionModal('open');
                        setCashAmountInput(50000);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    >
                      Abrir Turno de Caja
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setCashActionModal('movement');
                          setCashAmountInput(0);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs"
                      >
                        Entrada / Salida
                      </button>
                      <button
                        onClick={() => {
                          setCashActionModal('close');
                          setCashAmountInput(currentCashReg.current_amount);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs"
                      >
                        Cerrar Caja
                      </button>
                    </>
                  )}
                </div>
              </div>

              {currentCashReg && (
                <div className="p-5 rounded-3xl bg-slate-800/60 border border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase">Fondo Inicial</span>
                    <p className="text-xl font-black text-white">
                      {formatXAF(currentCashReg.opening_amount)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase">Efectivo Estimado</span>
                    <p className="text-xl font-black text-emerald-400">
                      {formatXAF(currentCashReg.current_amount)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase">Estado Turno</span>
                    <p className="text-sm font-bold text-emerald-300">🟢 Turno Abierto</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <h2 className="text-xl font-black font-['Outfit'] text-white">
                Historial de Movimientos de Inventario
              </h2>

              <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-5">
                <div className="space-y-2">
                  {storageService.getInventoryMovements().length === 0 ? (
                    <p className="text-slate-500 py-6 text-center text-xs">No hay movimientos registrados.</p>
                  ) : (
                    storageService.getInventoryMovements().map((m) => (
                      <div
                        key={m.id}
                        className="flex justify-between items-center p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-xs"
                      >
                        <div>
                          <p className="font-bold text-white">{m.product_name}</p>
                          <p className="text-[10px] text-slate-400">
                            {m.reason} · {formatDate(m.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-black ${
                              m.quantity > 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {m.quantity > 0 ? `+${m.quantity}` : m.quantity} uds
                          </span>
                          <p className="text-[10px] text-slate-400">
                            {m.previous_stock} → {m.new_stock}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: SERVICIOS & COPISTERÍA (Copias, Redacción, Impresión, Zumos) */}
          {activeTab === 'services' && (
            <ServicesAndSalesManager
              currentUser={currentUser}
              settings={settings}
              onRefreshData={onRefreshData}
              onOpenInvoiceModal={onOpenInvoiceModal}
            />
          )}

          {/* TAB: HISTORIAL DE VENTAS & REPORTES IMPRIMIBLES (Diario, Semanal, Anual) */}
          {activeTab === 'sales_reports' && (
            <SalesHistoryAndReports
              orders={orders}
              sales={storageService.getSales()}
              settings={settings}
              currentUser={currentUser}
              onRefreshData={onRefreshData}
              onOpenInvoiceModal={onOpenInvoiceModal}
            />
          )}

          {/* TAB: GESTIÓN DE OFERTAS Y PROMOCIONES */}
          {activeTab === 'offers' && (
            <OffersManager
              offers={offers}
              products={products}
              categories={categories}
              currentUser={currentUser}
              onRefreshData={onRefreshData}
            />
          )}

          {/* TAB: PROVEEDORES & COMPRAS */}
          {activeTab === 'suppliers' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-black font-['Outfit'] text-white">
                    Proveedores & Reposición de Mercancía
                  </h2>
                  <p className="text-xs text-slate-400">
                    Gestión de compras que incrementan automáticamente el inventario
                  </p>
                </div>

                <button
                  onClick={() => setIsSupplierModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Proveedor</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {suppliers.map((s) => (
                  <div key={s.id} className="p-5 rounded-3xl bg-slate-800/70 border border-slate-700 space-y-2">
                    <span className="text-xs font-black text-red-400 block">{s.company || s.name}</span>
                    <p className="text-xs text-slate-300">Contacto: {s.name}</p>
                    <p className="text-xs text-slate-400">Tel: {s.phone || '-'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: OFERTAS & CUPONES */}
          {activeTab === 'promos' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <h2 className="text-xl font-black font-['Outfit'] text-white">
                Ofertas & Cupones de Descuento
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {coupons.map((c) => (
                  <div key={c.id} className="p-5 rounded-3xl bg-slate-800/70 border border-slate-700 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-black text-yellow-400 text-base">{c.code}</span>
                      <span className="bg-red-950 text-red-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
                        {c.discount_type === 'percentage' ? `-${c.discount_value}%` : `-${formatXAF(c.discount_value)}`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{c.description}</p>
                    <p className="text-[10px] text-slate-500">Mínimo: {formatXAF(c.min_order_amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: AUDITORÍA DE ESCANEOS IA */}
          {activeTab === 'ai_audit' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <h2 className="text-xl font-black font-['Outfit'] text-white">
                Auditoría de Escaneos de Listas con IA
              </h2>
              <p className="text-xs text-slate-400">
                Registro de listas fotografiadas por clientes, texto leído y tasa de coincidencia
              </p>

              <div className="space-y-3">
                {aiScans.length === 0 ? (
                  <p className="text-slate-500 py-8 text-center text-xs">No hay escaneos registrados aún.</p>
                ) : (
                  aiScans.map((scan) => (
                    <div key={scan.id} className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-red-400">
                          {formatDate(scan.created_at)}
                        </span>
                        <span className="font-black text-yellow-400 bg-yellow-950/60 px-2 py-0.5 rounded-md">
                          {scan.confidence_avg}% coincidencia prom.
                        </span>
                      </div>
                      <pre className="text-[11px] bg-slate-900 p-3 rounded-xl border border-slate-800 text-slate-300 whitespace-pre-wrap font-mono">
                        {scan.raw_text}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: LOGS DE ACTIVIDAD */}
          {activeTab === 'logs' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <h2 className="text-xl font-black font-['Outfit'] text-white">
                Registro Inmutable de Auditoría & Actividad
              </h2>

              <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-5 space-y-2 text-xs">
                {activityLogs.map((log) => (
                  <div key={log.id} className="py-2 border-b border-slate-700/60 flex justify-between items-center text-slate-300">
                    <div>
                      <p className="font-bold text-white">{log.action}</p>
                      <p className="text-[10px] text-slate-400">
                        Usuario: {log.user_name} ({log.user_role}) · {log.details}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-500">{formatDate(log.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: AJUSTES DE TIENDA */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl space-y-6 animate-in fade-in duration-150">
              <h2 className="text-xl font-black font-['Outfit'] text-white">
                Configuración General de BIKIE
              </h2>

              {settingsSavedNotice && (
                <div className="p-3 bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs font-bold rounded-xl">
                  ¡Ajustes guardados correctamente!
                </div>
              )}

              <form onSubmit={handleSaveStoreSettings} className="bg-slate-800/60 border border-slate-700 p-6 rounded-3xl space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Nombre de la Papelería</label>
                  <input
                    type="text"
                    value={settingsForm.name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Eslogan Principal</label>
                  <input
                    type="text"
                    value={settingsForm.slogan}
                    onChange={(e) => setSettingsForm({ ...settingsForm, slogan: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={settingsForm.phone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">WhatsApp</label>
                    <input
                      type="text"
                      value={settingsForm.whatsapp}
                      onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Horario Comercial</label>
                  <input
                    type="text"
                    value={settingsForm.opening_hours}
                    onChange={(e) => setSettingsForm({ ...settingsForm, opening_hours: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </form>
            </div>
          )}

          {/* TAB: SUPABASE & SQL HUB */}
          {activeTab === 'supabase' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-black font-['Outfit'] text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-400" />
                    Base de Datos BIKIE (PostgreSQL & Supabase)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Esquema DDL completo, tablas relacionales, catálogos, seed data en Francos CFA (XAF) con la cuenta real de la Propietaria.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadDatabaseSchemaSql()}
                    className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    title="Descargar script SQL"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Descargar .sql</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{copiedSql ? '¡Copiado!' : 'Copiar SQL'}</span>
                  </button>
                </div>
              </div>

              {/* Database Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tabla Products</p>
                  <p className="text-xl font-black text-white mt-1">{products.length}</p>
                  <p className="text-[11px] text-emerald-400">SKUs & Materiales</p>
                </div>
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tabla Orders</p>
                  <p className="text-xl font-black text-white mt-1">{orders.length}</p>
                  <p className="text-[11px] text-red-400">Pedidos Registrados</p>
                </div>
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tabla Categories</p>
                  <p className="text-xl font-black text-white mt-1">{categories.length}</p>
                  <p className="text-[11px] text-amber-400">Departamentos</p>
                </div>
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Usuario Administrador</p>
                  <p className="text-xl font-black text-white mt-1">1</p>
                  <p className="text-[11px] text-sky-400">Propietaria (Tía)</p>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs space-y-2 text-slate-300">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  Instrucciones para desplegar la BD en Supabase / Servidor PostgreSQL:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
                  <li>Crea un proyecto en <strong className="text-slate-200">Supabase.com</strong> o en cualquier servidor PostgreSQL.</li>
                  <li>Abre la pestaña <strong className="text-slate-200">SQL Editor</strong> en el panel de Supabase.</li>
                  <li>Haz clic en <strong className="text-emerald-400">"Copiar SQL"</strong> o <strong className="text-red-400">"Descargar .sql"</strong> y pega todo el script.</li>
                  <li>Ejecuta el script (<code className="text-yellow-300">Run</code>) para crear todas las tablas, índices, vistas y la cuenta real de la tía.</li>
                </ol>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-mono text-emerald-400 font-bold">bikie_complete_database.sql</span>
                  <span className="text-[10px] text-slate-500 font-mono">PostgreSQL 14+ / Supabase Schema</span>
                </div>
                <pre className="mt-3 p-3 bg-slate-900 rounded-xl overflow-x-auto font-mono text-slate-300 max-h-96 text-[11px] leading-relaxed">
                  {BIKIE_COMPLETE_SQL_SCHEMA}
                </pre>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ============================================================== */}
      {/* PRODUCT CREATE / EDIT MODAL                                    */}
      {/* ============================================================== */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white font-['Outfit']">
                {products.some((p) => p.id === editingProduct.id)
                  ? 'Editar Producto'
                  : 'Crear Nuevo Producto'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Nombre del Producto</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, name: e.target.value })
                  }
                  placeholder="ej. Cuaderno Espiral A4 80 Hojas Cuadriculado"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              {/* Category Assignment Dropdown */}
              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Categoría / Departamento Asignado
                </label>
                <select
                  value={editingProduct.category_id}
                  onChange={(e) => {
                    const catId = e.target.value;
                    const catObj = categories.find((c) => c.id === catId);
                    setEditingProduct({
                      ...editingProduct,
                      category_id: catId,
                      category_name: catObj ? catObj.name : editingProduct.category_name,
                    });
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Marca</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.brand}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, brand: e.target.value })
                    }
                    placeholder="ej. Oxford, BIC, Milan"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.sku}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, sku: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Precio Compra (XAF)
                  </label>
                  <input
                    type="number"
                    value={editingProduct.purchase_price}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        purchase_price: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Precio Venta (XAF)
                  </label>
                  <input
                    type="number"
                    required
                    value={editingProduct.sale_price}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        sale_price: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Stock Actual</label>
                  <input
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        stock: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Stock Mínimo Alerta
                  </label>
                  <input
                    type="number"
                    value={editingProduct.min_stock}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        min_stock: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              {/* IMAGE UPLOAD: URL vs FILE FROM COMPUTER */}
              <div className="space-y-2 pt-1 border-t border-slate-800">
                <label className="block text-slate-300 font-bold">
                  Fotografía del Producto
                </label>

                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setProductImageTab('url')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                      productImageTab === 'url'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Link className="w-3.5 h-3.5" />
                    <span>Enlace Web (URL)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProductImageTab('file')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                      productImageTab === 'file'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir desde Ordenador</span>
                  </button>
                </div>

                {productImageTab === 'url' ? (
                  <input
                    type="text"
                    value={editingProduct.image}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, image: e.target.value })
                    }
                    placeholder="https://ejemplo.com/foto-producto.jpg"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white text-xs"
                  />
                ) : (
                  <div className="p-4 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-800/40 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProductFileUpload}
                      id="product-file-input"
                      className="hidden"
                    />
                    <label
                      htmlFor="product-file-input"
                      className="cursor-pointer flex flex-col items-center gap-2 text-slate-300 hover:text-white"
                    >
                      <Upload className="w-6 h-6 text-red-500" />
                      <span className="font-bold text-xs">
                        Haz clic aquí para seleccionar imagen de tu equipo
                      </span>
                      <span className="text-[10px] text-slate-500">
                        PNG, JPG, WEBP o JPEG soportados
                      </span>
                    </label>
                  </div>
                )}

                {/* Live Image Preview */}
                {editingProduct.image && (
                  <div className="flex items-center gap-3 p-2 bg-slate-800 rounded-xl mt-2 border border-slate-700">
                    <img
                      src={editingProduct.image}
                      alt="Preview"
                      className="w-12 h-12 rounded-lg object-cover bg-slate-900 border border-slate-600"
                    />
                    <div className="truncate flex-1">
                      <p className="text-[11px] font-bold text-white">Vista previa de imagen</p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {editingProduct.image.substring(0, 50)}...
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={editingProduct.description}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer shadow-md shadow-red-950"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* CATEGORY CREATE / EDIT MODAL                                   */}
      {/* ============================================================== */}
      {isCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white font-['Outfit'] flex items-center gap-2">
                <Folder className="w-5 h-5 text-red-500" />
                {categories.some((c) => c.id === editingCategory.id)
                  ? 'Editar Categoría'
                  : 'Nueva Categoría de Papelería'}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Nombre de la Categoría
                </label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, name: e.target.value })
                  }
                  placeholder="ej. Material Escolar, Mochilas, Bellas Artes"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Slug (identificador URL)
                  </label>
                  <input
                    type="text"
                    value={editingCategory.slug}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, slug: e.target.value })
                    }
                    placeholder="ej. material-escolar"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Orden de Visualización
                  </label>
                  <input
                    type="number"
                    value={editingCategory.display_order || 1}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        display_order: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-slate-400 font-bold mb-1.5">
                  Icono Representativo
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {[
                    { id: 'GraduationCap', label: 'Escolar' },
                    { id: 'Briefcase', label: 'Oficina' },
                    { id: 'PenTool', label: 'Escritura' },
                    { id: 'BookOpen', label: 'Libros' },
                    { id: 'Palette', label: 'Arte' },
                    { id: 'Backpack', label: 'Mochilas' },
                    { id: 'FileText', label: 'Papel' },
                    { id: 'Laptop', label: 'Tecnología' },
                    { id: 'Calculator', label: 'Cálculo' },
                    { id: 'Folder', label: 'Carpetas' },
                    { id: 'Sparkles', label: 'Destacados' },
                  ].map((ic) => (
                    <button
                      key={ic.id}
                      type="button"
                      onClick={() =>
                        setEditingCategory({ ...editingCategory, icon: ic.id })
                      }
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        editingCategory.icon === ic.id
                          ? 'border-red-500 bg-red-600/20 text-red-400 font-bold ring-2 ring-red-500/30'
                          : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {renderCategoryIcon(ic.id)}
                      <span className="text-[9px] truncate">{ic.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CATEGORY IMAGE UPLOAD: URL vs FILE FROM COMPUTER */}
              <div className="space-y-2 pt-1 border-t border-slate-800">
                <label className="block text-slate-300 font-bold">
                  Foto de Portada de la Categoría
                </label>

                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setCategoryImageTab('url')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                      categoryImageTab === 'url'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Link className="w-3.5 h-3.5" />
                    <span>Enlace Web (URL)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategoryImageTab('file')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                      categoryImageTab === 'file'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir desde Ordenador</span>
                  </button>
                </div>

                {categoryImageTab === 'url' ? (
                  <input
                    type="text"
                    value={editingCategory.image || ''}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, image: e.target.value })
                    }
                    placeholder="https://ejemplo.com/portada-categoria.jpg"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white text-xs"
                  />
                ) : (
                  <div className="p-4 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-800/40 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCategoryFileUpload}
                      id="category-file-input"
                      className="hidden"
                    />
                    <label
                      htmlFor="category-file-input"
                      className="cursor-pointer flex flex-col items-center gap-2 text-slate-300 hover:text-white"
                    >
                      <Upload className="w-6 h-6 text-red-500" />
                      <span className="font-bold text-xs">
                        Selecciona imagen o foto desde tu ordenador
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Formato recomendado 16:9 o cuadrado
                      </span>
                    </label>
                  </div>
                )}

                {/* Category Image Preview */}
                {editingCategory.image && (
                  <div className="flex items-center gap-3 p-2 bg-slate-800 rounded-xl mt-2 border border-slate-700">
                    <img
                      src={editingCategory.image}
                      alt="Preview"
                      className="w-14 h-10 rounded-lg object-cover bg-slate-900 border border-slate-600"
                    />
                    <div className="truncate flex-1">
                      <p className="text-[11px] font-bold text-white">Portada seleccionada</p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {editingCategory.image.substring(0, 50)}...
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Descripción Corta
                </label>
                <textarea
                  rows={2}
                  value={editingCategory.description || ''}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      description: e.target.value,
                    })
                  }
                  placeholder="Detalles sobre lo que se incluye en esta sección..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer shadow-md shadow-red-950"
                >
                  Guardar Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cash Modal */}
      {cashActionModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white font-['Outfit']">
              {cashActionModal === 'open'
                ? 'Apertura de Turno de Caja'
                : cashActionModal === 'close'
                ? 'Arqueo & Cierre de Caja'
                : 'Entrada / Salida de Efectivo'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  {cashActionModal === 'open'
                    ? 'Fondo inicial en caja (XAF)'
                    : cashActionModal === 'close'
                    ? 'Efectivo contado físicamente (XAF)'
                    : 'Monto en XAF (positivo para entrada, negativo para salida)'}
                </label>
                <input
                  type="number"
                  value={cashAmountInput}
                  onChange={(e) => setCashAmountInput(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-mono text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Motivo / Observaciones</label>
                <input
                  type="text"
                  value={cashReasonInput}
                  onChange={(e) => setCashReasonInput(e.target.value)}
                  placeholder="Detalles del movimiento..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCashActionModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCashRegisterSubmit}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white font-['Outfit']">Nuevo Proveedor</h3>

            <form onSubmit={handleSaveNewSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Nombre de Empresa / Proveedor</label>
                <input
                  type="text"
                  required
                  value={newSupplierCompany}
                  onChange={(e) => setNewSupplierCompany(e.target.value)}
                  placeholder="ej. Distribuidora Papelera Malabo"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Persona de Contacto</label>
                <input
                  type="text"
                  required
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="ej. Juan Obiang"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Teléfono</label>
                <input
                  type="text"
                  value={newSupplierPhone}
                  onChange={(e) => setNewSupplierPhone(e.target.value)}
                  placeholder="+240 222..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
