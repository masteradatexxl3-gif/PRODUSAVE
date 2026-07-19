import { useState } from 'react';
import { Bell, Search, GraduationCap, Menu } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { ThemeToggle } from './ui/ThemeToggle';
import { GuidedTour } from './ui/GuidedTour';
import { superAdminTourSteps, bossTourSteps, employeeTourSteps } from '../tutorials';

const TITLES: Record<string, string> = {
  'sa-clients': 'Gestión de Clientes',
  'sa-database': 'Base de Datos Maestro',
  'sa-chat': 'Chat de Soporte',
  'sa-broadcast': 'Canal de Difusión',
  'boss-dashboard': 'Dashboard de Control',
  'boss-remark': 'Remarcación Masiva',
  'boss-products': 'Gestión de Artículos',
  'boss-reception': 'Recepción de Mercadería',
  'boss-credits': 'Fiados y Alertas de Cobro',
  'boss-chat': 'Chat Interno',
  'boss-tasks': 'Tareas de Reposición',
  'boss-employees': 'Gestión de Empleados',
  'boss-stock-history': 'Movimientos de Stock',
  'emp-pos': 'Punto de Venta',
  'emp-history': 'Historial del Turno',
  'emp-chat': 'Chat con el Jefe',
  'emp-tasks': 'Tareas Pendientes',
  'emp-cash-close': 'Cierre de Caja',
};

interface TopBarProps {
  view: string;
  onOpenSidebar: () => void;
}

export function TopBar({ view, onOpenSidebar }: TopBarProps) {
  const { currentUser, currentTenant, warnings } = useApp();
  const { signOut } = useAuth();
  const [tourOpen, setTourOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const title = TITLES[view] ?? 'Produsave';

  const tourSteps =
    currentUser.role === 'superadmin' ? superAdminTourSteps :
    currentUser.role === 'boss' ? bossTourSteps :
    employeeTourSteps;

  return (
    <>
      <header className="h-14 sm:h-16 shrink-0 flex items-center gap-2 sm:gap-4 px-3 sm:px-6 bg-white dark:bg-discord-dark border-b border-black/10 dark:border-white/5">
        {/* Mobile menu button */}
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 -ml-1 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>

        <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex-1 truncate min-w-0">
          {title}
        </h1>

        {/* Search - hidden on mobile */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-black/30 text-gray-400 text-sm w-48 lg:w-64">
          <Search size={15} />
          <input
            placeholder="Buscar..."
            className="bg-transparent outline-none flex-1 text-gray-700 dark:text-gray-200 placeholder-gray-400"
          />
        </div>

        {/* Tutorial button */}
        <button
          onClick={() => setTourOpen(true)}
          data-tour="tutorial-btn"
          className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-[#5865F2]/10 hover:bg-[#5865F2]/20 text-[#5865F2] transition text-sm font-semibold shrink-0"
          title="Ver tutorial interactivo"
        >
          <GraduationCap size={16} />
          <span className="hidden sm:inline">Tutorial</span>
        </button>

        {warnings.length > 0 && (
          <div className="relative shrink-0">
            <Bell size={18} className="text-amber-500 animate-pulse-soft" />
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
              {warnings.length}
            </span>
          </div>
        )}

        <div data-tour="theme-toggle" className="shrink-0">
          <ThemeToggle />
        </div>

        <div className="relative shrink-0" data-tour="user-menu">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-black/10 dark:border-white/10"
          >
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: currentUser.avatarColor }}
            >
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                {currentUser.name}
              </p>
              <p className="text-[11px] text-gray-500 leading-tight">
                {currentTenant ? currentTenant.name : 'Produsave HQ'}
              </p>
            </div>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/10 shadow-xl z-50 py-2">
                <div className="px-4 py-2 border-b border-black/5 dark:border-white/5">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{currentUser.name}</p>
                  <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); setTourOpen(true); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition"
                >
                  <GraduationCap size={15} /> Ver tutorial
                </button>
                <button
                  onClick={() => { setMenuOpen(false); signOut(); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition"
                >
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <GuidedTour steps={tourSteps} open={tourOpen} onClose={() => setTourOpen(false)} />
    </>
  );
}
