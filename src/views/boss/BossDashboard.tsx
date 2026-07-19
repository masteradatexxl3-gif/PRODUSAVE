import { TrendingUp, DollarSign, AlertTriangle, ShoppingBag, BarChart3, Warehouse } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { Badge } from '../../components/ui/Badge';
import { InfoHint } from '../../components/ui/InfoHint';

export function BossDashboard() {
  const { sales, products, currentTenant, shifts, profiles } = useApp();

  const todayTotal = sales.reduce((a, s) => a + s.total, 0);
  const lowStock = products.filter((p) => p.stock < p.minStock);
  const lowWarehouse = products.filter((p) => p.warehouseStock < 5);

  // Compute weekly sales from real data
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const now = new Date();
  const weeklyBuckets = Array.from({ length: 7 }, () => 0);
  sales.forEach((s) => {
    const d = new Date(s.createdAt);
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff < 7) {
      const dayIdx = (d.getDay() - diff + 7) % 7;
      weeklyBuckets[dayIdx] += s.total;
    }
  });
  const WEEKLY_SALES = days.map((day, i) => ({ day, total: weeklyBuckets[i] }));
  const maxSale = Math.max(1, ...WEEKLY_SALES.map((w) => w.total));

  // Compute employee productivity from real sales
  const employees = profiles.filter((p) => p.role === 'employee');
  const EMPLOYEE_PRODUCTIVITY = employees.map((e) => {
    const empSales = sales.filter((s) => s.employeeId === e.id);
    return { name: e.name, color: e.avatarColor, sales: empSales.length, total: empSales.reduce((a, s) => a + s.total, 0) };
  });

  return (
    <div className="view-enter space-y-5" data-tour="boss-dashboard">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard icon={DollarSign} label="Ventas del día" value={`$${todayTotal.toLocaleString()}`} color="#3ba55c" />
        <KpiCard icon={ShoppingBag} label="Caja actual" value={`$${shifts.reduce((a, s) => a + s.currentCash, 0).toLocaleString()}`} color="#5865F2" />
        <KpiCard icon={AlertTriangle} label="Stock bajo" value={lowStock.length} color="#FAA61A" />
        <KpiCard icon={TrendingUp} label="Transacciones" value={sales.length} color="#ED4245" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Weekly chart */}
        <div className="lg:col-span-2 p-4 sm:p-5 rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
              <BarChart3 size={18} className="text-brand" /> Ventas semanales
            </h3>
            <Badge color="green">Últimos 7 días</Badge>
          </div>
          {WEEKLY_SALES.every((w) => w.total === 0) ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              No hay ventas registradas en la última semana.
            </div>
          ) : (
            <div className="flex items-end justify-between gap-1 sm:gap-2 h-48 pt-4">
              {WEEKLY_SALES.map((w) => (
                <div key={w.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end justify-center h-full">
                    <div
                      className="w-full max-w-[2.5rem] rounded-t-lg transition-all hover:opacity-80"
                      style={{
                        height: `${(w.total / maxSale) * 100}%`,
                        background: `linear-gradient(180deg, var(--brand-primary), var(--brand-accent))`,
                      }}
                      title={`$${w.total.toLocaleString()}`}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{w.day}</span>
                  <span className="text-[10px] text-gray-400">${(w.total / 1000).toFixed(0)}k</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Employee productivity */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm sm:text-base">Productividad por caja</h3>
          {EMPLOYEE_PRODUCTIVITY.length === 0 ? (
            <p className="text-sm text-gray-400">No hay empleados registrados.</p>
          ) : EMPLOYEE_PRODUCTIVITY.every((e) => e.sales === 0) ? (
            <p className="text-sm text-gray-400">Sin ventas registradas todavía.</p>
          ) : (
            <div className="space-y-4">
              {EMPLOYEE_PRODUCTIVITY.map((e) => {
                const maxEmp = Math.max(1, ...EMPLOYEE_PRODUCTIVITY.map((x) => x.total));
                return (
                  <div key={e.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: e.color }}>
                          {e.name.charAt(0)}
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{e.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-500 shrink-0">{e.sales} ventas</span>
                    </div>
                    <div className="h-2 rounded-full bg-black/5 dark:bg-black/30 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(e.total / maxEmp) * 100}%`, backgroundColor: e.color }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">${e.total.toLocaleString()}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Low stock alerts */}
      {lowWarehouse.length > 0 && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Warehouse size={18} className="text-red-400" />
            <h3 className="font-bold text-red-400 text-sm sm:text-base">Alerta: Stock bajo en Bodega</h3>
            <span className="text-xs text-red-400/70">({lowWarehouse.length} productos necesitan reposición del proveedor)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowWarehouse.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.brand}</p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-sm font-bold text-red-400">{p.warehouseStock}u</p>
                  <p className="text-[10px] text-red-400/70">en bodega</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <InfoHint variant="tip">
        Los productos con menos de 5 unidades en Bodega se pintan de rojo para alertarte que tenés que comprarle al proveedor.
        Usá la sección "Recepción de Mercadería" para cargar nuevo stock de bodega.
      </InfoHint>

      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4 text-sm sm:text-base">
          <AlertTriangle size={18} className="text-amber-500" /> Alertas de stock bajo
        </h3>
        {lowStock.length === 0 ? (
          <p className="text-sm text-gray-400">Todo el stock está en niveles correctos.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.category}</p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-sm font-bold text-amber-500">{p.stock}u</p>
                  <p className="text-[10px] text-gray-400">mín {p.minStock}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {currentTenant && (
        <div className="p-4 rounded-2xl bg-[#5865F2]/10 border border-[#5865F2]/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: currentTenant.branding.primary }}>
            {currentTenant.branding.logoEmoji}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">Negocio activo: {currentTenant.name}</p>
            <p className="text-xs text-gray-400">Plan {currentTenant.plan.toUpperCase()}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color }: { icon: typeof DollarSign; label: string; value: string | number; color: string }) {
  return (
    <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}22` }}>
          <Icon size={18} className="sm:hidden" style={{ color }} />
          <Icon size={20} className="hidden sm:block" style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{value}</p>
          <p className="text-xs text-gray-500 truncate">{label}</p>
        </div>
      </div>
    </div>
  );
}
