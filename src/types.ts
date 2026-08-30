export type UserRole = 'admin' | 'customer';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  points: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  image?: string;
  display_order: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category_id: string;
  category_name?: string;
  brand: string;
  sku: string;
  barcode?: string;
  purchase_price: number;
  sale_price: number;
  previous_price?: number;
  stock: number;
  min_stock: number;
  status: 'active' | 'draft' | 'out_of_stock';
  is_featured: boolean;
  is_new?: boolean;
  is_offer?: boolean;
  image: string;
  gallery?: string[];
  tags?: string[];
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'store' | 'transfer' | 'online' | 'other';

export interface OrderItem {
  product_id: string;
  product_name: string;
  product_image?: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Order {
  id: string;
  code: string; // e.g. "BIKIE-000001"
  customer_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_type: 'pickup' | 'delivery';
  delivery_address?: string;
  city?: string;
  notes?: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: 'unpaid' | 'paid';
  subtotal: number;
  discount: number;
  coupon_code?: string;
  total: number;
  items: OrderItem[];
  created_at: string;
  updated_at?: string;
}

export interface Offer {
  id: string;
  name: string;
  description: string;
  image?: string;
  type: 'percentage' | 'fixed' | 'special_price' | '2x1' | '3x2' | 'pack';
  discount_value: number; // percentage or fixed amount
  product_ids: string[];
  category_ids: string[];
  start_date: string;
  end_date: string;
  status: 'scheduled' | 'active' | 'paused' | 'finished';
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_uses: number;
  uses_count: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface SchoolPack {
  id: string;
  name: string;
  description: string;
  grade_level: string;
  price: number;
  original_price: number;
  image: string;
  badge?: string;
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
  }[];
}

export interface SchoolList {
  id: string;
  title: string;
  grade_level: 'Primaria' | 'Secundaria' | 'Bachillerato' | 'Universidad' | 'General';
  institution?: string;
  description: string;
  is_published: boolean;
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
    optional?: boolean;
  }[];
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  product_name: string;
  type: 'purchase' | 'sale' | 'return' | 'adjustment' | 'manual_in' | 'manual_out';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  user_name: string;
  created_at: string;
}

export interface Sale {
  id: string;
  code: string;
  type: 'online' | 'pos';
  customer_name: string;
  customer_phone?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  payment_method: PaymentMethod;
  cashier_name: string;
  notes?: string;
  created_at: string;
}

export interface CashRegister {
  id: string;
  opened_at: string;
  closed_at?: string;
  initial_amount: number;
  total_sales: number;
  total_in: number;
  total_out: number;
  expected_amount: number;
  counted_amount?: number;
  difference?: number;
  cashier_name: string;
  status: 'open' | 'closed';
  notes?: string;
}

export interface CashMovement {
  id: string;
  register_id: string;
  type: 'sale' | 'in' | 'out' | 'return';
  amount: number;
  reason: string;
  cashier_name: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  website?: string;
  notes?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  concept: string;
  category: 'rent' | 'utilities' | 'salaries' | 'supplies' | 'maintenance' | 'transport' | 'taxes' | 'other';
  amount: number;
  date: string;
  beneficiary?: string;
  payment_method?: PaymentMethod | 'cash';
  registered_by: string;
  notes?: string;
  receipt_url?: string;
  created_at: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: 'copies' | 'documents' | 'printing' | 'juices' | 'other';
  price: number;
  unit: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
}

export interface Purchase {
  id: string;
  code: string;
  supplier_id: string;
  supplier_name: string;
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
    purchase_price: number;
    total: number;
  }[];
  total: number;
  status: 'pending' | 'received' | 'cancelled';
  created_at: string;
  received_at?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  type: 'invoice' | 'receipt';
  order_or_sale_id: string;
  customer_name: string;
  customer_nif?: string;
  customer_phone?: string;
  customer_address?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  date: string;
  status: 'issued' | 'cancelled';
}

export interface AiDetectedItem {
  raw_line: string;
  detected_name: string;
  detected_quantity: number;
  attributes?: string[];
}

export interface AiMatchResult {
  detected_item: AiDetectedItem;
  matched_product?: Product;
  confidence: number; // 0 to 100
  confidence_label: 'high' | 'medium' | 'low' | 'none';
  status: 'confirmed' | 'warning' | 'unmatched';
  user_selected_quantity: number;
  available_stock: number;
  stock_limited: boolean;
  selected: boolean;
  notes?: string;
}

export interface AiScanRecord {
  id: string;
  customer_id?: string;
  image_url?: string;
  raw_text: string;
  detected_items_count: number;
  matched_items_count: number;
  confidence_avg: number;
  total_estimated: number;
  created_at: string;
  items: {
    product_name: string;
    quantity: number;
    price: number;
    confidence: number;
  }[];
}

export interface ActivityLog {
  id: string;
  user_name: string;
  user_role: string;
  action: string;
  entity?: string;
  entity_id?: string;
  details?: string;
  created_at: string;
}

export interface StoreSettings {
  name: string;
  slogan: string;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  opening_hours: string;
  currency: string;
  currency_symbol: string;
  logo_url: string;
  banner_headline: string;
  banner_subheadline: string;
  free_shipping_min: number;
  points_per_1000_xaf: number;
  facebook?: string;
  instagram?: string;
}

export interface AppNotification {
  id: string;
  target: 'admin' | 'customer';
  title: string;
  message: string;
  type: 'order' | 'stock' | 'ai' | 'info';
  link?: string;
  read: boolean;
  created_at: string;
}
