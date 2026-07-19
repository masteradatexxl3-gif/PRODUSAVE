import { AlertTriangle, X } from 'lucide-react';
import { useApp } from '../store/AppContext';

export function WarningToasts() {
  const { warnings, clearWarning } = useApp();
  if (warnings.length === 0) return null;
  return (
    <div className="fixed top-20 right-5 z-50 space-y-2 w-80">
      {warnings.map((w) => (
        <div
          key={w.id}
          className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/40 backdrop-blur-md shadow-xl animate-slide-in-right"
        >
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wide">Aviso al Jefe</p>
            <p className="text-sm text-gray-800 dark:text-gray-200 mt-0.5">{w.text}</p>
            <p className="text-[10px] text-gray-500 mt-1">{w.time}</p>
          </div>
          <button onClick={() => clearWarning(w.id)} className="text-gray-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
