
import React, { useState, useEffect } from 'react';
import { Plus, Package, Clock, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../utils/storage';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  isAdmin: boolean;
  onEdit: (product: Product) => void;
  onViewDetail: (product: Product) => void;
  hidePrice?: boolean;
  priceLabel?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, isAdmin, onEdit, onViewDetail, hidePrice = false, priceLabel = 'السعر' }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  const isDiscountActive = product.discountPrice && product.discountEndDate && new Date(product.discountEndDate) > new Date();
  const isOutOfStock = !!product.isOutOfStock;

  useEffect(() => {
    if (isDiscountActive && product.discountEndDate) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = new Date(product.discountEndDate!).getTime() - now;

        if (distance < 0) {
          setTimeLeft('انتهى العرض');
          clearInterval(interval);
        } else {
          const days = Math.floor(distance / (1000 * 60 * 60 * 24));
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          
          if (days > 0) {
            setTimeLeft(`${days} يوم ${hours} ساعة`);
          } else {
            setTimeLeft(`${hours} ساعة`);
          }
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isDiscountActive, product.discountEndDate]);

  // Determine which price to display
  const displayPrice = isDiscountActive ? product.discountPrice! : product.price;

  // Border color based on state
  const borderClass = isOutOfStock
    ? 'border-orange-300 dark:border-orange-700'
    : isDiscountActive
    ? 'border-red-300 dark:border-red-900 ring-1 ring-red-100'
    : 'border-gray-200 dark:border-gray-700';

  return (
    <div className={`flex flex-col h-full bg-gray-100 dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border ${borderClass} group relative`}>
      
      {/* ====== OUT OF STOCK BANNER (يظهر للزبون فوق البطاقة) ====== */}
      {isOutOfStock && (
        <div className="absolute top-0 left-0 right-0 z-30 bg-orange-500 text-white text-xs font-bold py-1.5 flex items-center justify-center gap-1.5 shadow-md">
          <AlertCircle size={13} />
          غير متوفر حالياً
        </div>
      )}

      {/* Discount Badge (only shown if NOT out of stock) */}
      {isDiscountActive && !isOutOfStock && (
        <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl z-20 shadow-md">
          تخفيض
        </div>
      )}

      {/* Image Area - Pure White Background */}
      <div 
        onClick={(e) => {
          if (isAdmin) { e.stopPropagation(); onEdit(product); }
          else { onViewDetail(product); }
        }}
        className={`relative w-full aspect-square bg-white flex items-center justify-center overflow-hidden p-4 cursor-pointer hover:bg-gray-50 ${isOutOfStock ? 'mt-7' : ''}`}
        title={isAdmin ? "اضغط للتعديل" : "عرض التفاصيل"}
      >
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name} 
            className={`w-full h-full object-contain transition-transform duration-300 ease-in-out ${isOutOfStock ? 'opacity-40 grayscale' : ''}`}
            style={{ 
              transform: `translate(${product.imagePositionX ? product.imagePositionX - 50 : 0}%, ${product.imagePositionY ? product.imagePositionY - 50 : 0}%) scale(${product.imageScale || 1})`,
              objectPosition: 'center'
            }} 
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-300">
            <Package size={48} strokeWidth={1} />
            <span className="text-xs mt-2">لا توجد صورة</span>
            {isAdmin && <span className="text-[10px] text-primary-500 font-bold mt-1">اضغط للإضافة</span>}
          </div>
        )}
        
        {/* Admin Edit Badge */}
        {isAdmin && (
           <button 
             onClick={(e) => { e.stopPropagation(); onEdit(product); }}
             className="absolute top-2 right-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-2 py-1 rounded shadow z-10"
           >
             تعديل
           </button>
        )}
        
        {/* Code Badge */}
        <div className="absolute top-2 left-2 bg-gray-900/80 backdrop-blur-sm text-white text-[10px] font-mono px-2 py-0.5 rounded opacity-70 group-hover:opacity-100 transition-opacity">
          {product.code}
        </div>
      </div>

      {/* Info Area - Gray Background */}
      <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-800/50 flex flex-col border-t border-gray-100 dark:border-gray-700">
        
        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2 leading-tight min-h-[2.5rem] line-clamp-2">
          {product.name}
        </h3>
        
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-3">
          <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1">
            <span>الأبعاد</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300" dir="ltr">{product.dimensions}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1">
            <span>الحجم</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300" dir="ltr">{product.capacity}</span>
          </div>
          <div className="flex justify-between pt-1">
             <span>الكوليساج</span>
             <span className="font-bold text-primary-600 dark:text-primary-400">{product.colisage} قطعة</span>
          </div>
        </div>

        {/* Timer for discount (only if not out of stock) */}
        {isDiscountActive && !isOutOfStock && timeLeft && (
          <div className="mb-2 flex items-center justify-center gap-1 text-[10px] text-red-600 font-bold bg-red-50 dark:bg-red-900/20 py-1 rounded">
            <Clock size={12} />
            <span>باقي {timeLeft}</span>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-bold">{priceLabel}</span>
            <div className="flex flex-col">
              {hidePrice ? (
                <span className="text-sm font-semibold text-gray-500">اتصل بنا</span>
              ) : (
                <>
                  {isDiscountActive && !isOutOfStock && (
                    <span className="text-xs text-gray-400 line-through decoration-red-500 decoration-1">
                      {formatCurrency(product.price)}
                    </span>
                  )}
                  <span className={`font-bold text-xl leading-none ${isOutOfStock ? 'text-gray-400 dark:text-gray-500' : isDiscountActive ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                    {isOutOfStock ? '--' : formatCurrency(displayPrice)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* ====== زر الإضافة: معطّل إذا كان غير متوفر ====== */}
          {isOutOfStock ? (
            <button
              disabled
              className="bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 p-2.5 rounded-lg cursor-not-allowed"
              title="المنتج غير متوفر حالياً"
            >
              <AlertCircle size={22} />
            </button>
          ) : (
            <button 
              onClick={() => onAddToCart({...product, price: displayPrice})}
              className={`${isDiscountActive ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/30'} active:scale-95 text-white p-2.5 rounded-lg shadow-lg transition-all`}
              title="أضف للطلبية"
            >
              <Plus size={22} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
