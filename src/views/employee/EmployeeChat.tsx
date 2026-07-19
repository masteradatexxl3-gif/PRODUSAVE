import { useApp } from '../../store/AppContext';
import { ChatPanel, type ExtraChannel } from '../../components/ChatPanel';

export function EmployeeChat() {
  const { threads } = useApp();

  const extraChannels: ExtraChannel[] = [
    {
      id: 'channel-broadcast',
      title: 'Canal de Difusión',
      subtitle: 'Avisos oficiales de Produsave',
      icon: 'broadcast',
      readOnly: true,
    },
    {
      id: 'channel-support',
      title: 'Soporte Técnico',
      subtitle: 'Contactar al equipo de Produsave',
      icon: 'support',
    },
  ];

  return <ChatPanel threads={threads} title="Chat y Soporte" canQuickReply={false} extraChannels={extraChannels} />;
}
