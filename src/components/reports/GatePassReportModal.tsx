import React, { useState } from 'react';
import { 
  X, Printer, Download, Filter, Calendar, Users, 
  ShieldCheck, Clock, FileSpreadsheet, CheckCircle2,
  AlertCircle, Building2, Car, Eye
} from 'lucide-react';
import { VenusGatePass } from '../../types';
import { vmsEngine } from '../../services/vmsEngine';

interface GatePassReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBadge?: (pass: VenusGatePass) => void;
}

export const GatePassReportModal: React.FC<GatePassReportModalProps> = ({
  isOpen,
  onClose,
  onOpenBadge
}) => {
  const [filterDatePreset, setFilterDatePreset] = useState<'today' | 'all' | 'inside'>('today');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const logoConfig = vmsEngine.getLogoConfig();
  const allPasses = vmsEngine.getPasses();
  const currentUser = vmsEngine.getCurrentUser();

  if (!isOpen) return null;

  // Filtered passes
  const filteredPasses = allPasses.filter(p => {
    if (filterDatePreset === 'inside' && p.status !== 'INSIDE') return false;
    if (filterCategory !== 'all' && p.category.toLowerCase() !== filterCategory.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = 
        p.passId.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.company.toLowerCase().includes(q) ||
        p.hostName.toLowerCase().includes(q) ||
        (p.vehicle && p.vehicle.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // KPI calculations
  const totalReportPasses = filteredPasses.length;
  const insideCount = filteredPasses.filter(p => p.status === 'INSIDE').length;
  const checkoutCount = filteredPasses.filter(p => p.status === 'CHECKED_OUT').length;
  const contractorCount = filteredPasses.filter(p => p.category.toLowerCase().includes('contractor') || p.category.toLowerCase().includes('vendor')).length;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csv = 'Pass ID,Visitor Name,Phone,Company,ID Type,ID Number,Category,Host Employee,Purpose,Zone,Vehicle,Check-In,Check-Out,Status,Security Officer\n';
    filteredPasses.forEach(p => {
      csv += `"${p.passId}","${p.name}","${p.phone}","${p.company}","${p.idType}","${p.idNumber}","${p.category}","${p.hostName}","${p.purpose}","${p.accessZone}","${p.vehicle || ''}","${p.checkIn}","${p.checkOut || ''}","${p.status}","${p.guardUser}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Gate_Pass_Visitor_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const currentDateFormatted = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const currentTimeFormatted = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[96vh] overflow-hidden">
        
        {/* Modal Top Control Bar (Hidden during actual print) */}
        <div className="p-4 bg-[#1C2E63] text-white flex items-center justify-between no-print">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold tracking-tight uppercase">
                Visitor Gate Pass Register & Shift Report
              </h2>
              <p className="text-[11px] text-slate-300">
                Official shift summary & visitor logs &bull; Generated: {currentDateFormatted} {currentTimeFormatted}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 transition"
              title="Download raw report as CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow transition"
              title="Print formal report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Bar (No Print) */}
        <div className="bg-slate-50 dark:bg-slate-950/80 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setFilterDatePreset('today')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  filterDatePreset === 'today'
                    ? 'bg-[#1C2E63] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Today's Shift
              </button>
              <button
                onClick={() => setFilterDatePreset('inside')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  filterDatePreset === 'inside'
                    ? 'bg-[#1C2E63] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Currently Inside ({allPasses.filter(p => p.status === 'INSIDE').length})
              </button>
              <button
                onClick={() => setFilterDatePreset('all')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  filterDatePreset === 'all'
                    ? 'bg-[#1C2E63] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All Records
              </button>
            </div>

            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-medium outline-none"
            >
              <option value="all">All Categories</option>
              <option value="contractor">Contractors</option>
              <option value="vendor">Vendors & Suppliers</option>
              <option value="client">Clients & Auditors</option>
              <option value="interview">Job Candidates</option>
              <option value="guest">Official Guests</option>
            </select>
          </div>

          <div className="w-full sm:w-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter by name, ID, host, company..."
              className="w-full sm:w-64 px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#1C2E63]"
            />
          </div>
        </div>

        {/* Scrollable Report Sheet (Optimized for Screen & Print) */}
        <div id="printableReportDocument" className="p-4 sm:p-8 overflow-y-auto flex-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
          
          {/* Formal Company Header (Clean & Uncluttered) */}
          <div className="border-b-2 border-[#1C2E63] pb-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                {logoConfig.showLogoOnHeader && logoConfig.logoUrl && logoConfig.logoUrl !== 'DEFAULT_VENUS_SVG' ? (
                  <img src={logoConfig.logoUrl} alt="Logo" className="h-10 w-auto object-contain" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-[#1C2E63] text-white flex items-center justify-center font-black text-sm">
                    VP
                  </div>
                )}
                <div>
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-[#1C2E63] dark:text-white uppercase">
                    {logoConfig.companyName}
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    VISITOR ENTRY REGISTER & SECURITY CLEARANCE REPORT
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right text-xs">
                <div className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  REPORT REF: VMS-{new Date().getFullYear()}-{filteredPasses.length}
                </div>
                <div className="text-slate-500 text-[11px]">
                  Generated: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentDateFormatted} {currentTimeFormatted}</span>
                </div>
                <div className="text-slate-500 text-[11px]">
                  Officer in Charge: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentUser.firstName} {currentUser.lastName} ({currentUser.username})</span>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Passes</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {totalReportPasses}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">Pass records listed</span>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">Currently Inside</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                {insideCount}
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5">Active on premises</span>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/60">
              <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider block">Checked Out</span>
              <div className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-400 mt-0.5">
                {checkoutCount}
              </div>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 block mt-0.5">Surrendered & exited</span>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60">
              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">Contractor / Vendor</span>
              <div className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400 mt-0.5">
                {contractorCount}
              </div>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-0.5">Safety clearance passes</span>
            </div>
          </div>

          {/* Clean Visitor Pass Ledger Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1C2E63] text-white text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Pass ID</th>
                  <th className="py-2.5 px-3">Visitor Name</th>
                  <th className="py-2.5 px-3">Company</th>
                  <th className="py-2.5 px-3">Host / Dept</th>
                  <th className="py-2.5 px-3">Zone</th>
                  <th className="py-2.5 px-3">Check-In</th>
                  <th className="py-2.5 px-3">Check-Out</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right no-print">Badge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredPasses.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No records matched the current report criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPasses.map((p, idx) => (
                    <tr key={p.passId} className={idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-850/40'}>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#1C2E63] dark:text-blue-400 whitespace-nowrap">
                        {p.passId}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center space-x-2">
                          <img 
                            src={p.photo} 
                            alt="" 
                            className="w-6 h-6 rounded-full object-cover border border-slate-200 no-print" 
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{p.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {p.company}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        {p.hostName}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-600 dark:text-slate-400">
                        {p.accessZone}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {p.checkIn}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                        {p.checkOut || '-'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {p.status === 'INSIDE' ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            INSIDE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            CHECKED OUT
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right no-print">
                        {onOpenBadge && (
                          <button
                            onClick={() => onOpenBadge(p)}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Inspect or reprint badge"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Official Sign-Off Block for Security & HR Audit */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-6 text-center text-xs">
            <div>
              <div className="h-10 border-b border-dashed border-slate-300 dark:border-slate-700 flex items-end justify-center pb-1 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                {currentUser.username} ({currentUser.firstName} {currentUser.lastName})
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1">
                Gate Security Operator
              </span>
            </div>

            <div>
              <div className="h-10 border-b border-dashed border-slate-300 dark:border-slate-700 flex items-end justify-center pb-1 text-[11px] text-emerald-600 font-semibold">
                SYSTEM VERIFIED
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1">
                Plant HR Safety Desk
              </span>
            </div>

            <div>
              <div className="h-10 border-b border-dashed border-slate-300 dark:border-slate-700 flex items-end justify-center pb-1 text-[11px] text-slate-500 font-mono">
                {currentDateFormatted} &bull; SHIFT-01
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1">
                Chief Security Officer
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
