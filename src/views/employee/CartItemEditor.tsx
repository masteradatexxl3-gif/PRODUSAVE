import { useState, useEffect } from 'react';
import { Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { useApp } from '../../store/AppContext';
import type { CartItem } from '../../types';

interface Props {
  index: number | null;
  item: CartItem | null;
  onClose: () => void;
  onUpdate: (updates: Partial<CartItem>) => void;
  onRemove: () => void;
}

export function CartItemEditor({ index, item, onClose, onUpdate, onRemove }: Props) {
  const { pushWarning, currentUser } = useApp();
  const [qty, setQty] = useState(1);
  const [priceOverride, setPriceOverride] = useState<number | ''>('');

  useEffect(() => {
    if (item) {
      setQty(item.qty);
      setPriceOverride(item.priceOverride ?? '');
    }
  }, [item, index]);

  if (index === null || !item) return null;

  const apply = () => {
    const updates: Partial<CartItem> = { qty };
    if (priceOverride !== '' && Number(priceOverride) !== item.price) {
      updates.priceOverride = Number(priceOverride);
      updates.warning = true;
      pushWarning(`${currentUser.name} modificó el precio de "${item.name}" de $${item.price} a $${priceOverride} en el ticket.`);
    } else {
      updates.priceOverride = undefined;
      updates.warning = false;
    }
    onUpdate(updates);
    onClose();
  };

  const remove = () => {
    onRemove();
    onClose();
  };

  return (
    <Modal open={index !== null} onClose={onClose} title="Editar artículo del ticket">
      <div className="space-y-4">
        <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5">
          <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
          <p className="text-xs text-gray-400">Precio base: ${item.price}</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500">Cantidad</label>
          <div className="flex items-center gap-2 mt-1">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/10 text-lg font-bold text-gray-600 dark:text-gray-200">−</button>
            <input type="number" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} className="input text-center" />
            <button onClick={() => setQty(qty + 1)} className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/10 text-lg font-bold text-gray-600 dark:text-gray-200">+</button>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
            <Pencil size={12} /> Modificar precio (en caliente)
          </label>
          <input
            type="number"
            value={priceOverride}
            onChange={(e) => setPriceOverride(e.target.value === '' ? '' : Number(e.target.value))}
            className="input mt-1"
            placeholder={String(item.price)}
          />
          {priceOverride !== '' && Number(priceOverride) !== item.price && (
            <p className="text-xs text-amber-500 flex items-center gap-1 mt-2">
              <AlertTriangle size={12} /> Se enviará aviso al Jefe por modificación de precio.
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={remove} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25 transition text-sm font-semibold">
            <Trash2 size={16} /> Eliminar
          </button>
          <button onClick={apply} className="flex-1 py-2.5 rounded-xl btn-brand font-semibold">
            Aplicar cambios
          </button>
        </div>
      </div>
      <style>{`.input{width:100%;padding:.625rem .75rem;border-radius:.75rem;background:rgba(0,0,0,.05);border:1px solid rgba(0,0,0,.1);color:inherit;outline:none}.dark .input{background:rgba(0,0,0,.3);border-color:rgba(255,255,255,.1);color:#fff}`}</style>
    </Modal>
  );
}
