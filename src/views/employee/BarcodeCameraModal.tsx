import { useState, useRef, useEffect } from 'react';
import { ScanLine, Check } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Modal } from '../../components/ui/Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export function BarcodeCameraModal({ open, onClose, onScan }: Props) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'barcode-camera-container';

  useEffect(() => {
    if (!open) return;
    let mounted = true;

    const startScan = async () => {
      try {
        setError(null);
        setScanning(true);
        const html5Qr = new Html5Qrcode(containerId);
        scannerRef.current = html5Qr;
        await html5Qr.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            if (!mounted) return;
            setLastScan(decodedText);
            onScan(decodedText);
            html5Qr.stop().then(() => html5Qr.clear()).catch(() => {});
            setScanning(false);
            setTimeout(() => onClose(), 800);
          },
          () => {}
        );
      } catch (e) {
        setError('No se pudo acceder a la cámara. Verificá los permisos del navegador.');
        setScanning(false);
      }
    };

    startScan();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => scannerRef.current?.clear()).catch(() => {});
      }
    };
  }, [open, onClose, onScan]);

  return (
    <Modal open={open} onClose={onClose} title="Escanear con Cámara">
      <div className="space-y-4">
        {error ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400 text-center">
            {error}
          </div>
        ) : lastScan ? (
          <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center gap-2">
            <Check size={32} className="text-emerald-400" />
            <p className="text-sm font-semibold text-emerald-400">Código detectado</p>
            <p className="text-lg font-mono text-gray-900 dark:text-white">{lastScan}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div id={containerId} className="w-full max-w-sm rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center" />
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <ScanLine size={16} className={scanning ? 'text-brand animate-pulse' : ''} />
              {scanning ? 'Escaneando...' : 'Iniciando cámara...'}
            </div>
            <p className="text-xs text-gray-500">Apuntá la cámara trasera al código de barras del producto</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
