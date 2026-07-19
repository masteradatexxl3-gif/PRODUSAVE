import { useState, useEffect } from 'react';
import { Search, Plus, Pause, Play, Ban, CheckCircle, Users as UsersIcon, Building2, Clock, Image as ImageIcon, Upload } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import type { Tenant } from '../../types';

const planColor: Record<string, 'blurple' | 'green' | 'yellow'> = {
  version_de_prueba: 'yellow',
  pro: 'blurple',
  enterprise: 'green',
};
const planLabel: Record<string, string> = {
  version_de_prueba: 'Versión de Prueba',
  pro: 'Pro',
  enterprise: 'Enterprise',
};
const statusColor: Record<string, 'green' | 'red' | 'yellow'> = {
  active: 'green',
  suspended: 'red',
  paused: 'yellow',
};
const statusLabel: Record<string, string> = {
  active: 'Activo',
  suspended: 'Suspendido',
  paused: 'Pausado',
};

function useDaysLeft(expiresAt?: string | null) {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!expiresAt) { setDaysLeft(null); return; }
    const calc = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      setDaysLeft(Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, [expiresAt]);
  return daysLeft;
}

export function SuperAdminClients() {
  const { tenants, users, toggleTenantStatus, updateTenantBranding, createBoss } = useApp();
  const [query, setQuery] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [brandingTenant, setBrandingTenant] = useState<Tenant | null>(null);
  const [form, setForm] = useState({ name: '', owner: '', email: '', password: '', plan: 'version_de_prueba' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.ownerName.toLowerCase().includes(query.toLowerCase())
  );

  const totalEmployees = tenants.reduce((a, t) => a + t.employeeCount, 0);
  const activeTenants = tenants.filter((t) => t.status === 'active').length;
  const totalRevenue = tenants.reduce((a, t) => a + t.monthlyRevenue, 0);

  const handleCreate = async () => {
    if (!form.name || !form.owner || !form.email || !form.password) return;
    setCreating(true);
    setCreateError(null);
    const { error } = await createBoss(form.owner, form.email, form.password, form.name, form.plan as Tenant['plan']);
    setCreating(false);
    if (error) { setCreateError(error); return; }
    setForm({ name: '', owner: '', email: '', password: '', plan: 'version_de_prueba' });
    setNewOpen(false);
  };

  return (
    <div className="view-enter">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Building2} label="Negocios" value={tenants.length} color="#5865F2" />
        <StatCard icon={UsersIcon} label="Empleados totales" value={totalEmployees} color="#3ba55c" />
        <StatCard icon={CheckCircle} label="Activos" value={activeTenants} color="#FAA61A" />
        <StatCard icon={Building2} label="Ingresos / mes" value={`$${totalRevenue.toLocaleString()}`} color="#ED4245" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/5 dark:bg-black/30 flex-1">
          <Search size={16} className="text-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar negocio o dueño..." className="bg-transparent outline-none flex-1 text-sm text-gray-700 dark:text-gray-200" />
        </div>
        <button onClick={() => setNewOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl btn-brand font-semibold text-sm">
          <Plus size={16} /> Nuevo Cliente
        </button>
      </div>

      <div className="rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black/5 dark:bg-black/30 text-left text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 font-semibold">Negocio</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Empleados</th>
                <th className="px-4 py-3 font-semibold">Vencimiento</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-black/[0.02] dark:hover:bg-white/5 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {t.branding.logoUrl ? (
                        <img src={t.branding.logoUrl} alt={t.name} className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ backgroundColor: t.branding.primary }}>
                          {t.branding.logoEmoji}
                        </div>
                      )}
                      <span className="font-semibold text-gray-900 dark:text-white">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge color={planColor[t.plan]}>{planLabel[t.plan]}</Badge></td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {t.employeeCount} <span className="text-gray-400 text-xs">/ {users.filter((u) => u.tenantId === t.id).length} reg.</span>
                  </td>
                  <td className="px-4 py-3" data-tour="expiry-cell">
                    <ExpiryCell expiresAt={t.subscriptionExpiresAt} />
                  </td>
                  <td className="px-4 py-3"><Badge color={statusColor[t.status]}>{statusLabel[t.status]}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <ActionBtn icon={ImageIcon} label="Branding" onClick={() => setBrandingTenant(t)} dataTour="branding-btn" />
                      {t.status === 'active' ? (
                        <>
                          <ActionBtn icon={Pause} label="Pausar" onClick={() => toggleTenantStatus(t.id, 'paused')} />
                          <ActionBtn icon={Ban} label="Cortar" danger onClick={() => toggleTenantStatus(t.id, 'suspended')} />
                        </>
                      ) : (
                        <ActionBtn icon={Play} label="Reactivar" onClick={() => toggleTenantStatus(t.id, 'active')} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Crear nuevo cliente (Jefe)">
        <div className="space-y-4">
          <Field label="Nombre del negocio"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="Almacén Don José" /></Field>
          <Field label="Nombre del dueño"><input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} className="input" placeholder="José Pérez" /></Field>
          <Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" placeholder="jose@negocio.com" /></Field>
          <Field label="Contraseña inicial"><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" placeholder="Mínimo 6 caracteres" /></Field>
          <Field label="Plan">
            <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} className="input">
              <option value="version_de_prueba">Versión de Prueba (14 días)</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </Field>
          {createError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400">{createError}</div>
          )}
          <button onClick={handleCreate} disabled={creating || !form.name || !form.owner || !form.email || !form.password} className="w-full py-2.5 rounded-xl btn-brand font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
            {creating ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creando...</> : 'Crear cliente'}
          </button>
        </div>
      </Modal>

      {brandingTenant && (
        <BrandingUploadModal tenant={brandingTenant} onClose={() => setBrandingTenant(null)} onSave={(b) => { updateTenantBranding(brandingTenant.id, b); setBrandingTenant(null); }} />
      )}

      <style>{`.input{width:100%;padding:.625rem .75rem;border-radius:.75rem;background:rgba(0,0,0,.05);border:1px solid rgba(0,0,0,.1);color:inherit;outline:none}.dark .input{background:rgba(0,0,0,.3);border-color:rgba(255,255,255,.1);color:#fff}`}</style>
    </div>
  );
}

function ExpiryCell({ expiresAt }: { expiresAt?: string | null }) {
  const daysLeft = useDaysLeft(expiresAt);
  if (!expiresAt || daysLeft === null) return <span className="text-gray-400 text-xs">Sin fecha</span>;
  const color = daysLeft <= 3 ? 'text-red-400' : daysLeft <= 7 ? 'text-amber-500' : 'text-emerald-400';
  return (
    <div className="flex flex-col">
      <span className={`text-sm font-semibold ${color} flex items-center gap-1`}>
        <Clock size={12} /> {daysLeft} días
      </span>
      <span className="text-[10px] text-gray-400">{new Date(expiresAt).toLocaleDateString('es-AR')}</span>
    </div>
  );
}

function BrandingUploadModal({ tenant, onClose, onSave }: { tenant: Tenant; onClose: () => void; onSave: (b: Tenant['branding']) => void }) {
  const [primary, setPrimary] = useState(tenant.branding.primary);
  const [accent, setAccent] = useState(tenant.branding.accent);
  const [emoji, setEmoji] = useState(tenant.branding.logoEmoji);
  const [logoUrl, setLogoUrl] = useState<string | null>(tenant.branding.logoUrl ?? null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        setLogoUrl(reader.result as string);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error('Error uploading:', e);
      setUploading(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Branding: ${tenant.name}`} maxWidth="max-w-lg">
      <div className="space-y-5">
        <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-14 h-14 rounded-2xl object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: primary }}>{emoji}</div>
          )}
          <div>
            <p className="font-bold text-gray-900 dark:text-white" style={{ color: primary }}>{tenant.name}</p>
            <p className="text-xs text-gray-400">Vista previa del logo</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">Subir imagen de logo (PNG)</p>
          <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-black/10 dark:border-white/10 cursor-pointer hover:border-brand transition">
            <Upload size={24} className="text-gray-400" />
            <span className="text-sm text-gray-500">{uploading ? 'Subiendo...' : 'Click para subir imagen'}</span>
            <span className="text-[10px] text-gray-400">Recomendado: 256x256px (cuadrado) o 400x120px (banner)</span>
            <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Color primario</label>
            <div className="flex items-center gap-2">
              <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer" />
              <input value={primary} onChange={(e) => setPrimary(e.target.value)} className="input flex-1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Color de acento</label>
            <div className="flex items-center gap-2">
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer" />
              <input value={accent} onChange={(e) => setAccent(e.target.value)} className="input flex-1" />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Emoji del logo (si no hay imagen)</label>
          <input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="input" maxLength={2} />
        </div>

        <button onClick={() => onSave({ primary, accent, logoText: tenant.name, logoEmoji: emoji, logoUrl })} className="w-full py-2.5 rounded-xl btn-brand font-semibold">
          Aplicar branding
        </button>
      </div>
    </Modal>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Building2; label: string; value: string | number; color: string }) {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}22` }}>
          <Icon size={20} style={{ color }} />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick, danger, dataTour }: { icon: typeof Pause; label: string; onClick: () => void; danger?: boolean; dataTour?: string }) {
  return (
    <button onClick={onClick} title={label} data-tour={dataTour} className={`p-1.5 rounded-lg transition ${danger ? 'text-red-400 hover:bg-red-500/15' : 'text-gray-400 hover:bg-white/10'}`}>
      <Icon size={16} />
    </button>
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
