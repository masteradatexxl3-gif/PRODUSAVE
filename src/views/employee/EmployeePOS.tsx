import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ScanLine, Trash2, ShoppingCart, AlertTriangle, PackagePlus, Camera } from 'lucide-react';
import { useApp } from '../../store/AppContext';

import { CheckoutModal } from './CheckoutModal';
import { QuickProductModal } from './QuickProductModal';
import { CartItemEditor } from './CartItemEditor';
import { BarcodeCameraModal } from './BarcodeCameraModal';
import { InfoHint } from '../../components/ui/InfoHint';
import type { Product } from '../../types';

export function EmployeePOS() {
  const { products, categories, cart, addToCart, removeFromCart, updateCartItem, currentUser } = useApp();
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<string>('all');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [scanFlash, setScanFlash] = useState<string | null>(null);
  const barcodeBuffer = useRef('');
  const barcodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // USB barcode scanner: detects rapid key inputs ending with Enter
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Skip if user is typing in an input field
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (checkoutOpen || quickOpen || cameraOpen || editingItem !== null) return;

      if (e.key === 'Enter' && barcodeBuffer.current.length >= 4) {
        const code = barcodeBuffer.current;
        const product = products.find((p) => p.barcode === code);
        if (product) {
          addToCart(product);
          setScanFlash(`✓ ${product.name} agregado`);
          setTimeout(() => setScanFlash(null), 1500);
        } else {
          setScanFlash(`✗ Código ${code} no encontrado`);
          setTimeout(() => setScanFlash(null), 2000);
        }
        barcodeBuffer.current = '';
        return;
      }
      if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
        if (barcodeTimer.current) clearTimeout(barcodeTimer.current);
        barcodeTimer.current = setTimeout(() => { barcodeBuffer.current = ''; }, 100);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [products, addToCart, checkoutOpen, quickOpen, cameraOpen, editingItem]);

  const handleCameraScan = (code: string) => {
    const product = products.find((p) => p.barcode === code);
    if (product) addToCart(product);
  };

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = query.toLowerCase();
      const matchQ = p.name.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q) || p.barcode?.includes(query);
      const matchCat = activeCat === 'all' || p.category === activeCat;
      return matchQ && matchCat;
    });
  }, [products, query, activeCat]);

  const subtotal = cart.reduce((a, i) => a + (i.priceOverride ?? i.price) * i.qty, 0);
  const totalItems = cart.reduce((a, i) => a + i.qty, 0);

  return (
    <div className="view-enter flex gap-4 h-[calc(100vh-7rem)]">
      {/* Product grid */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search */}
        <div className="flex gap-2 mb-3">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-black/5 dark:bg-black/30 flex-1" data-tour="pos-search">
            <Search size={18} className="text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o código..."
              className="bg-transparent outline-none flex-1 text-sm text-gray-700 dark:text-gray-200"
            />
          </div>
          <button
            onClick={() => { if (query) { const p = products.find((pr) => pr.barcode === query); if (p) addToCart(p); } }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10 transition text-sm font-semibold"
          >
            <ScanLine size={18} /> Enter
          </button>
          <button
            onClick={() => setCameraOpen(true)}
            data-tour="camera-btn"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10 transition text-sm font-semibold"
          >
            <Camera size={18} /> Cámara
          </button>
          <button
            onClick={() => setQuickOpen(true)}
            data-tour="quick-add"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl btn-brand text-sm font-semibold"
          >
            <PackagePlus size={18} /> Alta rápida
          </button>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          <CatChip active={activeCat === 'all'} onClick={() => setActiveCat('all')} label="Todos" />
          {categories.map((c) => (
            <CatChip key={c.id} active={activeCat === c.name} onClick={() => setActiveCat(c.name)} label={c.name} color={c.color} />
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto pr-1 relative">
          <InfoHint variant="keys" className="mb-3">
            <strong>Atajos:</strong> Escaneá con lector USB (simulado: tipeá un código y presioná Enter) ·
            Click en producto = agregar al carrito · Click en item del carrito = editar cantidad/precio
          </InfoHint>
          {scanFlash && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-xl bg-[#5865F2] text-white text-sm font-semibold shadow-lg animate-fade-in">
              {scanFlash}
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} onAdd={() => addToCart(p)} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              No se encontraron productos.
            </div>
          )}
        </div>
      </div>

      {/* Cart */}
      <div className="w-80 shrink-0 flex flex-col rounded-2xl bg-white dark:bg-discord-mid border border-black/10 dark:border-white/5 overflow-hidden" data-tour="cart-area">
        <div className="p-4 border-b border-black/10 dark:border-white/5">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingCart size={18} className="text-brand" /> Ticket actual
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Cajero: {currentUser.name}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
              <ShoppingCart size={32} className="opacity-30" />
              <p>El carrito está vacío</p>
              <p className="text-xs">Tocá un producto para agregarlo</p>
            </div>
          )}
          {cart.map((item, idx) => (
            <div
              key={idx}
              onClick={() => setEditingItem(idx)}
              className={`p-3 rounded-xl cursor-pointer transition border ${
                item.warning
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-black/[0.02] dark:bg-white/5 border-transparent hover:border-black/10 dark:hover:border-white/10'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">${(item.priceOverride ?? item.price).toLocaleString()} × {item.qty}</p>
                  {item.warning && (
                    <p className="text-[10px] text-amber-500 flex items-center gap-1 mt-1"><AlertTriangle size={10} /> Precio modificado</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">${((item.priceOverride ?? item.price) * item.qty).toLocaleString()}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFromCart(idx); }}
                    className="text-gray-400 hover:text-red-400 mt-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="p-4 border-t border-black/10 dark:border-white/5 space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Artículos: {totalItems}</span>
            <span>Subtotal: ${subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">${subtotal.toLocaleString()}</span>
          </div>
          <button
            onClick={() => setCheckoutOpen(true)}
            disabled={cart.length === 0}
            data-tour="checkout-btn"
            className="w-full py-3 rounded-xl btn-brand font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Armar Cobro
          </button>
        </div>
      </div>

      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} total={subtotal} />
      <QuickProductModal open={quickOpen} onClose={() => setQuickOpen(false)} />
      <BarcodeCameraModal open={cameraOpen} onClose={() => setCameraOpen(false)} onScan={handleCameraScan} />
      <CartItemEditor
        index={editingItem}
        item={editingItem !== null ? cart[editingItem] : null}
        onClose={() => setEditingItem(null)}
        onUpdate={(updates) => editingItem !== null && updateCartItem(editingItem, updates)}
        onRemove={() => editingItem !== null && removeFromCart(editingItem)}
      />
    </div>
  );
}

function CatChip({ active, onClick, label, color }: { active: boolean; onClick: () => void; label: string; color?: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
        active ? 'text-white' : 'bg-black/5 dark:bg-white/5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
      }`}
      style={active ? { backgroundColor: color ?? 'var(--brand-primary)' } : undefined}
    >
      {label}
    </button>
  );
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  const lowStock = product.stock < product.minStock;
  return (
    <button
      onClick={onAdd}
      className="p-3 rounded-2xl bg-white dark:bg-discord-dark border border-black/10 dark:border-white/5 hover:border-brand hover:shadow-lg transition text-left group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-lg">
          📦
        </div>
        {lowStock && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 font-bold">STOCK</span>}
      </div>
      <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight line-clamp-2 min-h-[2.5rem]">{product.name}</p>
      <p className="text-xs text-gray-400 mt-1">{product.brand}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-lg font-bold text-brand">${product.price}</span>
        <span className="text-[10px] text-gray-400">{product.stock}u</span>
      </div>
    </button>
  );
}
