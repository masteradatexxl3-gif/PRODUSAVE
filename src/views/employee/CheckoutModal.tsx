import { useState } from 'react';
import { Banknote, Smartphone, QrCode, CreditCard, BookOpen, Layers, Check, X } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { useApp } from '../../store/AppContext';
import type { PaymentMethod } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  total: number;
}

const METHODS: { id: PaymentMethod; label: string; icon: typeof Banknote; color: string }[] = [
  { id: 'cash', label: 'Efectivo', icon: Banknote, color: '#3ba55c' },
  { id: 'transfer', label: 'Transferencia CBU', icon: Smartphone, color: '#5865F2' },
  { id: 'qr', label: 'Código QR', icon: QrCode, color: '#9333ea' },
  { id: 'card', label: 'Tarjeta Crédito/Débito', icon: CreditCard, color: '#F59E0B' },
  { id: 'credit', label: 'Cuenta (Fiado)', icon: BookOpen, color: '#ED4245' },
  { id: 'mixed', label: 'Pago Mixto', icon: Layers, color: '#06b6d4' },
];

export function CheckoutModal({ open, onClose, total }: Props) {
  const { checkout, pushWarning, currentUser } = useApp();
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [cashReceived, setCashReceived] = useState(0);
  const [mixed, setMixed] = useState({ cash: 0, transfer: 0, qr: 0, card: 0, credit: 0 });
  const [creditName, setCreditName] = useState('');
  const [done, setDone] = useState(false);

  const mixedTotal = mixed.cash + mixed.transfer + mixed.qr + mixed.card + mixed.credit;
  const change = method === 'cash' ? Math.max(0, cashReceived - total) : 0;

  const reset = () => {
    setMethod(null);
    setCashReceived(0);
    setMixed({ cash: 0, transfer: 0, qr: 0, card: 0, credit: 0 });
    setCreditName('');
    setDone(false);
  };

  const handleConfirm = () => {
    if (!method) return;
    if (method === 'credit') {
      pushWarning(`${currentUser.name} registró venta de $${total} como FIADO a "${creditName || 'cliente'}".`);
    }
    checkout(method, total);
    setDone(true);
    setTimeout(() => { reset(); onClose(); }, 1800);
  };

  const canConfirm = () => {
    if (!method) return false;
    if (method === 'mixed') return mixedTotal === total;
    if (method === 'credit') return creditName.length > 0;
    return true;
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Cierre de Caja - Cobro" maxWidth="max-w-xl">
      {done ? (
        <div className="py-10 flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Check size={32} className="text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">¡Venta registrada!</p>
          <p className="text-sm text-gray-400">Total: ${total.toLocaleString()}</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-between">
            <span className="text-sm text-gray-500">Total a cobrar</span>
            <span className="text-3xl font-bold text-brand">${total.toLocaleString()}</span>
          </div>

          {!method && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {METHODS.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className="p-4 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition flex flex-col items-center gap-2"
                  >
                    <Icon size={24} style={{ color: m.color }} />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 text-center">{m.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {method && method !== 'mixed' && method !== 'credit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Método: {METHODS.find((m) => m.id === method)?.label}
                </span>
                <button onClick={() => setMethod(null)} className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1"><X size={12} /> Cambiar</button>
              </div>
              {method === 'cash' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Efectivo recibido</label>
                    <input type="number" value={cashReceived} onChange={(e) => setCashReceived(Number(e.target.value))} className="input mt-1" placeholder={String(total)} />
                  </div>
                  {cashReceived >= total && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex justify-between">
                      <span className="text-sm text-emerald-400 font-semibold">Vuelto</span>
                      <span className="text-lg font-bold text-emerald-400">${change.toLocaleString()}</span>
                    </div>
                  )}
                </>
              )}
              {method === 'qr' && (
                <div className="flex flex-col items-center py-4">
                  <div className="w-32 h-32 rounded-xl bg-white border-4 border-gray-900 flex items-center justify-center">
                    <QrCode size={80} className="text-gray-900" />
                  </div>
                  <p className="text-xs text-gray-400 mt-3">Escaneá el QR para pagar ${total.toLocaleString()}</p>
                </div>
              )}
              {(method === 'transfer' || method === 'card') && (
                <div className="p-4 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/20 text-sm text-gray-500">
                  {method === 'transfer' ? 'CBU: 0000003100000000000001 · Alias: DONCARLOS.PRODUSAVE' : 'Aproximá la tarjeta al lector o ingresá los datos.'}
                </div>
              )}
            </div>
          )}

          {method === 'credit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Método: Cuenta (Fiado)</span>
                <button onClick={() => setMethod(null)} className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1"><X size={12} /> Cambiar</button>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Nombre del cliente (fiado)</label>
                <input value={creditName} onChange={(e) => setCreditName(e.target.value)} className="input mt-1" placeholder="Pedro Ramírez" />
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 flex items-center gap-2">
                <BookOpen size={14} /> Se registrará la deuda y se notificará al Jefe.
              </div>
            </div>
          )}

          {method === 'mixed' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Método: Pago Mixto</span>
                <button onClick={() => setMethod(null)} className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1"><X size={12} /> Cambiar</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MixedField label="Efectivo" value={mixed.cash} onChange={(v) => setMixed({ ...mixed, cash: v })} />
                <MixedField label="Transferencia" value={mixed.transfer} onChange={(v) => setMixed({ ...mixed, transfer: v })} />
                <MixedField label="QR" value={mixed.qr} onChange={(v) => setMixed({ ...mixed, qr: v })} />
                <MixedField label="Tarjeta" value={mixed.card} onChange={(v) => setMixed({ ...mixed, card: v })} />
                <MixedField label="Fiado" value={mixed.credit} onChange={(v) => setMixed({ ...mixed, credit: v })} />
              </div>
              <div className={`p-3 rounded-xl flex justify-between items-center ${mixedTotal === total ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                <span className="text-sm text-gray-500">Suma: ${mixedTotal.toLocaleString()}</span>
                <span className={`text-sm font-bold ${mixedTotal === total ? 'text-emerald-400' : 'text-red-400'}`}>
                  {mixedTotal === total ? '✓ Coincide' : `Faltan $${(total - mixedTotal).toLocaleString()}`}
                </span>
              </div>
            </div>
          )}

          {method && (
            <button
              onClick={handleConfirm}
              disabled={!canConfirm()}
              className="w-full py-3 rounded-xl btn-brand font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confirmar cobro de ${total.toLocaleString()}
            </button>
          )}
        </div>
      )}
      <style>{`.input{width:100%;padding:.625rem .75rem;border-radius:.75rem;background:rgba(0,0,0,.05);border:1px solid rgba(0,0,0,.1);color:inherit;outline:none}.dark .input{background:rgba(0,0,0,.3);border-color:rgba(255,255,255,.1);color:#fff}`}</style>
    </Modal>
  );
}

function MixedField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="input mt-1" placeholder="0" />
    </div>
  );
}
