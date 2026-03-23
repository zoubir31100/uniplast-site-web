import React, { useState, useRef } from 'react';
import { X, AlertTriangle, Camera, Send, Trash2, MessageCircle, Phone, CheckCircle } from 'lucide-react';
import { COMPANY_INFO } from '../constants';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// رقم الواتساب — مأخوذ من COMPANY_INFO
const getWhatsAppNumber = () => {
  // تحويل "0770 26 04 04" → "213770260404"
  const raw = COMPANY_INFO.phone.replace(/\s/g, '');
  if (raw.startsWith('0')) return '213' + raw.slice(1);
  return raw;
};

const PROBLEM_TYPES = [
  { id: 'price',    label: 'خطأ في السعر',       emoji: '💰' },
  { id: 'stock',    label: 'مشكلة في المخزون',    emoji: '📦' },
  { id: 'image',    label: 'صورة خاطئة',          emoji: '🖼️' },
  { id: 'info',     label: 'معلومات غير صحيحة',   emoji: '📋' },
  { id: 'app',      label: 'مشكلة تقنية في التطبيق', emoji: '⚙️' },
  { id: 'other',    label: 'أخرى',                emoji: '💬' },
];

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep]             = useState<'form' | 'sent'>('form');
  const [problemType, setProblemType] = useState('');
  const [description, setDescription] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageFile, setImageFile]   = useState<string | null>(null); // for display
  const [sending, setSending]       = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      setImageFile(result);
      // compress for sharing
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max = 800;
        let w = img.width, h = img.height;
        if (w > max) { h = h * max / w; w = max; }
        if (h > max) { w = w * max / h; h = max; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
        setImageBase64(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const buildMessage = () => {
    const type = PROBLEM_TYPES.find(p => p.id === problemType);
    let msg = `🔔 *إبلاغ عن مشكلة — ${COMPANY_INFO.name}*\n\n`;
    if (type) msg += `${type.emoji} *النوع:* ${type.label}\n`;
    if (description.trim()) msg += `📝 *التفاصيل:* ${description.trim()}\n`;
    msg += `\n⏰ ${new Date().toLocaleString('fr-FR')}`;
    return encodeURIComponent(msg);
  };

  const sendWhatsApp = () => {
    if (!problemType) { alert('الرجاء اختيار نوع المشكلة'); return; }
    setSending(true);
    const num = getWhatsAppNumber();
    const msg = buildMessage();
    // إذا عندنا صورة — نفتح واتساب مباشرة (الصورة يضيفها يدوياً)
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
    setTimeout(() => { setSending(false); setStep('sent'); }, 500);
  };

  const sendViber = () => {
    if (!problemType) { alert('الرجاء اختيار نوع المشكلة'); return; }
    setSending(true);
    const msg = buildMessage();
    window.open(`viber://forward?text=${msg}`, '_blank');
    setTimeout(() => { setSending(false); setStep('sent'); }, 500);
  };

  const reset = () => {
    setStep('form');
    setProblemType('');
    setDescription('');
    setImageBase64(null);
    setImageFile(null);
  };

  const handleClose = () => { reset(); onClose(); };

  // ── شاشة النجاح ──
  if (step === 'sent') return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center animate-fade-in-up">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={40} className="text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">شكراً لك!</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">تم فتح التطبيق لإرسال مشكلتك. إذا كان لديك صورة أضفها يدوياً في المحادثة.</p>
        <div className="flex gap-3">
          <button onClick={reset} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-2xl font-bold hover:bg-gray-200 transition">
            إبلاغ آخر
          </button>
          <button onClick={handleClose} className="flex-1 bg-blue-900 text-white py-3 rounded-2xl font-bold hover:bg-blue-800 transition">
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto animate-fade-in-up">

        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between rounded-t-3xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl flex items-center justify-center">
              <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 dark:text-white text-lg">إبلاغ عن مشكلة</h3>
              <p className="text-xs text-gray-400">سيصلنا عبر واتساب مباشرة</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition">
            <X size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* نوع المشكلة */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
              نوع المشكلة <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PROBLEM_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setProblemType(type.id)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border-2 text-right transition-all font-semibold text-sm ${
                    problemType === type.id
                      ? 'border-blue-900 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="text-lg flex-shrink-0">{type.emoji}</span>
                  <span className="leading-tight">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* وصف المشكلة */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              تفاصيل إضافية (اختياري)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="اكتب تفاصيل المشكلة هنا... مثال: منتج BASSINE 10L سعره خاطئ"
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:border-blue-500 resize-none transition"
              dir="rtl"
            />
          </div>

          {/* إضافة صورة */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              إضافة صورة (كابتشر) — اختياري
            </label>
            {imageFile ? (
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <img src={imageFile} alt="preview" className="w-full h-40 object-cover" />
                <button
                  onClick={() => { setImageFile(null); setImageBase64(null); }}
                  className="absolute top-2 left-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
                >
                  <Trash2 size={14} />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <p className="text-white text-xs font-bold">✓ صورة جاهزة — ستُرسل مع الرسالة</p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl py-6 flex flex-col items-center gap-2 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition group"
              >
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition">
                  <Camera size={20} className="text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                </div>
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">اضغط لإضافة صورة أو كابتشر</span>
                <span className="text-xs text-gray-400">JPG, PNG — الحجم الأقصى 5MB</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
            {imageFile && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 rounded-xl">
                ⚠️ واتساب لا يدعم إرسال الصورة تلقائياً — بعد الضغط على إرسال، أضف الصورة يدوياً في المحادثة
              </p>
            )}
          </div>

          {/* أزرار الإرسال */}
          <div className="space-y-2 pt-1">
            <button
              onClick={sendWhatsApp}
              disabled={!problemType || sending}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-base transition-all active:scale-95 shadow-lg ${
                problemType
                  ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-200 dark:shadow-green-900'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              <MessageCircle size={22} />
              {sending ? 'جاري الفتح...' : 'إرسال عبر واتساب'}
            </button>

            <button
              onClick={sendViber}
              disabled={!problemType || sending}
              className={`w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 ${
                problemType
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Phone size={18} />
              إرسال عبر Viber
            </button>

            <button onClick={handleClose} className="w-full py-3 rounded-2xl font-bold text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              إلغاء
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
