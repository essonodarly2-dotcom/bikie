import { Product, AiDetectedItem, AiMatchResult } from '../types';

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Levenshtein distance for fuzzy matching
export function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: bn + 1 }, (_, i) => [i]);
  for (let j = 1; j <= an; j++) matrix[0][j] = j;

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[bn][an];
}

const SYNONYM_MAP: Record<string, string[]> = {
  'boligrafo': ['boli', 'bolis', 'boligrafos', 'lapicero', 'lapiceros', 'pluma', 'esfero', 'bic'],
  'cuaderno': ['cuadernos', 'libreta', 'libretas', 'bloc', 'blocs', 'block', 'anillas', 'pauta'],
  'goma': ['gomas', 'borrador', 'borradores', 'miga', 'milan'],
  'carpeta': ['carpetas', 'archivador', 'archivadores', 'clasificador', 'dossier'],
  'lapiz': ['lapices', 'lapicero', 'grafito', 'staedtler'],
  'lapices de colores': ['colores', 'caja de colores', 'lapices color', 'pinturas de madera', 'crayones'],
  'regla': ['reglas', 'metro', 'escuadra', 'lineal'],
  'pegamento': ['pegamentos', 'cola', 'barra pegamento', 'adhesivo', 'pritt'],
  'tijeras': ['tijera', 'tijeritas', 'sensoft', 'punta redonda'],
  'subrayador': ['subrayadores', 'marcador', 'marcadores', 'fluorescente', 'fluorescentes', 'fosforito', 'stabilo', 'boss'],
  'papel': ['folios', 'folio', 'hojas', 'paquete folios', 'din a4', 'fotocopia', 'navigator'],
  'calculadora': ['calculadoras', 'cientifica', 'casio'],
  'compas': ['compases', 'precision'],
  'mochila': ['mochilas', 'bolsa escolar', 'morral'],
  'sacapuntas': ['tajalapiz', 'afila', 'afilalapices', 'maquinilla'],
};

// Extract quantity from text (e.g. "5 cuadernos", "2x boligrafos", "1 caja de...")
export function parseRawTextLine(line: string): AiDetectedItem | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 2) return null;

  // Pattern matches: "5x", "5 x", "5 ", "3 unid", "1 caja de", "un", "una", "dos", "tres", "cuatro", "cinco", "diez"
  let qty = 1;
  let cleanName = trimmed;

  const numberWordMap: Record<string, number> = {
    un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
    doce: 12, quince: 15, veinte: 20
  };

  // Check leading numbers
  const numMatch = cleanName.match(/^(\d+)\s*(?:x|unid|unidades|uds|pzas|piezas|cajas|paquetes)?(?:\s+de)?\s+(.*)/i);
  if (numMatch) {
    qty = parseInt(numMatch[1], 10) || 1;
    cleanName = numMatch[2];
  } else {
    // Check leading number words
    const wordMatch = cleanName.match(/^(un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|doce|quince|veinte)\s+(?:cajas?|paquetes?|unidades?)?(?:\s+de)?\s+(.*)/i);
    if (wordMatch) {
      qty = numberWordMap[wordMatch[1].toLowerCase()] || 1;
      cleanName = wordMatch[2];
    }
  }

  // Extract attributes (color, size)
  const attributes: string[] = [];
  const normalized = normalizeText(cleanName);

  if (normalized.includes('azul')) attributes.push('azul');
  if (normalized.includes('negro')) attributes.push('negro');
  if (normalized.includes('rojo')) attributes.push('rojo');
  if (normalized.includes('verde')) attributes.push('verde');
  if (normalized.includes('a4')) attributes.push('A4');
  if (normalized.includes('a3')) attributes.push('A3');
  if (normalized.includes('30 cm') || normalized.includes('30cm')) attributes.push('30 cm');
  if (normalized.includes('24')) attributes.push('24 uds');
  if (normalized.includes('12')) attributes.push('12 uds');
  if (normalized.includes('cuadriculado') || normalized.includes('cuadricula')) attributes.push('cuadriculado');

  return {
    raw_line: trimmed,
    detected_name: cleanName.trim(),
    detected_quantity: Math.max(1, qty),
    attributes,
  };
}

export function matchItemToCatalog(
  detected: AiDetectedItem,
  catalog: Product[]
): AiMatchResult {
  const normDetected = normalizeText(detected.detected_name);
  const detectedTokens = normDetected.split(/\s+/).filter(Boolean);

  let bestMatch: Product | null = null;
  let bestScore = 0;

  for (const product of catalog) {
    const normName = normalizeText(product.name);
    const normBrand = normalizeText(product.brand);
    const normCategory = normalizeText(product.category_name || '');
    const tags = (product.tags || []).map(normalizeText);

    let score = 0;

    // 1. Direct SKU or Barcode exact match
    if (detected.detected_name.toLowerCase().includes(product.sku.toLowerCase()) || 
        (product.barcode && detected.detected_name.includes(product.barcode))) {
      bestMatch = product;
      bestScore = 100;
      break;
    }

    // 2. Token overlap & keyword matching
    let tokenMatches = 0;
    for (const token of detectedTokens) {
      if (token.length < 2) continue;

      if (normName.includes(token)) {
        tokenMatches += 2;
      } else if (normBrand.includes(token) || normCategory.includes(token) || tags.some(t => t.includes(token))) {
        tokenMatches += 1.5;
      } else {
        // Check synonyms
        let matchedSynonym = false;
        for (const [key, synList] of Object.entries(SYNONYM_MAP)) {
          if (token === key || synList.includes(token)) {
            if (normName.includes(key) || synList.some(s => normName.includes(s))) {
              tokenMatches += 1.8;
              matchedSynonym = true;
              break;
            }
          }
        }
        if (!matchedSynonym) {
          // Check fuzzy token similarity
          const nameTokens = normName.split(/\s+/);
          for (const nt of nameTokens) {
            const dist = levenshteinDistance(token, nt);
            if (dist === 1 && token.length > 3) {
              tokenMatches += 1.2;
              break;
            }
          }
        }
      }
    }

    const maxPossible = Math.max(1, detectedTokens.length * 2);
    const overlapRatio = Math.min(1, tokenMatches / maxPossible);

    // 3. String edit similarity bonus
    const distance = levenshteinDistance(normDetected.slice(0, 30), normName.slice(0, 30));
    const maxLen = Math.max(normDetected.slice(0, 30).length, normName.slice(0, 30).length, 1);
    const stringSimilarity = 1 - distance / maxLen;

    score = overlapRatio * 75 + Math.max(0, stringSimilarity) * 25;

    // Attribute boosts (color, size, brand)
    for (const attr of detected.attributes || []) {
      const normAttr = normalizeText(attr);
      if (normName.includes(normAttr)) {
        score += 10;
      }
    }

    score = Math.min(99, Math.round(score));

    if (score > bestScore) {
      bestScore = score;
      bestMatch = product;
    }
  }

  // Determine confidence status
  let confidenceLabel: 'high' | 'medium' | 'low' | 'none' = 'none';
  let status: 'confirmed' | 'warning' | 'unmatched' = 'unmatched';

  if (bestScore >= 75) {
    confidenceLabel = 'high';
    status = 'confirmed';
  } else if (bestScore >= 45) {
    confidenceLabel = 'medium';
    status = 'warning';
  } else if (bestScore >= 25) {
    confidenceLabel = 'low';
    status = 'warning';
  } else {
    confidenceLabel = 'none';
    status = 'unmatched';
    bestMatch = undefined as unknown as Product;
  }

  const availableStock = bestMatch ? bestMatch.stock : 0;
  const requestedQty = detected.detected_quantity;
  const stockLimited = bestMatch ? requestedQty > availableStock : false;
  const safeQty = bestMatch ? Math.min(requestedQty, availableStock > 0 ? availableStock : 1) : requestedQty;

  let notes = '';
  if (bestMatch && availableStock <= 0) {
    notes = 'Producto actualmente agotado en inventario.';
    status = 'warning';
  } else if (stockLimited) {
    notes = `Solo quedan ${availableStock} unidades disponibles en stock.`;
  }

  return {
    detected_item: detected,
    matched_product: bestMatch || undefined,
    confidence: bestMatch ? bestScore : 0,
    confidence_label: confidenceLabel,
    status: status,
    user_selected_quantity: safeQty,
    available_stock: availableStock,
    stock_limited: stockLimited,
    selected: status === 'confirmed' && availableStock > 0,
    notes,
  };
}

export function processRawTextIntoMatches(rawText: string, catalog: Product[]): AiMatchResult[] {
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const results: AiMatchResult[] = [];

  for (const line of lines) {
    const detected = parseRawTextLine(line);
    if (detected) {
      const match = matchItemToCatalog(detected, catalog);
      results.push(match);
    }
  }

  return results;
}
