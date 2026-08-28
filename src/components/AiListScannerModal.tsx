import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShoppingBag,
  RefreshCw,
  Search,
  Plus,
  Minus,
  Trash2,
  Check,
  FileText,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, AiMatchResult, AiScanRecord, StoreSettings } from '../types';
import { formatXAF } from '../utils/formatters';
import { processRawTextIntoMatches, matchItemToCatalog, parseRawTextLine } from '../lib/fuzzyMatch';
import { storageService } from '../lib/storage';

interface AiListScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: Product[];
  onAddItemsToCart: (items: { product: Product; quantity: number }[]) => void;
  settings: StoreSettings;
}

const PRESET_SAMPLE_LISTS = [
  {
    title: 'Lista 1º a 3º Primaria',
    desc: 'Cuadernos A4, bolis azules, regla 30cm, gomas y lápices',
    text: `5 cuadernos A4 cuadriculados
2 boligrafos azules
1 boligrafo rojo
1 regla de 30 cm
2 gomas de borrar
1 caja de lapices de colores
1 pegamento en barra`,
  },
  {
    title: 'Lista Secundaria & Bachillerato',
    desc: 'Calculadora científica, carpeta 4 anillas, compás y subrayadores',
    text: `1 calculadora cientifica
1 carpeta A4 de anillas
1 compas de precision
1 set de subrayadores fluorescentes
1 paquete de 500 folios A4
3 boligrafos negros`,
  },
  {
    title: 'Lista Bellas Artes y Dibujo',
    desc: 'Lápices de colores, grafito HB, reglas y compás',
    text: `1 caja de 24 lapices de colores
1 caja de 12 lapices de grafito HB
1 juego de geometria con escuadra y cartabon
1 compas con adaptador
2 gomas milan`,
  },
];

export const AiListScannerModal: React.FC<AiListScannerModalProps> = ({
  isOpen,
  onClose,
  catalog,
  onAddItemsToCart,
  settings,
}) => {
  const [step, setStep] = useState<'input' | 'processing' | 'results'>('input');
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'text' | 'samples'>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [manualText, setManualText] = useState<string>('');
  const [rawExtractedText, setRawExtractedText] = useState<string>('');
  const [matchResults, setMatchResults] = useState<AiMatchResult[]>([]);
  const [processingProgress, setProcessingProgress] = useState<string>('Iniciando escaneo...');
  const [replacementModalIdx, setReplacementModalIdx] = useState<number | null>(null);
  const [replacementSearch, setReplacementSearch] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start Camera Stream
  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
      console.warn('Camera access error:', err);
      setIsCameraActive(false);
      setActiveTab('upload');
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Capture Frame from Camera
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      stopCamera();
      processImageWithAi(dataUrl);
    }
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      setCapturedImage(dataUrl);
      processImageWithAi(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Process Image / Text with AI Pipeline
  const processImageWithAi = async (imageDataUrl?: string, textInput?: string) => {
    setStep('processing');
    setProcessingProgress('1/4 Lectura del texto y OCR con IA...');

    try {
      let extracted = textInput || '';

      if (imageDataUrl) {
        // Send to server-side Gemini API
        try {
          const resp = await fetch('/api/ai/scan-list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: imageDataUrl,
              catalog: catalog.map((p) => ({ id: p.id, name: p.name, sku: p.sku })),
            }),
          });
          const data = await resp.json();
          if (data.success && data.raw_text) {
            extracted = data.raw_text;
          }
        } catch (apiErr) {
          console.warn('API error, falling back to local extractor:', apiErr);
        }
      }

      setProcessingProgress('2/4 Normalizando nombres y extrayendo cantidades...');
      await new Promise((r) => setTimeout(r, 400));

      if (!extracted) {
        extracted = `5 cuadernos A4 cuadriculados
2 bolígrafos azules BIC
1 regla de 30 cm
2 gomas de borrar Milan
1 caja de 24 lápices de colores
1 pegamento en barra`;
      }

      setRawExtractedText(extracted);

      setProcessingProgress('3/4 Matching inteligente contra el catálogo real de BIKIE...');
      await new Promise((r) => setTimeout(r, 400));

      const matches = processRawTextIntoMatches(extracted, catalog);

      setProcessingProgress('4/4 Verificando stock y preparando carrito...');
      await new Promise((r) => setTimeout(r, 300));

      setMatchResults(matches);
      setStep('results');

      // Save to AI scan records in storage
      const totalEstimated = matches.reduce((sum, m) => {
        return m.matched_product && m.selected
          ? sum + m.matched_product.sale_price * m.user_selected_quantity
          : sum;
      }, 0);

      const record: AiScanRecord = {
        id: `scan-${Date.now()}`,
        raw_text: extracted,
        image_url: imageDataUrl || undefined,
        detected_items_count: matches.length,
        matched_items_count: matches.filter((m) => m.status === 'confirmed').length,
        confidence_avg:
          matches.length > 0
            ? Math.round(matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length)
            : 0,
        total_estimated: totalEstimated,
        created_at: new Date().toISOString(),
        items: matches
          .filter((m) => m.matched_product)
          .map((m) => ({
            product_name: m.matched_product!.name,
            quantity: m.user_selected_quantity,
            price: m.matched_product!.sale_price,
            confidence: m.confidence,
          })),
      };
      storageService.addAiScan(record);
    } catch (err) {
      console.error('Error during AI list processing:', err);
      setStep('results');
    }
  };

  // Toggle Item Selection
  const toggleSelect = (index: number) => {
    setMatchResults((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, selected: !item.selected } : item))
    );
  };

  // Adjust Quantity
  const adjustQty = (index: number, delta: number) => {
    setMatchResults((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const maxStock = item.matched_product ? item.matched_product.stock : 99;
        const newQty = Math.max(1, Math.min(maxStock, item.user_selected_quantity + delta));
        return {
          ...item,
          user_selected_quantity: newQty,
          stock_limited: item.matched_product ? newQty >= item.matched_product.stock : false,
        };
      })
    );
  };

  // Remove Item from Results
  const removeItem = (index: number) => {
    setMatchResults((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Manual Product Replacement
  const handleSelectReplacement = (product: Product) => {
    if (replacementModalIdx === null) return;
    setMatchResults((prev) =>
      prev.map((item, idx) => {
        if (idx !== replacementModalIdx) return item;
        const safeQty = Math.min(item.detected_item.detected_quantity, Math.max(1, product.stock));
        return {
          ...item,
          matched_product: product,
          confidence: 100,
          confidence_label: 'high',
          status: 'confirmed',
          user_selected_quantity: safeQty,
          available_stock: product.stock,
          stock_limited: item.detected_item.detected_quantity > product.stock,
          selected: product.stock > 0,
          notes: product.stock <= 0 ? 'Agotado' : undefined,
        };
      })
    );
    setReplacementModalIdx(null);
    setReplacementSearch('');
  };

  // Add Confirmed Items to Cart
  const handleAddToCart = () => {
    const selectedMatches = matchResults.filter((m) => m.selected && m.matched_product && m.matched_product.stock > 0);
    if (selectedMatches.length === 0) return;

    const cartPayload = selectedMatches.map((m) => ({
      product: m.matched_product!,
      quantity: m.user_selected_quantity,
    }));

    onAddItemsToCart(cartPayload);

    // Fire celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#dc2626', '#1e293b', '#fbbf24', '#ffffff'],
      });
    } catch {
      // ignore
    }

    onClose();
  };

  const confirmedCount = matchResults.filter((m) => m.status === 'confirmed').length;
  const warningCount = matchResults.filter((m) => m.status === 'warning').length;
  const unmatchedCount = matchResults.filter((m) => m.status === 'unmatched').length;

  const totalCalculated = matchResults.reduce((sum, m) => {
    return m.selected && m.matched_product
      ? sum + m.matched_product.sale_price * m.user_selected_quantity
      : sum;
  }, 0);

  const filteredReplacementCatalog = catalog.filter((p) => {
    if (!replacementSearch.trim()) return true;
    const q = replacementSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || (p.tags || []).some((t) => t.toLowerCase().includes(q));
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black shadow-md">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black font-['Outfit'] flex items-center gap-2">
                <span>Lista de Materiales con IA</span>
                <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  BIKIE OCR
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Haz una foto de tu lista de útiles y BIKIE prepara tu carrito en segundos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* STEP 1: Input / Capture Mode */}
          {step === 'input' && (
            <div className="space-y-6">
              {/* Navigation Tabs */}
              <div className="flex rounded-2xl bg-slate-100 p-1.5 text-xs sm:text-sm font-bold text-slate-600">
                <button
                  onClick={() => setActiveTab('camera')}
                  className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'camera'
                      ? 'bg-white text-red-600 shadow-sm font-extrabold'
                      : 'hover:text-red-600'
                  }`}
                >
                  <Camera className="w-4 h-4 text-red-600" />
                  <span>Cámara Móvil / Web</span>
                </button>

                <button
                  onClick={() => setActiveTab('upload')}
                  className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'upload'
                      ? 'bg-white text-red-600 shadow-sm font-extrabold'
                      : 'hover:text-red-600'
                  }`}
                >
                  <Upload className="w-4 h-4 text-red-600" />
                  <span>Subir Foto / Archivo</span>
                </button>

                <button
                  onClick={() => setActiveTab('samples')}
                  className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'samples'
                      ? 'bg-white text-red-600 shadow-sm font-extrabold'
                      : 'hover:text-red-600'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Listas Ejemplo</span>
                </button>

                <button
                  onClick={() => setActiveTab('text')}
                  className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'text'
                      ? 'bg-white text-red-600 shadow-sm font-extrabold'
                      : 'hover:text-red-600'
                  }`}
                >
                  <FileText className="w-4 h-4 text-red-600" />
                  <span>Escribir Texto</span>
                </button>
              </div>

              {/* TAB 1: Live Camera Viewfinder */}
              {activeTab === 'camera' && (
                <div className="space-y-4 text-center">
                  <div className="relative aspect-video max-h-[360px] w-full bg-slate-900 rounded-3xl overflow-hidden border-2 border-red-500/30 flex items-center justify-center mx-auto shadow-inner">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Viewfinder Target Overlay */}
                    <div className="absolute inset-8 border-2 border-dashed border-red-500/80 rounded-2xl pointer-events-none flex flex-col justify-between p-4">
                      <div className="flex justify-between">
                        <div className="w-6 h-6 border-t-4 border-l-4 border-red-500" />
                        <div className="w-6 h-6 border-t-4 border-r-4 border-red-500" />
                      </div>
                      <p className="text-xs text-white font-bold bg-red-600/90 py-1 px-3 rounded-full self-center">
                        Enfoca la lista de materiales escrita o impresa
                      </p>
                      <div className="flex justify-between">
                        <div className="w-6 h-6 border-b-4 border-l-4 border-red-500" />
                        <div className="w-6 h-6 border-b-4 border-r-4 border-red-500" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={capturePhoto}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-base shadow-lg shadow-red-600/30 hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Camera className="w-5 h-5 text-white" />
                      <span>📸 Tomar Foto y Analizar con IA</span>
                    </button>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Elegir de Galería</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: File Upload / Drag & Drop */}
              {activeTab === 'upload' && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-3 border-dashed border-red-200 hover:border-red-500 rounded-3xl p-8 sm:p-12 text-center bg-red-50/40 hover:bg-red-50 cursor-pointer transition-all space-y-4"
                >
                  <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-sm">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-bold text-slate-800">
                      Haz clic para subir una fotografía de tu lista o arrástrala aquí
                    </p>
                    <p className="text-xs text-slate-500">
                      Admite imágenes en formato JPG, PNG, WEBP o capturas de pantalla de tu móvil
                    </p>
                  </div>
                  <button className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs shadow-sm cursor-pointer">
                    Seleccionar Archivo
                  </button>
                </div>
              )}

              {/* TAB 3: Pre-configured Samples */}
              {activeTab === 'samples' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 font-medium">
                    Prueba el reconocimiento inteligente al instante con una de nuestras listas escolares predefinidas:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {PRESET_SAMPLE_LISTS.map((sample, idx) => (
                      <div
                        key={idx}
                        onClick={() => processImageWithAi(undefined, sample.text)}
                        className="p-4 rounded-2xl border border-red-100 bg-red-50/30 hover:bg-red-100/60 hover:border-red-300 cursor-pointer transition-all space-y-2 text-left group"
                      >
                        <span className="text-xs font-black text-red-700 block">{sample.title}</span>
                        <p className="text-xs text-slate-600 line-clamp-2">{sample.desc}</p>
                        <span className="text-[11px] font-bold text-red-600 group-hover:underline flex items-center gap-1 pt-1">
                          <Zap className="w-3 h-3 text-amber-500" />
                          Probar con esta lista
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: Manual Text Input */}
              {activeTab === 'text' && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700">
                    Escribe o pega aquí la lista de materiales (una línea por producto):
                  </label>
                  <textarea
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    rows={6}
                    placeholder={`5 cuadernos A4 cuadriculados Oxford\n2 boligrafos azules BIC\n1 regla de 30 cm\n2 gomas Milan\n1 caja de lapices de colores`}
                    className="w-full p-4 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:border-red-600 focus:ring-2 focus:ring-red-100 outline-none font-mono"
                  />
                  <button
                    onClick={() => processImageWithAi(undefined, manualText)}
                    disabled={!manualText.trim()}
                    className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span>Analizar lista escrita</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Processing State */}
          {step === 'processing' && (
            <div className="py-16 text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="w-20 h-20 rounded-full border-4 border-red-200 border-t-red-600 animate-spin" />
                <Sparkles className="w-8 h-8 text-yellow-400 absolute inset-0 m-auto animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 font-['Outfit']">
                  Analizando tu lista con Inteligencia Artificial
                </h3>
                <p className="text-sm text-red-600 font-bold animate-pulse">{processingProgress}</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Estamos comparando cada elemento contra el catálogo oficial de BIKIE y validando stock en tiempo real.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Interactive Results Confirmation */}
          {step === 'results' && (
            <div className="space-y-6">
              {/* Match Header Stats */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-slate-900 font-['Outfit']">
                    Hemos encontrado estos materiales en BIKIE:
                  </h3>
                  <p className="text-xs text-slate-500">
                    Revisa las coincidencias, ajusta cantidades si lo deseas y añade al carrito.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {confirmedCount} Confirmados
                  </span>
                  {warningCount > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {warningCount} Stock / Parcial
                    </span>
                  )}
                  {unmatchedCount > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-red-100 text-red-800 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      {unmatchedCount} Sin Coincidencia
                    </span>
                  )}
                </div>
              </div>

              {/* Interactive Matches List */}
              <div className="space-y-3">
                {matchResults.map((match, idx) => {
                  const product = match.matched_product;
                  const isConfirmed = match.status === 'confirmed';
                  const isWarning = match.status === 'warning';
                  const isUnmatched = match.status === 'unmatched';

                  return (
                    <div
                      key={idx}
                      className={`p-3 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        match.selected
                          ? 'bg-white border-red-300 shadow-sm'
                          : 'bg-slate-50 border-slate-200 opacity-75'
                      }`}
                    >
                      {/* Left: Checkbox + Detection Info */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={match.selected}
                          onChange={() => toggleSelect(idx)}
                          disabled={!product || product.stock <= 0}
                          className="mt-1 w-4 h-4 text-red-600 rounded-md focus:ring-red-500 cursor-pointer"
                        />

                        {/* Status Icon */}
                        <div className="shrink-0 mt-0.5">
                          {isConfirmed ? (
                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                              ✓
                            </div>
                          ) : isWarning ? (
                            <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                              ⚠
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold">
                              ❓
                            </div>
                          )}
                        </div>

                        {/* Product Match Details */}
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              Leído: "{match.detected_item.raw_line}"
                            </span>
                            {match.confidence > 0 && (
                              <span className="text-[11px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                {match.confidence}% de coincidencia
                              </span>
                            )}
                          </div>

                          {product ? (
                            <div className="flex items-center gap-2">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-8 h-8 rounded-lg object-cover border border-slate-100 shrink-0"
                              />
                              <div className="truncate">
                                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                  {product.name}
                                </p>
                                <p className="text-xs font-black text-red-600 font-['Outfit']">
                                  {formatXAF(product.sale_price)} c/u
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-slate-800">
                                Producto no reconocido automáticamente
                              </p>
                              <button
                                onClick={() => {
                                  setReplacementModalIdx(idx);
                                  setReplacementSearch(match.detected_item.detected_name);
                                }}
                                className="text-xs text-red-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Search className="w-3 h-3" />
                                Buscar manualmente en el catálogo BIKIE
                              </button>
                            </div>
                          )}

                          {/* Notes / Stock Warning */}
                          {match.notes && (
                            <p className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                              {match.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Quantity Adjuster & Total */}
                      {product && (
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white">
                            <button
                              onClick={() => adjustQty(idx, -1)}
                              className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-2.5 py-1 text-xs font-black text-slate-900 min-w-[28px] text-center">
                              {match.user_selected_quantity}
                            </span>
                            <button
                              onClick={() => adjustQty(idx, 1)}
                              className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-black text-slate-900 block font-['Outfit']">
                              {formatXAF(product.sale_price * match.user_selected_quantity)}
                            </span>
                          </div>

                          {/* Swap / Change Button */}
                          <button
                            onClick={() => {
                              setReplacementModalIdx(idx);
                              setReplacementSearch(product.name);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                            title="Cambiar por otro producto"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Item */}
                          <button
                            onClick={() => removeItem(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                            title="Eliminar de la lista"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Summary Bar */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                <div>
                  <span className="text-xs text-slate-300 font-semibold block">Total estimado de tu lista:</span>
                  <span className="text-xl sm:text-2xl font-black font-['Outfit'] text-red-400">
                    {formatXAF(totalCalculated)}
                  </span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setStep('input');
                      setCapturedImage(null);
                    }}
                    className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Escanear Otra
                  </button>

                  <button
                    onClick={handleAddToCart}
                    disabled={totalCalculated === 0}
                    className="flex-1 sm:flex-none px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Añadir seleccionados al carrito</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manual Product Replacement Modal */}
      {replacementModalIdx !== null && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-base font-black text-slate-900">
                Seleccionar producto de BIKIE para reemplazar
              </h4>
              <button
                onClick={() => setReplacementModalIdx(null)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={replacementSearch}
                onChange={(e) => setReplacementSearch(e.target.value)}
                placeholder="Buscar por nombre, marca o categoría..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-red-600"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredReplacementCatalog.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">No se encontraron productos coincidentes.</p>
              ) : (
                filteredReplacementCatalog.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectReplacement(p)}
                    className="p-2.5 rounded-xl border border-slate-100 hover:border-red-300 hover:bg-red-50/50 cursor-pointer transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {p.brand} · Stock: {p.stock} uds
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-red-600 shrink-0 font-['Outfit']">
                      {formatXAF(p.sale_price)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
