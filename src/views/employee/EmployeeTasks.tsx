import { ListChecks, Check, Package } from 'lucide-react';
import { useApp } from '../../store/AppContext';

export function EmployeeTasks() {
  const { tasks, completeTask, currentUser } = useApp();
  const myTasks = tasks.filter((t) => t.status === 'pending' && (t.assignedTo === null || t.assignedTo === currentUser.id));
  const done = tasks.filter((t) => t.status === 'completed');

  return (
    <div className="view-enter space-y-4">
      <div>
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ListChecks size={20} className="text-brand" /> Tareas Pendientes
        </h3>
        <p className="text-xs text-gray-400">Órdenes de reposición enviadas por tu jefe</p>
      </div>

      {myTasks.length === 0 ? (
        <div className="p-8 text-center text-gray-400 text-sm">
          No hay tareas pendientes. ¡Buen trabajo!
        </div>
      ) : (
        <div className="space-y-3">
          {myTasks.map((t) => (
            <div key={t.id} className="p-4 rounded-2xl bg-white dark:bg-discord-mid border border-amber-500/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <Package size={18} className="text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Reponer {t.quantity}× {t.productName}</p>
                <p className="text-xs text-gray-400">
                  {t.assignedToName ? `Asignado a: ${t.assignedToName}` : 'Para todos'} · {new Date(t.createdAt).toLocaleString('es-AR')}
                </p>
              </div>
              <button
                onClick={() => completeTask(t.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition text-sm font-semibold"
              >
                <Check size={16} /> Marcar como hecho
              </button>
            </div>
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase text-gray-500 mb-2">Completadas</p>
          <div className="space-y-2">
            {done.map((t) => (
              <div key={t.id} className="p-3 rounded-xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5 flex items-center gap-3 opacity-60">
                <Check size={16} className="text-emerald-400" />
                <span className="text-sm text-gray-500 line-through">{t.quantity}× {t.productName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
