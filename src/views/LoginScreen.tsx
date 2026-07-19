import { useState } from 'react';
import { Shield, Mail, Lock, LogIn, Loader2, AlertCircle, WifiOff } from 'lucide-react';
import { useAuth } from '../store/AuthContext';

export function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signIn(email, password);
    if (error) {
      const isNetwork = error.includes('fetch') || error.includes('Failed to') || error.includes('network');
      setError(isNetwork
        ? 'Error de conexión con el servidor. Verificá tu internet e intentá de nuevo.'
        : error
      );
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-discord-darkest dark:bg-discord-darkest bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#5865F2] flex items-center justify-center shadow-lg shadow-[#5865F2]/30 mb-4">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">PRODUSAVE</h1>
          <p className="text-sm text-gray-400 mt-1">Gestión de stock, POS y administración</p>
        </div>

        <div className="rounded-2xl bg-discord-dark dark:bg-discord-dark bg-gray-800 border border-white/5 p-6 shadow-xl">
          <div className="flex items-center justify-center gap-2 mb-6 py-2.5 rounded-xl bg-[#5865F2]/10">
            <LogIn size={18} className="text-[#5865F2]" />
            <span className="text-sm font-bold text-[#5865F2]">Iniciar Sesión</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                {error.includes('conexión') ? <WifiOff size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Entrar'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-white/5 text-center">
            <p className="text-xs text-gray-500">
              ¿No tenés cuenta? Contactá al equipo de Produsave para registrarte.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Al continuar aceptás los términos de servicio de Produsave.
        </p>
      </div>
    </div>
  );
}
