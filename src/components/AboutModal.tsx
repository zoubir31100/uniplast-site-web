import React from 'react';
import { X, Phone, Mail, MapPin, Building2 } from 'lucide-react';
import { COMPANY_INFO } from '../constants';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up"
           style={{ maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div className="relative bg-blue-900 px-6 pt-8 pb-6 text-center">
          <button onClick={onClose}
            className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <X size={16} className="text-white" />
          </button>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-white/15">
            <Building2 size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-white">{COMPANY_INFO.name}</h2>
          <p className="text-blue-200 text-sm mt-1">من نحن</p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed text-justify">
            {COMPANY_INFO.description}
          </p>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">اتصل بنا</h3>

            <a href={`tel:${COMPANY_INFO.phone.replace(/\s/g, '')}`}
               className="flex items-center gap-3 p-3 rounded-2xl bg-green-50 dark:bg-green-900/20">
              <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
                <Phone size={18} className="text-white" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium">الهاتف الرئيسي</div>
                <div className="font-black text-gray-800 dark:text-gray-100" dir="ltr">{COMPANY_INFO.phone}</div>
              </div>
            </a>

            {COMPANY_INFO.commercialService && (
              <a href={`tel:${COMPANY_INFO.commercialService.replace(/\s/g, '')}`}
                 className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <Phone size={18} className="text-white" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">المصلحة التجارية</div>
                  <div className="font-black text-gray-800 dark:text-gray-100" dir="ltr">{COMPANY_INFO.commercialService}</div>
                </div>
              </a>
            )}

            <a href={`mailto:${COMPANY_INFO.email}`}
               className="flex items-center gap-3 p-3 rounded-2xl bg-purple-50 dark:bg-purple-900/20">
              <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center flex-shrink-0">
                <Mail size={18} className="text-white" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium">البريد الإلكتروني</div>
                <div className="font-bold text-gray-800 dark:text-gray-100 text-sm">{COMPANY_INFO.email}</div>
              </div>
            </a>

            <a href={COMPANY_INFO.mapsLink} target="_blank" rel="noreferrer"
               className="flex items-center gap-3 p-3 rounded-2xl bg-orange-50 dark:bg-orange-900/20">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-white" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium">العنوان — اضغط للخريطة</div>
                <div className="font-semibold text-gray-800 dark:text-gray-100 text-sm leading-tight">{COMPANY_INFO.location}</div>
              </div>
            </a>
          </div>

          <button onClick={onClose}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white py-3.5 rounded-2xl font-bold transition active:scale-95">
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
