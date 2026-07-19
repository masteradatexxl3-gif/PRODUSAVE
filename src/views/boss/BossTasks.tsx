import { useState } from 'react';
import { ListChecks, Plus, Check, Clock, Package } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';

export function BossTasks() {
  const { tasks, products, profiles, addTask } = useApp();
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState(1);
  const [assignedTo, setAssignedTo] = useState<string | null>(null);

  const employees = profiles.filter((p) => p.role === 'employee');
  const pending = tasks.filter((t) => t.status === 'pending');
  const completed = tasks.filter((t) => t.status === 'completed');

  const handleCreate = () => {
    if (!productId) return;
    addTask(productId, qty, assignedTo);
    setProductId(''); setQty(1); setAssignedTo(null);
    setOpen(false);
  };

  return (
    <div className="view-enter space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ListChecks size={20} className="text-brand" /> Tareas de Reposición
          </h3>
          <p className="text-xs text-gray-400">Enviá órdenes de reposición desde la bodega a la caja</p>
        </div>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl btn-brand font-semibold text-sm">
          <Plus size={16} /> Nueva Tarea
        </button>
      </div>

      {pending.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase text-gray-500 mb-2">Pendientes ({pending.length})</p>
          <div className="space-y-2">
            {pending.map((t) => (
              <div key={t.id} className="p-4 rounded-2xl bg-white dark:bg-discord-mid border border-amber-500/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                  <Clock size={18} className="text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Reponer {t.quantity}× {t.productName}</p>
                  <p className="text-xs text-gray-400">
                    Asignado a: {t.assignedToName ?? 'Todos'} · {new Date(t.createdAt).toLocaleString('es-AR')}
                  </p>
                </div>
                <Badge color="yellow">Pendiente</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase text-gray-500 mb-2">Completadas ({completed.length})</p>
          <div className="space-y-2">
            {completed.map((t) => (
              <div key={t.id} className="p-4 rounded-2xl bg-white dark:bg-discord-mid border border-emerald-500/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <Check size={18} className="text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Reponer {t.quantity}× {t.productName}</p>
                  <p className="text-xs text-gray-400">
                    Completada: {t.completedAt ? new Date(t.completedAt).toLocaleString('es-AR') : '—'}
                  </p>
                </div>
                <Badge color="green">Completada</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <div className="p-8 text-center text-gray-400 text-sm">
          No hay tareas creadas. Creá una tarea para indicar a tus empleados qué reponer desde la bodega.
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva tarea de reposición">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Producto</label>
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className="input">
              <option value="">Seleccionar producto...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} (Bodega: {p.warehouseStock}u)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Cantidad a reponer</label>
            <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} min={1} className="input" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Asignar a (opcional)</label>
            <select value={assignedTo ?? ''} onChange={(e) => setAssignedTo(e.target.value || null)} className="input">
              <option value="">Todos los empleados</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
          <button onClick={handleCreate} className="w-full py-2.5 rounded-xl btn-brand font-semibold flex items-center justify-center gap-2">
            <Package size={16} /> Enviar tarea
          </button>
        </div>
        <style>{`.input{width:100%;padding:.625rem .75rem;border-radius:.75rem;background:rgba(0,0,0,.05);border:1px solid rgba(0,0,0,.1);color:inherit;outline:none}.dark .input{background:rgba(0,0,0,.3);border-color:rgba(255,255,255,.1);color:#fff}`}</style>
      </Modal>
    </div>
  );
}
