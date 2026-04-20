import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FiAward, FiPrinter, FiX, FiDownload, FiLoader } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import CertificateTemplate from './CertificateTemplate';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const MyCertificates = ({ certificates }) => {
  const { user } = useAuth();
  const [selectedCert, setSelectedCert] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const certificateRef = React.useRef(null);

  const handleDownloadPDF = async () => {
    if (certificateRef.current) {
      setIsDownloading(true);
      await certificateRef.current.exportAsPDF();
      setIsDownloading(false);
    }
  };

  const handleDownloadImage = async () => {
    if (certificateRef.current) {
      setIsDownloading(true);
      await certificateRef.current.exportAsImage();
      setIsDownloading(false);
    }
  };

  if (!certificates || certificates.length === 0) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-3xl font-black text-dark tracking-tight">My Certificates</h2>
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-[40px] border border-slate-100 border-dashed text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mb-6">
            <FiAward className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-dark mb-2">No certificates yet</h3>
          <p className="text-slate-500 font-medium max-w-xs mx-auto">
            Complete a course to earn your first official certificate of achievement.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-dark tracking-tight">My Certificates</h2>
        <div className="flex items-center gap-4">
           <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase">
              {certificates.length} {certificates.length === 1 ? 'Achievement' : 'Achievements'}
           </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {certificates.map((cert) => (
          <div key={cert.id} className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
            <div className="h-56 relative overflow-hidden bg-slate-900 flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 to-slate-800">
              <img 
                src={cert.img} 
                alt={cert.title} 
                className="max-w-full max-h-full object-contain opacity-40 group-hover:scale-110 group-hover:rotate-2 transition-transform duration-1000" 
              />
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                    <FiAward className="w-12 h-12 text-primary drop-shadow-[0_0_15px_rgba(255,107,0,0.5)]" />
                 </div>
              </div>
              <div className="absolute top-6 left-6">
                 <div className="px-3 py-1 bg-primary/90 backdrop-blur-md text-[10px] font-black text-white rounded-full uppercase tracking-widest">
                    Verified
                 </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-black text-dark leading-tight group-hover:text-primary transition-colors">{cert.title}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Issued By</p>
                    <p className="text-sm font-bold text-slate-700">{cert.issuer}</p>
                 </div>
                 <div className="space-y-1 text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Issued On</p>
                    <p className="text-sm font-bold text-slate-700">{cert.date}</p>
                 </div>
              </div>

               <div className="flex gap-3">
                  <button 
                    onClick={() => setSelectedCert(cert)}
                    className="flex-1 bg-dark text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 text-sm"
                  >
                     View Certificate
                  </button>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Certificate Modal - Rendered via Portal for full-screen coverage */}
      {selectedCert && createPortal(
        <div className="fixed inset-0 z-[9999] flex flex-col bg-[#0a0f18]/95 backdrop-blur-xl animate-in fade-in duration-500 overflow-hidden">
          
          {/* Modal Header Bar */}
          <div className="flex items-center justify-between p-6 bg-white shrink-0 border-b border-slate-200">
            <div className="flex items-center gap-6">
               <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <FiAward className="w-6 h-6 text-primary" />
               </div>
               <div>
                  <h3 className="text-xl font-bold text-dark">{selectedCert.title}</h3>
                  <p className="text-sm text-slate-500 font-medium italic">Accredited Certificate Preview</p>
               </div>
            </div>

            <div className="flex items-center gap-3">
               <button 
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="flex items-center gap-3 bg-primary text-white px-8 py-3 rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-xl shadow-primary/25 disabled:opacity-50 active:scale-95"
                >
                  {isDownloading ? <FiLoader className="animate-spin w-5 h-5" /> : <FiDownload className="w-5 h-5" />}
                  Download PDF
                </button>
                <button 
                  onClick={handleDownloadImage}
                  disabled={isDownloading}
                  className="flex items-center gap-3 border-2 border-slate-200 text-slate-600 px-8 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
                >
                  <FiDownload className="w-5 h-5" />
                  Save as Image
                </button>
                <button 
                  onClick={() => setSelectedCert(null)}
                  className="w-12 h-12 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all active:scale-95"
                >
                  <FiX className="w-6 h-6" />
                </button>
            </div>
          </div>

          {/* Certificate Display Area - Scrollable for fixed layout */}
          <div className="flex-1 overflow-auto p-8 md:p-16 flex justify-center bg-[#0a0f18]/50">
             <div className="h-fit">
                <CertificateTemplate 
                    ref={certificateRef} 
                    certificate={selectedCert} 
                    userName={user?.name} 
                />
             </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MyCertificates;
