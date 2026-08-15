import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { AppData, Shop, Payment, Shipment, InventoryItem, Invoice, InvoiceLine, Vehicle, Trip, TripItem, StockMovement } from '@/types';
import { initialDemoData } from '@/lib/demoData';

const LOCAL_STORAGE_KEY = 'beko_autoparts_data_v1';

export function isUuid(val: unknown): boolean {
  if (!val || typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
}

function getLocalData(): AppData {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialDemoData));
      return initialDemoData;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.stockMovements) {
      parsed.stockMovements = initialDemoData.stockMovements || [];
    }
    return parsed;
  } catch {
    return initialDemoData;
  }
}

function saveLocalData(data: AppData) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

// ---- Row types (snake_case from DB) ----
interface VehicleRow {
  id: string;
  name: string;
  plate_number: string;
  type: string;
  model: string;
  status: string;
  created_at: string;
}
interface TripRow {
  id: string;
  driver_name: string;
  vehicle: string;
  vehicle_id: string | null;
  departure_at: string;
  return_at: string | null;
  status: string;
  total_sales: number;
  city: string;
  area: string;
  notes: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
}
interface TripItemRow {
  id: string;
  trip_id: string;
  item_id: string;
  oem: string;
  description: string;
  loaded_qty: number;
  sold_qty: number;
  returned_qty: number;
  unit_price: number;
  unit_cost: number;
}
interface ShopRow {
  id: string;
  name: string;
  owner_name: string;
  phone: string;
  city: string;
  area: string;
  opening_balance: number;
  created_at: string;
}
interface PaymentRow {
  id: string;
  shop_id: string;
  amount: number;
  method: string;
  date: string;
  note: string | null;
  created_by: string;
}
interface ShipmentRow {
  id: string;
  ref: string;
  departure_date: string;
  arrival_date: string;
  status: string;
  total_cost_cny: number;
  total_shipping_cny: number;
  cny_to_lyd_rate: number;
  item_count: number;
}
interface InventoryRow {
  id: string;
  oem: string;
  description: string;
  car_model: string;
  category: string;
  shelf: string;
  stock: number;
  min_stock: number;
  purchase_price: number;
  sell_price: number;
  shipment_id: string | null;
}
interface InvoiceRow {
  id: string;
  number: string;
  shop_id: string;
  shop_name: string;
  date: string;
  subtotal: number;
  discount: number;
  total: number;
  total_cost: number;
  payment_method: string;
  paid_amount: number;
  status: string;
  created_by: string;
  created_by_name: string;
}
interface InvoiceLineRow {
  id: string;
  invoice_id: string;
  item_id: string;
  oem: string;
  description: string;
  qty: number;
  unit_price: number;
  unit_cost: number;
  line_total: number;
  line_cost: number;
}
interface StockMovementRow {
  id: string;
  item_id: string;
  oem: string;
  description: string;
  type: string;
  qty: number;
  source: string;
  target: string;
  vehicle_id: string | null;
  vehicle_name: string | null;
  trip_id: string | null;
  invoice_id: string | null;
  invoice_number: string | null;
  shop_id: string | null;
  shop_name: string | null;
  notes: string | null;
  created_at: string;
  created_by: string;
  created_by_name: string;
}

// ---- Mappers ----
function mapShop(r: ShopRow): Shop {
  return {
    id: r.id,
    name: r.name,
    ownerName: r.owner_name,
    phone: r.phone,
    city: r.city,
    area: r.area,
    openingBalance: Number(r.opening_balance),
    createdAt: r.created_at.slice(0, 10),
  };
}
function mapPayment(r: PaymentRow): Payment {
  return {
    id: r.id,
    shopId: r.shop_id,
    amount: Number(r.amount),
    method: r.method as 'cash' | 'bank',
    date: r.date,
    note: r.note ?? undefined,
    createdBy: r.created_by,
  };
}
function mapShipment(r: ShipmentRow): Shipment {
  return {
    id: r.id,
    ref: r.ref,
    departureDate: r.departure_date,
    arrivalDate: r.arrival_date,
    status: r.status as Shipment['status'],
    totalCostCny: Number(r.total_cost_cny),
    totalShippingCny: Number(r.total_shipping_cny),
    cnyToLydRate: Number(r.cny_to_lyd_rate),
    itemCount: r.item_count,
  };
}
function mapInventory(r: InventoryRow): InventoryItem {
  return {
    id: r.id,
    oem: r.oem,
    description: r.description,
    carModel: r.car_model,
    category: r.category,
    shelf: r.shelf,
    stock: r.stock,
    minStock: r.min_stock,
    purchasePrice: Number(r.purchase_price),
    sellPrice: Number(r.sell_price),
    shipmentId: r.shipment_id ?? undefined,
  };
}
function mapInvoice(r: InvoiceRow, lines: InvoiceLine[]): Invoice {
  return {
    id: r.id,
    number: r.number,
    shopId: r.shop_id,
    shopName: r.shop_name,
    date: r.date,
    lines,
    subtotal: Number(r.subtotal),
    discount: Number(r.discount),
    total: Number(r.total),
    totalCost: Number(r.total_cost),
    paymentMethod: r.payment_method as Invoice['paymentMethod'],
    paidAmount: Number(r.paid_amount),
    createdBy: r.created_by,
    createdByName: r.created_by_name,
    status: r.status as Invoice['status'],
  };
}
function mapVehicle(r: VehicleRow): Vehicle {
  return {
    id: r.id,
    name: r.name,
    plateNumber: r.plate_number,
    type: r.type,
    model: r.model,
    status: r.status as Vehicle['status'],
    createdAt: r.created_at,
  };
}
function mapTripItem(r: TripItemRow): TripItem {
  return {
    id: r.id,
    tripId: r.trip_id,
    itemId: r.item_id,
    oem: r.oem,
    description: r.description,
    loadedQty: r.loaded_qty,
    soldQty: r.sold_qty,
    returnedQty: r.returned_qty,
    unitPrice: Number(r.unit_price),
    unitCost: Number(r.unit_cost),
  };
}
function mapTrip(r: TripRow, items: TripItem[]): Trip {
  return {
    id: r.id,
    driverName: r.driver_name,
    vehicle: r.vehicle,
    vehicleId: r.vehicle_id ?? undefined,
    departureAt: r.departure_at,
    returnAt: r.return_at ?? undefined,
    status: r.status as Trip['status'],
    totalSales: Number(r.total_sales),
    city: r.city,
    area: r.area,
    notes: r.notes,
    createdBy: r.created_by,
    createdByName: r.created_by_name,
    createdAt: r.created_at,
    items,
  };
}
function mapLine(r: InvoiceLineRow): InvoiceLine {
  return {
    itemId: r.item_id,
    oem: r.oem,
    description: r.description,
    qty: r.qty,
    unitPrice: Number(r.unit_price),
    unitCost: Number(r.unit_cost),
    lineTotal: Number(r.line_total),
    lineCost: Number(r.line_cost),
  };
}
function mapStockMovement(r: StockMovementRow): StockMovement {
  return {
    id: r.id,
    itemId: r.item_id,
    oem: r.oem,
    description: r.description,
    type: r.type as StockMovement['type'],
    qty: Number(r.qty),
    source: r.source as StockMovement['source'],
    target: r.target as StockMovement['target'],
    vehicleId: r.vehicle_id ?? undefined,
    vehicleName: r.vehicle_name ?? undefined,
    tripId: r.trip_id ?? undefined,
    invoiceId: r.invoice_id ?? undefined,
    invoiceNumber: r.invoice_number ?? undefined,
    shopId: r.shop_id ?? undefined,
    shopName: r.shop_name ?? undefined,
    notes: r.notes ?? undefined,
    createdAt: r.created_at,
    createdBy: r.created_by,
    createdByName: r.created_by_name,
  };
}

// ---- Load all ----
export async function loadAppData(): Promise<AppData> {
  if (!isSupabaseConfigured) {
    return getLocalData();
  }

  try {
    const [shops, payments, shipments, inventory, invoices, lines, vehicles, trips, tripItems, stockMovements] = await Promise.all([
      supabase.from('shops').select('*').order('created_at', { ascending: true }),
      supabase.from('payments').select('*').order('date', { ascending: false }),
      supabase.from('shipments').select('*').order('created_at', { ascending: true }),
      supabase.from('inventory').select('*').order('created_at', { ascending: true }),
      supabase.from('invoices').select('*').order('created_at', { ascending: false }),
      supabase.from('invoice_lines').select('*'),
      supabase.from('vehicles').select('*').order('created_at', { ascending: true }),
      supabase.from('trips').select('*').order('created_at', { ascending: false }),
      supabase.from('trip_items').select('*'),
      supabase.from('stock_movements').select('*').order('created_at', { ascending: false }),
    ]);

    if (shops.error) throw shops.error;
    if (payments.error) throw payments.error;
    if (shipments.error) throw shipments.error;
    if (inventory.error) throw inventory.error;
    if (invoices.error) throw invoices.error;
    if (lines.error) throw lines.error;
    if (vehicles.error) throw vehicles.error;
    if (trips.error) throw trips.error;
    if (tripItems.error) throw tripItems.error;

    const lineRows = (lines.data as InvoiceLineRow[]) ?? [];
    const invoiceRows = (invoices.data as InvoiceRow[]) ?? [];

    const linesByInvoice = new Map<string, InvoiceLine[]>();
    for (const l of lineRows) {
      const arr = linesByInvoice.get(l.invoice_id) ?? [];
      arr.push(mapLine(l));
      linesByInvoice.set(l.invoice_id, arr);
    }

    const tripItemRows = (tripItems.data as TripItemRow[]) ?? [];
    const itemsByTrip = new Map<string, TripItem[]>();
    for (const ti of tripItemRows) {
      const arr = itemsByTrip.get(ti.trip_id) ?? [];
      arr.push(mapTripItem(ti));
      itemsByTrip.set(ti.trip_id, arr);
    }

    const movements = (!stockMovements.error && stockMovements.data)
      ? (stockMovements.data as StockMovementRow[]).map(mapStockMovement)
      : (getLocalData().stockMovements || initialDemoData.stockMovements || []);

    return {
      shops: (shops.data as ShopRow[]).map(mapShop),
      payments: (payments.data as PaymentRow[]).map(mapPayment),
      shipments: (shipments.data as ShipmentRow[]).map(mapShipment),
      inventory: (inventory.data as InventoryRow[]).map(mapInventory),
      invoices: invoiceRows.map((r) => mapInvoice(r, linesByInvoice.get(r.id) ?? [])),
      vehicles: (vehicles.data as VehicleRow[]).map(mapVehicle),
      trips: (trips.data as TripRow[]).map((r) => mapTrip(r, itemsByTrip.get(r.id) ?? [])),
      stockMovements: movements,
    };
  } catch (err) {
    console.warn('Supabase fetch failed, falling back to local demo storage:', err);
    return getLocalData();
  }
}

async function getSupabaseAuthUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

// ---- Shops ----
export async function insertShop(s: Omit<Shop, 'id' | 'createdAt'>): Promise<Shop> {
  const localFallback = () => {
    const data = getLocalData();
    const newShop: Shop = {
      ...s,
      id: 'shop-' + Date.now(),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    data.shops.push(newShop);
    saveLocalData(data);
    return newShop;
  };

  if (!isSupabaseConfigured) {
    return localFallback();
  }
  try {
    const { data, error } = await supabase.from('shops').insert({
      name: s.name,
      owner_name: s.ownerName,
      phone: s.phone,
      city: s.city,
      area: s.area,
      opening_balance: s.openingBalance,
    }).select('*').single();
    if (error) {
      console.warn('Supabase insertShop failed, falling back to local:', error);
      return localFallback();
    }
    const res = mapShop(data as ShopRow);
    const local = getLocalData();
    local.shops = [...local.shops.filter((x) => x.id !== res.id), res];
    saveLocalData(local);
    return res;
  } catch (err) {
    console.warn('Supabase insertShop error:', err);
    return localFallback();
  }
}

export async function updateShop(id: string, patch: Partial<Shop>): Promise<void> {
  const localFallback = () => {
    const data = getLocalData();
    data.shops = data.shops.map((s) => (s.id === id ? { ...s, ...patch } : s));
    saveLocalData(data);
  };

  if (!isSupabaseConfigured || !isUuid(id)) {
    localFallback();
    return;
  }
  try {
    const row: Record<string, unknown> = {};
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.ownerName !== undefined) row.owner_name = patch.ownerName;
    if (patch.phone !== undefined) row.phone = patch.phone;
    if (patch.city !== undefined) row.city = patch.city;
    if (patch.area !== undefined) row.area = patch.area;
    if (patch.openingBalance !== undefined) row.opening_balance = patch.openingBalance;
    const { error } = await supabase.from('shops').update(row).eq('id', id);
    if (error) {
      console.warn('Supabase updateShop failed, falling back to local:', error);
    }
    localFallback();
  } catch (err) {
    console.warn('Supabase updateShop error:', err);
    localFallback();
  }
}

// ---- Payments ----
export async function insertPayment(p: Omit<Payment, 'id'>): Promise<Payment> {
  const localFallback = () => {
    const data = getLocalData();
    const newPay: Payment = {
      ...p,
      id: 'pay-' + Date.now(),
    };
    data.payments.unshift(newPay);
    saveLocalData(data);
    return newPay;
  };

  if (!isSupabaseConfigured) {
    return localFallback();
  }
  try {
    const authUserId = await getSupabaseAuthUserId();
    const createdBy = authUserId || p.createdBy;
    const { data, error } = await supabase.from('payments').insert({
      shop_id: p.shopId,
      amount: p.amount,
      method: p.method,
      date: p.date,
      note: p.note ?? null,
      created_by: createdBy,
    }).select('*').single();
    if (error) {
      console.warn('Supabase insertPayment failed, falling back to local:', error);
      return localFallback();
    }
    const res = mapPayment(data as PaymentRow);
    const local = getLocalData();
    local.payments = [res, ...local.payments.filter((x) => x.id !== res.id)];
    saveLocalData(local);
    return res;
  } catch (err) {
    console.warn('Supabase insertPayment error:', err);
    return localFallback();
  }
}

// ---- Shipments ----
export async function insertShipment(s: Omit<Shipment, 'id'>): Promise<Shipment> {
  const localFallback = () => {
    const data = getLocalData();
    const newShip: Shipment = {
      ...s,
      id: 'ship-' + Date.now(),
    };
    data.shipments.push(newShip);
    saveLocalData(data);
    return newShip;
  };

  if (!isSupabaseConfigured) {
    return localFallback();
  }
  try {
    const { data, error } = await supabase.from('shipments').insert({
      ref: s.ref,
      departure_date: s.departureDate,
      arrival_date: s.arrivalDate,
      status: s.status,
      total_cost_cny: s.totalCostCny,
      total_shipping_cny: s.totalShippingCny,
      cny_to_lyd_rate: s.cnyToLydRate,
      item_count: s.itemCount,
    }).select('*').single();
    if (error) {
      console.warn('Supabase insertShipment failed, falling back to local:', error);
      return localFallback();
    }
    const res = mapShipment(data as ShipmentRow);
    const local = getLocalData();
    local.shipments = [...local.shipments.filter((x) => x.id !== res.id), res];
    saveLocalData(local);
    return res;
  } catch (err) {
    console.warn('Supabase insertShipment error:', err);
    return localFallback();
  }
}

export async function updateShipment(id: string, patch: Partial<Shipment>): Promise<void> {
  const localFallback = () => {
    const data = getLocalData();
    data.shipments = data.shipments.map((s) => (s.id === id ? { ...s, ...patch } : s));
    saveLocalData(data);
  };

  if (!isSupabaseConfigured || !isUuid(id)) {
    localFallback();
    return;
  }
  try {
    const row: Record<string, unknown> = {};
    if (patch.ref !== undefined) row.ref = patch.ref;
    if (patch.departureDate !== undefined) row.departure_date = patch.departureDate;
    if (patch.arrivalDate !== undefined) row.arrival_date = patch.arrivalDate;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.totalCostCny !== undefined) row.total_cost_cny = patch.totalCostCny;
    if (patch.totalShippingCny !== undefined) row.total_shipping_cny = patch.totalShippingCny;
    if (patch.cnyToLydRate !== undefined) row.cny_to_lyd_rate = patch.cnyToLydRate;
    if (patch.itemCount !== undefined) row.item_count = patch.itemCount;
    const { error } = await supabase.from('shipments').update(row).eq('id', id);
    if (error) {
      console.warn('Supabase updateShipment failed, falling back to local:', error);
    }
    localFallback();
  } catch (err) {
    console.warn('Supabase updateShipment error:', err);
    localFallback();
  }
}

export async function deleteShipment(id: string): Promise<void> {
  const localFallback = () => {
    const data = getLocalData();
    data.shipments = data.shipments.filter((s) => s.id !== id);
    saveLocalData(data);
  };

  if (!isSupabaseConfigured || !isUuid(id)) {
    localFallback();
    return;
  }
  try {
    const { error } = await supabase.from('shipments').delete().eq('id', id);
    if (error) {
      console.warn('Supabase deleteShipment failed, falling back to local:', error);
    }
    localFallback();
  } catch (err) {
    console.warn('Supabase deleteShipment error:', err);
    localFallback();
  }
}

// ---- Inventory ----
export async function insertInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
  const localFallback = () => {
    const data = getLocalData();
    const newItem: InventoryItem = {
      ...item,
      id: 'inv-' + Date.now(),
    };
    data.inventory.push(newItem);
    saveLocalData(data);
    return newItem;
  };

  if (!isSupabaseConfigured) {
    return localFallback();
  }
  try {
    const shipmentId = item.shipmentId && isUuid(item.shipmentId) ? item.shipmentId : null;
    const { data, error } = await supabase.from('inventory').insert({
      oem: item.oem,
      description: item.description,
      car_model: item.carModel,
      category: item.category,
      shelf: item.shelf,
      stock: item.stock,
      min_stock: item.minStock,
      purchase_price: item.purchasePrice,
      sell_price: item.sellPrice,
      shipment_id: shipmentId,
    }).select('*').single();
    if (error) {
      console.warn('Supabase insertInventoryItem failed (e.g. RLS policy violation), falling back to local storage:', error);
      return localFallback();
    }
    const res = mapInventory(data as InventoryRow);
    const local = getLocalData();
    local.inventory = [...local.inventory.filter((x) => x.id !== res.id), res];
    saveLocalData(local);
    return res;
  } catch (err) {
    console.warn('Supabase insertInventoryItem error:', err);
    return localFallback();
  }
}

export async function updateInventoryItem(id: string, patch: Partial<InventoryItem>): Promise<void> {
  const localFallback = () => {
    const data = getLocalData();
    data.inventory = data.inventory.map((i) => (i.id === id ? { ...i, ...patch } : i));
    saveLocalData(data);
  };

  if (!isSupabaseConfigured || !isUuid(id)) {
    localFallback();
    return;
  }
  try {
    const row: Record<string, unknown> = {};
    if (patch.oem !== undefined) row.oem = patch.oem;
    if (patch.description !== undefined) row.description = patch.description;
    if (patch.carModel !== undefined) row.car_model = patch.carModel;
    if (patch.category !== undefined) row.category = patch.category;
    if (patch.shelf !== undefined) row.shelf = patch.shelf;
    if (patch.stock !== undefined) row.stock = patch.stock;
    if (patch.minStock !== undefined) row.min_stock = patch.minStock;
    if (patch.purchasePrice !== undefined) row.purchase_price = patch.purchasePrice;
    if (patch.sellPrice !== undefined) row.sell_price = patch.sellPrice;
    if (patch.shipmentId !== undefined) row.shipment_id = (patch.shipmentId && isUuid(patch.shipmentId)) ? patch.shipmentId : null;
    const { error } = await supabase.from('inventory').update(row).eq('id', id);
    if (error) {
      console.warn('Supabase updateInventoryItem failed, falling back to local:', error);
    }
    localFallback();
  } catch (err) {
    console.warn('Supabase updateInventoryItem error:', err);
    localFallback();
  }
}

export async function deleteInventoryItem(id: string): Promise<void> {
  const localFallback = () => {
    const data = getLocalData();
    data.inventory = data.inventory.filter((i) => i.id !== id);
    saveLocalData(data);
  };

  if (!isSupabaseConfigured || !isUuid(id)) {
    localFallback();
    return;
  }
  try {
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (error) {
      console.warn('Supabase deleteInventoryItem failed, falling back to local:', error);
    }
    localFallback();
  } catch (err) {
    console.warn('Supabase deleteInventoryItem error:', err);
    localFallback();
  }
}

export async function insertStockMovement(m: Omit<StockMovement, 'id' | 'createdAt'>): Promise<StockMovement> {
  const localFallback = () => {
    const data = getLocalData();
    if (!data.stockMovements) data.stockMovements = [];
    const newMovement: StockMovement = {
      ...m,
      id: 'sm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
    };
    data.stockMovements.unshift(newMovement);
    saveLocalData(data);
    return newMovement;
  };

  if (!isSupabaseConfigured) {
    return localFallback();
  }

  try {
    const authUserId = await getSupabaseAuthUserId();
    const createdBy = authUserId || m.createdBy;

    const { data, error } = await supabase.from('stock_movements').insert({
      item_id: m.itemId,
      oem: m.oem,
      description: m.description,
      type: m.type,
      qty: m.qty,
      source: m.source,
      target: m.target,
      vehicle_id: (m.vehicleId && isUuid(m.vehicleId)) ? m.vehicleId : null,
      vehicle_name: m.vehicleName ?? null,
      trip_id: (m.tripId && isUuid(m.tripId)) ? m.tripId : null,
      invoice_id: (m.invoiceId && isUuid(m.invoiceId)) ? m.invoiceId : null,
      invoice_number: m.invoiceNumber ?? null,
      shop_id: (m.shopId && isUuid(m.shopId)) ? m.shopId : null,
      shop_name: m.shopName ?? null,
      notes: m.notes ?? null,
      created_by: createdBy,
      created_by_name: m.createdByName,
    }).select('*').single();

    if (error) {
      console.warn('Supabase insert stock_movement failed (or table not yet created), using local fallback:', error);
      return localFallback();
    }
    const res = mapStockMovement(data as StockMovementRow);
    const local = getLocalData();
    if (!local.stockMovements) local.stockMovements = [];
    local.stockMovements.unshift(res);
    saveLocalData(local);
    return res;
  } catch (err) {
    console.warn('Supabase insert stock_movement error:', err);
    return localFallback();
  }
}

export async function adjustStock(id: string, newStock: number, currentUser?: { id: string; name: string }, reason?: string): Promise<void> {
  const localFallback = () => {
    const data = getLocalData();
    const item = data.inventory.find((i) => i.id === id);
    const oldStock = item?.stock ?? 0;
    const diff = newStock - oldStock;
    data.inventory = data.inventory.map((i) => (i.id === id ? { ...i, stock: newStock } : i));
    if (item && diff !== 0) {
      if (!data.stockMovements) data.stockMovements = [];
      data.stockMovements.unshift({
        id: 'sm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        itemId: item.id,
        oem: item.oem,
        description: item.description,
        type: 'adjustment',
        qty: Math.abs(diff),
        source: 'main_warehouse',
        target: 'main_warehouse',
        notes: reason || `تعديل جرد يدوي من ${oldStock} إلى ${newStock}`,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.id || 'user-admin',
        createdByName: currentUser?.name || 'مدير المخزن',
      });
    }
    saveLocalData(data);
  };

  if (!isSupabaseConfigured || !isUuid(id)) {
    localFallback();
    return;
  }
  try {
    const { error } = await supabase.from('inventory').update({ stock: newStock }).eq('id', id);
    if (error) {
      console.warn('Supabase adjustStock failed, falling back to local:', error);
    }
    localFallback();
  } catch (err) {
    console.warn('Supabase adjustStock error:', err);
    localFallback();
  }
}

// ---- Invoices ----
export async function createInvoice(
  inv: Omit<Invoice, 'id' | 'number'>,
  nextNumber: string,
): Promise<Invoice> {
  const localFallback = () => {
    const data = getLocalData();
    const newInvoice: Invoice = {
      ...inv,
      id: 'inv-rec-' + Date.now(),
      number: nextNumber,
    };
    data.invoices.unshift(newInvoice);

    if (inv.source === 'vehicle' && inv.tripId) {
      // Selling from vehicle: DO NOT touch main warehouse inventory!
      // Update trip_items.soldQty and trips.totalSales
      const trip = data.trips.find((t) => t.id === inv.tripId);
      if (trip) {
        trip.totalSales = (trip.totalSales || 0) + inv.total;
        for (const line of inv.lines) {
          const ti = trip.items.find((i) => i.itemId === line.itemId || i.oem === line.oem);
          if (ti) {
            ti.soldQty = (ti.soldQty || 0) + line.qty;
          }
          if (!data.stockMovements) data.stockMovements = [];
          data.stockMovements.unshift({
            id: 'sm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            itemId: line.itemId,
            oem: line.oem,
            description: line.description,
            type: 'vehicle_sale',
            qty: line.qty,
            source: 'vehicle',
            target: 'customer',
            vehicleId: trip.vehicleId,
            vehicleName: trip.vehicle,
            tripId: trip.id,
            invoiceId: newInvoice.id,
            invoiceNumber: nextNumber,
            shopId: inv.shopId,
            shopName: inv.shopName,
            notes: `بيع من السيارة للعميل فاتورة رقم #${nextNumber}`,
            createdAt: inv.date || new Date().toISOString(),
            createdBy: inv.createdBy,
            createdByName: inv.createdByName,
          });
        }
      }
    } else {
      // Direct sale from main warehouse: deduct from inventory.stock
      for (const line of inv.lines) {
        const idx = data.inventory.findIndex((i) => i.id === line.itemId);
        if (idx !== -1) {
          data.inventory[idx].stock = Math.max(0, data.inventory[idx].stock - line.qty);
        }
        if (!data.stockMovements) data.stockMovements = [];
        data.stockMovements.unshift({
          id: 'sm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          itemId: line.itemId,
          oem: line.oem,
          description: line.description,
          type: 'warehouse_sale',
          qty: line.qty,
          source: 'main_warehouse',
          target: 'customer',
          invoiceId: newInvoice.id,
          invoiceNumber: nextNumber,
          shopId: inv.shopId,
          shopName: inv.shopName,
          notes: `بيع مباشر من المخزن الرئيسي فاتورة رقم #${nextNumber}`,
          createdAt: inv.date || new Date().toISOString(),
          createdBy: inv.createdBy,
          createdByName: inv.createdByName,
        });
      }
    }
    saveLocalData(data);
    return newInvoice;
  };

  if (!isSupabaseConfigured) {
    return localFallback();
  }

  try {
    const authUserId = await getSupabaseAuthUserId();
    const createdBy = authUserId || inv.createdBy;

    const { data: invRow, error: invErr } = await supabase.from('invoices').insert({
      number: nextNumber,
      shop_id: inv.shopId,
      shop_name: inv.shopName,
      date: inv.date,
      subtotal: inv.subtotal,
      discount: inv.discount,
      total: inv.total,
      total_cost: inv.totalCost,
      payment_method: inv.paymentMethod,
      paid_amount: inv.paidAmount,
      status: inv.status,
      created_by: createdBy,
      created_by_name: inv.createdByName,
    }).select('*').single();

    if (invErr) {
      console.warn('Supabase createInvoice failed, falling back to local:', invErr);
      return localFallback();
    }
    const invoiceId = (invRow as InvoiceRow).id;

    const lineRows = inv.lines.map((l) => ({
      invoice_id: invoiceId,
      item_id: l.itemId,
      oem: l.oem,
      description: l.description,
      qty: l.qty,
      unit_price: l.unitPrice,
      unit_cost: l.unitCost,
      line_total: l.lineTotal,
      line_cost: l.lineCost,
    }));

    const { error: lineErr } = await supabase.from('invoice_lines').insert(lineRows);
    if (lineErr) {
      console.warn('Supabase insert invoice_lines error:', lineErr);
    }

    if (inv.source !== 'vehicle') {
      // Main warehouse sale: deduct main stock in Supabase
      for (const line of inv.lines) {
        if (!line.itemId || !isUuid(line.itemId)) continue;
        const { data: item } = await supabase.from('inventory').select('stock').eq('id', line.itemId).single();
        if (item) {
          const newStock = Math.max(0, (item as { stock: number }).stock - line.qty);
          await supabase.from('inventory').update({ stock: newStock }).eq('id', line.itemId);
        }
      }
    } else if (inv.tripId) {
      // Vehicle sale: deduct from trip items and update trip sales
      if (isUuid(inv.tripId)) {
        for (const line of inv.lines) {
          if (!line.itemId) continue;
          const { data: tItems } = await supabase
            .from('trip_items')
            .select('id, sold_qty')
            .eq('trip_id', inv.tripId)
            .eq('item_id', line.itemId);
          if (tItems && tItems.length > 0) {
            const tItem = tItems[0] as { id: string; sold_qty: number };
            await supabase
              .from('trip_items')
              .update({ sold_qty: (tItem.sold_qty || 0) + line.qty })
              .eq('id', tItem.id);
          }
        }
        const { data: trRow } = await supabase.from('trips').select('total_sales').eq('id', inv.tripId).single();
        if (trRow) {
          await supabase
            .from('trips')
            .update({ total_sales: ((trRow as { total_sales: number }).total_sales || 0) + inv.total })
            .eq('id', inv.tripId);
        }
      }
    }

    const res = mapInvoice(invRow as InvoiceRow, inv.lines);
    const local = getLocalData();
    local.invoices = [res, ...local.invoices.filter((x) => x.id !== res.id)];

    // Sync trip stock updates in local cache as well
    if (inv.source === 'vehicle' && inv.tripId) {
      const trip = local.trips.find((t) => t.id === inv.tripId);
      if (trip) {
        trip.totalSales = (trip.totalSales || 0) + inv.total;
        for (const line of inv.lines) {
          const ti = trip.items.find((i) => i.itemId === line.itemId || i.oem === line.oem);
          if (ti) {
            ti.soldQty = (ti.soldQty || 0) + line.qty;
          }
        }
      }
    }

    saveLocalData(local);
    return res;
  } catch (err) {
    console.warn('Supabase createInvoice error:', err);
    return localFallback();
  }
}

export async function getAllProfiles(): Promise<{ id: string; name: string; role: string; created_at: string; email: string }[]> {
  const fallbackProfiles = [
    { id: 'user-admin', name: 'مدير النظام (Admin)', role: 'admin', created_at: '2026-01-01', email: 'admin@autoparts.ly' },
    { id: 'user-sales', name: 'أحمد المندوب (Sales)', role: 'sales', created_at: '2026-01-10', email: 'ahmed.sales@autoparts.ly' },
  ];

  if (!isSupabaseConfigured) {
    return fallbackProfiles;
  }
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, role, created_at, email')
      .order('created_at', { ascending: true });
    if (error || !data || data.length === 0) {
      return fallbackProfiles;
    }

    return data.map((p: { id: string; name: string; role: string; created_at: string; email: string }) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      created_at: p.created_at,
      email: p.email ?? '',
    }));
  } catch {
    return fallbackProfiles;
  }
}

export async function updateProfileRole(userId: string, role: 'admin' | 'sales'): Promise<void> {
  if (!isSupabaseConfigured) {
    return;
  }
  try {
    await supabase.from('profiles').update({ role }).eq('id', userId);
  } catch (err) {
    console.warn('updateProfileRole error:', err);
  }
}

export async function getNextInvoiceNumber(existingCount: number): Promise<string> {
  return `INV-${String(existingCount + 1).padStart(4, '0')}`;
}

// ---- Vehicles ----
export async function insertVehicle(v: Omit<Vehicle, 'id' | 'createdAt'>): Promise<Vehicle> {
  const localFallback = () => {
    const data = getLocalData();
    const newVeh: Vehicle = {
      ...v,
      id: 'veh-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    data.vehicles.push(newVeh);
    saveLocalData(data);
    return newVeh;
  };

  if (!isSupabaseConfigured) {
    return localFallback();
  }
  try {
    const { data, error } = await supabase.from('vehicles').insert({
      name: v.name,
      plate_number: v.plateNumber,
      type: v.type,
      model: v.model,
      status: v.status,
    }).select('*').single();
    if (error) {
      console.warn('Supabase insertVehicle failed, falling back to local:', error);
      return localFallback();
    }
    const res = mapVehicle(data as VehicleRow);
    const local = getLocalData();
    local.vehicles = [...local.vehicles.filter((x) => x.id !== res.id), res];
    saveLocalData(local);
    return res;
  } catch (err) {
    console.warn('Supabase insertVehicle error:', err);
    return localFallback();
  }
}

export async function updateVehicle(id: string, patch: Partial<Vehicle>): Promise<void> {
  const localFallback = () => {
    const data = getLocalData();
    data.vehicles = data.vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v));
    saveLocalData(data);
  };

  if (!isSupabaseConfigured || !isUuid(id)) {
    localFallback();
    return;
  }
  try {
    const row: Record<string, unknown> = {};
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.plateNumber !== undefined) row.plate_number = patch.plateNumber;
    if (patch.type !== undefined) row.type = patch.type;
    if (patch.model !== undefined) row.model = patch.model;
    if (patch.status !== undefined) row.status = patch.status;
    const { error } = await supabase.from('vehicles').update(row).eq('id', id);
    if (error) {
      console.warn('Supabase updateVehicle failed, falling back to local:', error);
    }
    localFallback();
  } catch (err) {
    console.warn('Supabase updateVehicle error:', err);
    localFallback();
  }
}

export async function deleteVehicle(id: string): Promise<void> {
  const localFallback = () => {
    const data = getLocalData();
    data.vehicles = data.vehicles.filter((v) => v.id !== id);
    saveLocalData(data);
  };

  if (!isSupabaseConfigured || !isUuid(id)) {
    localFallback();
    return;
  }
  try {
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (error) {
      console.warn('Supabase deleteVehicle failed, falling back to local:', error);
    }
    localFallback();
  } catch (err) {
    console.warn('Supabase deleteVehicle error:', err);
    localFallback();
  }
}

// ---- Trips ----
export async function insertTrip(t: Omit<Trip, 'id' | 'createdAt' | 'items' | 'totalSales'> & { totalSales?: number }): Promise<Trip> {
  const localFallback = () => {
    const data = getLocalData();
    const newTrip: Trip = {
      ...t,
      id: 'trip-' + Date.now(),
      createdAt: new Date().toISOString(),
      items: [],
      totalSales: t.totalSales ?? 0,
    };
    data.trips.unshift(newTrip);
    saveLocalData(data);
    return newTrip;
  };

  if (!isSupabaseConfigured) {
    return localFallback();
  }

  try {
    const authUserId = await getSupabaseAuthUserId();
    const createdBy = authUserId || t.createdBy;
    const vehicleId = t.vehicleId && isUuid(t.vehicleId) ? t.vehicleId : null;

    const { data, error } = await supabase.from('trips').insert({
      driver_name: t.driverName,
      vehicle: t.vehicle,
      vehicle_id: vehicleId,
      departure_at: t.departureAt,
      return_at: t.returnAt ?? null,
      status: t.status,
      total_sales: t.totalSales ?? 0,
      city: t.city,
      area: t.area,
      notes: t.notes,
      created_by: createdBy,
      created_by_name: t.createdByName,
    }).select('*').single();

    if (error) {
      console.warn('Supabase insertTrip failed (e.g. RLS policy violation), falling back to local storage:', error);
      return localFallback();
    }
    const res = mapTrip(data as TripRow, []);
    const local = getLocalData();
    local.trips = [res, ...local.trips.filter((x) => x.id !== res.id)];
    saveLocalData(local);
    return res;
  } catch (err) {
    console.warn('Supabase insertTrip error:', err);
    return localFallback();
  }
}

export async function updateTrip(id: string, patch: Partial<Trip>): Promise<void> {
  const localFallback = () => {
    const data = getLocalData();
    data.trips = data.trips.map((t) => (t.id === id ? { ...t, ...patch } : t));
    saveLocalData(data);
  };

  if (!isSupabaseConfigured || !isUuid(id)) {
    localFallback();
    return;
  }
  try {
    const row: Record<string, unknown> = {};
    if (patch.driverName !== undefined) row.driver_name = patch.driverName;
    if (patch.vehicle !== undefined) row.vehicle = patch.vehicle;
    if (patch.vehicleId !== undefined) row.vehicle_id = (patch.vehicleId && isUuid(patch.vehicleId)) ? patch.vehicleId : null;
    if (patch.departureAt !== undefined) row.departure_at = patch.departureAt;
    if (patch.returnAt !== undefined) row.return_at = patch.returnAt ?? null;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.totalSales !== undefined) row.total_sales = patch.totalSales;
    if (patch.city !== undefined) row.city = patch.city;
    if (patch.area !== undefined) row.area = patch.area;
    if (patch.notes !== undefined) row.notes = patch.notes;
    const { error } = await supabase.from('trips').update(row).eq('id', id);
    if (error) {
      console.warn('Supabase updateTrip failed, falling back to local:', error);
    }
    localFallback();
  } catch (err) {
    console.warn('Supabase updateTrip error:', err);
    localFallback();
  }
}

export async function deleteTrip(id: string): Promise<void> {
  const localFallback = () => {
    const data = getLocalData();
    data.trips = data.trips.filter((t) => t.id !== id);
    saveLocalData(data);
  };

  if (!isSupabaseConfigured || !isUuid(id)) {
    localFallback();
    return;
  }
  try {
    await supabase.from('trip_items').delete().eq('trip_id', id);
    const { error } = await supabase.from('trips').delete().eq('id', id);
    if (error) {
      console.warn('Supabase deleteTrip failed, falling back to local:', error);
    }
    localFallback();
  } catch (err) {
    console.warn('Supabase deleteTrip error:', err);
    localFallback();
  }
}

export async function insertTripItem(
  tripId: string,
  item: InventoryItem,
  qty: number,
  unitPrice?: number,
  currentUser?: { id: string; name: string },
): Promise<TripItem> {
  const localFallback = () => {
    const data = getLocalData();
    const newTi: TripItem = {
      id: 'ti-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      tripId,
      itemId: item.id,
      oem: item.oem,
      description: item.description,
      loadedQty: qty,
      soldQty: 0,
      returnedQty: 0,
      unitPrice: unitPrice ?? item.sellPrice,
      unitCost: item.purchasePrice,
    };
    const trip = data.trips.find((t) => t.id === tripId);
    if (trip) {
      const existing = trip.items.find((i) => i.itemId === item.id);
      if (existing) {
        existing.loadedQty += qty;
      } else {
        trip.items.push(newTi);
      }
    }
    const inv = data.inventory.find((i) => i.id === item.id);
    if (inv) inv.stock = Math.max(0, inv.stock - qty);

    if (!data.stockMovements) data.stockMovements = [];
    data.stockMovements.unshift({
      id: 'sm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      itemId: item.id,
      oem: item.oem,
      description: item.description,
      type: 'load_vehicle',
      qty,
      source: 'main_warehouse',
      target: 'vehicle',
      vehicleId: trip?.vehicleId,
      vehicleName: trip?.vehicle,
      tripId,
      notes: `تحميل بضاعة من المخزن الرئيسي إلى السيارة`,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.id || 'user-admin',
      createdByName: currentUser?.name || 'مدير التوزيع',
    });

    saveLocalData(data);
    return newTi;
  };

  // If tripId is not a valid UUID (e.g. was generated locally like 'trip-1786804291899'),
  // or if Supabase is not configured, avoid invalid UUID syntax error (22P02) by falling back directly!
  if (!isSupabaseConfigured || !isUuid(tripId)) {
    return localFallback();
  }

  try {
    const { data, error } = await supabase.from('trip_items').insert({
      trip_id: tripId,
      item_id: item.id,
      oem: item.oem,
      description: item.description,
      loaded_qty: qty,
      sold_qty: 0,
      returned_qty: 0,
      unit_price: unitPrice ?? item.sellPrice,
      unit_cost: item.purchasePrice,
    }).select('*').single();

    // Deduct main inventory in supabase if item.id is valid
    if (isUuid(item.id)) {
      const { data: invRow } = await supabase.from('inventory').select('stock').eq('id', item.id).single();
      if (invRow) {
        await supabase.from('inventory').update({ stock: Math.max(0, (invRow as { stock: number }).stock - qty) }).eq('id', item.id);
      }
    }

    if (error) {
      console.warn('Supabase insertTripItem failed, falling back to local:', error);
      return localFallback();
    }
    const res = mapTripItem(data as TripItemRow);
    const local = getLocalData();
    const t = local.trips.find((x) => x.id === tripId);
    if (t) t.items = [...t.items.filter((x) => x.id !== res.id), res];
    const inv = local.inventory.find((i) => i.id === item.id);
    if (inv) inv.stock = Math.max(0, inv.stock - qty);
    saveLocalData(local);
    return res;
  } catch (err) {
    console.warn('Supabase insertTripItem error:', err);
    return localFallback();
  }
}

export async function updateTripItem(id: string, patch: Partial<TripItem>): Promise<void> {
  const localFallback = () => {
    const data = getLocalData();
    for (const t of data.trips) {
      const idx = t.items.findIndex((it) => it.id === id);
      if (idx !== -1) {
        t.items[idx] = { ...t.items[idx], ...patch };
      }
    }
    saveLocalData(data);
  };

  if (!isSupabaseConfigured || !isUuid(id)) {
    localFallback();
    return;
  }
  try {
    const row: Record<string, unknown> = {};
    if (patch.loadedQty !== undefined) row.loaded_qty = patch.loadedQty;
    if (patch.soldQty !== undefined) row.sold_qty = patch.soldQty;
    if (patch.returnedQty !== undefined) row.returned_qty = patch.returnedQty;
    if (patch.unitPrice !== undefined) row.unit_price = patch.unitPrice;
    const { error } = await supabase.from('trip_items').update(row).eq('id', id);
    if (error) {
      console.warn('Supabase updateTripItem failed, falling back to local:', error);
    }
    localFallback();
  } catch (err) {
    console.warn('Supabase updateTripItem error:', err);
    localFallback();
  }
}

export async function deleteTripItem(id: string): Promise<void> {
  const localFallback = () => {
    const data = getLocalData();
    for (const t of data.trips) {
      t.items = t.items.filter((it) => it.id !== id);
    }
    saveLocalData(data);
  };

  if (!isSupabaseConfigured || !isUuid(id)) {
    localFallback();
    return;
  }
  try {
    const { error } = await supabase.from('trip_items').delete().eq('id', id);
    if (error) {
      console.warn('Supabase deleteTripItem failed, falling back to local:', error);
    }
    localFallback();
  } catch (err) {
    console.warn('Supabase deleteTripItem error:', err);
    localFallback();
  }
}

export async function recordTripSale(
  tripItemId: string,
  qty: number,
  shopInfo?: { shopId?: string; shopName?: string },
  currentUser?: { id: string; name: string },
): Promise<{
  soldQty: number;
  remainingQty: number;
  inventoryStock: number;
  tripTotalSales: number;
}> {
  const localFallback = () => {
    const data = getLocalData();
    let foundItem: TripItem | undefined;
    let foundTrip: Trip | undefined;
    for (const t of data.trips) {
      const it = t.items.find((i) => i.id === tripItemId);
      if (it) {
        foundItem = it;
        foundTrip = t;
        break;
      }
    }
    if (foundItem && foundTrip) {
      foundItem.soldQty = (foundItem.soldQty || 0) + qty;
      foundTrip.totalSales = (foundTrip.totalSales || 0) + qty * foundItem.unitPrice;
      const inv = data.inventory.find((i) => i.id === foundItem!.itemId);

      if (!data.stockMovements) data.stockMovements = [];
      data.stockMovements.unshift({
        id: 'sm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        itemId: foundItem.itemId,
        oem: foundItem.oem,
        description: foundItem.description,
        type: 'vehicle_sale',
        qty,
        source: 'vehicle',
        target: 'customer',
        vehicleId: foundTrip.vehicleId,
        vehicleName: foundTrip.vehicle,
        tripId: foundTrip.id,
        shopId: shopInfo?.shopId,
        shopName: shopInfo?.shopName,
        notes: `بيع من السيارة ${foundTrip.vehicle}`,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.id || 'user-admin',
        createdByName: currentUser?.name || 'مندوب المبيعات',
      });

      saveLocalData(data);
      return {
        soldQty: foundItem.soldQty,
        remainingQty: foundItem.loadedQty - foundItem.soldQty - foundItem.returnedQty,
        inventoryStock: inv?.stock ?? 0,
        tripTotalSales: foundTrip.totalSales,
      };
    }
    return { soldQty: qty, remainingQty: 0, inventoryStock: 0, tripTotalSales: 0 };
  };

  if (!isSupabaseConfigured || !isUuid(tripItemId)) {
    return localFallback();
  }

  try {
    const { data, error } = await supabase.rpc('record_trip_sale', {
      p_trip_item_id: tripItemId,
      p_quantity: qty,
    });
    if (error) {
      console.warn('Supabase record_trip_sale RPC failed, falling back to local:', error);
      return localFallback();
    }
    const r = (data as unknown[])[0] as {
      sold_qty: number;
      remaining_qty: number;
      inventory_stock: number;
      trip_total_sales: number;
    };
    return {
      soldQty: r.sold_qty,
      remainingQty: r.remaining_qty,
      inventoryStock: r.inventory_stock,
      tripTotalSales: r.trip_total_sales,
    };
  } catch (err) {
    console.warn('Supabase record_trip_sale error:', err);
    return localFallback();
  }
}

export async function recordTripReturn(
  tripItemId: string,
  qty: number,
  currentUser?: { id: string; name: string },
): Promise<{
  returnedQty: number;
  remainingQty: number;
}> {
  const localFallback = () => {
    const data = getLocalData();
    for (const t of data.trips) {
      const it = t.items.find((i) => i.id === tripItemId);
      if (it) {
        it.returnedQty = (it.returnedQty || 0) + qty;
        const inv = data.inventory.find((i) => i.id === it.itemId);
        if (inv) inv.stock += qty;

        if (!data.stockMovements) data.stockMovements = [];
        data.stockMovements.unshift({
          id: 'sm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          itemId: it.itemId,
          oem: it.oem,
          description: it.description,
          type: 'vehicle_return',
          qty,
          source: 'vehicle',
          target: 'main_warehouse',
          vehicleId: t.vehicleId,
          vehicleName: t.vehicle,
          tripId: t.id,
          notes: `إرجاع بضاعة غير مباعة من السيارة إلى المخزن الرئيسي`,
          createdAt: new Date().toISOString(),
          createdBy: currentUser?.id || 'user-admin',
          createdByName: currentUser?.name || 'مدير المخزن',
        });

        saveLocalData(data);
        return {
          returnedQty: it.returnedQty,
          remainingQty: it.loadedQty - it.soldQty - it.returnedQty,
        };
      }
    }
    return { returnedQty: qty, remainingQty: 0 };
  };

  if (!isSupabaseConfigured || !isUuid(tripItemId)) {
    return localFallback();
  }

  try {
    const { data, error } = await supabase.rpc('record_trip_return', {
      p_trip_item_id: tripItemId,
      p_quantity: qty,
    });
    if (error) {
      console.warn('Supabase record_trip_return RPC failed, falling back to local:', error);
      return localFallback();
    }
    const r = (data as unknown[])[0] as {
      returned_qty: number;
      remaining_qty: number;
    };
    return {
      returnedQty: r.returned_qty,
      remainingQty: r.remaining_qty,
    };
  } catch (err) {
    console.warn('Supabase record_trip_return error:', err);
    return localFallback();
  }
}

// Batch load items into a vehicle trip
export async function batchLoadVehicle(
  tripId: string,
  items: { itemId: string; qty: number; unitPrice?: number }[],
  currentUser: { id: string; name: string },
): Promise<void> {
  const local = getLocalData();
  const trip = local.trips.find((t) => t.id === tripId);
  if (!trip) throw new Error('الرحلة / السيارة غير موجودة');

  // Verify all items exist and have enough stock in main warehouse
  for (const it of items) {
    const inv = local.inventory.find((i) => i.id === it.itemId);
    if (!inv) throw new Error(`الصنف ${it.itemId} غير موجود بالمخزن`);
    if (inv.stock < it.qty) {
      throw new Error(`الكمية المطلوبة (${it.qty}) للصنف "${inv.description}" تفوق المتوفر بالمخزن الرئيسي (${inv.stock})`);
    }
  }

  for (const it of items) {
    const inv = local.inventory.find((i) => i.id === it.itemId)!;
    await insertTripItem(tripId, inv, it.qty, it.unitPrice, currentUser);
  }
}

// Batch return items from vehicle to main warehouse
export async function batchReturnVehicle(
  tripId: string,
  returns: { tripItemId: string; qty: number }[],
  currentUser: { id: string; name: string },
): Promise<void> {
  const local = getLocalData();
  const trip = local.trips.find((t) => t.id === tripId);
  if (!trip) throw new Error('الرحلة غير موجودة');

  for (const r of returns) {
    const ti = trip.items.find((i) => i.id === r.tripItemId);
    if (!ti) throw new Error('الصنف غير موجود بالسيارة');
    const available = ti.loadedQty - ti.soldQty - ti.returnedQty;
    if (r.qty > available) {
      throw new Error(`الكمية المراد إرجاعها (${r.qty}) أكبر من المتبقي في السيارة (${available}) للصنف ${ti.description}`);
    }
  }

  for (const r of returns) {
    await recordTripReturn(r.tripItemId, r.qty, currentUser);
  }
}
