import { useState } from 'react';
import { Users, Plus, AlertCircle, Clock } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { Modal } from '../../components/ui/Modal';

export function BossEmployees() {
  const { profiles, createEmployee, currentTenant, planLimit } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const employees = profiles.filter((p) => p.role === 'employee');
  const atLimit = employees.length >= planLimit;

  const handleCreate = async () => {
    setError(null);
    setLoading(true);
    const { error } = await createEmployee(form.name, form.email, form.password);
    if (error) setError(error);
    else { setForm({ name: '', email: '', password: '' }); setOpen(false); }
    setLoading(false);
  };

  return (
    <div className="view-enter space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users size={20} className="text-brand" /> Gestión de Empleados
          </h3>
          <p className="text-xs text-gray-400">
            {employees.length} de {planLimit} empleados (Plan: {currentTenant?.plan === 'version_de_prueba' ? 'Versión de Prueba' : currentTenant?.plan === 'pro' ? 'Pro' : 'Enterprise'})
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          disabled={atLimit}
          className="flex items-center gap-2 px-4 py-2 rounded-xl btn-brand font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={16} /> Nuevo Empleado
        </button>
      </div>

      {atLimit && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-sm text-amber-500">
          <AlertCircle size={16} /> Alcanzaste el límite de empleados de tu plan. Actualizá a un plan superior para crear más.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((emp) => (
          <div key={emp.id} className="p-4 rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: emp.avatarColor }}>
                {emp.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{emp.name}</p>
                <p className="text-xs text-gray-400">{emp.email}</p>
              </div>
              <span className={`w-2.5 h-2.5 rounded-full ${emp.online ? 'bg-emerald-400' : 'bg-gray-500'}`} />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clock size={12} />
              <span>Última conexión: {emp.lastSeen}</span>
            </div>
          </div>
        ))}
        {employees.length === 0 && (
          <div className="col-span-full p-8 text-center text-gray-400 text-sm">
            No hay empleados creados. Creá tu primer empleado para que pueda usar el POS.
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Crear nuevo empleado">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Nombre</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="Ana Sánchez" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" placeholder="ana@doncarlos.com" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Contraseña</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" placeholder="Mínimo 6 caracteres" />
          </div>
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          <button onClick={handleCreate} disabled={loading || !form.name || !form.email || form.password.length < 6} className="w-full py-2.5 rounded-xl btn-brand font-semibold disabled:opacity-40">
            {loading ? 'Creando...' : 'Crear empleado'}
          </button>
        </div>
        <style>{`.input{width:100%;padding:.625rem .75rem;border-radius:.75rem;background:rgba(0,0,0,.05);border:1px solid rgba(0,0,0,.1);color:inherit;outline:none}.dark .input{background:rgba(0,0,0,.3);border-color:rgba(255,255,255,.1);color:#fff}`}</style>
      </Modal>
    </div>
  );
}
