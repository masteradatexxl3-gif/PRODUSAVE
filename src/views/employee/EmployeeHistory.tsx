import { Receipt, Banknote, Smartphone, QrCode, CreditCard, BookOpen, Layers, Clock } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { Badge } from '../../components/ui/Badge';
import type { PaymentMethod } from '../../types';

const methodIcon: Record<PaymentMethod, typeof Banknote> = {
  cash: Banknote,
  transfer: Smartphone,
  qr: QrCode,
  card: CreditCard,
  credit: BookOpen,
  mixed: Layers,
};
const methodLabel: Record<PaymentMethod, string> = {
  cash: 'Efectivo', transfer: 'Transferencia', qr: 'QR', card: 'Tarjeta', credit: 'Fiado', mixed: 'Mixto',
};

export function EmployeeHistory() {
  const { sales, currentUser, shifts } = useApp();
  const mySales = sales.filter((s) => s.employeeId === currentUser.id);
  const myShift = shifts.find((s) => s.employeeId === currentUser.id);

  const total = mySales.reduce((a, s) => a + s.total, 0);

  return (
    <div className="view-enter space-y-4">
      {/* Shift summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5">
          <p className="text-xs text-gray-500">Turno actual</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{myShift ? 'Abierto' : 'Cerrado'}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5">
          <p className="text-xs text-gray-500">Caja inicial</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">${(myShift?.openingCash ?? 0).toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5">
          <p className="text-xs text-gray-500">Caja actual</p>
          <p className="text-lg font-bold text-brand">${(myShift?.currentCash ?? 0).toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5">
          <p className="text-xs text-gray-500">Mis ventas</p>
          <p className="text-lg font-bold text-emerald-400">${total.toLocaleString()}</p>
        </div>
      </div>

      {/* Sales list */}
      <div className="rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5 overflow-hidden">
        <div className="p-4 border-b border-black/10 dark:border-white/5">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Receipt size={18} className="text-brand" /> Historial de ventas del turno
          </h3>
        </div>
        <div className="divide-y divide-black/5 dark:divide-white/5">
          {mySales.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-400">Aún no registraste ventas en este turno.</div>
          )}
          {mySales.map((s) => {
            const Icon = methodIcon[s.paymentMethod];
            return (
              <div key={s.id} className="p-4 flex items-center gap-4 hover:bg-black/[0.02] dark:hover:bg-white/5">
                <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center">
                  <Icon size={18} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {s.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}
                  </p>
                  <p className="text-xs text-gray-400 flex items-center gap-1.5">
                    <Clock size={11} /> {new Date(s.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <Badge color="gray">{methodLabel[s.paymentMethod]}</Badge>
                <span className="text-lg font-bold text-gray-900 dark:text-white">${s.total.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
