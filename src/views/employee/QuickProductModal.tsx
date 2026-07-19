import { useState } from 'react';
import { PackagePlus, Check } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { useApp } from '../../store/AppContext';

export function QuickProductModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addProduct, currentTenant, currentUser, pushWarning } = useApp();
  const [form, setForm] = useState({ name: '', price: 0, barcode: '' });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!form.name || !currentTenant) return;
    addProduct({
      tenantId: currentTenant.id,
      name: form.name,
      brand: 'Genérico',
      category: 'Almacén',
      cost: 0,
      price: form.price,
      stock: 1,
      minStock: 1,
      barcode: form.barcode || `779${Date.now().toString().slice(-10)}`,
      createdBy: currentUser.name,
      warehouseStock: 0,
      publishedStock: 1,
    });
    pushWarning(`${currentUser.name} creó producto de emergencia "${form.name}" (${new Date().toLocaleTimeString('es-AR')}).`);
    setSaved(true);
    setTimeout(() => { setForm({ name: '', price: 0, barcode: '' }); setSaved(false); onClose(); }, 1500);
  };

  return (
    <Modal open={open} onClose={onClose} title="Alta rápida de artículo de emergencia">
      {saved ? (
        <div className="py-8 flex flex-col items-center gap-2 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Check size={28} className="text-emerald-400" />
          </div>
          <p className="font-bold text-gray-900 dark:text-white">Producto creado</p>
          <p className="text-xs text-gray-400">Quedó registrado en el historial</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500">
            Alta de emergencia: queda registro de empleado y hora.
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500">Nombre del producto</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input mt-1" placeholder="Producto sin código" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500">Precio</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="input mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">Código (opcional)</label>
              <input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="input mt-1" placeholder="Auto" />
            </div>
          </div>
          <button onClick={handleSave} className="w-full py-2.5 rounded-xl btn-brand font-semibold flex items-center justify-center gap-2">
            <PackagePlus size={16} /> Crear producto
          </button>
        </div>
      )}
      <style>{`.input{width:100%;padding:.625rem .75rem;border-radius:.75rem;background:rgba(0,0,0,.05);border:1px solid rgba(0,0,0,.1);color:inherit;outline:none}.dark .input{background:rgba(0,0,0,.3);border-color:rgba(255,255,255,.1);color:#fff}`}</style>
    </Modal>
  );
}
