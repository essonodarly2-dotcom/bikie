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
  CheckCircle2,
  Mail,
  ArrowLeft,
} from 'lucide-react';
import { UserProfile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  loginSchema,
  passwordRecoverySchema,
  sanitizeString,
} from '../lib/validations';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
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

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      setMode('login');
    }
  }, [isOpen]);

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
      if (!isSupabaseConfigured || !supabase) {
        setError('Supabase no está configurado. Por favor define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en las variables de entorno.');
        setIsLoading(false);
        return;
      }

      // Supabase Auth Direct Sign In
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (authError || !authData.user) {
        let errorMsg = authError?.message || 'Error al autenticar con Supabase.';
        if (authError?.message?.includes('Invalid login credentials')) {
          errorMsg = 'Credenciales incorrectas. Verifica tu correo y contraseña registrados en Supabase.';
        } else if (authError?.message?.includes('Database error querying schema') || authError?.message?.includes('Database error')) {
          errorMsg = 'Error en el esquema de Supabase Auth (Database error querying schema). Si creaste el usuario mediante SQL directo, por favor créalo desde la pestaña Authentication > Users de Supabase para generar las identidades internas de GoTrue correctamente.';
        }
        setError(errorMsg);
        setIsLoading(false);
        return;
      }

      // Fetch user profile from public.profiles table using user ID or email
      let profileData: any = null;
      try {
        // Try searching by ID
        const { data: pDataById, error: pErrorById } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (!pErrorById && pDataById) {
          profileData = pDataById;
        } else if (authData.user.email) {
          // Fallback search by email in case profile was created with a custom id
          const { data: pDataByEmail } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', authData.user.email)
            .maybeSingle();

          if (pDataByEmail) {
            profileData = pDataByEmail;
          }
        }
      } catch (profileErr) {
        console.warn('Error fetching profile:', profileErr);
      }

      // Check role in profileData, or user_metadata, or app_metadata
      let userRole = 
        profileData?.role || 
        authData.user.user_metadata?.role || 
        (authData.user.app_metadata as any)?.role;

      // If user profile is not found or not marked as admin, check if email matches admin email
      if (userRole !== 'admin') {
        await supabase.auth.signOut();
        setError('Acceso denegado: este usuario no tiene el rol "admin" en la tabla "public.profiles" ni en sus metadatos de Supabase Auth.');
        setIsLoading(false);
        return;
      }

      // Auto-sync profile to ensure public.profiles has this user with role=admin
      if (!profileData) {
        try {
          const { data: newProfile } = await supabase
            .from('profiles')
            .upsert({
              id: authData.user.id,
              email: authData.user.email || cleanEmail,
              name: authData.user.user_metadata?.name || 'María Lidia (Propietaria)',
              phone: authData.user.user_metadata?.phone || '+240 222 213 126',
              role: 'admin',
              points: 2500,
            })
            .select()
            .maybeSingle();
          if (newProfile) {
            profileData = newProfile;
          }
        } catch (upsertErr) {
          console.warn('Could not auto-upsert admin profile:', upsertErr);
        }
      }

      const adminUser: UserProfile = {
        id: authData.user.id,
        email: authData.user.email || cleanEmail,
        name: profileData?.name || authData.user.user_metadata?.name || 'Administradora BIKIE',
        phone: profileData?.phone || authData.user.user_metadata?.phone || '+240 222 213 126',
        role: 'admin',
        points: profileData?.points || 0,
        created_at: profileData?.created_at || authData.user.created_at || new Date().toISOString(),
      };

      onLoginSuccess(adminUser);
      setIsLoading(false);
      onClose();
    } catch (err: any) {
      console.error('Error logging in with Supabase Auth:', err);
      setError(err?.message || 'Error inesperado al conectar con Supabase Auth. Intenta nuevamente.');
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
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
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
              <span className="font-semibold text-slate-700">Supabase Auth · auth.users</span>
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
                Ingresa con tu correo y contraseña registrados en Supabase Auth. Acceso exclusivo para la administradora.
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
                      <span>Validando con Supabase Auth...</span>
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
        </div>
      </div>
    </div>
  );
};
