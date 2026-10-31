import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Reveal } from '../motion/Reveal';
import { AnimatedNumber } from '../motion/AnimatedNumber';

export const AnalyticsView: React.FC = () => {
  const { clinics, medicines, transfers, impactMetrics } = useApp();

  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // Export audit log as CSV
  const handleExportCSV = () => {
    const headers = [
      'Transfer ID',
      'Timestamp',
      'Medicine ID',
      'Medicine Name',
      'Donor Clinic Code',
      'Donor Clinic Name',
      'Recipient Clinic Code',
      'Recipient Clinic Name',
      'Quantity',
      'Batch Number',
      'Distance (km)',
      'Est Transit (mins)',
      'Priority',
      'Emergency Flag',
      'Notes',
    ];

    const rows = transfers.map((t) => {
      const med = medicines.find((m) => m.id === t.medicineId);
      const donor = clinics.find((c) => c.id === t.donorClinicId);
      const recipient = clinics.find((c) => c.id === t.recipientClinicId);

      return [
        `"${t.id}"`,
        `"${t.timestamp}"`,
        `"${t.medicineId}"`,
        `"${med?.name || ''}"`,
        `"${donor?.code || ''}"`,
        `"${donor?.name || ''}"`,
        `"${recipient?.code || ''}"`,
        `"${recipient?.name || ''}"`,
        t.quantity,
        `"${t.batchNumber}"`,
        t.distanceKm,
        t.estimatedTransitMinutes,
        `"${t.urgency}"`,
        t.isEmergency ? 'YES' : 'NO',
        `"${(t.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mediroute_manifest_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadNotice('Transfer manifest exported successfully as CSV.');
    setTimeout(() => setDownloadNotice(null), 4000);
  };

  // Group transfer history by medicine for analytics
  const transfersByMedicine = React.useMemo(() => {
    const map = new Map<string, { name: string; units: number; count: number }>();
    for (const t of transfers) {
      const med = medicines.find((m) => m.id === t.medicineId);
      const name = med?.name.split(' ')[0] || t.medicineId;
      if (!map.has(t.medicineId)) {
        map.set(t.medicineId, { name, units: 0, count: 0 });
      }
      const entry = map.get(t.medicineId)!;
      entry.units += t.quantity;
      entry.count += 1;
    }
    return Array.from(map.values());
  }, [transfers, medicines]);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <Reveal>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#2D3142]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2C3480] inline-block" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#A0A0AA] font-medium">
                Section 05 • Regional Ledger &amp; Accounting
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-white tracking-tight font-normal">
              Impact Metrics &amp; Audit Ledger
            </h1>
            <p className="text-xs sm:text-sm text-[#A0A0AA] mt-1 max-w-2xl font-sans leading-relaxed">
              Estimated operational savings, prevented clinical stockouts, and verifiable transfer audit ledger.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 bg-[#2C3480] hover:bg-[#232a6b] text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer self-start sm:self-auto shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C3480] focus-visible:ring-offset-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-white" />
            <span>Export Manifest (.CSV)</span>
          </button>
        </div>
      </Reveal>

      {downloadNotice && (
        <div className="p-3 rounded-lg bg-[#16815D]/20 border border-[#16815D]/40 text-[#5AA98C] text-xs flex items-center gap-2.5 shadow-sm font-sans">
          <CheckCircle2 className="w-4 h-4 text-[#5AA98C] flex-shrink-0" />
          <span className="font-medium">{downloadNotice}</span>
        </div>
      )}

      {/* Clear Model / Simulation Notice */}
      <Reveal delay={40}>
        <div className="bg-[#171923] border border-[#2D3142] rounded-lg p-4 flex items-start gap-3 shadow-sm">
          <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-[#A0A0AA] leading-relaxed font-sans">
            <strong className="text-white font-mono uppercase tracking-wider text-[11px] block mb-0.5 font-bold">
              Simulated Impact Methodology:
            </strong>
            All figures represent estimated outcomes derived from synthetic redistribution simulations. Economic valuations reflect standard wholesale acquisition benchmarks and do not constitute certified clinical accounting.
          </p>
        </div>
      </Reveal>

      {/* KPI Grid */}
      <Reveal delay={80}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#171923] rounded-lg p-5 border border-[#2D3142] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#A0A0AA]">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#A0A0AA] font-bold">Stockouts Averted</span>
              <div className="w-7 h-7 rounded-lg bg-[#16815D]/20 flex items-center justify-center text-[#5AA98C] border border-[#16815D]/40">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl text-white tabular-nums font-normal">
                  <AnimatedNumber value={impactMetrics.projectedStockoutsPrevented} />
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#16815D]/20 text-[#5AA98C] border border-[#16815D]/40 font-semibold">Model Est.</span>
              </div>
              <p className="text-xs text-[#A0A0AA] mt-1.5 font-sans">
                Estimated stockout risks neutralized by redistribution
              </p>
            </div>
          </div>

          <div className="bg-[#171923] rounded-lg p-5 border border-[#2D3142] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#A0A0AA]">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#A0A0AA] font-bold">Confirmed Transfers</span>
              <div className="w-7 h-7 rounded-lg bg-[#2C3480]/30 flex items-center justify-center text-blue-300 border border-[#2C3480]">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif text-3xl text-white tabular-nums font-normal">
                  <AnimatedNumber value={impactMetrics.completedUnitsRedistributed} />
                </span>
                <span className="text-xs text-[#A0A0AA] font-mono">units</span>
              </div>
              <p className="text-xs text-[#A0A0AA] mt-1.5 font-sans">
                Across <strong className="text-white font-mono">{impactMetrics.completedTransfersCount}</strong> verified dispatches
              </p>
            </div>
          </div>

          <div className="bg-[#171923] rounded-lg p-5 border border-[#2D3142] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#A0A0AA]">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#A0A0AA] font-bold">Expiring Stock Rescued</span>
              <div className="w-7 h-7 rounded-lg bg-[#2C3480]/30 flex items-center justify-center text-blue-300 border border-[#2C3480]">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif text-3xl text-white tabular-nums font-normal">
                  <AnimatedNumber value={impactMetrics.expiringStockRescuedUnits} />
                </span>
                <span className="text-xs text-[#A0A0AA] font-mono">units</span>
              </div>
              <p className="text-xs text-[#A0A0AA] mt-1.5 font-sans">
                Reallocated before batch shelf-life expiry
              </p>
            </div>
          </div>

          <div className="bg-[#171923] rounded-lg p-5 border border-[#2D3142] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#A0A0AA]">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#A0A0AA] font-bold">Economic Value</span>
              <div className="w-7 h-7 rounded-lg bg-[#16815D]/20 flex items-center justify-center text-[#5AA98C] border border-[#16815D]/40">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="font-serif text-3xl text-[#5AA98C] tabular-nums font-normal">
                $<AnimatedNumber value={impactMetrics.completedEconomicValue} />
              </span>
              <p className="text-xs text-[#A0A0AA] mt-1.5 font-sans">
                Physical inventory kept in active service
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Chart Section: Volume by Medicine */}
      {transfersByMedicine.length > 0 && (
        <Reveal delay={120}>
          <div className="bg-[#171923] rounded-lg p-6 shadow-sm border border-[#2D3142]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#2D3142]">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#A0A0AA] font-bold mb-0.5">Dispatch Quantities</div>
                <h3 className="font-serif text-lg text-white">
                  Redistributed Volume by Medicine
                </h3>
                <p className="text-xs text-[#A0A0AA] font-sans">Total units safely transferred across network</p>
              </div>
              <span className="text-xs font-mono font-medium text-blue-300 bg-[#222431] px-2.5 py-1 rounded-lg border border-[#2D3142]">
                Audit History
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transfersByMedicine} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#A0A0AA' }} stroke="#2D3142" />
                  <YAxis tick={{ fontSize: 11, fill: '#A0A0AA' }} stroke="#2D3142" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171923',
                      border: '1px solid #2D3142',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontFamily: 'sans-serif',
                    }}
                  />
                  <Bar dataKey="units" fill="#2C3480" radius={[4, 4, 0, 0]} name="Units Transferred" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Reveal>
      )}

      {/* Transfer Audit Ledger Table */}
      <Reveal delay={160}>
        <div className="bg-[#171923] rounded-lg shadow-sm overflow-hidden border border-[#2D3142]">
          <div className="p-5 border-b border-[#2D3142] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#222431]">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#A0A0AA] font-bold mb-0.5">Session Manifest</div>
              <h3 className="font-serif text-lg text-white">
                Clinical Transfer Audit Manifest
              </h3>
              <p className="text-xs text-[#A0A0AA] font-sans">
                Complete historical record of confirmed inter-facility medicine dispatches
              </p>
            </div>
            <span className="text-xs font-mono text-white bg-[#171923] px-2.5 py-1 rounded-lg border border-[#2D3142] self-start sm:self-auto">
              {transfers.length} Recorded Transfers
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#222431] border-b border-[#2D3142] text-[11px] font-mono uppercase tracking-wider text-[#A0A0AA]">
                  <th className="py-3 px-4 font-bold">Timestamp</th>
                  <th className="py-3 px-4 font-bold">Medicine</th>
                  <th className="py-3 px-4 font-bold">Donor Clinic</th>
                  <th className="py-3 px-4 font-bold">Recipient Clinic</th>
                  <th className="py-3 px-4 font-bold">Quantity</th>
                  <th className="py-3 px-4 font-bold">Batch Lot</th>
                  <th className="py-3 px-4 font-bold">Logistics</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D3142] text-xs">
                {transfers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-[#A0A0AA] font-sans">
                      No confirmed transfers recorded in this session. Confirm algorithmic recommendations or execute transfers to populate this ledger.
                    </td>
                  </tr>
                ) : (
                  transfers.map((t) => {
                    const med = medicines.find((m) => m.id === t.medicineId);
                    const donor = clinics.find((c) => c.id === t.donorClinicId);
                    const recipient = clinics.find((c) => c.id === t.recipientClinicId);

                    return (
                      <tr key={t.id} className="hover:bg-[#222431]/60 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-[#A0A0AA] whitespace-nowrap">
                          {new Date(t.timestamp).toLocaleDateString()}{' '}
                          {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-serif text-sm text-white">{med?.name}</div>
                          <div className="text-[11px] text-[#A0A0AA] font-sans">{med?.dosageForm}</div>
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <span className="font-mono font-bold text-white">{donor?.code}</span>
                          <div className="text-[11px] text-[#A0A0AA] truncate max-w-[120px]">
                            {donor?.name}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <span className="font-mono font-bold text-white">{recipient?.code}</span>
                          <div className="text-[11px] text-[#A0A0AA] truncate max-w-[120px]">
                            {recipient?.name}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span className="font-bold text-[#5AA98C] text-sm tabular-nums">{t.quantity}</span>{' '}
                          <span className="text-[11px] text-[#A0A0AA] font-medium font-sans">{med?.unit}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-white">
                          {t.batchNumber}
                        </td>
                        <td className="py-3 px-4 text-[#A0A0AA] text-xs font-mono">
                          <div>{t.distanceKm} km</div>
                          <div className="text-[#A0A0AA] text-[11px]">~{t.estimatedTransitMinutes} mins</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 font-sans">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-mono text-[#5AA98C] bg-[#16815D]/20 border border-[#16815D]/40">
                              <CheckCircle2 className="w-3 h-3 text-[#5AA98C]" />
                              Completed
                            </span>
                            {t.isEmergency && (
                              <span className="px-2 py-0.5 rounded-lg text-[11px] font-mono text-[#FF6B72] bg-[#BB232B]/20 border border-[#BB232B]/40 font-bold uppercase tracking-wider">
                                Emergency
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>
    </div>
  );
};
