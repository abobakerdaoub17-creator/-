export type Role = 'admin' | 'sales';

export type PaymentMethod = 'cash' | 'bank' | 'credit';

export interface User {
  id: string;
  name: string;
  role: Role;
}

export interface CurrentUser {
  id: string;
  email: string;
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
  source?: 'vehicle' | 'warehouse';
  tripId?: string;
  vehicleId?: string;
}

export interface Vehicle {
  id: string;
  name: string;
  plateNumber: string;
  type: string;
  model: string;
  status: 'active' | 'maintenance' | 'inactive';
  createdAt: string;
}

export interface TripItem {
  id: string;
  tripId: string;
  itemId: string;
  oem: string;
  description: string;
  loadedQty: number;
  soldQty: number;
  returnedQty: number;
  unitPrice: number;
  unitCost: number;
}

export interface Trip {
  id: string;
  driverName: string;
  vehicle: string;
  vehicleId?: string;
  departureAt: string;
  returnAt?: string;
  status: 'loading' | 'active' | 'completed' | 'cancelled';
  totalSales: number;
  city: string;
  area: string;
  notes: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  items: TripItem[];
}

export type StockMovementType =
  | 'load_vehicle'       // تحميل من المخزن الرئيسي إلى السيارة
  | 'vehicle_sale'       // بيع من مخزون السيارة لمحل
  | 'vehicle_return'     // إرجاع متبقي من السيارة للمخزن الرئيسي
  | 'warehouse_sale'     // بيع مباشر من المخزن الرئيسي
  | 'direct_sale'        // بيع مباشر من المخزن
  | 'adjustment'         // جرد وتعديل يدوي
  | 'shipment_arrival'   // وصول شحنة جديدة
  | 'shipment_received'; // استلام شحنة واردة

export interface StockMovement {
  id: string;
  itemId: string;
  oem: string;
  description: string;
  type: StockMovementType;
  qty: number;
  source: 'main_warehouse' | 'vehicle' | 'supplier';
  target: 'main_warehouse' | 'vehicle' | 'customer';
  vehicleId?: string;
  vehicleName?: string;
  tripId?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  shopId?: string;
  shopName?: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
}

export interface AppData {
  shops: Shop[];
  payments: Payment[];
  shipments: Shipment[];
  inventory: InventoryItem[];
  invoices: Invoice[];
  vehicles: Vehicle[];
  trips: Trip[];
  stockMovements: StockMovement[];
}
