import React, { useImperativeHandle, forwardRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import logo from '../../assets/certificatelogo.png';

const CertificateTemplate = forwardRef(({ certificate, userName }, ref) => {
  if (!certificate) return null;
  const { title, date, id, expiryDate } = certificate;

  // EXPORT FUNCTIONS
  const exportAsPDF = async () => {
    const element = document.getElementById('certificate-render-area');
    if (!element) return;

    // WAIT FOR FONTS
    await document.fonts.ready;

    const canvas = await html2canvas(element, {
      scale: 3, // High quality scaling
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 1122,
      height: 793,
      windowWidth: 1122,
      windowHeight: 793
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [1122, 793]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, 1122, 793);
    pdf.save(`Certificate-${title.replace(/\s+/g, '-')}.pdf`);
  };

  const exportAsImage = async () => {
    const element = document.getElementById('certificate-render-area');
    if (!element) return;

    await document.fonts.ready;

    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      width: 1122,
      height: 793
    });

    const link = document.createElement('a');
    link.download = `Certificate-${title.replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  };

  // Expose functions to parent via ref
  useImperativeHandle(ref, () => ({
    exportAsPDF,
    exportAsImage
  }));

  return (
    <div className="certificate-outer-wrapper bg-[#f8fafc] p-4 md:p-12 min-h-screen flex items-center justify-center overflow-auto">
      {/* 
        This is the capture area. 
        It has STRICTLY FIXED dimensions to ensure 100% parity.
      */}
      <div 
        id="certificate-render-area" 
        className="certificate-container bg-white relative shadow-2xl overflow-hidden"
        style={{ 
          width: '1122px', 
          height: '793px', 
          boxSizing: 'border-box',
          border: '4px solid #007A7A',
          flexShrink: 0
        }}
      >
        {/* Double Frame Design */}
        <div 
          className="absolute border-[1.5px] border-[#007A7A] pointer-events-none" 
          style={{ 
            top: '8px', 
            left: '8px', 
            right: '8px', 
            bottom: '8px' 
          }} 
        />
        
        {/* Main Content Layout */}
        <div 
          className="relative z-10 w-full h-full flex flex-col items-center justify-between"
          style={{ padding: '60px 80px' }}
        >
            {/* 1. Logo & Brand Header */}
            <div className="flex flex-col items-center">
                <img 
                    src={logo} 
                    alt="Network Logo" 
                    style={{ width: '100px', height: 'auto', marginBottom: '24px' }} 
                />
                <h2 
                    style={{ 
                        fontFamily: 'Montserrat, sans-serif',
                        fontSize: '14px', 
                        fontWeight: '600',
                        color: '#333',
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                        marginBottom: '8px'
                    }}
                >
                    The London Safeguarding Network
                </h2>
                <h1 
                    style={{ 
                        fontFamily: 'Montserrat, sans-serif',
                        fontSize: '44px', 
                        fontWeight: '900',
                        color: '#007A7A',
                        textTransform: 'uppercase',
                        margin: 0,
                        lineHeight: '1.2'
                    }}
                >
                    Certificate of Achievement
                </h1>
            </div>

            {/* 2. Body / Certification Info */}
            <div className="flex flex-col items-center text-center">
                <p 
                    style={{ 
                        fontFamily: "'Libre Baskerville', serif",
                        fontSize: '20px', 
                        fontStyle: 'italic',
                        color: '#444',
                        marginBottom: '20px'
                    }}
                >
                    This certifies that
                </p>
                <h3 
                    style={{ 
                        fontFamily: "'Libre Baskerville', serif",
                        fontSize: '56px', 
                        fontWeight: '700',
                        color: '#111',
                        marginBottom: '24px',
                        lineHeight: '1'
                    }}
                >
                    {userName || "[Learner Name]"}
                </h3>
                <p 
                    style={{ 
                        fontFamily: 'Montserrat, sans-serif',
                        fontSize: '18px', 
                        color: '#333',
                        marginBottom: '8px'
                    }}
                >
                    has successfully completed the accredited safeguarding course
                </p>
                <h4 
                    style={{ 
                        fontFamily: 'Montserrat, sans-serif',
                        fontSize: '24px', 
                        fontWeight: '700',
                        color: '#111',
                        marginBottom: '16px'
                    }}
                >
                    {title || "[Course Title]"}
                </h4>
                <p 
                    style={{ 
                        fontFamily: 'Montserrat, sans-serif',
                        fontSize: '16px', 
                        color: '#555',
                        maxWidth: '750px',
                        lineHeight: '1.6'
                    }}
                >
                    and has demonstrated satisfactory understanding of the required learning outcomes as set out by the UK safeguarding standards.
                </p>
            </div>

            {/* 3. Table & Signature Footer */}
            <div className="w-full flex flex-col items-center">
                {/* Information Table */}
                <div style={{ width: '550px', marginBottom: '40px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <tbody>
                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '8px 16px', borderRight: '1px solid #e2e8f0', fontFamily: 'Montserrat, sans-serif', fontSize: '11px', color: '#666', width: '40%', fontWeight: '600' }}>Date Completed</td>
                                <td style={{ padding: '8px 16px', fontFamily: 'Montserrat, sans-serif', fontSize: '13px', color: '#111', fontWeight: '700' }}>{date || "[DD MM YYYY]"}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '8px 16px', borderRight: '1px solid #e2e8f0', fontFamily: 'Montserrat, sans-serif', fontSize: '11px', color: '#666', fontWeight: '600' }}>Certificate ID</td>
                                <td style={{ padding: '8px 16px', fontFamily: 'Montserrat, sans-serif', fontSize: '13px', color: '#111', fontWeight: '700' }}>{id || "[Unique ID]"}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '8px 16px', borderRight: '1px solid #e2e8f0', fontFamily: 'Montserrat, sans-serif', fontSize: '11px', color: '#666', fontWeight: '600' }}>Valid Until</td>
                                <td style={{ padding: '8px 16px', fontFamily: 'Montserrat, sans-serif', fontSize: '13px', color: '#111', fontWeight: '700' }}>{expiryDate || "Lifetime Validity"}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Signature Line */}
                <div className="flex flex-col items-center">
                  <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '12px', color: '#444', marginBottom: '8px' }}>
                    Signed: ____________________________________________________
                  </div>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '12px', fontWeight: '700', color: '#111', margin: 0 }}>
                      Des Webb | Training Director | The London Safeguarding Network
                  </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
});

export default CertificateTemplate;
