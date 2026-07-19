import { useState } from 'react';
import { Plus, Phone, MessageCircle, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';

export function BossCredits() {
  const { credits, addCredit, currentTenant } = useApp();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ name: '', phone: '', amount: 0, dueDate: '' });

  const totalDebt = credits.filter((c) => c.status !== 'paid').reduce((a, c) => a + c.amount, 0);
  const overdue = credits.filter((c) => c.status === 'overdue').length;

  const sendReminder = (id: string, name: string, amount: number, phone: string, dueDate: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const msg = `Hola ${name}, te contactamos de Almacén Don Carlos. Recordamos que tenés una deuda pendiente de ${amount.toLocaleString('es-AR')} con vencimiento el ${new Date(dueDate).toLocaleDateString('es-AR')}. Por favor, acercate a abonar lo antes posible. ¡Gracias!`;
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`, '_blank');
    setSent((prev) => new Set(prev).add(id));
    setTimeout(() => setSent((prev) => { const c = new Set(prev); c.delete(id); return c; }), 3000);
  };

  const handleSave = () => {
    if (!currentTenant || !form.name) return;
    const due = new Date(form.dueDate);
    const overdueStatus = due < new Date() ? 'overdue' : 'pending';
    addCredit({
      tenantId: currentTenant.id,
      customerName: form.name,
      phone: form.phone,
      amount: form.amount,
      dueDate: form.dueDate,
      status: overdueStatus,
    });
    setForm({ name: '', phone: '', amount: 0, dueDate: '' });
    setOpen(false);
  };

  return (
    <div className="view-enter space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 text-red-400"><AlertTriangle size={18} /><span className="text-sm font-semibold">Deuda total</span></div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">${totalDebt.toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-500"><Clock size={18} /><span className="text-sm font-semibold">Cuentas vencidas</span></div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{overdue}</p>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2 text-emerald-400"><CheckCircle size={18} /><span className="text-sm font-semibold">Cuentas activas</span></div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{credits.filter((c) => c.status === 'pending').length}</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-900 dark:text-white">Cuentas corrientes (Fiados)</h3>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl btn-brand font-semibold text-sm">
          <Plus size={16} /> Nuevo Fiado
        </button>
      </div>

      <div className="rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black/5 dark:bg-black/30 text-left text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 font-semibold">Celular</th>
                <th className="px-4 py-3 font-semibold">Monto adeudado</th>
                <th className="px-4 py-3 font-semibold">Vencimiento</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold text-right">Recordatorio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {credits.map((c) => (
                <tr key={c.id} className="hover:bg-black/[0.02] dark:hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.customerName}</td>
                  <td className="px-4 py-3 text-gray-500 flex items-center gap-1.5"><Phone size={13} />{c.phone}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">${c.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(c.dueDate).toLocaleDateString('es-AR')}</td>
                  <td className="px-4 py-3">
                    <Badge color={c.status === 'overdue' ? 'red' : c.status === 'pending' ? 'yellow' : 'green'}>
                      {c.status === 'overdue' ? 'Vencido' : c.status === 'pending' ? 'Pendiente' : 'Pagado'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {c.status === 'paid' ? (
                      <span className="text-xs text-gray-400">Sin deuda</span>
                    ) : sent.has(c.id) ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                        <CheckCircle size={14} /> Enviado
                      </span>
                    ) : (
                      <button
                        onClick={() => sendReminder(c.id, c.customerName, c.amount, c.phone, c.dueDate)}
                        disabled={c.status !== 'overdue'}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          c.status === 'overdue'
                            ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                            : 'bg-black/5 dark:bg-white/5 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <MessageCircle size={13} /> WhatsApp
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo fiado / cuenta corriente">
        <div className="space-y-4">
          <Field label="Nombre del cliente"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" /></Field>
          <Field label="Celular"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" placeholder="+54 11 ..." /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Monto adeudado"><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className="input" /></Field>
            <Field label="Fecha límite"><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="input" /></Field>
          </div>
          <button onClick={handleSave} className="w-full py-2.5 rounded-xl btn-brand font-semibold">Registrar fiado</button>
        </div>
      </Modal>

      <style>{`.input{width:100%;padding:.625rem .75rem;border-radius:.75rem;background:rgba(0,0,0,.05);border:1px solid rgba(0,0,0,.1);color:inherit;outline:none}.dark .input{background:rgba(0,0,0,.3);border-color:rgba(255,255,255,.1);color:#fff}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
