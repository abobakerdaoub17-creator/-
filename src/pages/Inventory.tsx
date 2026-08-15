import { useMemo, useState } from 'react';
import {
  Search,
  Package,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Boxes,
  X,
  TriangleAlert as AlertTriangle,
  Truck,
  SlidersHorizontal,
  Home,
  ArrowRightLeft,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Badge } from '@/components/ui/Badge';
import { Button, Input, Select, EmptyState } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import { formatAed } from '@/lib/format';
import type { InventoryItem } from '@/types';

export function Inventory() {
  const { role, data, addInventoryItem, updateInventoryItem, deleteInventoryItem, adjustStock, batchLoadVehicle } = useApp();
  const isAdmin = role === 'admin';

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [quickLoadItem, setQuickLoadItem] = useState<InventoryItem | null>(null);

  const categories = useMemo(() => {
    const set = new Set(data.inventory.map((i) => i.category));
    return ['all', ...Array.from(set)];
  }, [data.inventory]);

  // Calculate active vehicle stock for each inventory item
  const vehicleStockMap = useMemo(() => {
    const map = new Map<string, number>();
    const activeTrips = data.trips.filter((t) => t.status === 'active' || t.status === 'loading');
    for (const trip of activeTrips) {
      for (const it of trip.items) {
        const availableInCar = it.loadedQty - it.soldQty - it.returnedQty;
        if (availableInCar > 0) {
          map.set(it.itemId, (map.get(it.itemId) || 0) + availableInCar);
        }
      }
    }
    return map;
  }, [data.trips]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.inventory.filter((item) => {
      const matchesQuery =
        !q ||
        item.oem.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.carModel.toLowerCase().includes(q) ||
        item.shelf.toLowerCase().includes(q);
      const matchesCat = category === 'all' || item.category === category;
      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'low' && item.stock <= item.minStock) ||
        (stockFilter === 'out' && item.stock === 0) ||
        (stockFilter === 'in_vehicle' && (vehicleStockMap.get(item.id) || 0) > 0);
      return matchesQuery && matchesCat && matchesStock;
    });
  }, [data.inventory, query, category, stockFilter, vehicleStockMap]);

  // Totals
  const totalWarehouseStock = data.inventory.reduce((sum, i) => sum + i.stock, 0);
  const totalInVehicles = Array.from(vehicleStockMap.values()).reduce((sum, v) => sum + v, 0);
  const totalInventoryValue = data.inventory.reduce((sum, i) => sum + i.stock * i.purchasePrice, 0);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (item: InventoryItem) => { setEditing(item); setModalOpen(true); };

  return (
    <div className="space-y-4 animate-fade-in" id="inventory-page">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white ring-1 ring-secondary-100 shadow-sm p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-secondary-500 font-medium">المخزن الرئيسي (البيت)</p>
            <p className="text-xl font-bold text-secondary-900 tabular-nums">{totalWarehouseStock} <span className="text-xs font-normal text-secondary-500">قطعة</span></p>
            <p className="text-[11px] text-secondary-400">جاهزة للتحميل والبيع</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white ring-1 ring-secondary-100 shadow-sm p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-warning-50 text-warning-600 flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-secondary-500 font-medium">مخزن سيارات التوزيع</p>
            <p className="text-xl font-bold text-warning-700 tabular-nums">{totalInVehicles} <span className="text-xs font-normal text-secondary-500">قطعة</span></p>
            <p className="text-[11px] text-secondary-400">محملة ومستقلة على السيارات</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white ring-1 ring-secondary-100 shadow-sm p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-success-50 text-success-600 flex items-center justify-center shrink-0">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-secondary-500 font-medium">إجمالي قيمة بضاعة المخزن</p>
            <p className="text-xl font-bold text-success-700 tabular-nums">{formatAed(totalInventoryValue)}</p>
            <p className="text-[11px] text-secondary-400">{data.inventory.length} صنف مسجل</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-2xl bg-white ring-1 ring-secondary-100 shadow-sm p-4 space-y-3">
        <div className="relative">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث برقم OEM، الوصف، موديل السيارة، أو موقع الرف..."
            className="w-full rounded-xl border-0 bg-secondary-50 pr-11 pl-4 py-3 text-secondary-900 placeholder:text-secondary-400 ring-1 ring-inset ring-secondary-200 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none text-sm"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl bg-secondary-50 px-3 py-2 text-sm text-secondary-700 ring-1 ring-inset ring-secondary-200 focus:ring-2 focus:ring-primary-500 outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === 'all' ? 'كل الفئات' : c}</option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="rounded-xl bg-secondary-50 px-3 py-2 text-sm text-secondary-700 ring-1 ring-inset ring-secondary-200 focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="all">كل الأصناف</option>
            <option value="in_vehicle">محمل في السيارات حالياً</option>
            <option value="low">مخزون منخفض (≤ الحد الأدنى)</option>
            <option value="out">نفد من المخزن الرئيسي</option>
          </select>

          {isAdmin && (
            <Button icon={<Plus className="w-4 h-4" />} onClick={openAdd} className="mr-auto" size="sm">
              إضافة قطعة جديدة
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-secondary-500 px-1">
        {filtered.length} صنف {query && `لـ "${query}"`}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white ring-1 ring-secondary-100 p-8">
          <EmptyState
            icon={<Package className="w-8 h-8" />}
            title="لا توجد قطع غيار"
            description="جرّب تغيير معايير البحث أو أضف صنفاً جديداً للمخزن الرئيسي"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((item) => {
            const isLow = item.stock <= item.minStock && item.stock > 0;
            const isOut = item.stock === 0;
            const inCar = vehicleStockMap.get(item.id) || 0;

            return (
              <div key={item.id} className="rounded-2xl bg-white ring-1 ring-secondary-100 shadow-sm p-4 hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-secondary-900 text-sm leading-tight truncate">{item.description}</h3>
                      <p className="text-xs font-mono text-primary-600 mt-0.5">{item.oem}</p>
                    </div>
                    {isOut ? (
                      <Badge tone="error" icon={<AlertTriangle className="w-3 h-3" />}>نفد بالمخزن</Badge>
                    ) : isLow ? (
                      <Badge tone="warning">منخفض</Badge>
                    ) : (
                      <Badge tone="success">متوفر</Badge>
                    )}
                  </div>

                  <p className="text-xs text-secondary-500 mb-2.5">{item.carModel}</p>

                  {/* Stock Distribution Breakdown */}
                  <div className="rounded-xl bg-secondary-50 p-2.5 space-y-1.5 text-xs mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-secondary-600 flex items-center gap-1">
                        <Home className="w-3.5 h-3.5 text-secondary-400" />
                        المخزن الرئيسي (البيت):
                      </span>
                      <span className={`font-bold tabular-nums ${item.stock === 0 ? 'text-error-600' : 'text-secondary-900'}`}>
                        {item.stock} قطعة
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-secondary-600 flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-warning-500" />
                        في سيارات التوزيع:
                      </span>
                      <span className={`font-bold tabular-nums ${inCar > 0 ? 'text-warning-700' : 'text-secondary-400'}`}>
                        {inCar} قطعة
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-secondary-200/80 pt-1">
                      <span className="font-semibold text-secondary-700">إجمالي الرصيد العام:</span>
                      <span className="font-bold text-primary-700 tabular-nums">{item.stock + inCar} قطعة</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-secondary-500 mb-2">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      الرف: {item.shelf || 'غير محدد'}
                    </span>
                    <span className="text-secondary-400">الحد الأدنى: {item.minStock}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-end justify-between pt-2.5 border-t border-secondary-50">
                    <div>
                      <p className="text-[10px] text-secondary-400">سعر البيع (جملة)</p>
                      <p className="text-base font-bold text-primary-600 tabular-nums">{formatAed(item.sellPrice)}</p>
                    </div>
                    {isAdmin && (
                      <div className="text-left">
                        <p className="text-[10px] text-secondary-400">سعر التكلفة</p>
                        <p className="text-sm font-semibold text-secondary-700 tabular-nums">{formatAed(item.purchasePrice)}</p>
                      </div>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2 border-t border-secondary-100">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Truck className="w-3.5 h-3.5" />}
                        onClick={() => setQuickLoadItem(item)}
                        disabled={item.stock <= 0}
                        title="تحميل للسيارة"
                      >
                        تحميل
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
                        onClick={() => setAdjustingItem(item)}
                        title="تسوية جرد"
                      >
                        تسوية
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Edit2 className="w-3.5 h-3.5" />}
                        onClick={() => openEdit(item)}
                        title="تعديل بيانات الصنف"
                      >
                        تعديل
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Item Modal */}
      {modalOpen && (
        <ItemModal
          item={editing}
          shipments={data.shipments}
          onClose={() => setModalOpen(false)}
          onSave={(payload) => {
            if (editing) updateInventoryItem(editing.id, payload);
            else addInventoryItem(payload);
            setModalOpen(false);
          }}
        />
      )}

      {/* Stock Adjustment Modal */}
      {adjustingItem && (
        <AdjustStockModal
          item={adjustingItem}
          onClose={() => setAdjustingItem(null)}
          onAdjust={async (newStock, reason) => {
            await adjustStock(adjustingItem.id, newStock, reason);
            setAdjustingItem(null);
          }}
        />
      )}

      {/* Quick Load To Vehicle Modal */}
      {quickLoadItem && (
        <QuickLoadModal
          item={quickLoadItem}
          trips={data.trips.filter((t) => t.status === 'active' || t.status === 'loading')}
          onClose={() => setQuickLoadItem(null)}
          onLoad={async (tripId, qty) => {
            await batchLoadVehicle(tripId, [{ itemId: quickLoadItem.id, qty }]);
            setQuickLoadItem(null);
          }}
        />
      )}

      {/* Delete Item Confirmation */}
      {deleteId && (
        <Modal
          open
          onClose={() => setDeleteId(null)}
          title="تأكيد الحذف"
          size="sm"
          footer={
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => setDeleteId(null)}>إلغاء</Button>
              <Button variant="danger" fullWidth onClick={() => { deleteInventoryItem(deleteId); setDeleteId(null); }}>
                حذف
              </Button>
            </div>
          }
        >
          <p className="text-sm text-secondary-600">هل أنت متأكد من حذف هذه القطعة من المخزون الرئيسي؟ لا يمكن التراجع عن هذا الإجراء.</p>
        </Modal>
      )}
    </div>
  );
}

interface ItemModalProps {
  item: InventoryItem | null;
  shipments: { id: string; ref: string }[];
  onClose: () => void;
  onSave: (payload: Omit<InventoryItem, 'id'>) => void;
}

function ItemModal({ item, shipments, onClose, onSave }: ItemModalProps) {
  const [form, setForm] = useState({
    oem: item?.oem ?? '',
    description: item?.description ?? '',
    carModel: item?.carModel ?? '',
    category: item?.category ?? '',
    shelf: item?.shelf ?? '',
    stock: item?.stock ?? 0,
    minStock: item?.minStock ?? 5,
    purchasePrice: item?.purchasePrice ?? 0,
    sellPrice: item?.sellPrice ?? 0,
    shipmentId: item?.shipmentId ?? '',
  });

  const set = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.oem && form.description && form.sellPrice > 0;

  return (
    <Modal
      open
      onClose={onClose}
      title={item ? 'تعديل قطعة' : 'إضافة قطعة جديدة إلى المخزن الرئيسي'}
      size="lg"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={onClose}>إلغاء</Button>
          <Button fullWidth disabled={!valid} onClick={() => {
            const { shipmentId, ...rest } = form;
            onSave({ ...rest, shipmentId: shipmentId || undefined });
          }}>
            {item ? 'حفظ التعديلات' : 'إضافة للمخزن'}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="رقم OEM" value={form.oem} onChange={(e) => set('oem', e.target.value)} placeholder="90915-YZZE1" />
        <Input label="الوصف" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="فلتر زيت" />
        <Input label="موديل السيارة" value={form.carModel} onChange={(e) => set('carModel', e.target.value)} placeholder="تويوتا كامري 2020" />
        <Input label="الفئة" value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="فلاتر" />
        <Input label="موقع الرف في البيت / المخزن" value={form.shelf} onChange={(e) => set('shelf', e.target.value)} placeholder="A-01" />
        <Input label="الحد الأدنى للمخزون" type="number" min={0} value={form.minStock} onChange={(e) => set('minStock', Number(e.target.value))} />
        <Input label="الكمية الحالية بالمخزن الرئيسي" type="number" min={0} value={form.stock} onChange={(e) => set('stock', Number(e.target.value))} />
        <Select
          label="الشحنة المرتبطة"
          value={form.shipmentId}
          onChange={(e) => set('shipmentId', e.target.value)}
          options={[{ value: '', label: 'بدون شحنة' }, ...shipments.map((s) => ({ value: s.id, label: s.ref }))]}
        />
        <Input label="سعر التكلفة (د.ل)" type="number" min={0} step="0.01" value={form.purchasePrice} onChange={(e) => set('purchasePrice', Number(e.target.value))} />
        <Input label="سعر البيع للجملة (د.ل)" type="number" min={0} step="0.01" value={form.sellPrice} onChange={(e) => set('sellPrice', Number(e.target.value))} />
      </div>
    </Modal>
  );
}

function AdjustStockModal({
  item,
  onClose,
  onAdjust,
}: {
  item: InventoryItem;
  onClose: () => void;
  onAdjust: (newStock: number, reason: string) => Promise<void>;
}) {
  const [newStock, setNewStock] = useState(item.stock);
  const [reason, setReason] = useState('جرد دوري للمخزن الرئيسي');
  const [saving, setSaving] = useState(false);

  const diff = newStock - item.stock;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onAdjust(newStock, reason);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="تسوية جرد المخزن الرئيسي"
      size="sm"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={onClose}>إلغاء</Button>
          <Button fullWidth disabled={saving || newStock === item.stock} onClick={handleSave}>
            تأكيد التسوية
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div>
          <p className="font-semibold text-secondary-900">{item.description}</p>
          <p className="text-xs font-mono text-primary-600">{item.oem}</p>
        </div>

        <div className="rounded-xl bg-secondary-50 p-3 flex justify-between items-center text-sm">
          <span className="text-secondary-600">الرصيد الحالي بالمخزن:</span>
          <span className="font-bold text-secondary-900 tabular-nums">{item.stock} قطعة</span>
        </div>

        <Input
          label="الرصيد الفعلي الجديد"
          type="number"
          min={0}
          value={newStock}
          onChange={(e) => setNewStock(Math.max(0, Number(e.target.value)))}
        />

        {diff !== 0 && (
          <div className={`p-2.5 rounded-xl text-xs flex justify-between font-medium ${diff > 0 ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700'}`}>
            <span>فرق التسوية:</span>
            <span className="tabular-nums font-bold">{diff > 0 ? `+${diff}` : diff} قطعة</span>
          </div>
        )}

        <Input
          label="سبب التعديل"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="مثال: جرد يدوي، تلف، استلام مباشر"
        />

        <p className="text-xs text-secondary-400">
          سيتم تسجيل هذه العملية تلقائياً في سجل حركات المخزون مع الوقت والمستخدم.
        </p>
      </div>
    </Modal>
  );
}

function QuickLoadModal({
  item,
  trips,
  onClose,
  onLoad,
}: {
  item: InventoryItem;
  trips: { id: string; driverName: string; vehicle: string; city: string }[];
  onClose: () => void;
  onLoad: (tripId: string, qty: number) => Promise<void>;
}) {
  const [tripId, setTripId] = useState(trips[0]?.id || '');
  const [qty, setQty] = useState(1);
  const [saving, setSaving] = useState(false);

  const handleLoad = async () => {
    if (!tripId || qty < 1 || qty > item.stock) return;
    setSaving(true);
    try {
      await onLoad(tripId, qty);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="تحميل إلى سيارة التوزيع"
      size="sm"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={onClose}>إلغاء</Button>
          <Button fullWidth disabled={!tripId || qty < 1 || qty > item.stock || saving} onClick={handleLoad}>
            تأكيد التحميل
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div>
          <p className="font-semibold text-secondary-900">{item.description}</p>
          <p className="text-xs font-mono text-primary-600">{item.oem} • متوفر بالمخزن: {item.stock}</p>
        </div>

        {trips.length === 0 ? (
          <div className="p-4 rounded-xl bg-warning-50 text-warning-800 text-xs">
            لا توجد جولة أو سيارة نشطة حالياً. يرجى إنشاء جولة أولاً من شاشة سيارة التوزيع.
          </div>
        ) : (
          <>
            <Select
              label="اختر السيارة / الجولة"
              value={tripId}
              onChange={(e) => setTripId(e.target.value)}
              options={trips.map((t) => ({
                value: t.id,
                label: `${t.vehicle || 'سيارة التوزيع'} - السائق: ${t.driverName} (${t.city})`,
              }))}
            />

            <Input
              label="الكمية المراد تحميلها إلى السيارة"
              type="number"
              min={1}
              max={item.stock}
              value={qty}
              onChange={(e) => setQty(Math.min(item.stock, Math.max(1, Number(e.target.value))))}
            />

            <div className="p-3 rounded-xl bg-primary-50 text-xs text-primary-800 space-y-1">
              <p className="font-semibold">الأثر على المخزون:</p>
              <p>• ينقص المخزن الرئيسي: <span className="font-bold">-{qty}</span> قطعة</p>
              <p>• يزيد مخزون السيارة: <span className="font-bold">+{qty}</span> قطعة</p>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
