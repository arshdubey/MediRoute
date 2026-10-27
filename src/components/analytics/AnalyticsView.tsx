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
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-concrete">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-ink inline-block" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-medium">
                Section 05 • Regional Ledger &amp; Accounting
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-ink tracking-tight font-normal">
              Impact Metrics &amp; Audit Ledger
            </h1>
            <p className="text-xs sm:text-sm text-graphite mt-1 max-w-2xl font-sans leading-relaxed">
              Estimated operational savings, prevented clinical stockouts, and verifiable transfer audit ledger.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 bg-ink hover:bg-black text-white font-medium text-xs px-3.5 py-2 rounded transition-colors cursor-pointer self-start sm:self-auto shadow-xs active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-white" />
            <span>Export Manifest (.CSV)</span>
          </button>
        </div>
      </Reveal>

      {downloadNotice && (
        <div className="p-3 rounded bg-clinicalGreen/10 border border-clinicalGreen/30 text-clinicalGreen text-xs flex items-center gap-2.5 shadow-xs font-sans">
          <CheckCircle2 className="w-4 h-4 text-clinicalGreen flex-shrink-0" />
          <span className="font-medium">{downloadNotice}</span>
        </div>
      )}

      {/* Clear Model / Simulation Notice */}
      <Reveal delay={40}>
        <div className="bg-paper border border-concrete rounded p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-muted mt-0.5 flex-shrink-0" />
          <p className="text-xs text-graphite leading-relaxed font-sans">
            <strong className="text-ink font-mono uppercase tracking-wider text-[11px] block mb-0.5 font-bold">
              Simulated Impact Methodology:
            </strong>
            All figures represent estimated outcomes derived from synthetic redistribution simulations. Economic valuations reflect standard wholesale acquisition benchmarks and do not constitute certified clinical accounting.
          </p>
        </div>
      </Reveal>

      {/* KPI Grid */}
      <Reveal delay={80}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded p-5 border border-concrete shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold">Stockouts Averted</span>
              <div className="w-7 h-7 rounded bg-paper flex items-center justify-center text-clinicalGreen border border-concrete">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl text-ink tabular-nums font-normal">
                  <AnimatedNumber value={impactMetrics.projectedStockoutsPrevented} />
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-clinicalGreen/10 text-clinicalGreen border border-clinicalGreen/30">Model Est.</span>
              </div>
              <p className="text-xs text-graphite mt-1.5 font-sans">
                Estimated stockout risks neutralized by redistribution
              </p>
            </div>
          </div>

          <div className="bg-white rounded p-5 border border-concrete shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold">Confirmed Transfers</span>
              <div className="w-7 h-7 rounded bg-paper flex items-center justify-center text-ink border border-concrete">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif text-3xl text-ink tabular-nums font-normal">
                  <AnimatedNumber value={impactMetrics.completedUnitsRedistributed} />
                </span>
                <span className="text-xs text-muted font-mono">units</span>
              </div>
              <p className="text-xs text-graphite mt-1.5 font-sans">
                Across <strong className="text-ink font-mono">{impactMetrics.completedTransfersCount}</strong> verified demo transfers
              </p>
            </div>
          </div>

          <div className="bg-white rounded p-5 border border-concrete shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold">Expiring Stock Rescued</span>
              <div className="w-7 h-7 rounded bg-paper flex items-center justify-center text-ink border border-concrete">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif text-3xl text-ink tabular-nums font-normal">
                  <AnimatedNumber value={impactMetrics.expiringStockRescuedUnits} />
                </span>
                <span className="text-xs text-muted font-mono">units</span>
              </div>
              <p className="text-xs text-graphite mt-1.5 font-sans">
                Reallocated before batch shelf-life expiry
              </p>
            </div>
          </div>

          <div className="bg-white rounded p-5 border border-concrete shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold">Economic Value</span>
              <div className="w-7 h-7 rounded bg-paper flex items-center justify-center text-clinicalGreen border border-concrete">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="font-serif text-3xl text-clinicalGreen tabular-nums font-normal">
                $<AnimatedNumber value={impactMetrics.completedEconomicValue} />
              </span>
              <p className="text-xs text-graphite mt-1.5 font-sans">
                Physical inventory kept in active service
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Chart Section: Volume by Medicine */}
      {transfersByMedicine.length > 0 && (
        <Reveal delay={120}>
          <div className="bg-white rounded p-6 shadow-xs border border-concrete">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-concrete">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold mb-0.5">Dispatch Quantities</div>
                <h3 className="font-serif text-lg text-ink">
                  Redistributed Volume by Medicine
                </h3>
                <p className="text-xs text-graphite font-sans">Total units safely transferred across network</p>
              </div>
              <span className="text-xs font-mono font-medium text-ink bg-paper px-2.5 py-1 rounded border border-concrete">
                Audit History
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transfersByMedicine} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#77766F' }} stroke="#E5E3DC" />
                  <YAxis tick={{ fontSize: 11, fill: '#77766F' }} stroke="#E5E3DC" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#142536',
                      border: '1px solid #20364A',
                      borderRadius: '4px',
                      color: '#F7F5F0',
                      fontSize: '12px',
                      fontFamily: 'sans-serif',
                    }}
                  />
                  <Bar dataKey="units" fill="#142536" radius={[2, 2, 0, 0]} name="Units Transferred" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Reveal>
      )}

      {/* Transfer Audit Ledger Table */}
      <Reveal delay={160}>
        <div className="bg-white rounded shadow-xs overflow-hidden border border-concrete">
          <div className="p-5 border-b border-concrete flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-paper">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold mb-0.5">Session Manifest</div>
              <h3 className="font-serif text-lg text-ink">
                Clinical Transfer Audit Manifest
              </h3>
              <p className="text-xs text-graphite font-sans">
                Complete historical record of confirmed inter-facility medicine dispatches
              </p>
            </div>
            <span className="text-xs font-mono text-ink bg-white px-2.5 py-1 rounded border border-concrete self-start sm:self-auto">
              {transfers.length} Recorded Transfers
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-paper border-b border-concrete text-[11px] font-mono uppercase tracking-wider text-muted">
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
              <tbody className="divide-y divide-concrete text-xs">
                {transfers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-muted font-sans">
                      No confirmed transfers recorded in this session. Confirm algorithmic recommendations or execute transfers to populate this ledger.
                    </td>
                  </tr>
                ) : (
                  transfers.map((t) => {
                    const med = medicines.find((m) => m.id === t.medicineId);
                    const donor = clinics.find((c) => c.id === t.donorClinicId);
                    const recipient = clinics.find((c) => c.id === t.recipientClinicId);

                    return (
                      <tr key={t.id} className="hover:bg-paper/70 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-muted whitespace-nowrap">
                          {new Date(t.timestamp).toLocaleDateString()}{' '}
                          {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-serif text-sm text-ink">{med?.name}</div>
                          <div className="text-[11px] text-muted font-sans">{med?.dosageForm}</div>
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <span className="font-mono font-bold text-ink">{donor?.code}</span>
                          <div className="text-[11px] text-muted truncate max-w-[120px]">
                            {donor?.name}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <span className="font-mono font-bold text-ink">{recipient?.code}</span>
                          <div className="text-[11px] text-muted truncate max-w-[120px]">
                            {recipient?.name}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span className="font-bold text-clinicalGreen text-sm tabular-nums">{t.quantity}</span>{' '}
                          <span className="text-[11px] text-muted font-medium font-sans">{med?.unit}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-ink">
                          {t.batchNumber}
                        </td>
                        <td className="py-3 px-4 text-graphite text-xs font-mono">
                          <div>{t.distanceKm} km</div>
                          <div className="text-muted text-[11px]">~{t.estimatedTransitMinutes} mins</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 font-sans">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-clinicalGreen bg-clinicalGreen/10 border border-clinicalGreen/30">
                              <CheckCircle2 className="w-3 h-3 text-clinicalGreen" />
                              Completed
                            </span>
                            {t.isEmergency && (
                              <span className="px-2 py-0.5 rounded text-[11px] font-mono text-vermilion bg-vermilion/10 border border-vermilion/30 font-bold uppercase tracking-wider">
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
