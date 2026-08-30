import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Product,
  Category,
  Order,
  Offer,
  Coupon,
  SchoolPack,
  SchoolList,
  Supplier,
  Purchase,
  CashRegister,
  CashMovement,
  InventoryMovement,
  Sale,
  UserProfile,
  StoreSettings,
  Expense,
  ServiceItem,
  ActivityLog,
} from '../types';

const getEnv = (key: string): string => {
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key] as string;
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.[key]) {
    return (import.meta as any).env[key] as string;
  }
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY');

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
      },
    })
  : null;

// ==============================================================================
// COMPLETE POSTGRESQL / SUPABASE PRODUCTION SCHEMA FOR BIKIE PAPELERÍA
// ==============================================================================
export const BIKIE_COMPLETE_SQL_SCHEMA = `-- ==============================================================================
-- BIKIE PAPELERÍA & LIBRERÍA (MALABO, GUINEA ECUATORIAL)
-- ESQUEMA DE BASE DE DATOS POSTGRESQL / SUPABASE DE PRODUCCIÓN
-- Moneda: XAF (Franco CFA BEAC) | Teléfono: 222213126 | Ubicación: Paraíso, Malabo
-- ==============================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Configuración y datos generales de la tienda
CREATE TABLE IF NOT EXISTS public.store_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    name TEXT NOT NULL DEFAULT 'BIKIE',
    slogan TEXT DEFAULT 'Todo lo que necesitas para estudiar, trabajar y crear',
    description TEXT DEFAULT 'Papelería, librería, material escolar, oficina y servicios de copistería en Malabo.',
    phone TEXT DEFAULT '222213126',
    whatsapp TEXT DEFAULT '222213126',
    email TEXT DEFAULT 'contacto@bikie-papeleria.com',
    address TEXT DEFAULT 'Paraiso, cerca de banje, Malabo, Guinea Ecuatorial',
    city TEXT DEFAULT 'Malabo',
    opening_hours TEXT DEFAULT 'Lunes a Sábado: 08:00 - 19:30',
    currency TEXT DEFAULT 'XAF',
    currency_symbol TEXT DEFAULT 'FCFA',
    free_shipping_min NUMERIC(12, 2) DEFAULT 25000,
    banner_headline TEXT DEFAULT 'Todo lo que necesitas para estudiar, trabajar y crear.',
    banner_subheadline TEXT DEFAULT 'Papelería profesional con tecnología inteligente para facilitar tu día a día.',
    points_per_1000_xaf INTEGER DEFAULT 10,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuración inicial por defecto si no existe
INSERT INTO public.store_settings (id, name, slogan, phone, whatsapp, address, city)
VALUES (1, 'BIKIE', 'Todo lo que necesitas para estudiar, trabajar y crear', '222213126', '222213126', 'Paraiso, cerca de banje, Malabo, Guinea Ecuatorial', 'Malabo')
ON CONFLICT (id) DO NOTHING;

-- 3. Tabla de Perfil Administrativo (Solo 1 administrador/propietario)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL DEFAULT 'María Lidia (Propietaria)',
    phone TEXT DEFAULT '+240 222 213 126',
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role = 'admin'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Categorías de Productos
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'Folder',
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
    brand TEXT NOT NULL DEFAULT 'BIKIE',
    sku TEXT UNIQUE NOT NULL,
    barcode TEXT,
    purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    sale_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    previous_price NUMERIC(12, 2),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    min_stock INTEGER NOT NULL DEFAULT 5,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'out_of_stock')),
    is_featured BOOLEAN DEFAULT FALSE,
    is_new BOOLEAN DEFAULT FALSE,
    is_offer BOOLEAN DEFAULT FALSE,
    image TEXT NOT NULL,
    gallery TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

-- 6. Servicios de Copistería, Documentos y Bebidas
CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'copies' CHECK (category IN ('copies', 'documents', 'printing', 'juices', 'other')),
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'unidad',
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Pedidos Online de Clientes (Sin requerir login previo)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT NOT NULL,
    delivery_type TEXT DEFAULT 'pickup' CHECK (delivery_type IN ('pickup', 'delivery')),
    delivery_address TEXT,
    city TEXT DEFAULT 'Malabo',
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready_for_pickup', 'shipped', 'delivered', 'cancelled')),
    payment_method TEXT DEFAULT 'store' CHECK (payment_method IN ('store', 'transfer', 'online', 'other')),
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(12, 2) DEFAULT 0,
    coupon_code TEXT,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_code ON public.orders(code);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- 8. Ventas Mostrador (POS)
CREATE TABLE IF NOT EXISTS public.sales (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    type TEXT DEFAULT 'pos' CHECK (type IN ('pos', 'online')),
    customer_name TEXT DEFAULT 'Cliente Mostrador',
    customer_phone TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(12, 2) DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_method TEXT DEFAULT 'store',
    cashier_name TEXT NOT NULL DEFAULT 'María Lidia (Administradora)',
    notes TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'refunded', 'cancelled')),
    refund_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Control de Caja y Arqueos Diarios
CREATE TABLE IF NOT EXISTS public.cash_registers (
    id TEXT PRIMARY KEY,
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    initial_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_sales NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_in NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_out NUMERIC(12, 2) NOT NULL DEFAULT 0,
    expected_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    counted_amount NUMERIC(12, 2),
    difference NUMERIC(12, 2),
    cashier_name TEXT NOT NULL DEFAULT 'María Lidia (Administradora)',
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS public.cash_movements (
    id TEXT PRIMARY KEY,
    register_id TEXT REFERENCES public.cash_registers(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('sale', 'in', 'out', 'return')),
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    reason TEXT NOT NULL,
    cashier_name TEXT NOT NULL DEFAULT 'María Lidia (Administradora)',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Gastos Operativos de la Papelería
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    concept TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('rent', 'utilities', 'salaries', 'supplies', 'maintenance', 'transport', 'taxes', 'other')),
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    beneficiary TEXT,
    payment_method TEXT DEFAULT 'cash',
    registered_by TEXT NOT NULL DEFAULT 'María Lidia (Administradora)',
    notes TEXT,
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Movimientos de Inventario (Kardex)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id TEXT PRIMARY KEY,
    product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('purchase', 'sale', 'return', 'adjustment', 'manual_in', 'manual_out', 'initial')),
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason TEXT NOT NULL,
    user_name TEXT NOT NULL DEFAULT 'María Lidia (Administradora)',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Proveedores y Compras
CREATE TABLE IF NOT EXISTS public.suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    website TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchases (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    supplier_id TEXT REFERENCES public.suppliers(id) ON DELETE SET NULL,
    supplier_name TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    received_at TIMESTAMPTZ
);

-- 13. Packs y Listas Escolares
CREATE TABLE IF NOT EXISTS public.school_packs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    grade_level TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    original_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    image TEXT,
    badge TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.school_lists (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    grade_level TEXT NOT NULL,
    institution TEXT,
    description TEXT,
    is_published BOOLEAN DEFAULT TRUE,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Ofertas y Cupones
CREATE TABLE IF NOT EXISTS public.offers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image TEXT,
    type TEXT NOT NULL,
    discount_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    product_ids TEXT[] DEFAULT '{}',
    category_ids TEXT[] DEFAULT '{}',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('scheduled', 'active', 'paused', 'finished')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coupons (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
    discount_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    min_purchase NUMERIC(12, 2) DEFAULT 0,
    max_uses INTEGER DEFAULT 100,
    uses_count INTEGER DEFAULT 0,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Auditoría de Actividad Administrativa
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL DEFAULT 'María Lidia (Administradora)',
    user_role TEXT NOT NULL DEFAULT 'admin',
    action TEXT NOT NULL,
    entity TEXT,
    entity_id TEXT,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Eventos y Visitas Anónimas (Respetando Privacidad)
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_name TEXT NOT NULL,
    page TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES (IDEMPOTENT & SAFE TO RE-RUN)
-- ==============================================================================
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- ACCESO PÚBLICO DE LECTURA (Catálogo, servicios, configuración, ofertas para clientes sin login)
DROP POLICY IF EXISTS "Public Read Settings" ON public.store_settings;
CREATE POLICY "Public Read Settings" ON public.store_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Categories" ON public.categories;
CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Active Products" ON public.products;
CREATE POLICY "Public Read Active Products" ON public.products FOR SELECT USING (status = 'active' OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public Read Active Services" ON public.services;
CREATE POLICY "Public Read Active Services" ON public.services FOR SELECT USING (is_active = true OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public Read School Packs" ON public.school_packs;
CREATE POLICY "Public Read School Packs" ON public.school_packs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read School Lists" ON public.school_lists;
CREATE POLICY "Public Read School Lists" ON public.school_lists FOR SELECT USING (is_published = true OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public Read Active Offers" ON public.offers;
CREATE POLICY "Public Read Active Offers" ON public.offers FOR SELECT USING (status = 'active' OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public Read Active Coupons" ON public.coupons;
CREATE POLICY "Public Read Active Coupons" ON public.coupons FOR SELECT USING (is_active = true OR auth.role() = 'authenticated');

-- ACCESO PÚBLICO PARA CREAR PEDIDOS Y ENVIAR ANALÍTICA ANÓNIMA
DROP POLICY IF EXISTS "Public Insert Orders" ON public.orders;
CREATE POLICY "Public Insert Orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Track Orders By Phone Or Code" ON public.orders;
CREATE POLICY "Public Track Orders By Phone Or Code" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Orders" ON public.orders;
CREATE POLICY "Public Read Orders" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Analytics" ON public.analytics_events;
CREATE POLICY "Public Insert Analytics" ON public.analytics_events FOR INSERT WITH CHECK (true);

-- ACCESO TOTAL PARA EL ADMINISTRADOR AUTENTICADO
DROP POLICY IF EXISTS "Admin Full Access Settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admin Full Settings" ON public.store_settings;
CREATE POLICY "Admin Full Access Settings" ON public.store_settings FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Full Access Profiles" ON public.profiles;
CREATE POLICY "Admin Full Access Profiles" ON public.profiles FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Full Access Categories" ON public.categories;
DROP POLICY IF EXISTS "Admin Full Categories" ON public.categories;
CREATE POLICY "Admin Full Access Categories" ON public.categories FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Full Access Products" ON public.products;
DROP POLICY IF EXISTS "Admin Full Products" ON public.products;
CREATE POLICY "Admin Full Access Products" ON public.products FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Full Access Services" ON public.services;
CREATE POLICY "Admin Full Access Services" ON public.services FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Full Access Orders" ON public.orders;
DROP POLICY IF EXISTS "Admin Full Orders" ON public.orders;
CREATE POLICY "Admin Full Access Orders" ON public.orders FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Full Access Sales" ON public.sales;
DROP POLICY IF EXISTS "Admin Full Sales" ON public.sales;
CREATE POLICY "Admin Full Access Sales" ON public.sales FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Full Access Cash" ON public.cash_registers;
CREATE POLICY "Admin Full Access Cash" ON public.cash_registers FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Full Access Cash Movements" ON public.cash_movements;
CREATE POLICY "Admin Full Access Cash Movements" ON public.cash_movements FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Full Access Expenses" ON public.expenses;
CREATE POLICY "Admin Full Access Expenses" ON public.expenses FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Full Access Inventory" ON public.inventory_movements;
CREATE POLICY "Admin Full Access Inventory" ON public.inventory_movements FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Full Access Suppliers" ON public.suppliers;
CREATE POLICY "Admin Full Access Suppliers" ON public.suppliers FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Full Access Purchases" ON public.purchases;
CREATE POLICY "Admin Full Access Purchases" ON public.purchases FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Full Access School Packs" ON public.school_packs;
CREATE POLICY "Admin Full Access School Packs" ON public.school_packs FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Full Access School Lists" ON public.school_lists;
CREATE POLICY "Admin Full Access School Lists" ON public.school_lists FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Full Access Offers" ON public.offers;
CREATE POLICY "Admin Full Access Offers" ON public.offers FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Full Access Coupons" ON public.coupons;
CREATE POLICY "Admin Full Access Coupons" ON public.coupons FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Full Access Logs" ON public.activity_logs;
CREATE POLICY "Admin Full Access Logs" ON public.activity_logs FOR ALL USING (auth.role() = 'authenticated');

-- ==============================================================================
-- RATE LIMITING EN AUTENTICACIÓN (PREVENCIÓN DE ATAQUES DE FUERZA BRUTA)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address TEXT NOT NULL,
    email TEXT,
    attempt_time TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time ON public.login_attempts(ip_address, attempt_time);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time ON public.login_attempts(email, attempt_time);

-- Función para verificar si una IP/Email ha excedido el límite de intentos (5 intentos en 15 minutos)
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(
    p_ip TEXT,
    p_email TEXT DEFAULT NULL,
    p_max_attempts INT DEFAULT 5,
    p_window_minutes INT DEFAULT 15
)
RETURNS BOOLEAN AS $$
DECLARE
    v_failed_attempts INT;
BEGIN
    SELECT COUNT(*)
    INTO v_failed_attempts
    FROM public.login_attempts
    WHERE (ip_address = p_ip OR (p_email IS NOT NULL AND email = LOWER(TRIM(p_email))))
      AND success = FALSE
      AND attempt_time > (NOW() - (p_window_minutes || ' minutes')::INTERVAL);

    IF v_failed_attempts >= p_max_attempts THEN
        RETURN FALSE; -- Bloqueado por Rate Limit
    END IF;

    RETURN TRUE; -- Permitido
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para registrar intento de login y auto-limpieza
CREATE OR REPLACE FUNCTION public.record_login_attempt(
    p_ip TEXT,
    p_email TEXT,
    p_success BOOLEAN
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.login_attempts (ip_address, email, success, attempt_time)
    VALUES (p_ip, LOWER(TRIM(p_email)), p_success, NOW());

    -- Si fue exitoso, limpiar intentos fallidos anteriores de esa IP o email
    IF p_success THEN
        DELETE FROM public.login_attempts
        WHERE (ip_address = p_ip OR email = LOWER(TRIM(p_email)))
          AND success = FALSE;
    END IF;

    -- Limpieza automática de registros antiguos (> 24 horas)
    DELETE FROM public.login_attempts
    WHERE attempt_time < (NOW() - INTERVAL '24 hours');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- TRIGGER PARA SINCRONIZAR PERFIL DE ADMINISTRADOR CON SUPABASE AUTH
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'María Lidia (Propietaria)'),
    COALESCE(NEW.raw_user_meta_data->>'phone', '+240 222 213 126'),
    'admin'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      name = EXCLUDED.name,
      updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_admin_user();
`;

// Standalone SQL scripts for easy reference
export const SUPABASE_RLS_PRODUCTS_CATEGORIES_SQL = `-- ==============================================================================
-- POLÍTICAS RLS ESPECÍFICAS PARA 'products' Y 'categories'
-- Lectura pública para todos los visitantes
-- Escritura (INSERT, UPDATE, DELETE) exclusiva para Administrador autenticado
-- ==============================================================================

-- 1. TABLA 'categories'
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Categories" ON public.categories;
CREATE POLICY "Public Read Categories" 
ON public.categories FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admin Insert Categories" ON public.categories;
CREATE POLICY "Admin Insert Categories" 
ON public.categories FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Update Categories" ON public.categories;
CREATE POLICY "Admin Update Categories" 
ON public.categories FOR UPDATE 
USING (auth.role() = 'authenticated') 
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Delete Categories" ON public.categories;
CREATE POLICY "Admin Delete Categories" 
ON public.categories FOR DELETE 
USING (auth.role() = 'authenticated');


-- 2. TABLA 'products'
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Active Products" ON public.products;
CREATE POLICY "Public Read Active Products" 
ON public.products FOR SELECT 
USING (status = 'active' OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Insert Products" ON public.products;
CREATE POLICY "Admin Insert Products" 
ON public.products FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Update Products" ON public.products;
CREATE POLICY "Admin Update Products" 
ON public.products FOR UPDATE 
USING (auth.role() = 'authenticated') 
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Delete Products" ON public.products;
CREATE POLICY "Admin Delete Products" 
ON public.products FOR DELETE 
USING (auth.role() = 'authenticated');
`;

export const SUPABASE_RATE_LIMIT_SQL = `-- ==============================================================================
-- RATE LIMITING EN SUPABASE / POSTGRESQL (PREVENCIÓN DE FUERZA BRUTA)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address TEXT NOT NULL,
    email TEXT,
    attempt_time TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time ON public.login_attempts(ip_address, attempt_time);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time ON public.login_attempts(email, attempt_time);

CREATE OR REPLACE FUNCTION public.check_login_rate_limit(
    p_ip TEXT,
    p_email TEXT DEFAULT NULL,
    p_max_attempts INT DEFAULT 5,
    p_window_minutes INT DEFAULT 15
)
RETURNS BOOLEAN AS $$
DECLARE
    v_failed_attempts INT;
BEGIN
    SELECT COUNT(*)
    INTO v_failed_attempts
    FROM public.login_attempts
    WHERE (ip_address = p_ip OR (p_email IS NOT NULL AND email = LOWER(TRIM(p_email))))
      AND success = FALSE
      AND attempt_time > (NOW() - (p_window_minutes || ' minutes')::INTERVAL);

    IF v_failed_attempts >= p_max_attempts THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.record_login_attempt(
    p_ip TEXT,
    p_email TEXT,
    p_success BOOLEAN
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.login_attempts (ip_address, email, success, attempt_time)
    VALUES (p_ip, LOWER(TRIM(p_email)), p_success, NOW());

    IF p_success THEN
        DELETE FROM public.login_attempts
        WHERE (ip_address = p_ip OR email = LOWER(TRIM(p_email)))
          AND success = FALSE;
    END IF;

    DELETE FROM public.login_attempts
    WHERE attempt_time < (NOW() - INTERVAL '24 hours');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

// Direct Supabase Service Helper
export const supabaseDbService = {
  // Products
  async getProducts(): Promise<Product[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Product[];
    } catch (err) {
      console.error('Supabase getProducts error:', err);
      return [];
    }
  },

  async saveProduct(product: Partial<Product>): Promise<Product | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('products').upsert(product).select().single();
      if (error) throw error;
      return data as Product;
    } catch (err) {
      console.error('Supabase saveProduct error:', err);
      return null;
    }
  },

  async deleteProduct(id: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      return !error;
    } catch (err) {
      console.error('Supabase deleteProduct error:', err);
      return false;
    }
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('categories').select('*').order('display_order', { ascending: true });
      if (error) throw error;
      return (data || []) as Category[];
    } catch (err) {
      console.error('Supabase getCategories error:', err);
      return [];
    }
  },

  async saveCategory(category: Partial<Category>): Promise<Category | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('categories').upsert(category).select().single();
      if (error) throw error;
      return data as Category;
    } catch (err) {
      console.error('Supabase saveCategory error:', err);
      return null;
    }
  },

  // Orders
  async getOrders(): Promise<Order[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Order[];
    } catch (err) {
      console.error('Supabase getOrders error:', err);
      return [];
    }
  },

  async createOrder(order: Partial<Order>): Promise<Order | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('orders').insert(order).select().single();
      if (error) throw error;
      return data as Order;
    } catch (err) {
      console.error('Supabase createOrder error:', err);
      return null;
    }
  },

  async updateOrderStatus(id: string, status: string, payment_status?: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (payment_status) updates.payment_status = payment_status;
      const { error } = await supabase.from('orders').update(updates).eq('id', id);
      return !error;
    } catch (err) {
      console.error('Supabase updateOrderStatus error:', err);
      return false;
    }
  },

  // Sales
  async getSales(): Promise<Sale[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Sale[];
    } catch (err) {
      console.error('Supabase getSales error:', err);
      return [];
    }
  },

  async createSale(sale: Partial<Sale>): Promise<Sale | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('sales').insert(sale).select().single();
      if (error) throw error;
      return data as Sale;
    } catch (err) {
      console.error('Supabase createSale error:', err);
      return null;
    }
  },

  // Services
  async getServices(): Promise<ServiceItem[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('services').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as ServiceItem[];
    } catch (err) {
      console.error('Supabase getServices error:', err);
      return [];
    }
  },

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
      if (error) throw error;
      return (data || []) as Expense[];
    } catch (err) {
      console.error('Supabase getExpenses error:', err);
      return [];
    }
  },

  async createExpense(expense: Partial<Expense>): Promise<Expense | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('expenses').insert(expense).select().single();
      if (error) throw error;
      return data as Expense;
    } catch (err) {
      console.error('Supabase createExpense error:', err);
      return null;
    }
  },

  // Settings
  async getSettings(): Promise<StoreSettings | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('store_settings').select('*').eq('id', 1).single();
      if (error) throw error;
      return data as StoreSettings;
    } catch (err) {
      console.error('Supabase getSettings error:', err);
      return null;
    }
  },

  async updateSettings(settings: Partial<StoreSettings>): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('store_settings').update(settings).eq('id', 1);
      return !error;
    } catch (err) {
      console.error('Supabase updateSettings error:', err);
      return false;
    }
  },
};

export function downloadDatabaseSchemaSql() {
  const blob = new Blob([BIKIE_COMPLETE_SQL_SCHEMA], { type: 'text/sql;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'bikie_papeleria_schema.sql');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
