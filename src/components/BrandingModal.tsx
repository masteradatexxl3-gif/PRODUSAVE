import { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Modal } from './ui/Modal';

const PRESETS = [
  { primary: '#D97706', accent: '#F59E0B', emoji: '🛒', label: 'Almacén' },
  { primary: '#059669', accent: '#10B981', emoji: '🧀', label: 'Fiambrería' },
  { primary: '#DC2626', accent: '#EF4444', emoji: '🥕', label: 'Verdulería' },
  { primary: '#2563EB', accent: '#3B82F6', emoji: '🏪', label: 'Despensa' },
  { primary: '#7C3AED', accent: '#8B5CF6', emoji: '🍷', label: 'Vinoteca' },
  { primary: '#DB2777', accent: '#EC4899', emoji: '🧁', label: 'Panadería' },
];

export function BrandingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currentTenant, updateTenantBranding } = useApp();
  const [primary, setPrimary] = useState(currentTenant?.branding.primary ?? '#5865F2');
  const [accent, setAccent] = useState(currentTenant?.branding.accent ?? '#5865F2');
  const [emoji, setEmoji] = useState(currentTenant?.branding.logoEmoji ?? '🛒');
  const [logoText, setLogoText] = useState(currentTenant?.branding.logoText ?? '');

  if (!currentTenant) return null;

  const apply = () => {
    updateTenantBranding(currentTenant.id, { primary, accent, logoEmoji: emoji, logoText });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Personalización de Marca (White-Label)">
      <div className="space-y-5">
        <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: primary }}>
            {emoji}
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white" style={{ color: primary }}>{logoText || 'Tu Negocio'}</p>
            <p className="text-xs text-gray-400">Vista previa del logo</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">Plantillas rápidas</p>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => { setPrimary(p.primary); setAccent(p.accent); setEmoji(p.emoji); }}
                className="p-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition flex flex-col items-center gap-1.5"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ backgroundColor: p.primary }}>{p.emoji}</div>
                <span className="text-[10px] text-gray-500">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Color primario</label>
            <div className="flex items-center gap-2">
              <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer" />
              <input value={primary} onChange={(e) => setPrimary(e.target.value)} className="input flex-1" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Color de acento</label>
            <div className="flex items-center gap-2">
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer" />
              <input value={accent} onChange={(e) => setAccent(e.target.value)} className="input flex-1" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Emoji del logo</label>
            <input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="input" maxLength={2} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Texto del logo</label>
            <input value={logoText} onChange={(e) => setLogoText(e.target.value)} className="input" placeholder="Don Carlos" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/20 text-xs text-gray-500 flex items-center gap-2">
          <Palette size={14} className="text-brand" /> Los cambios se aplican en tiempo real al POS del empleado.
        </div>

        <button onClick={apply} className="w-full py-2.5 rounded-xl btn-brand font-semibold flex items-center justify-center gap-2">
          <Check size={16} /> Aplicar personalización
        </button>
      </div>

      <style>{`.input{width:100%;padding:.5rem .75rem;border-radius:.75rem;background:rgba(0,0,0,.05);border:1px solid rgba(0,0,0,.1);color:inherit;outline:none}.dark .input{background:rgba(0,0,0,.3);border-color:rgba(255,255,255,.1);color:#fff}`}</style>
    </Modal>
  );
}
