import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './store/AuthContext';
import { AppProvider, useApp } from './store/AppContext';
import { Sidebar, type ViewId } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { WarningToasts } from './components/WarningToasts';
import { LoginScreen } from './views/LoginScreen';
import { SuperAdminClients } from './views/superadmin/SuperAdminClients';
import { SuperAdminDatabase } from './views/superadmin/SuperAdminDatabase';
import { SuperAdminChat } from './views/superadmin/SuperAdminChat';
import { SuperAdminBroadcast } from './views/superadmin/SuperAdminBroadcast';
import { BossDashboard } from './views/boss/BossDashboard';
import { BossRemark } from './views/boss/BossRemark';
import { BossProducts } from './views/boss/BossProducts';
import { BossReception } from './views/boss/BossReception';
import { BossCredits } from './views/boss/BossCredits';
import { BossChat } from './views/boss/BossChat';
import { BossTasks } from './views/boss/BossTasks';
import { BossEmployees } from './views/boss/BossEmployees';
import { BossStockHistory } from './views/boss/BossStockHistory';
import { EmployeePOS } from './views/employee/EmployeePOS';
import { EmployeeHistory } from './views/employee/EmployeeHistory';
import { EmployeeChat } from './views/employee/EmployeeChat';
import { EmployeeTasks } from './views/employee/EmployeeTasks';
import { EmployeeCashClose } from './views/employee/EmployeeCashClose';
import { Loader2 } from 'lucide-react';

function Shell() {
  const { user: authUser, loading: authLoading } = useAuth();
  const { role, currentTenant, theme, loading: appLoading } = useApp();
  const [view, setView] = useState<ViewId>(
    role === 'superadmin' ? 'sa-clients' : role === 'boss' ? 'boss-dashboard' : 'emp-pos'
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setView(role === 'superadmin' ? 'sa-clients' : role === 'boss' ? 'boss-dashboard' : 'emp-pos');
  }, [role]);

  useEffect(() => {
    const root = document.documentElement;
    if (currentTenant && role !== 'superadmin') {
      root.style.setProperty('--brand-primary', currentTenant.branding.primary);
      root.style.setProperty('--brand-accent', currentTenant.branding.accent);
    } else {
      root.style.setProperty('--brand-primary', '#5865F2');
      root.style.setProperty('--brand-accent', '#5865F2');
    }
  }, [currentTenant, role]);

  const renderView = () => {
    switch (view) {
      case 'sa-clients': return <SuperAdminClients />;
      case 'sa-database': return <SuperAdminDatabase />;
      case 'sa-chat': return <SuperAdminChat />;
      case 'sa-broadcast': return <SuperAdminBroadcast />;
      case 'boss-dashboard': return <BossDashboard />;
      case 'boss-remark': return <BossRemark />;
      case 'boss-products': return <BossProducts />;
      case 'boss-reception': return <BossReception />;
      case 'boss-credits': return <BossCredits />;
      case 'boss-chat': return <BossChat />;
      case 'boss-tasks': return <BossTasks />;
      case 'boss-stock-history': return <BossStockHistory />;
      case 'boss-employees': return <BossEmployees />;
      case 'emp-pos': return <EmployeePOS />;
      case 'emp-history': return <EmployeeHistory />;
      case 'emp-chat': return <EmployeeChat />;
      case 'emp-tasks': return <EmployeeTasks />;
      case 'emp-cash-close': return <EmployeeCashClose />;
      default: return null;
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-discord-darkest">
        <Loader2 size={32} className="text-[#5865F2] animate-spin" />
      </div>
    );
  }

  if (!authUser) return <LoginScreen />;

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-discord-darkest' : 'bg-gray-100'}`}>
      <Sidebar
        view={view}
        setView={setView}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar view={view} onOpenSidebar={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {appLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <div className="w-10 h-10 rounded-full border-4 border-[#5865F2]/20 border-t-[#5865F2] animate-spin" />
                <p className="text-sm">Cargando datos de Supabase...</p>
              </div>
            </div>
          ) : renderView()}
        </main>
      </div>
      <WarningToasts />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </AuthProvider>
  );
}
