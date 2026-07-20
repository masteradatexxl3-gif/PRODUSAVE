import { useState } from 'react';
import { Database, Package, Users as UsersIcon, Building2, ArrowLeft, Boxes, Truck, Store, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { Badge } from '../../components/ui/Badge';
import type { Tenant, Product } from '../../types';

export function SuperAdminDatabase() {
  const { tenants, products, users } = useApp();
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tab, setTab] = useState<'products' | 'users'>('products');

  if (selectedTenant) {
    return <TenantStockView tenant={selectedTenant} onBack={() => setSelectedTenant(null)} products={products.filter((p) => p.tenantId === selectedTenant.id)} />;
  }

  const filteredProducts = products;
  const filteredUsers = users;

  return (
    <div className="view-enter space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Database size={22} className="text-[#5865F2]" /> Base de Datos Maestro
        </h2>
        <p className="text-sm text-gray-500 mt-1">Seleccioná un negocio para ver su inventario detallado.</p>
      </div>

      {/* Tenant grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tenants.map((t) => {
          const tenantProducts = products.filter((p) => p.tenantId === t.id);
          const draftCount = tenantProducts.filter((p) => p.publishedStock === 0).length;
          const activeCount = tenantProducts.filter((p) => p.publishedStock > 0).length;
          return (
            <button
              key={t.id}
              onClick={() => setSelectedTenant(t)}
              className="p-5 rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5 hover:shadow-lg hover:border-[#5865F2]/30 transition text-left group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: t.branding.primary }}>
                  {t.branding.logoEmoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white truncate">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.ownerName}</p>
                </div>
                <Building2 size={18} className="text-gray-300 group-hover:text-[#5865F2] transition" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-amber-500/10"><p className="text-lg font-bold text-amber-500">{draftCount}</p><p className="text-[10px] text-gray-400">Borrador</p></div>
                <div className="p-2 rounded-lg bg-blue-500/10"><p className="text-lg font-bold text-blue-400">{tenantProducts.length}</p><p className="text-[10px] text-gray-400">Total</p></div>
                <div className="p-2 rounded-lg bg-emerald-500/10"><p className="text-lg font-bold text-emerald-400">{activeCount}</p><p className="text-[10px] text-gray-400">Activo</p></div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Global tables fallback */}
      <div className="flex gap-2">
        <TabBtn active={tab === 'products'} onClick={() => setTab('products')} icon={Package} label="Todos los productos" />
        <TabBtn active={tab === 'users'} onClick={() => setTab('users')} icon={UsersIcon} label="Todos los usuarios" />
      </div>

      <div className="rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          {tab === 'products' ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-black/5 dark:bg-black/30 text-left text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 font-semibold">Negocio</th>
                  <th className="px-4 py-3 font-semibold">Precio</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {filteredProducts.slice(0, 50).map((p) => {
                  const tenant = tenants.find((t) => t.id === p.tenantId);
                  return (
                    <tr key={p.id} className="hover:bg-black/[0.02] dark:hover:bg-white/5">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.name}</td>
                      <td className="px-4 py-3 text-gray-500">{tenant?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">${p.price}</td>
                      <td className="px-4 py-3"><span className={p.stock < p.minStock ? 'text-red-400 font-semibold' : 'text-gray-600 dark:text-gray-300'}>{p.stock}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-black/5 dark:bg-black/30 text-left text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 font-semibold">Usuario</th>
                  <th className="px-4 py-3 font-semibold">Negocio</th>
                  <th className="px-4 py-3 font-semibold">Rol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {filteredUsers.slice(0, 50).map((u) => {
                  const tenant = tenants.find((t) => t.id === u.tenantId);
                  return (
                    <tr key={u.id} className="hover:bg-black/[0.02] dark:hover:bg-white/5">
                      <td className="px-4 py-3"><div className="flex items-center gap-2.5"><div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: u.avatarColor }}>{u.name.charAt(0)}</div><div><p className="font-medium text-gray-900 dark:text-white">{u.name}</p><p className="text-xs text-gray-400">{u.email}</p></div></div></td>
                      <td className="px-4 py-3 text-gray-500">{tenant?.name ?? 'Produsave HQ'}</td>
                      <td className="px-4 py-3"><Badge color={u.role === 'superadmin' ? 'blurple' : u.role === 'boss' ? 'yellow' : 'gray'}>{u.role === 'superadmin' ? 'Super Admin' : u.role === 'boss' ? 'Jefe' : 'Cajero'}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function TenantStockView({ tenant, onBack, products }: { tenant: Tenant; onBack: () => void; products: Product[] }) {
  const [stockTab, setStockTab] = useState<'draft' | 'reception' | 'active'>('active');

  const draftProducts = products.filter((p) => p.publishedStock === 0);
  const activeProducts = products.filter((p) => p.publishedStock > 0);
  const lowStock = products.filter((p) => p.stock < p.minStock);

  const tabProducts = stockTab === 'draft' ? draftProducts : stockTab === 'active' ? activeProducts : products;

  return (
    <div className="view-enter space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition">
          <ArrowLeft size={18} className="text-gray-600 dark:text-gray-300" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: tenant.branding.primary }}>
            {tenant.branding.logoEmoji}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{tenant.name}</h2>
            <p className="text-sm text-gray-400">Inventario del negocio</p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard icon={Boxes} label="Borrador" count={draftProducts.length} color="#FAA61A" />
        <SummaryCard icon={Truck} label="Recepción" count={products.length} color="#5865F2" />
        <SummaryCard icon={Store} label="Activo POS" count={activeProducts.length} color="#3ba55c" />
      </div>

      {lowStock.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-500">
          <AlertTriangle size={16} /> {lowStock.length} producto(s) con stock bajo
        </div>
      )}

      {/* Stock tabs */}
      <div className="flex gap-2">
        <StockTab active={stockTab === 'active'} onClick={() => setStockTab('active')} icon={Store} label="Stock Activo POS" count={activeProducts.length} />
        <StockTab active={stockTab === 'draft'} onClick={() => setStockTab('draft')} icon={Boxes} label="Borrador / No Publicado" count={draftProducts.length} />
        <StockTab active={stockTab === 'reception'} onClick={() => setStockTab('reception')} icon={Truck} label="Recepción / Masivo" count={products.length} />
      </div>

      {/* Product table */}
      <div className="rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black/5 dark:bg-black/30 text-left text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 font-semibold">Producto</th>
                <th className="px-4 py-3 font-semibold">Categoría</th>
                <th className="px-4 py-3 font-semibold">Precio</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {tabProducts.map((p) => (
                <tr key={p.id} className="hover:bg-black/[0.02] dark:hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.name}</td>
                  <td className="px-4 py-3"><Badge>{p.category}</Badge></td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">${p.price}</td>
                  <td className="px-4 py-3"><span className={p.stock < p.minStock ? 'text-red-400 font-semibold' : 'text-gray-600 dark:text-gray-300'}>{p.stock}</span></td>
                  <td className="px-4 py-3">{p.publishedStock > 0 ? <Badge color="green"><CheckCircle2 size={10} className="inline mr-1" />Publicado</Badge> : <Badge color="yellow">Borrador</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tabProducts.length === 0 && <p className="text-center text-sm text-gray-400 py-8">Sin productos en esta sección.</p>}
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, count, color }: { icon: typeof Boxes; label: string; count: number; color: string }) {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}22` }}><Icon size={20} style={{ color }} /></div>
        <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p><p className="text-xs text-gray-500">{label}</p></div>
      </div>
    </div>
  );
}

function StockTab({ active, onClick, icon: Icon, label, count }: { active: boolean; onClick: () => void; icon: typeof Boxes; label: string; count: number }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${active ? 'bg-[#5865F2] text-white' : 'bg-black/5 dark:bg-white/5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
      <Icon size={16} /> {label} <span className={`px-1.5 py-0.5 rounded-full text-xs ${active ? 'bg-white/20' : 'bg-black/10 dark:bg-white/10'}`}>{count}</span>
    </button>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Database; label: string }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${active ? 'bg-[#5865F2] text-white' : 'bg-black/5 dark:bg-white/5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
      <Icon size={16} /> {label}
    </button>
  );
}
