import {
  LayoutDashboard,
  Users,
  Database,
  MessageSquare,
  Package,
  ShoppingCart,
  CreditCard,
  Truck,
  History,
  Settings,
  Store,
  Shield,
  Crown,
  Palette,
  ListChecks,
  Megaphone,
  Calculator,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { BrandingModal } from './BrandingModal';
import type { Role } from '../types';

export type ViewId =
  | 'sa-clients'
  | 'sa-database'
  | 'sa-chat'
  | 'sa-broadcast'
  | 'boss-dashboard'
  | 'boss-remark'
  | 'boss-products'
  | 'boss-reception'
  | 'boss-credits'
  | 'boss-chat'
  | 'boss-tasks'
  | 'boss-employees'
  | 'boss-stock-history'
  | 'emp-pos'
  | 'emp-history'
  | 'emp-chat'
  | 'emp-tasks'
  | 'emp-cash-close';

interface NavItem {
  id: ViewId;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV: Record<Role, NavItem[]> = {
  superadmin: [
    { id: 'sa-clients', label: 'Gestión de Clientes', icon: Users },
    { id: 'sa-database', label: 'Base de Datos Maestro', icon: Database },
    { id: 'sa-chat', label: 'Chat de Soporte', icon: MessageSquare },
    { id: 'sa-broadcast', label: 'Canal de Difusión', icon: Megaphone },
  ],
  boss: [
    { id: 'boss-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'boss-remark', label: 'Remarcación Masiva', icon: ShoppingCart },
    { id: 'boss-products', label: 'Gestión de Artículos', icon: Package },
    { id: 'boss-reception', label: 'Recepción de Mercadería', icon: Truck },
    { id: 'boss-tasks', label: 'Tareas de Reposición', icon: ListChecks },
    { id: 'boss-stock-history', label: 'Movimientos de Stock', icon: History },
    { id: 'boss-employees', label: 'Gestión de Empleados', icon: Users },
    { id: 'boss-credits', label: 'Fiados y Alertas', icon: CreditCard },
    { id: 'boss-chat', label: 'Chat Interno', icon: MessageSquare },
  ],
  employee: [
    { id: 'emp-pos', label: 'Punto de Venta', icon: Store },
    { id: 'emp-tasks', label: 'Tareas Pendientes', icon: ListChecks },
    { id: 'emp-cash-close', label: 'Cierre de Caja', icon: Calculator },
    { id: 'emp-history', label: 'Historial del Turno', icon: History },
    { id: 'emp-chat', label: 'Chat con el Jefe', icon: MessageSquare },
  ],
};

interface SidebarProps {
  view: ViewId;
  setView: (v: ViewId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ view, setView, mobileOpen, onCloseMobile }: SidebarProps) {
  const { role, currentTenant, currentUser } = useApp();
  const [brandingOpen, setBrandingOpen] = useState(false);
  const items = NAV[role];

  const RoleIcon = role === 'superadmin' ? Shield : role === 'boss' ? Crown : Store;

  const handleSelect = (id: ViewId) => {
    setView(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 shrink-0 flex flex-col bg-discord-darkest dark:bg-discord-darkest bg-gray-900 border-r border-black/40 dark:border-white/5 transform transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center gap-2.5 px-4 border-b border-black/40 dark:border-white/5">
          {role === 'superadmin' || !currentTenant ? (
            <>
              <div className="w-9 h-9 rounded-xl bg-[#5865F2] flex items-center justify-center shadow-lg shadow-[#5865F2]/30">
                <Shield size={18} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-bold text-sm leading-tight">Produsave</p>
                <p className="text-[10px] text-gray-400 leading-tight">Super Admin</p>
              </div>
            </>
          ) : (
            <>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-lg shrink-0"
                style={{ backgroundColor: currentTenant.branding.primary }}
              >
                {currentTenant.branding.logoEmoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-bold text-sm leading-tight truncate">
                  {currentTenant.branding.logoText}
                </p>
                <p className="text-[10px] text-gray-400 leading-tight">
                  {role === 'boss' ? 'Panel del Jefe' : 'Panel Cajero'}
                </p>
              </div>
              {role === 'boss' && (
                <button
                  onClick={() => setBrandingOpen(true)}
                  title="Personalizar marca"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition shrink-0"
                >
                  <Palette size={15} />
                </button>
              )}
            </>
          )}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            Menú
          </p>
          {items.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                data-tour={item.id}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition group ${
                  active
                    ? 'bg-[#5865F2]/15 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <Icon
                  size={18}
                  className={active ? 'text-[#5865F2]' : 'text-gray-500 group-hover:text-gray-300'}
                />
                <span className="truncate">{item.label}</span>
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#5865F2] shrink-0" />}
              </button>
            );
          })}
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-black/40 dark:border-white/5">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 transition cursor-pointer">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: currentUser.avatarColor }}
            >
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-semibold truncate">{currentUser.name}</p>
              <p className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                <RoleIcon size={9} /> {role === 'superadmin' ? 'Super Admin' : role === 'boss' ? 'Jefe' : 'Cajero'}
              </p>
            </div>
            <Settings size={14} className="text-gray-500 shrink-0" />
          </div>
        </div>

        {role === 'boss' && <BrandingModal open={brandingOpen} onClose={() => setBrandingOpen(false)} />}
      </aside>
    </>
  );
}
