import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Pause, Play, Ban, CheckCircle, Users as UsersIcon, Building2, Clock, Image as ImageIcon, Upload, ArrowLeft, Eye, UserCog, History, Calendar } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import type { Tenant, Role } from '../../types';

const planColor: Record<string, 'blurple' | 'green' | 'yellow'> = {
  version_de_prueba: 'yellow', pro: 'blurple', enterprise: 'green',
};
const planLabel: Record<string, string> = {
  version_de_prueba: 'Versión de Prueba', pro: 'Pro', enterprise: 'Enterprise',
};
const statusColor: Record<string, 'green' | 'red' | 'yellow'> = {
  active: 'green', suspended: 'red', paused: 'yellow',
};
const statusLabel: Record<string, string> = {
  active: 'Activo', suspended: 'Suspendido', paused: 'Pausado',
};

// Fuzzy match: normalized substring + character similarity
function fuzzyMatch(text: string, query: string): boolean {
  const t = text.toLowerCase().trim();
  const q = query.toLowerCase().trim();
  if (!q) return true;
  if (t.includes(q)) return true;
  // trigram-ish: check if all chars of q appear in order
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function SuperAdminClients() {
  const { tenants, profiles, toggleTenantStatusWithTrial, updateTenantBranding, createBoss, impersonateTenant, updateEmployee, auditLogs } = useApp();
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounced(query, 300);
  const [newOpen, setNewOpen] = useState(false);
  const [brandingTenant, setBrandingTenant] = useState<Tenant | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [statusModal, setStatusModal] = useState<Tenant | null>(null);
  const [form, setForm] = useState({ name: '', owner: '', email: '', password: '', plan: 'version_de_prueba', trialDays: 14 });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Fuzzy search across tenant name, boss name, employee names
  const filtered = useMemo(() => {
    if (!debouncedQuery) return tenants;
    return tenants.filter((t) => {
      if (fuzzyMatch(t.name, debouncedQuery)) return true;
      if (fuzzyMatch(t.ownerName, debouncedQuery)) return true;
      const tenantUsers = profiles.filter((p) => p.tenantId === t.id);
      return tenantUsers.some((u) => fuzzyMatch(u.name, debouncedQuery));
    });
  }, [tenants, profiles, debouncedQuery]);

  const totalEmployees = tenants.reduce((a, t) => a + t.employeeCount, 0);
  const activeTenants = tenants.filter((t) => t.status === 'active').length;
  const totalRevenue = tenants.reduce((a, t) => a + t.monthlyRevenue, 0);

  const handleCreate = async () => {
    if (!form.name || !form.owner || !form.email || !form.password) return;
    setCreating(true);
    setCreateError(null);
    const { error } = await createBoss(form.owner, form.email, form.password, form.name, form.plan as Tenant['plan'], Number(form.trialDays));
    setCreating(false);
    if (error) { setCreateError(error); return; }
    setForm({ name: '', owner: '', email: '', password: '', plan: 'version_de_prueba', trialDays: 14 });
    setNewOpen(false);
  };

  if (selectedTenant) {
    return <TenantDetail tenant={selectedTenant} onBack={() => setSelectedTenant(null)} onImpersonate={() => impersonateTenant(selectedTenant.id)} profiles={profiles} auditLogs={auditLogs} updateEmployee={updateEmployee} />;
  }

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
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por negocio, dueño o empleado..." className="bg-transparent outline-none flex-1 text-sm text-gray-700 dark:text-gray-200" />
          {query && <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-200"><Ban size={14} /></button>}
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
                <tr key={t.id} className="hover:bg-black/[0.02] dark:hover:bg-white/5 transition cursor-pointer" onClick={() => setSelectedTenant(t)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {t.branding.logoUrl ? (
                        <img src={t.branding.logoUrl} alt={t.name} className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ backgroundColor: t.branding.primary }}>
                          {t.branding.logoEmoji}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-white">{t.name}</span>
                        <p className="text-xs text-gray-400">{t.ownerName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge color={planColor[t.plan]}>{planLabel[t.plan]}</Badge></td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{t.employeeCount}</td>
                  <td className="px-4 py-3"><ExpiryCell expiresAt={t.subscriptionExpiresAt} /></td>
                  <td className="px-4 py-3"><Badge color={statusColor[t.status]}>{statusLabel[t.status]}</Badge></td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <ActionBtn icon={Eye} label="Ver como negocio" onClick={() => impersonateTenant(t.id)} />
                      <ActionBtn icon={ImageIcon} label="Branding" onClick={() => setBrandingTenant(t)} />
                      <ActionBtn icon={Calendar} label="Estado / Trial" onClick={() => setStatusModal(t)} />
                      {t.status === 'active' ? (
                        <>
                          <ActionBtn icon={Pause} label="Pausar" onClick={() => toggleTenantStatusWithTrial(t.id, 'paused')} />
                          <ActionBtn icon={Ban} label="Cortar" danger onClick={() => toggleTenantStatusWithTrial(t.id, 'suspended')} />
                        </>
                      ) : (
                        <ActionBtn icon={Play} label="Reactivar" onClick={() => toggleTenantStatusWithTrial(t.id, 'active')} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-center text-sm text-gray-400 py-8">Sin resultados para "{query}"</p>}
      </div>

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Crear nuevo cliente (Jefe)">
        <div className="space-y-4">
          <Field label="Nombre del negocio"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="Almacén Don José" /></Field>
          <Field label="Nombre del dueño"><input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} className="input" placeholder="José Pérez" /></Field>
          <Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" placeholder="jose@negocio.com" /></Field>
          <Field label="Contraseña inicial"><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" placeholder="Mínimo 6 caracteres" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Plan">
              <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} className="input">
                <option value="version_de_prueba">Versión de Prueba</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </Field>
            <Field label="Días de prueba"><input type="number" value={form.trialDays} onChange={(e) => setForm({ ...form, trialDays: Number(e.target.value) })} className="input" min="1" max="365" /></Field>
          </div>
          {createError && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400">{createError}</div>}
          <button onClick={handleCreate} disabled={creating || !form.name || !form.owner || !form.email || !form.password} className="w-full py-2.5 rounded-xl btn-brand font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
            {creating ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creando...</> : 'Crear cliente'}
          </button>
        </div>
      </Modal>

      {statusModal && (
        <StatusModal tenant={statusModal} onClose={() => setStatusModal(null)} onApply={async (status, days) => { await toggleTenantStatusWithTrial(statusModal.id, status, days); setStatusModal(null); }} />
      )}

      {brandingTenant && (
        <BrandingUploadModal tenant={brandingTenant} onClose={() => setBrandingTenant(null)} onSave={(b) => { updateTenantBranding(brandingTenant.id, b); setBrandingTenant(null); }} />
      )}

      <style>{`.input{width:100%;padding:.625rem .75rem;border-radius:.75rem;background:rgba(0,0,0,.05);border:1px solid rgba(0,0,0,.1);color:inherit;outline:none}.dark .input{background:rgba(0,0,0,.3);border-color:rgba(255,255,255,.1);color:#fff}`}</style>
    </div>
  );
}

function TenantDetail({ tenant, onBack, onImpersonate, profiles, auditLogs, updateEmployee }: {
  tenant: Tenant; onBack: () => void; onImpersonate: () => void;
  profiles: { id: string; tenantId: string; name: string; role: Role }[];
  auditLogs: { id: string; tenantId: string; userName: string; action: string; entityType?: string; createdAt: string; details?: Record<string, unknown> }[];
  updateEmployee: (id: string, updates: { role?: Role; active?: boolean }) => Promise<{ error: string | null }>;
}) {
  const [tab, setTab] = useState<'info' | 'employees' | 'audit'>('info');
  const tenantProfiles = profiles.filter((p) => p.tenantId === tenant.id);
  const tenantAudit = auditLogs.filter((a) => a.tenantId === tenant.id);
  return (
    <div className="view-enter space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition">
          <ArrowLeft size={18} className="text-gray-600 dark:text-gray-300" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: tenant.branding.primary }}>
            {tenant.branding.logoEmoji}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{tenant.name}</h2>
            <p className="text-sm text-gray-400">{tenant.ownerName} · <Badge color={planColor[tenant.plan]}>{planLabel[tenant.plan]}</Badge></p>
          </div>
        </div>
        <button onClick={onImpersonate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-semibold text-sm transition">
          <Eye size={16} /> Ver como negocio
        </button>
      </div>

      <div className="flex gap-2">
        <TabBtn active={tab === 'info'} onClick={() => setTab('info')} icon={Building2} label="Datos" />
        <TabBtn active={tab === 'employees'} onClick={() => setTab('employees')} icon={UsersIcon} label={`Empleados (${tenantProfiles.length})`} />
        <TabBtn active={tab === 'audit'} onClick={() => setTab('audit')} icon={History} label={`Auditoría (${tenantAudit.length})`} />
      </div>

      {tab === 'info' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoCard label="Estado"><Badge color={statusColor[tenant.status]}>{statusLabel[tenant.status]}</Badge></InfoCard>
          <InfoCard label="Plan"><Badge color={planColor[tenant.plan]}>{planLabel[tenant.plan]}</Badge></InfoCard>
          <InfoCard label="Vencimiento"><ExpiryCell expiresAt={tenant.subscriptionExpiresAt} /></InfoCard>
          <InfoCard label="Empleados">{tenant.employeeCount}</InfoCard>
          <InfoCard label="Ingresos/mes">${tenant.monthlyRevenue.toLocaleString()}</InfoCard>
          <InfoCard label="Color primario"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-lg" style={{ backgroundColor: tenant.branding.primary }} /><span className="text-sm">{tenant.branding.primary}</span></div></InfoCard>
        </div>
      )}

      {tab === 'employees' && (
        <div className="rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black/5 dark:bg-black/30 text-left text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 font-semibold">Empleado</th>
                <th className="px-4 py-3 font-semibold">Rol</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {tenantProfiles.map((p) => (
                <tr key={p.id} className="hover:bg-black/[0.02] dark:hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.name}</td>
                  <td className="px-4 py-3"><Badge color={p.role === 'boss' ? 'yellow' : 'gray'}>{p.role === 'boss' ? 'Jefe' : 'Cajero'}</Badge></td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-400">—</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {p.role !== 'boss' && (
                        <>
                          <ActionBtn icon={UserCog} label="Cambiar rol" onClick={() => updateEmployee(p.id, { role: p.role === 'employee' ? ('boss' as Role) : 'employee' })} />
                          <ActionBtn icon={Ban} label="Desactivar" danger onClick={() => updateEmployee(p.id, { active: false })} />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'audit' && (
        <div className="space-y-2">
          {tenantAudit.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">Sin actividad registrada.</p>
          ) : tenantAudit.slice(0, 50).map((a) => (
            <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5">
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
    </div>
  );
}

function StatusModal({ tenant, onClose, onApply }: { tenant: Tenant; onClose: () => void; onApply: (status: Tenant['status'], days?: number) => void }) {
  const [status, setStatus] = useState<Tenant['status']>(tenant.status);
  const [days, setDays] = useState(14);
  return (
    <Modal open onClose={onClose} title={`Estado: ${tenant.name}`}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2">Estado del negocio</label>
          <div className="grid grid-cols-3 gap-2">
            {(['active', 'paused', 'suspended'] as const).map((s) => (
              <button key={s} onClick={() => setStatus(s)} className={`py-2 rounded-xl text-sm font-semibold transition ${status === s ? 'bg-[#5865F2] text-white' : 'bg-black/5 dark:bg-white/5 text-gray-500'}`}>
                {statusLabel[s]}
              </button>
            ))}
          </div>
        </div>
        {status === 'active' && (
          <Field label="Días de prueba (extender vencimiento)">
            <input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} className="input" min="1" max="365" />
          </Field>
        )}
        <button onClick={() => onApply(status, status === 'active' ? days : undefined)} className="w-full py-2.5 rounded-xl btn-brand font-semibold">Aplicar</button>
      </div>
    </Modal>
  );
}

function ExpiryCell({ expiresAt }: { expiresAt?: string | null }) {
  if (!expiresAt) return <span className="text-gray-400 text-xs">Sin fecha</span>;
  const daysLeft = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
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

  const handleUpload = (file: File) => {
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => { setLogoUrl(reader.result as string); setUploading(false); };
    reader.readAsDataURL(file);
  };

  return (
    <Modal open onClose={onClose} title={`Branding: ${tenant.name}`} maxWidth="max-w-lg">
      <div className="space-y-5">
        <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 flex items-center gap-3">
          {logoUrl ? <img src={logoUrl} alt="Logo" className="w-14 h-14 rounded-2xl object-cover" /> : <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: primary }}>{emoji}</div>}
          <div><p className="font-bold text-gray-900 dark:text-white" style={{ color: primary }}>{tenant.name}</p><p className="text-xs text-gray-400">Vista previa</p></div>
        </div>
        <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-black/10 dark:border-white/10 cursor-pointer hover:border-brand transition">
          <Upload size={24} className="text-gray-400" />
          <span className="text-sm text-gray-500">{uploading ? 'Subiendo...' : 'Click para subir imagen'}</span>
          <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-xs font-semibold text-gray-500 mb-1.5 block">Color primario</label><div className="flex items-center gap-2"><input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer" /><input value={primary} onChange={(e) => setPrimary(e.target.value)} className="input flex-1" /></div></div>
          <div><label className="text-xs font-semibold text-gray-500 mb-1.5 block">Color de acento</label><div className="flex items-center gap-2"><input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer" /><input value={accent} onChange={(e) => setAccent(e.target.value)} className="input flex-1" /></div></div>
        </div>
        <Field label="Emoji del logo"><input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="input" maxLength={2} /></Field>
        <button onClick={() => onSave({ primary, accent, logoText: tenant.name, logoEmoji: emoji, logoUrl })} className="w-full py-2.5 rounded-xl btn-brand font-semibold">Aplicar branding</button>
      </div>
    </Modal>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Building2; label: string; value: string | number; color: string }) {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}22` }}><Icon size={20} style={{ color }} /></div>
        <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p><p className="text-xs text-gray-500">{label}</p></div>
      </div>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick, danger }: { icon: typeof Pause; label: string; onClick: () => void; danger?: boolean }) {
  return <button onClick={onClick} title={label} className={`p-1.5 rounded-lg transition ${danger ? 'text-red-400 hover:bg-red-500/15' : 'text-gray-400 hover:bg-white/10'}`}><Icon size={16} /></button>;
}

function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Building2; label: string }) {
  return <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${active ? 'bg-[#5865F2] text-white' : 'bg-black/5 dark:bg-white/5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}><Icon size={16} /> {label}</button>;
}

function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="p-4 rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5"><p className="text-xs text-gray-400 mb-1">{label}</p><div className="text-sm font-medium text-gray-900 dark:text-white">{children}</div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>{children}</div>;
}
