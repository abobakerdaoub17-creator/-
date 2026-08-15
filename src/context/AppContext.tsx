import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { AppData, CurrentUser, Shop, Payment, Shipment, InventoryItem, Invoice, Vehicle, Trip, TripItem, StockMovement, PaymentMethod } from '@/types';
import * as db from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import { initialDemoData } from '@/lib/demoData';

interface AppContextType {
  data: AppData;
  loading: boolean;
  currentUser: CurrentUser;
  role: 'admin' | 'sales';
  reload: () => Promise<void>;
  // Shops
  addShop: (s: Omit<Shop, 'id' | 'createdAt'>) => Promise<Shop>;
  updateShop: (id: string, patch: Partial<Shop>) => Promise<void>;
  addPayment: (p: Omit<Payment, 'id'>) => Promise<Payment>;
  // Shipments
  addShipment: (s: Omit<Shipment, 'id'>) => Promise<Shipment>;
  updateShipment: (id: string, patch: Partial<Shipment>) => Promise<void>;
  deleteShipment: (id: string) => Promise<void>;
  // Inventory
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => Promise<InventoryItem>;
  updateInventoryItem: (id: string, patch: Partial<InventoryItem>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  adjustStock: (id: string, newStock: number, reason?: string) => Promise<void>;
  // Invoices
  addInvoice: (inv: Omit<Invoice, 'id' | 'number'>) => Promise<Invoice>;
  // Vehicles
  addVehicle: (v: Omit<Vehicle, 'id' | 'createdAt'>) => Promise<Vehicle>;
  updateVehicle: (id: string, patch: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  // Trips & Vehicle Inventory
  addTrip: (t: Omit<Trip, 'id' | 'createdAt' | 'items' | 'totalSales'>) => Promise<Trip>;
  updateTrip: (id: string, patch: Partial<Trip>) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  addTripItem: (tripId: string, item: InventoryItem | string, qty: number, unitPrice?: number) => Promise<TripItem | undefined>;
  updateTripItem: (id: string, patch: Partial<TripItem>) => Promise<void>;
  deleteTripItem: (id: string) => Promise<void>;
  recordTripSale: (tripItemId: string, qty: number, shopInfo?: { shopId?: string; shopName?: string }) => Promise<void>;
  recordTripReturn: (tripItemId: string, qty: number) => Promise<void>;
  batchLoadVehicle: (tripId: string, items: { itemId: string; qty: number; unitPrice?: number }[]) => Promise<void>;
  batchReturnVehicle: (tripId: string, returns: { tripItemId: string; qty: number }[]) => Promise<void>;
  sellFromVehicle: (params: {
    tripId: string;
    shopId: string;
    shopName: string;
    lines: { tripItemId: string; itemId: string; oem: string; description: string; qty: number; unitPrice: number; unitCost: number }[];
    paymentMethod: PaymentMethod;
    paidAmount: number;
    notes?: string;
  }) => Promise<Invoice>;
  // Stock Movements
  addStockMovement: (m: Omit<StockMovement, 'id' | 'createdAt'>) => Promise<StockMovement>;
  // Helpers
  shopDebt: (shopId: string) => number;
  shopBalance: (shopId: string) => number;
  createTrip: (t: Omit<Trip, 'id' | 'createdAt' | 'items' | 'totalSales'>) => Promise<Trip>;
  totalOutstanding: () => number;
  debtsByCity: () => { city: string; debt: number; shopCount: number }[];
  getVehicleInventory: (vehicleIdOrTripId?: string) => {
    tripId: string;
    tripName: string;
    vehicleName: string;
    driverName: string;
    items: {
      tripItemId: string;
      itemId: string;
      oem: string;
      description: string;
      loadedQty: number;
      soldQty: number;
      returnedQty: number;
      availableQty: number;
      unitPrice: number;
      unitCost: number;
    }[];
  }[];
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { currentUser, role } = useAuth();
  const [data, setData] = useState<AppData>(initialDemoData);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const d = await db.loadAppData();
      setData(d);
    } catch (e) {
      console.error('Failed to load app data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // ---- Shops ----
  const addShop = async (s: Omit<Shop, 'id' | 'createdAt'>) => {
    const created = await db.insertShop(s);
    setData((d) => ({ ...d, shops: [...d.shops, created] }));
    return created;
  };

  const updateShop = async (id: string, patch: Partial<Shop>) => {
    await db.updateShop(id, patch);
    setData((d) => ({
      ...d,
      shops: d.shops.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };

  const addPayment = async (p: Omit<Payment, 'id'>) => {
    const created = await db.insertPayment(p);
    setData((d) => ({ ...d, payments: [created, ...d.payments] }));
    return created;
  };

  // ---- Shipments ----
  const addShipment = async (s: Omit<Shipment, 'id'>) => {
    const created = await db.insertShipment(s);
    setData((d) => ({ ...d, shipments: [...d.shipments, created] }));
    return created;
  };

  const updateShipment = async (id: string, patch: Partial<Shipment>) => {
    await db.updateShipment(id, patch);
    setData((d) => ({
      ...d,
      shipments: d.shipments.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };

  const deleteShipment = async (id: string) => {
    await db.deleteShipment(id);
    setData((d) => ({ ...d, shipments: d.shipments.filter((s) => s.id !== id) }));
  };

  // ---- Inventory ----
  const addInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
    const created = await db.insertInventoryItem(item);
    setData((d) => ({ ...d, inventory: [...d.inventory, created] }));
    return created;
  };

  const updateInventoryItem = async (id: string, patch: Partial<InventoryItem>) => {
    await db.updateInventoryItem(id, patch);
    setData((d) => ({
      ...d,
      inventory: d.inventory.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));
  };

  const deleteInventoryItem = async (id: string) => {
    await db.deleteInventoryItem(id);
    setData((d) => ({ ...d, inventory: d.inventory.filter((i) => i.id !== id) }));
  };

  const adjustStock = async (id: string, newStock: number, reason?: string) => {
    await db.adjustStock(id, newStock, currentUser, reason);
    await reload();
  };

  // ---- Invoices ----
  const addInvoice = async (inv: Omit<Invoice, 'id' | 'number'>) => {
    const nextNumber = await db.getNextInvoiceNumber(data.invoices.length);
    const created = await db.createInvoice(inv, nextNumber);
    await reload();
    return created;
  };

  // ---- Vehicles ----
  const addVehicle = async (v: Omit<Vehicle, 'id' | 'createdAt'>) => {
    const created = await db.insertVehicle(v);
    setData((d) => ({ ...d, vehicles: [...d.vehicles, created] }));
    return created;
  };

  const updateVehicle = async (id: string, patch: Partial<Vehicle>) => {
    await db.updateVehicle(id, patch);
    setData((d) => ({
      ...d,
      vehicles: d.vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    }));
  };

  const deleteVehicle = async (id: string) => {
    await db.deleteVehicle(id);
    setData((d) => ({ ...d, vehicles: d.vehicles.filter((v) => v.id !== id) }));
  };

  // ---- Trips & Vehicle Inventory ----
  const addTrip = async (t: Omit<Trip, 'id' | 'createdAt' | 'items' | 'totalSales'>) => {
    const created = await db.insertTrip(t);
    setData((d) => ({ ...d, trips: [created, ...d.trips] }));
    return created;
  };

  const updateTrip = async (id: string, patch: Partial<Trip>) => {
    await db.updateTrip(id, patch);
    setData((d) => ({
      ...d,
      trips: d.trips.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  };

  const deleteTrip = async (id: string) => {
    await db.deleteTrip(id);
    setData((d) => ({ ...d, trips: d.trips.filter((t) => t.id !== id) }));
  };

  const addTripItem = async (tripId: string, itemOrId: InventoryItem | string, qty: number, unitPrice?: number) => {
    const item = typeof itemOrId === 'string' ? data.inventory.find((i) => i.id === itemOrId) : itemOrId;
    if (!item) return undefined;
    const created = await db.insertTripItem(tripId, item, qty, unitPrice, currentUser);
    await reload();
    return created;
  };

  const updateTripItem = async (id: string, patch: Partial<TripItem>) => {
    await db.updateTripItem(id, patch);
    await reload();
  };

  const deleteTripItem = async (id: string) => {
    await db.deleteTripItem(id);
    await reload();
  };

  const recordTripSale = async (tripItemId: string, qty: number, shopInfo?: { shopId?: string; shopName?: string }) => {
    await db.recordTripSale(tripItemId, qty, shopInfo, currentUser);
    await reload();
  };

  const recordTripReturn = async (tripItemId: string, qty: number) => {
    await db.recordTripReturn(tripItemId, qty, currentUser);
    await reload();
  };

  const batchLoadVehicle = async (tripId: string, items: { itemId: string; qty: number; unitPrice?: number }[]) => {
    await db.batchLoadVehicle(tripId, items, currentUser);
    await reload();
  };

  const batchReturnVehicle = async (tripId: string, returns: { tripItemId: string; qty: number }[]) => {
    await db.batchReturnVehicle(tripId, returns, currentUser);
    await reload();
  };

  const sellFromVehicle = async ({
    tripId,
    shopId,
    shopName,
    lines,
    paymentMethod,
    paidAmount,
  }: {
    tripId: string;
    shopId: string;
    shopName: string;
    lines: { tripItemId: string; itemId: string; oem: string; description: string; qty: number; unitPrice: number; unitCost: number }[];
    paymentMethod: PaymentMethod;
    paidAmount: number;
    notes?: string;
  }): Promise<Invoice> => {
    const trip = data.trips.find((t) => t.id === tripId);
    if (!trip) throw new Error('الرحلة غير موجودة');

    // Verify stock in vehicle
    for (const l of lines) {
      const ti = trip.items.find((i) => i.id === l.tripItemId);
      if (!ti) throw new Error(`الصنف ${l.description} غير موجود في حمولة السيارة`);
      const available = ti.loadedQty - ti.soldQty - ti.returnedQty;
      if (l.qty > available) {
        throw new Error(`الكمية المطلوبة (${l.qty}) أكبر من المتوفر في السيارة (${available}) للصنف: ${ti.description}`);
      }
    }

    const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
    const totalCost = lines.reduce((s, l) => s + l.qty * l.unitCost, 0);
    const total = subtotal;

    const invoiceLines = lines.map((l) => ({
      itemId: l.itemId,
      oem: l.oem,
      description: l.description,
      qty: l.qty,
      unitPrice: l.unitPrice,
      unitCost: l.unitCost,
      lineTotal: l.qty * l.unitPrice,
      lineCost: l.qty * l.unitCost,
    }));

    const nextNumber = await db.getNextInvoiceNumber(data.invoices.length);
    const invoice = await db.createInvoice({
      shopId,
      shopName,
      date: new Date().toISOString().slice(0, 10),
      lines: invoiceLines,
      subtotal,
      discount: 0,
      total,
      totalCost,
      paymentMethod,
      paidAmount,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      status: paidAmount >= total ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
      source: 'vehicle',
      tripId,
      vehicleId: trip.vehicleId,
    }, nextNumber);

    await reload();
    return invoice;
  };

  const addStockMovement = async (m: Omit<StockMovement, 'id' | 'createdAt'>) => {
    const created = await db.insertStockMovement(m);
    await reload();
    return created;
  };

  // ---- Stock & Debt Calculations ----
  const shopDebt = (shopId: string) => {
    const shop = data.shops.find((s) => s.id === shopId);
    if (!shop) return 0;
    const invTotal = data.invoices
      .filter((i) => i.shopId === shopId)
      .reduce((s, i) => s + (i.total - i.paidAmount), 0);
    const payTotal = data.payments
      .filter((p) => p.shopId === shopId)
      .reduce((s, p) => s + p.amount, 0);
    return Math.max(0, shop.openingBalance + invTotal - payTotal);
  };

  const totalOutstanding = () => {
    return data.shops.reduce((sum, s) => sum + shopDebt(s.id), 0);
  };

  const debtsByCity = () => {
    const map = new Map<string, { debt: number; shopCount: number }>();
    for (const shop of data.shops) {
      const d = shopDebt(shop.id);
      const cur = map.get(shop.city) ?? { debt: 0, shopCount: 0 };
      map.set(shop.city, { debt: cur.debt + d, shopCount: cur.shopCount + 1 });
    }
    return Array.from(map.entries()).map(([city, v]) => ({
      city,
      debt: v.debt,
      shopCount: v.shopCount,
    })).sort((a, b) => b.debt - a.debt);
  };

  const getVehicleInventory = (vehicleIdOrTripId?: string) => {
    let targetTrips = data.trips.filter((t) => t.status === 'active' || t.status === 'loading');
    if (vehicleIdOrTripId) {
      targetTrips = data.trips.filter(
        (t) => t.id === vehicleIdOrTripId || t.vehicleId === vehicleIdOrTripId
      );
    }
    return targetTrips.map((t) => ({
      tripId: t.id,
      tripName: `${t.vehicle} - ${t.driverName}`,
      vehicleName: t.vehicle,
      driverName: t.driverName,
      items: t.items.map((it) => ({
        tripItemId: it.id,
        itemId: it.itemId,
        oem: it.oem,
        description: it.description,
        loadedQty: it.loadedQty,
        soldQty: it.soldQty,
        returnedQty: it.returnedQty,
        availableQty: Math.max(0, it.loadedQty - it.soldQty - it.returnedQty),
        unitPrice: it.unitPrice,
        unitCost: it.unitCost,
      })),
    }));
  };

  return (
    <AppContext.Provider
      value={{
        data,
        loading,
        currentUser,
        role,
        reload,
        addShop,
        updateShop,
        addPayment,
        addShipment,
        updateShipment,
        deleteShipment,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        adjustStock,
        addInvoice,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        addTrip,
        createTrip: addTrip,
        updateTrip,
        deleteTrip,
        addTripItem,
        updateTripItem,
        deleteTripItem,
        recordTripSale,
        recordTripReturn,
        batchLoadVehicle,
        batchReturnVehicle,
        sellFromVehicle,
        addStockMovement,
        shopDebt,
        shopBalance: shopDebt,
        totalOutstanding,
        debtsByCity,
        getVehicleInventory,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
