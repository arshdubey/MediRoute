import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { EnrichedStockItem, StockStatus, MedicineCategory } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { StockEditModal } from './StockEditModal';
import { AddStockModal } from './AddStockModal';
import {
  Search,
  Plus,
  Edit2,
  ArrowUpDown,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Reveal } from '../motion/Reveal';

interface InventoryViewProps {
  onNavigateToRedistribution?: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ onNavigateToRedistribution }) => {
  const { clinics, medicines, enrichedStock, updateStockRecord, openMatchDonorModal } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClinic, setSelectedClinic] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'days' | 'stock' | 'expiry' | 'name'>('days');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals state
  const [editingItem, setEditingItem] = useState<EnrichedStockItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Distinct categories
  const categories = useMemo(() => {
    return Array.from(new Set(medicines.map((m) => m.category)));
  }, [medicines]);

  // Filter & Sort
  const filteredItems = useMemo(() => {
    return enrichedStock
      .filter((item) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchMed = item.medicine.name.toLowerCase().includes(q);
          const matchGeneric = item.medicine.genericName.toLowerCase().includes(q);
          const matchBatch = item.batchNumber.toLowerCase().includes(q);
          const matchClinic = item.clinic.name.toLowerCase().includes(q) || item.clinic.code.toLowerCase().includes(q);
          if (!matchMed && !matchGeneric && !matchBatch && !matchClinic) return false;
        }

        // Clinic
        if (selectedClinic !== 'ALL' && item.clinicId !== selectedClinic) return false;

        // Category
        if (selectedCategory !== 'ALL' && item.medicine.category !== selectedCategory) return false;

        // Status
        if (selectedStatus !== 'ALL' && item.calc.status !== selectedStatus) return false;

        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'days') {
          cmp = a.calc.daysUntilStockout - b.calc.daysUntilStockout;
        } else if (sortBy === 'stock') {
          cmp = a.currentStock - b.currentStock;
        } else if (sortBy === 'expiry') {
          cmp = new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        } else if (sortBy === 'name') {
          cmp = a.medicine.name.localeCompare(b.medicine.name);
        }
        return sortOrder === 'asc' ? cmp : -cmp;
      });
  }, [
    enrichedStock,
    searchQuery,
    selectedClinic,
    selectedCategory,
    selectedStatus,
    sortBy,
    sortOrder,
  ]);

  const toggleSort = (field: 'days' | 'stock' | 'expiry' | 'name') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Editorial Header bar */}
      <Reveal>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-[#E5E3DC]">
          <div>
            <div className="text-[10px] font-sans font-semibold tracking-widest text-[#77766F] uppercase mb-1">
              REGIONAL LEDGER / SECTION 02
            </div>
            <h1 className="text-3xl sm:text-4xl font-normal text-[#142536] tracking-tight font-serif">
              Multi-Clinic Inventory
            </h1>
            <p className="text-xs sm:text-sm text-[#77766F] mt-0.5 max-w-2xl font-sans">
              Precision batch tracking, consumption burn rates, and minimum safety reserves across 5 interconnected facilities.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 bg-[#142536] hover:bg-[#0C1722] text-[#F7F5F0] font-medium text-xs px-4 py-2.5 rounded shadow-sm transition-all cursor-pointer self-start sm:self-auto active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#142536] focus-visible:ring-offset-2"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Add Stock Batch</span>
          </button>
        </div>
      </Reveal>

      {/* Filter / Search Bar */}
      <Reveal delay={40}>
        <div className="bg-[#FFFFFF] rounded-xl p-4 sm:p-5 border border-[#E5E3DC] shadow-print-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search Box */}
            <div className="relative md:col-span-1">
              <Search className="w-4 h-4 text-[#77766F] absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search medicine, batch, clinic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs font-medium bg-[#F7F5F0] border border-[#E5E3DC] rounded focus:bg-white focus:border-[#142536] focus:ring-1 focus:ring-[#142536] text-[#142536] outline-none transition-all"
              />
            </div>

            {/* Clinic Filter */}
            <div>
              <select
                value={selectedClinic}
                onChange={(e) => setSelectedClinic(e.target.value)}
                aria-label="Filter by Clinic"
                className="w-full px-3 py-2 text-xs font-medium bg-[#F7F5F0] border border-[#E5E3DC] rounded focus:bg-white focus:border-[#142536] focus:ring-1 focus:ring-[#142536] outline-none text-[#142536] transition-all cursor-pointer"
              >
                <option value="ALL">All Clinics (5 facilities)</option>
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter by Category"
                className="w-full px-3 py-2 text-xs font-medium bg-[#F7F5F0] border border-[#E5E3DC] rounded focus:bg-white focus:border-[#142536] focus:ring-1 focus:ring-[#142536] outline-none text-[#142536] transition-all cursor-pointer"
              >
                <option value="ALL">All Therapeutic Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                aria-label="Filter by Stock Status"
                className="w-full px-3 py-2 text-xs font-medium bg-[#F7F5F0] border border-[#E5E3DC] rounded focus:bg-white focus:border-[#142536] focus:ring-1 focus:ring-[#142536] outline-none text-[#142536] transition-all cursor-pointer"
              >
                <option value="ALL">All Stock Statuses</option>
                <option value="CRITICAL">Critical Shortage (≤ 2.5d)</option>
                <option value="LOW_STOCK">Low Stock (&lt; Safety Min)</option>
                <option value="SURPLUS">Surplus (Eligible Donor)</option>
                <option value="EXPIRING_SOON">Expiring Soon (≤ 45d)</option>
                <option value="OPTIMAL">Optimal Inventory</option>
              </select>
            </div>
          </div>

          {/* Results counter & active sort info */}
          <div className="flex flex-wrap items-center justify-between text-xs text-[#77766F] pt-3 border-t border-[#E5E3DC] font-medium font-sans">
            <div>
              Showing <strong className="text-[#142536] font-bold">{filteredItems.length}</strong> of{' '}
              {enrichedStock.length} records
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#77766F]">Sorted by:</span>
              <span className="font-medium text-[#142536] capitalize text-xs bg-[#F7F5F0] border border-[#E5E3DC] px-2 py-0.5 rounded">
                {sortBy} ({sortOrder})
              </span>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Information-Dense Inventory Table */}
      <Reveal delay={80}>
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E5E3DC] shadow-print-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F5F0] border-b border-[#E5E3DC] text-xs font-semibold text-[#77766F] font-sans">
                  <th
                    onClick={() => toggleSort('name')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-[#E5E3DC]/40 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Medicine / Formulation</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-[#77766F]" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Facility</th>
                  <th
                    onClick={() => toggleSort('stock')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-[#E5E3DC]/40 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>On-Hand / Reserve</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-[#77766F]" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Daily Burn</th>
                  <th
                    onClick={() => toggleSort('days')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-[#E5E3DC]/40 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Runway</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-[#77766F]" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('expiry')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-[#E5E3DC]/40 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Batch &amp; Expiry</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-[#77766F]" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E3DC] text-xs">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#77766F]">
                      <p className="text-sm font-semibold text-[#142536] font-sans">No inventory records match the current filters.</p>
                      <p className="text-xs text-[#77766F] mt-1 font-sans">Try resetting search or clinic filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const percentOfSafety = Math.round(
                      (item.currentStock / (item.minSafetyStock || 1)) * 100
                    );
                    const isCritical = item.calc.status === 'CRITICAL';
                    const isExpiring = item.calc.status === 'EXPIRING_SOON';

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-[#F7F5F0] transition-colors ${
                          isCritical ? 'bg-[#FDF3F1]/50' : ''
                        }`}
                      >
                        {/* Medicine Info */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#142536] font-sans">{item.medicine.name}</div>
                          <div className="text-[11px] text-[#77766F] font-sans">
                            {item.medicine.dosageForm} • {item.medicine.category}
                          </div>
                        </td>

                        {/* Clinic Info */}
                        <td className="py-3.5 px-4 font-sans">
                          <span className="font-mono font-bold text-[#142536]">{item.clinic.code}</span>
                          <div className="text-[11px] text-[#77766F] truncate max-w-[140px]">
                            {item.clinic.name}
                          </div>
                        </td>

                        {/* Stock vs Safety stock */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-baseline gap-1.5 font-mono">
                            <span
                              className={`font-bold text-sm tabular-nums ${
                                isCritical
                                  ? 'text-[#E74732]'
                                  : item.calc.status === 'LOW_STOCK'
                                  ? 'text-[#C4841D]'
                                  : 'text-[#142536]'
                              }`}
                            >
                              {item.currentStock}
                            </span>
                            <span className="text-[#77766F] text-[11px] tabular-nums">
                              / {item.minSafetyStock} min
                            </span>
                            <span className="text-[11px] text-[#77766F] font-sans">
                              {item.medicine.unit}
                            </span>
                          </div>

                          {/* Minimal Print Gauge */}
                          <div className="w-24 bg-[#E5E3DC] h-1 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                percentOfSafety < 50
                                  ? 'bg-[#E74732]'
                                  : percentOfSafety < 100
                                  ? 'bg-[#C4841D]'
                                  : 'bg-[#1D7055]'
                              }`}
                              style={{ width: `${Math.min(100, percentOfSafety)}%` }}
                            />
                          </div>
                        </td>

                        {/* Daily Burn Rate */}
                        <td className="py-3.5 px-4 text-[#142536] font-mono text-[11px]">
                          {item.avgDailyConsumption}{' '}
                          <span className="text-[#77766F]">/day</span>
                        </td>

                        {/* Days until stockout */}
                        <td className="py-3.5 px-4">
                          <div
                            className={`font-mono text-xs font-bold inline-flex items-center gap-1 ${
                              item.calc.daysUntilStockout <= 2.5
                                ? 'text-[#E74732] font-black'
                                : item.calc.daysUntilStockout <= 7
                                ? 'text-[#C4841D]'
                                : 'text-[#142536]'
                            }`}
                          >
                            {item.calc.daysUntilStockout <= 2.5 && (
                              <AlertTriangle className="w-3.5 h-3.5 text-[#E74732] flex-shrink-0" />
                            )}
                            <span>{item.calc.daysUntilStockout}d</span>
                          </div>
                          <div className="text-[10px] text-[#77766F] font-sans">
                            {item.calc.daysUntilStockout > 90 ? 'Adequate' : 'Depletion risk'}
                          </div>
                        </td>

                        {/* Batch & Expiry */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-[10px] text-[#142536] bg-[#F7F5F0] px-1.5 py-0.5 rounded border border-[#E5E3DC]">
                            {item.batchNumber}
                          </span>
                          <div
                            className={`text-[11px] font-mono mt-1 ${
                              isExpiring ? 'text-[#C4841D] font-bold' : 'text-[#77766F]'
                            }`}
                          >
                            {item.expiryDate} ({item.calc.daysToExpiry}d)
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4">
                          <StatusBadge status={item.calc.status} size="sm" />
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <button
                              onClick={() => setEditingItem(item)}
                              className="p-1.5 text-[#77766F] hover:text-[#142536] hover:bg-[#F7F5F0] rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#142536]"
                              title="Edit stock details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {(item.calc.status === 'CRITICAL' || item.calc.status === 'LOW_STOCK') && (
                              <button
                                onClick={() => openMatchDonorModal(item)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#142536] bg-[#F7F5F0] hover:bg-[#142536] hover:text-white px-2.5 py-1 rounded border border-[#E5E3DC] hover:border-[#142536] transition-all cursor-pointer active:scale-95 shadow-xs font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#142536] focus-visible:ring-offset-1"
                                title={`Match eligible donor facility for ${item.medicine.name}`}
                              >
                                <span>Match Donor</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
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

      {/* Edit Modal */}
      <StockEditModal
        item={editingItem}
        isOpen={editingItem !== null}
        onClose={() => setEditingItem(null)}
        onSave={updateStockRecord}
      />

      {/* Add Stock Modal */}
      <AddStockModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
};
