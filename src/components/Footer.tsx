import React, { useState } from 'react';
import { MapPin, Phone, Mail, Store, AlertTriangle } from 'lucide-react';
import { ReportModal } from './ReportModal';
import { COMPANY_INFO } from '../constants';

export const Footer: React.FC = () => {
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <>
    <footer className="bg-gray-900 text-gray-300 py-12 mt-12 no-print">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 text-white mb-4">
              <Store size={28} className="text-primary-500" />
              {/* Note: User can replace this with <img src="/logo.png" /> if they host it */}
              <h2 className="text-2xl font-bold">UNIPLAST</h2>
            </div>
            <p className="text-sm leading-relaxed text-gray-400 mb-4 text-justify">
              {COMPANY_INFO.description}
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4 border-b border-gray-700 pb-2 inline-block">اتصل بنا</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="text-primary-500 flex-shrink-0 mt-1" size={18} />
                <span>{COMPANY_INFO.location}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-primary-500 flex-shrink-0" size={18} />
                <div className="flex flex-col" dir="ltr">
                  <a href={`tel:${COMPANY_INFO.phone.replace(/\s/g, '')}`} className="hover:text-white transition">{COMPANY_INFO.phone}</a>
                  <a href={`tel:${COMPANY_INFO.commercialService.replace(/\s/g, '')}`} className="hover:text-white transition text-xs text-gray-500">Service Commercial: {COMPANY_INFO.commercialService}</a>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-primary-500 flex-shrink-0" size={18} />
                <a href={`mailto:${COMPANY_INFO.email}`} className="hover:text-white transition">{COMPANY_INFO.email}</a>
              </li>
            </ul>
          </div>

          {/* Links & Maps */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4 border-b border-gray-700 pb-2 inline-block">روابط سريعة</h3>
            <div className="space-y-3">
              <a 
                href={COMPANY_INFO.mapsLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg transition group"
              >
                <MapPin size={20} className="text-red-500 group-hover:scale-110 transition-transform" />
                <span>موقعنا على الخريطة (Google Maps)</span>
              </a>
              
              <button 
                onClick={() => setReportOpen(true)}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg transition group w-full"
              >
                <AlertTriangle size={20} className="text-yellow-500 group-hover:scale-110 transition-transform" />
                <span>إبلاغ عن مشكلة</span>
              </button>
            </div>
          </div>

        </div>
        
        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} {COMPANY_INFO.name}. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
    <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} />
  </>
  );
};