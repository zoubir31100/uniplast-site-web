import React, { useState, useMemo } from 'react';
import { 
  BarChart2, TrendingUp, Package, ShoppingBag, 
  ArrowLeft, Calendar, Award, Star, Users,
  Clock, ChevronRight
} from 'lucide-react';
import { Product, Order } from '../types';
import { formatCurrency, getStoredOrders } from '../utils/storage';

interface StatsViewProps {
  products: Product[];
  onBack: () => void;
}

const MONTHS_AR = [
  'جانفي','فيفري','مارس','أفريل','ماي','جوان',
  'جويلية','أوت','سبتمبر','أكتوبر','نوفمبر','ديسمبر'
];

// ─── Mini horizontal bar ────────────────────────────────────
const Bar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => (
  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
    <div
      className="h-full rounded-full transition-all duration-700"
      style={{ width: `${max > 0 ? Math.max((value / max) * 100, value > 0 ? 3 : 0) : 0}%`, background: color }}
    />
  </div>
);

// ─── Rank badge ──────────────────────────────────────────────
const Rank: React.FC<{ i: number }> = ({ i }) => (
  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0
    ${i === 0 ? 'bg-yellow-400 text-yellow-900'
    : i === 1 ? 'bg-gray-300 text-gray-700'
    : i === 2 ? 'bg-orange-300 text-orange-900'
    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}
  >{i + 1}</div>
);

// ─── Section wrapper ─────────────────────────────────────────
const Section: React.FC<{ title: string; icon: React.ReactNode; color: string; children: React.ReactNode }> = ({ title, icon, color, children }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
      <span style={{ color }}>{icon}</span>
      <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

// ─── KPI card ────────────────────────────────────────────────
const KPI: React.FC<{ label: string; value: string | number; sub?: string; icon: React.ReactNode; bg: string; color: string }> = ({ label, value, sub, icon, bg, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
      <span style={{ color }}>{icon}</span>
    </div>
    <div className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold mb-0.5">{label}</div>
    <div className="text-xl font-black text-gray-900 dark:text-white leading-tight">{value}</div>
    {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
  </div>
);

export const StatsView: React.FC<StatsViewProps> = ({ products, onBack }) => {
  const orders: Order[] = useMemo(() => getStoredOrders(), []);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [topTab, setTopTab] = useState<'pieces' | 'revenue'>('pieces');

  // ── KPIs ─────────────────────────────────────────────────────
  const totalRevenue  = useMemo(() => orders.reduce((s, o) => s + o.totalAmount, 0), [orders]);
  const totalOrders   = orders.length;
  const totalPieces   = useMemo(() => orders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.totalPieces, 0), 0), [orders]);
  const totalCartons  = useMemo(() => orders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.quantityCartons, 0), 0), [orders]);
  const avgOrder      = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const uniqueClients = useMemo(() => new Set(orders.map(o => o.customerName.trim().toLowerCase())).size, [orders]);

  // ── Per-product stats ────────────────────────────────────────
  interface PS { name: string; code: string; category: string; pieces: number; cartons: number; revenue: number; orderCount: number; monthly: Record<number, number>; }
  const prodMap = useMemo<Record<string, PS>>(() => {
    const m: Record<string, PS> = {};
    orders.forEach(o => {
      const month = new Date(o.date).getMonth();
      o.items.forEach(item => {
        if (!m[item.id]) m[item.id] = { name: item.name, code: item.code, category: item.category, pieces: 0, cartons: 0, revenue: 0, orderCount: 0, monthly: {} };
        m[item.id].pieces    += item.totalPieces;
        m[item.id].cartons   += item.quantityCartons;
        m[item.id].revenue   += item.totalPrice;
        m[item.id].orderCount++;
        m[item.id].monthly[month] = (m[item.id].monthly[month] || 0) + item.totalPieces;
      });
    });
    return m;
  }, [orders]);

  const byPieces  = useMemo(() => Object.values(prodMap).sort((a, b) => b.pieces - a.pieces), [prodMap]);
  const byRevenue = useMemo(() => Object.values(prodMap).sort((a, b) => b.revenue - a.revenue), [prodMap]);
  const topList   = topTab === 'pieces' ? byPieces : byRevenue;
  const topMax    = topTab === 'pieces' ? (byPieces[0]?.pieces || 1) : (byRevenue[0]?.revenue || 1);
  const topColor  = topTab === 'pieces' ? '#16a34a' : '#d97706';

  // ── Monthly data ─────────────────────────────────────────────
  const monthlyRev = useMemo(() => { const a = Array(12).fill(0); orders.forEach(o => { a[new Date(o.date).getMonth()] += o.totalAmount; }); return a; }, [orders]);
  const monthlyOrd = useMemo(() => { const a = Array(12).fill(0); orders.forEach(o => { a[new Date(o.date).getMonth()]++; }); return a; }, [orders]);
  const maxMonthRev = Math.max(...monthlyRev, 1);

  // ── Month top products ───────────────────────────────────────
  const monthTop = useMemo(() => {
    if (selectedMonth === null) return [];
    const m: Record<string, { name: string; code: string; pieces: number }> = {};
    orders.filter(o => new Date(o.date).getMonth() === selectedMonth)
      .forEach(o => o.items.forEach(item => {
        if (!m[item.id]) m[item.id] = { name: item.name, code: item.code, pieces: 0 };
        m[item.id].pieces += item.totalPieces;
      }));
    return Object.values(m).sort((a, b) => b.pieces - a.pieces).slice(0, 8);
  }, [orders, selectedMonth]);
  const monthTopMax = monthTop[0]?.pieces || 1;

  // ── Category stats ───────────────────────────────────────────
  const catStats = useMemo(() => {
    const m: Record<string, { revenue: number; pieces: number }> = {};
    orders.forEach(o => o.items.forEach(i => {
      const c = i.category || 'أخرى';
      if (!m[c]) m[c] = { revenue: 0, pieces: 0 };
      m[c].revenue += i.totalPrice;
      m[c].pieces  += i.totalPieces;
    }));
    return Object.entries(m).sort((a, b) => b[1].revenue - a[1].revenue);
  }, [orders]);
  const maxCatRev = catStats[0]?.[1].revenue || 1;

  // ── Top clients ──────────────────────────────────────────────
  const topClients = useMemo(() => {
    const m: Record<string, { name: string; orders: number; revenue: number }> = {};
    orders.forEach(o => {
      const k = o.customerName.trim().toLowerCase();
      if (!m[k]) m[k] = { name: o.customerName, orders: 0, revenue: 0 };
      m[k].orders++;
      m[k].revenue += o.totalAmount;
    });
    return Object.values(m).sort((a, b) => b.orders - a.orders).slice(0, 8);
  }, [orders]);
  const maxClientOrd = topClients[0]?.orders || 1;

  // ── Catalog health ───────────────────────────────────────────
  const catalog = {
    total:   products.length,
    active:  products.filter(p => !p.isHidden && !p.isOutOfStock).length,
    disc:    products.filter(p => p.discountPrice && p.discountEndDate && new Date(p.discountEndDate) > new Date()).length,
    oos:     products.filter(p => p.isOutOfStock).length,
    hidden:  products.filter(p => p.isHidden).length,
  };

  // ── Empty state ──────────────────────────────────────────────
  if (orders.length === 0) return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition"><ArrowLeft size={20}/></button>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2"><BarChart2 className="text-blue-600"/> الإحصائيات</h2>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-20 text-center">
        <BarChart2 size={56} className="mx-auto mb-4 text-gray-200 dark:text-gray-600"/>
        <h3 className="text-xl font-bold text-gray-500 mb-2">لا توجد بيانات بعد</h3>
        <p className="text-sm text-gray-400">أكمل بعض الطلبيات وستظهر الإحصائيات هنا تلقائياً</p>
        <button onClick={onBack} className="mt-6 bg-blue-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-800 transition">ابدأ الآن</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition">
          <ArrowLeft size={20}/>
        </button>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart2 className="text-blue-600"/> لوحة الإحصائيات
        </h2>
      </div>

      {/* ══ KPI Grid ══ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPI label="إجمالي المبيعات"  value={formatCurrency(totalRevenue)} icon={<TrendingUp size={18}/>} bg="#dbeafe" color="#1e3a8a"/>
        <KPI label="عدد الطلبيات"    value={totalOrders}                   icon={<ShoppingBag size={18}/>} bg="#dcfce7" color="#15803d"/>
        <KPI label="زبائن مختلفون"   value={uniqueClients}                 icon={<Users size={18}/>} bg="#fef3c7" color="#b45309"/>
        <KPI label="إجمالي القطع"    value={totalPieces.toLocaleString()}  icon={<Package size={18}/>} bg="#fce7f3" color="#9d174d"/>
        <KPI label="إجمالي الكراتين" value={totalCartons.toLocaleString()} icon={<Package size={18}/>} bg="#ede9fe" color="#6d28d9"/>
        <KPI label="متوسط الطلبية"   value={formatCurrency(avgOrder)}      icon={<Award size={18}/>} bg="#e0f2fe" color="#0369a1"/>
      </div>

      {/* ══ Monthly Chart ══ */}
      <Section title="المبيعات الشهرية — انقر على شهر لعرض أكثر منتجاته طلباً" icon={<Calendar size={15}/>} color="#2563eb">
        <>
          {/* Bars */}
          <div className="flex items-end gap-1 h-36 mb-1">
            {monthlyRev.map((rev, i) => {
              const pct = maxMonthRev > 0 ? Math.max((rev / maxMonthRev) * 100, rev > 0 ? 5 : 0) : 0;
              const sel = selectedMonth === i;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 cursor-pointer group" onClick={() => setSelectedMonth(sel ? null : i)}>
                  <div
                    className="w-full rounded-t-lg transition-all duration-300"
                    style={{
                      height: `${pct}%`,
                      minHeight: rev > 0 ? '6px' : '0',
                      background: sel ? '#1e3a8a' : rev > 0 ? '#3b82f6' : '#e5e7eb',
                      opacity: selectedMonth !== null && !sel ? 0.45 : 1,
                    }}
                    title={`${MONTHS_AR[i]}: ${formatCurrency(rev)}`}
                  />
                  <span className={`text-[9px] md:text-[10px] font-bold ${sel ? 'text-blue-700 dark:text-blue-400' : 'text-gray-400'}`}>
                    {MONTHS_AR[i].slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Selected month detail */}
          {selectedMonth !== null && (
            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800 animate-fade-in-up">
              <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                <h4 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5 text-sm">
                  <Calendar size={13}/> {MONTHS_AR[selectedMonth]} — أكثر المنتجات طلباً
                </h4>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-bold bg-blue-100 dark:bg-blue-800 px-2 py-0.5 rounded-full">
                  {monthlyOrd[selectedMonth]} طلبية | {formatCurrency(monthlyRev[selectedMonth])}
                </span>
              </div>
              {monthTop.length === 0
                ? <p className="text-sm text-blue-400 text-center py-3">لا توجد طلبيات هذا الشهر</p>
                : <div className="space-y-2">
                    {monthTop.map((p, i) => (
                      <div key={p.code} className="flex items-center gap-2.5">
                        <Rank i={i}/>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex-1 line-clamp-1">{p.name}</span>
                        <Bar value={p.pieces} max={monthTopMax} color="#3b82f6"/>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 w-16 text-left flex-shrink-0">{p.pieces} قطعة</span>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}
        </>
      </Section>

      {/* ══ Top Products ══ */}
      <Section title="المنتجات الأكثر طلباً" icon={<TrendingUp size={15}/>} color={topColor}>
        <>
          {/* Toggle tabs */}
          <div className="flex gap-2 mb-4 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl w-fit">
            {([['pieces','بالقطع'],['revenue','بالقيمة']] as const).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTopTab(k)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${topTab === k ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
              >{label}</button>
            ))}
          </div>

          <div className="space-y-2.5">
            {topList.slice(0, 10).map((p, i) => (
              <div key={p.code} className="flex items-center gap-2.5">
                <Rank i={i}/>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 line-clamp-1">{p.name}</div>
                  <div className="text-[10px] text-gray-400 font-mono">{p.code} · {p.category}</div>
                </div>
                <Bar value={topTab === 'pieces' ? p.pieces : p.revenue} max={topMax} color={topColor}/>
                <div className="text-left w-24 flex-shrink-0">
                  {topTab === 'pieces'
                    ? <><div className="text-sm font-bold text-green-600 dark:text-green-400">{p.pieces.toLocaleString()} قطعة</div><div className="text-[10px] text-gray-400">{p.cartons} كرتون</div></>
                    : <><div className="text-sm font-bold text-amber-600 dark:text-amber-400">{formatCurrency(p.revenue)}</div><div className="text-[10px] text-gray-400">{p.pieces.toLocaleString()} قطعة</div></>
                  }
                </div>
              </div>
            ))}
            {topList.length === 0 && <p className="text-center text-gray-400 py-6 text-sm">لا توجد بيانات بعد</p>}
          </div>
        </>
      </Section>

      {/* ══ Seasonal Heatmap ══ */}
      <Section title="الموسمية — كثافة الطلب لكل منتج حسب الشهر" icon={<Clock size={15}/>} color="#7c3aed">
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-[10px] md:text-xs">
            <thead>
              <tr>
                <th className="text-right py-2 pr-2 text-gray-400 font-bold w-28 md:w-36">المنتج</th>
                {MONTHS_AR.map(m => (
                  <th key={m} className="text-center py-2 px-0.5 text-gray-400 font-bold">{m.slice(0,3)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byPieces.slice(0, 8).map(p => {
                const maxM = Math.max(...Object.values(p.monthly), 1);
                return (
                  <tr key={p.code} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="py-1.5 pr-2 font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[112px] md:max-w-[144px]" title={p.name}>
                      {p.name.length > 14 ? p.name.slice(0, 13) + '…' : p.name}
                    </td>
                    {Array.from({ length: 12 }, (_, i) => {
                      const val = p.monthly[i] || 0;
                      const lvl = val > 0 ? Math.ceil((val / maxM) * 4) : 0;
                      const fills = ['bg-transparent', 'bg-purple-100 dark:bg-purple-900/30', 'bg-purple-200 dark:bg-purple-700/40', 'bg-purple-400', 'bg-purple-600'];
                      const texts = ['', 'text-purple-700 dark:text-purple-300', 'text-purple-800 dark:text-purple-200', 'text-white', 'text-white'];
                      return (
                        <td key={i} className="py-0.5 px-0.5">
                          <div
                            className={`mx-auto w-6 h-6 md:w-7 md:h-7 rounded flex items-center justify-center font-bold transition-all cursor-default ${fills[lvl]} ${texts[lvl]}`}
                            title={`${MONTHS_AR[i]}: ${val} قطعة`}
                          >
                            {val > 0 ? val : ''}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-[10px] text-gray-400 mt-3 text-center">🟣 اللون الأغمق = طلب أعلى في ذلك الشهر. مرر الفأرة على الخلية لرؤية العدد.</p>
        </div>
      </Section>

      {/* ══ Category + Clients ══ */}
      <div className="grid md:grid-cols-2 gap-5">

        <Section title="المبيعات حسب العائلة" icon={<BarChart2 size={15}/>} color="#0369a1">
          <div className="space-y-3">
            {catStats.map(([cat, d]) => (
              <div key={cat}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{cat}</span>
                  <span className="text-gray-400">{formatCurrency(d.revenue)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bar value={d.revenue} max={maxCatRev} color="#0369a1"/>
                  <span className="text-[10px] text-gray-400 w-14 text-left flex-shrink-0">{d.pieces.toLocaleString()} قطعة</span>
                </div>
              </div>
            ))}
            {catStats.length === 0 && <p className="text-center text-gray-400 text-sm py-4">لا توجد بيانات</p>}
          </div>
        </Section>

        <Section title="أكثر الزبائن طلباً" icon={<Star size={15}/>} color="#b45309">
          <div className="space-y-2.5">
            {topClients.map((c, i) => (
              <div key={c.name} className="flex items-center gap-2.5">
                <Rank i={i}/>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex-1 truncate">{c.name}</span>
                <Bar value={c.orders} max={maxClientOrd} color="#b45309"/>
                <div className="text-left w-20 flex-shrink-0">
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400">{c.orders} طلب</div>
                  <div className="text-[10px] text-gray-400">{formatCurrency(c.revenue)}</div>
                </div>
              </div>
            ))}
            {topClients.length === 0 && <p className="text-center text-gray-400 text-sm py-4">لا توجد بيانات</p>}
          </div>
        </Section>
      </div>

      {/* ══ Recent Orders Table ══ */}
      <Section title="آخر الطلبيات" icon={<Clock size={15}/>} color="#4f46e5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="text-[11px] text-gray-500 dark:text-gray-400 font-bold border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="pb-2 font-bold">الرقم</th>
                <th className="pb-2 font-bold">الزبون</th>
                <th className="pb-2 font-bold">التاريخ</th>
                <th className="pb-2 font-bold text-center">المنتجات</th>
                <th className="pb-2 font-bold">المبلغ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {orders.slice(0, 10).map(o => (
                <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                  <td className="py-2.5 font-mono font-bold text-gray-600 dark:text-gray-400 text-xs">{o.id}</td>
                  <td className="py-2.5 text-gray-700 dark:text-gray-300 font-medium">{o.customerName}</td>
                  <td className="py-2.5 text-gray-400 text-xs">{new Date(o.date).toLocaleDateString('fr-FR')}</td>
                  <td className="py-2.5 text-center">
                    <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{o.items.length}</span>
                  </td>
                  <td className="py-2.5 font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap">{formatCurrency(o.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ══ Catalog Health ══ */}
      <Section title="صحة الكتالوج" icon={<Package size={15}/>} color="#059669">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'إجمالي',    v: catalog.total,   bg: 'bg-gray-100 dark:bg-gray-700',          t: 'text-gray-800 dark:text-gray-100' },
            { label: 'نشط',       v: catalog.active,  bg: 'bg-green-50 dark:bg-green-900/20',       t: 'text-green-700 dark:text-green-400' },
            { label: 'تخفيض',    v: catalog.disc,    bg: 'bg-red-50 dark:bg-red-900/20',           t: 'text-red-600 dark:text-red-400' },
            { label: 'نفد',       v: catalog.oos,     bg: 'bg-orange-50 dark:bg-orange-900/20',     t: 'text-orange-600 dark:text-orange-400' },
            { label: 'مخفي',     v: catalog.hidden,  bg: 'bg-gray-50 dark:bg-gray-700/50',         t: 'text-gray-400' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className={`text-2xl font-black ${s.t}`}>{s.v}</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 font-semibold">{s.label}</div>
            </div>
          ))}
        </div>
      </Section>

    </div>
  );
};
