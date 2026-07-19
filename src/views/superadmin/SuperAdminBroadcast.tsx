import { useState } from 'react';
import { Megaphone, Plus, AlertCircle } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';

export function SuperAdminBroadcast() {
  const { broadcastMessages, addBroadcast, currentUser } = useApp();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!title || !message) return;
    addBroadcast(title, message);
    setTitle(''); setMessage('');
    setOpen(false);
  };

  const isSuperAdmin = currentUser.role === 'superadmin';

  return (
    <div className="view-enter space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Megaphone size={20} className="text-brand" /> Canal de Difusión Obligatorio
          </h3>
          <p className="text-xs text-gray-400">Avisos oficiales de Produsave visibles para todos los negocios</p>
        </div>
        {isSuperAdmin && (
          <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl btn-brand font-semibold text-sm">
            <Plus size={16} /> Nuevo Aviso
          </button>
        )}
      </div>

      {!isSuperAdmin && (
        <div className="p-3 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/20 flex items-center gap-2 text-sm text-gray-500">
          <AlertCircle size={16} className="text-brand" /> Solo el Super Admin puede enviar mensajes en este canal.
        </div>
      )}

      <div className="space-y-3">
        {broadcastMessages.map((b) => (
          <div key={b.id} className="p-4 rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#5865F2]/15 flex items-center justify-center shrink-0">
                <Megaphone size={18} className="text-brand" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900 dark:text-white">{b.title}</p>
                  <Badge color="blurple">Oficial</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{b.message}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(b.createdAt).toLocaleString('es-AR')}</p>
              </div>
            </div>
          </div>
        ))}
        {broadcastMessages.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">No hay avisos publicados.</div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo aviso de difusión">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="Mantenimiento programado" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Mensaje</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="input min-h-[100px] resize-none" placeholder="Contenido del aviso..." />
          </div>
          <button onClick={handleSend} disabled={!title || !message} className="w-full py-2.5 rounded-xl btn-brand font-semibold disabled:opacity-40">
            Publicar aviso
          </button>
        </div>
        <style>{`.input{width:100%;padding:.625rem .75rem;border-radius:.75rem;background:rgba(0,0,0,.05);border:1px solid rgba(0,0,0,.1);color:inherit;outline:none}.dark .input{background:rgba(0,0,0,.3);border-color:rgba(255,255,255,.1);color:#fff}`}</style>
      </Modal>
    </div>
  );
}
