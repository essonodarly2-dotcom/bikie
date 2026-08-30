import { z } from 'zod';

// ==============================================================================
// SANITIZATION HELPER
// ==============================================================================
export function sanitizeString(val: string): string {
  if (!val) return '';
  return val
    .trim()
    .replace(/[<>]/g, '') // Strip basic HTML tags
    .replace(/[\x00-\x1F\x7F]/g, ''); // Strip control characters
}

// ==============================================================================
// LOGIN SCHEMA
// ==============================================================================
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'El correo no puede estar vacío')
    .max(120, 'El correo no puede exceder 120 caracteres')
    .email('Introduce un formato de correo electrónico válido (ej. admin@bikie.com)'),
  password: z
    .string()
    .min(4, 'La contraseña debe tener al menos 4 caracteres')
    .max(64, 'La contraseña no puede exceder 64 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ==============================================================================
// PASSWORD RECOVERY SCHEMA
// ==============================================================================
export const passwordRecoverySchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'El correo no puede estar vacío')
    .max(120, 'El correo no puede exceder 120 caracteres')
    .email('Introduce un correo electrónico válido'),
});

export type PasswordRecoveryFormData = z.infer<typeof passwordRecoverySchema>;

// ==============================================================================
// ADMIN CODE GENERATOR SCHEMA
// ==============================================================================
export const adminCodeGeneratorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(80, 'El nombre no puede exceder 80 caracteres'),
  email: z
    .string()
    .trim()
    .min(1, 'El correo no puede estar vacío')
    .max(120, 'El correo no puede exceder 120 caracteres')
    .email('Formato de correo inválido'),
  phone: z
    .string()
    .trim()
    .min(6, 'El teléfono debe tener al menos 6 dígitos')
    .max(30, 'El teléfono no puede exceder 30 caracteres')
    .regex(/^[+0-9\s-]{6,30}$/, 'El teléfono solo puede contener números, espacios y los signos + o -'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(64, 'La contraseña no puede exceder 64 caracteres'),
});

export type AdminCodeGeneratorData = z.infer<typeof adminCodeGeneratorSchema>;

// ==============================================================================
// STORE SETTINGS SCHEMA
// ==============================================================================
export const storeSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(60, 'El nombre no puede exceder 60 caracteres'),
  slogan: z
    .string()
    .trim()
    .max(150, 'El eslogan no puede exceder 150 caracteres')
    .default('Todo lo que necesitas para estudiar, trabajar y crear'),
  description: z
    .string()
    .trim()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional()
    .default(''),
  phone: z
    .string()
    .trim()
    .min(6, 'El teléfono debe tener al menos 6 caracteres')
    .max(30, 'El teléfono no puede exceder 30 caracteres')
    .regex(/^[+0-9\s-]{6,30}$/, 'Formato de teléfono inválido (ej. 222213126 o +240 222 213 126)'),
  whatsapp: z
    .string()
    .trim()
    .min(6, 'El número de WhatsApp debe tener al menos 6 caracteres')
    .max(30, 'El número de WhatsApp no puede exceder 30 caracteres')
    .regex(/^[+0-9\s-]{6,30}$/, 'Formato de WhatsApp inválido (ej. 222213126)'),
  email: z
    .string()
    .trim()
    .email('Introduce un correo electrónico de contacto válido')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .trim()
    .min(3, 'La dirección debe tener al menos 3 caracteres')
    .max(200, 'La dirección no puede exceder 200 caracteres')
    .optional()
    .default('Paraiso, cerca de banje, Malabo, Guinea Ecuatorial'),
  city: z
    .string()
    .trim()
    .min(2, 'La ciudad debe tener al menos 2 caracteres')
    .max(60, 'La ciudad no puede exceder 60 caracteres')
    .optional()
    .default('Malabo'),
  opening_hours: z
    .string()
    .trim()
    .min(3, 'El horario debe tener al menos 3 caracteres')
    .max(100, 'El horario no puede exceder 100 caracteres')
    .default('Lunes a Sábado: 08:00 - 19:30'),
  currency: z
    .string()
    .trim()
    .min(2)
    .max(10)
    .default('XAF'),
  currency_symbol: z
    .string()
    .trim()
    .min(1)
    .max(10)
    .default('FCFA'),
  free_shipping_min: z
    .number()
    .nonnegative('El importe no puede ser negativo')
    .default(25000),
  points_per_1000_xaf: z
    .number()
    .int('Los puntos deben ser un número entero')
    .nonnegative('Los puntos no pueden ser negativos')
    .default(10),
});

export type StoreSettingsFormData = z.infer<typeof storeSettingsSchema>;

// ==============================================================================
// PRODUCT SCHEMA
// ==============================================================================
export const productSchema = z.object({
  id: z.string().min(1),
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(120, 'El nombre no puede exceder 120 caracteres'),
  brand: z.string().trim().min(1).max(60).default('BIKIE'),
  sku: z.string().trim().min(2).max(40),
  category_id: z.string().min(1, 'Debes seleccionar una categoría'),
  purchase_price: z
    .number()
    .nonnegative('El precio de compra no puede ser negativo'),
  sale_price: z
    .number()
    .positive('El precio de venta debe ser mayor a 0'),
  stock: z
    .number()
    .int('El stock debe ser un entero')
    .nonnegative('El stock no puede ser negativo'),
  min_stock: z
    .number()
    .int()
    .nonnegative()
    .default(5),
  status: z.enum(['active', 'draft', 'out_of_stock']).default('active'),
  image: z.string().min(1, 'La imagen es obligatoria'),
  description: z.string().trim().max(1000).optional().default(''),
});

export type ProductFormData = z.infer<typeof productSchema>;

// ==============================================================================
// CATEGORY SCHEMA
// ==============================================================================
export const categorySchema = z.object({
  id: z.string().min(1),
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(60, 'El nombre no puede exceder 60 caracteres'),
  slug: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).optional().default(''),
  icon: z.string().default('Folder'),
  image: z.string().optional(),
  display_order: z.number().int().default(0),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
