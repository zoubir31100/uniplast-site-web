import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowLeft, CheckCircle, Package } from 'lucide-react';
import { Product, CartItem } from '../types';
import { formatCurrency } from '../utils/storage';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToAdd: Product | null;
  onConfirmAdd: (product: Product, quantityCartons: number) => void;
  cartItems: CartItem[];
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({ 
  isOpen, onClose, productToAdd, onConfirmAdd, cartItems, onRemoveItem, onCheckout 
}) => {
  const [qtyInput, setQtyInput] = useState<number>(1);

  if (!isOpen) return null;

  // Mode 1: Adding a Product
  if (productToAdd) {
    const totalPieces = qtyInput * productToAdd.colisage;
    const estimatedPrice = totalPieces * productToAdd.price;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
          <div className="p-4 bg-primary-600 text-white flex justify-between items-center">
            <h3 className="font-bold text-lg">إضافة للطلبية</h3>
            <button onClick={onClose}><X size={20} /></button>
          </div>
          
          <div className="p-6">
            <div className="mb-4 text-center">
              <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{productToAdd.name}</h4>
              <span className="inline-block bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded text-sm text-gray-600 dark:text-gray-300">
                {productToAdd.code}
              </span>
            </div>

            <div className="bg-blue-50 dark:bg-gray-700/50 p-4 rounded-lg mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">الكوليساج (في الكرتون):</span>
                <span className="font-bold text-lg">{productToAdd.colisage}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">سعر القطعة:</span>
                <span className="font-bold text-lg">{formatCurrency(productToAdd.price)}</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                عدد الكراتين (Cartons)
              </label>
              <div className="flex items-center gap-2">
                <button 
                  className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg font-bold text-xl"
                  onClick={() => setQtyInput(Math.max(1, qtyInput - 1))}
                >-</button>
                <input 
                  type="number" 
                  min="1"
                  value={qtyInput}
                  onChange={(e) => setQtyInput(Math.max(1, parseInt(e.target.value) || 0))}
                  className="flex-1 h-10 text-center border rounded-lg dark:bg-gray-700 dark:border-gray-600 font-bold"
                />
                <button 
                  className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg font-bold text-xl"
                  onClick={() => setQtyInput(qtyInput + 1)}
                >+</button>
              </div>
            </div>

            <div className="border-t dark:border-gray-700 pt-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 dark:text-gray-400">إجمالي القطع:</span>
                <span className="font-bold text-xl">{totalPieces} قطعة</span>
              </div>
              <div className="flex justify-between items-center text-primary-600 dark:text-primary-400">
                <span className="font-bold">السعر الإجمالي:</span>
                <span className="font-bold text-2xl">{formatCurrency(estimatedPrice)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  onConfirmAdd(productToAdd, qtyInput);
                  setQtyInput(1);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-colors"
              >
                مواصلة الطلبية
              </button>
              <button 
                onClick={() => {
                  onConfirmAdd(productToAdd, qtyInput);
                  setQtyInput(1);
                  onCheckout();
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition-colors"
              >
                إنهاء الطلبية
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mode 2: Cart Summary
  const cartTotal = cartItems.reduce((acc, item) => acc + item.totalPrice, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-in-right">
        <div className="p-4 bg-primary-600 text-white flex justify-between items-center shadow-md">
          <div className="flex items-center gap-2">
            <ShoppingBag />
            <h3 className="font-bold text-lg">سلة المشتريات ({cartItems.length})</h3>
          </div>
          <button onClick={onClose}><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingBag size={64} className="mb-4 opacity-50" />
              <p>السلة فارغة حالياً</p>
              <button onClick={onClose} className="mt-4 text-primary-600 font-bold">تصفح المنتجات</button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="flex gap-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="w-16 h-16 bg-white dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <img src={item.image} className="w-full h-full object-contain" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package size={20} className="text-gray-400"/></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm text-gray-800 dark:text-gray-100 line-clamp-1">{item.name}</h4>
                    <button onClick={() => onRemoveItem(item.id)} className="text-red-500 p-1"><Trash2 size={16} /></button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {item.code} | {item.quantityCartons} كرتون x {item.colisage}
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <span className="text-sm font-medium">{item.totalPieces} قطعة</span>
                    <span className="text-primary-600 font-bold">{formatCurrency(item.totalPrice)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <div className="flex justify-between items-center mb-4 text-xl">
              <span className="text-gray-600 dark:text-gray-400 font-bold">المجموع الكلي:</span>
              <span className="text-primary-600 dark:text-primary-400 font-bold">{formatCurrency(cartTotal)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={onClose}
                className="flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <ArrowLeft size={18} /> مواصلة التسوق
              </button>
              <button 
                onClick={onCheckout}
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold shadow-lg transition transform active:scale-95"
              >
                <CheckCircle size={18} /> إنهاء الطلب
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};