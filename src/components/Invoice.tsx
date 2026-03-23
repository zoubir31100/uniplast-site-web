
import React, { useState } from 'react';
import { Printer, Share2, ArrowRight, Phone, Mail, CheckCircle } from 'lucide-react';
import { Order, CartItem } from '../types';
import { formatCurrency, saveOrder } from '../utils/storage';
import { COMPANY_INFO } from '../constants';

interface InvoiceProps {
  items: CartItem[];
  onBack: () => void;
  onClearCart: () => void;
}

export const Invoice: React.FC<InvoiceProps> = ({ items, onBack, onClearCart }) => {
  const [customerName, setCustomerName] = useState('');
  const [isFinalized, setIsFinalized] = useState(false);
  const [orderId] = useState(`CMD-${Date.now().toString().slice(-6)}`);
  const date = new Date().toLocaleDateString('fr-FR');
  
  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleFinalize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('الرجاء كتابة اسم الزبون أو المحل لإتمام الفاتورة');
      return;
    }
    
    const newOrder: Order = {
      id: orderId,
      date: new Date().toISOString(),
      customerName,
      items,
      totalAmount
    };
    
    saveOrder(newOrder);
    setIsFinalized(true);
    
    // Force scroll to top to ensure user sees the invoice
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handlePrint = () => {
    window.print();
  };

  const generateMessage = () => {
    let msg = `*طلبية جديدة - ${COMPANY_INFO.name}*\n`;
    msg += `👤 الزبون: ${customerName}\n`;
    msg += `📅 التاريخ: ${date}\n`;
    msg += `📄 رقم الفاتورة: ${orderId}\n\n`;
    
    items.forEach(item => {
      msg += `🔹 ${item.name} (${item.code})\n`;
      msg += `   ${item.quantityCartons} كرتون (${item.totalPieces} قطعة) - ${formatCurrency(item.totalPrice)}\n`;
    });
    
    msg += `\n💰 *المجموع: ${formatCurrency(totalAmount)}*`;
    return encodeURIComponent(msg);
  };

  const sendWhatsApp = () => {
    window.open(`https://wa.me/?text=${generateMessage()}`, '_blank');
  };

  const sendViber = () => {
     window.open(`viber://forward?text=${generateMessage()}`, '_blank');
  };
  
  const sendEmail = () => {
    window.open(`mailto:?subject=New Order ${orderId}&body=${generateMessage()}`, '_blank');
  };

  if (!isFinalized) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 animate-fade-in-up">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold">إتمام الطلب</h2>
            <p className="text-gray-500 text-sm mt-2">أدخل اسم الزبون لإصدار الفاتورة</p>
          </div>
          
          <form onSubmit={handleFinalize}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                الاسم واللقب / اسم المحل <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 transition-all"
                placeholder="أدخل اسم الزبون..."
                autoFocus
              />
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6 border border-gray-200 dark:border-gray-600">
               <div className="flex justify-between mb-2 text-sm">
                 <span>عدد المنتجات:</span>
                 <b>{items.length}</b>
               </div>
               <div className="flex justify-between text-lg text-primary-600 font-bold border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                 <span>المجموع:</span>
                 <span>{formatCurrency(totalAmount)}</span>
               </div>
            </div>

            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={onBack}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                رجوع
              </button>
              <button 
                type="submit"
                className="flex-[2] px-4 py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
              >
                <span>نشر الفاتورة</span>
                <ArrowRight size={18} className="rotate-180" />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-0 md:px-4 py-2 md:py-8 max-w-4xl w-full animate-fade-in-up">
      <div className="no-print mb-4 px-4 flex justify-between items-center">
        <button onClick={() => { onClearCart(); onBack(); }} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm md:text-base bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50">
          <ArrowRight size={18} /> طلبية جديدة
        </button>
        <button onClick={handlePrint} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm md:text-base shadow-md">
          <Printer size={18} /> طباعة
        </button>
      </div>

      <div className="bg-white text-gray-900 rounded-none md:rounded-xl shadow-none md:shadow-2xl overflow-hidden print:shadow-none print:w-full w-full border-t md:border-t-0 border-gray-200">
        
        {/* Invoice Header */}
        <div className="bg-gray-100 p-4 md:p-8 border-b-4 border-primary-600 flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-primary-800 mb-1">{COMPANY_INFO.name}</h1>
            <p className="text-xs md:text-sm text-gray-600">{COMPANY_INFO.location}</p>
            <p className="text-xs md:text-sm text-gray-600 font-mono" dir="ltr">{COMPANY_INFO.phone}</p>
          </div>
          <div className="text-left w-full md:w-auto flex flex-row md:flex-col justify-between items-center md:items-end border-t md:border-t-0 pt-2 md:pt-0 mt-2 md:mt-0 border-gray-300">
            <div>
              <h2 className="text-lg md:text-2xl font-bold text-gray-400">FACTURE</h2>
              <p className="font-mono text-base md:text-xl mt-0 md:mt-1">#{orderId}</p>
            </div>
            <p className="text-xs md:text-sm text-gray-500 mt-0 md:mt-1">{date}</p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="p-4 md:p-8 border-b bg-white">
          <p className="text-xs text-gray-500 uppercase tracking-wide">الزبون</p>
          <h3 className="text-lg md:text-2xl font-bold mt-1 break-words">{customerName}</h3>
        </div>

        {/* Table Container - Responsive & Wrappable */}
        <div className="w-full overflow-x-auto bg-white">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-[10px] md:text-sm border-b">
                <th className="py-3 px-2 md:px-4 text-right">المنتج</th>
                <th className="py-3 px-1 md:px-4 text-center">الكرتون</th>
                <th className="py-3 px-1 md:px-4 text-center">القطع</th>
                <th className="py-3 px-2 md:px-4 text-left">سعر الوحدة</th>
                <th className="py-3 px-2 md:px-4 text-left">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="text-[11px] md:text-sm hover:bg-gray-50">
                  <td className="py-3 px-2 md:px-4 font-medium">
                    <div className="line-clamp-2">{item.name}</div>
                    <div className="text-[9px] md:text-xs text-gray-400 font-mono mt-0.5">{item.code}</div>
                  </td>
                  <td className="py-3 px-1 md:px-4 text-center font-bold">{item.quantityCartons}</td>
                  <td className="py-3 px-1 md:px-4 text-center text-gray-500">{item.totalPieces}</td>
                  <td className="py-3 px-2 md:px-4 text-left text-gray-500 whitespace-nowrap">{formatCurrency(item.price)}</td>
                  <td className="py-3 px-2 md:px-4 text-left font-bold whitespace-nowrap text-gray-900">{formatCurrency(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="p-4 md:p-8 bg-gray-50 flex justify-end border-t">
          <div className="w-full md:w-auto">
            <div className="flex justify-between items-center gap-8 text-lg md:text-2xl font-bold text-primary-900">
              <span>المجموع الكلي:</span>
              <span className="whitespace-nowrap">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Footer / Actions */}
        <div className="p-4 md:p-8 bg-gray-800 text-white print:hidden">
          <h4 className="text-center text-sm opacity-70 mb-4">إرسال الطلبية عبر</h4>
          <div className="flex justify-center gap-4 md:gap-6">
            <button onClick={sendWhatsApp} className="flex flex-col items-center gap-2 hover:text-green-400 transition group">
              <div className="p-3 bg-white/10 rounded-full group-hover:bg-white/20 transition"><Phone size={20} /></div>
              <span className="text-xs">WhatsApp</span>
            </button>
            <button onClick={sendViber} className="flex flex-col items-center gap-2 hover:text-purple-400 transition group">
              <div className="p-3 bg-white/10 rounded-full group-hover:bg-white/20 transition"><Share2 size={20} /></div>
              <span className="text-xs">Viber</span>
            </button>
            <button onClick={sendEmail} className="flex flex-col items-center gap-2 hover:text-blue-400 transition group">
               <div className="p-3 bg-white/10 rounded-full group-hover:bg-white/20 transition"><Mail size={20} /></div>
               <span className="text-xs">Email</span>
            </button>
          </div>
        </div>
        
        {/* Print Only Footer */}
        <div className="hidden print:block text-center p-8 text-sm text-gray-400 border-t mt-8">
          شكراً لثقتكم بشركة {COMPANY_INFO.name}
        </div>
      </div>
    </div>
  );
};
