import { useState } from 'react';
import { Shield, Mail, Lock, User as UserIcon, LogIn, UserPlus, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import type { Role } from '../types';

export function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('boss');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      const { error } = await signUp(email, password, name, role);
      if (error) setError(error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-discord-darkest dark:bg-discord-darkest bg-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#5865F2] flex items-center justify-center shadow-lg shadow-[#5865F2]/30 mb-4">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">PRODUSAVE</h1>
          <p className="text-sm text-gray-400 mt-1">Gestión de stock, POS y administración</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-discord-dark dark:bg-discord-dark bg-gray-800 border border-white/5 p-6 shadow-xl">
          <div className="flex gap-2 mb-6 p-1 rounded-xl bg-black/30">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition ${
                mode === 'login' ? 'bg-[#5865F2] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <LogIn size={16} /> Iniciar Sesión
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition ${
                mode === 'register' ? 'bg-[#5865F2] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <UserPlus size={16} /> Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nombre completo</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-black/30 border border-white/10">
                  <UserIcon size={16} className="text-gray-500" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Carlos Martínez"
                    className="bg-transparent outline-none flex-1 text-sm text-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-black/30 border border-white/10">
                <Mail size={16} className="text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="carlos@negocio.com"
                  className="bg-transparent outline-none flex-1 text-sm text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Contraseña</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-black/30 border border-white/10">
                <Lock size={16} className="text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  className="bg-transparent outline-none flex-1 text-sm text-white"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Tipo de cuenta</label>
                <div className="flex gap-2">
                  {([
                    { id: 'boss', label: 'Jefe / Dueño' },
                    { id: 'employee', label: 'Empleado / Cajero' },
                  ] as const).map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition border ${
                        role === r.id
                          ? 'bg-[#5865F2]/15 text-[#5865F2] border-[#5865F2]/40'
                          : 'bg-black/20 text-gray-400 border-white/10 hover:text-white'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Al registrarte como Jefe, se creará tu negocio. Como Empleado, podrás vincularte luego.
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Al continuar aceptás los términos de servicio de Produsave.
        </p>
      </div>
    </div>
  );
}
