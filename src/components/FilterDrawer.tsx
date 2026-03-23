import React, { useState, useMemo } from 'react';
import { X, Home, Search, Tag, Building2, Phone, Mail, MapPin } from 'lucide-react';
import { Product } from '../types';
import { COMPANY_INFO } from '../constants';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  logoSrc: string | null;
  products?: Product[];
}

const getCategoryEmoji = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes('حمام') || n.includes('غسيل') || n.includes('bain'))     return '🛁';
  if (n.includes('مطبخ') || n.includes('cuisine'))                          return '🍳';
  if (n.includes('تخزين') || n.includes('rangement') || n.includes('box')) return '📦';
  if (n.includes('حديقة') || n.includes('jardin'))                          return '🌿';
  if (n.includes('نظاف') || n.includes('propre'))                           return '🧹';
  if (n.includes('أطفال') || n.includes('enfant'))                          return '🧸';
  if (n.includes('علب') || n.includes('boite'))                             return '📫';
  if (n.includes('برميل') || n.includes('bidon'))                           return '🛢️';
  if (n.includes('سطل') || n.includes('seau'))                              return '🪣';
  return '📁';
};

// ── نافذة "من نحن" ─────────────────────────────────────────────
const AboutModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
    <div className="bg-white dark:bg-gray-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
         style={{ maxHeight: '90vh', overflowY: 'auto' }}>

      {/* Header */}
      <div className="relative px-6 pt-8 pb-6 text-white text-center"
           style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)' }}>
        <button onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.2)' }}>
          <X size={16} />
        </button>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
             style={{ background: 'rgba(255,255,255,0.15)' }}>
          <Building2 size={30} className="text-white" />
        </div>
        <h2 className="text-xl font-black">{COMPANY_INFO.name}</h2>
        <p className="text-blue-200 text-xs mt-1">من نحن</p>
      </div>

      {/* Body */}
      <div className="px-5 py-5 space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed text-justify">
          {COMPANY_INFO.description}
        </p>

        <div className="space-y-2.5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">اتصل بنا</p>

          {[
            { href: `tel:${COMPANY_INFO.phone.replace(/\s/g,'')}`,        icon: Phone,  label: 'الهاتف الرئيسي',    value: COMPANY_INFO.phone,              bg: '#f0fdf4', iconBg: '#22c55e' },
            { href: `tel:${(COMPANY_INFO.commercialService||'').replace(/\s/g,'')}`, icon: Phone, label: 'المصلحة التجارية', value: COMPANY_INFO.commercialService, bg: '#eff6ff', iconBg: '#3b82f6' },
            { href: `mailto:${COMPANY_INFO.email}`,                        icon: Mail,   label: 'البريد الإلكتروني', value: COMPANY_INFO.email,              bg: '#faf5ff', iconBg: '#a855f7' },
            { href: COMPANY_INFO.mapsLink, target: '_blank',               icon: MapPin, label: 'الموقع',            value: COMPANY_INFO.location,           bg: '#fff7ed', iconBg: '#f97316' },
          ].map((item, i) => (
            <a key={i} href={item.href} target={(item as any).target} rel="noreferrer"
               className="flex items-center gap-3 p-3 rounded-2xl transition hover:opacity-90"
               style={{ background: item.bg }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ background: item.iconBg }}>
                <item.icon size={16} className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-gray-500 font-medium">{item.label}</div>
                <div className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-tight truncate"
                     dir={item.label === 'الهاتف الرئيسي' || item.label === 'المصلحة التجارية' ? 'ltr' : 'rtl'}>
                  {item.value}
                </div>
              </div>
            </a>
          ))}
        </div>

        <button onClick={onClose}
          className="w-full py-3 rounded-2xl font-bold text-white transition active:scale-95"
          style={{ background: '#1e3a8a' }}>
          إغلاق
        </button>
      </div>
    </div>
  </div>
);

// ── Drawer الرئيسي ─────────────────────────────────────────────
export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen, onClose, categories, selectedCategory, onSelectCategory, logoSrc, products = []
}) => {
  const [search,    setSearch]    = useState('');
  const [showAbout, setShowAbout] = useState(false);

  const countMap = useMemo(() => {
    const m: Record<string, number> = {};
    products.forEach(p => { if (!p.isHidden) m[p.category] = (m[p.category] || 0) + 1; });
    return m;
  }, [products]);

  const totalVisible  = products.filter(p => !p.isHidden).length;
  const discountCount = products.filter(p =>
    p.discountPrice && p.discountEndDate && new Date(p.discountEndDate) > new Date()
  ).length;

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(c => c === 'ALL' || c.toLowerCase().includes(q));
  }, [categories, search]);

  const mainCats = filtered.filter(c => c !== 'ALL');

  if (!isOpen) return null;

  const handleSelect = (cat: string) => {
    onSelectCategory(cat);
    onClose();
    setSearch('');
  };

  return (
    <>
      {/* About Modal */}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}

      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm"
           onClick={() => { onClose(); setSearch(''); }} />

      {/* ── Drawer — يمين، عرض 255px ── */}
      <div className="fixed top-0 right-0 bottom-0 z-50 flex flex-col shadow-2xl animate-slide-in-right"
           style={{ width: '255px', background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)', direction: 'rtl' }}>

        {/* ── Header ── */}
        <div className="flex-shrink-0 px-4 pt-5 pb-4"
             style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>

          {/* شعار + إغلاق */}
          <div className="flex items-center justify-between mb-3">
            {logoSrc
              ? <img src={logoSrc} alt="logo" className="h-9 w-auto object-contain" />
              : <span className="font-black text-base text-white"><span className="text-blue-400">UNI</span>PLAST</span>
            }
            <button onClick={() => { onClose(); setSearch(''); }}
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.1)' }}>
              <X size={15} className="text-white" />
            </button>
          </div>

          {/* عنوان + إحصاء */}
          <div className="mb-3">
            <h2 className="text-white font-black text-sm">العائلات</h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {mainCats.length} عائلة · {totalVisible} منتج
            </p>
          </div>

          {/* بحث */}
          <div className="relative">
            <Search size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2"
                    style={{ color: 'rgba(255,255,255,0.35)' }} />
            <input type="text" placeholder="بحث..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pr-7 pl-3 py-1.5 rounded-xl text-white font-medium focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontSize: '12px', direction: 'rtl' }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute left-2 top-1/2 -translate-y-1/2"
                      style={{ color: 'rgba(255,255,255,0.4)' }}>
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {/* ── القائمة ── */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1"
             style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>

          {/* الرئيسية */}
          {filtered.includes('ALL') && (
            <button onClick={() => handleSelect('ALL')}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-150"
              style={{
                background: selectedCategory === 'ALL' ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : 'rgba(255,255,255,0.04)',
                border: selectedCategory === 'ALL' ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.06)',
              }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                   style={{ background: selectedCategory === 'ALL' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)' }}>
                <Home size={14} className="text-white" />
              </div>
              <div className="flex-1 text-right">
                <div className="text-white font-bold" style={{ fontSize: '13px' }}>الرئيسية</div>
              </div>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '11px' }}>
                {totalVisible}
              </span>
            </button>
          )}

          {/* فاصل */}
          {filtered.includes('ALL') && mainCats.length > 0 && (
            <div className="flex items-center gap-2 py-1 px-1">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>العائلات</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            </div>
          )}

          {/* العائلات */}
          {mainCats.map(cat => {
            const isSel  = selectedCategory === cat;
            const count  = countMap[cat] || 0;
            const emoji  = getCategoryEmoji(cat);
            return (
              <button key={cat} onClick={() => handleSelect(cat)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-150"
                style={{
                  background: isSel ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'rgba(255,255,255,0.04)',
                  border: isSel ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.06)',
                }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                     style={{ background: isSel ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)', fontSize: '15px' }}>
                  {emoji}
                </div>
                <div className="flex-1 text-right min-w-0">
                  <div className="font-bold leading-tight truncate"
                       style={{ color: isSel ? '#1c1917' : 'white', fontSize: '13px' }}>
                    {cat}
                  </div>
                </div>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        background: isSel ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.09)',
                        color: isSel ? '#1c1917' : 'rgba(255,255,255,0.7)',
                        fontSize: '11px',
                      }}>
                  {count}
                </span>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <span style={{ fontSize: '28px', opacity: 0.3 }}>🔍</span>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>لا توجد نتائج</p>
              <button onClick={() => setSearch('')} className="text-blue-400 hover:text-blue-300"
                      style={{ fontSize: '12px' }}>مسح البحث</button>
            </div>
          )}

          <div className="h-3" />
        </div>

        {/* ── Footer: تخفيضات + من نحن ── */}
        <div className="flex-shrink-0 px-3 py-3 space-y-2"
             style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.25)' }}>

          {/* تخفيضات */}
          <button onClick={() => handleSelect('DISCOUNTS')}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all duration-150"
            style={{
              background: selectedCategory === 'DISCOUNTS' ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : 'rgba(220,38,38,0.12)',
              border: '1px solid rgba(220,38,38,0.3)',
            }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                 style={{ background: 'rgba(220,38,38,0.25)', fontSize: '14px' }}>
              🏷️
            </div>
            <div className="flex-1 text-right">
              <div className="font-bold text-red-400" style={{ fontSize: '13px' }}>التخفيضات</div>
            </div>
            <span style={{ background: 'rgba(220,38,38,0.2)', color: '#f87171', fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '50px' }}>
              {discountCount}
            </span>
          </button>

          {/* من نحن */}
          <button onClick={() => setShowAbout(true)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all duration-150"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                 style={{ background: 'rgba(59,130,246,0.2)' }}>
              <Building2 size={14} className="text-blue-400" />
            </div>
            <div className="flex-1 text-right">
              <div className="font-bold text-white" style={{ fontSize: '13px' }}>من نحن</div>
            </div>
          </button>
        </div>

      </div>
    </>
  );
};
