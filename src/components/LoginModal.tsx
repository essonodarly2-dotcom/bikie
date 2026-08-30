import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  User,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  LogOut,
  Database,
  CheckCircle2,
  Code2,
  Copy,
  Check,
  Terminal,
  ChevronDown,
  ChevronUp,
  Mail,
  ArrowLeft,
} from 'lucide-react';
import { UserProfile } from '../types';
import { api } from '../lib/api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  loginSchema,
  passwordRecoverySchema,
  adminCodeGeneratorSchema,
  sanitizeString,
} from '../lib/validations';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  availableUsers?: UserProfile[];
  onLoginSuccess: (user: UserProfile) => void;
  onLogoutToGuest: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogoutToGuest,
}) => {
  const [mode, setMode] = useState<'login' | 'recovery'>('login');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDbCodeGenerator, setShowDbCodeGenerator] = useState(false);

  // DB User Generator State (Single Admin Only)
  const [genName, setGenName] = useState('María Lidia (Propietaria)');
  const [genEmail, setGenEmail] = useState('marialidia@bikie.gq');
  const [genPhone, setGenPhone] = useState('+240 222 213 126');
  const [genPass, setGenPass] = useState('1234');
  const [generatedSql, setGeneratedSql] = useState<string>('');
  const [generatedJson, setGeneratedJson] = useState<string>('');
  const [copiedType, setCopiedType] = useState<'sql' | 'json' | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      setMode('login');
    }
  }, [isOpen]);

  useEffect(() => {
    if (showDbCodeGenerator && !generatedSql) {
      handleGenerateCode();
    }
  }, [showDbCodeGenerator]);

  const handleGenerateCode = async () => {
    setError(null);
    const validation = adminCodeGeneratorSchema.safeParse({
      name: sanitizeString(genName),
      email: sanitizeString(genEmail),
      phone: sanitizeString(genPhone),
      password: genPass,
    });

    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Datos del administrador inválidos');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await api.generateUserCode({
        name: validation.data.name,
        email: validation.data.email,
        phone: validation.data.phone,
        role: 'admin',
        password: validation.data.password,
        points: 2500,
      });

      if (res.success && res.sql && res.json) {
        setGeneratedSql(res.sql);
        setGeneratedJson(res.json);
      }
    } catch (err) {
      console.error('Error generating user creation code:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, type: 'sql' | 'json') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  if (!isOpen) return null;

  const isStaff = currentUser.role === 'admin';

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Zod validation
    const validation = loginSchema.safeParse({
      email: sanitizeString(email),
      password: pin.trim(),
    });

    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Por favor revisa los datos ingresados.');
      return;
    }

    setIsLoading(true);
    const cleanEmail = validation.data.email;
    const cleanPassword = validation.data.password;

    try {
      // 1. If Supabase Auth is configured, try Supabase Auth first
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPassword,
          });

          if (!authError && authData.user) {
            const adminUser: UserProfile = {
              id: authData.user.id,
              email: authData.user.email || cleanEmail,
              name: authData.user.user_metadata?.name || 'María Lidia (Administradora)',
              phone: authData.user.user_metadata?.phone || '+240 222 213 126',
              role: 'admin',
              points: 2500,
              created_at: authData.user.created_at || new Date().toISOString(),
            };
            onLoginSuccess(adminUser);
            setIsLoading(false);
            onClose();
            return;
          }
        } catch (sbErr) {
          console.warn('Supabase Auth attempt fallback to DB verification:', sbErr);
        }
      }

      // 2. Direct call to Database Backend Authentication with strict DB PBKDF2 check & rate limiting
      const result = await api.login(cleanEmail, cleanPassword);

      if (result.success && result.user) {
        onLoginSuccess(result.user);
        setIsLoading(false);
        onClose();
      } else {
        setError(result.error || 'Credenciales inválidas. Verifica tu correo y contraseña registrados en la base de datos.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Error logging in:', err);
      setError('Error al conectar con la base de datos. Inténtalo de nuevo.');
      setIsLoading(false);
    }
  };

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const validation = passwordRecoverySchema.safeParse({
      email: sanitizeString(email),
    });

    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Introduce un correo válido.');
      return;
    }

    setIsLoading(true);
    const cleanEmail = validation.data.email;

    try {
      if (isSupabaseConfigured && supabase) {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail);
        if (resetErr) throw resetErr;
      }
      setSuccessMsg(`Se ha enviado un enlace de recuperación seguro al correo ${cleanEmail}.`);
    } catch (err: any) {
      setSuccessMsg(`Solicitud de recuperación registrada para ${cleanEmail}. Si el correo está registrado en la base de datos de Supabase, recibirás las instrucciones.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with Red & Black Theme */}
        <div className="bg-slate-950 text-white p-5 sm:p-6 relative border-b border-red-900/30 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-lg font-black text-2xl">
              B
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Outfit'] font-black text-2xl tracking-tight">
                  <span className="text-red-600">B</span>
                  <span className="text-white">IKIE</span>
                </span>
                <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                  Panel Admin
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Acceso Exclusivo para la Propietaria
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Security Banner */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 rounded-xl text-[11px] font-medium text-slate-600 border border-slate-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-700">Supabase Auth · Anti-Fuerza Bruta & RLS</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Protegido</span>
            </div>
          </div>

          {/* Current Status Info */}
          {isStaff ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-900">
                    Sesión activa: {currentUser.name}
                  </p>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    Propietaria & Administradora BIKIE
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onLogoutToGuest();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
              <Lock className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>
                Ingresa con tu correo y contraseña registrados directamente en la base de datos de Supabase. Acceso exclusivo para la administradora.
              </span>
            </div>
          )}

          {/* Mode 1: LOGIN FORM */}
          {mode === 'login' ? (
            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correo Electrónico (Administradora)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="ej. marialidia@bikie.gq"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-red-600 focus:ring-2 focus:ring-red-100 outline-hidden transition-all text-slate-800"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Contraseña de Seguridad
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('recovery');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] text-red-600 hover:underline font-semibold cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    required
                    placeholder="Introduce tu contraseña"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-red-600 focus:ring-2 focus:ring-red-100 outline-hidden transition-all text-slate-800 tracking-wider font-mono"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-md shadow-red-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Validando en Base de Datos...</span>
                    </span>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>Iniciar Sesión en Panel de Administración</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Mode 2: RECOVERY FORM */
            <form onSubmit={handlePasswordRecovery} className="space-y-3.5">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-sm font-bold text-slate-800">Recuperación de Contraseña</h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Ingresa el correo electrónico de administradora asociado a la base de datos de Supabase para recibir las instrucciones de restablecimiento de contraseña.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="marialidia@bikie.gq"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-red-600 focus:ring-2 focus:ring-red-100 outline-hidden transition-all text-slate-800"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'Enviando solicitud...' : 'Enviar Enlace de Recuperación'}
                </button>
              </div>
            </form>
          )}

          {/* Database User Creation Code (SQL / JSON) Accordion */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
            <button
              type="button"
              onClick={() => setShowDbCodeGenerator(!showDbCodeGenerator)}
              className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200/80 text-slate-800 flex items-center justify-between text-xs font-bold transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-red-600" />
                <span>Generador SQL de Usuario Administrador para Supabase</span>
              </div>
              {showDbCodeGenerator ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDbCodeGenerator && (
              <div className="p-4 space-y-4 border-t border-slate-200 bg-white text-xs">
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Copia estas sentencias SQL para crear o resetear la cuenta de la propietaria en el Editor SQL de Supabase:
                </p>

                {/* Generator Form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={genName}
                      onChange={(e) => setGenName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      value={genEmail}
                      onChange={(e) => setGenEmail(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={genPhone}
                      onChange={(e) => setGenPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Contraseña / PIN</label>
                    <input
                      type="text"
                      value={genPass}
                      onChange={(e) => setGenPass(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center justify-between pt-1">
                    <span className="text-[10px] font-bold text-red-600">Rol: Administradora Única</span>
                    <button
                      type="button"
                      onClick={handleGenerateCode}
                      disabled={isGenerating}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                    >
                      {isGenerating ? 'Generando...' : 'Generar SQL'}
                    </button>
                  </div>
                </div>

                {/* SQL Code Block */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px]">
                      <Terminal className="w-3.5 h-3.5 text-blue-600" />
                      <span>Sentencia SQL para Supabase Auth:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generatedSql, 'sql')}
                      className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors cursor-pointer"
                    >
                      {copiedType === 'sql' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar SQL</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 text-slate-200 rounded-xl overflow-x-auto text-[10px] font-mono leading-relaxed border border-slate-800">
                    {generatedSql || 'Generando consulta SQL...'}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
