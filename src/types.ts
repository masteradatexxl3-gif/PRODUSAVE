export type Role = 'superadmin' | 'boss' | 'employee';

export type Theme = 'dark' | 'light';

export type Plan = 'version_de_prueba' | 'pro' | 'enterprise';

export interface TenantBranding {
  primary: string;
  accent: string;
  logoText: string;
  logoEmoji: string;
  logoUrl?: string | null;
}

export interface Tenant {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  plan: Plan;
  status: 'active' | 'suspended' | 'paused';
  employeeCount: number;
  createdAt: string;
  monthlyRevenue: number;
  subscriptionExpiresAt?: string | null;
  branding: TenantBranding;
}

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: Role;
  avatarColor: string;
  online: boolean;
  lastSeen: string;
  lastSeenAt?: string | null;
}

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  color: string;
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  brand: string;
  category: string;
  cost: number;
  price: number;
  stock: number;
  minStock: number;
  warehouseStock: number;
  publishedStock: number;
  weight?: string;
  barcode: string;
  createdAt: string;
  createdBy?: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  priceOverride?: number;
  warning?: boolean;
}

export interface Sale {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  items: CartItem[];
  total: number;
  paymentMethod: PaymentMethod;
  mixedAmounts?: MixedPayment;
  createdAt: string;
  shift: string;
}

export type PaymentMethod = 'cash' | 'transfer' | 'qr' | 'card' | 'credit' | 'mixed';

export interface MixedPayment {
  cash: number;
  transfer: number;
  qr: number;
  card: number;
  credit: number;
}

export interface CreditAccount {
  id: string;
  tenantId: string;
  customerName: string;
  phone: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'overdue' | 'paid';
}

export interface Reception {
  id: string;
  tenantId: string;
  supplier: string;
  remito: string;
  items: { name: string; qty: number; cost: number }[];
  total: number;
  receivedAt: string;
  status: 'received' | 'pending';
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  text: string;
  createdAt: string;
  quick?: boolean;
}

export interface ChatThread {
  id: string;
  participantName: string;
  participantRole: Role;
  avatarColor: string;
  online: boolean;
  lastMessage: string;
  lastTime: string;
  unread: number;
  lastSeenAt?: string | null;
}

export interface QuickReply {
  id: string;
  text: string;
}

export interface Shift {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  openedAt: string;
  openingCash: number;
  currentCash: number;
  status: 'open' | 'closed';
}

export interface Task {
  id: string;
  tenantId: string;
  productId: string;
  productName: string;
  quantity: number;
  assignedTo: string | null;
  assignedToName?: string;
  createdBy: string;
  status: 'pending' | 'completed';
  completedAt: string | null;
  createdAt: string;
}

export interface BroadcastMessage {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  tenantId: string;
  productId: string;
  productName: string;
  type: 'bodega_to_caja' | 'reception' | 'sale' | 'adjustment';
  quantity: number;
  userName: string;
  createdAt: string;
}

export interface CashClose {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  type: 'x_read' | 'z_read';
  openingCash: number;
  countedCash: number;
  expectedCash: number;
  cardTotal: number;
  transferTotal: number;
  qrTotal: number;
  difference: number;
  notes: string;
  createdAt: string;
}

export interface CouponCode {
  id: string;
  tenantId: string;
  code: string;
  description?: string;
  discountPercent: number;
  maxUses?: number | null;
  usedCount: number;
  active: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  userId?: string;
  userName: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface EmployeePermissions {
  id: string;
  tenantId: string;
  profileId: string;
  canDiscount: boolean;
  canSeeCost: boolean;
  updatedAt: string;
}
