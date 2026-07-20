import { useState, useRef } from 'react';
import { Megaphone, Plus, AlertCircle, Image as ImageIcon, Video, X, Send } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';

export function SuperAdminBroadcast() {
  const { broadcastMessages, addBroadcast, currentUser } = useApp();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const isSuperAdmin = currentUser.role === 'superadmin';

  const handleSend = () => {
    if (!title || !message) return;
    const fullMessage = mediaUrl ? `${message}\n\n[media:${mediaType}:${mediaUrl}]` : message;
    addBroadcast(title, fullMessage);
    setTitle(''); setMessage(''); setMediaUrl(null); setMediaType(null);
    setOpen(false);
  };

  const handleFileSelect = (file: File) => {
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setMediaUrl(reader.result as string);
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const parseMedia = (msg: string): { text: string; mediaUrl?: string; mediaType?: 'image' | 'video' } => {
    const match = msg.match(/\[media:(image|video):(.+?)\]/);
    if (match) {
      return { text: msg.replace(match[0], '').trim(), mediaUrl: match[2], mediaType: match[1] as 'image' | 'video' };
    }
    return { text: msg };
  };

  return (
    <div className="view-enter space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Megaphone size={20} className="text-brand" /> Canal de Difusión
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
          <AlertCircle size={16} className="text-brand" /> Solo el Super Admin puede publicar en este canal. Los Jefes y Empleados pueden ver los mensajes.
        </div>
      )}

      <div className="space-y-3">
        {broadcastMessages.map((b) => {
          const parsed = parseMedia(b.message);
          return (
            <div key={b.id} className="p-4 rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#5865F2]/15 flex items-center justify-center shrink-0">
                  <Megaphone size={18} className="text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{b.title}</p>
                    <Badge color="blurple">Oficial</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{parsed.text}</p>
                  {parsed.mediaUrl && parsed.mediaType === 'image' && (
                    <img src={parsed.mediaUrl} alt={b.title} className="mt-3 rounded-xl max-h-64 object-cover border border-black/10 dark:border-white/10" />
                  )}
                  {parsed.mediaUrl && parsed.mediaType === 'video' && (
                    <video src={parsed.mediaUrl} controls className="mt-3 rounded-xl max-h-64 border border-black/10 dark:border-white/10" />
                  )}
                  <p className="text-xs text-gray-400 mt-2">{new Date(b.createdAt).toLocaleString('es-AR')}</p>
                </div>
              </div>
            </div>
          );
        })}
        {broadcastMessages.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">No hay avisos publicados.</div>
        )}
      </div>

      <Modal open={open} onClose={() => { setOpen(false); setMediaUrl(null); setMediaType(null); }} title="Nuevo aviso de difusión" maxWidth="max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="Mantenimiento programado" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Mensaje</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="input min-h-[100px] resize-none" placeholder="Contenido del aviso..." />
          </div>

          {/* Media preview */}
          {mediaUrl && (
            <div className="relative rounded-xl overflow-hidden border border-black/10 dark:border-white/10">
              {mediaType === 'image' ? (
                <img src={mediaUrl} alt="preview" className="max-h-48 w-full object-cover" />
              ) : (
                <video src={mediaUrl} className="max-h-48 w-full" controls />
              )}
              <button onClick={() => { setMediaUrl(null); setMediaType(null); }} className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Media upload buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => fileInput.current?.click()}
              disabled={uploading || !!mediaUrl}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10 text-sm font-semibold disabled:opacity-40 transition"
            >
              {uploading ? <span className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin" /> : <ImageIcon size={16} />}
              Imagen
            </button>
            <button
              onClick={() => fileInput.current?.click()}
              disabled={uploading || !!mediaUrl}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10 text-sm font-semibold disabled:opacity-40 transition"
            >
              <Video size={16} /> Video
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,video/mp4,video/webm"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
            />
          </div>

          <button onClick={handleSend} disabled={!title || !message} className="w-full py-2.5 rounded-xl btn-brand font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
            <Send size={16} /> Publicar aviso
          </button>
        </div>
        <style>{`.input{width:100%;padding:.625rem .75rem;border-radius:.75rem;background:rgba(0,0,0,.05);border:1px solid rgba(0,0,0,.1);color:inherit;outline:none}.dark .input{background:rgba(0,0,0,.3);border-color:rgba(255,255,255,.1);color:#fff}`}</style>
      </Modal>
    </div>
  );
}
