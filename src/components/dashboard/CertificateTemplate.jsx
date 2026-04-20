import React from 'react';
import logo from '../../assets/certificatelogo.png';

const CertificateTemplate = ({ certificate, userName }) => {
  if (!certificate) return null;

  const { title, date, id, expiryDate } = certificate;

  return (
    <div className="certificate-wrapper bg-[#f5f5f5] p-2 md:p-8 min-h-screen flex items-center justify-center print:bg-white print:p-0">
      <div id="certificate-content" className="certificate-container bg-white w-full max-w-[1100px] aspect-[1.414/1] p-16 md:p-24 shadow-2xl flex flex-col items-center text-center relative print:shadow-none print:p-12 print:max-w-none print:w-screen print:h-screen">
        
        {/* 1. Logo */}
        <div className="mb-6">
          <img src={logo} alt="Logo" className="w-48 h-auto" />
        </div>

        {/* 2. Brand Name */}
        <div className="mb-4">
          <h2 className="text-lg md:text-xl font-medium tracking-[0.3em] text-[#333] uppercase font-sans">
            THE LONDON SAFEGUARDING NETWORK
          </h2>
        </div>

        {/* 3. Main Title */}
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-[#007A7A] tracking-tighter uppercase font-sans">
            CERTIFICATE OF ACHIEVEMENT
          </h1>
        </div>

        {/* 4. Sub-text */}
        <div className="mb-4">
          <p className="text-xl font-serif italic text-[#444]">This certifies that</p>
        </div>

        {/* 5. Learner Name */}
        <div className="mb-6">
          <h3 className="text-5xl md:text-6xl font-normal text-[#111] font-serif tracking-tight">
            [{userName || "Learner Name"}]
          </h3>
        </div>

        {/* 6. Success phrase */}
        <div className="mb-2">
          <p className="text-xl text-[#333] font-medium leading-relaxed">
            has successfully completed the accredited safeguarding course
          </p>
        </div>

        {/* 7. Course Name */}
        <div className="mb-8">
          <h4 className="text-2xl md:text-3xl font-bold text-[#111] tracking-tight">
            [{title || "Course Name"}]
          </h4>
        </div>

        {/* 8. Outcome text */}
        <div className="mb-12 max-w-3xl">
          <p className="text-xl text-[#333] font-medium">
            and has demonstrated satisfactory understanding of the required learning outcomes.
          </p>
        </div>

        {/* 9. Data Table */}
        <div className="w-full max-w-2xl mb-16">
          <table className="w-full text-left border-collapse border border-slate-300">
            <tbody>
              <tr className="border-b border-slate-300">
                <td className="p-3 border-r border-slate-300 font-medium text-sm text-[#444] w-1/3">Date Completed</td>
                <td className="p-3 text-[#111] font-medium">[{date || "Insert Date"}]</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="p-3 border-r border-slate-300 font-medium text-sm text-[#444]">Certificate Number</td>
                <td className="p-3 text-[#111] font-medium">[{id || "Insert ID"}]</td>
              </tr>
              <tr>
                <td className="p-3 border-r border-slate-300 font-medium text-sm text-[#444]">Valid Until</td>
                <td className="p-3 text-[#111] font-medium">[{expiryDate || "Optional Expiry Date"}]</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 10. Signature Section */}
        <div className="w-full flex flex-col items-center mt-auto">
            <div className="flex flex-col items-center">
              <div className="text-sm font-medium text-[#444] mb-2">
                Signed: _____________________________________________
              </div>
              <p className="text-sm font-medium text-[#111] tracking-wide">
                  Des Webb | Training Director | The London Safeguarding Network
              </p>
            </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@400;500;600;700;800&display=swap');
        
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
