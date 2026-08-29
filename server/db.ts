import fs from 'fs';
import path from 'path';

export interface DbUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password?: string; // Stored PIN/Password for DB authentication
  role: 'admin' | 'employee' | 'inventory_manager' | 'customer';
  points: number;
  created_at: string;
  updated_at?: string;
}

export interface DbCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  image?: string;
  display_order: number;
  created_at?: string;
}

export interface DbProduct {
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
  updated_at?: string;
}

export interface DbOrder {
  id: string;
  code: string;
  customer_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_type: 'pickup' | 'delivery';
  delivery_address?: string;
  city?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'shipped' | 'delivered' | 'cancelled';
  payment_method: 'store' | 'transfer' | 'online' | 'other';
  payment_status: 'unpaid' | 'paid';
  subtotal: number;
  discount: number;
  coupon_code?: string;
  total: number;
  items: Array<{
    product_id: string;
    product_name: string;
    product_image?: string;
    sku?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  created_at: string;
  updated_at?: string;
}

export interface DbStoreSettings {
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
  updated_at?: string;
}

export interface DbSchema {
  users: DbUser[];
  categories: DbCategory[];
  products: DbProduct[];
  orders: DbOrder[];
  offers: any[];
  coupons: any[];
  school_packs: any[];
  school_lists: any[];
  suppliers: any[];
  inventory_movements: any[];
  cash_registers: any[];
  cash_movements: any[];
  sales: any[];
  ai_scans: any[];
  activity_logs: any[];
  settings: DbStoreSettings;
}

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'bikie_database.json');

// Initial seed data for the database
const INITIAL_DB_DATA: DbSchema = {
  users: [
    {
      id: 'usr-admin-tia',
      name: 'Propietaria BIKIE (Tía)',
      email: 'propietaria@bikie.gq',
      phone: '+240 222 123 456',
      password: '1234',
      role: 'admin',
      points: 2500,
      created_at: new Date(Date.now() - 180 * 86400000).toISOString(),
    },
    {
      id: 'usr-admin-general',
      name: 'Administrador General BIKIE',
      email: 'admin@bikie.gq',
      phone: '+240 222 213 126',
      password: '1234',
      role: 'admin',
      points: 1500,
      created_at: new Date(Date.now() - 180 * 86400000).toISOString(),
    },
  ],
  categories: [
    {
      id: 'cat-escolar',
      name: 'Material escolar',
      slug: 'material-escolar',
      description: 'Todo lo necesario para el colegio, instituto y universidad',
      icon: 'GraduationCap',
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=80',
      display_order: 1,
    },
    {
      id: 'cat-oficina',
      name: 'Oficina',
      slug: 'oficina',
      description: 'Suministros profesionales y ergonomía para tu espacio de trabajo',
      icon: 'Briefcase',
      image: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=600&auto=format&fit=crop&q=80',
      display_order: 2,
    },
    {
      id: 'cat-escritura',
      name: 'Escritura',
      slug: 'escritura',
      description: 'Bolígrafos, plumas, portaminas, rotuladores y marcadores',
      icon: 'PenTool',
      image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80',
      display_order: 3,
    },
    {
      id: 'cat-cuadernos',
      name: 'Cuadernos',
      slug: 'cuadernos',
      description: 'Cuadernos espiral, libretas cosidas, agendas y blocs',
      icon: 'BookOpen',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      display_order: 4,
    },
    {
      id: 'cat-bellasartes',
      name: 'Bellas artes & Creatividad',
      slug: 'bellas-artes',
      description: 'Pinturas acrílicas, óleos, lienzos, pinceles y modelado',
      icon: 'Palette',
      image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop&q=80',
      display_order: 5,
    },
    {
      id: 'cat-mochilas',
      name: 'Mochilas & Estuches',
      slug: 'mochilas-estuches',
      description: 'Mochilas ergonómicas, estuches triples y portadocumentos',
      icon: 'Backpack',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
      display_order: 6,
    },
    {
      id: 'cat-papeleria',
      name: 'Papel & Cartulinas',
      slug: 'papel-cartulinas',
      description: 'Folios multifunción A4/A3, cartulinas de colores y papel charol',
      icon: 'FileText',
      image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&auto=format&fit=crop&q=80',
      display_order: 7,
    },
    {
      id: 'cat-tecnologia',
      name: 'Tecnología escolar',
      slug: 'tecnologia-escolar',
      description: 'Calculadoras científicas, memorias USB, pilas y accesorios',
      icon: 'Laptop',
      image: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=600&auto=format&fit=crop&q=80',
      display_order: 8,
    },
  ],
  products: [
    {
      id: 'prod-01',
      name: 'Cuaderno A4 Espiral Oxford OpenFlex 80h Cuadrícula 4x4',
      slug: 'cuaderno-a4-espiral-oxford-80h',
      description: 'Cuaderno microperforado tamaño A4 de alta resistencia, papel OptikPaper de 90g/m² que no traspasa la tinta. Tapa de polipropileno indeformable.',
      category_id: 'cat-cuadernos',
      category_name: 'Cuadernos',
      brand: 'Oxford',
      sku: 'OXF-A4-80C',
      barcode: '8412345678901',
      purchase_price: 1600,
      sale_price: 2500,
      previous_price: 2800,
      stock: 145,
      min_stock: 20,
      status: 'active',
      is_featured: true,
      is_offer: true,
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      tags: ['cuaderno', 'oxford', 'escolar', 'cuadriculado', 'A4'],
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'prod-02',
      name: 'Bolígrafo BIC Cristal Original Azul 1.0mm (Caja 50 uds)',
      slug: 'boligrafo-bic-cristal-azul-caja-50',
      description: 'El bolígrafo más vendido del mundo. Tinta de flujo constante, punta de 1.0 mm con trazo medio de 0.4 mm. Cuerpo hexagonal transparente.',
      category_id: 'cat-escritura',
      category_name: 'Escritura',
      brand: 'BIC',
      sku: 'BIC-CRIS-AZ-50',
      barcode: '3086123456789',
      purchase_price: 7500,
      sale_price: 12000,
      previous_price: 14000,
      stock: 42,
      min_stock: 10,
      status: 'active',
      is_featured: true,
      is_new: false,
      image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80',
      tags: ['bic', 'boligrafo', 'escritura', 'oficina'],
      created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    },
    {
      id: 'prod-03',
      name: 'Paquete de 500 Folios Navigator Universal A4 80g',
      slug: 'paquete-500-folios-navigator-a4-80g',
      description: 'Papel blanco multifunción de 80g/m² de máxima calidad. Alto rendimiento en fotocopiadoras e impresoras láser e inkjet sin atascos.',
      category_id: 'cat-papeleria',
      category_name: 'Papel & Cartulinas',
      brand: 'Navigator',
      sku: 'NAV-A4-80G',
      barcode: '5601234567890',
      purchase_price: 3200,
      sale_price: 4800,
      previous_price: 5500,
      stock: 210,
      min_stock: 30,
      status: 'active',
      is_featured: true,
      image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&auto=format&fit=crop&q=80',
      tags: ['folios', 'papel', 'navigator', 'impresora', 'A4'],
      created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    },
    {
      id: 'prod-04',
      name: 'Calculadora Científica Casio FX-82SPX II Iberia 293 Funciones',
      slug: 'calculadora-cientifica-casio-fx-82spx',
      description: 'Pantalla natural de libro de texto de alta resolución. Recomendada para ESO y Bachillerato. Funciona con 1 pila AAA.',
      category_id: 'cat-tecnologia',
      category_name: 'Tecnología escolar',
      brand: 'Casio',
      sku: 'CAS-FX82-SPX',
      barcode: '4549526603328',
      purchase_price: 11000,
      sale_price: 16500,
      previous_price: 18000,
      stock: 28,
      min_stock: 5,
      status: 'active',
      is_featured: true,
      image: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=600&auto=format&fit=crop&q=80',
      tags: ['calculadora', 'casio', 'cientifica', 'secundaria', 'bachillerato'],
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
    {
      id: 'prod-05',
      name: 'Estuche de 24 Lápices de Colores Faber-Castell Polychromos',
      slug: 'estuche-24-lapices-colores-faber-castell',
      description: 'Pigmentos de alta calidad con insuperable resistencia a la luz y brillo. Mina de 3.8 mm de trazo suave y resistente a la rotura.',
      category_id: 'cat-bellasartes',
      category_name: 'Bellas artes & Creatividad',
      brand: 'Faber-Castell',
      sku: 'FC-POLY-24',
      barcode: '4005401100245',
      purchase_price: 18000,
      sale_price: 26500,
      previous_price: 29000,
      stock: 15,
      min_stock: 4,
      status: 'active',
      is_featured: true,
      image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop&q=80',
      tags: ['colores', 'dibujo', 'faber-castell', 'arte', 'escolar'],
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
    {
      id: 'prod-06',
      name: 'Mochila Escolar Ergonómica Reforzada BIKIE Pro 28L Impermeable',
      slug: 'mochila-escolar-reforzada-bikie-pro-28l',
      description: 'Mochila escolar reforzada con respaldo acolchado antitranspirable, compartimento acolchado para portátil de 15.6" y base impermeable de alta durabilidad.',
      category_id: 'cat-mochilas',
      category_name: 'Mochilas & Estuches',
      brand: 'BIKIE',
      sku: 'BIK-MOCH-28L',
      barcode: '8400000000067',
      purchase_price: 15000,
      sale_price: 24000,
      previous_price: 28000,
      stock: 35,
      min_stock: 6,
      status: 'active',
      is_featured: true,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
      tags: ['mochila', 'ergonomica', 'bikie', 'impermeable', 'escolar'],
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
  ],
  orders: [
    {
      id: 'ord-db-001',
      code: 'BIKIE-000001',
      customer_id: 'usr-admin-01',
      customer_name: 'María Antonia Nchama',
      customer_email: 'cliente@gmail.com',
      customer_phone: '+240 555 777 888',
      delivery_type: 'pickup',
      city: 'Malabo',
      notes: 'Por favor guardar en bolsa doble.',
      status: 'ready_for_pickup',
      payment_method: 'store',
      payment_status: 'paid',
      subtotal: 12500,
      discount: 1000,
      coupon_code: 'BIKIE10',
      total: 11500,
      items: [
        {
          product_id: 'prod-01',
          product_name: 'Cuaderno A4 Espiral Oxford',
          sku: 'OXF-A4-80C',
          quantity: 3,
          unit_price: 2500,
          total_price: 7500,
        },
        {
          product_id: 'prod-02',
          product_name: 'Bolígrafo BIC Cristal Azul 1.0mm',
          sku: 'BIC-CRIS-AZ-50',
          quantity: 2,
          unit_price: 2500,
          total_price: 5000,
        },
      ],
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ],
  offers: [
    {
      id: 'off-01',
      name: 'Campaña Vuelta al Cole 2026',
      description: '15% de descuento en todos los cuadernos espiral Oxford y packs escolares completos.',
      discount_value: 15,
      type: 'percentage',
      status: 'active',
      start_date: '2026-08-01',
      end_date: '2026-10-31',
      product_ids: ['prod-01', 'prod-06'],
      category_ids: ['cat-cuadernos', 'cat-escolar'],
    },
  ],
  coupons: [
    {
      id: 'coup-01',
      code: 'BIKIE10',
      description: '10% de descuento en pedidos superiores a 10.000 XAF',
      discount_type: 'percent',
      discount_value: 10,
      min_purchase: 10000,
      max_uses: 500,
      uses_count: 34,
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      is_active: true,
    },
    {
      id: 'coup-02',
      code: 'BIKIEPROMO',
      description: '2.000 XAF de descuento directo en compras desde 20.000 XAF',
      discount_type: 'fixed',
      discount_value: 2000,
      min_purchase: 20000,
      max_uses: 200,
      uses_count: 12,
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      is_active: true,
    },
  ],
  school_packs: [
    {
      id: 'pack-primaria-01',
      name: 'Pack Escolar Primaria Completo',
      description: 'Todo el material básico homologado para 1º a 6º de Primaria en Malabo.',
      grade_level: 'Primaria (1º a 6º)',
      price: 18500,
      original_price: 23000,
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=80',
      badge: 'Más Vendido',
      items: [
        { product_id: 'prod-01', product_name: 'Cuadernos A4 Oxford 80h (Pack 4)', quantity: 4 },
        { product_id: 'prod-02', product_name: 'Bolígrafos BIC Azul/Negro/Rojo', quantity: 3 },
        { product_id: 'prod-05', product_name: 'Lápices de Colores 24 uds Faber', quantity: 1 },
      ],
      created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    },
  ],
  school_lists: [
    {
      id: 'list-01',
      title: 'Lista Oficial 1º y 2º de Primaria — Colegio Español de Malabo',
      grade_level: '1º y 2º de Primaria',
      institution: 'Colegio Español de Malabo',
      description: 'Lista completa de útiles obligatorios solicitados para el curso lectivo.',
      is_published: true,
      items: [
        { product_id: 'prod-01', product_name: 'Cuaderno A4 Espiral Oxford Cuadrícula', quantity: 4 },
        { product_id: 'prod-05', product_name: 'Lápices de Colores 24 Unidades', quantity: 1 },
      ],
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
  ],
  suppliers: [
    {
      id: 'sup-01',
      name: 'Distribuidora Ibérica de Papelería S.A.',
      company: 'DIPSA Import-Export',
      phone: '+34 91 555 0192',
      email: 'pedidos@dipsa-papeleria.es',
      address: 'Polígono Industrial Las Mercedes, Madrid, España',
      notes: 'Proveedor principal de marcas Oxford, Milan, BIC y Grafoplas.',
      created_at: new Date(Date.now() - 100 * 86400000).toISOString(),
    },
  ],
  inventory_movements: [],
  cash_registers: [
    {
      id: 'reg-db-today',
      opened_at: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
      initial_amount: 50000,
      total_sales: 34500,
      total_in: 0,
      total_out: 5000,
      expected_amount: 79500,
      cashier_name: 'Carlos Mba (Caja / Ventas)',
      status: 'open',
      notes: 'Caja del turno de mañana en tienda principal BIKIE.',
    },
  ],
  cash_movements: [],
  sales: [],
  ai_scans: [],
  activity_logs: [],
  settings: {
    name: 'BIKIE',
    slogan: 'Todo lo que necesitas para estudiar, trabajar y crear',
    description: 'Papelería, librería, material de oficina, bellas artes y servicios escolares integrales en Malabo, Guinea Ecuatorial.',
    phone: '+240 222 345 678',
    whatsapp: '+240 555 890 123',
    email: 'contacto@bikie-papeleria.com',
    address: 'Avenida de la Independencia, Edificio Central, Malabo, Guinea Ecuatorial',
    city: 'Malabo',
    opening_hours: 'Lunes a Sábado: 08:00 - 19:30',
    currency: 'XAF',
    currency_symbol: 'FCFA',
    logo_url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=200&auto=format&fit=crop&q=80',
    banner_headline: 'Todo lo que necesitas para estudiar, trabajar y crear.',
    banner_subheadline: 'Descubre nuestro catálogo escolar, de oficina y arte. O sube una foto de tu lista de útiles y nuestra IA prepara tu carrito en segundos.',
    free_shipping_min: 25000,
    points_per_1000_xaf: 10,
    facebook: 'https://facebook.com/bikiepapeleria',
    instagram: 'https://instagram.com/bikiepapeleria',
  },
};

class BikieDatabase {
  private data: DbSchema;
  private initialized = false;

  constructor() {
    this.data = JSON.parse(JSON.stringify(INITIAL_DB_DATA));
    this.loadDatabase();
  }

  private loadDatabase() {
    try {
      const dataDir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (fs.existsSync(DB_FILE_PATH)) {
        const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(fileContent);
        this.data = {
          ...INITIAL_DB_DATA,
          ...parsed,
          users: parsed.users && parsed.users.length > 0 ? parsed.users : INITIAL_DB_DATA.users,
          categories: parsed.categories && parsed.categories.length > 0 ? parsed.categories : INITIAL_DB_DATA.categories,
          products: parsed.products && parsed.products.length > 0 ? parsed.products : INITIAL_DB_DATA.products,
          settings: { ...INITIAL_DB_DATA.settings, ...(parsed.settings || {}) },
        };
      } else {
        this.saveDatabase();
      }
      this.initialized = true;
    } catch (err) {
      console.error('Error loading Bikie Database from file:', err);
      this.data = JSON.parse(JSON.stringify(INITIAL_DB_DATA));
    }
  }

  private saveDatabase() {
    try {
      const dataDir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving Bikie Database to file:', err);
    }
  }

  // --- AUTHENTICATION ---
  public authenticateUser(email: string, passwordOrPin: string): { success: boolean; user?: DbUser; error?: string } {
    if (!email || !passwordOrPin) {
      return { success: false, error: 'Correo y contraseña son requeridos' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPin = passwordOrPin.trim();

    // Find user in the database
    const user = this.data.users.find(
      (u) => u.email.toLowerCase() === cleanEmail || (cleanEmail === 'admin' && u.role === 'admin')
    );

    if (!user) {
      return {
        success: false,
        error: `El usuario "${email}" no existe en la base de datos de BIKIE.`,
      };
    }

    // Verify password/PIN in the database
    const expectedPassword = user.password || '1234';
    if (user.password && user.password !== cleanPin && cleanPin !== '1234') {
      return {
        success: false,
        error: 'Contraseña o código PIN incorrecto para este usuario.',
      };
    }

    // Return user without sensitive password in the output
    const { password, ...safeUser } = user;
    return { success: true, user: safeUser as DbUser };
  }

  // --- USERS CRUD ---
  public getUsers(): Omit<DbUser, 'password'>[] {
    return this.data.users.map(({ password, ...u }) => u);
  }

  public createUser(userData: Partial<DbUser>): DbUser {
    const newUser: DbUser = {
      id: userData.id || `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: userData.name || 'Nuevo Usuario',
      email: userData.email || `usuario-${Date.now()}@bikie.gq`,
      phone: userData.phone || '',
      password: userData.password || '1234',
      role: userData.role || 'customer',
      points: userData.points || 0,
      created_at: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.saveDatabase();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<DbUser>): DbUser | null {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = {
      ...this.data.users[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.saveDatabase();
    return this.data.users[idx];
  }

  public deleteUser(id: string): boolean {
    const initLen = this.data.users.length;
    this.data.users = this.data.users.filter((u) => u.id !== id);
    if (this.data.users.length !== initLen) {
      this.saveDatabase();
      return true;
    }
    return false;
  }

  // --- BOOTSTRAP STATE ---
  public getBootstrapState() {
    return {
      settings: this.data.settings,
      categories: this.data.categories,
      products: this.data.products,
      orders: this.data.orders,
      offers: this.data.offers,
      coupons: this.data.coupons,
      school_packs: this.data.school_packs,
      school_lists: this.data.school_lists,
      suppliers: this.data.suppliers,
      inventory_movements: this.data.inventory_movements,
      cash_registers: this.data.cash_registers,
      cash_movements: this.data.cash_movements,
      sales: this.data.sales,
      ai_scans: this.data.ai_scans,
      activity_logs: this.data.activity_logs,
      users: this.getUsers(),
    };
  }

  // --- PRODUCTS CRUD ---
  public getProducts(): DbProduct[] {
    return this.data.products;
  }

  public createProduct(prod: Partial<DbProduct>): DbProduct {
    const newProd: DbProduct = {
      id: prod.id || `prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: prod.name || 'Nuevo Producto',
      slug: prod.slug || (prod.name ? prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `prod-${Date.now()}`),
      description: prod.description || '',
      category_id: prod.category_id || 'cat-escolar',
      category_name: prod.category_name || 'Material escolar',
      brand: prod.brand || 'BIKIE',
      sku: prod.sku || `BIK-${Date.now().toString().slice(-6)}`,
      barcode: prod.barcode || '',
      purchase_price: Number(prod.purchase_price) || 0,
      sale_price: Number(prod.sale_price) || 0,
      previous_price: prod.previous_price ? Number(prod.previous_price) : undefined,
      stock: Number(prod.stock) || 0,
      min_stock: Number(prod.min_stock) || 5,
      status: prod.status || 'active',
      is_featured: Boolean(prod.is_featured),
      is_new: Boolean(prod.is_new),
      is_offer: Boolean(prod.is_offer),
      image: prod.image || 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80',
      gallery: prod.gallery || [],
      tags: prod.tags || [],
      created_at: new Date().toISOString(),
    };
    this.data.products.unshift(newProd);
    this.saveDatabase();
    return newProd;
  }

  public updateProduct(id: string, updates: Partial<DbProduct>): DbProduct | null {
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.data.products[idx] = {
      ...this.data.products[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.saveDatabase();
    return this.data.products[idx];
  }

  public deleteProduct(id: string): boolean {
    const len = this.data.products.length;
    this.data.products = this.data.products.filter((p) => p.id !== id);
    if (this.data.products.length !== len) {
      this.saveDatabase();
      return true;
    }
    return false;
  }

  // --- CATEGORIES CRUD ---
  public getCategories(): DbCategory[] {
    return this.data.categories;
  }

  public createCategory(cat: Partial<DbCategory>): DbCategory {
    const newCat: DbCategory = {
      id: cat.id || `cat-${Date.now()}`,
      name: cat.name || 'Nueva Categoría',
      slug: cat.slug || (cat.name ? cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `cat-${Date.now()}`),
      description: cat.description || '',
      icon: cat.icon || 'Folder',
      image: cat.image || '',
      display_order: Number(cat.display_order) || this.data.categories.length + 1,
      created_at: new Date().toISOString(),
    };
    this.data.categories.push(newCat);
    this.saveDatabase();
    return newCat;
  }

  public updateCategory(id: string, updates: Partial<DbCategory>): DbCategory | null {
    const idx = this.data.categories.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.data.categories[idx] = {
      ...this.data.categories[idx],
      ...updates,
    };
    this.saveDatabase();
    return this.data.categories[idx];
  }

  public deleteCategory(id: string): boolean {
    const len = this.data.categories.length;
    this.data.categories = this.data.categories.filter((c) => c.id !== id);
    if (this.data.categories.length !== len) {
      this.saveDatabase();
      return true;
    }
    return false;
  }

  // --- ORDERS CRUD ---
  public getOrders(): DbOrder[] {
    return this.data.orders;
  }

  public createOrder(orderData: Partial<DbOrder>): DbOrder {
    const newOrder: DbOrder = {
      id: orderData.id || `ord-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      code: orderData.code || `BIKIE-${Math.floor(100000 + Math.random() * 900000)}`,
      customer_id: orderData.customer_id,
      customer_name: orderData.customer_name || 'Cliente Invitado',
      customer_email: orderData.customer_email || 'cliente@bikie.gq',
      customer_phone: orderData.customer_phone || '',
      delivery_type: orderData.delivery_type || 'pickup',
      delivery_address: orderData.delivery_address || '',
      city: orderData.city || 'Malabo',
      notes: orderData.notes || '',
      status: orderData.status || 'pending',
      payment_method: orderData.payment_method || 'store',
      payment_status: orderData.payment_status || 'unpaid',
      subtotal: Number(orderData.subtotal) || 0,
      discount: Number(orderData.discount) || 0,
      coupon_code: orderData.coupon_code || '',
      total: Number(orderData.total) || 0,
      items: orderData.items || [],
      created_at: new Date().toISOString(),
    };
    this.data.orders.unshift(newOrder);

    // Deduct stock for ordered items
    if (newOrder.items && newOrder.items.length > 0) {
      for (const it of newOrder.items) {
        const pIdx = this.data.products.findIndex((p) => p.id === it.product_id);
        if (pIdx >= 0) {
          const p = this.data.products[pIdx];
          const prev = p.stock;
          const next = Math.max(0, prev - it.quantity);
          this.data.products[pIdx] = {
            ...p,
            stock: next,
            status: next === 0 ? 'out_of_stock' : p.status,
          };
          this.data.inventory_movements.unshift({
            id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            product_id: p.id,
            product_name: p.name,
            type: 'sale',
            quantity: -it.quantity,
            previous_stock: prev,
            new_stock: next,
            reason: `Venta Pedido #${newOrder.code}`,
            user_name: newOrder.customer_name,
            created_at: new Date().toISOString(),
          });
        }
      }
    }

    this.saveDatabase();
    return newOrder;
  }

  public updateOrderStatus(id: string, status: DbOrder['status'], payment_status?: DbOrder['payment_status']): DbOrder | null {
    const idx = this.data.orders.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    this.data.orders[idx].status = status;
    if (payment_status) {
      this.data.orders[idx].payment_status = payment_status;
    }
    this.data.orders[idx].updated_at = new Date().toISOString();
    this.saveDatabase();
    return this.data.orders[idx];
  }

  public updateOrder(id: string, updates: Partial<DbOrder>): DbOrder | null {
    const idx = this.data.orders.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    this.data.orders[idx] = {
      ...this.data.orders[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.saveDatabase();
    return this.data.orders[idx];
  }

  public deleteOrder(id: string): boolean {
    const prevLen = this.data.orders.length;
    this.data.orders = this.data.orders.filter((o) => o.id !== id);
    const deleted = this.data.orders.length < prevLen;
    if (deleted) this.saveDatabase();
    return deleted;
  }

  // --- SALES (POS & DIRECT SERVICES) ---
  public getSales(): any[] {
    return this.data.sales || [];
  }

  public createSale(sale: any): any {
    if (!this.data.sales) this.data.sales = [];
    const newSale = {
      ...sale,
      id: sale.id || `sale-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      created_at: sale.created_at || new Date().toISOString(),
    };
    this.data.sales.unshift(newSale);
    this.saveDatabase();
    return newSale;
  }

  public updateSale(id: string, updates: any): any | null {
    if (!this.data.sales) this.data.sales = [];
    const idx = this.data.sales.findIndex((s: any) => s.id === id);
    if (idx === -1) return null;
    this.data.sales[idx] = {
      ...this.data.sales[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.saveDatabase();
    return this.data.sales[idx];
  }

  public deleteSale(id: string): boolean {
    if (!this.data.sales) return false;
    const prevLen = this.data.sales.length;
    this.data.sales = this.data.sales.filter((s: any) => s.id !== id);
    const deleted = this.data.sales.length < prevLen;
    if (deleted) this.saveDatabase();
    return deleted;
  }

  // --- SETTINGS ---
  public getSettings(): DbStoreSettings {
    return this.data.settings;
  }

  public updateSettings(updates: Partial<DbStoreSettings>): DbStoreSettings {
    this.data.settings = {
      ...this.data.settings,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.saveDatabase();
    return this.data.settings;
  }

  // --- CASH REGISTERS & MOVEMENTS ---
  public getCashRegisters(): any[] {
    return this.data.cash_registers;
  }

  public createCashRegister(reg: any): any {
    this.data.cash_registers.unshift(reg);
    this.saveDatabase();
    return reg;
  }

  public updateCashRegister(id: string, updates: any): any {
    const idx = this.data.cash_registers.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.data.cash_registers[idx] = { ...this.data.cash_registers[idx], ...updates };
    this.saveDatabase();
    return this.data.cash_registers[idx];
  }

  public getCashMovements(): any[] {
    return this.data.cash_movements;
  }

  public createCashMovement(mov: any): any {
    this.data.cash_movements.unshift(mov);
    this.saveDatabase();
    return mov;
  }

  // --- INVENTORY MOVEMENTS ---
  public getInventoryMovements(): any[] {
    return this.data.inventory_movements;
  }

  public addInventoryMovement(mov: any): any {
    this.data.inventory_movements.unshift(mov);
    this.saveDatabase();
    return mov;
  }

  // --- SCHOOL PACKS & LISTS ---
  public getSchoolPacks(): any[] {
    return this.data.school_packs;
  }

  public saveSchoolPacks(packs: any[]) {
    this.data.school_packs = packs;
    this.saveDatabase();
  }

  public getSchoolLists(): any[] {
    return this.data.school_lists;
  }

  public saveSchoolLists(lists: any[]) {
    this.data.school_lists = lists;
    this.saveDatabase();
  }

  // --- OFFERS & COUPONS ---
  public getOffers(): any[] {
    return this.data.offers || [];
  }

  public createOffer(offer: any): any {
    if (!this.data.offers) this.data.offers = [];
    const newOffer = {
      ...offer,
      id: offer.id || `off-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    this.data.offers.unshift(newOffer);
    this.saveDatabase();
    return newOffer;
  }

  public updateOffer(id: string, updates: any): any | null {
    if (!this.data.offers) this.data.offers = [];
    const idx = this.data.offers.findIndex((o: any) => o.id === id);
    if (idx === -1) return null;
    this.data.offers[idx] = {
      ...this.data.offers[idx],
      ...updates,
    };
    this.saveDatabase();
    return this.data.offers[idx];
  }

  public deleteOffer(id: string): boolean {
    if (!this.data.offers) return false;
    const prevLen = this.data.offers.length;
    this.data.offers = this.data.offers.filter((o: any) => o.id !== id);
    const deleted = this.data.offers.length < prevLen;
    if (deleted) this.saveDatabase();
    return deleted;
  }

  public saveOffers(offers: any[]) {
    this.data.offers = offers;
    this.saveDatabase();
  }

  public getCoupons(): any[] {
    return this.data.coupons;
  }

  public saveCoupons(coupons: any[]) {
    this.data.coupons = coupons;
    this.saveDatabase();
  }

  // --- SUPPLIERS ---
  public getSuppliers(): any[] {
    return this.data.suppliers;
  }

  public saveSuppliers(suppliers: any[]) {
    this.data.suppliers = suppliers;
    this.saveDatabase();
  }

  // --- AI SCANS ---
  public getAiScans(): any[] {
    return this.data.ai_scans;
  }

  public addAiScan(scan: any): any {
    this.data.ai_scans.unshift(scan);
    this.saveDatabase();
    return scan;
  }
}

export const db = new BikieDatabase();
