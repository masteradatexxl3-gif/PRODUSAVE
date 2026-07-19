import { useState } from 'react';
import { Search, CheckCheck, Percent, AlertCircle, RotateCcw } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { Modal } from '../../components/ui/Modal';

export function BossRemark() {
  const { products, massRemark } = useApp();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [percent, setPercent] = useState(15);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lastDragIdx, setLastDragIdx] = useState<number | null>(null);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  const toggle = (id: string) => {
    setSelected((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  const handleDragSelect = (idx: number) => {
    if (lastDragIdx === null) return;
    const id = filtered[idx].id;
    setSelected((prev) => {
      const copy = new Set(prev);
      copy.add(id);
      return copy;
    });
    setLastDragIdx(idx);
  };

  const selectAll = () => setSelected(new Set(filtered.map((p) => p.id)));
  const clearAll = () => setSelected(new Set());

  const previewPrice = (price: number) => Math.round(price * (1 + percent / 100));
  const selectedCount = selected.size;

  const handleConfirm = () => {
    massRemark(Array.from(selected), percent);
    setConfirmOpen(false);
    setSelected(new Set());
  };

  return (
    <div className="view-enter space-y-4">
      {/* Control bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-end">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/5 dark:bg-black/30 flex-1">
            <Search size={16} className="text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar productos..."
              className="bg-transparent outline-none flex-1 text-sm text-gray-700 dark:text-gray-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/5 dark:bg-black/30">
              <Percent size={16} className="text-brand" />
              <input
                type="number"
                value={percent}
                onChange={(e) => setPercent(Number(e.target.value))}
                className="w-16 bg-transparent outline-none text-sm text-gray-700 dark:text-gray-200 text-center"
              />
              <span className="text-xs text-gray-400">% aumento</span>
            </div>
            <button onClick={selectAll} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 text-sm text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10 transition">
              <CheckCheck size={16} /> Todos
            </button>
            <button onClick={clearAll} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 text-sm text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10 transition">
              <RotateCcw size={16} /> Limpiar
            </button>
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={selectedCount === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl btn-brand font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Aplicar a {selectedCount} producto{selectedCount !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
        {selectedCount > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-500">
            <AlertCircle size={14} /> Mostrando vista previa del precio final con +{percent}% antes de confirmar.
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black/5 dark:bg-black/30 text-left text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={() => (selected.size === filtered.length ? clearAll() : selectAll())}
                    className="accent-[#5865F2] w-4 h-4"
                  />
                </th>
                <th className="px-4 py-3 font-semibold">Producto</th>
                <th className="px-4 py-3 font-semibold">Categoría</th>
                <th className="px-4 py-3 font-semibold">Precio actual</th>
                <th className="px-4 py-3 font-semibold">Vista previa (+{percent}%)</th>
                <th className="px-4 py-3 font-semibold">Diferencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {filtered.map((p, idx) => {
                const isSel = selected.has(p.id);
                const preview = previewPrice(p.price);
                return (
                  <tr
                    key={p.id}
                    onMouseDown={() => setLastDragIdx(idx)}
                    onMouseEnter={() => handleDragSelect(idx)}
                    onMouseUp={() => setLastDragIdx(null)}
                    className={`cursor-pointer transition ${isSel ? 'bg-[#5865F2]/10' : 'hover:bg-black/[0.02] dark:hover:bg-white/5'}`}
                    onClick={() => toggle(p.id)}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggle(p.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="accent-[#5865F2] w-4 h-4"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.category}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">${p.price}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${isSel ? 'text-brand' : 'text-gray-400'}`}>
                        ${preview}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-emerald-400 text-xs">+${preview - p.price}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirmar remarcación masiva">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <p className="text-sm text-gray-800 dark:text-gray-200">
              Vas a actualizar <strong>{selectedCount} producto{selectedCount !== 1 ? 's' : ''}</strong> con un aumento del <strong>{percent}%</strong>.
            </p>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1.5">
            {Array.from(selected).map((id) => {
              const p = products.find((pr) => pr.id === id);
              if (!p) return null;
              return (
                <div key={id} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-black/5 dark:bg-white/5">
                  <span className="text-gray-700 dark:text-gray-200">{p.name}</span>
                  <span className="text-gray-400">${p.price} → <span className="text-brand font-semibold">${previewPrice(p.price)}</span></span>
                </div>
              );
            })}
          </div>
          <button onClick={handleConfirm} className="w-full py-2.5 rounded-xl btn-brand font-semibold">
            Confirmar actualización
          </button>
        </div>
      </Modal>
    </div>
  );
}
