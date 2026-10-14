import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Printer, Shield } from 'lucide-react';
import { VenusGatePass } from '../../types';
import { vmsEngine } from '../../services/vmsEngine';

interface PrintableBadgeModalProps {
  pass: VenusGatePass | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintableBadgeModal: React.FC<PrintableBadgeModalProps> = ({ pass, isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const logoConfig = vmsEngine.getLogoConfig();

  useEffect(() => {
    if (isOpen && pass && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        `VENUS_GATE_PASS:${pass.passId}|${pass.name}|STATUS:VERIFIED|HOST:${pass.hostName}`,
        {
          width: 80,
          margin: 1,
          color: {
            dark: '#1C2E63',
            light: '#ffffff'
          }
        },
        (err) => {
          if (err) console.error(err);
        }
      );
    }
  }, [isOpen, pass]);

  if (!isOpen || !pass) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="p-3.5 bg-[#1C2E63] text-white flex items-center justify-between no-print">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-xs uppercase tracking-wider">Gate Badge Print Dispatch</span>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Badge Container */}
        <div className="p-6 overflow-y-auto flex justify-center bg-slate-100 dark:bg-slate-950">
          {/* Physical CR-80 Card */}
          <div id="printableBadgeSection" className="bg-white rounded-xl shadow-xl border-2 border-[#1C2E63] w-72 overflow-hidden text-slate-900 relative">
            {/* Lanyard Hole Mockup */}
            <div className="h-2 w-10 bg-slate-300 rounded-full mx-auto mt-2 no-print" />

            {/* Top Brand Banner */}
            <div 
              className="p-2.5 text-center text-white border-b border-amber-300 flex flex-col items-center justify-center relative overflow-hidden"
              style={{ backgroundColor: logoConfig.primaryColor || '#1C2E63' }}
            >
              {logoConfig.showLogoOnBadge && logoConfig.logoUrl && logoConfig.logoUrl !== 'DEFAULT_VENUS_SVG' && (
                <img src={logoConfig.logoUrl} alt="Badge Logo" className="h-6 w-auto mb-1 object-contain filter drop-shadow" />
              )}
              <h2 className="text-[9px] font-black tracking-widest uppercase">{logoConfig.companyName}</h2>
              <h3 className="text-xs font-black text-amber-300 tracking-wider uppercase mt-0.5">
                {pass.category ? pass.category.toUpperCase() : 'OFFICIAL PASS'}
              </h3>
              <p className="text-[10px] font-mono text-white font-bold">{pass.passId}</p>
            </div>

            {/* Details */}
            <div className="p-4 flex flex-col items-center text-center">
              <img
                src={pass.photo}
                alt="Visitor"
                className="w-20 h-20 rounded-lg object-cover border-2 border-slate-300 mb-2 bg-slate-100"
              />

              <h4 className="font-black text-sm text-slate-900 leading-tight">{pass.name}</h4>
              <p className="text-xs font-bold text-slate-500 uppercase">{pass.company}</p>

              <div className="w-full mt-2.5 grid grid-cols-2 gap-1 text-[9px] bg-slate-50 p-2 rounded border border-slate-200 text-left">
                <div>
                  <span className="text-slate-400 font-bold block">HOST:</span>
                  <span className="font-bold text-slate-900 truncate block">{pass.hostName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">DATE:</span>
                  <span className="font-bold text-slate-900 font-mono">{new Date().toLocaleDateString('en-GB')}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">VEHICLE:</span>
                  <span className="font-bold text-slate-900 font-mono">{pass.vehicle || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">GUARD:</span>
                  <span className="font-bold text-slate-900 font-mono">{pass.guardUser}</span>
                </div>
              </div>

              {/* QR and Barcode */}
              <div className="mt-3 flex items-center justify-between w-full pt-2 border-t border-slate-200">
                <canvas ref={canvasRef} className="rounded" />
                <div className="text-right">
                  <div className="w-20 h-4 barcode-lines" />
                  <span className="text-[7px] font-mono text-slate-500 uppercase block mt-0.5">
                    AUTHORISED PASS
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-center py-1.5 text-[7px] font-mono text-slate-300 tracking-wider">
              OFFICIAL VISITOR PASS &bull; SURRENDER AT EXIT
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between no-print">
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-1.5 bg-[#1C2E63] hover:bg-[#152146] text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Badge</span>
          </button>
        </div>

      </div>
    </div>
  );
};
