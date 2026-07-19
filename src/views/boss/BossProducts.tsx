import { useState, useMemo } from 'react';
import { Search, Plus, Package, Tag, Warehouse, Store, ArrowRight, Trash2 } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import type { Product } from '../../types';

export function BossProducts() {
  const { products, categories, addProduct, deleteProduct, publishToCaja, currentTenant } = useApp();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [localCats, setLocalCats] = useState<string[]>(categories.map((c) => c.name));
  const [publishProduct, setPublishProduct] = useState<Product | null>(null);
  const [publishQty, setPublishQty] = useState(0);
  const [form, setForm] = useState({
    name: '', brand: '', category: localCats[0] ?? '', cost: 0, price:  0, stock: 0, minStock: 5, weight: '', barcode: '',
  });

  const filtered = useMemo(() =>
    products.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.brand?.toLowerCase().includes(query.toLowerCase()) ||
      p.barcode?.includes(query)
    ), [products, query]);

  const handleAddCat = () => {
    if (newCat.trim() && !localCats.includes(newCat.trim())) {
      setLocalCats([...localCats, newCat.trim()]);
      setForm({ ...form, category: newCat.trim() });
    }
    setNewCat('');
    setCatOpen(false);
  };

  const handleSave = () => {
    if (!form.name || !currentTenant) return;
    addProduct({
      tenantId: currentTenant.id,
      name: form.name, brand: form.brand, category: form.category,
      cost: form.cost, price: form.price, stock: form.stock, minStock: form.minStock,
      weight: form.weight || undefined,
      barcode: form.barcode || `779${Date.now().toString().slice(-10)}`,
      warehouseStock: form.stock, publishedStock: 0,
    });
    setForm({ name: '', brand: '', category: localCats[0] ?? '', cost: 0, price: 0, stock: 0, minStock: 5, weight: '', barcode: '' });
    setOpen(false);
  };

  const handlePublish = () => {
    if (!publishProduct || publishQty <= 0) return;
    publishToCaja(publishProduct.id, publishQty);
    setPublishProduct(null);
    setPublishQty(0);
  };

  const handleDelete = (id: string) => {
    deleteProduct(id);
  };

  return (
    <div className="view-enter space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/5 dark:bg-black/30 flex-1">
          <Search size={16} className="text-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, marca o código..." className="bg-transparent outline-none flex-1 text-sm text-gray-700 dark:text-gray-200" />
        </div>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl btn-brand font-semibold text-sm">
          <Plus size={16} /> Nuevo Artículo
        </button>
      </div>

      <div className="rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black/5 dark:bg-black/30 text-left text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 font-semibold">Artículo</th>
                <th className="px-4 py-3 font-semibold">Marca</th>
                <th className="px-4 py-3 font-semibold">Categoría</th>
                <th className="px-4 py-3 font-semibold">Costo</th>
                <th className="px-4 py-3 font-semibold">Venta</th>
                <th className="px-4 py-3 font-semibold"><Warehouse size={12} className="inline mr-1" />Bodega</th>
                <th className="px-4 py-3 font-semibold"><Store size={12} className="inline mr-1" />Caja</th>
                <th className="px-4 py-3 font-semibold">Mín.</th>
                <th className="px-4 py-3 font-semibold">Código</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {filtered.map((p: Product) => (
                  <tr key={p.id} className="hover:bg-black/[0.02] dark:hover:bg-white/5">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.brand}</td>
                    <td className="px-4 py-3"><Badge>{p.category}</Badge></td>
                    <td className="px-4 py-3 text-gray-500">${p.cost}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">${p.price}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${p.warehouseStock < 5 ? 'text-red-400' : 'text-blue-400'}`}>{p.warehouseStock}</span>
                      {p.warehouseStock < 5 && <span className="ml-1 text-[10px] text-red-400">⚠ Bajo</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={p.publishedStock < p.minStock ? 'text-amber-500 font-semibold' : 'text-emerald-400 font-semibold'}>
                        {p.publishedStock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{p.minStock}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{p.barcode}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => { setPublishProduct(p); setPublishQty(Math.min(10, p.warehouseStock)); }}
                          disabled={p.warehouseStock === 0}
                          data-tour="publish-btn"
                          title="Publicar en Caja"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#5865F2]/15 text-[#5865F2] hover:bg-[#5865F2]/25 transition text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowRight size={12} /> Publicar
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          title="Eliminar"
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/15 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
          </table>
        </div>
      </div>

      {/* New product modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo artículo" maxWidth="max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="Harina 1kg" /></Field>
          <Field label="Marca"><input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="input" placeholder="Blancaflor" /></Field>
          <Field label="Categoría">
            <div className="flex gap-2">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input flex-1">
                {localCats.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={() => setCatOpen((v) => !v)} className="px-3 rounded-xl bg-black/5 dark:bg-white/10 text-gray-500 hover:text-brand"><Tag size={16} /></button>
            </div>
            {catOpen && (
              <div className="flex gap-2 mt-2">
                <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Nueva categoría" className="input flex-1" />
                <button onClick={handleAddCat} className="px-3 py-2 rounded-xl btn-brand text-sm">+</button>
              </div>
            )}
          </Field>
          <Field label="Código de barras"><input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="input" placeholder="Auto si vacío" /></Field>
          <Field label="Precio costo ($)"><input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} className="input" /></Field>
          <Field label="Precio venta ($)"><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="input" /></Field>
          <Field label="Stock en Bodega"><input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className="input" /></Field>
          <Field label="Stock mínimo (Caja)"><input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} className="input" /></Field>
          <Field label="Peso (opcional)"><input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="input" placeholder="1kg, 500ml..." /></Field>
        </div>
        <p className="text-xs text-gray-400 mt-3">El stock inicial se guarda en Bodega. Usá "Publicar en Caja" para moverlo al POS.</p>
        <button onClick={handleSave} className="w-full mt-5 py-2.5 rounded-xl btn-brand font-semibold flex items-center justify-center gap-2">
          <Package size={16} /> Guardar artículo
        </button>
      </Modal>

      {/* Publish to Caja modal */}
      <Modal open={!!publishProduct} onClose={() => setPublishProduct(null)} title="Publicar en Caja">
        {publishProduct && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5">
              <p className="font-semibold text-gray-900 dark:text-white">{publishProduct.name}</p>
              <p className="text-xs text-gray-400">Bodega: {publishProduct.warehouseStock}u · Caja: {publishProduct.publishedStock}u</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 text-center p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Warehouse size={18} className="text-blue-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-blue-400">{publishProduct.warehouseStock}</p>
                <p className="text-xs text-gray-400">Bodega</p>
              </div>
              <ArrowRight size={20} className="text-gray-400" />
              <div className="flex-1 text-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Store size={18} className="text-emerald-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-emerald-400">{publishProduct.publishedStock + publishQty}</p>
                <p className="text-xs text-gray-400">Caja (después)</p>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Cantidad a publicar</label>
              <input type="number" value={publishQty} onChange={(e) => setPublishQty(Math.min(publishProduct.warehouseStock, Math.max(0, Number(e.target.value))))} max={publishProduct.warehouseStock} min={0} className="input" />
            </div>
            <button onClick={handlePublish} disabled={publishQty <= 0} className="w-full py-2.5 rounded-xl btn-brand font-semibold disabled:opacity-40">
              Publicar {publishQty} unidades en Caja
            </button>
          </div>
        )}
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
