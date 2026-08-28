import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Send,
  ShoppingBag,
  Bot,
  User,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { Product } from '../types';
import { formatXAF } from '../utils/formatters';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  recommendedProducts?: Product[];
  timestamp: string;
}

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: Product[];
  onAddToCart: (product: Product, quantity?: number) => void;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  catalog,
  onAddToCart,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: '¡Hola! Soy el Asistente Inteligente de BIKIE Papelería. 🎒✨ ¿Necesitas ayuda para armar una lista escolar, encontrar un producto específico o saber qué materiales son ideales para tu curso?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || isTyping) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const resp = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          catalogSummary: catalog.map((p) => ({
            id: p.id,
            name: p.name,
            brand: p.brand,
            sale_price: p.sale_price,
            stock: p.stock,
            category_name: p.category_name,
          })),
        }),
      });

      const data = await resp.json();
      let replyText = 'Aquí tienes algunas recomendaciones de BIKIE:';
      let recProds: Product[] = [];

      if (data.success) {
        replyText = data.reply;
        if (data.recommended_ids && Array.isArray(data.recommended_ids)) {
          recProds = catalog.filter((p) => data.recommended_ids.includes(p.id));
        }
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        recommendedProducts: recProds,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.warn('AI Assistant error:', err);
      // Fallback response
      const fallbackAiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: 'Te recomiendo revisar nuestros cuadernos Oxford A4, bolígrafos BIC y colores Faber-Castell.',
        recommendedProducts: catalog.slice(0, 3),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackAiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const samplePrompts = [
    '¿Qué necesito para 1º de Primaria?',
    '¿Tienen calculadoras científicas en stock?',
    'Recomiéndame una buena mochila escolar',
    'Material de dibujo técnico',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shadow-md border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-black font-['Outfit'] flex items-center gap-1.5">
                  <span>Asistente BIKIE</span>
                  <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full uppercase">
                    IA
                  </span>
                </h3>
                <p className="text-[11px] text-slate-300">Experto en material escolar y papelería</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center text-xs shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 space-y-2 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-red-600 text-white rounded-br-none shadow-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Recommended Products in message */}
                  {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                    <div className="pt-2 space-y-2 border-t border-slate-100">
                      <p className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                        Productos recomendados:
                      </p>
                      {msg.recommendedProducts.map((p) => (
                        <div
                          key={p.id}
                          className="p-2 rounded-xl bg-red-50/60 border border-red-100 flex items-center justify-between gap-2"
                        >
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover bg-white border border-slate-100"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 truncate">{p.name}</p>
                            <p className="text-red-600 font-extrabold font-['Outfit']">{formatXAF(p.sale_price)}</p>
                          </div>
                          <button
                            onClick={() => onAddToCart(p, 1)}
                            disabled={p.stock <= 0}
                            className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>Añadir</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <span
                    className={`text-[9px] block text-right mt-1 ${
                      msg.sender === 'user' ? 'text-red-100' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 text-xs pl-2">
                <div className="w-2 h-2 rounded-full bg-red-600 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-red-600 animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 rounded-full bg-red-600 animate-bounce" style={{ animationDelay: '0.4s' }} />
                <span>Asistente BIKIE está respondiendo...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="p-2 border-t border-slate-100 bg-white flex gap-1.5 overflow-x-auto text-[11px]">
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="px-2.5 py-1 rounded-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 shrink-0 font-medium transition-colors cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Pregúntame cualquier duda sobre material escolar..."
              className="flex-1 p-2.5 text-xs rounded-xl border border-slate-200 focus:border-red-600 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="p-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
