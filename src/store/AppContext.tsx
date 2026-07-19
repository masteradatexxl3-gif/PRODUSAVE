import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type {
  Role,
  Theme,
  Tenant,
  Product,
  Sale,
  CreditAccount,
  Reception,
  ChatMessage,
  ChatThread,
  Category,
  User,
  Shift,
  CartItem,
  QuickReply,
  Task,
  BroadcastMessage,
  StockMovement,
  CashClose,
  Plan,
} from '../types';

// ---- DB row types ----
interface TenantRow {
  id: string; name: string; slug: string; logo_url: string | null;
  primary_color: string; accent_color: string; logo_emoji: string | null;
  status: string; plan: string; subscription_expires_at: string | null; created_at: string;
}
interface ProductRow {
  id: string; tenant_id: string; category_id: string | null; name: string;
  brand: string | null; barcode: string | null; cost_price: number;
  sale_price: number; weight: string | null; stock: number; min_stock: number;
  warehouse_stock: number; published_stock: number; created_at: string;
}
interface CategoryRow { id: string; tenant_id: string; name: string; created_at: string; }
interface ReceptionRow {
  id: string; tenant_id: string; supplier: string; remito: string | null;
  items: { name: string; qty: number; cost: number }[]; total: number;
  status: string; received_at: string;
}
interface QuickReplyRow { id: string; text: string; created_at: string; }
interface ProfileRow {
  id: string; tenant_id: string | null; name: string; role: string;
  active: boolean; last_seen_at: string | null; created_at: string;
}
interface TaskRow {
  id: string; tenant_id: string; product_id: string; quantity: number;
  assigned_to: string | null; created_by: string; status: string;
  completed_at: string | null; created_at: string;
}
interface BroadcastRow { id: string; title: string; message: string; created_at: string; }
interface ChatMsgRow {
  id: string; tenant_id: string | null; sender_id: string; receiver_id: string;
  message: string; created_at: string;
}
interface StockMovementRow {
  id: string; tenant_id: string; product_id: string | null; product_name: string;
  type: string; quantity: number; user_id: string | null; user_name: string; created_at: string;
}
interface CashCloseRow {
  id: string; tenant_id: string; profile_id: string; type: string;
  opening_cash: number; counted_cash: number; expected_cash: number;
  card_total: number; transfer_total: number; qr_total: number;
  difference: number; notes: string | null; created_at: string;
}
interface SaleItemRow {
  id: string; sale_id: string; product_id: string | null; quantity: number;
  price_at_sale: number; original_price: number;
}

// ---- Adapters ----
const mapTenant = (r: TenantRow): Tenant => ({
  id: r.id, name: r.name, ownerName: '', email: '', phone: '',
  plan: (r.plan === 'pro' || r.plan === 'enterprise' ? r.plan : 'version_de_prueba') as Plan,
  status: (r.status === 'active' ? 'active' : r.status === 'suspended' ? 'suspended' : 'paused') as Tenant['status'],
  employeeCount: 0, createdAt: r.created_at, monthlyRevenue: 0,
  subscriptionExpiresAt: r.subscription_expires_at,
  branding: { primary: r.primary_color, accent: r.accent_color, logoText: r.name, logoEmoji: r.logo_emoji ?? '🛒', logoUrl: r.logo_url },
});
const mapProduct = (r: ProductRow, cats: Category[]): Product => ({
  id: r.id, tenantId: r.tenant_id, name: r.name, brand: r.brand ?? '',
  category: cats.find((c) => c.id === r.category_id)?.name ?? 'Sin categoría',
  cost: r.cost_price, price: r.sale_price, stock: r.published_stock || r.stock,
  minStock: r.min_stock, warehouseStock: r.warehouse_stock, publishedStock: r.published_stock,
  weight: r.weight ?? undefined, barcode: r.barcode ?? '', createdAt: r.created_at,
});
const mapCategory = (r: CategoryRow): Category => ({ id: r.id, tenantId: r.tenant_id, name: r.name, color: '#5865F2' });
const mapReception = (r: ReceptionRow): Reception => ({
  id: r.id, tenantId: r.tenant_id, supplier: r.supplier, remito: r.remito ?? '',
  items: r.items, total: r.total, receivedAt: r.received_at, status: r.status as Reception['status'],
});
const mapQuickReply = (r: QuickReplyRow): QuickReply => ({ id: r.id, text: r.text });
const mapProfile = (r: ProfileRow, email: string): User => ({
  id: r.id, tenantId: r.tenant_id ?? '', name: r.name, email,
  role: (r.role === 'super_admin' ? 'superadmin' : r.role === 'boss' ? 'boss' : 'employee') as Role,
  avatarColor: '#5865F2', online: !!r.last_seen_at && (Date.now() - new Date(r.last_seen_at).getTime()) < 600000,
  lastSeen: r.last_seen_at ? new Date(r.last_seen_at).toLocaleString('es-AR') : 'Nunca',
  lastSeenAt: r.last_seen_at,
});
const mapTask = (r: TaskRow, productName: string, assignedToName?: string): Task => ({
  id: r.id, tenantId: r.tenant_id, productId: r.product_id, productName,
  quantity: r.quantity, assignedTo: r.assigned_to, assignedToName,
  createdBy: r.created_by, status: r.status as Task['status'],
  completedAt: r.completed_at, createdAt: r.created_at,
});
const mapBroadcast = (r: BroadcastRow): BroadcastMessage => ({
  id: r.id, title: r.title, message: r.message, createdAt: r.created_at,
});
const mapStockMovement = (r: StockMovementRow): StockMovement => ({
  id: r.id, tenantId: r.tenant_id, productId: r.product_id ?? '', productName: r.product_name,
  type: r.type as StockMovement['type'], quantity: r.quantity, userName: r.user_name, createdAt: r.created_at,
});
const mapCashClose = (r: CashCloseRow, employeeName: string): CashClose => ({
  id: r.id, tenantId: r.tenant_id, employeeId: r.profile_id, employeeName,
  type: r.type as CashClose['type'], openingCash: r.opening_cash, countedCash: r.counted_cash,
  expectedCash: r.expected_cash, cardTotal: r.card_total, transferTotal: r.transfer_total,
  qrTotal: r.qr_total, difference: r.difference, notes: r.notes ?? '', createdAt: r.created_at,
});

interface AppContextValue {
  role: Role;
  theme: Theme; toggleTheme: () => void;
  currentUser: User; currentTenant: Tenant | null;
  updateTenantBranding: (tenantId: string, branding: Tenant['branding']) => void;
  tenants: Tenant[]; users: User[]; profiles: User[]; products: Product[]; categories: Category[];
  sales: Sale[]; credits: CreditAccount[]; receptions: Reception[]; shifts: Shift[];
  quickReplies: QuickReply[]; addQuickReply: (text: string) => void;
  cart: CartItem[]; addToCart: (p: Product) => void; updateCartItem: (i: number, it: Partial<CartItem>) => void;
  removeFromCart: (i: number) => void; clearCart: () => void;
  checkout: (method: Sale['paymentMethod'], total: number) => void;
  addProduct: (p: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  massRemark: (ids: string[], percent: number) => void;
  publishToCaja: (productId: string, qty: number) => void;
  addReception: (r: Omit<Reception, 'id' | 'receivedAt'>) => void;
  addCredit: (c: Omit<CreditAccount, 'id'>) => void;
  toggleTenantStatus: (id: string, status: Tenant['status']) => void;
  threads: ChatThread[]; messages: Record<string, ChatMessage[]>;
  sendMessage: (threadId: string, text: string, quick?: boolean) => void;
  warnings: { id: string; text: string; time: string }[];
  pushWarning: (text: string) => void; clearWarning: (id: string) => void;
  loading: boolean;
  tasks: Task[]; addTask: (productId: string, qty: number, assignedTo: string | null) => void;
  completeTask: (id: string) => void;
  broadcastMessages: BroadcastMessage[]; addBroadcast: (title: string, message: string) => void;
  createEmployee: (name: string, email: string, password: string) => Promise<{ error: string | null }>;
  updateLastSeen: () => void;
  planLimit: number;
  stockMovements: StockMovement[]; addCashClose: (c: Omit<CashClose, 'id' | 'createdAt'>) => void;
  cashCloses: CashClose[];
  refreshData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const PLAN_LIMITS: Record<Plan, number> = { version_de_prueba: 2, pro: 5, enterprise: 20 };

export function AppProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth();
  const role = authUser?.role ?? 'employee';
  const [theme, setTheme] = useState<Theme>('dark');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [receptions, setReceptions] = useState<Reception[]>([]);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [profiles, setProfiles] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [broadcastMessages, setBroadcastMessages] = useState<BroadcastMessage[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [cashCloses, setCashCloses] = useState<CashClose[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [credits, setCredits] = useState<CreditAccount[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [warnings, setWarnings] = useState<{ id: string; text: string; time: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const lastSeenTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentUser = useMemo(() => {
    if (authUser) return authUser;
    return {
      id: '', tenantId: '', name: 'Invitado', email: '', role: 'employee' as Role,
      avatarColor: '#5865F2', online: false, lastSeen: 'Nunca', lastSeenAt: null,
    };
  }, [authUser]);

  const currentTenant = useMemo(
    () => (currentUser.role === 'superadmin' ? null : tenants.find((t) => t.id === currentUser.tenantId) ?? null),
    [currentUser, tenants]
  );

  const planLimit = useMemo(() => {
    if (!currentTenant) return 0;
    return PLAN_LIMITS[currentTenant.plan] ?? 2;
  }, [currentTenant]);

  const threads = useMemo((): ChatThread[] => {
    if (!authUser) return [];
    const others = profiles.filter((p) => p.id !== currentUser.id);
    return others.map((p) => ({
      id: `thread-${p.id}`,
      participantName: p.name,
      participantRole: p.role,
      avatarColor: p.avatarColor,
      online: p.online,
      lastMessage: '',
      lastTime: '',
      unread: 0,
      lastSeenAt: p.lastSeenAt,
    }));
  }, [authUser, profiles, currentUser]);

  const loadData = useCallback(async () => {
    if (!authUser) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const isSuperAdmin = authUser.role === 'superadmin';
      const tenantId = authUser.tenantId;

      // Tenants
      const { data: tenantsData } = await supabase.from('tenants').select('*').order('created_at', { ascending: false });
      setTenants((tenantsData ?? []).map(mapTenant));

      // Categories
      let catsQuery = supabase.from('categories').select('*');
      if (!isSuperAdmin) catsQuery = catsQuery.eq('tenant_id', tenantId);
      const { data: catsData } = await catsQuery.order('name');
      const cats = (catsData ?? []).map(mapCategory);
      setCategories(cats);

      // Products
      let prodQuery = supabase.from('products').select('*');
      if (!isSuperAdmin) prodQuery = prodQuery.eq('tenant_id', tenantId);
      const { data: prodData } = await prodQuery.order('created_at', { ascending: false });
      setProducts((prodData ?? []).map((p) => mapProduct(p as ProductRow, cats)));

      // Receptions
      let recQuery = supabase.from('receptions').select('*');
      if (!isSuperAdmin) recQuery = recQuery.eq('tenant_id', tenantId);
      const { data: recData } = await recQuery.order('received_at', { ascending: false });
      setReceptions((recData ?? []).map(mapReception));

      // Quick replies
      const { data: qrData } = await supabase.from('quick_replies').select('*').order('created_at', { ascending: true });
      setQuickReplies((qrData ?? []).map(mapQuickReply));

      // Profiles — include super admins for all users (support channel)
      let profQuery = supabase.from('profiles').select('*');
      if (!isSuperAdmin) profQuery = profQuery.or(`tenant_id.eq.${tenantId},role.eq.super_admin`);
      const { data: profSimple } = await profQuery.order('created_at', { ascending: false });
      let profsToMap = profSimple ?? [];
      if (!isSuperAdmin) profsToMap = profsToMap.filter((p) => p.tenant_id === tenantId || p.role === 'super_admin');
      setProfiles(profsToMap.map((p) => mapProfile(p as ProfileRow, '')));

      // Tasks
      let taskQuery = supabase.from('tasks').select('*');
      if (!isSuperAdmin) taskQuery = taskQuery.eq('tenant_id', tenantId);
      const { data: taskData } = await taskQuery.order('created_at', { ascending: false });
      const tasksMapped = (taskData ?? []).map((t) => {
        const prod = (prodData ?? []).find((p) => p.id === t.product_id);
        const assignee = profsToMap.find((p) => p.id === t.assigned_to);
        return mapTask(t as TaskRow, prod?.name ?? 'Producto eliminado', assignee?.name);
      });
      setTasks(tasksMapped);

      // Broadcast
      const { data: bcData } = await supabase.from('broadcast_messages').select('*').order('created_at', { ascending: false });
      setBroadcastMessages((bcData ?? []).map(mapBroadcast));

      // Stock movements
      let smQuery = supabase.from('stock_movements').select('*');
      if (!isSuperAdmin) smQuery = smQuery.eq('tenant_id', tenantId);
      const { data: smData } = await smQuery.order('created_at', { ascending: false });
      setStockMovements((smData ?? []).map(mapStockMovement));

      // Cash closes
      let ccQuery = supabase.from('cash_closes').select('*');
      if (!isSuperAdmin) ccQuery = ccQuery.eq('tenant_id', tenantId);
      const { data: ccData } = await ccQuery.order('created_at', { ascending: false });
      setCashCloses((ccData ?? []).map((c) => mapCashClose(c as CashCloseRow, profsToMap.find((p) => p.id === (c as CashCloseRow).profile_id)?.name ?? 'Desconocido')));

      // Sales
      let salesQuery = supabase.from('sales').select('*, sale_items(*)');
      if (!isSuperAdmin) salesQuery = salesQuery.eq('tenant_id', tenantId);
      const { data: salesData } = await salesQuery.order('created_at', { ascending: false });
      if (salesData) {
        const salesMapped: Sale[] = salesData.map((s) => {
          const items = ((s as { sale_items?: SaleItemRow[] }).sale_items ?? []).map((si) => ({
            productId: si.product_id ?? '', name: '', price: si.price_at_sale, qty: si.quantity,
          }));
          return {
            id: s.id, tenantId: s.tenant_id, employeeId: s.profile_id,
            employeeName: profsToMap.find((p) => p.id === s.profile_id)?.name ?? 'Desconocido',
            items, total: s.total,
            paymentMethod: (typeof s.payment_method === 'string' ? s.payment_method : 'cash') as Sale['paymentMethod'],
            createdAt: s.created_at, shift: 'mañana',
          };
        });
        setSales(salesMapped);
      }

      // Credits
      let creditQuery = supabase.from('credits').select('*');
      if (!isSuperAdmin) creditQuery = creditQuery.eq('tenant_id', tenantId);
      const { data: creditData } = await creditQuery.order('created_at', { ascending: false });
      setCredits((creditData ?? []).map((c) => ({
        id: c.id, tenantId: c.tenant_id, customerName: c.customer_name,
        phone: c.customer_phone, amount: c.amount, dueDate: c.due_date,
        status: c.status as CreditAccount['status'],
      } as CreditAccount)));

      // Chat messages
      const { data: chatData } = await supabase.from('chat_messages')
        .select('*')
        .or(`sender_id.eq.${authUser.id},receiver_id.eq.${authUser.id}`)
        .order('created_at', { ascending: true });
      if (chatData && chatData.length > 0) {
        const msgMap: Record<string, ChatMessage[]> = {};
        for (const m of chatData as ChatMsgRow[]) {
          const otherId = m.sender_id === authUser.id ? m.receiver_id : m.sender_id;
          const threadId = `thread-${otherId}`;
          if (!msgMap[threadId]) msgMap[threadId] = [];
          const otherProfile = profsToMap.find((p) => p.id === otherId);
          msgMap[threadId].push({
            id: m.id, threadId, senderId: m.sender_id,
            senderName: m.sender_id === authUser.id ? authUser.name : (otherProfile?.name ?? 'Usuario'),
            senderRole: m.sender_id === authUser.id ? authUser.role : (otherProfile?.role ?? 'boss'),
            text: m.message, createdAt: new Date(m.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
          });
        }
        setMessages(msgMap);
      } else {
        setMessages({});
      }
    } catch (e) {
      console.error('Error cargando datos:', e);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  const refreshData = useCallback(() => { loadData(); }, [loadData]);

  useEffect(() => { loadData(); }, [loadData]);

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const updateLastSeen = useCallback(async () => {
    if (!authUser || authUser.role !== 'employee') return;
    await supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', authUser.id);
  }, [authUser]);

  useEffect(() => {
    if (authUser?.role === 'employee') {
      updateLastSeen();
      lastSeenTimer.current = setInterval(updateLastSeen, 30000);
    }
    return () => { if (lastSeenTimer.current) clearInterval(lastSeenTimer.current); };
  }, [authUser, updateLastSeen]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  // ---- Mutations ----
  const updateTenantBranding = async (tenantId: string, branding: Tenant['branding']) => {
    setTenants((prev) => prev.map((t) => (t.id === tenantId ? { ...t, branding } : t)));
    await supabase.from('tenants').update({
      primary_color: branding.primary, accent_color: branding.accent,
      logo_emoji: branding.logoEmoji, name: branding.logoText, logo_url: branding.logoUrl ?? null,
    }).eq('id', tenantId);
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.productId === product.id);
      if (idx >= 0) {
        const copy = [...prev]; copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 }; return copy;
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, qty: 1 }];
    });
  };

  const updateCartItem = (index: number, item: Partial<CartItem>) =>
    setCart((prev) => prev.map((it, i) => (i === index ? { ...it, ...item } : it)));
  const removeFromCart = (index: number) => setCart((prev) => prev.filter((_, i) => i !== index));
  const clearCart = () => setCart([]);

  const pushWarning = (text: string) => {
    const id = `w-${Date.now()}`;
    const time = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    setWarnings((prev) => [...prev, { id, text, time }]);
  };
  const clearWarning = (id: string) => setWarnings((prev) => prev.filter((w) => w.id !== id));

  const checkout = async (method: Sale['paymentMethod'], total: number) => {
    const tenantId = currentUser.tenantId;
    if (!tenantId) return;

    const { data: saleRow, error: saleErr } = await supabase.from('sales').insert({
      tenant_id: tenantId, profile_id: currentUser.id, total,
      payment_method: method, is_fiado: method === 'credit',
    }).select().single();
    if (saleErr || !saleRow) { console.error('Error checkout:', saleErr); return; }

    const saleItems = cart.map((ci) => ({
      sale_id: saleRow.id, product_id: ci.productId, quantity: ci.qty, price_at_sale: ci.price, original_price: ci.price,
    }));
    if (saleItems.length > 0) await supabase.from('sale_items').insert(saleItems);

    for (const ci of cart) {
      const prod = products.find((p) => p.id === ci.productId);
      if (prod) {
        const newStock = Math.max(0, prod.publishedStock - ci.qty);
        await supabase.from('products').update({ published_stock: newStock, stock: newStock }).eq('id', ci.productId);
        await supabase.from('stock_movements').insert({
          tenant_id: tenantId, product_id: ci.productId, product_name: ci.name,
          type: 'sale', quantity: ci.qty, user_id: currentUser.id, user_name: currentUser.name,
        });
      }
    }
    setProducts((prev) => prev.map((p) => {
      const ci = cart.find((c) => c.productId === p.id);
      if (!ci) return p;
      const newStock = Math.max(0, p.publishedStock - ci.qty);
      return { ...p, publishedStock: newStock, stock: newStock };
    }));
    setStockMovements((prev) => [
      ...cart.map((ci) => ({
        id: `sm-${Date.now()}-${ci.productId}`, tenantId, productId: ci.productId, productName: ci.name,
        type: 'sale' as const, quantity: ci.qty, userName: currentUser.name, createdAt: new Date().toISOString(),
      })),
      ...prev,
    ]);
    setCart([]);
    refreshData();
  };

  const addProduct = async (p: Omit<Product, 'id' | 'createdAt'>) => {
    const cat = categories.find((c) => c.name === p.category && c.tenantId === p.tenantId);
    const { data, error } = await supabase.from('products').insert({
      tenant_id: p.tenantId, category_id: cat?.id ?? null,
      name: p.name, brand: p.brand, barcode: p.barcode,
      cost_price: p.cost, sale_price: p.price, weight: p.weight ?? null,
      stock: p.stock, min_stock: p.minStock,
      warehouse_stock: p.warehouseStock ?? 0, published_stock: p.publishedStock ?? p.stock,
    }).select().single();
    if (error) { console.error('Error adding product:', error); return; }
    if (data) setProducts((prev) => [mapProduct(data as ProductRow, categories), ...prev]);
  };

  const updateProduct = async (id: string, p: Partial<Product>) => {
    setProducts((prev) => prev.map((pr) => (pr.id === id ? { ...pr, ...p } : pr)));
    const updates: Record<string, unknown> = {};
    if (p.price !== undefined) updates.sale_price = p.price;
    if (p.cost !== undefined) updates.cost_price = p.cost;
    if (p.stock !== undefined) updates.stock = p.stock;
    if (p.publishedStock !== undefined) updates.published_stock = p.publishedStock;
    if (p.warehouseStock !== undefined) updates.warehouse_stock = p.warehouseStock;
    if (p.name !== undefined) updates.name = p.name;
    if (Object.keys(updates).length > 0) await supabase.from('products').update(updates).eq('id', id);
  };

  const deleteProduct = async (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    await supabase.from('products').delete().eq('id', id);
  };

  const massRemark = async (ids: string[], percent: number) => {
    setProducts((prev) => prev.map((p) =>
      ids.includes(p.id) ? { ...p, price: Math.round(p.price * (1 + percent / 100)) } : p
    ));
    for (const id of ids) {
      const prod = products.find((p) => p.id === id);
      if (prod) await supabase.from('products').update({ sale_price: Math.round(prod.price * (1 + percent / 100)) }).eq('id', id);
    }
  };

  const publishToCaja = async (productId: string, qty: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod || prod.warehouseStock < qty) return;
    const newWarehouse = prod.warehouseStock - qty;
    const newPublished = prod.publishedStock + qty;
    setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, warehouseStock: newWarehouse, publishedStock: newPublished, stock: newPublished } : p));
    setStockMovements((prev) => [{ id: `sm-${Date.now()}`, tenantId: currentUser.tenantId, productId, productName: prod.name, type: 'bodega_to_caja', quantity: qty, userName: currentUser.name, createdAt: new Date().toISOString() }, ...prev]);
    await supabase.from('products').update({ warehouse_stock: newWarehouse, published_stock: newPublished, stock: newPublished }).eq('id', productId);
    await supabase.from('stock_movements').insert({
      tenant_id: currentUser.tenantId, product_id: productId, product_name: prod.name,
      type: 'bodega_to_caja', quantity: qty, user_id: currentUser.id, user_name: currentUser.name,
    });
  };

  const addReception = async (r: Omit<Reception, 'id' | 'receivedAt'>) => {
    const { data, error } = await supabase.from('receptions').insert({
      tenant_id: r.tenantId, supplier: r.supplier, remito: r.remito,
      items: r.items, total: r.total, status: r.status,
    }).select().single();
    if (error) { console.error('Error reception:', error); return; }
    if (data) setReceptions((prev) => [mapReception(data as ReceptionRow), ...prev]);
    // Add stock movements for reception items
    const movements = r.items.map((item) => ({
      tenant_id: r.tenantId, product_id: null, product_name: item.name,
      type: 'reception', quantity: item.qty, user_id: currentUser.id, user_name: currentUser.name,
    }));
    if (movements.length > 0) await supabase.from('stock_movements').insert(movements);
    setStockMovements((prev) => [
      ...r.items.map((item) => ({
        id: `sm-${Date.now()}-${item.name}`, tenantId: r.tenantId, productId: '', productName: item.name,
        type: 'reception' as const, quantity: item.qty, userName: currentUser.name, createdAt: new Date().toISOString(),
      })),
      ...prev,
    ]);
  };

  const addCredit = async (c: Omit<CreditAccount, 'id'>) => {
    const { data, error } = await supabase.from('credits').insert({
      tenant_id: c.tenantId, sale_id: null, customer_name: c.customerName,
      customer_phone: c.phone, amount: c.amount, due_date: c.dueDate, status: c.status,
    }).select().single();
    if (error) { console.error('Error credit:', error); return; }
    if (data) setCredits((prev) => [{ ...c, id: data.id }, ...prev]);
  };

  const toggleTenantStatus = async (id: string, status: Tenant['status']) => {
    setTenants((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    await supabase.from('tenants').update({ status }).eq('id', id);
  };

  const addQuickReply = async (text: string) => {
    const { data, error } = await supabase.from('quick_replies').insert({ text }).select().single();
    if (error) { console.error('Error quick reply:', error); return; }
    if (data) setQuickReplies((prev) => [...prev, { id: data.id, text }]);
  };

  const sendMessage = async (threadId: string, text: string, _quick = false) => {
    const receiverId = threadId.replace('thread-', '');
    const msg: ChatMessage = {
      id: `m-${Date.now()}`, threadId, senderId: currentUser.id,
      senderName: currentUser.name, senderRole: currentUser.role, text,
      createdAt: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => ({ ...prev, [threadId]: [...(prev[threadId] ?? []), msg] }));
    await supabase.from('chat_messages').insert({
      tenant_id: currentUser.tenantId || null,
      sender_id: currentUser.id, receiver_id: receiverId, message: text,
    });
  };

  const addTask = async (productId: string, qty: number, assignedTo: string | null) => {
    if (!currentTenant) return;
    const prod = products.find((p) => p.id === productId);
    const assignee = profiles.find((p) => p.id === assignedTo);
    const { data, error } = await supabase.from('tasks').insert({
      tenant_id: currentTenant.id, product_id: productId, quantity: qty,
      assigned_to: assignedTo, created_by: currentUser.id, status: 'pending',
    }).select().single();
    if (error) { console.error('Error task:', error); return; }
    if (data) setTasks((prev) => [mapTask(data as TaskRow, prod?.name ?? '', assignee?.name), ...prev]);
  };

  const completeTask = async (id: string) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: 'completed', completedAt: new Date().toISOString() } : t));
    await supabase.from('tasks').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', id);
    pushWarning(`Tarea completada por ${currentUser.name}.`);
  };

  const addBroadcast = async (title: string, message: string) => {
    const { data, error } = await supabase.from('broadcast_messages').insert({
      title, message, created_by: currentUser.id,
    }).select().single();
    if (error) { console.error('Error broadcast:', error); return; }
    if (data) setBroadcastMessages((prev) => [mapBroadcast(data as BroadcastRow), ...prev]);
  };

  const createEmployee = async (name: string, email: string, password: string): Promise<{ error: string | null }> => {
    if (!currentTenant) return { error: 'Sin negocio activo' };
    if (profiles.length >= planLimit) return { error: `Límite del plan alcanzado (${planLimit} empleados)` };
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (data.user) {
      const { error: pErr } = await supabase.from('profiles').insert({
        id: data.user.id, tenant_id: currentTenant.id, name, role: 'employee',
      });
      if (pErr) return { error: pErr.message };
      setProfiles((prev) => [...prev, mapProfile({ id: data.user!.id, tenant_id: currentTenant.id, name, role: 'employee', active: true, last_seen_at: null, created_at: new Date().toISOString() }, email)]);
    }
    return { error: null };
  };

  const addCashClose = async (c: Omit<CashClose, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase.from('cash_closes').insert({
      tenant_id: c.tenantId, profile_id: c.employeeId, type: c.type,
      opening_cash: c.openingCash, counted_cash: c.countedCash, expected_cash: c.expectedCash,
      card_total: c.cardTotal, transfer_total: c.transferTotal, qr_total: c.qrTotal,
      difference: c.difference, notes: c.notes,
    }).select().single();
    if (error) { console.error('Error cash close:', error); return; }
    if (data) setCashCloses((prev) => [{ ...c, id: data.id, createdAt: data.created_at }, ...prev]);
  };

  const value: AppContextValue = {
    role, theme, toggleTheme, currentUser, currentTenant, updateTenantBranding,
    tenants, users: profiles, profiles, products, categories, sales, credits, receptions, shifts: [],
    quickReplies, addQuickReply, cart, addToCart, updateCartItem, removeFromCart, clearCart,
    checkout, addProduct, updateProduct, deleteProduct, massRemark, publishToCaja,
    addReception, addCredit, toggleTenantStatus, threads, messages, sendMessage,
    warnings, pushWarning, clearWarning, loading,
    tasks, addTask, completeTask, broadcastMessages, addBroadcast, createEmployee,
    updateLastSeen, planLimit, stockMovements, addCashClose, cashCloses, refreshData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
