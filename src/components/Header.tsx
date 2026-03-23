
import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Moon, Sun, Lock, History, Search, ArrowUpDown, Menu, ScanLine, X, Tag, AlertTriangle, Camera, TrendingUp, Info, BarChart2 } from 'lucide-react';
import { AboutModal } from './AboutModal';
import { TopProductsModal } from './TopProductsModal';
import { Product } from '../types';
import { ViewMode, SortOption } from '../types';

interface HeaderProps {
  cartCount: number;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  onChangeView: (view: ViewMode) => void;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  searchValue: string;
  selectedCategory: string;
  onOpenFilter: () => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  logoSrc: string | null;
  onSelectCategory: (category: string) => void;
  products?: Product[];
  onAddToCart?: (product: Product) => void;
  hidePrice?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  cartCount, darkMode, toggleDarkMode, onOpenCart, onOpenAdmin, onChangeView, 
  onSearchChange, searchValue, selectedCategory, onOpenFilter,
  sortOption, onSortChange, logoSrc, onSelectCategory,
  products = [], onAddToCart, hidePrice = false
}) => {
  const [showAbout, setShowAbout] = React.useState(false);
  const [showTop, setShowTop] = React.useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);

  // تنظيف الماسح الضوئي عند إغلاق النافذة
  useEffect(() => {
    if (!isScannerOpen && scannerRef.current) {
      scannerRef.current.stop().then(() => {
        scannerRef.current.clear();
        scannerRef.current = null;
        setIsScanning(false);
      }).catch(console.error);
    }
  }, [isScannerOpen]);

  const startCamera = () => {
    setScannerError(null);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Html5Qrcode = (window as any).Html5Qrcode;

    if (!Html5Qrcode) {
      setScannerError("مكتبة المسح غير محملة. تأكد من الإنترنت.");
      return;
    }

    // تعيين حالة المسح لبدء إخفاء الزر وإظهار منطقة الفيديو
    setIsScanning(true);

    // تأخير بسيط لضمان وجود العنصر في DOM
    setTimeout(() => {
        try {
            if (scannerRef.current) {
                // إذا كان شغالاً مسبقاً، لا تفعل شيئاً
                return;
            }

            const html5QrCode = new Html5Qrcode("reader");
            scannerRef.current = html5QrCode;

            const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };
            
            // محاولة تشغيل الكاميرا الخلفية
            html5QrCode.start(
              { facingMode: "environment" }, 
              config,
              (decodedText: string) => {
                // نجاح المسح
                const event = { target: { value: decodedText } } as React.ChangeEvent<HTMLInputElement>;
                onSearchChange(event);
                
                // صوت نجاح اختياري (يمكن حذفه)
                // const audio = new Audio('beep.mp3'); audio.play().catch(e => {});

                closeScannerModal(); // إغلاق النافذة تلقائياً
              },
              (errorMessage: string) => {
                // تجاهل أخطاء عدم العثور على كود في الفريم الواحد
                // console.log(errorMessage);
              }
            ).catch((err: any) => {
              console.error("Error starting scanner:", err);
              setIsScanning(false);
              setScannerError("تعذر فتح الكاميرا. يرجى التأكد من السماح (Allow) للكاميرا.");
              scannerRef.current = null;
            });
        } catch (e) {
            console.error(e);
            setIsScanning(false);
            setScannerError("حدث خطأ غير متوقع.");
        }
    }, 100);
  };

  const closeScannerModal = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        scannerRef.current.clear();
        scannerRef.current = null;
      }).catch(console.error);
    }
    setIsScannerOpen(false);
    setIsScanning(false);
    setScannerError(null);
  };

  const clearSearch = () => {
    const event = { target: { value: '' } } as React.ChangeEvent<HTMLInputElement>;
    onSearchChange(event);
  };

  return (
    <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-md transition-colors duration-200 no-print">
      {/* Main Header */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col gap-4">
          
          {/* Top Row: Logo, Search, Actions */}
          <div className="flex items-center justify-between gap-4">
            
            {/* Logo Image */}
            <div className="flex items-center cursor-pointer flex-shrink-0" onClick={() => onChangeView('CATALOG')}>
              {logoSrc ? (
                 <img src={logoSrc} alt="UNIPLAST" className="h-12 w-auto object-contain" />
              ) : (
                 <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-400">UNIPLAST</h1>
              )}
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-xl">
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  placeholder="بحث: اسم، كود، باركود..." 
                  className="w-full pl-10 pr-20 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-colors"
                  value={searchValue}
                  onChange={onSearchChange}
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                
                <div className="absolute right-1 flex items-center gap-1">
                  {/* Clear Button */}
                  {searchValue && (
                    <button 
                      onClick={clearSearch}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-full transition"
                      title="مسح البحث"
                    >
                      <X size={16} />
                    </button>
                  )}
                  
                  {/* Camera Button */}
                  <button 
                    onClick={() => setIsScannerOpen(true)}
                    className="p-1.5 text-gray-500 hover:text-primary-600 bg-gray-200 dark:bg-gray-600 rounded-full transition mx-1"
                    title="مسح الباركود بالكاميرا"
                  >
                    <ScanLine size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Actions (Mobile & Desktop) */}
            <div className="flex items-center gap-2">
               <div className="flex items-center md:hidden">
                  <button onClick={toggleDarkMode} className="p-2 text-gray-600 dark:text-gray-300">
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                  </button>
                  <button className="p-2 relative text-primary-600" onClick={onOpenCart}>
                    <ShoppingCart size={24} />
                    {cartCount > 0 && (
                      <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                        {cartCount}
                      </span>
                    )}
                  </button>
               </div>

               <div className="hidden md:flex items-center gap-2">
                  <button onClick={() => onChangeView('HISTORY')} className="p-2 hover:bg-gray-100 rounded-full" title="History"><History size={20} /></button>
                  <button onClick={toggleDarkMode} className="p-2 hover:bg-gray-100 rounded-full">{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
                  <button onClick={onOpenAdmin} className="p-2 hover:bg-gray-100 rounded-full" title="Admin"><Lock size={20} /></button>
                  <button className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg shadow" onClick={onOpenCart}>
                    <ShoppingCart size={20} />
                    <span className="font-bold">الطلبية {cartCount > 0 && `(${cartCount})`}</span>
                  </button>
               </div>
            </div>
          </div>

          {/* Bottom Row: Smart Filter Button & Sort */}
          <div className="flex items-center justify-between gap-4">
            
            {/* Navigation Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none flex-1">
              {/* العائلات */}
              <button
                onClick={onOpenFilter}
                className="flex items-center gap-1.5 bg-blue-900 text-white px-3 py-1.5 rounded-full shadow hover:bg-blue-800 transition flex-shrink-0 text-xs font-bold"
              >
                <Menu size={14} />
                <span>العائلات</span>
              </button>

              {/* تخفيضات */}
              <button
                onClick={() => onSelectCategory('DISCOUNTS')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow transition flex-shrink-0 text-xs font-bold
                  ${selectedCategory === 'DISCOUNTS' ? 'bg-red-700 text-white ring-2 ring-red-400' : 'bg-red-600 hover:bg-red-700 text-white'}`}
              >
                <Tag size={14} />
                <span>تخفيضات</span>
              </button>

              {/* الأكثر مبيعاً */}
              <button
                onClick={() => setShowTop(true)}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-full shadow transition flex-shrink-0 text-xs font-bold"
              >
                <TrendingUp size={14} />
                <span>الأكثر مبيعاً</span>
              </button>

              {/* من نحن */}
              <button
                onClick={() => setShowAbout(true)}
                className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-full shadow transition flex-shrink-0 text-xs font-bold"
              >
                <Info size={14} />
                <span>من نحن</span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative group flex-shrink-0">
               <select 
                 value={sortOption}
                 onChange={(e) => onSortChange(e.target.value as SortOption)}
                 className="appearance-none bg-gray-100 dark:bg-gray-700 border-none rounded-full py-2 pl-9 pr-5 text-sm font-medium cursor-pointer hover:bg-gray-200 focus:ring-0 shadow-sm"
               >
                 <option value="DEFAULT">ترتيب: افتراضي</option>
                 <option value="PRICE_ASC">السعر: الأقل أولاً</option>
                 <option value="PRICE_DESC">السعر: الأعلى أولاً</option>
                 <option value="NAME_ASC">الاسم: أ-ي</option>
               </select>
               <ArrowUpDown size={16} className="absolute left-3 top-2.5 text-gray-500 pointer-events-none" />
            </div>

          </div>

        </div>
      </div>

      {/* Scanner Modal with Explicit Button Trigger */}
      {/* Modals */}
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      <TopProductsModal
        isOpen={showTop}
        onClose={() => setShowTop(false)}
        products={products}
        onAddToCart={onAddToCart || (() => {})}
        hidePrice={hidePrice}
      />

      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md overflow-hidden relative flex flex-col max-h-[80vh]">
             <button 
               onClick={closeScannerModal}
               className="absolute top-2 right-2 z-10 p-2 bg-white rounded-full text-black hover:bg-gray-200 shadow-md"
             >
               <X size={24} />
             </button>
             
             <div className="p-4 text-center border-b dark:border-gray-700">
               <h3 className="font-bold text-lg text-black dark:text-white">مسح الباركود</h3>
             </div>
             
             <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden min-h-[300px]">
                {/* عنصر الفيديو الذي تستخدمه المكتبة */}
                <div id="reader" className="w-full h-full"></div>
                
                {/* Start Button Overlay - Only visible if NOT scanning and NO error */}
                {!isScanning && !scannerError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10 p-6 text-center">
                    <ScanLine size={64} className="mb-4 text-primary-500" />
                    <p className="mb-6 text-gray-300 font-medium">الكاميرا لا تعمل تلقائياً</p>
                    <button 
                      onClick={startCamera}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg flex items-center gap-3 transition transform hover:scale-105 active:scale-95"
                    >
                      <Camera size={28} />
                      <span>تشغيل الكاميرا الآن</span>
                    </button>
                    <p className="mt-4 text-xs text-gray-500">سيطلب المتصفح الإذن، يرجى الموافقة</p>
                  </div>
                )}

                {/* Error State */}
                {scannerError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-20 p-6 text-center">
                    <AlertTriangle size={48} className="mb-4 text-red-500" />
                    <p className="text-red-400 font-bold mb-2">خطأ في الكاميرا</p>
                    <p className="text-gray-400 text-sm mb-6">{scannerError}</p>
                    <button 
                      onClick={() => { setScannerError(null); setIsScanning(false); }}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-bold"
                    >
                      حاول مرة أخرى
                    </button>
                  </div>
                )}
             </div>
             
             <div className="p-3 bg-gray-50 dark:bg-gray-800 text-center text-xs text-gray-500">
               وجه الكاميرا نحو الباركود ليتم البحث عنه تلقائياً
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
