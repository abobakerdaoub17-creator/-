import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { AppData, Invoice, InventoryItem, Payment, Shipment, Shop, Trip, TripItem, User, Vehicle } from '@/types';
import { useAuth } from '@/context/AuthContext';
import * as db from '@/lib/db';

interface AppState {
  currentUser: User;
  role: User['role'];
  data: AppData;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  shopBalance: (shopId: string) => number;
  totalOutstanding: () => number;
  debtsByCity: () => { city: string; area?: string; debt: number; shopCount: number }[];
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  updateInventoryItem: (id: string, patch: Partial<InventoryItem>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  adjustStock: (id: string, delta: number) => Promise<void>;
  addVehicle: (v: Omit<Vehicle, 'id' | 'createdAt'>) => Promise<void>;
  updateVehicle: (id: string, patch: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  createTrip: (t: Omit<Trip, 'id' | 'createdAt' | 'items' | 'totalSales'>) => Promise<string>;
  updateTrip: (id: string, patch: Partial<Trip>) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  addTripItem: (tripId: string, itemId: string, qty: number, unitPrice?: number) => Promise<void>;
  updateTripItem: (id: string, patch: Partial<TripItem>) => Promise<void>;
  deleteTripItem: (id: string) => Promise<void>;
  recordTripSale: (tripItemId: string, qty: number) => Promise<void>;
  recordTripReturn: (tripItemId: string, qty: number) => Promise<void>;
  addShipment: (s: Omit<Shipment, 'id'>) => Promise<void>;
  updateShipment: (id: string, patch: Partial<Shipment>) => Promise<void>;
  deleteShipment: (id: string) => Promise<void>;
  addShop: (s: Omit<Shop, 'id' | 'createdAt'>) => Promise<void>;
  updateShop: (id: string, patch: Partial<Shop>) => Promise<void>;
  createInvoice: (inv: Omit<Invoice, 'id' | 'number'>) => Promise<string>;
  addPayment: (p: Omit<Payment, 'id' | 'createdBy'>) => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used within AppProvider');
  return v;
}

const emptyData: AppData = { shops: [], payments: [], shipments: [], inventory: [], invoices: [], vehicles: [], trips: [] };

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const d = await db.loadAppData();
      setData(d);
    } catch (e) {
      setError('فشل تحميل البيانات');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setLoading(true);
      reload();
    } else {
      setData(emptyData);
      setLoading(false);
    }
  }, [user, reload]);

  const shopBalance = useCallback((shopId: string): number => {
    const shop = data.shops.find((s) => s.id === shopId);
    if (!shop) return 0;
    const opening = shop.openingBalance;
    const invoicesCredit = data.invoices
      .filter((i) => i.shopId === shopId)
      .reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0);
    const paymentsMade = data.payments
      .filter((p) => p.shopId === shopId)
      .reduce((sum, p) => sum + p.amount, 0);
    return opening + invoicesCredit - paymentsMade;
  }, [data]);

  const totalOutstanding = useCallback((): number =>
    data.shops.reduce((sum, s) => sum + Math.max(0, shopBalance(s.id)), 0),
    [data.shops, shopBalance]);

  const debtsByCity = useCallback(() => {
    const map = new Map<string, { debt: number; shopCount: number }>();
    data.shops.forEach((s) => {
      const bal = Math.max(0, shopBalance(s.id));
      const key = s.city || 'other';
      const ex = map.get(key) ?? { debt: 0, shopCount: 0 };
      ex.debt += bal;
      ex.shopCount += 1;
      map.set(key, ex);
    });
    return Array.from(map.entries())
      .map(([city, v]) => ({ city, debt: v.debt, shopCount: v.shopCount }))
      .sort((a, b) => b.debt - a.debt);
  }, [data.shops, shopBalance]);

  const addInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
    const created = await db.insertInventoryItem(item);
    setData((d) => ({ ...d, inventory: [...d.inventory, created] }));
  };

  const updateInventoryItem = async (id: string, patch: Partial<InventoryItem>) => {
    await db.updateInventoryItem(id, patch);
    setData((d) => ({ ...d, inventory: d.inventory.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
  };

  const deleteInventoryItem = async (id: string) => {
    await db.deleteInventoryItem(id);
    setData((d) => ({ ...d, inventory: d.inventory.filter((i) => i.id !== id) }));
  };

  const adjustStock = async (id: string, delta: number) => {
    const item = data.inventory.find((i) => i.id === id);
    if (!item) return;
    const newStock = Math.max(0, item.stock + delta);
    await db.adjustStock(id, newStock);
    setData((d) => ({ ...d, inventory: d.inventory.map((i) => (i.id === id ? { ...i, stock: newStock } : i)) }));
  };

  const addVehicle = async (v: Omit<Vehicle, 'id' | 'createdAt'>) => {
    const created = await db.insertVehicle(v);
    setData((d) => ({ ...d, vehicles: [...d.vehicles, created] }));
  };
  const updateVehicle = async (id: string, patch: Partial<Vehicle>) => {
    await db.updateVehicle(id, patch);
    setData((d) => ({ ...d, vehicles: d.vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)) }));
  };
  const deleteVehicle = async (id: string) => {
    await db.deleteVehicle(id);
    setData((d) => ({ ...d, vehicles: d.vehicles.filter((v) => v.id !== id) }));
  };

  const createTrip = async (t: Omit<Trip, 'id' | 'createdAt' | 'items' | 'totalSales'>): Promise<string> => {
    const created = await db.insertTrip(t);
    setData((d) => ({ ...d, trips: [{ ...created, items: [] }, ...d.trips] }));
    return created.id;
  };
  const updateTrip = async (id: string, patch: Partial<Trip>) => {
    await db.updateTrip(id, patch);
    setData((d) => ({ ...d, trips: d.trips.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  };
  const deleteTrip = async (id: string) => {
    await db.deleteTrip(id);
    setData((d) => ({ ...d, trips: d.trips.filter((t) => t.id !== id) }));
  };

  const addTripItem = async (tripId: string, itemId: string, qty: number, unitPrice?: number) => {
    const item = data.inventory.find((i) => i.id === itemId);
    if (!item) return;
    if (item.stock < qty) throw new Error('الكمية المطلوبة أكبر من المخزون المتوفر');
    const created = await db.insertTripItem(tripId, item, qty, unitPrice);
    setData((d) => ({
      ...d,
      trips: d.trips.map((t) => (t.id === tripId ? { ...t, items: [...t.items, created] } : t)),
      inventory: d.inventory.map((i) => (i.id === itemId ? { ...i, stock: i.stock - qty } : i)),
    }));
  };
  const updateTripItem = async (id: string, patch: Partial<TripItem>) => {
    await db.updateTripItem(id, patch);
    setData((d) => {
      const oldItem = d.trips.flatMap((t) => t.items).find((it) => it.id === id);
      const loadedDiff = patch.loadedQty !== undefined && oldItem ? patch.loadedQty - oldItem.loadedQty : 0;
      return {
        ...d,
        trips: d.trips.map((t) => ({
          ...t,
          items: t.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
        })),
        inventory: loadedDiff !== 0 && oldItem
          ? d.inventory.map((i) =>
              i.id === oldItem.itemId ? { ...i, stock: Math.max(0, i.stock - loadedDiff) } : i,
            )
          : d.inventory,
      };
    });
  };
  const deleteTripItem = async (id: string) => {
    const trip = data.trips.find((t) => t.items.some((it) => it.id === id));
    const tripItem = trip?.items.find((it) => it.id === id);
    if (!tripItem) return;
    await db.deleteTripItem(id);
    const remaining = tripItem.loadedQty - tripItem.soldQty - tripItem.returnedQty;
    setData((d) => ({
      ...d,
      trips: d.trips.map((t) => ({
        ...t,
        items: t.items.filter((it) => it.id !== id),
      })),
      inventory: d.inventory.map((i) =>
        i.id === tripItem.itemId ? { ...i, stock: i.stock + remaining } : i,
      ),
    }));
  };

  const recordTripSale = async (tripItemId: string, qty: number) => {
    const result = await db.recordTripSale(tripItemId, qty);
    setData((d) => {
      const tripItem = d.trips.flatMap((t) => t.items).find((it) => it.id === tripItemId);
      return {
        ...d,
        trips: d.trips.map((t) => ({
          ...t,
          totalSales: t.items.some((it) => it.id === tripItemId) ? result.tripTotalSales : t.totalSales,
          items: t.items.map((it) =>
            it.id === tripItemId ? { ...it, soldQty: result.soldQty } : it,
          ),
        })),
        inventory: d.inventory.map((i) =>
          tripItem && i.id === tripItem.itemId ? { ...i, stock: result.inventoryStock } : i,
        ),
      };
    });
  };
  const recordTripReturn = async (tripItemId: string, qty: number) => {
    const result = await db.recordTripReturn(tripItemId, qty);
    setData((d) => ({
      ...d,
      trips: d.trips.map((t) => ({
        ...t,
        items: t.items.map((it) =>
          it.id === tripItemId ? { ...it, returnedQty: result.returnedQty } : it,
        ),
      })),
    }));
  };

  const addShipment = async (s: Omit<Shipment, 'id'>) => {
    const created = await db.insertShipment(s);
    setData((d) => ({ ...d, shipments: [...d.shipments, created] }));
  };

  const updateShipment = async (id: string, patch: Partial<Shipment>) => {
    await db.updateShipment(id, patch);
    setData((d) => ({ ...d, shipments: d.shipments.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
  };

  const deleteShipment = async (id: string) => {
    await db.deleteShipment(id);
    setData((d) => ({ ...d, shipments: d.shipments.filter((s) => s.id !== id) }));
  };

  const addShop = async (s: Omit<Shop, 'id' | 'createdAt'>) => {
    const created = await db.insertShop(s);
    setData((d) => ({ ...d, shops: [...d.shops, created] }));
  };

  const updateShop = async (id: string, patch: Partial<Shop>) => {
    await db.updateShop(id, patch);
    setData((d) => ({ ...d, shops: d.shops.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
  };

  const createInvoice = async (inv: Omit<Invoice, 'id' | 'number'>): Promise<string> => {
    const nextNum = await db.getNextInvoiceNumber(data.invoices.length);
    const created = await db.createInvoice(inv, nextNum);
    setData((d) => ({
      ...d,
      invoices: [created, ...d.invoices],
      inventory: d.inventory.map((i) => {
        const line = inv.lines.find((l) => l.itemId === i.id);
        return line ? { ...i, stock: Math.max(0, i.stock - line.qty) } : i;
      }),
    }));
    return created.id;
  };

  const addPayment = async (p: Omit<Payment, 'id' | 'createdBy'>) => {
    const created = await db.insertPayment({ ...p, createdBy: user?.id ?? '' });
    setData((d) => ({ ...d, payments: [created, ...d.payments] }));
  };

  return (
    <Ctx.Provider value={{
      currentUser: user!,
      role: user?.role ?? 'sales',
      data, loading, error, reload,
      shopBalance, totalOutstanding, debtsByCity,
      addInventoryItem, updateInventoryItem, deleteInventoryItem, adjustStock,
      addVehicle, updateVehicle, deleteVehicle,
      createTrip, updateTrip, deleteTrip,
      addTripItem, updateTripItem, deleteTripItem,
      recordTripSale, recordTripReturn,
      addShipment, updateShipment, deleteShipment,
      addShop, updateShop,
      createInvoice, addPayment,
    }}>
      {children}
    </Ctx.Provider>
  );
}
