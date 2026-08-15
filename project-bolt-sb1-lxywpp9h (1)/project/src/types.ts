export type Role = 'admin' | 'sales';

export type PaymentMethod = 'cash' | 'bank' | 'credit';

export interface User {
  id: string;
  name: string;
  role: Role;
}

export interface Shop {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  city: string;
  area: string;
  openingBalance: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  shopId: string;
  amount: number;
  method: 'cash' | 'bank';
  date: string;
  note?: string;
  createdBy: string;
}

export interface Shipment {
  id: string;
  ref: string;
  departureDate: string;
  arrivalDate: string;
  status: 'in_transit' | 'arrived' | 'cleared';
  totalCostCny: number;
  totalShippingCny: number;
  cnyToLydRate: number;
  itemCount: number;
}

export interface InventoryItem {
  id: string;
  oem: string;
  description: string;
  carModel: string;
  category: string;
  shelf: string;
  stock: number;
  minStock: number;
  purchasePrice: number;
  sellPrice: number;
  shipmentId?: string;
}

export interface InvoiceLine {
  itemId: string;
  oem: string;
  description: string;
  qty: number;
  unitPrice: number;
  unitCost: number;
  lineTotal: number;
  lineCost: number;
}

export interface Invoice {
  id: string;
  number: string;
  shopId: string;
  shopName: string;
  date: string;
  lines: InvoiceLine[];
  subtotal: number;
  discount: number;
  total: number;
  totalCost: number;
  paymentMethod: PaymentMethod;
  paidAmount: number;
  createdBy: string;
  createdByName: string;
  status: 'paid' | 'partial' | 'unpaid';
}

export interface AppData {
  shops: Shop[];
  payments: Payment[];
  shipments: Shipment[];
  inventory: InventoryItem[];
  invoices: Invoice[];
}
