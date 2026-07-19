import { useMemo } from 'react';
import { History, ArrowRight, PackagePlus, ShoppingCart, Edit3 } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { InfoHint } from '../../components/ui/InfoHint';
import type { StockMovement } from '../../types';

const typeConfig: Record<StockMovement['type'], { icon: typeof ArrowRight; label: string; color: string; bg: string }> = {
  bodega_to_caja: { icon: ArrowRight, label: 'Bodega → Caja', color: '#5865F2', bg: 'bg-[#5865F2]/15' },
  reception: { icon: PackagePlus, label: 'Recepción', color: '#3BA55C', bg: 'bg-emerald-500/15' },
  sale: { icon: ShoppingCart, label: 'Venta', color: '#FAA61A', bg: 'bg-amber-500/15' },
  adjustment: { icon: Edit3, label: 'Ajuste', color: '#ED4245', bg: 'bg-red-500/15' },
};

export function BossStockHistory() {
  const { stockMovements } = useApp();

  const sorted = useMemo(() =>
    [...stockMovements].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [stockMovements]);

  return (
    <div className="view-enter space-y-4">
      <div>
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <History size={20} className="text-brand" /> Historial de Movimientos de Stock
        </h3>
        <p className="text-xs text-gray-400">Quién, cuándo y cuántas unidades se movieron</p>
      </div>

      <InfoHint variant="info">
        Cada vez que se publica stock de Bodega a Caja, se recibe mercadería nueva o se vende un producto,
        el movimiento queda registrado acá con fecha, hora y usuario responsable.
      </InfoHint>

      <div className="rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black/5 dark:bg-black/30 text-left text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Producto</th>
                <th className="px-4 py-3 font-semibold">Cantidad</th>
                <th className="px-4 py-3 font-semibold">Usuario</th>
                <th className="px-4 py-3 font-semibold">Fecha y hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {sorted.map((m) => {
                const cfg = typeConfig[m.type];
                const Icon = cfg.icon;
                return (
                  <tr key={m.id} className="hover:bg-black/[0.02] dark:hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cfg.bg}`}>
                          <Icon size={14} style={{ color: cfg.color }} />
                        </div>
                        <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{m.productName || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900 dark:text-white">{m.quantity}</span>
                      <span className="text-xs text-gray-400 ml-1">u</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{m.userName}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(m.createdAt).toLocaleString('es-AR')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {sorted.length === 0 && (
        <div className="p-8 text-center text-gray-400 text-sm">
          No hay movimientos registrados. Los movimientos aparecen automáticamente al publicar stock, recibir mercadería o vender.
        </div>
      )}
    </div>
  );
}
