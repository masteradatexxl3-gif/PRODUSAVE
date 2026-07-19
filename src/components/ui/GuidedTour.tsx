import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Sparkles, CheckCircle } from 'lucide-react';

export interface TourStep {
  title: string;
  body: string;
  highlightSelector?: string;
}

interface Props {
  steps: TourStep[];
  open: boolean;
  onClose: () => void;
}

export function GuidedTour({ steps, open, onClose }: Props) {
  const [current, setCurrent] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  const step = steps[current];

  const updateHighlight = useCallback(() => {
    if (!step?.highlightSelector) {
      setHighlightRect(null);
      return;
    }
    const el = document.querySelector(step.highlightSelector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightRect(el.getBoundingClientRect());
    } else {
      setHighlightRect(null);
    }
  }, [step]);

  useEffect(() => {
    if (open) {
      setCurrent(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    updateHighlight();
    const handler = () => updateHighlight();
    window.addEventListener('scroll', handler);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler);
      window.removeEventListener('resize', handler);
    };
  }, [open, current, updateHighlight]);

  if (!open || !step) return null;

  const isFirst = current === 0;
  const isLast = current === steps.length - 1;

  const tooltipStyle: React.CSSProperties = highlightRect
    ? {
        position: 'fixed',
        top: highlightRect.bottom + 12,
        left: Math.min(
          Math.max(16, highlightRect.left + highlightRect.width / 2 - 200),
          window.innerWidth - 416
        ),
        width: '400px',
      }
    : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '440px',
        maxWidth: 'calc(100vw - 32px)',
      };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[100] pointer-events-none">
        {/* Dark overlay with cutout for highlight */}
        {highlightRect ? (
          <>
            <div
              className="fixed inset-0 bg-black/60 transition-all"
              style={{
                clipPath: `polygon(
                  0 0, 100% 0, 100% 100%, 0 100%,
                  0 ${highlightRect.top - 8}px,
                  ${highlightRect.left - 8}px ${highlightRect.top - 8}px,
                  ${highlightRect.left - 8}px ${highlightRect.bottom + 8}px,
                  ${highlightRect.right + 8}px ${highlightRect.bottom + 8}px,
                  ${highlightRect.right + 8}px ${highlightRect.top - 8}px,
                  0 ${highlightRect.top - 8}px
                )`,
              }}
            />
            <div
              className="fixed border-2 border-[#5865F2] rounded-xl transition-all pointer-events-none"
              style={{
                top: highlightRect.top - 8,
                left: highlightRect.left - 8,
                width: highlightRect.width + 16,
                height: highlightRect.height + 16,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
              }}
            />
          </>
        ) : (
          <div className="fixed inset-0 bg-black/60" />
        )}
      </div>

      {/* Tooltip */}
      <div
        style={tooltipStyle}
        className="fixed z-[101] rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/10 shadow-2xl pointer-events-auto animate-tour-pop"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#5865F2]/15 flex items-center justify-center">
              <Sparkles size={14} className="text-[#5865F2]" />
            </div>
            <span className="text-xs font-semibold text-gray-400">
              Paso {current + 1} de {steps.length}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 transition">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pb-4">
          <h3 className="font-bold text-gray-900 dark:text-white text-base mb-2">{step.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{step.body}</p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 pb-3">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === current ? 'w-6 bg-[#5865F2]' : i < current ? 'w-1.5 bg-[#5865F2]/50' : 'w-1.5 bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 pt-2 border-t border-black/5 dark:border-white/5">
          <button
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition font-semibold"
          >
            Saltar tutorial
          </button>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={() => setCurrent((c) => c - 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-500 hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                <ChevronLeft size={14} /> Atrás
              </button>
            )}
            {isLast ? (
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition"
              >
                <CheckCircle size={14} /> Listo
              </button>
            ) : (
              <button
                onClick={() => setCurrent((c) => c + 1)}
                className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-[#5865F2] text-white text-sm font-bold hover:bg-[#4752c4] transition"
              >
                Siguiente <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tour-pop {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-tour-pop { animation: tour-pop 0.25s ease-out; }
      `}</style>
    </>
  );
}
