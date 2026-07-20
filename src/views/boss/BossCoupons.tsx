import { useState } from 'react';
import { Ticket, Plus, Trash2, Edit3, Check, History, Percent } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import type { CouponCode } from '../../types';

export function BossCoupons() {
  const { coupons, addCoupon, updateCoupon, deleteCoupon, auditLogs, currentTenant } = useApp();
  const [newOpen, setNewOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState<CouponCode | null>(null);
  const [auditCoupon, setAuditCoupon] = useState<CouponCode | null>(null);
  const [form, setForm] = useState({ code: '', description: '', discountPercent: 10, maxUses: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const tenantCoupons = coupons.filter((c) => c.tenantId === currentTenant?.id);

  const handleCreate = async () => {
    if (!form.code || !currentTenant) return;
    setLoading(true);
    setError(null);
    const { error } = await addCoupon({
      tenantId: currentTenant.id,
      code: form.code.toUpperCase(),
      description: form.description || undefined,
      discountPercent: form.discountPercent,
      maxUses: form.maxUses ? Number(form.maxUses) : null,
      active: true,
    });
    setLoading(false);
    if (error) { setError(error); return; }
    setForm({ code: '', description: '', discountPercent: 10, maxUses: '' });
    setNewOpen(false);
  };

  const couponAudit = auditLogs.filter((a) => a.entityType === 'coupon' && a.entityId === auditCoupon?.id);

  return (
    <div className="view-enter space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Ticket size={22} className="text-[#5865F2]" /> Cupones de Descuento
          </h2>
          <p className="text-sm text-gray-500 mt-1">Creá y gestioná códigos de descuento para tus empleados.</p>
        </div>
        <button onClick={() => setNewOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl btn-brand font-semibold text-sm">
          <Plus size={16} /> Nuevo Cupón
        </button>
      </div>

      {tenantCoupons.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5 text-center">
          <Ticket size={40} className="text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No hay cupones creados todavía.</p>
          <p className="text-xs text-gray-400 mt-1">Creá tu primer cupón para empezar a ofrecer descuentos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenantCoupons.map((c) => (
            <div key={c.id} className="p-4 rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-[#5865F2]/15 flex items-center justify-center">
                    <Percent size={18} className="text-[#5865F2]" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-lg">{c.code}</p>
                    <p className="text-xs text-gray-400">{c.discountPercent}% de descuento</p>
                  </div>
                </div>
                <Badge color={c.active ? 'green' : 'red'}>{c.active ? 'Activo' : 'Inactivo'}</Badge>
              </div>

              {c.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{c.description}</p>}

              <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                <span>Usos: <strong className="text-gray-600 dark:text-gray-300">{c.usedCount}{c.maxUses ? `/${c.maxUses}` : ''}</strong></span>
                <span>·</span>
                <span>{new Date(c.createdAt).toLocaleDateString('es-AR')}</span>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-black/5 dark:border-white/5">
                <button onClick={() => setEditCoupon(c)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-semibold transition">
                  <Edit3 size={13} /> Editar
                </button>
                <button onClick={() => setAuditCoupon(c)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-semibold transition">
                  <History size={13} /> Auditoría
                </button>
                <button onClick={async () => { if (confirm(`¿Eliminar cupón "${c.code}"?`)) await deleteCoupon(c.id); }} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/15 transition">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New coupon modal */}
      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Crear nuevo cupón">
        <div className="space-y-4">
          <Field label="Código del cupón"><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input" placeholder="VERANO2025" /></Field>
          <Field label="Descripción (opcional)"><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" placeholder="Descuento de verano" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Descuento (%)"><input type="number" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })} className="input" min="0" max="100" /></Field>
            <Field label="Usos máximos (opcional)"><input type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} className="input" placeholder="Sin límite" /></Field>
          </div>
          {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400">{error}</div>}
          <button onClick={handleCreate} disabled={loading || !form.code} className="w-full py-2.5 rounded-xl btn-brand font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
            {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creando...</> : <><Plus size={16} /> Crear cupón</>}
          </button>
        </div>
      </Modal>

      {/* Edit coupon modal */}
      {editCoupon && (
        <EditCouponModal coupon={editCoupon} onClose={() => setEditCoupon(null)} onSave={async (updates) => { await updateCoupon(editCoupon.id, updates); setEditCoupon(null); }} />
      )}

      {/* Audit modal */}
      <Modal open={!!auditCoupon} onClose={() => setAuditCoupon(null)} title={`Auditoría: ${auditCoupon?.code ?? ''}`} maxWidth="max-w-lg">
        {couponAudit.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">Sin movimientos registrados.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {couponAudit.map((a) => (
              <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl bg-black/5 dark:bg-white/5">
                <div className="w-8 h-8 rounded-lg bg-[#5865F2]/15 flex items-center justify-center shrink-0">
                  <History size={14} className="text-[#5865F2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{a.action.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-400">{a.userName} · {new Date(a.createdAt).toLocaleString('es-AR')}</p>
                  {a.details && <p className="text-xs text-gray-500 mt-1">{JSON.stringify(a.details)}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <style>{`.input{width:100%;padding:.625rem .75rem;border-radius:.75rem;background:rgba(0,0,0,.05);border:1px solid rgba(0,0,0,.1);color:inherit;outline:none}.dark .input{background:rgba(0,0,0,.3);border-color:rgba(255,255,255,.1);color:#fff}`}</style>
    </div>
  );
}

function EditCouponModal({ coupon, onClose, onSave }: { coupon: CouponCode; onClose: () => void; onSave: (updates: Partial<CouponCode>) => void }) {
  const [code, setCode] = useState(coupon.code);
  const [description, setDescription] = useState(coupon.description ?? '');
  const [discountPercent, setDiscountPercent] = useState(coupon.discountPercent);
  const [maxUses, setMaxUses] = useState(coupon.maxUses?.toString() ?? '');
  const [active, setActive] = useState(coupon.active);

  return (
    <Modal open onClose={onClose} title={`Editar: ${coupon.code}`}>
      <div className="space-y-4">
        <Field label="Código"><input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="input" /></Field>
        <Field label="Descripción"><input value={description} onChange={(e) => setDescription(e.target.value)} className="input" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Descuento (%)"><input type="number" value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} className="input" min="0" max="100" /></Field>
          <Field label="Usos máximos"><input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className="input" placeholder="Sin límite" /></Field>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="w-4 h-4 rounded" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Cupón activo</span>
        </label>
        <button onClick={() => onSave({ code, description: description || undefined, discountPercent, maxUses: maxUses ? Number(maxUses) : null, active })} className="w-full py-2.5 rounded-xl btn-brand font-semibold flex items-center justify-center gap-2">
          <Check size={16} /> Guardar cambios
        </button>
      </div>
    </Modal>
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
