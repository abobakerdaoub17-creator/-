import { useMemo, useState } from 'react';
import { Users, Plus, Search, X, Phone, MapPin, Wallet, ArrowDownLeft, FileText, TrendingUp, Building2, ChartPie as PieChart } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Badge } from '@/components/ui/Badge';
import { Button, Input, Select, EmptyState } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import { formatAed, formatDate, todayISO } from '@/lib/format';
import { libyanCities, cityLabel, cityAreas } from '@/lib/geo';
import type { Shop } from '@/types';

export function Shops() {
  const { role, data, shopBalance, addShop, debtsByCity } = useApp();
  const isAdmin = role === 'admin';
  const [query, setQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [showRegions, setShowRegions] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const availableAreas = cityFilter !== 'all' ? cityAreas(cityFilter) : [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.shops.filter((s) => {
      const matchesQ = !q || s.name.toLowerCase().includes(q) || s.ownerName.toLowerCase().includes(q) || s.phone.includes(q);
      const matchesCity = cityFilter === 'all' || s.city === cityFilter;
      const matchesArea = areaFilter === 'all' || s.area === areaFilter;
      return matchesQ && matchesCity && matchesArea;
    });
  }, [data.shops, query, cityFilter, areaFilter]);

  const cityDebts = debtsByCity();
  const totalFilteredDebt = filtered.reduce((sum, s) => sum + Math.max(0, shopBalance(s.id)), 0);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-secondary-900">العملاء والمحلات</h2>
          <p className="text-sm text-secondary-500">{data.shops.length} عميل</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="secondary" icon={<PieChart className="w-4 h-4" />} onClick={() => setShowRegions(true)} size="sm">
              الديون حسب المنطقة
            </Button>
          )}
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setAddOpen(true)} size="sm">عميل جديد</Button>
        </div>
      </div>

      {/* Search + filters */}
      <div className="rounded-2xl bg-white ring-1 ring-secondary-100 shadow-sm p-4 space-y-3">
        <div className="relative">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث باسم المحل أو المالك أو الهاتف..."
            className="w-full rounded-xl border-0 bg-secondary-50 pr-11 pl-4 py-2.5 text-secondary-900 placeholder:text-secondary-400 ring-1 ring-inset ring-secondary-200 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <select
            value={cityFilter}
            onChange={(e) => { setCityFilter(e.target.value); setAreaFilter('all'); }}
            className="rounded-xl bg-secondary-50 px-3 py-2 text-sm text-secondary-700 ring-1 ring-inset ring-secondary-200 focus:ring-2 focus:ring-primary-500 outline-none"
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
              className="rounded-xl bg-secondary-50 px-3 py-2 text-sm text-secondary-700 ring-1 ring-inset ring-secondary-200 focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="all">كل المناطق</option>
              {availableAreas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          )}
          {(cityFilter !== 'all' || areaFilter !== 'all') && (
            <button
              onClick={() => { setCityFilter('all'); setAreaFilter('all'); }}
              className="px-3 py-2 text-sm text-secondary-500 hover:text-secondary-700"
            >
              مسح الفلتر
            </button>
          )}
        </div>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between text-sm pt-1 border-t border-secondary-50">
            <span className="text-secondary-500">{filtered.length} عميل</span>
            <span className="text-secondary-500">
              إجمالي الديون: <span className="font-bold text-error-600 tabular-nums">{formatAed(totalFilteredDebt)}</span>
            </span>
          </div>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white ring-1 ring-secondary-100">
          <EmptyState icon={<Users className="w-8 h-8" />} title="لا يوجد عملاء" description="جرّب تغيير الفلتر أو أضف عملاً جديداً" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((shop) => {
            const balance = shopBalance(shop.id);
            const invCount = data.invoices.filter((i) => i.shopId === shop.id).length;
            return (
              <button
                key={shop.id}
                onClick={() => setSelectedShop(shop)}
                className="text-right rounded-2xl bg-white ring-1 ring-secondary-100 shadow-sm p-4 hover:shadow-md hover:ring-primary-200 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-secondary-900 text-sm truncate">{shop.name}</h3>
                    <p className="text-xs text-secondary-500 truncate">{shop.ownerName}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-secondary-400 flex-wrap">
                      <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{shop.phone}</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {cityLabel(shop.city)}{shop.area && ` - ${shop.area}`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-secondary-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge tone="neutral" icon={<FileText className="w-3 h-3" />}>{invCount} فاتورة</Badge>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-secondary-400">الرصيد المستحق</p>
                    <p className={`text-base font-bold tabular-nums ${balance > 0 ? 'text-error-600' : 'text-success-600'}`}>
                      {formatAed(Math.abs(balance))}
                      {balance > 0 && <span className="text-xs font-normal mr-1">مدين</span>}
                      {balance < 0 && <span className="text-xs font-normal mr-1">دائن</span>}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedShop && <ShopDetailModal shop={selectedShop} onClose={() => setSelectedShop(null)} />}
      {addOpen && <AddShopModal onClose={() => setAddOpen(false)} onAdd={(s) => { addShop(s); setAddOpen(false); }} />}
      {showRegions && <RegionsModal onClose={() => setShowRegions(false)} />}
    </div>
  );
}

function RegionsModal({ onClose }: { onClose: () => void }) {
  const { data, shopBalance, debtsByCity } = useApp();
  const cityDebts = debtsByCity();
  const grandTotal = cityDebts.reduce((s, c) => s + c.debt, 0);

  // Build area-level breakdown for Tripoli
  const tripoliShops = data.shops.filter((s) => s.city === 'tripoli');
  const areaMap = new Map<string, { debt: number; count: number }>();
  tripoliShops.forEach((s) => {
    const bal = Math.max(0, shopBalance(s.id));
    const area = s.area || 'غير محدد';
    const ex = areaMap.get(area) ?? { debt: 0, count: 0 };
    ex.debt += bal;
    ex.count += 1;
    areaMap.set(area, ex);
  });
  const areaDebts = Array.from(areaMap.entries())
    .map(([area, v]) => ({ area, ...v }))
    .sort((a, b) => b.debt - a.debt);

  return (
    <Modal
      open
      onClose={onClose}
      title="الديون حسب المنطقة"
      size="lg"
      footer={<Button variant="secondary" fullWidth onClick={onClose}>إغلاق</Button>}
    >
      <div className="space-y-4">
        {/* Grand total */}
        <div className="rounded-2xl bg-gradient-to-l from-error-600 to-error-500 p-4 text-white shadow-sm">
          <p className="text-error-100 text-sm">إجمالي الديون المستحقة</p>
          <p className="text-2xl font-bold tabular-nums mt-1">{formatAed(grandTotal)}</p>
          <p className="text-error-100 text-xs mt-1">{data.shops.length} عميل • {cityDebts.length} مدينة</p>
        </div>

        {/* By city */}
        <div className="rounded-xl ring-1 ring-secondary-200 overflow-hidden">
          <div className="px-3 py-2 bg-secondary-50 border-b border-secondary-100">
            <h4 className="font-bold text-secondary-800 text-sm">حسب المدينة</h4>
          </div>
          <div className="divide-y divide-secondary-50">
            {cityDebts.map((c) => (
              <div key={c.city} className="px-3 py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-secondary-800">{cityLabel(c.city)}</p>
                    <p className="text-xs text-secondary-400">{c.shopCount} عميل</p>
                  </div>
                </div>
                <span className="font-bold text-error-600 tabular-nums shrink-0">{formatAed(c.debt)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tripoli area breakdown */}
        {areaDebts.length > 0 && (
          <div className="rounded-xl ring-1 ring-secondary-200 overflow-hidden">
            <div className="px-3 py-2 bg-secondary-50 border-b border-secondary-100">
              <h4 className="font-bold text-secondary-800 text-sm">تفصيل مناطق طرابلس</h4>
            </div>
            <div className="divide-y divide-secondary-50 max-h-60 overflow-y-auto scrollbar-thin">
              {areaDebts.map((a) => (
                <div key={a.area} className="px-3 py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-secondary-800 truncate">{a.area}</p>
                    <p className="text-xs text-secondary-400">{a.count} عميل</p>
                  </div>
                  <span className="font-bold text-error-600 tabular-nums text-sm shrink-0">{formatAed(a.debt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function ShopDetailModal({ shop, onClose }: { shop: Shop; onClose: () => void }) {
  const { data, shopBalance, addPayment, currentUser } = useApp();
  const [settleOpen, setSettleOpen] = useState(false);
  const [settleAmount, setSettleAmount] = useState(0);
  const [settleMethod, setSettleMethod] = useState<'cash' | 'bank'>('cash');
  const [settleNote, setSettleNote] = useState('');

  const balance = shopBalance(shop.id);
  const invoices = data.invoices.filter((i) => i.shopId === shop.id);
  const payments = data.payments.filter((p) => p.shopId === shop.id);

  type Entry = { date: string; desc: string; debit: number; credit: number; method?: string };
  const entries: Entry[] = [
    ...invoices.map((inv) => ({
      date: inv.date, desc: `فاتورة ${inv.number}`,
      debit: inv.total - inv.paidAmount, credit: inv.paidAmount,
    })),
    ...payments.map((p) => ({
      date: p.date, desc: p.note || 'دفعة',
      debit: 0, credit: p.amount, method: p.method,
    })),
  ];
  if (shop.openingBalance > 0) {
    entries.push({ date: shop.createdAt, desc: 'رصيد افتتاحي', debit: shop.openingBalance, credit: 0 });
  }
  entries.sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Modal
      open
      onClose={onClose}
      title={shop.name}
      size="lg"
      footer={
        balance > 0 ? (
          <Button fullWidth icon={<Wallet className="w-4 h-4" />} onClick={() => { setSettleAmount(balance); setSettleOpen(true); }}>
            تسوية دين
          </Button>
        ) : <Button variant="secondary" fullWidth onClick={onClose}>إغلاق</Button>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl bg-secondary-50 p-3">
          <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-secondary-900">{shop.ownerName}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-secondary-500 flex-wrap">
              <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{shop.phone}</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {cityLabel(shop.city)}{shop.area && ` - ${shop.area}`}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-error-50 ring-1 ring-error-100 p-3 text-center">
            <p className="text-[10px] text-error-600">رصيد مدين</p>
            <p className="text-base font-bold text-error-700 tabular-nums">{formatAed(Math.max(0, balance))}</p>
          </div>
          <div className="rounded-xl bg-secondary-50 ring-1 ring-secondary-200 p-3 text-center">
            <p className="text-[10px] text-secondary-500">إجمالي الفواتير</p>
            <p className="text-base font-bold text-secondary-800 tabular-nums">{formatAed(invoices.reduce((s, i) => s + i.total, 0))}</p>
          </div>
          <div className="rounded-xl bg-success-50 ring-1 ring-success-100 p-3 text-center">
            <p className="text-[10px] text-success-600">إجمالي المدفوع</p>
            <p className="text-base font-bold text-success-700 tabular-nums">{formatAed(payments.reduce((s, p) => s + p.amount, 0))}</p>
          </div>
        </div>

        <div className="rounded-xl ring-1 ring-secondary-200 overflow-hidden">
          <div className="px-3 py-2 bg-secondary-50 border-b border-secondary-100">
            <h4 className="font-bold text-secondary-800 text-sm">كشف الحساب</h4>
          </div>
          <div className="max-h-72 overflow-y-auto scrollbar-thin divide-y divide-secondary-50">
            {entries.length === 0 ? (
              <p className="px-3 py-6 text-center text-secondary-400 text-sm">لا توجد حركات</p>
            ) : (
              entries.map((e, idx) => (
                <div key={idx} className="px-3 py-2.5 flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-secondary-800 text-xs truncate">{e.desc}</p>
                    <p className="text-[10px] text-secondary-400">{formatDate(e.date)}{e.method && ` • ${e.method === 'cash' ? 'نقداً' : 'بنك'}`}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {e.debit > 0 && (
                      <span className="text-error-600 font-semibold tabular-nums text-xs flex items-center gap-1">
                        <ArrowDownLeft className="w-3 h-3" />
                        {formatAed(e.debit)}
                      </span>
                    )}
                    {e.credit > 0 && (
                      <span className="text-success-600 font-semibold tabular-nums text-xs flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {formatAed(e.credit)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {settleOpen && (
        <Modal
          open
          onClose={() => setSettleOpen(false)}
          title="تسوية دين"
          size="sm"
          footer={
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => setSettleOpen(false)}>إلغاء</Button>
              <Button
                variant="success" fullWidth disabled={settleAmount <= 0}
                onClick={() => {
                  addPayment({ shopId: shop.id, amount: settleAmount, method: settleMethod, date: todayISO(), note: settleNote || 'تسوية دين', createdBy: currentUser.id });
                  setSettleOpen(false);
                }}
              >
                تأكيد الدفعة
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <div className="rounded-xl bg-error-50 ring-1 ring-error-100 p-3 text-center">
              <p className="text-xs text-error-600">الرصيد الحالي المستحق</p>
              <p className="text-xl font-bold text-error-700 tabular-nums">{formatAed(balance)}</p>
            </div>
            <Input label="مبلغ الدفعة (د.ل)" type="number" min={0} max={balance} value={settleAmount} onChange={(e) => setSettleAmount(Number(e.target.value))} />
            <div>
              <span className="block text-sm font-medium text-secondary-700 mb-1.5">طريقة الدفع</span>
              <div className="grid grid-cols-2 gap-2">
                {(['cash', 'bank'] as const).map((m) => (
                  <button
                    key={m} onClick={() => setSettleMethod(m)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${settleMethod === m ? 'bg-primary-600 text-white' : 'bg-secondary-50 text-secondary-600 hover:bg-secondary-100'}`}
                  >
                    {m === 'cash' ? 'نقداً' : 'تحويل بنكي'}
                  </button>
                ))}
              </div>
            </div>
            <Input label="ملاحظة (اختياري)" value={settleNote} onChange={(e) => setSettleNote(e.target.value)} placeholder="ملاحظة على الدفعة" />
          </div>
        </Modal>
      )}
    </Modal>
  );
}

function AddShopModal({ onClose, onAdd }: { onClose: () => void; onAdd: (s: Omit<Shop, 'id' | 'createdAt'>) => void }) {
  const [form, setForm] = useState({ name: '', ownerName: '', phone: '', city: '', area: '', openingBalance: 0 });
  const set = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.name && form.ownerName && form.phone && form.city;
  const areas = form.city ? cityAreas(form.city) : [];

  return (
    <Modal
      open
      onClose={onClose}
      title="عميل جديد"
      size="md"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={onClose}>إلغاء</Button>
          <Button fullWidth disabled={!valid} onClick={() => onAdd(form)}>إضافة</Button>
        </div>
      }
    >
      <div className="space-y-3">
        <Input label="اسم المحل" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="مركز الخليج" />
        <Input label="اسم المالك" value={form.ownerName} onChange={(e) => set('ownerName', e.target.value)} placeholder="أحمد المنصوري" />
        <Input label="رقم الهاتف" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="0911234567" />
        <Select
          label="المدينة / المنطقة"
          value={form.city}
          onChange={(e) => set('city', e.target.value)}
          options={[{ value: '', label: 'اختر المدينة...' }, ...libyanCities.map((c) => ({ value: c.value, label: c.label }))]}
        />
        {areas.length > 0 && (
          <Select
            label="المنطقة / الحي"
            value={form.area}
            onChange={(e) => set('area', e.target.value)}
            options={[{ value: '', label: 'اختر المنطقة...' }, ...areas.map((a) => ({ value: a, label: a }))]}
          />
        )}
        <Input label="الرصيد الافتتاحي (د.ل)" type="number" min={0} value={form.openingBalance} onChange={(e) => set('openingBalance', Number(e.target.value))} />
      </div>
    </Modal>
  );
}
