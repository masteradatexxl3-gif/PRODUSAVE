import { useApp } from '../../store/AppContext';
import { ChatPanel } from '../../components/ChatPanel';

export function SuperAdminChat() {
  const { threads } = useApp();
  // Solo mostrar conversaciones con Jefes (Dueños de negocios) - soporte técnico
  const supportThreads = threads.filter((t) => t.participantRole === 'boss');
  return <ChatPanel threads={supportThreads} title="Soporte Global" canQuickReply />;
}
