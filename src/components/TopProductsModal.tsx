import React, { useMemo } from 'react';
import { X, TrendingUp, Package, ShoppingCart } from 'lucide-react';
import { Product } from '../types';
import { getStoredOrders, formatCurrency } from '../utils/storage';

interface TopProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddToCart: (product: Product) => void;
  hidePrice?: boolean;
}

export const TopProductsModal: React.FC<TopProductsModalProps> = ({
  isOpen, onClose, products, onAddToCart, hidePrice = false
}) => {
  const orders = useMemo(() => getStoredOrders(), []);

  // حساب أكثر المنتجات طلباً
  const topProducts = useMemo(() => {
    const map: Record<string, { pieces: number; orders: number }> = {};
    orders.forEach(o => o.items.forEach(item => {
      if (!map[item.id]) map[item.id] = { pieces: 0, orders: 0 };
      map[item.id].pieces += item.totalPieces;
      map[item.id].orders++;
    }));

    return Object.entries(map)
      .sort((a, b) => b[1].pieces - a[1].pieces)
      .slice(0, 12)
      .map(([id, stats]) => {
        const product = products.find(p => p.id === id);
        return product ? { ...product, ...stats } : null;
      })
      .filter(Boolean) as (Product & { pieces: number; orders: number })[];
  }, [orders, products]);

  if (!isOpen) return null;

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-800 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up"
           style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 px-6 pt-6 pb-5 flex-shrink-0">
          <button onClick={onClose}
            className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center bg-white/20">
            <X size={16} className="text-white" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <TrendingUp size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">الأكثر مبيعاً</h2>
              <p className="text-amber-100 text-xs mt-0.5">
                {topProducts.length > 0
                  ? `أفضل ${topProducts.length} منتج حسب الطلبيات`
                  : 'لا توجد طلبيات بعد'}
              </p>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <Package size={48} className="opacity-30" />
              <p className="font-bold text-gray-500">لا توجد بيانات مبيعات بعد</p>
              <p className="text-sm text-center">ستظهر المنتجات هنا بعد أول طلبيات</p>
            </div>
          ) : (
            topProducts.map((product, i) => {
              const isDiscountActive = !!(
                product.discountPrice &&
                product.discountEndDate &&
                new Date(product.discountEndDate) > new Date()
              );
              const displayPrice = isDiscountActive ? product.discountPrice! : product.price;
              const isOOS = !!product.isOutOfStock;

              return (
                <div key={product.id}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">

                  {/* الترتيب */}
                  <div className="flex-shrink-0 w-8 text-center">
                    {i < 3 ? (
                      <span className="text-xl">{medals[i]}</span>
                    ) : (
                      <span className="text-sm font-black text-gray-400">#{i + 1}</span>
                    )}
                  </div>

                  {/* الصورة */}
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-100 dark:border-gray-600">
                    {product.image
                      ? <img src={product.image} alt={product.name} className="w-full h-full object-contain p-1" />
                      : <Package size={20} className="text-gray-300" />
                    }
                  </div>

                  {/* المعلومات */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-gray-800 dark:text-gray-100 line-clamp-1">{product.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{product.pieces.toLocaleString()} قطعة مباعة</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{product.orders} طلب</span>
                    </div>
                    {!hidePrice && (
                      <div className={`text-sm font-black mt-0.5 ${isDiscountActive ? 'text-red-600 dark:text-red-400' : 'text-blue-700 dark:text-blue-400'}`}>
                        {formatCurrency(displayPrice)}
                      </div>
                    )}
                  </div>

                  {/* زر الإضافة */}
                  {!isOOS ? (
                    <button
                      onClick={() => { onAddToCart({ ...product, price: displayPrice }); onClose(); }}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 transition active:scale-90 ${isDiscountActive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-900 hover:bg-blue-800'}`}>
                      <ShoppingCart size={16} />
                    </button>
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                      <Package size={14} className="text-gray-400" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
          <button onClick={onClose}
            className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-2xl font-bold transition">
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
