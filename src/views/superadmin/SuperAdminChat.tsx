import { useApp } from '../../store/AppContext';
import { ChatPanel } from '../../components/ChatPanel';

export function SuperAdminChat() {
  const { threads } = useApp();
  // Solo mostrar conversaciones con jefes y empleados (soporte técnico)
  const supportThreads = threads.filter((t) => t.participantRole !== 'superadmin');
  return <ChatPanel threads={supportThreads} title="Soporte Global" canQuickReply />;
}
