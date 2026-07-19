import { useState } from 'react';
import { Truck, Plus, Package, Clock, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { InfoHint } from '../../components/ui/InfoHint';

export function BossReception() {
  const { receptions, addReception, currentTenant } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ supplier: '', remito: '', itemName: '', qty: 1, cost: 0 });
  const [items, setItems] = useState<{ name: string; qty: number; cost: number }[]>([]);

  const addItem = () => {
    if (!form.itemName) return;
    setItems([...items, { name: form.itemName, qty: form.qty, cost: form.cost }]);
    setForm({ ...form, itemName: '', qty: 1, cost: 0 });
  };

  const handleSave = () => {
    if (!currentTenant || items.length === 0) return;
    addReception({
      tenantId: currentTenant.id,
      supplier: form.supplier,
      remito: form.remito,
      items,
      total: items.reduce((a, i) => a + i.qty * i.cost, 0),
      status: 'received',
    });
    setItems([]);
    setForm({ supplier: '', remito: '', itemName: '', qty: 1, cost: 0 });
    setOpen(false);
  };

  return (
    <div className="view-enter space-y-4">
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
        <Truck size={20} className="text-amber-500" />
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Vista exclusiva del Jefe</p>
          <p className="text-xs text-gray-400">Registro de remitos y paquetes de proveedores. Oculta para empleados.</p>
        </div>
      </div>

      <InfoHint variant="info">
        La mercadería que registrás acá se carga directamente al stock de <strong>Bodega</strong>.
        Después usá "Publicar en Caja" desde Gestión de Artículos para mover unidades al POS donde el empleado las vende.
      </InfoHint>

      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-900 dark:text-white">Remitos registrados</h3>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl btn-brand font-semibold text-sm">
          <Plus size={16} /> Nuevo Remito
        </button>
      </div>

      <div className="space-y-3">
        {receptions.map((r) => (
          <div key={r.id} className="p-4 rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#5865F2]/15 flex items-center justify-center">
                  <Package size={18} className="text-brand" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{r.supplier}</p>
                  <p className="text-xs text-gray-400">Remito {r.remito} · {new Date(r.receivedAt).toLocaleDateString('es-AR')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-900 dark:text-white">${r.total.toLocaleString()}</span>
                <Badge color={r.status === 'received' ? 'green' : 'yellow'}>
                  {r.status === 'received' ? <><CheckCircle2 size={12} /> Recibido</> : <><Clock size={12} /> Pendiente</>}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {r.items.map((it, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 text-xs text-gray-600 dark:text-gray-300">
                  {it.qty}× {it.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Registrar recepción de mercadería" maxWidth="max-w-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Proveedor"><input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className="input" placeholder="Distribuidora Norte" /></Field>
            <Field label="N° Remito"><input value={form.remito} onChange={(e) => setForm({ ...form, remito: e.target.value })} className="input" placeholder="R-2026-0001" /></Field>
          </div>
          <div className="border-t border-black/10 dark:border-white/10 pt-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">Artículos del remito</p>
            <div className="flex gap-2 mb-3">
              <input value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} placeholder="Nombre del artículo" className="input flex-1" />
              <input type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })} className="input w-20" placeholder="Cant." />
              <input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} className="input w-24" placeholder="Costo" />
              <button onClick={addItem} className="px-3 rounded-xl btn-brand text-sm font-semibold">+</button>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {items.map((it, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-black/5 dark:bg-white/5 text-sm">
                  <span className="text-gray-700 dark:text-gray-200">{it.qty}× {it.name}</span>
                  <span className="text-gray-400">${(it.qty * it.cost).toLocaleString()}</span>
                </div>
              ))}
              {items.length === 0 && <p className="text-xs text-gray-400 text-center py-3">Agregá artículos al remito</p>}
            </div>
            <div className="mt-3 flex justify-between text-sm font-semibold">
              <span className="text-gray-500">Total</span>
              <span className="text-gray-900 dark:text-white">${items.reduce((a, i) => a + i.qty * i.cost, 0).toLocaleString()}</span>
            </div>
          </div>
          <button onClick={handleSave} className="w-full py-2.5 rounded-xl btn-brand font-semibold">Registrar recepción</button>
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
