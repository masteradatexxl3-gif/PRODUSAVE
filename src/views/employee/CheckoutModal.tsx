import { useState } from 'react';
import { Banknote, Smartphone, QrCode, CreditCard, BookOpen, Layers, Check, X, Printer, Receipt } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { useApp } from '../../store/AppContext';
import type { PaymentMethod, MixedPayment, CartItem, Tenant } from '../../types';

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

interface SaleResult {
  saleId: string | null;
  error: string | null;
  items?: CartItem[];
  total?: number;
  method?: PaymentMethod;
  mixedAmounts?: MixedPayment;
  tenant?: Tenant | null;
}

export function CheckoutModal({ open, onClose, total }: Props) {
  const { checkout, pushWarning, currentUser } = useApp();
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [cashReceived, setCashReceived] = useState(0);
  const [mixed, setMixed] = useState<MixedPayment>({ cash: 0, transfer: 0, qr: 0, card: 0, credit: 0 });
  const [creditName, setCreditName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saleResult, setSaleResult] = useState<SaleResult | null>(null);

  const mixedTotal = mixed.cash + mixed.transfer + mixed.qr + mixed.card + mixed.credit;
  const change = method === 'cash' ? Math.max(0, cashReceived - total) : 0;

  const reset = () => {
    setMethod(null);
    setCashReceived(0);
    setMixed({ cash: 0, transfer: 0, qr: 0, card: 0, credit: 0 });
    setCreditName('');
    setSaleResult(null);
    setError(null);
    setLoading(false);
  };

  const handleConfirm = async () => {
    if (!method) return;
    setLoading(true);
    setError(null);

    if (method === 'credit') {
      pushWarning(`${currentUser.name} registró venta de $${total} como FIADO a "${creditName || 'cliente'}".`);
    }

    const result = await checkout(method, total, method === 'mixed' ? mixed : undefined, method === 'credit' ? creditName : undefined);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setSaleResult(result);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const canConfirm = () => {
    if (!method) return false;
    if (method === 'mixed') return mixedTotal === total;
    if (method === 'credit') return creditName.length > 0;
    return true;
  };

  // Print-only ticket (hidden on screen, visible on print)
  const renderPrintTicket = () => {
    if (!saleResult || !saleResult.items) return null;
    const tenant = saleResult.tenant;
    const items = saleResult.items;
    const total = saleResult.total ?? 0;
    const methodLabel = METHODS.find((m) => m.id === saleResult.method)?.label ?? '';
    const now = new Date().toLocaleString('es-AR');

    return (
      <div id="print-ticket" className="hidden">
        <div className="ticket">
          <div className="ticket-header">
            <p className="ticket-business">{tenant?.branding?.logoText ?? tenant?.name ?? 'Produsave'}</p>
            <p className="ticket-sub">Comprobante de venta</p>
          </div>
          <div className="ticket-divider" />
          <div className="ticket-info">
            <p>Fecha: {now}</p>
            <p>Cajero: {currentUser.name}</p>
            <p>#{saleResult.saleId?.slice(-8).toUpperCase()}</p>
          </div>
          <div className="ticket-divider" />
          <table className="ticket-items">
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td className="qty">{item.qty}x</td>
                  <td className="name">{item.name}</td>
                  <td className="price">${(item.price * item.qty).toLocaleString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="ticket-divider" />
          <div className="ticket-total">
            <span>TOTAL</span>
            <span className="amount">${total.toLocaleString('es-AR')}</span>
          </div>
          <div className="ticket-payment">
            <p>Método de pago: {methodLabel}</p>
            {saleResult.method === 'mixed' && saleResult.mixedAmounts && (
              <>
                {saleResult.mixedAmounts.cash > 0 && <p>Efectivo: ${saleResult.mixedAmounts.cash.toLocaleString('es-AR')}</p>}
                {saleResult.mixedAmounts.transfer > 0 && <p>Transferencia: ${saleResult.mixedAmounts.transfer.toLocaleString('es-AR')}</p>}
                {saleResult.mixedAmounts.qr > 0 && <p>QR: ${saleResult.mixedAmounts.qr.toLocaleString('es-AR')}</p>}
                {saleResult.mixedAmounts.card > 0 && <p>Tarjeta: ${saleResult.mixedAmounts.card.toLocaleString('es-AR')}</p>}
                {saleResult.mixedAmounts.credit > 0 && <p>Fiado: ${saleResult.mixedAmounts.credit.toLocaleString('es-AR')}</p>}
              </>
            )}
          </div>
          <div className="ticket-divider" />
          <div className="ticket-footer">
            <p>¡Gracias por su compra!</p>
            <p className="ticket-small">Produsave - Sistema de gestión</p>
          </div>
        </div>
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            #print-ticket, #print-ticket * { visibility: visible !important; }
            #print-ticket { display: block !important; position: absolute; top: 0; left: 0; width: 80mm; }
            .ticket { width: 80mm; padding: 2mm; font-family: 'Courier New', monospace; font-size: 10px; color: #000; }
            .ticket-header { text-align: center; }
            .ticket-business { font-size: 14px; font-weight: bold; }
            .ticket-sub { font-size: 9px; }
            .ticket-divider { border-top: 1px dashed #000; margin: 2mm 0; }
            .ticket-info p { font-size: 9px; line-height: 1.4; }
            .ticket-items { width: 100%; }
            .ticket-items td { font-size: 9px; vertical-align: top; }
            .ticket-items .qty { width: 10mm; }
            .ticket-items .name { width: 50mm; }
            .ticket-items .price { width: 20mm; text-align: right; }
            .ticket-total { display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; margin: 1mm 0; }
            .ticket-total .amount { font-size: 14px; }
            .ticket-payment p { font-size: 9px; line-height: 1.4; }
            .ticket-footer { text-align: center; margin-top: 2mm; }
            .ticket-footer p { font-size: 10px; }
            .ticket-small { font-size: 8px; }
          }
        `}</style>
      </div>
    );
  };

  return (
    <>
      <Modal open={open} onClose={handleClose} title="Cierre de Caja - Cobro" maxWidth="max-w-xl">
        {saleResult ? (
          <div className="py-6 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Check size={32} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">¡Venta registrada!</p>
              <p className="text-sm text-gray-400">Total: ${(saleResult.total ?? 0).toLocaleString()}</p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold transition"
              >
                <Printer size={18} /> Imprimir Ticket
              </button>
              <button
                onClick={handleClose}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10 font-bold transition"
              >
                <Receipt size={18} /> Cerrar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-between">
              <span className="text-sm text-gray-500">Total a cobrar</span>
              <span className="text-3xl font-bold text-brand">${total.toLocaleString()}</span>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                <AlertCircleIcon /> {error}
              </div>
            )}

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
                <p className="text-xs text-gray-500">Dividí el pago entre varios métodos. La suma debe ser exacta al total.</p>
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
                disabled={!canConfirm() || loading}
                className="w-full py-3 rounded-xl btn-brand font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Procesando...</>
                ) : (
                  `Confirmar cobro de $${total.toLocaleString()}`
                )}
              </button>
            )}
          </div>
        )}
        <style>{`.input{width:100%;padding:.625rem .75rem;border-radius:.75rem;background:rgba(0,0,0,.05);border:1px solid rgba(0,0,0,.1);color:inherit;outline:none}.dark .input{background:rgba(0,0,0,.3);border-color:rgba(255,255,255,.1);color:#fff}`}</style>
      </Modal>

      {renderPrintTicket()}
    </>
  );
}

function AlertCircleIcon() {
  return <span className="text-red-400">!</span>;
}

function MixedField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="input mt-1" placeholder="0" />
    </div>
  );
}
