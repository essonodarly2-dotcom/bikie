import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy initialize Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check and DB status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: 'connected',
    timestamp: new Date().toISOString(),
    ai_available: Boolean(process.env.GEMINI_API_KEY),
    stats: {
      users_count: db.getUsers().length,
      products_count: db.getProducts().length,
      categories_count: db.getCategories().length,
      orders_count: db.getOrders().length,
    },
  });
});

app.get('/api/db/status', (req, res) => {
  res.json({
    status: 'online',
    engine: 'Bikie Persistent Database Engine (PostgreSQL / JSON Store)',
    users_count: db.getUsers().length,
    products_count: db.getProducts().length,
    categories_count: db.getCategories().length,
    orders_count: db.getOrders().length,
  });
});

// ==========================================
// AUTHENTICATION ROUTES (STRICT DB VALIDATION)
// ==========================================
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, identifier, password, pin } = req.body;
    const loginUser = email || identifier;
    const credential = password || pin;

    if (!loginUser || !credential) {
      return res.status(400).json({
        success: false,
        error: 'Debes proporcionar tu correo electrónico y tu clave/PIN.',
      });
    }

    const authResult = db.authenticateUser(loginUser, credential);

    if (!authResult.success) {
      return res.status(401).json({
        success: false,
        error: authResult.error || 'Credenciales incorrectas o usuario no registrado en la base de datos.',
      });
    }

    res.json({
      success: true,
      message: 'Autenticación exitosa',
      user: authResult.user,
    });
  } catch (err: any) {
    console.error('Error in /api/auth/login:', err);
    res.status(500).json({ success: false, error: 'Error del servidor al procesar el login' });
  }
});

// User Management (Admin only)
app.get('/api/auth/users', (req, res) => {
  res.json(db.getUsers());
});

app.post('/api/auth/users', (req, res) => {
  try {
    const user = db.createUser(req.body);
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/auth/users/:id', (req, res) => {
  try {
    const user = db.updateUser(req.params.id, req.body);
    if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/auth/users/:id', (req, res) => {
  const deleted = db.deleteUser(req.params.id);
  res.json({ success: deleted });
});

// ==========================================
// BOOTSTRAP API (LOADS ALL DB DATA FOR APP)
// ==========================================
app.get('/api/bootstrap', (req, res) => {
  try {
    const data = db.getBootstrapState();
    res.json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error('Error loading bootstrap DB data:', err);
    res.status(500).json({ success: false, error: 'Error cargando datos de la base de datos' });
  }
});

// ==========================================
// PRODUCTS DB ENDPOINTS
// ==========================================
app.get('/api/products', (req, res) => {
  res.json(db.getProducts());
});

app.post('/api/products', (req, res) => {
  try {
    const product = db.createProduct(req.body);
    res.json({ success: true, product });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/products/:id', (req, res) => {
  try {
    const product = db.updateProduct(req.params.id, req.body);
    if (!product) return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    res.json({ success: true, product });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/products/:id', (req, res) => {
  const deleted = db.deleteProduct(req.params.id);
  res.json({ success: deleted });
});

// ==========================================
// CATEGORIES DB ENDPOINTS
// ==========================================
app.get('/api/categories', (req, res) => {
  res.json(db.getCategories());
});

app.post('/api/categories', (req, res) => {
  try {
    const category = db.createCategory(req.body);
    res.json({ success: true, category });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/categories/:id', (req, res) => {
  try {
    const category = db.updateCategory(req.params.id, req.body);
    if (!category) return res.status(404).json({ success: false, error: 'Categoría no encontrada' });
    res.json({ success: true, category });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/categories/:id', (req, res) => {
  const deleted = db.deleteCategory(req.params.id);
  res.json({ success: deleted });
});

// ==========================================
// ORDERS DB ENDPOINTS
// ==========================================
app.get('/api/orders', (req, res) => {
  res.json(db.getOrders());
});

app.post('/api/orders', (req, res) => {
  try {
    const order = db.createOrder(req.body);
    res.json({ success: true, order });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/orders/:id/status', (req, res) => {
  try {
    const { status, payment_status } = req.body;
    const order = db.updateOrderStatus(req.params.id, status, payment_status);
    if (!order) return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
    res.json({ success: true, order });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/orders/:id', (req, res) => {
  try {
    const order = db.updateOrder(req.params.id, req.body);
    if (!order) return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
    res.json({ success: true, order });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/orders/:id', (req, res) => {
  try {
    const deleted = db.deleteOrder(req.params.id);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// SALES (POS & DIRECT SERVICES) DB ENDPOINTS
// ==========================================
app.get('/api/sales', (req, res) => {
  res.json(db.getSales());
});

app.post('/api/sales', (req, res) => {
  try {
    const sale = db.createSale(req.body);
    res.json({ success: true, sale });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/sales/:id', (req, res) => {
  try {
    const sale = db.updateSale(req.params.id, req.body);
    if (!sale) return res.status(404).json({ success: false, error: 'Venta no encontrada' });
    res.json({ success: true, sale });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/sales/:id', (req, res) => {
  try {
    const deleted = db.deleteSale(req.params.id);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// STORE SETTINGS DB ENDPOINTS
// ==========================================
app.get('/api/settings', (req, res) => {
  res.json(db.getSettings());
});

app.put('/api/settings', (req, res) => {
  try {
    const settings = db.updateSettings(req.body);
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// CASH REGISTERS & MOVEMENTS DB ENDPOINTS
// ==========================================
app.get('/api/cash-registers', (req, res) => {
  res.json(db.getCashRegisters());
});

app.post('/api/cash-registers', (req, res) => {
  try {
    const reg = db.createCashRegister(req.body);
    res.json({ success: true, register: reg });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/cash-registers/:id', (req, res) => {
  try {
    const reg = db.updateCashRegister(req.params.id, req.body);
    res.json({ success: true, register: reg });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/cash-movements', (req, res) => {
  res.json(db.getCashMovements());
});

app.post('/api/cash-movements', (req, res) => {
  try {
    const mov = db.createCashMovement(req.body);
    res.json({ success: true, movement: mov });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// INVENTORY MOVEMENTS DB ENDPOINTS
// ==========================================
app.get('/api/inventory-movements', (req, res) => {
  res.json(db.getInventoryMovements());
});

app.post('/api/inventory-movements', (req, res) => {
  try {
    const mov = db.addInventoryMovement(req.body);
    res.json({ success: true, movement: mov });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// SCHOOL PACKS & LISTS DB ENDPOINTS
// ==========================================
app.get('/api/school-packs', (req, res) => {
  res.json(db.getSchoolPacks());
});

app.put('/api/school-packs', (req, res) => {
  db.saveSchoolPacks(req.body);
  res.json({ success: true });
});

app.get('/api/school-lists', (req, res) => {
  res.json(db.getSchoolLists());
});

app.put('/api/school-lists', (req, res) => {
  db.saveSchoolLists(req.body);
  res.json({ success: true });
});

// ==========================================
// OFFERS & COUPONS DB ENDPOINTS
// ==========================================
app.get('/api/offers', (req, res) => {
  res.json(db.getOffers());
});

app.post('/api/offers', (req, res) => {
  try {
    const offer = db.createOffer(req.body);
    res.json({ success: true, offer });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/offers/:id', (req, res) => {
  try {
    const offer = db.updateOffer(req.params.id, req.body);
    if (!offer) return res.status(404).json({ success: false, error: 'Oferta no encontrada' });
    res.json({ success: true, offer });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/offers/:id', (req, res) => {
  try {
    const deleted = db.deleteOffer(req.params.id);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/offers', (req, res) => {
  db.saveOffers(req.body);
  res.json({ success: true });
});

app.get('/api/coupons', (req, res) => {
  res.json(db.getCoupons());
});

app.put('/api/coupons', (req, res) => {
  db.saveCoupons(req.body);
  res.json({ success: true });
});

// ==========================================
// SUPPLIERS DB ENDPOINTS
// ==========================================
app.get('/api/suppliers', (req, res) => {
  res.json(db.getSuppliers());
});

app.put('/api/suppliers', (req, res) => {
  db.saveSuppliers(req.body);
  res.json({ success: true });
});

// ==========================================
// EXPENSES DB ENDPOINTS
// ==========================================
app.get('/api/expenses', (req, res) => {
  res.json(db.getExpenses());
});

app.post('/api/expenses', (req, res) => {
  try {
    const expense = db.createExpense(req.body);
    res.json({ success: true, expense });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/expenses/:id', (req, res) => {
  try {
    const expense = db.updateExpense(req.params.id, req.body);
    if (!expense) return res.status(404).json({ success: false, error: 'Gasto no encontrado' });
    res.json({ success: true, expense });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/expenses/:id', (req, res) => {
  try {
    const deleted = db.deleteExpense(req.params.id);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/expenses', (req, res) => {
  db.saveExpenses(req.body);
  res.json({ success: true });
});

// ==========================================
// SERVICES & COPY PRICES DB ENDPOINTS
// ==========================================
app.get('/api/services', (req, res) => {
  res.json(db.getServices());
});

app.post('/api/services', (req, res) => {
  try {
    const service = db.createService(req.body);
    res.json({ success: true, service });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/services/:id', (req, res) => {
  try {
    const service = db.updateService(req.params.id, req.body);
    if (!service) return res.status(404).json({ success: false, error: 'Servicio no encontrado' });
    res.json({ success: true, service });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/services/:id', (req, res) => {
  try {
    const deleted = db.deleteService(req.params.id);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/services', (req, res) => {
  db.saveServices(req.body);
  res.json({ success: true });
});

// ==========================================
// AI SCANS DB ENDPOINTS
// ==========================================
app.get('/api/ai-scans', (req, res) => {
  res.json(db.getAiScans());
});

app.post('/api/ai-scans', (req, res) => {
  try {
    const scan = db.addAiScan(req.body);
    res.json({ success: true, scan });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI List Scanner endpoint
app.post('/api/ai/scan-list', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', manualText, catalog } = req.body;

    const ai = getGeminiClient();

    let extractedText = '';
    let parsedItems: Array<{ detected_name: string; detected_quantity: number; attributes?: string[] }> = [];

    if (manualText && manualText.trim().length > 0) {
      extractedText = manualText.trim();
    } else if (imageBase64 && ai) {
      // Call Gemini 3.7 Flash for multimodal OCR and structural extraction
      const imagePart = {
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: imageBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, ''),
        },
      };

      const prompt = `Analiza detenidamente esta fotografía de una lista de útiles escolares / material de papelería (escrita a mano o impresa).
Extrae todos los artículos solicitados con sus cantidades exactas y características clave (como color, tamaño A4/A3, regla 30cm, cuadriculado, marca).
Devuelve el resultado estructurado en formato JSON con la transcripción completa del texto leído y una lista de artículos.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: {
          parts: [
            imagePart,
            { text: prompt },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              raw_text: {
                type: Type.STRING,
                description: 'Texto completo transcrito de la imagen línea por línea',
              },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    detected_name: {
                      type: Type.STRING,
                      description: 'Nombre normalizado del producto sin la cantidad (ej. Cuaderno A4 cuadriculado, Bolígrafo azul, Regla 30 cm)',
                    },
                    detected_quantity: {
                      type: Type.INTEGER,
                      description: 'Cantidad numérica indicada (mínimo 1)',
                    },
                    attributes: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'Colores, tamaños o especificaciones técnicas',
                    },
                  },
                  required: ['detected_name', 'detected_quantity'],
                },
              },
            },
            required: ['raw_text', 'items'],
          },
        },
      });

      const responseText = response.text || '';
      try {
        const json = JSON.parse(responseText);
        extractedText = json.raw_text || '';
        parsedItems = json.items || [];
      } catch (parseErr) {
        console.warn('Could not parse JSON response from Gemini, using raw text:', parseErr);
        extractedText = responseText;
      }
    } else if (imageBase64 && !ai) {
      // Fallback demo OCR when no API key is provided
      extractedText = `5 Cuadernos A4 cuadriculados Oxford\n2 Bolígrafos azules BIC\n1 Bolígrafo rojo BIC\n1 Regla de 30 cm Faber-Castell\n2 Gomas de borrar Milan\n1 Caja de 24 lápices de colores\n1 Pegamento en barra Pritt`;
    }

    res.json({
      success: true,
      raw_text: extractedText,
      detected_items: parsedItems,
    });
  } catch (error: any) {
    console.error('Error in /api/ai/scan-list:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Error al procesar la imagen con IA',
    });
  }
});

// AI Shopping Assistant endpoint
app.post('/api/ai/assistant', async (req, res) => {
  try {
    const { message, catalogSummary = [], history = [] } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Offline fallback assistant
      const lower = (message || '').toLowerCase();
      let reply = '¡Hola! Soy el asistente virtual de BIKIE Papelería en Malabo. ';
      const recommended_ids: string[] = [];

      if (lower.includes('primaria') || lower.includes('escolar') || lower.includes('colegio')) {
        reply += 'Para primaria te recomiendo nuestro Pack Escolar Primaria Básico o cuadernos A4 Oxford, bolígrafos BIC y colores Faber-Castell.';
        recommended_ids.push('prod-01', 'prod-02', 'prod-08');
      } else if (lower.includes('secundaria') || lower.includes('calculadora') || lower.includes('bachillerato')) {
        reply += 'Para secundaria y bachillerato disponemos de la calculadora científica Casio FX-82, compás Staedtler y carpetas de 4 anillas Grafoplas.';
        recommended_ids.push('prod-13', 'prod-05', 'prod-14');
      } else if (lower.includes('mochila')) {
        reply += 'Contamos con la mochila escolar ergonómica BIKIE Pro de 28L reforzada e impermeable con 15% de descuento especial.';
        recommended_ids.push('prod-12');
      } else {
        reply += 'Puedo ayudarte a encontrar productos específicos, armar listas escolares o resolver dudas sobre stock y precios en XAF. ¿Qué estás buscando hoy?';
      }

      return res.json({
        success: true,
        reply,
        recommended_ids,
      });
    }

    const catalogContext = catalogSummary.map((p: any) => 
      `- [ID: ${p.id}] ${p.name} | Marca: ${p.brand} | Precio: ${p.sale_price} XAF | Stock: ${p.stock} | Categoría: ${p.category_name}`
    ).join('\n');

    const systemInstruction = `Eres el asistente de compras inteligente y experto de la papelería BIKIE en Malabo, África Central.
Tu misión es aconsejar y recomendar productos a estudiantes, padres, docentes y profesionales.

REGLAS OBLIGATORIAS:
1. Recomienda ÚNICAMENTE productos reales presentes en el catálogo proporcionado a continuación.
2. NUNCA inventes productos, marcas ficticias, precios ni stock.
3. Menciona siempre los precios en XAF (Franco CFA) como aparecen en el catálogo.
4. Si el cliente pide algo que no está en catálogo o está agotado, recomiéndale la alternativa más cercana disponible con honestidad y amabilidad.
5. Devuelve la respuesta en formato JSON con dos campos: "reply" (tu texto conversacional en español cálido y profesional) y "recommended_ids" (array con los IDs de los productos sugeridos, ej: ["prod-01", "prod-02"]).

CATÁLOGO REAL BIKIE:
${catalogContext}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: `${message}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            recommended_ids: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['reply', 'recommended_ids'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');

    res.json({
      success: true,
      reply: parsed.reply || 'Aquí tienes nuestras mejores recomendaciones de BIKIE.',
      recommended_ids: parsed.recommended_ids || [],
    });
  } catch (error: any) {
    console.error('Error in /api/ai/assistant:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Error al comunicarse con el asistente de BIKIE',
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BIKIE Stationery Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
