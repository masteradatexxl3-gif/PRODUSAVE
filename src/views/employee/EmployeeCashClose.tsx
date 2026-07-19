import { useState, useMemo } from 'react';
import { Calculator, FileText, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { InfoHint } from '../../components/ui/InfoHint';

export function EmployeeCashClose() {
  const { sales, currentUser, cashCloses, addCashClose } = useApp();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'x_read' | 'z_read'>('z_read');
  const [countedCash, setCountedCash] = useState(0);
  const [notes, setNotes] = useState('');

  const todaySales = useMemo(() => {
    const today = new Date().toDateString();
    return sales.filter((s) => new Date(s.createdAt).toDateString() === today);
  }, [sales]);

  const totals = useMemo(() => {
    let cash = 0, card = 0, transfer = 0, qr = 0, credit = 0;
    for (const s of todaySales) {
      if (s.paymentMethod === 'cash') cash += s.total;
      else if (s.paymentMethod === 'card') card += s.total;
      else if (s.paymentMethod === 'transfer') transfer += s.total;
      else if (s.paymentMethod === 'qr') qr += s.total;
      else if (s.paymentMethod === 'credit') credit += s.total;
      else if (s.paymentMethod === 'mixed' && s.mixedAmounts) {
        cash += s.mixedAmounts.cash;
        card += s.mixedAmounts.card;
        transfer += s.mixedAmounts.transfer;
        qr += s.mixedAmounts.qr;
        credit += s.mixedAmounts.credit;
      }
    }
    return { cash, card, transfer, qr, credit, total: cash + card + transfer + qr + credit };
  }, [todaySales]);

  const difference = countedCash - totals.cash;
  const hasDifference = Math.abs(difference) > 1;

  const handleClose = () => {
    addCashClose({
      tenantId: currentUser.tenantId,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      type,
      openingCash: 0,
      countedCash,
      expectedCash: totals.cash,
      cardTotal: totals.card,
      transferTotal: totals.transfer,
      qrTotal: totals.qr,
      difference,
      notes,
    });
    setOpen(false);
    setCountedCash(0);
    setNotes('');
  };

  return (
    <div className="view-enter space-y-4">
      <div>
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Calculator size={20} className="text-brand" /> Cierre de Caja
        </h3>
        <p className="text-xs text-gray-400">Arqueo de caja al finalizar el turno</p>
      </div>

      <InfoHint variant="tip">
        <strong>X-Read:</strong> arqueo parcial sin cerrar el turno. <strong>Z-Read:</strong> cierre definitivo del turno.
        Contá el efectivo de la caja y comparalo con lo que calcula el sistema automáticamente.
      </InfoHint>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard icon={DollarSign} label="Efectivo" value={totals.cash} color="#3BA55C" />
        <SummaryCard icon={DollarSign} label="Tarjeta" value={totals.card} color="#5865F2" />
        <SummaryCard icon={DollarSign} label="Transferencia" value={totals.transfer} color="#FAA61A" />
        <SummaryCard icon={DollarSign} label="QR" value={totals.qr} color="#ED4245" />
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Resumen del turno</p>
          <Badge color="blurple">{todaySales.length} ventas</Badge>
        </div>
        <div className="space-y-2 text-sm">
          <Row label="Total vendido" value={`$${totals.total.toLocaleString('es-AR')}`} />
          <Row label="Ventas al fiado" value={`$${totals.credit.toLocaleString('es-AR')}`} />
          <Row label="Efectivo esperado en caja" value={`$${totals.cash.toLocaleString('es-AR')}`} bold />
        </div>
      </div>

      <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl btn-brand font-semibold text-sm">
        <Calculator size={16} /> Hacer Arqueo de Caja
      </button>

      {/* History */}
      {cashCloses.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase text-gray-500 mb-2">Cierres anteriores</p>
          <div className="space-y-2">
            {cashCloses.map((c) => (
              <div key={c.id} className="p-3 rounded-xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.type === 'z_read' ? 'bg-red-500/15' : 'bg-amber-500/15'}`}>
                  <FileText size={16} className={c.type === 'z_read' ? 'text-red-400' : 'text-amber-500'} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {c.type === 'z_read' ? 'Z-Read (Cierre)' : 'X-Read (Parcial)'} — {c.employeeName}
                  </p>
                  <p className="text-xs text-gray-400">
                    Contado: ${c.countedCash} · Esperado: ${c.expectedCash} ·
                    <span className={c.difference > 1 ? 'text-red-400' : c.difference < -1 ? 'text-amber-500' : 'text-emerald-400'}>
                      {' '}Diferencia: {c.difference > 0 ? '+' : ''}${c.difference}
                    </span>
                  </p>
                </div>
                <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString('es-AR')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Arqueo de Caja" maxWidth="max-w-lg">
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setType('x_read')} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${type === 'x_read' ? 'bg-amber-500/15 text-amber-500 border-amber-500/40' : 'border-black/10 dark:border-white/10 text-gray-400'}`}>
              X-Read (Parcial)
            </button>
            <button onClick={() => setType('z_read')} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${type === 'z_read' ? 'bg-red-500/15 text-red-400 border-red-500/40' : 'border-black/10 dark:border-white/10 text-gray-400'}`}>
              Z-Read (Cierre)
            </button>
          </div>

          <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 space-y-2 text-sm">
            <Row label="Efectivo esperado" value={`$${totals.cash.toLocaleString('es-AR')}`} />
            <Row label="Tarjeta" value={`$${totals.card.toLocaleString('es-AR')}`} />
            <Row label="Transferencia" value={`$${totals.transfer.toLocaleString('es-AR')}`} />
            <Row label="QR" value={`$${totals.qr.toLocaleString('es-AR')}`} />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Efectivo contado en caja</label>
            <input type="number" value={countedCash} onChange={(e) => setCountedCash(Number(e.target.value))} className="input" placeholder="0" />
          </div>

          {countedCash > 0 && (
            <div className={`p-3 rounded-xl border ${hasDifference ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'} flex items-center gap-2`}>
              {hasDifference ? <AlertTriangle size={16} className="text-red-400" /> : <CheckCircle size={16} className="text-emerald-400" />}
              <span className={`text-sm font-semibold ${hasDifference ? 'text-red-400' : 'text-emerald-400'}`}>
                {hasDifference ? `Diferencia de ${difference > 0 ? '+' : ''}$${difference}` : 'Cuadra perfectamente'}
              </span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Notas (opcional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input min-h-[60px] resize-none" placeholder="Observaciones del cierre..." />
          </div>

          <button onClick={handleClose} className="w-full py-2.5 rounded-xl btn-brand font-semibold">
            Confirmar {type === 'z_read' ? 'cierre de turno' : 'arqueo parcial'}
          </button>
        </div>
      </Modal>

      <style>{`.input{width:100%;padding:.625rem .75rem;border-radius:.75rem;background:rgba(0,0,0,.05);border:1px solid rgba(0,0,0,.1);color:inherit;outline:none}.dark .input{background:rgba(0,0,0,.3);border-color:rgba(255,255,255,.1);color:#fff}`}</style>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: typeof DollarSign; label: string; value: number; color: string }) {
  return (
    <div className="p-3 rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} style={{ color }} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-lg font-bold text-gray-900 dark:text-white">${value.toLocaleString('es-AR')}</p>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={bold ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}>{value}</span>
    </div>
  );
}
