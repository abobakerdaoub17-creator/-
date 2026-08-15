import {
  Wallet, TrendingUp, DollarSign, AlertCircle, Package, FileText, Users, Ship,
  ArrowLeft, MapPin,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { formatAed, formatDate } from '@/lib/format';
import { cityLabel } from '@/lib/geo';
import type { PageKey } from '@/components/Layout';

export function Dashboard({ onNavigate }: { onNavigate: (p: PageKey) => void }) {
  const { role, data, totalOutstanding, debtsByCity } = useApp();
  const isAdmin = role === 'admin';

  const invoices = data.invoices;
  const totalRevenue = invoices.reduce((s, i) => s + i.total, 0);
  const totalCollected = invoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalCost = invoices.reduce((s, i) => s + i.totalCost, 0);
  const totalProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const lowStockItems = data.inventory.filter((i) => i.stock <= i.minStock);
  const inventoryValue = data.inventory.reduce((s, i) => s + i.stock * i.purchasePrice, 0);
  const totalStockUnits = data.inventory.reduce((s, i) => s + i.stock, 0);
  const inTransit = data.shipments.filter((s) => s.status === 'in_transit').length;

  const recentInvoices = invoices.slice(0, 5);
  const cityDebts = debtsByCity();

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-l from-primary-700 to-primary-600 p-5 sm:p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -left-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -left-16 top-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="relative">
          <p className="text-primary-100 text-sm">مرحباً بك في نظام إدارة قطع غيار السيارات</p>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {isAdmin ? 'لوحة تحكم المدير' : 'لوحة المبيعات'}
          </h2>
          {isAdmin && (
            <div className="mt-4 flex flex-wrap gap-4">
              <div>
                <p className="text-primary-100 text-xs">صافي الربح</p>
                <p className="text-lg font-bold tabular-nums">{formatAed(totalProfit)}</p>
              </div>
              <div className="w-px bg-white/20" />
              <div>
                <p className="text-primary-100 text-xs">هامش الربح</p>
                <p className="text-lg font-bold tabular-nums">{profitMargin.toFixed(1)}%</p>
              </div>
            </div>
          )}
          {!isAdmin && (
            <p className="mt-3 text-primary-100 text-sm max-w-md">
              يمكنك البحث عن قطع الغيار برقم OEM، إصدار الفواتير، ومتابعة مبيعاتك الشخصية.
            </p>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {isAdmin ? (
          <>
            <StatCard label="إجمالي الإيرادات" value={formatAed(totalRevenue)} icon={<DollarSign className="w-5 h-5" />} tone="primary" sub={`${invoices.length} فاتورة`} />
            <StatCard label="صافي الأرباح" value={formatAed(totalProfit)} icon={<TrendingUp className="w-5 h-5" />} tone="success" sub={`هامش ${profitMargin.toFixed(1)}%`} trend="up" />
            <StatCard label="المحصّل فعلياً" value={formatAed(totalCollected)} icon={<Wallet className="w-5 h-5" />} tone="accent" />
            <StatCard label="ديون العملاء" value={formatAed(totalOutstanding())} icon={<AlertCircle className="w-5 h-5" />} tone="error" sub={`${data.shops.length} عميل`} />
          </>
        ) : (
          <>
            <StatCard label="مبيعاتي" value={formatAed(totalRevenue)} icon={<DollarSign className="w-5 h-5" />} tone="primary" sub={`${invoices.length} فاتورة`} />
            <StatCard label="قطع الغيار" value={String(data.inventory.length)} icon={<Package className="w-5 h-5" />} tone="success" />
            <StatCard label="العملاء" value={String(data.shops.length)} icon={<Users className="w-5 h-5" />} tone="accent" />
            <StatCard label="فواتيري" value={String(invoices.length)} icon={<FileText className="w-5 h-5" />} tone="secondary" />
          </>
        )}
      </div>

      {/* Admin-only: cost & inventory value */}
      {isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <StatCard label="إجمالي التكلفة" value={formatAed(totalCost)} icon={<TrendingUp className="w-5 h-5" />} tone="warning" sub="تكلفة البضاعة المباعة" />
          <StatCard label="قيمة المخزون" value={formatAed(inventoryValue)} icon={<Package className="w-5 h-5" />} tone="secondary" sub={`${totalStockUnits} قطعة`} />
          <StatCard label="شحنات قادمة" value={String(inTransit)} icon={<Ship className="w-5 h-5" />} tone="accent" sub="من الصين" />
        </div>
      )}

      {/* Low stock alert */}
      {isAdmin && lowStockItems.length > 0 && (
        <div className="rounded-2xl bg-warning-50 ring-1 ring-warning-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-warning-600" />
            <h3 className="font-bold text-warning-800">تنبيه: مخزون منخفض</h3>
            <Badge tone="warning">{lowStockItems.length}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {lowStockItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 ring-1 ring-warning-100">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-secondary-800 truncate">{item.description}</p>
                  <p className="text-xs text-secondary-400 font-mono">{item.oem}</p>
                </div>
                <Badge tone={item.stock === 0 ? 'error' : 'warning'}>{item.stock} متبقي</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debts by region — admin only */}
      {isAdmin && cityDebts.length > 0 && (
        <div className="rounded-2xl bg-white ring-1 ring-secondary-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-secondary-100">
            <MapPin className="w-4 h-4 text-primary-600" />
            <h3 className="font-bold text-secondary-900">الديون حسب المنطقة</h3>
          </div>
          <div className="divide-y divide-secondary-50">
            {cityDebts.map((c) => (
              <button
                key={c.city}
                onClick={() => onNavigate('shops')}
                className="w-full text-right px-4 py-3 flex items-center justify-between gap-3 hover:bg-secondary-50/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-secondary-800 truncate">{cityLabel(c.city)}</p>
                    <p className="text-xs text-secondary-400">{c.shopCount} عميل</p>
                  </div>
                </div>
                <span className="font-bold text-error-600 tabular-nums shrink-0">{formatAed(c.debt)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent invoices */}
      <div className="rounded-2xl bg-white ring-1 ring-secondary-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-secondary-100">
          <h3 className="font-bold text-secondary-900">أحدث الفواتير</h3>
          <button
            onClick={() => onNavigate('invoices')}
            className="text-sm text-primary-600 font-semibold flex items-center gap-1 hover:text-primary-700"
          >
            عرض الكل
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
        {recentInvoices.length === 0 ? (
          <p className="px-4 py-8 text-center text-secondary-400 text-sm">لا توجد فواتير بعد</p>
        ) : (
          <div className="divide-y divide-secondary-50">
            {recentInvoices.map((inv) => (
              <div key={inv.id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-secondary-50/50 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-secondary-800">{inv.number}</span>
                    {inv.status === 'paid' && <Badge tone="success">مدفوعة</Badge>}
                    {inv.status === 'partial' && <Badge tone="warning">جزئية</Badge>}
                    {inv.status === 'unpaid' && <Badge tone="error">آجل</Badge>}
                  </div>
                  <p className="text-xs text-secondary-500 mt-0.5 truncate">{inv.shopName} • {formatDate(inv.date)}</p>
                </div>
                <span className="text-sm font-bold text-secondary-900 tabular-nums shrink-0">{formatAed(inv.total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
