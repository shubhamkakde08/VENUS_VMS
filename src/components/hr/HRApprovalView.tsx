import React, { useState } from 'react';
import { 
  Users, CheckCircle2, AlertTriangle, ShieldCheck, 
  Clock, CalendarCheck, Search, Filter, ShieldAlert, FileSpreadsheet
} from 'lucide-react';
import { vmsEngine } from '../../services/vmsEngine';
import { VenusGatePass } from '../../types';
import { GatePassReportModal } from '../reports/GatePassReportModal';

export const HRApprovalView: React.FC = () => {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const passes = vmsEngine.getPasses();
  const activeInside = passes.filter(p => p.status === 'INSIDE');

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Scheduled Today</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">14 Pre-Approved</h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{activeInside.length} Arrived at Main Gate</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#1C2E63] dark:text-blue-400 flex items-center justify-center text-xl">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Contractor Clearances</span>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">2 Requests</h3>
            <p className="text-[11px] text-slate-500 mt-1">Contractor safety EHS verification</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">EHS Flagged Incidents</span>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">0 Incidents</h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">All PPE protocols strictly adhered</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Department Visitor Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Departmental Visitor Distribution &amp; Safety Zones
            </h3>
            <p className="text-xs text-slate-500">Live headcount allocation across manufacturing floors</p>
          </div>
          <button
            onClick={() => setIsReportOpen(true)}
            className="px-3.5 py-1.5 bg-[#1C2E63] hover:bg-[#152146] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto shadow-xs transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Generate Visitor Shift Report</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block font-medium">Seamless Pipes Mill</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white block mt-1">5 Visitors</span>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-[#1C2E63] dark:bg-blue-500 h-full w-2/3" />
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block font-medium">Welded Tubes Mill</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white block mt-1">3 Visitors</span>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-[#1C2E63] dark:bg-blue-500 h-full w-1/2" />
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block font-medium">Quality & NDT Lab</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white block mt-1">2 Auditors</span>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-amber-500 h-full w-1/3" />
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block font-medium">HR & Executive Block</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white block mt-1">4 Guests</span>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-full w-3/4" />
            </div>
          </div>
        </div>
      </div>

      {/* Official Shift Visitor Report Modal */}
      <GatePassReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </div>
  );
};
