import { useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  Search,
  X,
  Trash2,
  Package,
  ShoppingCart,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Badge } from '@/components/ui/Badge';
import { Button, Input, EmptyState } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import { formatAed, formatDate, todayISO } from '@/lib/format';
import type { Trip, TripItem } from '@/types';

export function Trips() {
  const { role, data, createTrip, batchLoadVehicle, deleteTrip, updateTrip, currentUser } = useApp();
  const isAdmin = role === 'admin';
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [loadMoreTrip, setLoadMoreTrip] = useState<Trip | null>(null);
  const [viewTripDetail, setViewTripDetail] = useState<Trip | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return data.trips.filter((t) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        t.driverName.toLowerCase().includes(q) ||
        (t.vehicle && t.vehicle.toLowerCase().includes(q)) ||
        t.items.some((it) => it.description.toLowerCase().includes(q) || it.oem.toLowerCase().includes(q));
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [data.trips, query, statusFilter]);

  const statusTone: Record<Trip['status'], 'primary' | 'success' | 'warning' | 'error'> = {
    loading: 'warning',
    active: 'primary',
    completed: 'success',
    cancelled: 'error',
  };
  const statusLabel: Record<Trip['status'], string> = {
    loading: 'قيد التحميل',
    active: 'في جولة توزيع',
    completed: 'مكتملة ومُرجعة',
    cancelled: 'ملغاة',
  };

  // Overall Statistics for Vehicle Trips
  const activeTrips = data.trips.filter((t) => t.status === 'active' || t.status === 'loading');
  
  const totalLoadedAll = data.trips.reduce(
    (sum, t) => sum + t.items.reduce((s, i) => s + i.loadedQty, 0),
    0
  );
  const totalSoldAll = data.trips.reduce(
    (sum, t) => sum + t.items.reduce((s, i) => s + i.soldQty, 0),
    0
  );
  const totalReturnedAll = data.trips.reduce(
    (sum, t) => sum + t.items.reduce((s, i) => s + i.returnedQty, 0),
    0
  );
  const totalRemainingActive = activeTrips.reduce(
    (sum, t) => sum + t.items.reduce((s, i) => s + (i.loadedQty - i.soldQty - i.returnedQty), 0),
    0
  );
  const totalSalesAll = data.trips.reduce((sum, t) => sum + (t.totalSales || 0), 0);

  return (
    <div className="space-y-4 animate-fade-in" id="trips-page">
      {/* Primary Statistics Header: Goods In Cars, Sold, and Remaining */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Loaded in cars */}
        <div className="rounded-2xl bg-white ring-1 ring-secondary-100 shadow-sm p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-secondary-500 font-medium">كم معي بضاعة في السيارة (المحمل)</p>
            <p className="text-xl font-bold text-secondary-900 tabular-nums">
              {totalLoadedAll} <span className="text-xs font-normal text-secondary-500">قطعة إجمالاً</span>
            </p>
            <p className="text-[11px] text-primary-600 font-medium">{activeTrips.length} سيارة نشطة حالياً</p>
          </div>
        </div>

        {/* 2. Remaining in cars */}
        <div className="rounded-2xl bg-white ring-1 ring-secondary-100 shadow-sm p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-warning-50 text-warning-600 flex items-center justify-center shrink-0">
            <Boxes className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-secondary-500 font-medium">المتبقي في السيارة (جاهز للبيع)</p>
            <p className="text-xl font-bold text-warning-700 tabular-nums">
              {totalRemainingActive} <span className="text-xs font-normal text-secondary-500">قطعة متبقية</span>
            </p>
            <p className="text-[11px] text-secondary-400">ينقص تلقائياً مع كل فاتورة بيع</p>
          </div>
        </div>

        {/* 3. Sold from trips */}
        <div className="rounded-2xl bg-white ring-1 ring-secondary-100 shadow-sm p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-success-50 text-success-600 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-secondary-500 font-medium">إجمالي المباع من الجولات</p>
            <p className="text-xl font-bold text-success-700 tabular-nums">
              {totalSoldAll} <span className="text-xs font-normal text-secondary-500">قطعة تم بيعها</span>
            </p>
            <p className="text-[11px] text-success-600 font-medium">{formatAed(totalSalesAll)} مبيعات</p>
          </div>
        </div>

        {/* 4. Returned to warehouse */}
        <div className="rounded-2xl bg-white ring-1 ring-secondary-100 shadow-sm p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-secondary-100 text-secondary-600 flex items-center justify-center shrink-0">
            <ArrowUpFromLine className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-secondary-500 font-medium">المرتجع للمخزن الرئيسي</p>
            <p className="text-xl font-bold text-secondary-800 tabular-nums">
              {totalReturnedAll} <span className="text-xs font-normal text-secondary-500">قطعة مسترجعة</span>
            </p>
            <p className="text-[11px] text-secondary-400">عند انتهاء وتسليم الجولة</p>
          </div>
        </div>
      </div>

      {/* Action Bar & Filter */}
      <div className="rounded-2xl bg-white ring-1 ring-secondary-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث باسم السائق أو اسم القطعة أو رقم OEM..."
              className="w-full rounded-xl border-0 bg-secondary-50 pr-11 pl-4 py-2.5 text-secondary-900 placeholder:text-secondary-400 ring-1 ring-inset ring-secondary-200 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none text-sm"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl bg-secondary-50 px-3 py-2 text-sm text-secondary-700 ring-1 ring-inset ring-secondary-200 focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="all">كل الجولات</option>
              <option value="active">الجولات النشطة</option>
              <option value="loading">قيد التحميل</option>
              <option value="completed">المكتملة</option>
            </select>

            <Button
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setCreateOpen(true)}
              size="md"
            >
              إضافة جولة جديدة
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-semibold text-secondary-700">
          جولات وسيارات التوزيع ({filtered.length})
        </p>
        <span className="text-xs text-secondary-500">
          البيع عبر شاشة الفواتير يخصم تلقائياً من كمية الجولة
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white ring-1 ring-secondary-100 p-8">
          <EmptyState
            icon={<Truck className="w-8 h-8" />}
            title="لا توجد جولات توزيع مسجلة"
            description="اضغط على زر (إضافة جولة جديدة) لتحديد اسم السائق وتحميل كميات البضاعة مباشرة في السيارة"
            action={<Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>إضافة جولة جديدة</Button>}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((trip) => {
            const totalItemsCount = trip.items.length;
            const totalLoaded = trip.items.reduce((s, i) => s + i.loadedQty, 0);
            const totalSold = trip.items.reduce((s, i) => s + i.soldQty, 0);
            const totalReturned = trip.items.reduce((s, i) => s + i.returnedQty, 0);
            const remaining = totalLoaded - totalSold - totalReturned;
            const isCompleted = trip.status === 'completed';

            return (
              <div
                key={trip.id}
                className="rounded-2xl bg-white ring-1 ring-secondary-100 shadow-sm p-4 sm:p-5 transition-all space-y-4"
              >
                {/* Trip Top Row: Driver Name & Stock Indicators */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-secondary-900 text-base">
                          السائق: {trip.driverName}
                        </h3>
                        <Badge tone={statusTone[trip.status]}>{statusLabel[trip.status]}</Badge>
                      </div>
                      <p className="text-xs text-secondary-400 mt-0.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>تاريخ الجولة: {formatDate(trip.departureAt)}</span>
                        {trip.vehicle && (
                          <>
                            <span>•</span>
                            <span>السيارة: {trip.vehicle}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {!isCompleted && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<ArrowDownToLine className="w-4 h-4" />}
                        onClick={() => setLoadMoreTrip(trip)}
                      >
                        + إضافة بضاعة للسيارة
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewTripDetail(trip)}
                    >
                      تفاصيل ومبيعات الجولة
                    </Button>
                    {isAdmin && (
                      <button
                        onClick={() => setDeleteId(trip.id)}
                        className="p-2 text-secondary-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                        title="حذف الجولة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Stock Status Bar in Vehicle */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-secondary-50/80 border border-secondary-100 text-center">
                  <div className="p-2 rounded-lg bg-white shadow-2xs">
                    <span className="text-[11px] text-secondary-500 font-medium block">كم معي في السيارة (المحمل)</span>
                    <span className="text-lg font-bold text-secondary-900 tabular-nums">{totalLoaded} <span className="text-xs font-normal">قطعة</span></span>
                  </div>

                  <div className="p-2 rounded-lg bg-white shadow-2xs">
                    <span className="text-[11px] text-secondary-500 font-medium block">المباع</span>
                    <span className="text-lg font-bold text-success-600 tabular-nums">{totalSold} <span className="text-xs font-normal">قطعة</span></span>
                  </div>

                  <div className="p-2 rounded-lg bg-white shadow-2xs">
                    <span className="text-[11px] text-secondary-500 font-medium block">المتبقي بالسيارة الآن</span>
                    <span className="text-lg font-bold text-warning-700 tabular-nums">{remaining} <span className="text-xs font-normal">قطعة</span></span>
                  </div>

                  <div className="p-2 rounded-lg bg-white shadow-2xs">
                    <span className="text-[11px] text-secondary-500 font-medium block">إجمالي مبيعات الجولة</span>
                    <span className="text-lg font-bold text-primary-700 tabular-nums">{formatAed(trip.totalSales || 0)}</span>
                  </div>
                </div>

                {/* Direct Goods Table Inside the Trip Card */}
                {trip.items.length === 0 ? (
                  <div className="py-4 text-center text-xs text-secondary-400 bg-secondary-50/40 rounded-xl border border-dashed border-secondary-200">
                    لا توجد بضاعة محملة في هذه الجولة بعد. اضغط على (+ إضافة بضاعة للسيارة) للبدء.
                  </div>
                ) : (
                  <div className="rounded-xl border border-secondary-200 overflow-hidden">
                    <div className="bg-secondary-100/70 px-3 py-2 text-xs font-semibold text-secondary-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-primary-600" />
                        كشف بضاعة السيارة ({trip.items.length} صنف مسجل)
                      </span>
                      <span className="text-[11px] text-secondary-500">
                        المتبقي ينقص آلياً عند تحرير أي فاتورة بيع
                      </span>
                    </div>

                    <div className="overflow-x-auto scrollbar-thin">
                      <table className="w-full text-xs">
                        <thead className="bg-secondary-50 text-secondary-600 border-b border-secondary-100">
                          <tr>
                            <th className="text-right px-3 py-2 font-medium">اسم القطعة والوصف</th>
                            <th className="text-right px-3 py-2 font-medium">رقم OEM</th>
                            <th className="text-center px-3 py-2 font-medium text-secondary-700">المحمل في السيارة</th>
                            <th className="text-center px-3 py-2 font-medium text-success-700">المباع</th>
                            <th className="text-center px-3 py-2 font-bold text-warning-800 bg-warning-50/50">المتبقي بالسيارة</th>
                            <th className="text-center px-3 py-2 font-medium">سعر القطعة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-100 bg-white">
                          {trip.items.map((it) => {
                            const itemRemaining = it.loadedQty - it.soldQty - it.returnedQty;
                            return (
                              <tr key={it.id} className="hover:bg-secondary-50/60 transition-colors">
                                <td className="px-3 py-2.5 font-semibold text-secondary-900 max-w-[200px] truncate">
                                  {it.description}
                                </td>
                                <td className="px-3 py-2.5 font-mono text-secondary-500">
                                  {it.oem}
                                </td>
                                <td className="px-3 py-2.5 text-center font-semibold text-secondary-700 tabular-nums">
                                  {it.loadedQty}
                                </td>
                                <td className="px-3 py-2.5 text-center font-bold text-success-600 tabular-nums">
                                  {it.soldQty}
                                </td>
                                <td className="px-3 py-2.5 text-center font-bold text-warning-800 bg-warning-50/40 tabular-nums">
                                  <span className={`inline-block px-2 py-0.5 rounded-full ${itemRemaining > 0 ? 'bg-warning-100 text-warning-800' : 'bg-secondary-100 text-secondary-500'}`}>
                                    {itemRemaining}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-center font-medium text-secondary-800 tabular-nums">
                                  {formatAed(it.unitPrice)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Simple and Direct Create Trip Modal */}
      {createOpen && (
        <SimpleCreateTripModal
          onClose={() => setCreateOpen(false)}
          onCreate={async (driverName, items) => {
            const newTrip = await createTrip({
              driverName,
              vehicle: 'سيارة التوزيع',
              departureAt: todayISO(),
              status: 'active',
              city: 'ليبيا',
              area: 'خط سير التوزيع',
              notes: '',
              createdBy: currentUser?.id || 'user-admin',
              createdByName: driverName,
            });

            if (items.length > 0 && newTrip?.id) {
              await batchLoadVehicle(newTrip.id, items);
            }
            setCreateOpen(false);
          }}
        />
      )}

      {/* Modal to Load More Goods to Existing Vehicle */}
      {loadMoreTrip && (
        <LoadMoreGoodsModal
          trip={loadMoreTrip}
          onClose={() => setLoadMoreTrip(null)}
          onLoad={async (items) => {
            await batchLoadVehicle(loadMoreTrip.id, items);
            setLoadMoreTrip(null);
          }}
        />
      )}

      {/* Trip Details & Sales History Modal */}
      {viewTripDetail && (
        <TripDetailModal
          trip={viewTripDetail}
          onClose={() => setViewTripDetail(null)}
          onDelete={(id) => { setViewTripDetail(null); setDeleteId(id); }}
          isAdmin={isAdmin}
        />
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <Modal
          open
          onClose={() => setDeleteId(null)}
          title="تأكيد حذف الجولة"
          size="sm"
          footer={
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => setDeleteId(null)}>إلغاء</Button>
              <Button variant="danger" fullWidth onClick={() => { deleteTrip(deleteId); setDeleteId(null); }}>
                حذف الجولة
              </Button>
            </div>
          }
        >
          <p className="text-sm text-secondary-600">هل أنت متأكد من رغبتك في حذف هذه الجولة؟</p>
        </Modal>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Simple and Streamlined Create Trip Modal (Driver Name + Goods & Quantity only)
// -------------------------------------------------------------
function SimpleCreateTripModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (driverName: string, items: { itemId: string; qty: number; unitPrice?: number }[]) => Promise<void>;
}) {
  const { currentUser, data } = useApp();
  const [driverName, setDriverName] = useState(currentUser?.name || '');
  const [search, setSearch] = useState('');
  const [selectedItems, setSelectedItems] = useState<{
    itemId: string;
    oem: string;
    description: string;
    stock: number;
    qty: number;
    unitPrice: number;
  }[]>([]);
  const [saving, setSaving] = useState(false);

  // Search items in main warehouse with available stock
  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return data.inventory
      .filter((i) => i.stock > 0 && (i.oem.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)))
      .slice(0, 6);
  }, [data.inventory, search]);

  const addItem = (item: (typeof data.inventory)[0]) => {
    if (selectedItems.some((s) => s.itemId === item.id)) return;
    setSelectedItems((prev) => [
      ...prev,
      {
        itemId: item.id,
        oem: item.oem,
        description: item.description,
        stock: item.stock,
        qty: Math.min(1, item.stock),
        unitPrice: item.sellPrice,
      },
    ]);
    setSearch('');
  };

  const updateQty = (itemId: string, qty: number) => {
    setSelectedItems((prev) =>
      prev.map((i) => (i.itemId === itemId ? { ...i, qty: Math.max(1, Math.min(qty, i.stock)) } : i))
    );
  };

  const removeItem = (itemId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.itemId !== itemId));
  };

  const totalLoadedPieces = selectedItems.reduce((s, i) => s + i.qty, 0);
  const isValid = driverName.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid || saving) return;
    setSaving(true);
    try {
      await onCreate(
        driverName.trim(),
        selectedItems.map((i) => ({
          itemId: i.itemId,
          qty: i.qty,
          unitPrice: i.unitPrice,
        }))
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="إضافة جولة توزيع جديدة"
      size="lg"
      footer={
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="text-xs text-secondary-500">
            إجمالي المحمل: <span className="font-bold text-secondary-900">{totalLoadedPieces} قطعة</span> ({selectedItems.length} صنف)
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={saving}>إلغاء</Button>
            <Button disabled={!isValid || saving} onClick={handleSubmit} icon={<Truck className="w-4 h-4" />}>
              {saving ? 'جاري الحفظ...' : 'حفظ وبدء الجولة'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* 1. Driver Name Only */}
        <div>
          <Input
            label="اسم السائق / المندوب"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            placeholder="أدخل اسم السائق..."
            required
            autoFocus
          />
        </div>

        {/* 2. Goods and Quantities */}
        <div className="space-y-2 pt-2 border-t border-secondary-100">
          <label className="block text-sm font-semibold text-secondary-800">
            إضافة كمية البضاعة المحملة في السيارة من المخزن الرئيسي
          </label>

          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث برقم OEM أو اسم القطعة لإضافتها للسيارة..."
              className="w-full rounded-xl border-0 bg-secondary-50 pr-10 pl-4 py-2.5 text-secondary-900 placeholder:text-secondary-400 ring-1 ring-inset ring-secondary-200 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none text-sm"
            />
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="rounded-xl border border-secondary-200 bg-white shadow-lg overflow-hidden divide-y divide-secondary-100 max-h-48 overflow-y-auto">
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => addItem(item)}
                  className="w-full text-right px-3 py-2 text-xs hover:bg-primary-50 transition-colors flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="font-semibold text-secondary-900">{item.description}</p>
                    <p className="text-secondary-400 font-mono text-[11px]">{item.oem}</p>
                  </div>
                  <span className="font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                    متوفر بالمخزن: {item.stock}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Selected Goods & Quantities Table */}
          {selectedItems.length > 0 ? (
            <div className="rounded-xl border border-secondary-200 overflow-hidden mt-3">
              <table className="w-full text-xs">
                <thead className="bg-secondary-50 text-secondary-600">
                  <tr>
                    <th className="text-right px-3 py-2 font-medium">القطعة</th>
                    <th className="text-center px-2 py-2 font-medium w-24">المتوفر بالمخزن</th>
                    <th className="text-center px-3 py-2 font-medium w-28">الكمية المحملة</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100 bg-white">
                  {selectedItems.map((item) => (
                    <tr key={item.itemId}>
                      <td className="px-3 py-2">
                        <p className="font-semibold text-secondary-900">{item.description}</p>
                        <p className="text-secondary-400 font-mono text-[11px]">{item.oem}</p>
                      </td>
                      <td className="px-2 py-2 text-center font-medium text-secondary-500 tabular-nums">
                        {item.stock} قطعة
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min={1}
                          max={item.stock}
                          value={item.qty}
                          onChange={(e) => updateQty(item.itemId, Number(e.target.value) || 1)}
                          className="w-20 text-center rounded-lg bg-secondary-50 px-2 py-1 ring-1 ring-secondary-200 outline-none focus:ring-2 focus:ring-primary-500 font-bold text-secondary-900 tabular-nums"
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.itemId)}
                          className="text-secondary-400 hover:text-error-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5 text-center text-xs text-secondary-400 bg-secondary-50 rounded-xl border border-dashed border-secondary-200">
              لم تتم إضافة أي قطع غيار بعد. ابحث في الحقل أعلاه لاختيار القطع وتحديد الكميات.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// -------------------------------------------------------------
// Load More Goods Modal (For existing active trips)
// -------------------------------------------------------------
function LoadMoreGoodsModal({
  trip,
  onClose,
  onLoad,
}: {
  trip: Trip;
  onClose: () => void;
  onLoad: (items: { itemId: string; qty: number; unitPrice?: number }[]) => Promise<void>;
}) {
  const { data } = useApp();
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<{ itemId: string; oem: string; description: string; stock: number; qty: number; unitPrice: number }[]>([]);
  const [saving, setSaving] = useState(false);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return data.inventory
      .filter((i) => i.stock > 0 && (i.oem.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)))
      .slice(0, 6);
  }, [data.inventory, search]);

  const addItem = (item: (typeof data.inventory)[0]) => {
    if (items.some((s) => s.itemId === item.id)) return;
    setItems((prev) => [
      ...prev,
      {
        itemId: item.id,
        oem: item.oem,
        description: item.description,
        stock: item.stock,
        qty: 1,
        unitPrice: item.sellPrice,
      },
    ]);
    setSearch('');
  };

  const updateQty = (itemId: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) => (i.itemId === itemId ? { ...i, qty: Math.max(1, Math.min(qty, i.stock)) } : i))
    );
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.itemId !== itemId));
  };

  const handleSave = async () => {
    if (items.length === 0 || saving) return;
    setSaving(true);
    try {
      await onLoad(
        items.map((i) => ({
          itemId: i.itemId,
          qty: i.qty,
          unitPrice: i.unitPrice,
        }))
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`إضافة بضاعة إضافية لسيارة: ${trip.driverName}`}
      size="lg"
      footer={
        <div className="flex gap-2 w-full justify-end">
          <Button variant="secondary" onClick={onClose} disabled={saving}>إلغاء</Button>
          <Button disabled={items.length === 0 || saving} onClick={handleSave} icon={<ArrowDownToLine className="w-4 h-4" />}>
            {saving ? 'جاري التحميل...' : `تحميل ${items.reduce((s, i) => s + i.qty, 0)} قطعة للسيارة`}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <p className="text-xs text-secondary-500">
          اختر قطع الغيار والكميات من المخزن الرئيسي لنقلها إلى سيارة السائق <strong>{trip.driverName}</strong>
        </p>

        <div className="relative">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالـ OEM أو اسم القطعة بالمخزن الرئيسي..."
            className="w-full rounded-xl border-0 bg-secondary-50 pr-10 pl-4 py-2.5 text-secondary-900 placeholder:text-secondary-400 ring-1 ring-inset ring-secondary-200 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none text-sm"
          />
        </div>

        {searchResults.length > 0 && (
          <div className="rounded-xl border border-secondary-200 bg-white shadow-lg overflow-hidden divide-y divide-secondary-100 max-h-48 overflow-y-auto">
            {searchResults.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => addItem(item)}
                className="w-full text-right px-3 py-2 text-xs hover:bg-primary-50 transition-colors flex items-center justify-between gap-2"
              >
                <div>
                  <p className="font-semibold text-secondary-900">{item.description}</p>
                  <p className="text-secondary-400 font-mono text-[11px]">{item.oem}</p>
                </div>
                <span className="font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                  متوفر: {item.stock}
                </span>
              </button>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className="rounded-xl border border-secondary-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-secondary-50 text-secondary-600">
                <tr>
                  <th className="text-right px-3 py-2 font-medium">القطعة</th>
                  <th className="text-center px-2 py-2 font-medium w-24">المتوفر بالمخزن</th>
                  <th className="text-center px-3 py-2 font-medium w-28">الكمية المحملة</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100 bg-white">
                {items.map((item) => (
                  <tr key={item.itemId}>
                    <td className="px-3 py-2">
                      <p className="font-semibold text-secondary-900">{item.description}</p>
                      <p className="text-secondary-400 font-mono text-[11px]">{item.oem}</p>
                    </td>
                    <td className="px-2 py-2 text-center font-medium text-secondary-500 tabular-nums">
                      {item.stock}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min={1}
                        max={item.stock}
                        value={item.qty}
                        onChange={(e) => updateQty(item.itemId, Number(e.target.value) || 1)}
                        className="w-20 text-center rounded-lg bg-secondary-50 px-2 py-1 ring-1 ring-secondary-200 outline-none focus:ring-2 focus:ring-primary-500 font-bold text-secondary-900 tabular-nums"
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(item.itemId)}
                        className="text-secondary-400 hover:text-error-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}

// -------------------------------------------------------------
// Detailed Trip Modal (Sales History and Return to Warehouse)
// -------------------------------------------------------------
function TripDetailModal({
  trip,
  onClose,
  onDelete,
  isAdmin,
}: {
  trip: Trip;
  onClose: () => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}) {
  const { data, updateTrip, batchReturnVehicle } = useApp();
  const [returning, setReturning] = useState(false);

  const totalLoaded = trip.items.reduce((s, i) => s + i.loadedQty, 0);
  const totalSold = trip.items.reduce((s, i) => s + i.soldQty, 0);
  const totalReturned = trip.items.reduce((s, i) => s + i.returnedQty, 0);
  const totalRemaining = totalLoaded - totalSold - totalReturned;

  // Invoices for this trip
  const tripInvoices = data.invoices.filter((inv) => inv.tripId === trip.id);

  const handleReturnAll = async () => {
    const returns = trip.items
      .map((it) => ({ tripItemId: it.id, qty: it.loadedQty - it.soldQty - it.returnedQty }))
      .filter((r) => r.qty > 0);

    setReturning(true);
    try {
      if (returns.length > 0) {
        await batchReturnVehicle(trip.id, returns);
      }
      await updateTrip(trip.id, { status: 'completed' });
      onClose();
    } finally {
      setReturning(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`تفاصيل جولة السائق: ${trip.driverName}`}
      size="xl"
      footer={
        <div className="flex items-center justify-between gap-3 w-full flex-wrap">
          <div className="text-xs">
            إجمالي المبيعات المحققة: <span className="font-bold text-success-600 text-sm tabular-nums">{formatAed(trip.totalSales || 0)}</span>
          </div>

          <div className="flex gap-2">
            {totalRemaining > 0 && trip.status !== 'completed' && (
              <Button
                variant="warning"
                size="sm"
                icon={<ArrowUpFromLine className="w-4 h-4" />}
                onClick={handleReturnAll}
                disabled={returning}
              >
                {returning ? 'جاري الإرجاع...' : `إرجاع المتبقي (${totalRemaining} قطعة) وإنهاء الجولة`}
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={onClose}>إغلاق</Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-secondary-50 text-center text-xs">
          <div>
            <span className="text-secondary-400 block">المحمل في السيارة</span>
            <span className="font-bold text-secondary-800 text-base">{totalLoaded} قطعة</span>
          </div>
          <div>
            <span className="text-secondary-400 block">المباع</span>
            <span className="font-bold text-success-600 text-base">{totalSold} قطعة</span>
          </div>
          <div>
            <span className="text-secondary-400 block">المتبقي بالسيارة</span>
            <span className="font-bold text-warning-700 text-base">{totalRemaining} قطعة</span>
          </div>
        </div>

        {/* Sales Invoices Associated with this trip */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-secondary-800 flex items-center gap-1.5">
            <ShoppingCart className="w-4 h-4 text-primary-600" />
            فواتير المبيعات الصادرة من هذه الجولة ({tripInvoices.length})
          </h4>

          {tripInvoices.length === 0 ? (
            <div className="p-4 text-center text-xs text-secondary-400 bg-secondary-50/50 rounded-xl">
              لم يتم إصدار فواتير بيع من هذه الجولة حتى الآن.
            </div>
          ) : (
            <div className="rounded-xl border border-secondary-200 overflow-hidden divide-y divide-secondary-100">
              {tripInvoices.map((inv) => (
                <div key={inv.id} className="p-3 flex items-center justify-between gap-3 text-xs bg-white">
                  <div>
                    <p className="font-bold text-secondary-900">{inv.number} - {inv.shopName}</p>
                    <p className="text-secondary-400 text-[11px]">{formatDate(inv.date)} • {inv.lines.length} صنف ({inv.lines.reduce((s, l) => s + l.qty, 0)} قطعة)</p>
                  </div>
                  <span className="font-bold text-success-600 tabular-nums text-sm">{formatAed(inv.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
