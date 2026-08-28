import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key] as string;
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.[key]) {
    return (import.meta as any).env[key] as string;
  }
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const BIKIE_COMPLETE_SQL_SCHEMA = `-- ==============================================================================
-- BIKIE — SISTEMA INTEGRAL DE PAPELERÍA & LIBRERÍA (MALABO, GUINEA ECUATORIAL)
-- ESQUEMA COMPLETO DE BASE DE DATOS POSTGRESQL / SUPABASE CON SEED DATA
-- Moneda Oficial: XAF (Franco CFA BEAC)
-- ==============================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Enumerados del Sistema
DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM ('admin', 'employee', 'inventory_manager', 'customer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE order_status_type AS ENUM ('pending', 'confirmed', 'preparing', 'ready_for_pickup', 'shipped', 'delivered', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_type AS ENUM ('store', 'transfer', 'online', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE product_status_type AS ENUM ('active', 'draft', 'out_of_stock');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE offer_type AS ENUM ('percentage', 'fixed', 'special_price', '2x1', '3x2', 'pack');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE inventory_movement_type AS ENUM ('purchase', 'sale', 'return', 'adjustment', 'manual_in', 'manual_out');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Tabla de Perfiles y Personal (Staff & Roles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role user_role_type DEFAULT 'customer',
    points INTEGER DEFAULT 0,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Categorías de Productos
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    image TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Catálogo de Productos
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    brand TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    barcode TEXT UNIQUE,
    purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    sale_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    previous_price NUMERIC(12, 2),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    min_stock INTEGER NOT NULL DEFAULT 5,
    status product_status_type DEFAULT 'active',
    is_featured BOOLEAN DEFAULT FALSE,
    is_new BOOLEAN DEFAULT FALSE,
    is_offer BOOLEAN DEFAULT FALSE,
    image TEXT NOT NULL,
    gallery TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Packs Escolares Predefinidos
CREATE TABLE IF NOT EXISTS public.school_packs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    school_level TEXT NOT NULL,
    grade TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    original_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    image TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_popular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Pedidos de Clientes (Orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    customer_id TEXT,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_type TEXT DEFAULT 'pickup',
    delivery_address TEXT,
    city TEXT DEFAULT 'Malabo',
    notes TEXT,
    status order_status_type DEFAULT 'pending',
    payment_method payment_method_type DEFAULT 'store',
    payment_status TEXT DEFAULT 'unpaid',
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(12, 2) DEFAULT 0,
    coupon_code TEXT,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Ofertas y Promociones
CREATE TABLE IF NOT EXISTS public.offers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image TEXT,
    type offer_type DEFAULT 'percentage',
    discount_value NUMERIC(12, 2) NOT NULL,
    product_ids TEXT[] DEFAULT '{}',
    category_ids TEXT[] DEFAULT '{}',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Cupones de Descuento
CREATE TABLE IF NOT EXISTS public.coupons (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT DEFAULT 'percent',
    discount_value NUMERIC(12, 2) NOT NULL,
    min_purchase NUMERIC(12, 2) DEFAULT 0,
    max_uses INTEGER DEFAULT 100,
    uses_count INTEGER DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Kardex y Movimientos de Inventario
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id TEXT PRIMARY KEY,
    product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    type inventory_movement_type NOT NULL,
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason TEXT NOT NULL,
    user_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Ventas Mostrador (POS)
CREATE TABLE IF NOT EXISTS public.sales (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    type TEXT DEFAULT 'pos',
    customer_name TEXT DEFAULT 'Cliente Mostrador',
    customer_phone TEXT,
    items JSONB NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    discount NUMERIC(12, 2) DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL,
    payment_method payment_method_type DEFAULT 'store',
    cashier_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Módulo de Caja y Arqueo (Cash Register & Shifts)
CREATE TABLE IF NOT EXISTS public.cash_registers (
    id TEXT PRIMARY KEY,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    initial_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_sales NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_in NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_out NUMERIC(12, 2) NOT NULL DEFAULT 0,
    expected_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    counted_amount NUMERIC(12, 2),
    difference NUMERIC(12, 2),
    cashier_name TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    notes TEXT
);

CREATE TABLE IF NOT EXISTS public.cash_movements (
    id TEXT PRIMARY KEY,
    cash_register_id TEXT REFERENCES public.cash_registers(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('in', 'out')),
    amount NUMERIC(12, 2) NOT NULL,
    reason TEXT NOT NULL,
    user_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Proveedores y Órdenes de Compra
CREATE TABLE IF NOT EXISTS public.suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchases (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    supplier_id TEXT REFERENCES public.suppliers(id) ON DELETE SET NULL,
    supplier_name TEXT NOT NULL,
    items JSONB NOT NULL,
    total NUMERIC(12, 2) NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    received_at TIMESTAMPTZ
);

-- 14. Historial de Escaneos de Listas Escolares con IA
CREATE TABLE IF NOT EXISTS public.ai_scans (
    id TEXT PRIMARY KEY,
    customer_name TEXT,
    customer_phone TEXT,
    image_url TEXT,
    raw_text TEXT,
    detected_items_count INTEGER DEFAULT 0,
    matched_items_count INTEGER DEFAULT 0,
    confidence_avg NUMERIC(5, 2) DEFAULT 0,
    total_estimated NUMERIC(12, 2) DEFAULT 0,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Registro de Auditoría y Actividad del Personal
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Configuración de Tienda BIKIE
CREATE TABLE IF NOT EXISTS public.store_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    name TEXT NOT NULL DEFAULT 'BIKIE',
    slogan TEXT DEFAULT 'Todo lo que necesitas para estudiar, trabajar y crear',
    phone TEXT DEFAULT '+240 222 345 678',
    whatsapp TEXT DEFAULT '+240 555 890 123',
    email TEXT DEFAULT 'contacto@bikie-papeleria.com',
    address TEXT DEFAULT 'Avenida de la Independencia, Malabo, Guinea Ecuatorial',
    city TEXT DEFAULT 'Malabo',
    opening_hours TEXT DEFAULT 'Lunes a Sábado: 08:00 - 19:30',
    currency TEXT DEFAULT 'XAF',
    currency_symbol TEXT DEFAULT 'FCFA',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- SEED DATA INICIAL (PRODUCTOS, CATEGORÍAS, PERSONAL Y CONFIGURACIÓN)
-- ==============================================================================

-- Configuración
INSERT INTO public.store_settings (id, name, slogan, phone, whatsapp, email, address, city, currency, currency_symbol)
VALUES (1, 'BIKIE', 'Todo lo que necesitas para estudiar, trabajar y crear', '+240 222 345 678', '+240 555 890 123', 'contacto@bikie-papeleria.com', 'Avenida de la Independencia, Edificio Central, Malabo', 'Malabo', 'XAF', 'FCFA')
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Usuario Administrador Real BIKIE (Propietaria)
INSERT INTO public.profiles (id, name, email, phone, role, points) VALUES
('usr-tia-admin-01', 'Propietaria BIKIE (Tía)', 'propietaria@bikie.gq', '+240 222 111 000', 'admin', 1500)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role;

-- Categorías
INSERT INTO public.categories (id, name, slug, description, icon, display_order) VALUES
('cat-escolar', 'Material escolar', 'material-escolar', 'Todo lo necesario para el colegio, instituto y universidad', 'GraduationCap', 1),
('cat-oficina', 'Oficina', 'oficina', 'Suministros profesionales y ergonomía para tu espacio de trabajo', 'Briefcase', 2),
('cat-escritura', 'Escritura', 'escritura', 'Bolígrafos, plumas, portaminas, rotuladores y marcadores', 'PenTool', 3),
('cat-cuadernos', 'Cuadernos', 'cuadernos', 'Cuadernos espiral, libretas cosidas, agendas y blocs', 'BookOpen', 4),
('cat-bellasartes', 'Bellas artes & Creatividad', 'bellas-artes', 'Pinturas acrílicas, óleos, lienzos, pinceles y modelado', 'Palette', 5),
('cat-mochilas', 'Mochilas & Estuches', 'mochilas-estuches', 'Mochilas ergonómicas, estuches triples y portadocumentos', 'Backpack', 6),
('cat-papeleria', 'Papel & Cartulinas', 'papel-cartulinas', 'Folios multifunción A4/A3, cartulinas de colores y papel charol', 'FileText', 7),
('cat-tecnologia', 'Tecnología escolar', 'tecnologia-escolar', 'Calculadoras científicas, memorias USB y accesorios', 'Laptop', 8)
ON CONFLICT (id) DO NOTHING;

-- Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_code ON public.orders(code);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON public.sales(created_at);

-- ==============================================================================
-- POLÍTICAS DE ACCESO (ROW LEVEL SECURITY)
-- ==============================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_packs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Public Read School Packs" ON public.school_packs FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Public Insert Orders" ON public.orders FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
`;

/**
 * Helper to download the complete database as a .sql file directly from browser
 */
export const downloadDatabaseSchemaSql = () => {
  const blob = new Blob([BIKIE_COMPLETE_SQL_SCHEMA], { type: 'text/sql;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'bikie_complete_database.sql');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
