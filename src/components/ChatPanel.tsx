import { useState, useRef, useEffect } from 'react';
import { Send, Plus, X, MessageSquare, Circle, Clock, ChevronLeft, Megaphone, LifeBuoy, Lock } from 'lucide-react';
import { useApp } from '../store/AppContext';
import type { ChatThread } from '../types';

export interface ExtraChannel {
  id: string;
  title: string;
  subtitle: string;
  icon: 'broadcast' | 'support';
  readOnly?: boolean;
  supportNote?: string;
}

interface ChatPanelProps {
  threads: ChatThread[];
  title: string;
  canQuickReply: boolean;
  extraChannels?: ExtraChannel[];
}

export function ChatPanel({ threads, title, canQuickReply, extraChannels = [] }: ChatPanelProps) {
  const { messages, sendMessage, quickReplies, addQuickReply, currentUser, broadcastMessages, profiles } = useApp();
  const [activeId, setActiveId] = useState<string | null>(extraChannels[0]?.id ?? threads[0]?.id ?? null);
  const [draft, setDraft] = useState('');
  const [showQuick, setShowQuick] = useState(false);
  const [newReply, setNewReply] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isExtraChannel = extraChannels.some((c) => c.id === activeId);
  const extraChannel = extraChannels.find((c) => c.id === activeId);
  const superAdmin = profiles.find((p) => p.role === 'superadmin');
  const supportThreadId = superAdmin ? `thread-${superAdmin.id}` : '';
  const thread = threads.find((t) => t.id === activeId);
  const isSupport = isExtraChannel && extraChannel?.icon === 'support';
  const isBroadcast = isExtraChannel && extraChannel?.icon === 'broadcast';
  const threadMessages = activeId && !isExtraChannel
    ? messages[activeId] ?? []
    : isSupport && supportThreadId
      ? messages[supportThreadId] ?? []
      : [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [threadMessages.length, activeId, broadcastMessages.length]);

  const handleSend = () => {
    if (!draft.trim() || !activeId) return;
    if (isExtraChannel) {
      if (extraChannel?.icon === 'support') {
        const superAdmin = profiles.find((p) => p.role === 'superadmin');
        if (superAdmin) sendMessage(`thread-${superAdmin.id}`, draft.trim());
      }
      setDraft('');
      return;
    }
    sendMessage(activeId, draft.trim());
    setDraft('');
  };

  const handleQuickSend = (text: string) => {
    if (!activeId || isExtraChannel) return;
    sendMessage(activeId, text, true);
  };

  const handleAddReply = () => {
    if (!newReply.trim()) return;
    addQuickReply(newReply.trim());
    setNewReply('');
  };

  const handleSelect = (id: string) => {
    setActiveId(id);
    setMobileShowChat(true);
  };

  const handleBack = () => {
    setMobileShowChat(false);
  };

  const renderChannelIcon = (icon: string) => {
    if (icon === 'broadcast') return <Megaphone size={18} className="text-amber-400" />;
    if (icon === 'support') return <LifeBuoy size={18} className="text-emerald-400" />;
    return <MessageSquare size={18} className="text-[#5865F2]" />;
  };

  return (
    <div className="view-enter flex h-[calc(100vh-7rem)] sm:h-[calc(100vh-8rem)] rounded-2xl overflow-hidden bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5">
      {/* Thread list */}
      <div
        className={`w-full sm:w-72 shrink-0 flex flex-col bg-discord-darkest dark:bg-discord-darkest bg-gray-900 border-r border-black/40 dark:border-white/5 ${
          mobileShowChat ? 'hidden sm:flex' : 'flex'
        }`}
      >
        <div className="p-4 border-b border-black/30 dark:border-white/5">
          <h2 className="text-white font-bold flex items-center gap-2">
            <MessageSquare size={18} className="text-[#5865F2]" /> {title}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {extraChannels.map((c) => (
            <button
              key={c.id}
              onClick={() => handleSelect(c.id)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition text-left ${
                activeId === c.id ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 shrink-0">
                {renderChannelIcon(c.icon)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{c.title}</p>
                <p className="text-xs text-gray-400 truncate">{c.subtitle}</p>
              </div>
              {c.readOnly && <Lock size={12} className="text-gray-500 shrink-0" />}
            </button>
          ))}

          {extraChannels.length > 0 && threads.length > 0 && (
            <div className="px-2 py-1 mt-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Conversaciones
            </div>
          )}

          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => handleSelect(t.id)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition text-left ${
                activeId === t.id ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: t.avatarColor }}>
                  {t.participantName.charAt(0)}
                </div>
                {t.online && <Circle size={10} className="absolute -bottom-0.5 -right-0.5 text-emerald-400 fill-emerald-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-white text-sm font-semibold truncate">{t.participantName}</p>
                  <span className="text-[10px] text-gray-500 shrink-0">{t.lastTime}</span>
                </div>
                <p className="text-xs text-gray-400 truncate">{t.lastMessage}</p>
                {t.lastSeenAt && (
                  <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                    <Clock size={9} /> Últ. conexión: {new Date(t.lastSeenAt).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
              {t.unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#ED4245] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {t.unread}
                </span>
              )}
            </button>
          ))}

          {extraChannels.length === 0 && threads.length === 0 && (
            <div className="p-6 text-center text-gray-500 text-sm">
              No hay conversaciones todavía.
            </div>
          )}
        </div>
      </div>

      {/* Conversation */}
      <div className={`flex-1 flex flex-col min-w-0 ${mobileShowChat ? 'flex' : 'hidden sm:flex'}`}>
        {/* Broadcast channel */}
        {isBroadcast && (
          <>
            <div className="h-14 flex items-center gap-3 px-4 border-b border-black/10 dark:border-white/5 bg-white dark:bg-discord-dark">
              <button onClick={handleBack} className="sm:hidden p-1.5 rounded-lg text-gray-500 hover:bg-black/5 dark:hover:bg-white/10">
                <ChevronLeft size={18} />
              </button>
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-amber-500/15 shrink-0">
                <Megaphone size={18} className="text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">{extraChannel.title}</p>
                <p className="text-xs text-amber-500/80 flex items-center gap-1">
                  <Lock size={10} /> Solo lectura
                </p>
              </div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-gray-50 dark:bg-discord-dark">
              {broadcastMessages.length === 0 && (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm text-center px-4">
                  No hay avisos oficiales publicados todavía.
                </div>
              )}
              {broadcastMessages.map((b) => (
                <div key={b.id} className="flex justify-start">
                  <div className="max-w-[85%] sm:max-w-[70%] flex flex-col items-start">
                    <p className="text-xs text-amber-500 font-semibold mb-1 px-1 flex items-center gap-1">
                      <Megaphone size={11} /> {b.title}
                    </p>
                    <div className="px-3.5 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-gray-800 dark:text-gray-200 rounded-bl-md">
                      {b.message}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 px-1">
                      {new Date(b.createdAt).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-black/10 dark:border-white/5 bg-amber-500/5 text-center">
              <p className="text-xs text-gray-500 flex items-center justify-center gap-1.5">
                <Lock size={11} /> Canal oficial de Produsave — Solo el Super Admin puede publicar
              </p>
            </div>
          </>
        )}

        {/* Support channel (boss/employee → admin) */}
        {isSupport && (
          <>
            <div className="h-14 flex items-center gap-3 px-4 border-b border-black/10 dark:border-white/5 bg-white dark:bg-discord-dark">
              <button onClick={handleBack} className="sm:hidden p-1.5 rounded-lg text-gray-500 hover:bg-black/5 dark:hover:bg-white/10">
                <ChevronLeft size={18} />
              </button>
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-emerald-500/15 shrink-0">
                <LifeBuoy size={18} className="text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">{extraChannel.title}</p>
                <p className="text-xs text-emerald-500/80">Soporte técnico de Produsave</p>
              </div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-gray-50 dark:bg-discord-dark">
              {threadMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm text-center px-4 gap-2">
                  <LifeBuoy size={32} className="text-emerald-500/50" />
                  <p>¿Tenés un problema técnico con Produsave?</p>
                  <p className="text-xs">Escribinos acá. Este canal es <strong>solo para soporte técnico</strong> — reportá bugs, errores o consultas del sistema.</p>
                </div>
              )}
              {threadMessages.map((m) => {
                const mine = m.senderId === currentUser.id;
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] sm:max-w-[70%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                      {!mine && <p className="text-xs text-gray-400 mb-1 px-1">{m.senderName}</p>}
                      <div className={`px-3.5 py-2.5 rounded-2xl text-sm ${mine ? 'bg-[#5865F2] text-white rounded-br-md' : 'bg-white dark:bg-discord-mid text-gray-800 dark:text-gray-200 rounded-bl-md border border-black/5 dark:border-white/5'}`}>
                        {m.text}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 px-1">{m.createdAt}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-black/10 dark:border-white/5 bg-white dark:bg-discord-dark">
              <div className="px-3 pt-2 pb-1">
                <p className="text-[11px] text-gray-500 flex items-center gap-1">
                  <LifeBuoy size={11} className="text-emerald-500" /> Canal exclusivo de soporte técnico
                </p>
              </div>
              <div className="flex items-center gap-2 p-3 pt-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Describí el problema técnico..."
                  className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 rounded-xl bg-black/5 dark:bg-black/30 text-sm text-gray-700 dark:text-white outline-none border border-black/10 dark:border-white/10"
                />
                <button onClick={handleSend} className="p-2.5 rounded-xl btn-brand shrink-0">
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Regular thread */}
        {!isExtraChannel && thread && (
          <>
            <div className="h-14 flex items-center gap-3 px-4 border-b border-black/10 dark:border-white/5 bg-white dark:bg-discord-dark">
              <button onClick={handleBack} className="sm:hidden p-1.5 rounded-lg text-gray-500 hover:bg-black/5 dark:hover:bg-white/10">
                <ChevronLeft size={18} />
              </button>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: thread.avatarColor }}>
                {thread.participantName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">{thread.participantName}</p>
                <p className="text-xs flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${thread.online ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                  <span className={thread.online ? 'text-emerald-400' : 'text-gray-400'}>
                    {thread.online ? 'En línea' : 'Desconectado'}
                  </span>
                </p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-gray-50 dark:bg-discord-dark">
              {threadMessages.length === 0 && (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm text-center px-4">
                  No hay mensajes. Iniciá la conversación.
                </div>
              )}
              {threadMessages.map((m) => {
                const mine = m.senderId === currentUser.id;
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] sm:max-w-[70%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                      {!mine && <p className="text-xs text-gray-400 mb-1 px-1">{m.senderName}</p>}
                      <div className={`px-3.5 py-2.5 rounded-2xl text-sm ${mine ? 'bg-[#5865F2] text-white rounded-br-md' : 'bg-white dark:bg-discord-mid text-gray-800 dark:text-gray-200 rounded-bl-md border border-black/5 dark:border-white/5'}`}>
                        {m.text}
                        {m.quick && <span className="block text-[10px] opacity-70 mt-1">⚡ Mensaje rápido</span>}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 px-1">{m.createdAt}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {canQuickReply && (
              <div className="border-t border-black/10 dark:border-white/5 bg-white dark:bg-discord-dark">
                {showQuick && (
                  <div className="p-3 border-b border-black/10 dark:border-white/5 animate-slide-up">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-gray-500 uppercase">Mensajes Rápidos</p>
                      <button onClick={() => setShowQuick(false)} className="text-gray-400 hover:text-gray-200">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {quickReplies.map((q) => (
                        <button key={q.id} onClick={() => handleQuickSend(q.text)} className="px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 text-xs text-gray-700 dark:text-gray-200 hover:bg-[#5865F2]/15 hover:text-[#5865F2] transition">
                          {q.text}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input value={newReply} onChange={(e) => setNewReply(e.target.value)} placeholder="Nuevo mensaje rápido..." className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-black/5 dark:bg-black/30 text-sm text-gray-700 dark:text-white outline-none border border-black/10 dark:border-white/10" />
                      <button onClick={handleAddReply} className="px-3 py-1.5 rounded-lg btn-brand text-sm font-semibold shrink-0">Guardar</button>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 p-3">
                  <button onClick={() => setShowQuick((v) => !v)} className={`p-2.5 rounded-xl transition shrink-0 ${showQuick ? 'bg-[#5865F2] text-white' : 'bg-black/5 dark:bg-white/5 text-gray-500 hover:text-gray-300'}`} title="Mensajes rápidos">
                    <Plus size={18} />
                  </button>
                  <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Escribí un mensaje..." className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 rounded-xl bg-black/5 dark:bg-black/30 text-sm text-gray-700 dark:text-white outline-none border border-black/10 dark:border-white/10" />
                  <button onClick={handleSend} className="p-2.5 rounded-xl btn-brand shrink-0">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            )}

            {!canQuickReply && (
              <div className="flex items-center gap-2 p-3 border-t border-black/10 dark:border-white/5 bg-white dark:bg-discord-dark">
                <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Escribí un mensaje..." className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 rounded-xl bg-black/5 dark:bg-black/30 text-sm text-gray-700 dark:text-white outline-none border border-black/10 dark:border-white/10" />
                <button onClick={handleSend} className="p-2.5 rounded-xl btn-brand shrink-0">
                  <Send size={18} />
                </button>
              </div>
            )}
          </>
        )}

        {!isExtraChannel && !thread && (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm px-4 text-center">
            Seleccioná una conversación
          </div>
        )}
      </div>
    </div>
  );
}
