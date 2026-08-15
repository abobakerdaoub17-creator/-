import { supabase } from '@/lib/supabase';
import type { AppData, Shop, Payment, Shipment, InventoryItem, Invoice, InvoiceLine } from '@/types';

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

// ---- Load all ----
export async function loadAppData(): Promise<AppData> {
  const [shops, payments, shipments, inventory, invoices, lines, vehicles, trips, tripItems] = await Promise.all([
    supabase.from('shops').select('*').order('created_at', { ascending: true }),
    supabase.from('payments').select('*').order('date', { ascending: false }),
    supabase.from('shipments').select('*').order('created_at', { ascending: true }),
    supabase.from('inventory').select('*').order('created_at', { ascending: true }),
    supabase.from('invoices').select('*').order('created_at', { ascending: false }),
    supabase.from('invoice_lines').select('*'),
    supabase.from('vehicles').select('*').order('created_at', { ascending: true }),
    supabase.from('trips').select('*').order('created_at', { ascending: false }),
    supabase.from('trip_items').select('*'),
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

  return {
    shops: (shops.data as ShopRow[]).map(mapShop),
    payments: (payments.data as PaymentRow[]).map(mapPayment),
    shipments: (shipments.data as ShipmentRow[]).map(mapShipment),
    inventory: (inventory.data as InventoryRow[]).map(mapInventory),
    invoices: invoiceRows.map((r) => mapInvoice(r, linesByInvoice.get(r.id) ?? [])),
    vehicles: (vehicles.data as VehicleRow[]).map(mapVehicle),
    trips: (trips.data as TripRow[]).map((r) => mapTrip(r, itemsByTrip.get(r.id) ?? [])),
  };
}

// ---- Shops ----
export async function insertShop(s: Omit<Shop, 'id' | 'createdAt'>): Promise<Shop> {
  const { data, error } = await supabase.from('shops').insert({
    name: s.name,
    owner_name: s.ownerName,
    phone: s.phone,
    city: s.city,
    area: s.area,
    opening_balance: s.openingBalance,
  }).select('*').single();
  if (error) throw error;
  return mapShop(data as ShopRow);
}

export async function updateShop(id: string, patch: Partial<Shop>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.ownerName !== undefined) row.owner_name = patch.ownerName;
  if (patch.phone !== undefined) row.phone = patch.phone;
  if (patch.city !== undefined) row.city = patch.city;
  if (patch.area !== undefined) row.area = patch.area;
  if (patch.openingBalance !== undefined) row.opening_balance = patch.openingBalance;
  const { error } = await supabase.from('shops').update(row).eq('id', id);
  if (error) throw error;
}

// ---- Payments ----
export async function insertPayment(p: Omit<Payment, 'id'>): Promise<Payment> {
  const { data, error } = await supabase.from('payments').insert({
    shop_id: p.shopId,
    amount: p.amount,
    method: p.method,
    date: p.date,
    note: p.note ?? null,
    created_by: p.createdBy,
  }).select('*').single();
  if (error) throw error;
  return mapPayment(data as PaymentRow);
}

// ---- Shipments ----
export async function insertShipment(s: Omit<Shipment, 'id'>): Promise<Shipment> {
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
  if (error) throw error;
  return mapShipment(data as ShipmentRow);
}

export async function updateShipment(id: string, patch: Partial<Shipment>): Promise<void> {
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
  if (error) throw error;
}

export async function deleteShipment(id: string): Promise<void> {
  const { error } = await supabase.from('shipments').delete().eq('id', id);
  if (error) throw error;
}

// ---- Inventory ----
export async function insertInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
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
    shipment_id: item.shipmentId ?? null,
  }).select('*').single();
  if (error) throw error;
  return mapInventory(data as InventoryRow);
}

export async function updateInventoryItem(id: string, patch: Partial<InventoryItem>): Promise<void> {
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
  if (patch.shipmentId !== undefined) row.shipment_id = patch.shipmentId ?? null;
  const { error } = await supabase.from('inventory').update(row).eq('id', id);
  if (error) throw error;
}

export async function deleteInventoryItem(id: string): Promise<void> {
  const { error } = await supabase.from('inventory').delete().eq('id', id);
  if (error) throw error;
}

export async function adjustStock(id: string, newStock: number): Promise<void> {
  const { error } = await supabase.from('inventory').update({ stock: newStock }).eq('id', id);
  if (error) throw error;
}

// ---- Invoices ----
export async function createInvoice(
  inv: Omit<Invoice, 'id' | 'number'>,
  nextNumber: string,
): Promise<Invoice> {
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
    created_by: inv.createdBy,
    created_by_name: inv.createdByName,
  }).select('*').single();

  if (invErr) throw invErr;
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
  if (lineErr) throw lineErr;

  // Decrement stock for each line
  for (const line of inv.lines) {
    if (!line.itemId) continue;
    const { data: item } = await supabase.from('inventory').select('stock').eq('id', line.itemId).single();
    if (item) {
      const newStock = Math.max(0, (item as { stock: number }).stock - line.qty);
      await supabase.from('inventory').update({ stock: newStock }).eq('id', line.itemId);
    }
  }

  return mapInvoice(invRow as InvoiceRow, inv.lines);
}

export async function getAllProfiles(): Promise<{ id: string; name: string; role: string; created_at: string; email: string }[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, role, created_at, email')
    .order('created_at', { ascending: true });
  if (error) throw error;

  return (data ?? []).map((p: { id: string; name: string; role: string; created_at: string; email: string }) => ({
    id: p.id,
    name: p.name,
    role: p.role,
    created_at: p.created_at,
    email: p.email ?? '',
  }));
}

export async function updateProfileRole(userId: string, role: 'admin' | 'sales'): Promise<void> {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
  if (error) throw error;
}

export async function getNextInvoiceNumber(existingCount: number): Promise<string> {
  return `INV-${String(existingCount + 1).padStart(4, '0')}`;
}

// ---- Vehicles ----
export async function insertVehicle(v: Omit<Vehicle, 'id' | 'createdAt'>): Promise<Vehicle> {
  const { data, error } = await supabase.from('vehicles').insert({
    name: v.name,
    plate_number: v.plateNumber,
    type: v.type,
    model: v.model,
    status: v.status,
  }).select('*').single();
  if (error) throw error;
  return mapVehicle(data as VehicleRow);
}

export async function updateVehicle(id: string, patch: Partial<Vehicle>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.plateNumber !== undefined) row.plate_number = patch.plateNumber;
  if (patch.type !== undefined) row.type = patch.type;
  if (patch.model !== undefined) row.model = patch.model;
  if (patch.status !== undefined) row.status = patch.status;
  const { error } = await supabase.from('vehicles').update(row).eq('id', id);
  if (error) throw error;
}

export async function deleteVehicle(id: string): Promise<void> {
  const { error } = await supabase.from('vehicles').delete().eq('id', id);
  if (error) throw error;
}

// ---- Trips ----
export async function insertTrip(t: Omit<Trip, 'id' | 'createdAt' | 'items' | 'totalSales'> & { totalSales?: number }): Promise<Trip> {
  const { data, error } = await supabase.from('trips').insert({
    driver_name: t.driverName,
    vehicle: t.vehicle,
    vehicle_id: t.vehicleId ?? null,
    departure_at: t.departureAt,
    return_at: t.returnAt ?? null,
    status: t.status,
    total_sales: t.totalSales ?? 0,
    city: t.city,
    area: t.area,
    notes: t.notes,
    created_by: t.createdBy,
    created_by_name: t.createdByName,
  }).select('*').single();
  if (error) throw error;
  return mapTrip(data as TripRow, []);
}

export async function updateTrip(id: string, patch: Partial<Trip>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.driverName !== undefined) row.driver_name = patch.driverName;
  if (patch.vehicle !== undefined) row.vehicle = patch.vehicle;
  if (patch.vehicleId !== undefined) row.vehicle_id = patch.vehicleId ?? null;
  if (patch.departureAt !== undefined) row.departure_at = patch.departureAt;
  if (patch.returnAt !== undefined) row.return_at = patch.returnAt ?? null;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.totalSales !== undefined) row.total_sales = patch.totalSales;
  if (patch.city !== undefined) row.city = patch.city;
  if (patch.area !== undefined) row.area = patch.area;
  if (patch.notes !== undefined) row.notes = patch.notes;
  const { error } = await supabase.from('trips').update(row).eq('id', id);
  if (error) throw error;
}

export async function deleteTrip(id: string): Promise<void> {
  const { error: itemsErr } = await supabase.from('trip_items').delete().eq('trip_id', id);
  if (itemsErr) throw itemsErr;
  const { error } = await supabase.from('trips').delete().eq('id', id);
  if (error) throw error;
}

export async function insertTripItem(
  tripId: string,
  item: InventoryItem,
  qty: number,
  unitPrice?: number,
): Promise<TripItem> {
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
  if (error) throw error;
  return mapTripItem(data as TripItemRow);
}

export async function updateTripItem(id: string, patch: Partial<TripItem>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.loadedQty !== undefined) row.loaded_qty = patch.loadedQty;
  if (patch.soldQty !== undefined) row.sold_qty = patch.soldQty;
  if (patch.returnedQty !== undefined) row.returned_qty = patch.returnedQty;
  if (patch.unitPrice !== undefined) row.unit_price = patch.unitPrice;
  const { error } = await supabase.from('trip_items').update(row).eq('id', id);
  if (error) throw error;
}

export async function deleteTripItem(id: string): Promise<void> {
  const { error } = await supabase.from('trip_items').delete().eq('id', id);
  if (error) throw error;
}

export async function recordTripSale(tripItemId: string, qty: number): Promise<{
  soldQty: number;
  remainingQty: number;
  inventoryStock: number;
  tripTotalSales: number;
}> {
  const { data, error } = await supabase.rpc('record_trip_sale', {
    p_trip_item_id: tripItemId,
    p_quantity: qty,
  });
  if (error) throw error;
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
}

export async function recordTripReturn(tripItemId: string, qty: number): Promise<{
  returnedQty: number;
  remainingQty: number;
}> {
  const { data, error } = await supabase.rpc('record_trip_return', {
    p_trip_item_id: tripItemId,
    p_quantity: qty,
  });
  if (error) throw error;
  const r = (data as unknown[])[0] as {
    returned_qty: number;
    remaining_qty: number;
  };
  return {
    returnedQty: r.returned_qty,
    remainingQty: r.remaining_qty,
  };
}
