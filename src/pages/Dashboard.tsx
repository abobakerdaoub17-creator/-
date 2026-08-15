import {
  Wallet,
  TrendingUp,
  DollarSign,
  CircleAlert as AlertCircle,
  Package,
  FileText,
  Users,
  Ship,
  ArrowLeft,
  MapPin,
  Truck,
  Home,
  ArrowRightLeft,
  Boxes,
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
  const mainWarehouseStockUnits = data.inventory.reduce((s, i) => s + i.stock, 0);

  // Active Vehicle Trips Stock
  const activeTrips = data.trips.filter((t) => t.status === 'active' || t.status === 'loading');
  const vehicleStockUnits = activeTrips.reduce(
    (sum, t) => sum + t.items.reduce((s, i) => s + (i.loadedQty - i.soldQty - i.returnedQty), 0),
    0
  );

  const inTransit = data.shipments.filter((s) => s.status === 'in_transit').length;
  const recentInvoices = invoices.slice(0, 5);
  const recentMovements = (data.stockMovements || []).slice(0, 5);
  const cityDebts = debtsByCity();

  return (
    <div className="space-y-5 animate-fade-in" id="dashboard-page">
      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-l from-primary-700 to-primary-600 p-5 sm:p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -left-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -left-16 top-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="relative">
          <p className="text-primary-100 text-sm">مرحباً بك في نظام إدارة توزيع قطع غيار السيارات</p>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {isAdmin ? 'لوحة تحكم إدارة المخازن والتوزيع' : 'لوحة تحكم المبيعات'}
          </h2>
          {isAdmin && (
            <div className="mt-4 flex flex-wrap gap-4">
              <div>
                <p className="text-primary-100 text-xs">صافي الربح الإجمالي</p>
                <p className="text-lg font-bold tabular-nums">{formatAed(totalProfit)}</p>
              </div>
              <div className="w-px bg-white/20" />
              <div>
                <p className="text-primary-100 text-xs">هامش الربح</p>
                <p className="text-lg font-bold tabular-nums">{profitMargin.toFixed(1)}%</p>
              </div>
              <div className="w-px bg-white/20" />
              <div>
                <p className="text-primary-100 text-xs">رصيد المخزن الرئيسي</p>
                <p className="text-lg font-bold tabular-nums">{mainWarehouseStockUnits} <span className="text-xs font-normal">قطعة</span></p>
              </div>
              <div className="w-px bg-white/20" />
              <div>
                <p className="text-primary-100 text-xs">رصيد سيارات التوزيع</p>
                <p className="text-lg font-bold tabular-nums">{vehicleStockUnits} <span className="text-xs font-normal">قطعة</span></p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Warehouse & Vehicle Inventory Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <button
          onClick={() => onNavigate('inventory')}
          className="text-right rounded-2xl bg-white ring-1 ring-secondary-100 shadow-sm p-4 hover:shadow-md hover:ring-primary-300 transition-all flex items-center gap-3.5 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <Home className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-secondary-500 font-medium">المخزن الرئيسي (البيت)</p>
            <p className="text-xl font-bold text-secondary-900 tabular-nums">{mainWarehouseStockUnits} <span className="text-xs font-normal text-secondary-500">قطعة</span></p>
            <p className="text-[11px] text-primary-600 font-semibold mt-0.5">عرض المخزون ➔</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('trips')}
          className="text-right rounded-2xl bg-white ring-1 ring-secondary-100 shadow-sm p-4 hover:shadow-md hover:ring-warning-300 transition-all flex items-center gap-3.5 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-warning-50 text-warning-600 flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-secondary-500 font-medium">سيارات التوزيع ({activeTrips.length})</p>
            <p className="text-xl font-bold text-warning-700 tabular-nums">{vehicleStockUnits} <span className="text-xs font-normal text-secondary-500">قطعة محملة</span></p>
            <p className="text-[11px] text-warning-700 font-semibold mt-0.5">إدارة الحمولة والبيع ➔</p>
          </div>
        </button>

        <StatCard
          label="إجمالي الإيرادات"
          value={formatAed(totalRevenue)}
          icon={<DollarSign className="w-5 h-5" />}
          tone="primary"
          sub={`${invoices.length} فاتورة مسجلة`}
        />

        <StatCard
          label="ديون العملاء المعلقة"
          value={formatAed(totalOutstanding())}
          icon={<AlertCircle className="w-5 h-5" />}
          tone="error"
          sub={`${data.shops.length} عميل`}
        />
      </div>

      {/* Admin stats */}
      {isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <StatCard label="المحصل نقداً ومصرفياً" value={formatAed(totalCollected)} icon={<Wallet className="w-5 h-5" />} tone="success" />
          <StatCard label="قيمة بضاعة المخزن الرئيسي" value={formatAed(inventoryValue)} icon={<Boxes className="w-5 h-5" />} tone="secondary" sub={`${data.inventory.length} صنف مسجل`} />
          <StatCard label="شحنات قادمة من الصين" value={String(inTransit)} icon={<Ship className="w-5 h-5" />} tone="accent" sub="في طريق الشحن" />
        </div>
      )}

      {/* Low stock alert */}
      {isAdmin && lowStockItems.length > 0 && (
        <div className="rounded-2xl bg-warning-50 ring-1 ring-warning-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-warning-600" />
            <h3 className="font-bold text-warning-800">تنبيه: أصناف قاربت على النفاد بالمخزن الرئيسي</h3>
            <Badge tone="warning">{lowStockItems.length}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {lowStockItems.slice(0, 6).map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 ring-1 ring-warning-100">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-secondary-800 truncate">{item.description}</p>
                  <p className="text-xs text-secondary-400 font-mono">{item.oem}</p>
                </div>
                <Badge tone={item.stock === 0 ? 'error' : 'warning'}>{item.stock} بالمخزن</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two column grid: Active Trips Goods Status & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Vehicle Trips Goods Status */}
        <div className="rounded-2xl bg-white ring-1 ring-secondary-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-secondary-100">
              <h3 className="font-bold text-secondary-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-warning-600" />
                حالة بضاعة سيارات التوزيع والجولات
              </h3>
              <button
                onClick={() => onNavigate('trips')}
                className="text-xs text-primary-600 font-semibold flex items-center gap-1 hover:text-primary-700"
              >
                عرض كل الجولات
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeTrips.length === 0 ? (
              <div className="px-4 py-8 text-center text-secondary-400 text-sm">
                <p>لا توجد جولات توزيع نشطة حالياً</p>
                <button
                  onClick={() => onNavigate('trips')}
                  className="mt-2 text-xs font-semibold text-primary-600 hover:underline"
                >
                  + بدء جولة وتحميل بضاعة
                </button>
              </div>
            ) : (
              <div className="divide-y divide-secondary-50">
                {activeTrips.map((trip) => {
                  const totalLoaded = trip.items.reduce((s, i) => s + i.loadedQty, 0);
                  const totalSold = trip.items.reduce((s, i) => s + i.soldQty, 0);
                  const totalReturned = trip.items.reduce((s, i) => s + i.returnedQty, 0);
                  const remaining = totalLoaded - totalSold - totalReturned;

                  return (
                    <div
                      key={trip.id}
                      onClick={() => onNavigate('trips')}
                      className="px-4 py-3 hover:bg-secondary-50/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-secondary-900">{trip.driverName}</span>
                          <span className="text-[11px] text-secondary-400">({trip.vehicle})</span>
                        </div>
                        <Badge tone={remaining > 0 ? 'warning' : 'neutral'}>
                          المتبقي: {remaining} قطعة
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-center bg-secondary-50 p-2 rounded-xl text-xs">
                        <div>
                          <span className="text-[10px] text-secondary-400 block">المحمل</span>
                          <span className="font-bold text-secondary-700">{totalLoaded}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-secondary-400 block">المباع</span>
                          <span className="font-bold text-success-600">{totalSold}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-secondary-400 block">المتبقي بالسيارة</span>
                          <span className="font-bold text-warning-700">{remaining}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="rounded-2xl bg-white ring-1 ring-secondary-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-secondary-100">
              <h3 className="font-bold text-secondary-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-600" />
                أحدث الفواتير
              </h3>
              <button
                onClick={() => onNavigate('invoices')}
                className="text-xs text-primary-600 font-semibold flex items-center gap-1 hover:text-primary-700"
              >
                عرض الكل
                <ArrowLeft className="w-3.5 h-3.5" />
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
                        {inv.tripId && (
                          <span className="text-[10px] text-warning-700 bg-warning-50 px-1.5 py-0.5 rounded font-medium">سيارة</span>
                        )}
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
      </div>
    </div>
  );
}
