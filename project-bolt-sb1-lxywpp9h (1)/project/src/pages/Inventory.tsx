import { useMemo, useState } from 'react';
import { Search, Package, Plus, Edit2, Trash2, MapPin, Boxes, X, AlertTriangle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Badge } from '@/components/ui/Badge';
import { Button, Input, Select, EmptyState } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import { formatAed } from '@/lib/format';
import type { InventoryItem } from '@/types';

export function Inventory() {
  const { role, data, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useApp();
  const isAdmin = role === 'admin';

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set(data.inventory.map((i) => i.category));
    return ['all', ...Array.from(set)];
  }, [data.inventory]);

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
        (stockFilter === 'out' && item.stock === 0);
      return matchesQuery && matchesCat && matchesStock;
    });
  }, [data.inventory, query, category, stockFilter]);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (item: InventoryItem) => { setEditing(item); setModalOpen(true); };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Search bar */}
      <div className="rounded-2xl bg-white ring-1 ring-secondary-100 shadow-sm p-4 space-y-3">
        <div className="relative">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث برقم OEM، الوصف، موديل السيارة، أو موقع الرف..."
            className="w-full rounded-xl border-0 bg-secondary-50 pr-11 pl-4 py-3 text-secondary-900 placeholder:text-secondary-400 ring-1 ring-inset ring-secondary-200 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
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
            <option value="all">كل المخزون</option>
            <option value="low">مخزون منخفض</option>
            <option value="out">نفد المخزون</option>
          </select>
          {isAdmin && (
            <Button icon={<Plus className="w-4 h-4" />} onClick={openAdd} className="mr-auto" size="sm">
              إضافة قطعة
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-secondary-500 px-1">
        {filtered.length} نتيجة {query && `لـ "${query}"`}
      </p>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white ring-1 ring-secondary-100">
          <EmptyState
            icon={<Package className="w-8 h-8" />}
            title="لا توجد قطع غيار"
            description="جرّب تغيير معايير البحث أو أضف قطعة جديدة"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((item) => {
            const isLow = item.stock <= item.minStock;
            const isOut = item.stock === 0;
            return (
              <div key={item.id} className="rounded-2xl bg-white ring-1 ring-secondary-100 shadow-sm p-4 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-secondary-900 text-sm leading-tight truncate">{item.description}</h3>
                    <p className="text-xs font-mono text-primary-600 mt-0.5">{item.oem}</p>
                  </div>
                  {isOut ? (
                    <Badge tone="error" icon={<AlertTriangle className="w-3 h-3" />}>نفد</Badge>
                  ) : isLow ? (
                    <Badge tone="warning">منخفض</Badge>
                  ) : (
                    <Badge tone="success">متوفر</Badge>
                  )}
                </div>

                <p className="text-xs text-secondary-500 mb-3">{item.carModel}</p>

                <div className="flex items-center gap-2 text-xs text-secondary-500 mb-3">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {item.shelf}
                  </span>
                  <span className="text-secondary-300">|</span>
                  <span className="inline-flex items-center gap-1">
                    <Boxes className="w-3.5 h-3.5" />
                    الكمية: <span className="font-bold text-secondary-800">{item.stock}</span>
                  </span>
                </div>

                <div className="flex items-end justify-between pt-3 border-t border-secondary-50">
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
                  <div className="flex gap-2 mt-3">
                    <Button variant="secondary" size="sm" icon={<Edit2 className="w-3.5 h-3.5" />} onClick={() => openEdit(item)} fullWidth>
                      تعديل
                    </Button>
                    <Button variant="ghost" size="sm" className="text-error-600 hover:bg-error-50" onClick={() => setDeleteId(item.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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
          <p className="text-sm text-secondary-600">هل أنت متأكد من حذف هذه القطعة من المخزون؟ لا يمكن التراجع عن هذا الإجراء.</p>
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
      title={item ? 'تعديل قطعة' : 'إضافة قطعة جديدة'}
      size="lg"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={onClose}>إلغاء</Button>
          <Button fullWidth disabled={!valid} onClick={() => {
            const { shipmentId, ...rest } = form;
            onSave({ ...rest, shipmentId: shipmentId || undefined });
          }}>
            {item ? 'حفظ' : 'إضافة'}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="رقم OEM" value={form.oem} onChange={(e) => set('oem', e.target.value)} placeholder="90915-YZZE1" />
        <Input label="الوصف" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="فلتر زيت" />
        <Input label="موديل السيارة" value={form.carModel} onChange={(e) => set('carModel', e.target.value)} placeholder="تويوتا كامري 2020" />
        <Input label="الفئة" value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="فلاتر" />
        <Input label="موقع الرف" value={form.shelf} onChange={(e) => set('shelf', e.target.value)} placeholder="A-01" />
        <Input label="الحد الأدنى للمخزون" type="number" min={0} value={form.minStock} onChange={(e) => set('minStock', Number(e.target.value))} />
        <Input label="الكمية الحالية" type="number" min={0} value={form.stock} onChange={(e) => set('stock', Number(e.target.value))} />
        <Select
          label="الشحنة المرتبطة"
          value={form.shipmentId}
          onChange={(e) => set('shipmentId', e.target.value)}
          options={[{ value: '', label: 'بدون شحنة' }, ...shipments.map((s) => ({ value: s.id, label: s.ref }))]}
        />
        <Input label="سعر التكلفة (د.ل)" type="number" min={0} step="0.01" value={form.purchasePrice} onChange={(e) => set('purchasePrice', Number(e.target.value))} />
        <Input label="سعر البيع (د.ل)" type="number" min={0} step="0.01" value={form.sellPrice} onChange={(e) => set('sellPrice', Number(e.target.value))} />
      </div>
    </Modal>
  );
}
