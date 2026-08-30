import React from 'react';
import { X, ShieldCheck, FileText, Lock, Globe } from 'lucide-react';
import { StoreSettings } from '../types';

export type LegalDocType = 'privacy' | 'terms' | 'cookies' | 'shipping';

interface LegalModalProps {
  isOpen: boolean;
  type: LegalDocType;
  onClose: () => void;
  settings: StoreSettings;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  type,
  onClose,
  settings,
}) => {
  if (!isOpen) return null;

  const renderContent = () => {
    switch (type) {
      case 'privacy':
        return (
          <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-900 mb-4">
              <p className="font-bold text-sm mb-1">Compromiso de Privacidad BIKIE</p>
              <p className="text-xs">
                En <strong>BIKIE Papelería</strong> (Malabo, Guinea Ecuatorial) protegemos tus datos personales conforme a las mejores prácticas internacionales de protección de datos.
              </p>
            </div>

            <h3 className="text-base font-extrabold text-slate-900">1. Responsable del Tratamiento</h3>
            <p>
              <strong>Titular:</strong> BIKIE Papelería & Librería<br />
              <strong>Ubicación:</strong> {settings.address || 'Paraíso, cerca de Banje, Malabo, Guinea Ecuatorial'}<br />
              <strong>Contacto:</strong> {settings.phone || '222213126'} / {settings.email || 'contacto@bikie-papeleria.com'}
            </p>

            <h3 className="text-base font-extrabold text-slate-900">2. Finalidad del Tratamiento de Datos</h3>
            <p>
              Recopilamos únicamente los datos necesarios para:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Gestionar y entregar tus pedidos de material escolar, oficina y papelería.</li>
              <li>Procesar el análisis inteligente de listas escolares mediante IA (las imágenes se procesan de forma efímera y segura).</li>
              <li>Atención al cliente vía WhatsApp o telefónica sobre el estado de sus pedidos.</li>
              <li>Cumplir con las obligaciones legales y de facturación.</li>
            </ul>

            <h3 className="text-base font-extrabold text-slate-900">3. Seguridad y Confidencialidad</h3>
            <p>
              Sus datos se transmiten de manera encriptada a través de conexiones seguras HTTPS/SSL y se almacenan en servidores con estrictos controles de acceso (Row Level Security en Supabase / PostgreSQL).
            </p>

            <h3 className="text-base font-extrabold text-slate-900">4. Derechos del Usuario</h3>
            <p>
              Puede ejercer sus derechos de acceso, rectificación o supresión de sus datos en cualquier momento comunicándose con nosotros a través de nuestro teléfono/WhatsApp <strong>222213126</strong>.
            </p>
          </div>
        );

      case 'terms':
        return (
          <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <h3 className="text-base font-extrabold text-slate-900">1. Condiciones Generales</h3>
            <p>
              El acceso y uso de la plataforma web de <strong>BIKIE Papelería</strong> se rige por los presentes Términos y Condiciones. Al realizar un pedido a través de este sitio, usted acepta plenamente estas condiciones.
            </p>

            <h3 className="text-base font-extrabold text-slate-900">2. Precios y Moneda Oficial</h3>
            <p>
              Todos los precios de los productos y servicios indicados en la web están expresados en <strong>Francos CFA (XAF/FCFA)</strong>, moneda de curso legal en Guinea Ecuatorial.
            </p>

            <h3 className="text-base font-extrabold text-slate-900">3. Pedidos y Disponibilidad de Stock</h3>
            <p>
              Los pedidos realizados a través de la web se preparan en nuestro local físico en Paraíso, Malabo. En caso de rotura puntual de stock de algún producto, nuestro equipo contactará inmediatamente al cliente para ofrecer una alternativa equivalente o ajustar el pedido.
            </p>

            <h3 className="text-base font-extrabold text-slate-900">4. Métodos de Pago</h3>
            <p>
              Aceptamos pago en efectivo en tienda al recoger el pedido, pago contra entrega en Malabo o transferencias bancarias locales.
            </p>
          </div>
        );

      case 'cookies':
        return (
          <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <h3 className="text-base font-extrabold text-slate-900">Política de Cookies & Almacenamiento Local</h3>
            <p>
              En <strong>BIKIE</strong> utilizamos cookies técnicas y almacenamiento estrictamente necesario para:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Cookies Técnicas Esenciales:</strong> Mantener tu carrito de compras activo mientras navegas y recordar tu sesión administrativa segura.</li>
              <li><strong>Preferencias:</strong> Guardar tus artículos favoritos y filtros de búsqueda.</li>
              <li><strong>Cero Rastreo Invasivo:</strong> No vendemos tus datos a terceros ni utilizamos cookies de publicidad invasiva.</li>
            </ul>
          </div>
        );

      case 'shipping':
        return (
          <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <h3 className="text-base font-extrabold text-slate-900">Entregas y Recogida en Malabo</h3>
            <p>
              <strong>Recogida en Tienda (Gratis):</strong> Puedes recoger tu pedido preparado en nuestro local de Paraíso (cerca de Banje, Malabo) en nuestro horario comercial de lunes a sábado de 08:00 a 19:30.
            </p>
            <p>
              <strong>Entrega a Domicilio en Malabo:</strong> Realizamos entregas directas en Malabo capital. Para pedidos superiores a <strong>25.000 FCFA</strong>, la entrega es gratuita.
            </p>
          </div>
        );
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'privacy': return 'Política de Privacidad';
      case 'terms': return 'Términos y Condiciones de Compra';
      case 'cookies': return 'Política de Cookies';
      case 'shipping': return 'Envíos y Entregas en Malabo';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-950 text-white p-5 flex items-center justify-between border-b border-red-900/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-lg">
              B
            </div>
            <div>
              <h2 className="text-base font-black font-['Outfit']">{getTitle()}</h2>
              <p className="text-[11px] text-slate-400">BIKIE Papelería · Malabo, Guinea Ecuatorial</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Entendido y Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
