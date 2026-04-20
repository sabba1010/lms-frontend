import React from 'react';
import logo from '../../assets/certificatelogo.png';

const CertificateTemplate = ({ certificate, userName }) => {
  if (!certificate) return null;

  const { title, date, id, expiryDate } = certificate;

  return (
    <div className="certificate-wrapper bg-[#f5f5f5] p-2 md:p-8 min-h-screen flex items-center justify-center print:bg-white print:p-0">
      <div 
        id="certificate-content" 
        className="certificate-container bg-white w-full max-w-[1122px] aspect-[1.414/1] p-12 flex flex-col items-center text-center relative print:shadow-none print:p-10 print:max-w-none print:w-screen print:h-screen"
        style={{ 
          height: '793px', 
          justifyContent: 'space-between',
          border: '4px solid #007A7A',
          position: 'relative'
        }}
      >
        {/* Inner Border Frame */}
        <div className="absolute inset-2 border-[1.5px] border-[#007A7A] pointer-events-none" />
        
        {/* Container for content to ensure it stays within frame */}
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-between py-6 px-12">
            {/* Top: Logo & Brand */}
            <div className="flex flex-col items-center">
                <div className="mb-6">
                    <img src={logo} alt="Logo" className="w-28 h-auto" />
                </div>
                <div className="mb-3">
                    <h2 className="text-base font-medium tracking-[0.25em] text-[#333] uppercase font-sans">
                        THE LONDON SAFEGUARDING NETWORK
                    </h2>
                </div>
                <div className="mb-0">
                    <h1 className="text-4xl font-black text-[#007A7A] tracking-normal uppercase font-sans">
                        CERTIFICATE OF ACHIEVEMENT
                    </h1>
                </div>
            </div>

            {/* Middle: Certification Details */}
            <div className="flex flex-col items-center w-full">
                <div className="mb-3">
                    <p className="text-lg font-serif italic text-[#444]">This certifies that</p>
                </div>

                <div className="mb-4">
                    <h3 className="text-[3.2rem] font-bold text-[#111] font-serif leading-tight">
                        [{userName || "Learner Name"}]
                    </h3>
                </div>

                <div className="mb-2">
                    <p className="text-lg text-[#333] font-sans">
                        has successfully completed the accredited safeguarding course
                    </p>
                </div>

                <div className="mb-4">
                    <h4 className="text-xl font-bold text-[#111] font-sans">
                        [{title || "Course Name"}]
                    </h4>
                </div>

                <div className="mb-0 max-w-3xl">
                    <p className="text-lg text-[#333] font-sans">
                        and has demonstrated satisfactory understanding of the required learning outcomes.
                    </p>
                </div>
            </div>

            {/* Bottom: Table & Signature */}
            <div className="w-full flex flex-col items-center">
                {/* Table */}
                <div className="w-full max-w-[550px] mb-8">
                    <table className="w-full text-left border-collapse border border-slate-200">
                        <tbody>
                            <tr className="border-b border-slate-200">
                                <td className="p-2 border-r border-slate-200 font-sans text-[12px] text-[#444] w-1/3 pl-4">Date Completed</td>
                                <td className="p-2 text-[#222] font-sans font-medium text-[13px] pl-4">[{date || "Insert Date"}]</td>
                            </tr>
                            <tr className="border-b border-slate-200">
                                <td className="p-2 border-r border-slate-200 font-sans text-[12px] text-[#444] pl-4">Certificate Number</td>
                                <td className="p-2 text-[#222] font-sans font-medium text-[13px] pl-4">[{id || "Insert ID"}]</td>
                            </tr>
                            <tr>
                                <td className="p-2 border-r border-slate-200 font-sans text-[12px] text-[#444] pl-4">Valid Until</td>
                                <td className="p-2 text-[#222] font-sans font-medium text-[13px] pl-4">[{expiryDate || "Optional Expiry Date"}]</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Signature */}
                <div className="flex flex-col items-center">
                  <div className="text-[12px] font-sans text-[#444] mb-1">
                    Signed: _____________________________________________
                  </div>
                  <p className="text-[12px] font-sans font-medium text-[#111]">
                      Des Webb | Training Director | The London Safeguarding Network
                  </p>
                </div>
            </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@400;500;600;700;800;900&display=swap');
        
        .certificate-container {
          font-family: 'Montserrat', sans-serif;
        }
        
        .font-serif {
          font-family: 'Libre+Baskerville', serif !important;
        }

        @media print {
          @page {
            size: landscape;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: white !important;
          }
          .certificate-wrapper {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            height: 100vh !important;
            width: 100vw !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .certificate-container {
            width: 100% !important;
            height: 100% !important;
            max-width: none !important;
            padding: 1in !important;
            box-shadow: none !important;
            border: 0 !important;
            margin: 0 !important;
            justify-content: space-between !important;
          }
          .no-print {
            display: none !important;
          }
          /* Hide app elements */
          #root > *:not(.certificate-wrapper) {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CertificateTemplate;
