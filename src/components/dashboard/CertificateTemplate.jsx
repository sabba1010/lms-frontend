import React from 'react';
import logo from '../../assets/certificatelogo.png';

const CertificateTemplate = ({ certificate, userName }) => {
  if (!certificate) return null;

  const { title, date, id, expiryDate } = certificate;

  return (
    <div className="certificate-container bg-white p-8 md:p-16 max-w-4xl mx-auto shadow-2xl relative border-8 border-double border-slate-100 print:shadow-none print:border-0 print:p-0">
      {/* Decorative Border Layer */}
      <div className="absolute inset-4 border-2 border-slate-200 pointer-events-none print:hidden"></div>

      <div className="relative z-10 flex flex-col items-center text-center space-y-8">
        {/* Logo Section */}
        <div className="w-48 mb-4">
          <img src={logo} alt="London Safeguarding Network Logo" className="w-full h-auto object-contain" />
        </div>

        {/* Brand Name */}
        <div className="space-y-2">
          <h2 className="text-xl md:text-2xl font-medium tracking-widest text-[#1a1a1a] uppercase">
            THE LONDON SAFEGUARDING NETWORK
          </h2>
          <div className="h-1 w-32 bg-[#008080] mx-auto"></div>
        </div>

        {/* Certificate Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-[#008080] tracking-tight uppercase leading-none">
          CERTIFICATE OF ACHIEVEMENT
        </h1>

        {/* Certification Text */}
        <div className="space-y-6 max-w-2xl">
          <p className="text-lg italic serif text-slate-600">This certifies that</p>
          
          <h3 className="text-3xl md:text-4xl font-bold text-dark border-b-2 border-slate-200 pb-2 inline-block min-w-[300px]">
            {userName || "[Learner Name]"}
          </h3>

          <p className="text-lg text-slate-700 leading-relaxed">
            has successfully completed the accredited safeguarding course
          </p>

          <h4 className="text-2xl font-bold text-dark tracking-tight">
            {title || "[Course Name]"}
          </h4>

          <p className="text-lg text-slate-700">
            and has demonstrated satisfactory understanding of the required learning outcomes.
          </p>
        </div>

        {/* Details Table */}
        <div className="w-full max-w-xl border border-slate-200 rounded-lg overflow-hidden mt-8">
          <table className="w-full text-left border-collapse">
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="p-4 bg-slate-50 font-semibold text-sm text-slate-500 uppercase tracking-wider w-1/3">Date Completed</td>
                <td className="p-4 text-dark font-medium">{date || "[Insert Date]"}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="p-4 bg-slate-50 font-semibold text-sm text-slate-500 uppercase tracking-wider">Certificate Number</td>
                <td className="p-4 text-dark font-medium">{id || "[Insert ID]"}</td>
              </tr>
              <tr>
                <td className="p-4 bg-slate-50 font-semibold text-sm text-slate-500 uppercase tracking-wider">Valid Until</td>
                <td className="p-4 text-dark font-medium">{expiryDate || "N/A"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signature Section */}
        <div className="w-full pt-12 flex flex-col items-center">
            <div className="w-64 border-t-2 border-slate-400 mb-2"></div>
            <p className="text-sm font-bold text-dark">Signed</p>
            <p className="text-xs text-slate-500 mt-2 font-medium">
                Des Webb | Training Director | The London Safeguarding Network
            </p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .certificate-container, .certificate-container * {
            visibility: visible;
          }
          .certificate-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            margin: 0;
            padding: 20px;
            box-shadow: none;
            border: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CertificateTemplate;
