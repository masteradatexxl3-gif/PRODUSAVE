import { useState } from 'react';
import { Database, Package, Users as UsersIcon } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { Badge } from '../../components/ui/Badge';

export function SuperAdminDatabase() {
  const { tenants, products, users } = useApp();
  const [tab, setTab] = useState<'products' | 'users'>('products');
  const [tenantFilter, setTenantFilter] = useState<string>('all');

  const filteredProducts = tenantFilter === 'all' ? products : products.filter((p) => p.tenantId === tenantFilter);
  const filteredUsers = tenantFilter === 'all' ? users : users.filter((u) => u.tenantId === tenantFilter);

  return (
    <div className="view-enter space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <TabBtn active={tab === 'products'} onClick={() => setTab('products')} icon={Package} label="Productos" />
          <TabBtn active={tab === 'users'} onClick={() => setTab('users')} icon={UsersIcon} label="Usuarios" />
        </div>
        <div className="flex items-center gap-2">
          <Database size={15} className="text-gray-400" />
          <select
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-black/5 dark:bg-black/30 text-sm text-gray-700 dark:text-gray-200 border border-black/10 dark:border-white/10 outline-none"
          >
            <option value="all">Todos los negocios</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          {tab === 'products' ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-black/5 dark:bg-black/30 text-left text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 font-semibold">Negocio</th>
                  <th className="px-4 py-3 font-semibold">Categoría</th>
                  <th className="px-4 py-3 font-semibold">Precio</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold">Código</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {filteredProducts.map((p) => {
                  const tenant = tenants.find((t) => t.id === p.tenantId);
                  return (
                    <tr key={p.id} className="hover:bg-black/[0.02] dark:hover:bg-white/5">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.name}</td>
                      <td className="px-4 py-3 text-gray-500">{tenant?.name ?? '—'}</td>
                      <td className="px-4 py-3"><Badge>{p.category}</Badge></td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">${p.price}</td>
                      <td className="px-4 py-3">
                        <span className={p.stock < p.minStock ? 'text-red-400 font-semibold' : 'text-gray-600 dark:text-gray-300'}>{p.stock}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{p.barcode}</td>
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
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Última conexión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {filteredUsers.map((u) => {
                  const tenant = tenants.find((t) => t.id === u.tenantId);
                  return (
                    <tr key={u.id} className="hover:bg-black/[0.02] dark:hover:bg-white/5">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: u.avatarColor }}>
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{tenant?.name ?? 'Produsave HQ'}</td>
                      <td className="px-4 py-3">
                        <Badge color={u.role === 'superadmin' ? 'blurple' : u.role === 'boss' ? 'yellow' : 'gray'}>
                          {u.role === 'superadmin' ? 'Super Admin' : u.role === 'boss' ? 'Jefe' : 'Cajero'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1.5 text-xs ${u.online ? 'text-emerald-400' : 'text-gray-400'}`}>
                          <span className={`w-2 h-2 rounded-full ${u.online ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                          {u.online ? 'En línea' : u.lastSeen}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{u.lastSeen}</td>
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

function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Database; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
        active ? 'bg-[#5865F2] text-white' : 'bg-black/5 dark:bg-white/5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
      }`}
    >
      <Icon size={16} /> {label}
    </button>
  );
}
