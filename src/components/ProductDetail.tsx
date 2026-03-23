import React, { useState, useEffect } from 'react';
import {
  ArrowRight, ShoppingCart, Package,
  Clock, AlertCircle, Tag,
  Maximize2, X, CheckCircle
} from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../utils/storage';

interface ProductDetailProps {
  product: Product;
  relatedProducts: Product[];
  onBack: () => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  hidePrice?: boolean;
  priceLabel?: string;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  product, relatedProducts, onBack, onAddToCart, onSelectProduct,
  hidePrice = false, priceLabel = 'السعر'
}) => {
  const [qty, setQty] = useState(1);
  const [imageZoom, setImageZoom] = useState(false);
  const [added, setAdded] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  const isDiscountActive = !!(
    product.discountPrice &&
    product.discountEndDate &&
    new Date(product.discountEndDate) > new Date()
  );
  const isOutOfStock = !!product.isOutOfStock;
  const displayPrice = isDiscountActive ? product.discountPrice! : product.price;
  const totalPieces  = qty * product.colisage;
  const totalPrice   = totalPieces * displayPrice;

  useEffect(() => { setQty(1); setAdded(false); }, [product.id]);

  useEffect(() => {
    if (!isDiscountActive || !product.discountEndDate) return;
    const tick = () => {
      const dist = new Date(product.discountEndDate!).getTime() - Date.now();
      if (dist <= 0) { setTimeLeft('انتهى العرض'); return; }
      const d = Math.floor(dist / 86400000);
      const h = Math.floor((dist % 86400000) / 3600000);
      const m = Math.floor((dist % 3600000) / 60000);
      setTimeLeft(d > 0 ? `${d} يوم ${h}س` : `${h}:${String(m).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [isDiscountActive, product.discountEndDate]);

  const handleAdd = () => {
    onAddToCart({ ...product, price: displayPrice });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32 md:pb-10">

      {/* شريط التنقل */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shadow-sm no-print">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-900 dark:hover:text-blue-400 transition font-bold text-sm">
            <ArrowRight size={18} />
            <span className="hidden sm:inline">العودة للكتالوج</span>
          </button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="text-xs text-gray-400 line-clamp-1 flex-1">{product.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">

          {/* الصورة */}
          <div className="space-y-3">
            <div className="relative bg-white dark:bg-gray-800 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm" style={{ aspectRatio: '1' }}>
              {isOutOfStock && (
                <div className="absolute top-0 left-0 right-0 z-10 bg-orange-500 text-white text-xs font-bold py-2 text-center flex items-center justify-center gap-1.5">
                  <AlertCircle size={13} /> غير متوفر حالياً
                </div>
              )}
              {isDiscountActive && !isOutOfStock && (
                <div className="absolute top-3 right-3 z-10 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow">تخفيض</div>
              )}
              {product.image && (
                <button onClick={() => setImageZoom(true)} className="absolute top-3 left-3 z-10 w-9 h-9 bg-white/90 dark:bg-gray-700/90 rounded-xl flex items-center justify-center shadow hover:bg-white transition">
                  <Maximize2 size={16} className="text-gray-600 dark:text-gray-300" />
                </button>
              )}
              {product.image ? (
                <img
                  src={product.image} alt={product.name}
                  className="w-full h-full object-contain p-8 cursor-zoom-in"
                  style={{
                    filter: isOutOfStock ? 'grayscale(0.6) opacity(0.7)' : 'none',
                    transform: `translate(${product.imagePositionX ? product.imagePositionX - 50 : 0}%, ${product.imagePositionY ? product.imagePositionY - 50 : 0}%) scale(${product.imageScale || 1})`,
                  }}
                  onClick={() => setImageZoom(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-200 dark:text-gray-600">
                  <Package size={80} strokeWidth={1} />
                  <span className="text-sm mt-3 text-gray-400">لا توجد صورة</span>
                </div>
              )}
            </div>

            {/* الكودات */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-gray-900/80 text-white text-xs font-mono px-3 py-1.5 rounded-lg">{product.code}</span>
              {product.barcode && (
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-mono px-3 py-1.5 rounded-lg">🔲 {product.barcode}</span>
              )}
              <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold px-3 py-1.5 rounded-lg">{product.category}</span>
            </div>
          </div>

          {/* المعلومات */}
          <div className="flex flex-col gap-5">

            {/* الاسم */}
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white leading-tight mb-2">{product.name}</h1>
              {isOutOfStock && (
                <span className="inline-flex items-center gap-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-sm font-bold px-3 py-1 rounded-full">
                  <AlertCircle size={14} /> غير متوفر حالياً
                </span>
              )}
            </div>

            {/* المواصفات */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">المواصفات</span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {[
                  { label: 'الأبعاد', value: product.dimensions },
                  { label: 'الحجم', value: product.capacity },
                  { label: 'الكوليساج', value: `${product.colisage} قطعة / كرتون`, highlight: true },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center px-5 py-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{row.label}</span>
                    <span className={`text-sm font-bold ${row.highlight ? 'text-blue-700 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`} dir="ltr">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* السعر */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">{priceLabel}</div>
              {hidePrice ? (
                <div className="text-lg font-bold text-gray-500">تواصل معنا للسعر</div>
              ) : (
                <div className="flex items-end gap-4 flex-wrap">
                  <div>
                    {isDiscountActive && !isOutOfStock && (
                      <div className="text-sm text-gray-400 line-through mb-0.5">{formatCurrency(product.price)}</div>
                    )}
                    <div className={`text-4xl font-black leading-none ${isDiscountActive && !isOutOfStock ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                      {formatCurrency(displayPrice)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">سعر القطعة الواحدة</div>
                  </div>
                  {isDiscountActive && !isOutOfStock && timeLeft && (
                    <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-xl text-sm font-bold">
                      <Clock size={14} /> ينتهي بعد {timeLeft}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* حاسبة الطلبية */}
            {!isOutOfStock && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50 p-5">
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-4">حاسبة الطلبية</div>

                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex-shrink-0">عدد الكراتين:</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-xl border-2 border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 flex items-center justify-center hover:border-blue-500 transition font-bold text-xl text-blue-700 dark:text-blue-400">−</button>
                    <input
                      type="number" min="1" value={qty}
                      onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 h-10 text-center font-black text-lg border-2 border-blue-200 dark:border-blue-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                    <button onClick={() => setQty(q => q + 1)} className="w-10 h-10 rounded-xl border-2 border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 flex items-center justify-center hover:border-blue-500 transition font-bold text-xl text-blue-700 dark:text-blue-400">+</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center">
                    <div className="text-2xl font-black text-blue-700 dark:text-blue-400">{totalPieces}</div>
                    <div className="text-xs text-gray-500 mt-0.5">إجمالي القطع</div>
                  </div>
                  {!hidePrice && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center">
                      <div className="text-xl font-black text-blue-700 dark:text-blue-400">{formatCurrency(totalPrice)}</div>
                      <div className="text-xs text-gray-500 mt-0.5">الإجمالي</div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleAdd}
                  className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-lg active:scale-95 ${
                    added ? 'bg-green-500 text-white shadow-green-200'
                    : isDiscountActive ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-200'
                    : 'bg-blue-900 hover:bg-blue-800 text-white shadow-blue-200'
                  }`}
                >
                  {added ? <><CheckCircle size={22} /> تمت الإضافة!</> : <><ShoppingCart size={22} /> إضافة للطلبية</>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* منتجات مشابهة */}
        {relatedProducts.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-black text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Tag size={18} className="text-blue-600" />
              منتجات من نفس العائلة
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {relatedProducts.map(p => {
                const isDisc = !!(p.discountPrice && p.discountEndDate && new Date(p.discountEndDate) > new Date());
                const price  = isDisc ? p.discountPrice! : p.price;
                return (
                  <button key={p.id} onClick={() => { onSelectProduct(p); setQty(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-right group">
                    <div className="w-full aspect-square bg-white dark:bg-gray-900 p-3 flex items-center justify-center">
                      {p.image
                        ? <img src={p.image} alt={p.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"/>
                        : <Package size={32} className="text-gray-200"/>}
                    </div>
                    <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
                      <div className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-2 mb-1">{p.name}</div>
                      {!hidePrice && (
                        <div className={`text-sm font-black ${isDisc ? 'text-red-600' : 'text-blue-700 dark:text-blue-400'}`}>{formatCurrency(price)}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* زر ثابت للجوال */}
      {!isOutOfStock && (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-4 py-3 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 font-bold text-lg flex items-center justify-center">−</button>
              <span className="w-8 text-center font-black text-lg">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 font-bold text-lg flex items-center justify-center">+</button>
            </div>
            {!hidePrice && (
              <div className="flex-shrink-0 text-center">
                <div className="text-[10px] text-gray-400">{totalPieces} قطعة</div>
                <div className="text-sm font-black text-blue-700 dark:text-blue-400">{formatCurrency(totalPrice)}</div>
              </div>
            )}
            <button onClick={handleAdd}
              className={`flex-1 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${added ? 'bg-green-500 text-white' : 'bg-blue-900 hover:bg-blue-800 text-white'}`}>
              {added ? <><CheckCircle size={18}/> تمت!</> : <><ShoppingCart size={18}/> إضافة للطلبية</>}
            </button>
          </div>
        </div>
      )}

      {/* تكبير الصورة */}
      {imageZoom && product.image && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setImageZoom(false)}>
          <button className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition">
            <X size={20} />
          </button>
          <img src={product.image} alt={product.name} className="max-w-full max-h-full object-contain" style={{ transform: `scale(${product.imageScale || 1})` }} />
        </div>
      )}
    </div>
  );
};
