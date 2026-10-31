import React, { useMemo, useState } from 'react';
import { Clinic, EnrichedStockItem, RedistributionRecommendation, EmergencyScenario, TransferRecord } from '../../types';
import { getRouteInfo } from '../../data/distanceMatrix';
import { Truck, ShieldCheck, ArrowRight, CheckCircle2, Filter, X } from 'lucide-react';

interface RegionalNetworkMapProps {
  clinics: Clinic[];
  enrichedStock: EnrichedStockItem[];
  activeRecommendations: RedistributionRecommendation[];
  activeEmergency: EmergencyScenario | null;
  transfers?: TransferRecord[];
  focusedCorridor?: {
    donorClinicId: string;
    recipientClinicId: string;
    medicineName?: string;
    recommendedQuantity?: number;
  } | null;
  selectedClinicId?: string | 'ALL';
  onSelectClinic?: (clinicId: string) => void;
}

export const RegionalNetworkMap: React.FC<RegionalNetworkMapProps> = ({
  clinics,
  enrichedStock,
  activeRecommendations,
  activeEmergency,
  transfers = [],
  focusedCorridor = null,
  selectedClinicId = 'ALL',
  onSelectClinic,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Synchronize effective selected clinic between internal click state and global AppContext
  const effectiveSelectedClinicId =
    selectedClinicId && selectedClinicId !== 'ALL'
      ? selectedClinicId
      : selectedNodeId;

  // Top pending recommendation dictates the primary proposed transfer corridor
  const topRec = activeRecommendations[0] || null;
  const latestTransfer = !topRec && transfers.length > 0 ? transfers[0] : null;

  // Determine operational corridor mode and active endpoint IDs
  const corridorMode: 'FOCUSED' | 'PROPOSED' | 'CONFIRMED' | 'STABLE' = focusedCorridor
    ? 'FOCUSED'
    : topRec
    ? 'PROPOSED'
    : latestTransfer
    ? 'CONFIRMED'
    : 'STABLE';

  const effectiveDonorId = focusedCorridor
    ? focusedCorridor.donorClinicId
    : topRec?.donorClinicId || latestTransfer?.donorClinicId || null;
  const effectiveRecipientId = focusedCorridor
    ? focusedCorridor.recipientClinicId
    : topRec?.recipientClinicId || latestTransfer?.recipientClinicId || null;

  // Determine operational role and telemetry for each facility based on real application state
  const nodeStatusMap = useMemo(() => {
    const map = new Map<
      string,
      {
        role: 'DONOR' | 'RECIPIENT' | 'STABLE';
        label: string;
        criticalCount: number;
        surplusCount: number;
        totalUnits: number;
      }
    >();

    for (const clinic of clinics) {
      const clinicItems = enrichedStock.filter((s) => s.clinicId === clinic.id);
      const criticalCount = clinicItems.filter((s) => s.calc.status === 'CRITICAL').length;
      const surplusCount = clinicItems.filter((s) => s.calc.status === 'SURPLUS').length;
      const totalUnits = clinicItems.reduce((acc, s) => acc + s.currentStock, 0);

      let role: 'DONOR' | 'RECIPIENT' | 'STABLE' = 'STABLE';
      let label = '● Nominal';

      if (
        clinic.id === effectiveRecipientId ||
        (activeEmergency && clinic.id === activeEmergency.targetClinicId) ||
        criticalCount > 0
      ) {
        role = 'RECIPIENT';
        label = criticalCount > 0 ? `! Shortage (${criticalCount})` : '! Deficit';
      } else if (clinic.id === effectiveDonorId || surplusCount > 0) {
        role = 'DONOR';
        label = `+ Surplus (${surplusCount})`;
      }

      map.set(clinic.id, { role, label, criticalCount, surplusCount, totalUnits });
    }

    return map;
  }, [clinics, enrichedStock, effectiveDonorId, effectiveRecipientId, activeEmergency]);

  // Network topology coordinates for the 5 facilities (viewBox: 0 0 440 220)
  // Designed with clear margins: central hub (c1) sits at y: 120, well below upper corridors
  const nodePositions: Record<
    string,
    { x: number; y: number; labelY: number; badgeY: number }
  > = {
    c3: { x: 75, y: 52, labelY: 73, badgeY: 86 },    // Riverdale Pediatric (RPC) - northwest
    c2: { x: 365, y: 52, labelY: 73, badgeY: 86 },   // St. Jude Community Health (SJC) - northeast
    c1: { x: 220, y: 120, labelY: 141, badgeY: 154 }, // Metro Hope General (MHG) - center hub
    c4: { x: 75, y: 168, labelY: 189, badgeY: 202 },  // Northside Urgent Care (NUC) - southwest
    c5: { x: 365, y: 168, labelY: 189, badgeY: 202 }, // Pinecrest Family Medical (PFM) - southeast
  };

  // Fixed regional background transit corridors between adjacent facilities
  const corridors = [
    { from: 'c3', to: 'c1' }, // RPC - MHG
    { from: 'c1', to: 'c2' }, // MHG - SJC
    { from: 'c3', to: 'c2' }, // RPC - SJC (North cross-route)
    { from: 'c4', to: 'c1' }, // NUC - MHG
    { from: 'c1', to: 'c5' }, // MHG - PFM
    { from: 'c4', to: 'c5' }, // NUC - PFM (South cross-route)
  ];

  const activeRoute =
    effectiveDonorId && effectiveRecipientId
      ? getRouteInfo(effectiveDonorId, effectiveRecipientId)
      : null;
  const donorClinic = clinics.find((c) => c.id === effectiveDonorId);
  const recipientClinic = clinics.find((c) => c.id === effectiveRecipientId);

  // Selected clinic detail for inspect mode
  const activeInspectedClinic = effectiveSelectedClinicId
    ? clinics.find((c) => c.id === effectiveSelectedClinicId)
    : hoveredNodeId
    ? clinics.find((c) => c.id === hoveredNodeId)
    : null;
  const inspectedStatus = activeInspectedClinic
    ? nodeStatusMap.get(activeInspectedClinic.id)
    : null;

  // Compute SVG corridor geometry with smooth arcs for diagonal routes
  // Completely eliminates any visual overlap with central facility c1 (Metro Hope)
  const routeGeometry = useMemo(() => {
    if (!effectiveDonorId || !effectiveRecipientId) return null;
    const p1 = nodePositions[effectiveDonorId];
    const p2 = nodePositions[effectiveRecipientId];
    if (!p1 || !p2) return null;

    // Diagonal route from southwest (c4) to northeast (c2) — Primary Case Study Corridor
    if (
      (effectiveDonorId === 'c4' && effectiveRecipientId === 'c2') ||
      (effectiveDonorId === 'c2' && effectiveRecipientId === 'c4')
    ) {
      const ctrlX = 220;
      const ctrlY = 46;
      // Apex at midpoint parameter t = 0.5: y = 0.25*168 + 0.5*46 + 0.25*52 = 78
      const apexX = 220;
      const apexY = 78;
      return {
        pathD: `M ${p1.x} ${p1.y} Q ${ctrlX} ${ctrlY} ${p2.x} ${p2.y}`,
        badgeX: apexX,
        badgeY: apexY - 20, // y = 58 (cleanly in open whitespace)
        anchorX: apexX,
        anchorY: apexY,
      };
    }

    // Diagonal route from northwest (c3) to southeast (c5)
    if (
      (effectiveDonorId === 'c3' && effectiveRecipientId === 'c5') ||
      (effectiveDonorId === 'c5' && effectiveRecipientId === 'c3')
    ) {
      const ctrlX = 220;
      const ctrlY = 194;
      // Apex at midpoint parameter t = 0.5: y = 0.25*52 + 0.5*194 + 0.25*168 = 152
      const apexX = 220;
      const apexY = 152;
      return {
        pathD: `M ${p1.x} ${p1.y} Q ${ctrlX} ${ctrlY} ${p2.x} ${p2.y}`,
        badgeX: apexX,
        badgeY: apexY + 22,
        anchorX: apexX,
        anchorY: apexY,
      };
    }

    // Straight adjacent corridor with orthogonal normal offset
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy) || 1;
    let nx = -dy / len;
    let ny = dx / len;
    if (ny > 0) {
      nx = -nx;
      ny = -ny;
    }
    const offset = 22;
    return {
      pathD: `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`,
      badgeX: midX + nx * offset,
      badgeY: midY + ny * offset,
      anchorX: midX,
      anchorY: midY,
    };
  }, [effectiveDonorId, effectiveRecipientId, nodePositions]);

  return (
    <div className="bg-[#171923] rounded-xl border border-[#2D3142] p-4 sm:p-5 flex flex-col justify-between h-full shadow-lg">
      {/* Topology Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#2D3142]">
        <div className="flex items-center gap-2">
          <div>
            <span className="text-[10px] font-mono font-semibold tracking-widest text-[#A0A0AA] uppercase">
              REGIONAL TOPOLOGY
            </span>
            <h3 className="text-sm font-serif font-normal text-white">
              5-Facility Network Corridor
            </h3>
          </div>
          {selectedClinicId && selectedClinicId !== 'ALL' && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono bg-[#222431] px-2 py-0.5 rounded-md border border-[#2D3142] text-white font-semibold">
              <span>Filtered: {clinics.find((c) => c.id === selectedClinicId)?.code || selectedClinicId}</span>
              {onSelectClinic && (
                <button
                  onClick={() => onSelectClinic(selectedClinicId)}
                  className="hover:text-[#BB232B] cursor-pointer ml-0.5"
                  title="Clear filter"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          )}
        </div>

        {activeEmergency ? (
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-[#BB232B]/20 text-[#FF6B72] border border-[#BB232B]/50 flex items-center gap-1.5 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#BB232B] animate-pulse" />
            <span>Crisis Surge Corridor</span>
          </span>
        ) : corridorMode === 'FOCUSED' ? (
          <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded bg-[#BB232B]/20 text-[#FF6B72] border border-[#BB232B]/50 flex items-center gap-1.5 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#BB232B] animate-pulse" />
            <span>Focused Triage Corridor</span>
          </span>
        ) : corridorMode === 'PROPOSED' ? (
          <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded bg-[#2C3480]/30 text-[#A4AADE] border border-[#2C3480]/60 flex items-center gap-1.5 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6872C4]" />
            <span>Proposed Corridor (Pending)</span>
          </span>
        ) : corridorMode === 'CONFIRMED' ? (
          <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded bg-[#16815D]/20 text-[#5AA98C] border border-[#16815D]/50 flex items-center gap-1.5 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#5AA98C]" />
            <span>Confirmed Dispatch Corridor</span>
          </span>
        ) : (
          <span className="text-[11px] font-mono text-[#5AA98C] bg-[#16815D]/20 border border-[#16815D]/50 px-2.5 py-1 rounded flex items-center gap-1.5 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16815D]" />
            <span>Network Stable</span>
          </span>
        )}
      </div>

      {/* SVG Network Canvas */}
      <div className="relative py-1 my-auto">
        <svg
          viewBox="0 0 440 220"
          className="w-full h-auto max-h-[190px] overflow-visible select-none"
          role="img"
          aria-label="Regional 5-facility network corridor diagram"
        >
          <defs>
            {/* Directional flow animation for recommended transfer corridor */}
            <style>{`
              @keyframes corridorDash {
                to {
                  stroke-dashoffset: -18;
                }
              }
              .proposed-corridor-flow {
                stroke-dasharray: 6 3;
                animation: corridorDash 1.4s linear infinite;
              }
              @media (prefers-reduced-motion: reduce) {
                .proposed-corridor-flow {
                  animation: none;
                }
              }
            `}</style>
          </defs>

          {/* LAYER 1: Background Inter-Facility Connection Corridors (Always behind nodes) */}
          <g className="corridors-base-layer">
            {corridors.map((corridor, idx) => {
              const p1 = nodePositions[corridor.from];
              const p2 = nodePositions[corridor.to];
              if (!p1 || !p2) return null;

              return (
                <line
                  key={`corridor-base-${idx}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="#2D3142"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                />
              );
            })}
          </g>

          {/* LAYER 2: Highlighted Recommended, Focused, or Confirmed Corridor (Behind badge and nodes) */}
          {routeGeometry && (
            <g className="active-corridor-layer">
              <path
                d={routeGeometry.pathD}
                fill="none"
                stroke={corridorMode === 'CONFIRMED' ? '#16815D' : corridorMode === 'PROPOSED' ? '#4A56C4' : '#BB232B'}
                strokeWidth={corridorMode === 'CONFIRMED' ? '2' : corridorMode === 'FOCUSED' ? '2.75' : '2.5'}
                strokeLinecap="round"
                className={corridorMode === 'PROPOSED' || corridorMode === 'FOCUSED' ? 'proposed-corridor-flow' : ''}
              />
            </g>
          )}

          {/* LAYER 3: Opaque Route Badge (Positioned ABOVE line in clear whitespace) */}
          {activeRoute && routeGeometry && (
            <g className="route-badge-layer">
              {/* Connector tick line from corridor to badge */}
              <line
                x1={routeGeometry.anchorX}
                y1={routeGeometry.anchorY}
                x2={routeGeometry.badgeX}
                y2={routeGeometry.badgeY + (routeGeometry.badgeY < routeGeometry.anchorY ? 10 : -10)}
                stroke={corridorMode === 'CONFIRMED' ? '#16815D' : corridorMode === 'PROPOSED' ? '#4A56C4' : '#BB232B'}
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              {/* Anchor dot on corridor line */}
              <circle
                cx={routeGeometry.anchorX}
                cy={routeGeometry.anchorY}
                r="3"
                fill={corridorMode === 'CONFIRMED' ? '#16815D' : corridorMode === 'PROPOSED' ? '#4A56C4' : '#BB232B'}
              />
              {/* Opaque Badge Container */}
              <g transform={`translate(${routeGeometry.badgeX}, ${routeGeometry.badgeY})`}>
                <rect
                  x="-68"
                  y="-10"
                  width="136"
                  height="20"
                  rx="4"
                  fill="#171923"
                  stroke={corridorMode === 'CONFIRMED' ? '#16815D' : corridorMode === 'PROPOSED' ? '#4A56C4' : '#BB232B'}
                  strokeWidth="1.25"
                  filter="drop-shadow(0 4px 6px rgba(0, 0, 0, 0.4))"
                />
                <text
                  x="0"
                  y="3.5"
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                  fontSize="8"
                  fontWeight="600"
                  fill="#FFFFFF"
                >
                  <tspan fontWeight="700" fontFamily="JetBrains Mono, monospace">
                    {activeRoute.distanceKm} km
                  </tspan>
                  <tspan fill="#A0A0AA"> • </tspan>
                  <tspan
                    fill={corridorMode === 'CONFIRMED' ? '#5AA98C' : corridorMode === 'PROPOSED' ? '#A4AADE' : '#FF6B72'}
                    fontWeight="700"
                  >
                    {corridorMode === 'CONFIRMED'
                      ? '✓ Dispatched'
                      : corridorMode === 'FOCUSED'
                      ? 'Triage Target'
                      : 'Proposed (Pending)'}
                  </tspan>
                </text>
              </g>
            </g>
          )}

          {/* LAYER 4: Facility Nodes & Labels (Highest Layer - 100% visible, zero overlap) */}
          <g className="facility-nodes-layer">
            {clinics.map((clinic) => {
              const pos = nodePositions[clinic.id];
              if (!pos) return null;

              const status = nodeStatusMap.get(clinic.id) || {
                role: 'STABLE',
                label: '● Nominal',
                criticalCount: 0,
                surplusCount: 0,
                totalUnits: 0,
              };
              const isDonor = status.role === 'DONOR';
              const isRecipient = status.role === 'RECIPIENT';
              const isSelected = effectiveSelectedClinicId === clinic.id;
              const isHovered = hoveredNodeId === clinic.id;

              let nodeFill = '#222431';
              let nodeStroke = '#2D3142';
              let roleBadgeFill = '#171923';
              let roleBadgeStroke = '#2D3142';
              let roleBadgeText = '#A0A0AA';

              if (isRecipient) {
                nodeFill = '#2D0D0F';
                nodeStroke = '#BB232B';
                roleBadgeFill = '#2D0D0F';
                roleBadgeStroke = '#BB232B';
                roleBadgeText = '#FF6B72';
              } else if (isDonor) {
                nodeFill = '#0A2B1D';
                nodeStroke = '#16815D';
                roleBadgeFill = '#0A2B1D';
                roleBadgeStroke = '#16815D';
                roleBadgeText = '#5AA98C';
              }

              return (
                <g
                  key={clinic.id}
                  className="cursor-pointer transition-transform focus:outline-none"
                  tabIndex={0}
                  role="button"
                  aria-label={`${clinic.name} (${clinic.code}): ${status.label}, ${status.totalUnits} units in stock`}
                  onMouseEnter={() => setHoveredNodeId(clinic.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onClick={() => {
                    const next = effectiveSelectedClinicId === clinic.id ? null : clinic.id;
                    setSelectedNodeId(next);
                    if (onSelectClinic) onSelectClinic(clinic.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      const next = effectiveSelectedClinicId === clinic.id ? null : clinic.id;
                      setSelectedNodeId(next);
                      if (onSelectClinic) onSelectClinic(clinic.id);
                    }
                  }}
                >
                  {/* Outer subtle focus halo */}
                  {(isRecipient || isDonor || isSelected || isHovered) && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isSelected ? 23 : isHovered ? 21 : 18}
                      fill={
                        isSelected
                          ? 'rgba(44, 52, 128, 0.4)'
                          : isRecipient
                          ? 'rgba(187, 35, 43, 0.25)'
                          : isDonor
                          ? 'rgba(22, 129, 93, 0.25)'
                          : 'rgba(44, 52, 128, 0.2)'
                      }
                      className="transition-all duration-150"
                    />
                  )}

                  {/* Active Selected Dashed Ring */}
                  {isSelected && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={17.5}
                      fill="none"
                      stroke="#4A56C4"
                      strokeWidth={1.8}
                      strokeDasharray="3 2"
                    />
                  )}

                  {/* Node Circle */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={13.5}
                    fill={nodeFill}
                    stroke={nodeStroke}
                    strokeWidth={isRecipient || isDonor ? 2 : 1.5}
                    className="transition-colors duration-150"
                  />

                  {/* Monospace Clinic Code Inside Node */}
                  <text
                    x={pos.x}
                    y={pos.y + 3.5}
                    textAnchor="middle"
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="8.5"
                    fontWeight="700"
                    fill="#FFFFFF"
                  >
                    {clinic.code}
                  </text>

                  {/* Facility Name with Dark Background Halo */}
                  <rect
                    x={pos.x - 44}
                    y={pos.labelY - 9}
                    width="88"
                    height="13"
                    rx="2.5"
                    fill="#171923"
                    stroke="#2D3142"
                    strokeWidth="0.5"
                  />
                  <text
                    x={pos.x}
                    y={pos.labelY}
                    textAnchor="middle"
                    fontFamily="Inter, sans-serif"
                    fontSize="9.5"
                    fontWeight="600"
                    fill="#FFFFFF"
                  >
                    {clinic.name.split(' ')[0]} {clinic.name.split(' ')[1] || ''}
                  </text>

                  {/* Explicit Accessible Status Badge (Distinguishable without color alone) */}
                  <g transform={`translate(${pos.x - 34}, ${pos.badgeY - 7})`}>
                    <rect
                      width="68"
                      height="14"
                      rx="2.5"
                      fill={roleBadgeFill}
                      stroke={roleBadgeStroke}
                      strokeWidth="0.75"
                    />
                    <text
                      x="34"
                      y="10"
                      textAnchor="middle"
                      fontFamily="Inter, sans-serif"
                      fontSize="7.5"
                      fontWeight="600"
                      fill={roleBadgeText}
                    >
                      {status.label}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Interactive Selection / Corridor Status Footer Strip (Compact, Mobile-Responsive) */}
      <div className="pt-2.5 border-t border-[#2D3142] text-xs text-[#A0A0AA] font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {activeInspectedClinic && inspectedStatus ? (
              <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#222431] p-2.5 rounded-lg border border-[#2D3142]">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-bold text-white bg-[#2C3480] px-1.5 py-0.5 rounded text-[10px]">
                      {activeInspectedClinic.code}
                    </span>
                    <span className="font-semibold text-white text-xs truncate">
                      {activeInspectedClinic.name}
                    </span>
                    <span className="text-[10px] text-[#A0A0AA] bg-[#171923] px-1.5 py-0.5 rounded border border-[#2D3142] hidden md:inline-block">
                      {activeInspectedClinic.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[#A0A0AA] mt-1 font-mono flex-wrap">
                    <span>{activeInspectedClinic.bedsCapacity} beds</span>
                    <span>•</span>
                    <span className="text-white font-semibold">{inspectedStatus.totalUnits}u in stock</span>
                    {inspectedStatus.criticalCount > 0 ? (
                      <span className="text-[#FF6B72] font-bold">
                        • {inspectedStatus.criticalCount} deficits
                      </span>
                    ) : (
                      <span className="text-[#5AA98C] font-medium">
                        • Safe Reserve
                      </span>
                    )}
                    <span className="hidden lg:inline">• Lead: {activeInspectedClinic.inventoryManager}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-auto">
                  {onSelectClinic && (
                    <button
                      onClick={() => onSelectClinic(activeInspectedClinic.id)}
                      className={`text-[10px] font-sans font-semibold px-2 py-1 rounded-md border transition-colors cursor-pointer flex items-center gap-1 ${
                        selectedClinicId === activeInspectedClinic.id
                          ? 'bg-[#2C3480] text-white border-[#2C3480]'
                          : 'bg-[#171923] text-white border-[#2D3142] hover:bg-[#2D3142]'
                      }`}
                    >
                      <Filter className="w-3 h-3" />
                      <span>{selectedClinicId === activeInspectedClinic.id ? 'Filtered (Reset)' : 'Filter Dashboard'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedNodeId(null);
                      setHoveredNodeId(null);
                    }}
                    className="text-[#A0A0AA] hover:text-white p-1 rounded hover:bg-[#171923] cursor-pointer"
                    title="Dismiss inspect card"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : corridorMode === 'FOCUSED' && activeRoute && donorClinic && recipientClinic ? (
              <>
                <Truck className="w-3.5 h-3.5 text-[#FF6B72] flex-shrink-0" />
                <span className="text-[11px] truncate text-[#A0A0AA]">
                  Triage: <strong className="text-white font-mono">{donorClinic.code}</strong> &rarr;{' '}
                  <strong className="text-[#FF6B72] font-mono">{recipientClinic.code}</strong>{' '}
                  <span className="font-mono text-white font-semibold">({activeRoute.distanceKm} km)</span>
                  {focusedCorridor?.medicineName ? ` • ${focusedCorridor.medicineName}` : ''}
                </span>
              </>
            ) : corridorMode === 'PROPOSED' && activeRoute && donorClinic && recipientClinic ? (
              <>
                <Truck className="w-3.5 h-3.5 text-[#A4AADE] flex-shrink-0" />
                <span className="text-[11px] truncate text-[#A0A0AA]">
                  Proposed: <strong className="text-white font-mono">{donorClinic.code}</strong> &rarr;{' '}
                  <strong className="text-[#A4AADE] font-mono">{recipientClinic.code}</strong>{' '}
                  <span className="font-mono text-white font-semibold">({activeRoute.distanceKm} km)</span>
                  <span className="text-[#A0A0AA] italic ml-1">• Pending Approval (Not Dispatched)</span>
                </span>
              </>
            ) : corridorMode === 'CONFIRMED' && activeRoute && donorClinic && recipientClinic && latestTransfer ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#5AA98C] flex-shrink-0" />
                <span className="text-[11px] truncate text-[#A0A0AA]">
                  Dispatched: <strong className="text-white font-mono">{donorClinic.code}</strong> &rarr;{' '}
                  <strong className="text-[#5AA98C] font-mono">{recipientClinic.code}</strong>{' '}
                  <span className="font-mono text-white font-semibold">({latestTransfer.quantity} units, {activeRoute.distanceKm} km)</span>
                  <span className="text-[#5AA98C] font-medium ml-1">• Session Ledger Confirmed</span>
                </span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-[#5AA98C] flex-shrink-0" />
                <span className="text-[11px] text-[#5AA98C] font-medium truncate">
                  All 5 facilities above safety threshold
                </span>
              </>
            )}
          </div>

          {!activeInspectedClinic && (
            <div className="flex items-center gap-2 flex-shrink-0 text-[10px] font-mono text-[#A0A0AA] self-end sm:self-auto">
              <span>Min Buffer: 25–40u</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
