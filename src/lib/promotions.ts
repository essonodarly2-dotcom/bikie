import { Offer, Product, CartItem } from '../types';

/**
 * BIKIE PAPELERÍA — MOTOR CENTRALIZADO DE OFERTAS Y PROMOCIONES
 * 
 * Regla para múltiples ofertas:
 * Si un producto coincide con varias ofertas activas simultáneas (por producto individual o categoría),
 * se aplica la regla de "Mayor Beneficio para el Cliente" (mejor descuento absoluto).
 * Las ofertas no son acumulables entre sí para evitar descuentos negativos o incongruencias de inventario.
 */

/**
 * Verifica si una oferta está formalmente vigente en el tiempo y activa.
 */
export function isOfferCurrentlyActive(offer: Offer | null | undefined): boolean {
  if (!offer) return false;
  if (offer.status !== 'active') return false;

  const todayStr = new Date().toISOString().split('T')[0];
  
  if (offer.start_date) {
    const startDateStr = offer.start_date.split('T')[0];
    if (todayStr < startDateStr) return false;
  }

  if (offer.end_date) {
    const endDateStr = offer.end_date.split('T')[0];
    if (todayStr > endDateStr) return false;
  }

  return true;
}

/**
 * Filtra únicamente las ofertas que están activas y dentro del rango de fechas válido.
 */
export function getValidActiveOffers(offers: Offer[] = []): Offer[] {
  return offers.filter(isOfferCurrentlyActive);
}

export interface AppliedProductOffer {
  offer: Offer;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  discountPercentage: number;
  promoBadgeText: string;
}

/**
 * Calcula el mejor descuento y precio final para un producto dado según las ofertas activas.
 */
export function calculateProductOffer(
  product: Product,
  activeOffers: Offer[] = []
): AppliedProductOffer | null {
  const validOffers = getValidActiveOffers(activeOffers);
  if (validOffers.length === 0) return null;

  // Filtrar ofertas aplicables a este producto (por ID directo o por categoría)
  const applicableOffers = validOffers.filter((offer) => {
    const matchesProduct = Array.isArray(offer.product_ids) && offer.product_ids.includes(product.id);
    const matchesCategory = Array.isArray(offer.category_ids) && Boolean(product.category_id) && offer.category_ids.includes(product.category_id);
    return matchesProduct || matchesCategory;
  });

  if (applicableOffers.length === 0) return null;

  let bestOfferResult: AppliedProductOffer | null = null;
  let maxDiscount = 0;

  for (const offer of applicableOffers) {
    let discount = 0;
    let badge = 'OFERTA';

    switch (offer.type) {
      case 'percentage': {
        discount = Math.round((product.sale_price * offer.discount_value) / 100);
        badge = `-${offer.discount_value}%`;
        break;
      }
      case 'fixed': {
        discount = Math.min(offer.discount_value, product.sale_price);
        badge = `-${offer.discount_value} XAF`;
        break;
      }
      case 'special_price': {
        if (offer.discount_value > 0 && offer.discount_value < product.sale_price) {
          discount = product.sale_price - offer.discount_value;
          badge = `PRECIO ESPECIAL`;
        }
        break;
      }
      case '2x1': {
        // En vista individual representa 50% de beneficio por unidad en pares
        badge = '2x1';
        break;
      }
      case '3x2': {
        badge = '3x2';
        break;
      }
      default:
        break;
    }

    if (discount > maxDiscount) {
      maxDiscount = discount;
      const finalPrice = Math.max(0, product.sale_price - discount);
      const discountPercentage = Math.round((discount / product.sale_price) * 100);

      bestOfferResult = {
        offer,
        originalPrice: product.sale_price,
        discountAmount: discount,
        finalPrice,
        discountPercentage,
        promoBadgeText: badge,
      };
    } else if (!bestOfferResult && (offer.type === '2x1' || offer.type === '3x2')) {
      bestOfferResult = {
        offer,
        originalPrice: product.sale_price,
        discountAmount: 0,
        finalPrice: product.sale_price,
        discountPercentage: 0,
        promoBadgeText: badge,
      };
    }
  }

  return bestOfferResult;
}

export interface CartPricingCalculation {
  subtotal: number;
  offersDiscount: number;
  couponDiscount: number;
  pointsDiscount: number;
  totalDiscount: number;
  deliveryCost: number;
  finalTotal: number;
  itemBreakdown: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    unitDiscount: number;
    finalUnitPrice: number;
    totalItemPrice: number;
    appliedOfferName?: string;
  }[];
}

/**
 * Motor completo de cálculo de precios del Carrito con ofertas por cantidad (2x1, 3x2, porcentajes, etc.)
 */
export function calculateCartPricing(
  items: CartItem[],
  activeOffers: Offer[] = [],
  appliedCoupon?: { discount_type: 'percentage' | 'fixed' | 'percent'; discount_value: number } | null,
  usePoints: boolean = false,
  userPoints: number = 0,
  deliveryType: 'pickup' | 'delivery' = 'pickup'
): CartPricingCalculation {
  const validOffers = getValidActiveOffers(activeOffers);
  let subtotal = 0;
  let totalOffersDiscount = 0;

  const itemBreakdown = items.map((item) => {
    const qty = item.quantity;
    const unitPrice = item.product.sale_price;
    const itemSubtotal = unitPrice * qty;
    subtotal += itemSubtotal;

    // Buscar ofertas aplicables
    const applied = calculateProductOffer(item.product, validOffers);

    let itemDiscount = 0;
    let appliedOfferName: string | undefined = undefined;

    if (applied) {
      appliedOfferName = applied.offer.name;

      if (applied.offer.type === '2x1') {
        // Paga 1 por cada 2
        const freeItems = Math.floor(qty / 2);
        itemDiscount = freeItems * unitPrice;
      } else if (applied.offer.type === '3x2') {
        // Paga 2 por cada 3
        const freeItems = Math.floor(qty / 3);
        itemDiscount = freeItems * unitPrice;
      } else if (applied.discountAmount > 0) {
        itemDiscount = applied.discountAmount * qty;
      }
    }

    totalOffersDiscount += itemDiscount;
    const totalItemPrice = Math.max(0, itemSubtotal - itemDiscount);
    const finalUnitPrice = qty > 0 ? Math.round(totalItemPrice / qty) : unitPrice;

    return {
      productId: item.product.id,
      productName: item.product.name,
      quantity: qty,
      unitPrice,
      unitDiscount: qty > 0 ? Math.round(itemDiscount / qty) : 0,
      finalUnitPrice,
      totalItemPrice,
      appliedOfferName,
    };
  });

  const subtotalAfterOffers = Math.max(0, subtotal - totalOffersDiscount);

  // Cupón de descuento
  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percentage' || appliedCoupon.discount_type === 'percent') {
      couponDiscount = Math.round((subtotalAfterOffers * appliedCoupon.discount_value) / 100);
    } else {
      couponDiscount = Math.min(appliedCoupon.discount_value, subtotalAfterOffers);
    }
  }

  // Puntos de fidelidad (1 punto = 5 XAF, máximo 50% del total)
  const maxPointsToUse = Math.min(userPoints, Math.floor(subtotalAfterOffers / 10));
  const pointsDiscount = usePoints ? maxPointsToUse * 5 : 0;

  const totalDiscount = totalOffersDiscount + couponDiscount + pointsDiscount;
  const deliveryCost = deliveryType === 'delivery' ? 1500 : 0;
  const finalTotal = Math.max(0, subtotal - totalDiscount + deliveryCost);

  return {
    subtotal,
    offersDiscount: totalOffersDiscount,
    couponDiscount,
    pointsDiscount,
    totalDiscount,
    deliveryCost,
    finalTotal,
    itemBreakdown,
  };
}
