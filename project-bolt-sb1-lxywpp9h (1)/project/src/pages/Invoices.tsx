import { useMemo, useState } from 'react';
import {
  FileText, Plus, Search, X, ShoppingCart, Trash2, Eye,
  Banknote, Building2, Clock, MapPin,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Badge } from '@/components/ui/Badge';
import { Button, Input, Select, EmptyState } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import { formatAed, formatDate, todayISO } from '@/lib/format';
import { libyanCities, cityAreas, cityLabel } from '@/lib/geo';
import type { Invoice, InvoiceLine, PaymentMethod } from '@/types';

const paymentLabels: Record<PaymentMethod, string> = {
  cash: 'نقداً',
  bank: 'تحويل بنكي',
  credit: 'آجل',
};

const paymentIcons: Record<PaymentMethod, React.ReactNode> = {
  cash: <Banknote className="w-3.5 h-3.5" />,
  bank: <Building2 className="w-3.5 h-3.5" />,
  credit: <Clock className="w-3.5 h-3.5" />,
};

const paymentTones: Record<PaymentMethod, 'success' | 'primary' | 'warning'> = {
  cash: 'success',
  bank: 'primary',
  credit: 'warning',
};

export function Invoices() {
  const { role, data } = useApp();
  const isAdmin = role === 'admin';
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  const availableAreas = cityFilter !== 'all' ? cityAreas(cityFilter) : [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.invoices.filter((inv) => {
      const matchesQ = !q || inv.number.toLowerCase().includes(q) || inv.shopName.toLowerCase().includes(q);
      const matchesS = statusFilter === 'all' || inv.status === statusFilter;
      const shop = data.shops.find((s) => s.id === inv.shopId);
      const matchesCity = cityFilter === 'all' || (shop?.city === cityFilter);
      const matchesArea = areaFilter === 'all' || (shop?.area === areaFilter);
      return matchesQ && matchesS && matchesCity && matchesArea;
    });
  }, [data.invoices, data.shops, query, statusFilter, cityFilter, areaFilter]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-secondary-900">الفواتير</h2>
          <p className="text-sm text-secondary-500">{data.invoices.length} فاتورة إجمالاً</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)} size="sm">فاتورة جديدة</Button>
      </div>

      <div className="rounded-2xl bg-white ring-1 ring-secondary-100 shadow-sm p-4 space-y-3">
        <div className="relative">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث برقم الفاتورة أو اسم العميل..."
            className="w-full rounded-xl border-0 bg-secondary-50 pr-11 pl-4 py-2.5 text-secondary-900 placeholder:text-secondary-400 ring-1 ring-inset ring-secondary-200 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { v: 'all', l: 'الكل' },
            { v: 'paid', l: 'مدفوعة' },
            { v: 'partial', l: 'جزئية' },
            { v: 'unpaid', l: 'آجل' },
          ].map((f) => (
            <button
              key={f.v}
              onClick={() => setStatusFilter(f.v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === f.v ? 'bg-primary-600 text-white' : 'bg-secondary-50 text-secondary-600 hover:bg-secondary-100'
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap pt-1 border-t border-secondary-50">
          <select
            value={cityFilter}
            onChange={(e) => { setCityFilter(e.target.value); setAreaFilter('all'); }}
            className="rounded-xl bg-secondary-50 px-3 py-1.5 text-sm text-secondary-700 ring-1 ring-inset ring-secondary-200 focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="all">كل المدن</option>
            {libyanCities.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          {availableAreas.length > 0 && (
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="rounded-xl bg-secondary-50 px-3 py-1.5 text-sm text-secondary-700 ring-1 ring-inset ring-secondary-200 focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="all">كل المناطق</option>
              {availableAreas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          )}
          {(cityFilter !== 'all' || areaFilter !== 'all') && (
            <button onClick={() => { setCityFilter('all'); setAreaFilter('all'); }} className="px-3 py-1.5 text-sm text-secondary-500 hover:text-secondary-700">
              مسح الفلتر
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white ring-1 ring-secondary-100">
          <EmptyState
            icon={<FileText className="w-8 h-8" />}
            title="لا توجد فواتير"
            description="ابدأ بإنشاء فاتورة جديدة لعميل"
            action={<Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>فاتورة جديدة</Button>}
          />
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((inv) => (
            <button
              key={inv.id}
              onClick={() => setViewInvoice(inv)}
              className="w-full text-right rounded-2xl bg-white ring-1 ring-secondary-100 shadow-sm p-4 hover:shadow-md hover:ring-primary-200 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-secondary-900">{inv.number}</span>
                    {inv.status === 'paid' && <Badge tone="success">مدفوعة</Badge>}
                    {inv.status === 'partial' && <Badge tone="warning">جزئية</Badge>}
                    {inv.status === 'unpaid' && <Badge tone="error">آجل</Badge>}
                    <Badge tone={paymentTones[inv.paymentMethod]} icon={paymentIcons[inv.paymentMethod]}>
                      {paymentLabels[inv.paymentMethod]}
                    </Badge>
                  </div>
                  <p className="text-sm text-secondary-600 mt-1.5 truncate">{inv.shopName}</p>
                  <p className="text-xs text-secondary-400 mt-0.5">{formatDate(inv.date)} • {inv.createdByName}</p>
                  {(() => { const shop = data.shops.find((s) => s.id === inv.shopId); return shop ? <p className="text-[11px] text-secondary-400 mt-0.5 inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{cityLabel(shop.city)}{shop.area && ` - ${shop.area}`}</p> : null; })()}
                </div>
                <div className="text-left shrink-0">
                  <p className="text-lg font-bold text-secondary-900 tabular-nums">{formatAed(inv.total)}</p>
                  {inv.status !== 'paid' && (
                    <p className="text-xs text-error-600 font-semibold tabular-nums mt-0.5">
                      متبقي: {formatAed(inv.total - inv.paidAmount)}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {createOpen && <CreateInvoiceModal onClose={() => setCreateOpen(false)} />}
      {viewInvoice && <ViewInvoiceModal invoice={viewInvoice} onClose={() => setViewInvoice(null)} isAdmin={isAdmin} />}
    </div>
  );
}

function CreateInvoiceModal({ onClose }: { onClose: () => void }) {
  const { data, createInvoice, currentUser } = useApp();
  const [shopId, setShopId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [search, setSearch] = useState('');
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidAmount, setPaidAmount] = useState(0);

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const totalCost = lines.reduce((s, l) => s + l.lineCost, 0);
  const total = Math.max(0, subtotal - discount);
  const balance = total - paidAmount;

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return data.inventory
      .filter((i) => i.stock > 0 && (i.oem.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || i.carModel.toLowerCase().includes(q)))
      .slice(0, 8);
  }, [data.inventory, search]);

  const addLine = (itemId: string) => {
    const item = data.inventory.find((i) => i.id === itemId);
    if (!item) return;
    if (lines.some((l) => l.itemId === itemId)) return;
    setLines((prev) => [
      ...prev,
      {
        itemId: item.id, oem: item.oem, description: item.description,
        qty: 1, unitPrice: item.sellPrice, unitCost: item.purchasePrice,
        lineTotal: item.sellPrice, lineCost: item.purchasePrice,
      },
    ]);
    setSearch('');
  };

  const updateLine = (itemId: string, patch: Partial<InvoiceLine>) =>
    setLines((prev) => prev.map((l) => {
      if (l.itemId !== itemId) return l;
      const next = { ...l, ...patch };
      next.lineTotal = next.qty * next.unitPrice;
      next.lineCost = next.qty * next.unitCost;
      return next;
    }));

  const removeLine = (itemId: string) => setLines((prev) => prev.filter((l) => l.itemId !== itemId));

  const valid = shopId && lines.length > 0;
  const shop = data.shops.find((s) => s.id === shopId);

  const handleSave = () => {
    if (!shop || !valid) return;
    const status: Invoice['status'] = balance <= 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';
    createInvoice({
      shopId: shop.id, shopName: shop.name, date,
      lines, subtotal, discount, total, totalCost,
      paymentMethod, paidAmount: paymentMethod === 'credit' ? paidAmount : total,
      createdBy: currentUser.id, createdByName: currentUser.name, status,
    });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="فاتورة جديدة"
      size="xl"
      footer={
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-secondary-500">الإجمالي</span>
            <span className="font-bold text-secondary-900 text-lg tabular-nums">{formatAed(total)}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={onClose}>إلغاء</Button>
            <Button fullWidth disabled={!valid} icon={<FileText className="w-4 h-4" />} onClick={handleSave}>
              حفظ الفاتورة
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Header fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="العميل / المحل"
            value={shopId}
            onChange={(e) => setShopId(e.target.value)}
            options={[{ value: '', label: 'اختر العميل...' }, ...data.shops.map((s) => ({ value: s.id, label: s.name }))]}
          />
          <Input label="التاريخ" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        {/* Item search */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1.5">إضافة قطع غيار</label>
          <div className="relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث برقم OEM أو الوصف لإضافة قطعة..."
              className="w-full rounded-xl border-0 bg-secondary-50 pr-11 pl-4 py-2.5 text-secondary-900 placeholder:text-secondary-400 ring-1 ring-inset ring-secondary-200 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 rounded-xl ring-1 ring-secondary-200 overflow-hidden divide-y divide-secondary-50 max-h-60 overflow-y-auto scrollbar-thin">
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addLine(item.id)}
                  className="w-full text-right px-3 py-2.5 hover:bg-primary-50 transition-colors flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-secondary-800 truncate">{item.description}</p>
                    <p className="text-xs font-mono text-secondary-400">{item.oem} • متوفر: {item.stock}</p>
                  </div>
                  <span className="text-sm font-bold text-primary-600 tabular-nums shrink-0">{formatAed(item.sellPrice)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lines */}
        {lines.length > 0 ? (
          <div className="rounded-xl ring-1 ring-secondary-200 overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm min-w-[480px]">
                <thead className="bg-secondary-50 text-secondary-500 text-xs">
                  <tr>
                    <th className="text-right px-3 py-2 font-medium">القطعة</th>
                    <th className="text-center px-2 py-2 font-medium w-20">الكمية</th>
                    <th className="text-center px-2 py-2 font-medium w-28">سعر الوحدة</th>
                    <th className="text-center px-3 py-2 font-medium w-28">الإجمالي</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-50">
                  {lines.map((line) => {
                    const item = data.inventory.find((i) => i.id === line.itemId);
                    return (
                      <tr key={line.itemId}>
                        <td className="px-3 py-2">
                          <p className="font-medium text-secondary-800 text-xs truncate max-w-[160px]">{line.description}</p>
                          <p className="text-[10px] font-mono text-secondary-400">{line.oem}</p>
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number" min={1} max={item?.stock ?? 99} value={line.qty}
                            onChange={(e) => updateLine(line.itemId, { qty: Math.min(Number(e.target.value), item?.stock ?? 99) || 1 })}
                            className="w-16 text-center rounded-lg bg-secondary-50 px-2 py-1 ring-1 ring-secondary-200 outline-none focus:ring-primary-500 tabular-nums"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number" min={0} step="0.5" value={line.unitPrice}
                            onChange={(e) => updateLine(line.itemId, { unitPrice: Number(e.target.value) || 0 })}
                            className="w-24 text-center rounded-lg bg-secondary-50 px-2 py-1 ring-1 ring-secondary-200 outline-none focus:ring-primary-500 tabular-nums"
                          />
                        </td>
                        <td className="px-3 py-2 text-center font-bold text-secondary-900 tabular-nums">{formatAed(line.lineTotal)}</td>
                        <td className="px-2 py-2">
                          <button onClick={() => removeLine(line.itemId)} className="text-error-400 hover:text-error-600 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-secondary-50 p-6 text-center text-secondary-400 text-sm flex flex-col items-center gap-2">
            <ShoppingCart className="w-8 h-8" />
            ابحث وأضف قطع غيار للفاتورة
          </div>
        )}

        {/* Totals & payment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <Input label="الخصم (د.ل)" type="number" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
            <div className="rounded-xl bg-secondary-50 p-3 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-secondary-500">المجموع الفرعي</span><span className="font-semibold tabular-nums">{formatAed(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-secondary-500">الخصم</span><span className="font-semibold tabular-nums text-error-600">-{formatAed(discount)}</span></div>
              <div className="flex justify-between border-t border-secondary-200 pt-1.5"><span className="font-bold text-secondary-700">الإجمالي</span><span className="font-bold text-primary-700 tabular-nums text-base">{formatAed(total)}</span></div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <span className="block text-sm font-medium text-secondary-700 mb-1.5">طريقة الدفع</span>
              <div className="grid grid-cols-3 gap-2">
                {(['cash', 'bank', 'credit'] as PaymentMethod[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setPaymentMethod(m); if (m !== 'credit') setPaidAmount(total); }}
                    className={`px-2 py-2.5 rounded-xl text-xs font-semibold transition-all flex flex-col items-center gap-1 ${
                      paymentMethod === m ? 'bg-primary-600 text-white shadow-sm' : 'bg-secondary-50 text-secondary-600 hover:bg-secondary-100'
                    }`}
                  >
                    {paymentIcons[m]}
                    {paymentLabels[m]}
                  </button>
                ))}
              </div>
            </div>
            {paymentMethod === 'credit' && (
              <Input
                label="المبلغ المدفوع الآن (د.ل)"
                type="number" min={0} max={total} value={paidAmount}
                onChange={(e) => setPaidAmount(Math.min(Number(e.target.value), total))}
              />
            )}
            {paymentMethod === 'credit' && (
              <div className="rounded-xl bg-warning-50 ring-1 ring-warning-200 p-3 text-sm flex items-center justify-between">
                <span className="text-warning-700">الرصيد المتبقي (آجل)</span>
                <span className="font-bold text-warning-800 tabular-nums">{formatAed(Math.max(0, balance))}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function ViewInvoiceModal({ invoice, onClose, isAdmin }: { invoice: Invoice; onClose: () => void; isAdmin: boolean }) {
  return (
    <Modal
      open
      onClose={onClose}
      title={`فاتورة ${invoice.number}`}
      size="lg"
      footer={<Button variant="secondary" fullWidth onClick={onClose}>إغلاق</Button>}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs text-secondary-400">العميل</p>
            <p className="font-bold text-secondary-900">{invoice.shopName}</p>
            <p className="text-xs text-secondary-500 mt-1">{formatDate(invoice.date)}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge tone={paymentTones[invoice.paymentMethod]} icon={paymentIcons[invoice.paymentMethod]}>
              {paymentLabels[invoice.paymentMethod]}
            </Badge>
            {invoice.status === 'paid' && <Badge tone="success">مدفوعة بالكامل</Badge>}
            {invoice.status === 'partial' && <Badge tone="warning">دفعة جزئية</Badge>}
            {invoice.status === 'unpaid' && <Badge tone="error">غير مدفوعة</Badge>}
          </div>
        </div>

        <div className="rounded-xl ring-1 ring-secondary-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary-50 text-secondary-500 text-xs">
              <tr>
                <th className="text-right px-3 py-2 font-medium">القطعة</th>
                <th className="text-center px-2 py-2 font-medium">كمية</th>
                <th className="text-center px-2 py-2 font-medium">السعر</th>
                <th className="text-center px-3 py-2 font-medium">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-50">
              {invoice.lines.map((line) => (
                <tr key={line.itemId}>
                  <td className="px-3 py-2">
                    <p className="font-medium text-secondary-800 text-xs">{line.description}</p>
                    <p className="text-[10px] font-mono text-secondary-400">{line.oem}</p>
                  </td>
                  <td className="text-center tabular-nums">{line.qty}</td>
                  <td className="text-center tabular-nums">{formatAed(line.unitPrice)}</td>
                  <td className="text-center font-bold tabular-nums">{formatAed(line.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl bg-secondary-50 p-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-secondary-500">المجموع الفرعي</span><span className="font-semibold tabular-nums">{formatAed(invoice.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-secondary-500">الخصم</span><span className="font-semibold tabular-nums text-error-600">-{formatAed(invoice.discount)}</span></div>
            <div className="flex justify-between border-t border-secondary-200 pt-1.5"><span className="font-bold text-secondary-700">الإجمالي</span><span className="font-bold text-primary-700 tabular-nums">{formatAed(invoice.total)}</span></div>
            <div className="flex justify-between"><span className="text-secondary-500">المدفوع</span><span className="font-semibold tabular-nums text-success-600">{formatAed(invoice.paidAmount)}</span></div>
            {invoice.total - invoice.paidAmount > 0 && (
              <div className="flex justify-between"><span className="text-secondary-500">المتبقي</span><span className="font-bold tabular-nums text-error-600">{formatAed(invoice.total - invoice.paidAmount)}</span></div>
            )}
          </div>
          {isAdmin && (
            <div className="rounded-xl bg-primary-50 p-3 ring-1 ring-primary-100 space-y-1.5 text-sm">
              <p className="font-bold text-primary-800 text-xs mb-1">تفاصيل الإدارة (سرّي)</p>
              <div className="flex justify-between"><span className="text-primary-600">تكلفة البضاعة</span><span className="font-semibold tabular-nums text-primary-800">{formatAed(invoice.totalCost)}</span></div>
              <div className="flex justify-between"><span className="text-primary-600">صافي الربح</span><span className="font-bold tabular-nums text-success-700">{formatAed(invoice.total - invoice.totalCost)}</span></div>
              <div className="flex justify-between"><span className="text-primary-600">أنشأها</span><span className="font-semibold text-primary-800">{invoice.createdByName}</span></div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
