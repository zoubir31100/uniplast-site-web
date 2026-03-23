
import React, { useState, useRef, useMemo, useLayoutEffect } from 'react';
import { Product, AppConfig } from '../types';
import { X, Save, Upload, Trash2, Plus, Settings, Folder, LayoutGrid, Edit3, Key, LogOut, Download, FileJson, RefreshCw, AlertTriangle, Image as ImageIcon, Pin, ArrowUp, ArrowDown, Eye, Camera, ZoomIn, MoveHorizontal, MoveVertical, Crosshair, ArrowUpDown, Filter, EyeOff, AlertCircle, BarChart2, CheckCircle } from 'lucide-react';
import { compressImage } from '../utils/imageOptimizer';
import { clearAllData, getStoredOrders, formatCurrency, getStoredPin } from '../utils/storage';
import { Order } from '../types';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  onLogin: (pin: string) => boolean;
  onLogout: () => void;
  products: Product[];
  onUpdateProduct: (product: Product) => void;
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  allCategories: string[];
  onRenameCategory: (oldName: string, newName: string) => void;
  onAddCategory: (name: string) => void;
  onDeleteCategory: (name: string) => void;
  onChangePin: (newPin: string) => void;
  appConfig: AppConfig;
  onUpdateConfig: (config: AppConfig) => void;
}

type AdminTab = 'PRODUCTS' | 'CATEGORIES' | 'APPEARANCE' | 'SETTINGS' | 'EXPORT' | 'STATS';
type SortKey = 'name' | 'price' | 'category' | 'code' | null;
type SortDirection = 'asc' | 'desc';

// ─── StatsContent: الإحصائيات داخل لوحة الإدارة ─────────────
const MONTHS_AR = ['جانفي','فيفري','مارس','أفريل','ماي','جوان','جويلية','أوت','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

const MiniBar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => (
  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${max > 0 ? Math.max((value / max) * 100, value > 0 ? 3 : 0) : 0}%`, background: color }} />
  </div>
);

const RankBadge: React.FC<{ i: number }> = ({ i }) => (
  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${i===0?'bg-yellow-400 text-yellow-900':i===1?'bg-gray-300 text-gray-700':i===2?'bg-orange-300 text-orange-900':'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>{i+1}</div>
);

const StatsContent: React.FC<{ products: Product[] }> = ({ products }) => {
  const [orders] = React.useState<Order[]>(() => getStoredOrders());
  const [selectedMonth, setSelectedMonth] = React.useState<number | null>(null);
  const [topTab, setTopTab] = React.useState<'pieces'|'revenue'>('pieces');

  const totalRevenue  = orders.reduce((s,o)=>s+o.totalAmount,0);
  const totalOrders   = orders.length;
  const totalPieces   = orders.reduce((s,o)=>s+o.items.reduce((ss,i)=>ss+i.totalPieces,0),0);
  const totalCartons  = orders.reduce((s,o)=>s+o.items.reduce((ss,i)=>ss+i.quantityCartons,0),0);
  const avgOrder      = totalOrders>0?totalRevenue/totalOrders:0;
  const uniqueClients = new Set(orders.map(o=>o.customerName.trim().toLowerCase())).size;

  interface PS { name:string; code:string; category:string; pieces:number; cartons:number; revenue:number; orderCount:number; monthly:Record<number,number>; }
  const prodMap = React.useMemo<Record<string,PS>>(()=>{
    const m:Record<string,PS>={};
    orders.forEach(o=>{
      const month=new Date(o.date).getMonth();
      o.items.forEach(item=>{
        if(!m[item.id]) m[item.id]={name:item.name,code:item.code,category:item.category,pieces:0,cartons:0,revenue:0,orderCount:0,monthly:{}};
        m[item.id].pieces+=item.totalPieces; m[item.id].cartons+=item.quantityCartons;
        m[item.id].revenue+=item.totalPrice; m[item.id].orderCount++;
        m[item.id].monthly[month]=(m[item.id].monthly[month]||0)+item.totalPieces;
      });
    });
    return m;
  },[orders]);

  const byPieces  = React.useMemo(()=>Object.values(prodMap).sort((a,b)=>b.pieces-a.pieces),[prodMap]);
  const byRevenue = React.useMemo(()=>Object.values(prodMap).sort((a,b)=>b.revenue-a.revenue),[prodMap]);
  const topList   = topTab==='pieces'?byPieces:byRevenue;
  const topMax    = topTab==='pieces'?(byPieces[0]?.pieces||1):(byRevenue[0]?.revenue||1);
  const topColor  = topTab==='pieces'?'#16a34a':'#d97706';

  const monthlyRev = React.useMemo(()=>{const a=Array(12).fill(0);orders.forEach(o=>{a[new Date(o.date).getMonth()]+=o.totalAmount;});return a;},[orders]);
  const monthlyOrd = React.useMemo(()=>{const a=Array(12).fill(0);orders.forEach(o=>{a[new Date(o.date).getMonth()]++;});return a;},[orders]);
  const maxMonthRev = Math.max(...monthlyRev,1);

  const monthTop = React.useMemo(()=>{
    if(selectedMonth===null) return [];
    const m:Record<string,{name:string;code:string;pieces:number}>={};
    orders.filter(o=>new Date(o.date).getMonth()===selectedMonth).forEach(o=>o.items.forEach(item=>{
      if(!m[item.id]) m[item.id]={name:item.name,code:item.code,pieces:0};
      m[item.id].pieces+=item.totalPieces;
    }));
    return Object.values(m).sort((a,b)=>b.pieces-a.pieces).slice(0,8);
  },[orders,selectedMonth]);
  const monthTopMax=monthTop[0]?.pieces||1;

  const catStats=React.useMemo(()=>{
    const m:Record<string,{revenue:number;pieces:number}>={};
    orders.forEach(o=>o.items.forEach(i=>{const c=i.category||'أخرى';if(!m[c])m[c]={revenue:0,pieces:0};m[c].revenue+=i.totalPrice;m[c].pieces+=i.totalPieces;}));
    return Object.entries(m).sort((a,b)=>b[1].revenue-a[1].revenue);
  },[orders]);
  const maxCatRev=catStats[0]?.[1].revenue||1;

  const topClients=React.useMemo(()=>{
    const m:Record<string,{name:string;orders:number;revenue:number}>={};
    orders.forEach(o=>{const k=o.customerName.trim().toLowerCase();if(!m[k])m[k]={name:o.customerName,orders:0,revenue:0};m[k].orders++;m[k].revenue+=o.totalAmount;});
    return Object.values(m).sort((a,b)=>b.orders-a.orders).slice(0,8);
  },[orders]);
  const maxClientOrd=topClients[0]?.orders||1;

  const catalog={
    total:products.length,active:products.filter(p=>!p.isHidden&&!p.isOutOfStock).length,
    disc:products.filter(p=>p.discountPrice&&p.discountEndDate&&new Date(p.discountEndDate)>new Date()).length,
    oos:products.filter(p=>p.isOutOfStock).length,hidden:products.filter(p=>p.isHidden).length,
  };

  if(orders.length===0) return (
    <div className="flex flex-col items-center justify-center py-24 text-gray-400">
      <BarChart2 size={56} className="mb-4 opacity-20"/>
      <p className="text-lg font-bold text-gray-500">لا توجد بيانات بعد</p>
      <p className="text-sm mt-1">أكمل بعض الطلبيات وستظهر الإحصائيات هنا</p>
    </div>
  );

  const Sec=({title,icon,color,children}:{title:string;icon:React.ReactNode;color:string;children:React.ReactNode})=>(
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden mb-5">
      <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2" style={{color}}>
        {icon}<span className="font-bold text-gray-800 dark:text-gray-100 text-sm">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {[
          {label:'إجمالي المبيعات',value:formatCurrency(totalRevenue),bg:'#dbeafe',color:'#1e3a8a'},
          {label:'عدد الطلبيات',value:totalOrders,bg:'#dcfce7',color:'#15803d'},
          {label:'زبائن مختلفون',value:uniqueClients,bg:'#fef3c7',color:'#b45309'},
          {label:'إجمالي القطع',value:totalPieces.toLocaleString(),bg:'#fce7f3',color:'#9d174d'},
          {label:'إجمالي الكراتين',value:totalCartons.toLocaleString(),bg:'#ede9fe',color:'#6d28d9'},
          {label:'متوسط الطلبية',value:formatCurrency(avgOrder),bg:'#e0f2fe',color:'#0369a1'},
        ].map(k=>(
          <div key={k.label} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{background:k.bg}}><BarChart2 size={16} style={{color:k.color}}/></div>
            <div className="text-[11px] text-gray-500 font-semibold mb-0.5">{k.label}</div>
            <div className="text-lg font-black text-gray-900 dark:text-white leading-tight">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Monthly Chart */}
      <Sec title="المبيعات الشهرية — انقر على شهر لعرض أكثر منتجاته طلباً" icon={<Pin size={14}/>} color="#2563eb">
        <>
          <div className="flex items-end gap-1 h-32 mb-1">
            {monthlyRev.map((rev,i)=>{
              const pct=maxMonthRev>0?Math.max((rev/maxMonthRev)*100,rev>0?5:0):0;
              const sel=selectedMonth===i;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 cursor-pointer" onClick={()=>setSelectedMonth(sel?null:i)}>
                  <div className="w-full rounded-t-md transition-all duration-300" style={{height:`${pct}%`,minHeight:rev>0?'6px':'0',background:sel?'#1e3a8a':rev>0?'#3b82f6':'#e5e7eb',opacity:selectedMonth!==null&&!sel?0.4:1}} title={`${MONTHS_AR[i]}: ${formatCurrency(rev)}`}/>
                  <span className={`text-[9px] font-bold ${sel?'text-blue-700 dark:text-blue-400':'text-gray-400'}`}>{MONTHS_AR[i].slice(0,3)}</span>
                </div>
              );
            })}
          </div>
          {selectedMonth!==null&&(
            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
              <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                <h4 className="font-bold text-blue-800 dark:text-blue-300 text-sm">{MONTHS_AR[selectedMonth]} — أكثر المنتجات طلباً</h4>
                <span className="text-xs text-blue-600 font-bold bg-blue-100 dark:bg-blue-800 px-2 py-0.5 rounded-full">{monthlyOrd[selectedMonth]} طلبية | {formatCurrency(monthlyRev[selectedMonth])}</span>
              </div>
              {monthTop.length===0?<p className="text-sm text-blue-400 text-center py-2">لا توجد طلبيات هذا الشهر</p>:
                <div className="space-y-2">{monthTop.map((p,i)=>(
                  <div key={p.code} className="flex items-center gap-2.5"><RankBadge i={i}/>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex-1 line-clamp-1">{p.name}</span>
                    <MiniBar value={p.pieces} max={monthTopMax} color="#3b82f6"/>
                    <span className="text-xs font-bold text-blue-600 w-16 text-left flex-shrink-0">{p.pieces} قطعة</span>
                  </div>
                ))}</div>
              }
            </div>
          )}
        </>
      </Sec>

      {/* Top Products */}
      <Sec title="المنتجات الأكثر طلباً" icon={<ArrowUp size={14}/>} color={topColor}>
        <>
          <div className="flex gap-2 mb-4 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl w-fit">
            {(['pieces','revenue'] as const).map(k=>(
              <button key={k} onClick={()=>setTopTab(k)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${topTab===k?'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white':'text-gray-500'}`}>
                {k==='pieces'?'بالقطع':'بالقيمة'}
              </button>
            ))}
          </div>
          <div className="space-y-2.5">
            {topList.slice(0,10).map((p,i)=>(
              <div key={p.code} className="flex items-center gap-2.5"><RankBadge i={i}/>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 line-clamp-1">{p.name}</div>
                  <div className="text-[10px] text-gray-400 font-mono">{p.code} · {p.category}</div>
                </div>
                <MiniBar value={topTab==='pieces'?p.pieces:p.revenue} max={topMax} color={topColor}/>
                <div className="text-left w-24 flex-shrink-0">
                  {topTab==='pieces'
                    ?<><div className="text-sm font-bold text-green-600">{p.pieces.toLocaleString()} قطعة</div><div className="text-[10px] text-gray-400">{p.cartons} كرتون</div></>
                    :<><div className="text-sm font-bold text-amber-600">{formatCurrency(p.revenue)}</div><div className="text-[10px] text-gray-400">{p.pieces.toLocaleString()} قطعة</div></>
                  }
                </div>
              </div>
            ))}
          </div>
        </>
      </Sec>

      {/* Seasonal Heatmap */}
      <Sec title="الموسمية — كثافة الطلب لكل منتج حسب الشهر" icon={<Eye size={14}/>} color="#7c3aed">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] md:text-xs">
            <thead><tr>
              <th className="text-right py-2 pr-2 text-gray-400 font-bold w-28">المنتج</th>
              {MONTHS_AR.map(m=><th key={m} className="text-center py-2 px-0.5 text-gray-400 font-bold">{m.slice(0,3)}</th>)}
            </tr></thead>
            <tbody>
              {byPieces.slice(0,8).map(p=>{
                const maxM=Math.max(...Object.values(p.monthly),1);
                return (
                  <tr key={p.code} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="py-1.5 pr-2 font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[112px]" title={p.name}>{p.name.length>14?p.name.slice(0,13)+'…':p.name}</td>
                    {Array.from({length:12},(_,i)=>{
                      const val=p.monthly[i]||0;
                      const lvl=val>0?Math.ceil((val/maxM)*4):0;
                      const fills=['','bg-purple-100 dark:bg-purple-900/30','bg-purple-200 dark:bg-purple-700/40','bg-purple-400','bg-purple-600'];
                      const texts=['','text-purple-700 dark:text-purple-300','text-purple-800','text-white','text-white'];
                      return <td key={i} className="py-0.5 px-0.5"><div className={`mx-auto w-6 h-6 rounded flex items-center justify-center font-bold ${fills[lvl]} ${texts[lvl]}`} title={`${MONTHS_AR[i]}: ${val} قطعة`}>{val>0?val:''}</div></td>;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-[10px] text-gray-400 mt-2 text-center">اللون الأغمق = طلب أعلى. مرر الفأرة على الخلية لرؤية العدد.</p>
        </div>
      </Sec>

      {/* Category + Clients */}
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <Sec title="المبيعات حسب العائلة" icon={<Folder size={14}/>} color="#0369a1">
          <div className="space-y-3">
            {catStats.map(([cat,d])=>(
              <div key={cat}>
                <div className="flex justify-between text-xs mb-1"><span className="font-semibold text-gray-700 dark:text-gray-300">{cat}</span><span className="text-gray-400">{formatCurrency(d.revenue)}</span></div>
                <div className="flex items-center gap-2"><MiniBar value={d.revenue} max={maxCatRev} color="#0369a1"/><span className="text-[10px] text-gray-400 w-14 text-left flex-shrink-0">{d.pieces.toLocaleString()} قطعة</span></div>
              </div>
            ))}
          </div>
        </Sec>
        <Sec title="أكثر الزبائن طلباً" icon={<LogOut size={14}/>} color="#b45309">
          <div className="space-y-2.5">
            {topClients.map((c,i)=>(
              <div key={c.name} className="flex items-center gap-2.5"><RankBadge i={i}/>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex-1 truncate">{c.name}</span>
                <MiniBar value={c.orders} max={maxClientOrd} color="#b45309"/>
                <div className="text-left w-20 flex-shrink-0"><div className="text-xs font-bold text-amber-600">{c.orders} طلب</div><div className="text-[10px] text-gray-400">{formatCurrency(c.revenue)}</div></div>
              </div>
            ))}
          </div>
        </Sec>
      </div>

      {/* Catalog Health */}
      <Sec title="صحة الكتالوج" icon={<LayoutGrid size={14}/>} color="#059669">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            {label:'إجمالي',v:catalog.total,bg:'bg-gray-100 dark:bg-gray-700',t:'text-gray-800 dark:text-gray-100'},
            {label:'نشط',v:catalog.active,bg:'bg-green-50 dark:bg-green-900/20',t:'text-green-700 dark:text-green-400'},
            {label:'تخفيض',v:catalog.disc,bg:'bg-red-50 dark:bg-red-900/20',t:'text-red-600 dark:text-red-400'},
            {label:'نفد',v:catalog.oos,bg:'bg-orange-50 dark:bg-orange-900/20',t:'text-orange-600 dark:text-orange-400'},
            {label:'مخفي',v:catalog.hidden,bg:'bg-gray-50 dark:bg-gray-700/50',t:'text-gray-400'},
          ].map(s=>(
            <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className={`text-2xl font-black ${s.t}`}>{s.v}</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 font-semibold">{s.label}</div>
            </div>
          ))}
        </div>
      </Sec>
    </div>
  );
};


export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen, onClose, isAuthenticated, onLogin, onLogout, products, onUpdateProduct, onAddProduct, onDeleteProduct, 
  allCategories, onRenameCategory, onAddCategory, onDeleteCategory, onChangePin,
  appConfig, onUpdateConfig
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('PRODUCTS');
  
  // Scroll Management Refs
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const savedScrollPosition = useRef<number>(0);
  const shouldRestoreScroll = useRef<boolean>(false);

  // Product List State (Sorting & Filtering)
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<string>('ALL');
  const [fileHandle, setFileHandle] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [sortConfig, setSortConfig] = useState<{key: SortKey, direction: SortDirection}>({ key: null, direction: 'asc' });

  // Product Edit State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Category Edit State
  const [newCatName, setNewCatName] = useState('');
  const [editingCat, setEditingCat] = useState<{old: string, new: string} | null>(null);

  // Settings State
  const [newPinInput, setNewPinInput] = useState('');

  // Appearance State
  const logoInputRef = useRef<HTMLInputElement>(null);
  const globalBannerRef = useRef<HTMLInputElement>(null);
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
  const categoryBannerInputRef = useRef<HTMLInputElement>(null);

  // --- CRITICAL SAFETY CHECK (حماية من الشاشة البيضاء) ---
  const safeProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.filter(p => p && typeof p === 'object' && p.id); 
  }, [products]);

  // --- Scroll Restoration Logic ---
  // This runs immediately after the DOM updates (e.g., after the modal closes and the table reappears)
  useLayoutEffect(() => {
    if (!editingProduct && shouldRestoreScroll.current && mainContainerRef.current) {
      mainContainerRef.current.scrollTop = savedScrollPosition.current;
      shouldRestoreScroll.current = false;
    }
  }, [editingProduct]); 

  // Helper to open modal and SAVE current position
  const openEditModal = (product: Product) => {
    if (mainContainerRef.current) {
      savedScrollPosition.current = mainContainerRef.current.scrollTop;
      shouldRestoreScroll.current = true;
    }
    setEditingProduct(product);
  };

  // Helper to close modal (scroll is restored by effect)
  const closeEditModal = () => {
    setEditingProduct(null);
  };

  // --- Sorting & Filtering Logic ---
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...safeProducts];

    // 1. Filter by Category
    if (adminCategoryFilter !== 'ALL') {
      result = result.filter(p => p.category === adminCategoryFilter);
    }

    // 2. Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        let valA: string | number = '';
        let valB: string | number = '';

        switch (sortConfig.key) {
          case 'name':
            valA = a.name.toLowerCase();
            valB = b.name.toLowerCase();
            break;
          case 'price':
            valA = a.price;
            valB = b.price;
            break;
          case 'code':
            valA = a.code.toLowerCase();
            valB = b.code.toLowerCase();
            break;
          case 'category':
            valA = a.category.toLowerCase();
            valB = b.category.toLowerCase();
            break;
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [safeProducts, adminCategoryFilter, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig(current => {
      if (current.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={14} className="opacity-30" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-primary-600" /> : <ArrowDown size={14} className="text-primary-600" />;
  };

  if (!isOpen) return null;

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-sm animate-fade-in-up">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-bold">دخول المشرف (Admin)</h2>
            <button onClick={onClose}><X /></button>
          </div>
          <input
            type="password"
            className="w-full p-3 border rounded-lg mb-4 text-center text-2xl tracking-widest outline-none focus:ring-2 focus:ring-primary-500 bg-white text-black"
            placeholder="****"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            className="w-full bg-primary-600 text-white p-3 rounded-lg font-bold hover:bg-primary-700 transition"
            onClick={() => {
              if (onLogin(pin)) {
                setError('');
                setPin('');
              } else {
                setError('رمز خاطئ');
                setPin('');
              }
            }}
          >
            دخول
          </button>
        </div>
      </div>
    );
  }

  // --- Handlers ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingProduct) {
      try {
        const compressedBase64 = await compressImage(file);
        setEditingProduct({ ...editingProduct, image: compressedBase64 });
      } catch (err) {
        console.error("Compression failed", err);
        alert("فشل رفع الصورة");
      }
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        onUpdateConfig({ ...appConfig, logo: compressedBase64 }); setHasUnsaved(true);
      } catch (err) {
        console.error("Compression failed", err);
      }
    }
  };

  const handleGlobalBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        onUpdateConfig({ ...appConfig, globalBanner: compressedBase64 }); setHasUnsaved(true);
      } catch (err) {
        console.error("Compression failed", err);
      }
    }
  };

  const handleCategoryBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingCategory) {
      try {
        const compressedBase64 = await compressImage(file);
        onUpdateConfig({ 
          ...appConfig, 
          categoryBanners: {
            ...appConfig.categoryBanners,
            [uploadingCategory]: compressedBase64
          }
        });
        setUploadingCategory(null);
      } catch (err) {
        console.error("Compression failed", err);
      }
    }
  };

  const handleDeleteGlobalBanner = () => {
    onUpdateConfig({ ...appConfig, globalBanner: null }); setHasUnsaved(true);
  };

  const handleDeleteCategoryBanner = (category: string) => {
    const newCatBanners = { ...appConfig.categoryBanners };
    delete newCatBanners[category];
    onUpdateConfig({ ...appConfig, categoryBanners: newCatBanners }); setHasUnsaved(true);
  };

  const updateBannerPosition = (key: string, value: number) => {
    onUpdateConfig({
      ...appConfig,
      bannerPositions: {
        ...appConfig.bannerPositions,
        [key]: value
      }
    });
  };

  // --- Export Data ---
  const handleExportData = () => {
    const configString = JSON.stringify(
      {
        logo: appConfig.logo || null,
        globalBanner: appConfig.globalBanner,
        categoryBanners: appConfig.categoryBanners,
        stickyBanner: appConfig.stickyBanner,
        bannerPositions: appConfig.bannerPositions,
        hidePrice: appConfig.hidePrice ?? false,
        priceLabel: appConfig.priceLabel ?? 'اتصل للسعر',
      }, 
      null, 
      2
    );

    const fileContent = `import { Product, AppConfig } from './types';

export const INITIAL_PRODUCTS: Product[] = ${JSON.stringify(safeProducts, null, 2)};

export const INITIAL_CATEGORIES: string[] = ${JSON.stringify(allCategories, null, 2)};

export const INITIAL_CONFIG: AppConfig = ${configString};

export const COMPANY_INFO = {
  name: "UNIPLAST",
  location: "Lot n°34, Zone Industrielle Nedjma (Ex: Chteibo, Sidi Chami 31120)",
  phone: "0770 26 04 04",
  commercialService: "0770 07 88 02",
  description: "تأسست شركة أونيبلاست سنة 1998...",
  mapsLink: "https://maps.app.goo.gl/cu8qeGGXamCzXV268",
  email: "contact@uniplast-oran.dz"
};

export const ADMIN_PIN = "${getStoredPin()}";
`;

    try {
      // تحقق من حجم الملف
      const sizeKB = Math.round(new Blob([fileContent]).size / 1024);
      console.log(`constants.ts size: ${sizeKB} KB`);

      const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'constants.ts');
      link.style.display = 'none';
      document.body.appendChild(link);

      // setTimeout يضمن عمل التنزيل حتى مع الملفات الكبيرة
      setTimeout(() => {
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 1000);
      }, 100);

      setHasUnsaved(false);
      alert(`✅ جاري تحميل constants.ts (${sizeKB} KB)`);
    } catch (err) {
      console.error('Export error:', err);
      alert('حدث خطأ أثناء التحميل. حاول مرة أخرى.');
    }
  };

  // --- تنزيل constants.ts ---
  const handleDirectSave = () => {
    handleExportData();
  };

  const buildFileContent = () => {
    const configString = JSON.stringify({
      logo: appConfig.logo || null,
      globalBanner: appConfig.globalBanner,
      categoryBanners: appConfig.categoryBanners,
      stickyBanner: appConfig.stickyBanner,
      bannerPositions: appConfig.bannerPositions,
      hidePrice: appConfig.hidePrice ?? false,
      priceLabel: appConfig.priceLabel ?? 'اتصل للسعر',
    }, null, 2);

    return `import { Product, AppConfig } from './types';

export const INITIAL_PRODUCTS: Product[] = ${JSON.stringify(safeProducts, null, 2)};

export const INITIAL_CATEGORIES: string[] = ${JSON.stringify(allCategories, null, 2)};

export const INITIAL_CONFIG: AppConfig = ${configString};

export const COMPANY_INFO = {
  name: "UNIPLAST",
  location: "Lot n°34, Zone Industrielle Nedjma (Ex: Chteibo, Sidi Chami 31120)",
  phone: "0770 26 04 04",
  commercialService: "0770 07 88 02",
  description: "تأسست شركة أونيبلاست سنة 1998...",
  mapsLink: "https://maps.app.goo.gl/cu8qeGGXamCzXV268",
  email: "contact@uniplast-oran.dz"
};

export const ADMIN_PIN = "${getStoredPin()}";
`;
  };

  // --- Product Management ---
  const handleSaveProduct = () => {
    if (editingProduct) {
      if (products.find(p => p.id === editingProduct.id)) {
        onUpdateProduct(editingProduct);
      } else {
        onAddProduct(editingProduct);
      }
      closeEditModal();
    }
  };

  const createNewProduct = () => {
    // Also save scroll position when adding new, just in case
    if (mainContainerRef.current) {
      savedScrollPosition.current = mainContainerRef.current.scrollTop;
      shouldRestoreScroll.current = true;
    }
    setEditingProduct({
      id: Date.now().toString(),
      code: '',
      name: '',
      colisage: 1,
      price: 0,
      capacity: '',
      dimensions: '',
      category: allCategories[0] || 'علب',
      image: '',
      imageScale: 1,
      imagePositionX: 50,
      imagePositionY: 50,
      isHidden: false,
      isOutOfStock: false
    });
  };

  const handleFactoryReset = () => {
    if (window.confirm("هل أنت متأكد؟ سيتم مسح بيانات المتصفح وإعادة تحميل الصفحة.")) {
      clearAllData();
    }
  };

  return (
    <div 
      ref={mainContainerRef}
      className="fixed inset-0 z-50 bg-white dark:bg-gray-900 overflow-y-auto"
    >
      <div className="container mx-auto px-4 py-6">
        
        {/* Top Header */}
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-gray-900 z-20 py-2 border-b dark:border-gray-700">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutGrid className="text-primary-600" /> لوحة التحكم
          </h1>
          <div className="flex items-center gap-2">
             <button 
               onClick={onLogout}
               className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition"
             >
                <LogOut size={18} /> خروج
             </button>
             <button onClick={onClose} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 transition"><X /></button>
          </div>
        </div>

        {/* Editing Modal Overlay */}
        {editingProduct ? (
          <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 animate-fade-in-up">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="text-xl font-bold">{products.find(p => p.id === editingProduct.id) ? 'تعديل منتج' : 'منتج جديد'}</h3>
                <button onClick={closeEditModal}><X size={24}/></button>
              </div>
              
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Form Fields */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">اسم المنتج</label>
                    <input className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 transition bg-white text-black border-gray-300" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">الكود (Réf)</label>
                    <input className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 transition bg-white text-black border-gray-300" value={editingProduct.code} onChange={e => setEditingProduct({...editingProduct, code: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      🔲 الباركود (Barcode)
                    </label>
                    <input 
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 transition bg-white text-black border-gray-300 font-mono tracking-wider" 
                      value={editingProduct.barcode || ''} 
                      onChange={e => setEditingProduct({...editingProduct, barcode: e.target.value})}
                      placeholder="مثال: 6134338000013"
                      dir="ltr"
                    />
                    <p className="text-xs text-gray-400 mt-1">يُستخدم للبحث بالكاميرا — اتركه فارغاً إن لم يكن للمنتج باركود</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">السعر (DZD)</label>
                    <input type="number" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 transition bg-white text-black border-gray-300" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">الكوليساج</label>
                    <input type="number" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 transition bg-white text-black border-gray-300" value={editingProduct.colisage} onChange={e => setEditingProduct({...editingProduct, colisage: parseInt(e.target.value) || 1})} />
                  </div>
                  <div>
                     <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">العائلة (Category)</label>
                     <select className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 transition bg-white text-black border-gray-300" value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}>
                       {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                     </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">الأبعاد</label>
                    <input className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 transition bg-white text-black border-gray-300" value={editingProduct.dimensions} onChange={e => setEditingProduct({...editingProduct, dimensions: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">الحجم (Capacity)</label>
                    <input className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 transition bg-white text-black border-gray-300" value={editingProduct.capacity} onChange={e => setEditingProduct({...editingProduct, capacity: e.target.value})} />
                  </div>

                  {/* Discount Fields */}
                  <div className="col-span-2 bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
                    <h4 className="font-bold text-green-800 dark:text-green-400 mb-3 flex items-center gap-2">
                      <span className="text-lg">🏷️</span> إعدادات التخفيض (اختياري)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">سعر التخفيض (DZD)</label>
                        <input 
                          type="number" 
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 transition bg-white text-black border-gray-300" 
                          value={editingProduct.discountPrice || ''} 
                          onChange={e => setEditingProduct({...editingProduct, discountPrice: e.target.value ? parseFloat(e.target.value) : undefined})} 
                          placeholder="اتركه فارغاً لإلغاء التخفيض"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">تاريخ انتهاء التخفيض</label>
                        <input 
                          type="datetime-local" 
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 transition bg-white text-black border-gray-300" 
                          value={editingProduct.discountEndDate ? new Date(new Date(editingProduct.discountEndDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} 
                          onChange={e => setEditingProduct({...editingProduct, discountEndDate: e.target.value ? new Date(e.target.value).toISOString() : undefined})} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Availability Toggles */}
                  <div className="col-span-2 bg-gray-50 dark:bg-gray-700 p-4 rounded-xl space-y-3">
                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${editingProduct.isHidden ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-500'}`}>
                          <EyeOff size={20} />
                        </div>
                        <div>
                          <span className="block font-bold">إخفاء المنتج</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">لن يظهر للزبائن في القائمة، لكنه سيبقى في لوحة التحكم.</span>
                        </div>
                      </div>
                      <input type="checkbox" className="w-6 h-6 accent-red-600" checked={!!editingProduct.isHidden} onChange={e => setEditingProduct({...editingProduct, isHidden: e.target.checked})} />
                    </label>

                    <div className="h-px bg-gray-200 dark:bg-gray-600" />

                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${editingProduct.isOutOfStock ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'}`}>
                          <AlertCircle size={20} />
                        </div>
                        <div>
                          <span className="block font-bold">غير متوفر حالياً</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">سيظهر للزبائن مع إطار برتقالي ولكن لا يمكن إضافته للسلة.</span>
                        </div>
                      </div>
                      <input type="checkbox" className="w-6 h-6 accent-orange-600" checked={!!editingProduct.isOutOfStock} onChange={e => setEditingProduct({...editingProduct, isOutOfStock: e.target.checked})} />
                    </label>
                  </div>
                </div>

                <div className="w-full lg:w-1/3 flex flex-col gap-4">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">صورة المنتج</label>
                  <label className="relative block w-full aspect-square bg-white border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-gray-50 transition overflow-hidden group">
                    {editingProduct.image ? (
                      <div className="w-full h-full relative overflow-hidden bg-white">
                        {/* Overlay Guide Lines (The Crosshair) - Visible Only in Admin */}
                        <div className="absolute inset-0 pointer-events-none z-10 opacity-70">
                           {/* Vertical Center Line */}
                           <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-red-500/50 -translate-x-1/2 border-r border-dotted border-white"></div>
                           {/* Horizontal Center Line */}
                           <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500/50 -translate-y-1/2 border-b border-dotted border-white"></div>
                           {/* Center Dot */}
                           <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-red-600 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-sm ring-1 ring-white"></div>
                        </div>

                        <img 
                          src={editingProduct.image} 
                          alt="Preview" 
                          className="w-full h-full object-contain transition-transform duration-100" 
                          style={{ 
                            transform: `translate(${editingProduct.imagePositionX ? editingProduct.imagePositionX - 50 : 0}%, ${editingProduct.imagePositionY ? editingProduct.imagePositionY - 50 : 0}%) scale(${editingProduct.imageScale || 1})`,
                            // We use transform translate instead of object-position to force movement regardless of container bounds
                            objectPosition: 'center' 
                          }} 
                        />
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                           <Camera className="text-white mb-2" size={32} />
                           <span className="text-white font-bold text-sm">تغيير الصورة</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <Upload size={32} className="mb-2" />
                        <span className="text-sm">اضغط لرفع صورة</span>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>

                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl space-y-4">
                    <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                      <Crosshair size={12} className="text-red-500" />
                      استخدم الخطوط الحمراء لضبط المنتصف
                    </p>

                    {/* Zoom Slider */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-bold flex items-center gap-1"><ZoomIn size={14}/> تكبير (Zoom)</span>
                        <span className="text-[10px] font-mono bg-white px-2 rounded text-black">x{editingProduct.imageScale || 1}</span>
                      </div>
                      <input type="range" min="0.5" max="2.0" step="0.1" value={editingProduct.imageScale || 1} onChange={(e) => setEditingProduct({...editingProduct, imageScale: parseFloat(e.target.value)})} className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-primary-600" />
                    </div>

                    {/* Horizontal Position Slider */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-bold flex items-center gap-1"><MoveHorizontal size={14}/> تحريك أفقي (يسار/يمين)</span>
                        <span className="text-[10px] font-mono bg-white px-2 rounded text-black">{editingProduct.imagePositionX ?? 50}%</span>
                      </div>
                      <input type="range" min="0" max="100" step="1" value={editingProduct.imagePositionX ?? 50} onChange={(e) => setEditingProduct({...editingProduct, imagePositionX: parseInt(e.target.value)})} className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    </div>

                    {/* Vertical Position Slider */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-bold flex items-center gap-1"><MoveVertical size={14}/> تحريك عمودي (فوق/تحت)</span>
                        <span className="text-[10px] font-mono bg-white px-2 rounded text-black">{editingProduct.imagePositionY ?? 50}%</span>
                      </div>
                      <input type="range" min="0" max="100" step="1" value={editingProduct.imagePositionY ?? 50} onChange={(e) => setEditingProduct({...editingProduct, imagePositionY: parseInt(e.target.value)})} className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8 pt-4 border-t">
                <button onClick={closeEditModal} className="flex-1 p-3 border rounded-lg text-gray-500 hover:bg-gray-100 transition">إلغاء</button>
                <button onClick={handleSaveProduct} className="flex-1 p-3 bg-primary-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-primary-700 transition shadow-lg">
                  <Save size={18} /> حفظ
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Main Admin Content */
          <>
            {/* Tabs Navigation */}
            <div className="flex gap-2 mb-6 border-b dark:border-gray-700 overflow-x-auto pb-1">
              <button onClick={() => setActiveTab('PRODUCTS')} className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-bold transition whitespace-nowrap ${activeTab === 'PRODUCTS' ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}><LayoutGrid size={18} /> المنتجات</button>
              <button onClick={() => setActiveTab('CATEGORIES')} className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-bold transition whitespace-nowrap ${activeTab === 'CATEGORIES' ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}><Folder size={18} /> العائلات</button>
              <button onClick={() => setActiveTab('APPEARANCE')} className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-bold transition whitespace-nowrap ${activeTab === 'APPEARANCE' ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}><Eye size={18} /> المظهر</button>
              <button onClick={() => setActiveTab('EXPORT')} className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-bold transition whitespace-nowrap ${activeTab === 'EXPORT' ? 'bg-green-600 text-white' : 'hover:bg-green-100 dark:hover:bg-green-900 text-green-700 dark:text-green-400'}`}><FileJson size={18} /> حفظ للنشر</button>
              <button onClick={() => setActiveTab('SETTINGS')} className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-bold transition whitespace-nowrap ${activeTab === 'SETTINGS' ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}><Settings size={18} /> الإعدادات</button>
              <button onClick={() => setActiveTab('STATS')} className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-bold transition whitespace-nowrap ${activeTab === 'STATS' ? 'bg-purple-600 text-white' : 'hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-700 dark:text-purple-400'}`}><BarChart2 size={18} /> الإحصائيات</button>
            </div>

            {/* ══ تنبيه التعديلات غير المحفوظة ══ */}
            {hasUnsaved && (
              <div className="mx-4 mt-3 mb-1 flex items-center justify-between gap-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <AlertTriangle size={16} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                  <span className="text-sm font-bold text-yellow-800 dark:text-yellow-300">⚠️ يوجد تعديلات غير محفوظة للنشر</span>
                  <span className="text-xs text-yellow-600 dark:text-yellow-400 hidden sm:inline">— التعديلات موجودة في المتصفح لكن لم تُكتب للملف بعد</span>
                </div>
                <button
                  onClick={() => setActiveTab('EXPORT')}
                  className="flex-shrink-0 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition active:scale-95 whitespace-nowrap"
                >
                  حفظ للنشر ←
                </button>
              </div>
            )}

            {/* TAB: PRODUCTS */}
            {activeTab === 'PRODUCTS' && (
              <div>
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border dark:border-gray-700">
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <p className="text-gray-500 font-semibold whitespace-nowrap">العدد: {filteredAndSortedProducts.length}</p>
                    
                    {/* Category Filter */}
                    <div className="relative flex-1 md:flex-none md:min-w-[200px]">
                      <Filter size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                      <select 
                        value={adminCategoryFilter} 
                        onChange={(e) => setAdminCategoryFilter(e.target.value)}
                        className="w-full pl-3 pr-10 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 appearance-none text-sm"
                      >
                        <option value="ALL">كل العائلات</option>
                        {allCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button onClick={createNewProduct} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 shadow-md transition w-full md:w-auto justify-center">
                    <Plus size={20} /> إضافة منتج
                  </button>
                </div>

                <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700">
                  <table className="w-full text-right">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-200 uppercase text-sm leading-normal">
                      <tr>
                        <th className="py-3 px-6">صورة</th>
                        <th 
                          className="py-3 px-6 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition select-none"
                          onClick={() => handleSort('code')}
                        >
                          <div className="flex items-center gap-1">الكود {getSortIcon('code')}</div>
                        </th>
                        <th 
                          className="py-3 px-6 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition select-none"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center gap-1">الاسم {getSortIcon('name')}</div>
                        </th>
                        <th 
                          className="py-3 px-6 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition select-none"
                          onClick={() => handleSort('category')}
                        >
                          <div className="flex items-center gap-1">العائلة {getSortIcon('category')}</div>
                        </th>
                        <th 
                          className="py-3 px-6 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition select-none"
                          onClick={() => handleSort('price')}
                        >
                          <div className="flex items-center gap-1">السعر {getSortIcon('price')}</div>
                        </th>
                        <th className="py-3 px-6 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600 dark:text-gray-200 text-sm">
                      {filteredAndSortedProducts.map(p => (
                        <tr key={p.id} className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition group cursor-pointer ${p.isHidden ? 'bg-red-50 dark:bg-red-900/10' : ''}`} onClick={() => openEditModal(p)}>
                          <td className="py-3 px-6">
                            <div className="w-10 h-10 bg-white rounded border flex items-center justify-center overflow-hidden relative">
                              <img 
                                src={p.image || "https://placehold.co/100?text=No+Img"} 
                                className={`w-full h-full object-contain ${p.isOutOfStock || p.isHidden ? 'opacity-50' : ''}`}
                                style={{ 
                                  transform: `translate(${p.imagePositionX ? p.imagePositionX - 50 : 0}%, ${p.imagePositionY ? p.imagePositionY - 50 : 0}%) scale(${p.imageScale || 1})`,
                                  objectPosition: 'center'
                                }} 
                                alt="" 
                              />
                              {p.isHidden && <div className="absolute inset-0 flex items-center justify-center bg-black/20"><EyeOff size={16} className="text-white" /></div>}
                              {p.isOutOfStock && !p.isHidden && <div className="absolute inset-0 flex items-center justify-center bg-orange-500/20"><AlertCircle size={16} className="text-orange-600" /></div>}
                            </div>
                          </td>
                          <td className="py-3 px-6 font-mono font-bold">{p.code}</td>
                          <td className="py-3 px-6 font-medium">
                            {p.name}
                            <div className="flex gap-1 mt-1">
                              {p.isHidden && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 rounded flex items-center gap-1"><EyeOff size={10}/> مخفي</span>}
                              {p.isOutOfStock && <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 rounded flex items-center gap-1"><AlertCircle size={10}/> غير متوفر</span>}
                            </div>
                          </td>
                          <td className="py-3 px-6"><span className="bg-gray-200 dark:bg-gray-900 px-2 py-1 rounded text-xs">{p.category}</span></td>
                          <td className="py-3 px-6">{p.price}</td>
                          <td className="py-3 px-6 text-center">
                            <div className="flex item-center justify-center gap-2">
                              <button onClick={(e) => {e.stopPropagation(); openEditModal(p)}} className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center transition"><Edit3 size={16} /></button>
                              <button onClick={(e) => {e.stopPropagation(); onDeleteProduct(p.id)}} className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredAndSortedProducts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      لا توجد منتجات تطابق الفلتر المحدد
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: CATEGORIES */}
            {activeTab === 'CATEGORIES' && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-6">
                  <h3 className="font-bold text-lg mb-4">إضافة عائلة جديدة</h3>
                  <div className="flex gap-2">
                    <input type="text" placeholder="اسم العائلة (مثلاً: حمام)" className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 bg-white text-black border-gray-300" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
                    <button onClick={() => {if(newCatName.trim()) {onAddCategory(newCatName.trim()); setNewCatName(''); setHasUnsaved(true);}}} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold">إضافة</button>
                  </div>
                </div>
                <div className="space-y-2">
                  {allCategories.map(cat => (
                    <div key={cat} className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                      {editingCat?.old === cat ? (
                        <div className="flex gap-2 flex-1">
                          <input className="flex-1 p-2 border rounded bg-white text-black border-gray-300" value={editingCat.new} onChange={e => setEditingCat({...editingCat, new: e.target.value})} autoFocus />
                          <button onClick={() => {onRenameCategory(cat, editingCat.new); setEditingCat(null);}} className="bg-blue-600 text-white px-4 rounded">حفظ</button>
                          <button onClick={() => setEditingCat(null)} className="text-gray-500 px-2">إلغاء</button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <Folder className="text-primary-500" size={20} />
                            <span className="font-bold text-lg">{cat}</span>
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-500">{safeProducts.filter(p => p.category === cat).length} منتج</span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingCat({old: cat, new: cat})} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="تغيير الاسم"><Edit3 size={18} /></button>
                            <button onClick={() => onDeleteCategory(cat)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="حذف العائلة"><Trash2 size={18} /></button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: APPEARANCE */}
            {activeTab === 'APPEARANCE' && (
               <div className="max-w-5xl mx-auto space-y-8">
                 {/* Logo */}
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><ImageIcon className="text-primary-500" /> لوجو الشركة (Logo)</h3>
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="w-64 h-32 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-gray-900 overflow-hidden relative">
                         {appConfig.logo ? <img src={appConfig.logo} alt="Current Logo" className="w-full h-full object-contain" /> : <span className="text-gray-400">لا يوجد لوجو</span>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => logoInputRef.current?.click()} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition flex items-center gap-2"><Upload size={18} /> رفع لوجو جديد</button>
                        <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                      </div>
                    </div>
                 </div>

                 {/* Sticky Banner Toggle */}
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <Pin className="text-primary-500" />
                          <div>
                            <h3 className="text-lg font-bold">تثبيت البانر (Sticky Banner)</h3>
                            <p className="text-sm text-gray-500">جعل الصورة الكبيرة (السلايدر) ثابتة في الأعلى عند النزول للأسفل.</p>
                          </div>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={appConfig.stickyBanner} onChange={(e) => onUpdateConfig({...appConfig, stickyBanner: e.target.checked})} />
                          <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                       </label>
                    </div>
                 </div>

                 {/* Global Banner */}
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><LayoutGrid className="text-primary-500" /> الصورة الرئيسية للواجهة (Global Banner)</h3>
                    <div className="relative w-full h-48 sm:h-64 bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 group">
                      {appConfig.globalBanner ? (
                        <>
                          <img 
                            src={appConfig.globalBanner} 
                            alt="Global Banner" 
                            className="w-full h-full object-cover transition-all" 
                            style={{ objectPosition: `50% ${appConfig.bannerPositions?.['GLOBAL'] ?? 50}%` }}
                          />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-4">
                             <button onClick={() => globalBannerRef.current?.click()} className="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold">تغيير</button>
                             <button onClick={handleDeleteGlobalBanner} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold">حذف</button>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                           <ImageIcon size={48} className="mb-2" />
                           <span>اضغط لرفع صورة العرض الرئيسية</span>
                           <button onClick={() => globalBannerRef.current?.click()} className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg">رفع صورة</button>
                        </div>
                      )}
                      <input type="file" ref={globalBannerRef} className="hidden" accept="image/*" onChange={handleGlobalBannerUpload} />
                    </div>
                    {/* Position Slider for Global Banner */}
                    {appConfig.globalBanner && (
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold flex items-center gap-1 text-gray-700 dark:text-gray-200">
                             <ArrowUp size={16} /> تحريك الصورة عمودياً <ArrowDown size={16} />
                          </span>
                          <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 rounded">{appConfig.bannerPositions?.['GLOBAL'] ?? 50}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          step="1"
                          value={appConfig.bannerPositions?.['GLOBAL'] ?? 50}
                          onChange={(e) => updateBannerPosition('GLOBAL', parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-primary-600"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>أعلى</span>
                          <span>وسط</span>
                          <span>أسفل</span>
                        </div>
                      </div>
                    )}
                 </div>

                 {/* Category Banners */}
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Folder className="text-primary-500" /> صور العائلات (Category Banners)</h3>
                    
                    <input type="file" ref={categoryBannerInputRef} className="hidden" accept="image/*" onChange={handleCategoryBannerUpload} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {allCategories.map(cat => (
                         <div key={cat} className="border dark:border-gray-700 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-2">
                               <h4 className="font-bold">{cat}</h4>
                               {appConfig.categoryBanners?.[cat] ? (
                                 <button onClick={() => handleDeleteCategoryBanner(cat)} className="text-red-500 hover:bg-red-50 p-1 rounded" title="حذف الصورة"><Trash2 size={16} /></button>
                               ) : null}
                            </div>
                            <div className="w-full h-32 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 cursor-pointer relative group" onClick={() => {setUploadingCategory(cat); setTimeout(() => categoryBannerInputRef.current?.click(), 0);}}>
                               {appConfig.categoryBanners?.[cat] ? (
                                 <>
                                   <img 
                                      src={appConfig.categoryBanners[cat]} 
                                      className="w-full h-full object-cover transition-all" 
                                      alt={cat} 
                                      style={{ objectPosition: `50% ${appConfig.bannerPositions?.[cat] ?? 50}%` }}
                                   />
                                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" /></div>
                                 </>
                               ) : (
                                 <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition"><Plus size={24} /><span className="text-xs">إضافة صورة</span></div>
                               )}
                            </div>
                            
                            {/* Position Slider for Category Banner */}
                            {appConfig.categoryBanners?.[cat] && (
                              <div className="mt-2">
                                <input 
                                  type="range" 
                                  min="0" 
                                  max="100" 
                                  step="1"
                                  title="ضبط التموضع"
                                  value={appConfig.bannerPositions?.[cat] ?? 50}
                                  onChange={(e) => updateBannerPosition(cat, parseInt(e.target.value))}
                                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                              </div>
                            )}
                         </div>
                       ))}
                    </div>
                 </div>
               </div>
            )}

            {/* TAB: EXPORT */}
            {activeTab === 'EXPORT' && (
              <div className="max-w-2xl mx-auto mt-8 space-y-5">

                {/* الخطوة 1 — تنزيل الملف */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-blue-900 flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-black text-white">1</div>
                    <div>
                      <h3 className="font-black text-white">تنزيل ملف البيانات</h3>
                      <p className="text-blue-200 text-xs">يحتوي على كل تعديلاتك</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-5">
                      <AlertTriangle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                        هذا الملف يحتوي على <strong>كل بياناتك</strong> — المنتجات، الأسعار، الصور، الإعدادات. لا يُفقد أي شيء عند الاستبدال.
                      </div>
                    </div>
                    <button
                      onClick={() => { handleExportData(); setHasUnsaved(false); }}
                      className="w-full bg-blue-900 hover:bg-blue-800 text-white py-4 rounded-xl font-black text-base flex items-center justify-center gap-3 transition active:scale-95 shadow-lg"
                    >
                      <Download size={22} /> تنزيل constants.ts
                    </button>
                  </div>
                </div>

                {/* الخطوة 2 — السكريبت */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-green-700 flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-black text-white">2</div>
                    <div>
                      <h3 className="font-black text-white">تطبيق التعديلات بضغطة واحدة</h3>
                      <p className="text-green-200 text-xs">سكريبت يضع الملف تلقائياً ويبني المشروع</p>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs text-green-400 leading-relaxed">
                      <div className="text-gray-500 mb-1"># save.ps1 — ضعه في مجلد المشروع مرة واحدة</div>
                      <div>$src = "$PSScriptRoot\src\constants.ts"</div>
                      <div>$dl = "$env:USERPROFILE\Downloads\constants.ts"</div>
                      <div>Copy-Item $dl $src -Force</div>
                      <div>Write-Host "✅ تم النسخ"</div>
                    </div>
                    <div className="flex items-start gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                      <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-green-700 dark:text-green-300">
                        بعد تنزيل الملف من الخطوة 1 — شغّل <code className="bg-green-100 dark:bg-green-900 px-1.5 py-0.5 rounded">save.ps1</code> بزر اليمين → Run with PowerShell
                      </p>
                    </div>
                  </div>
                </div>

                {/* الخطوة 3 — البناء */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-5">
                  <h4 className="font-bold text-yellow-800 dark:text-yellow-300 mb-3 flex items-center gap-2 text-sm">
                    <AlertTriangle size={16} /> الخطوة الأخيرة — نشر للإنترنت
                  </h4>
                  <ol className="space-y-2 text-sm text-yellow-700 dark:text-yellow-400">
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-yellow-200 dark:bg-yellow-800 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">1</span>
                      أوقف Vite: <code className="bg-yellow-100 dark:bg-yellow-900 px-1.5 py-0.5 rounded text-xs mx-1">Ctrl+C</code>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-yellow-200 dark:bg-yellow-800 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">2</span>
                      شغّل: <code className="bg-yellow-100 dark:bg-yellow-900 px-1.5 py-0.5 rounded text-xs mx-1">npm run build</code>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-yellow-200 dark:bg-yellow-800 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">3</span>
                      ارفع مجلد <code className="bg-yellow-100 dark:bg-yellow-900 px-1.5 py-0.5 rounded text-xs mx-1">dist/</code> على السيرفر
                    </li>
                  </ol>
                </div>

              </div>
            )}

            {/* TAB: SETTINGS */}
            {activeTab === 'SETTINGS' && (
              <div className="max-w-md mx-auto mt-10 space-y-8">
                {/* Change PIN */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4"><Key size={32} /></div>
                    <h3 className="text-xl font-bold">تغيير كلمة مرور المشرف</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold mb-2">الكود الجديد (PIN)</label>
                      <input type="text" maxLength={8} placeholder="أدخل الكود الجديد" className="w-full p-4 text-center text-2xl tracking-widest border rounded-xl focus:ring-2 focus:ring-primary-500 transition bg-white text-black border-gray-300" value={newPinInput} onChange={(e) => setNewPinInput(e.target.value)} />
                    </div>
                    <button onClick={() => {if(newPinInput.length >= 4) {onChangePin(newPinInput); alert('تم تغيير كلمة المرور بنجاح'); setNewPinInput('');} else {alert('يجب أن يكون الكود 4 أرقام على الأقل');}}} className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition">حفظ التغيير</button>
                  </div>
                </div>

                {/* Factory Reset */}
                <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-2xl shadow-lg border border-red-200 dark:border-red-900/50 text-center">
                  <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4 flex items-center justify-center gap-2">
                    <AlertTriangle /> إعادة ضبط المصنع
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                    <strong>تنبيه هام:</strong> هذا الزر آمن. يقوم فقط بمسح ذاكرة هذا الجهاز لضمان ظهور المنتجات الجديدة. لا يحذف الموقع ولا يؤثر على المستخدمين الآخرين.
                  </p>
                  <button 
                    onClick={handleFactoryReset}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition"
                  >
                    <RefreshCw size={20} /> إصلاح المشاكل (مسح الذاكرة)
                  </button>
                </div>
              </div>
            )}

            {/* TAB: STATS */}
            {activeTab === 'STATS' && (
              <StatsContent products={safeProducts} />
            )}
          </>
        )}
      </div>
    </div>
  );
};
