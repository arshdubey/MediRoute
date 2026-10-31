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
    <div className="bg-white rounded-xl border border-[#E5E5E8] p-4 sm:p-5 flex flex-col justify-between h-full shadow-xs">
      {/* Topology Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#E5E5E8]">
        <div className="flex items-center gap-2">
          <div>
            <span className="text-[10px] font-mono font-semibold tracking-widest text-[#737373] uppercase">
              REGIONAL TOPOLOGY
            </span>
            <h3 className="text-sm font-serif font-normal text-[#080808]">
              5-Facility Network Corridor
            </h3>
          </div>
          {selectedClinicId && selectedClinicId !== 'ALL' && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono bg-[#F5F5F7] px-2 py-0.5 rounded-md border border-[#E5E5E8] text-[#080808] font-semibold">
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
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-[#2D0D0F] text-[#BB232B] border border-[#BB232B]/40 flex items-center gap-1.5 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#BB232B] animate-pulse" />
            <span>Crisis Surge Corridor</span>
          </span>
        ) : corridorMode === 'FOCUSED' ? (
          <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded bg-[#FDF3F3] text-[#BB232B] border border-[#F5CACD] flex items-center gap-1.5 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#BB232B] animate-pulse" />
            <span>Focused Triage Corridor</span>
          </span>
        ) : corridorMode === 'PROPOSED' ? (
          <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded bg-[#F0F1FA] text-[#2C3480] border border-[#C7CAEB] flex items-center gap-1.5 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2C3480]" />
            <span>Proposed Corridor (Pending)</span>
          </span>
        ) : corridorMode === 'CONFIRMED' ? (
          <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded bg-[#F0F8F5] text-[#16815D] border border-[#BFDFD2] flex items-center gap-1.5 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#16815D]" />
            <span>Confirmed Dispatch Corridor</span>
          </span>
        ) : (
          <span className="text-[11px] font-mono text-[#16815D] bg-[#F0F8F5] border border-[#BFDFD2] px-2.5 py-1 rounded flex items-center gap-1.5 font-semibold">
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
                  stroke="#E5E5E8"
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
                stroke={corridorMode === 'CONFIRMED' ? '#16815D' : corridorMode === 'PROPOSED' ? '#2C3480' : '#BB232B'}
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
                stroke={corridorMode === 'CONFIRMED' ? '#16815D' : corridorMode === 'PROPOSED' ? '#2C3480' : '#BB232B'}
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              {/* Anchor dot on corridor line */}
              <circle
                cx={routeGeometry.anchorX}
                cy={routeGeometry.anchorY}
                r="3"
                fill={corridorMode === 'CONFIRMED' ? '#16815D' : corridorMode === 'PROPOSED' ? '#2C3480' : '#BB232B'}
              />
              {/* Opaque Badge Container */}
              <g transform={`translate(${routeGeometry.badgeX}, ${routeGeometry.badgeY})`}>
                <rect
                  x="-68"
                  y="-10"
                  width="136"
                  height="20"
                  rx="4"
                  fill={corridorMode === 'CONFIRMED' ? '#F0F8F5' : '#FFFFFF'}
                  stroke={corridorMode === 'CONFIRMED' ? '#16815D' : corridorMode === 'PROPOSED' ? '#2C3480' : '#BB232B'}
                  strokeWidth="1.25"
                  filter="drop-shadow(0 2px 4px rgba(8, 8, 8, 0.08))"
                />
                <text
                  x="0"
                  y="3.5"
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                  fontSize="8"
                  fontWeight="600"
                  fill="#080808"
                >
                  <tspan fontWeight="700" fontFamily="JetBrains Mono, monospace">
                    {activeRoute.distanceKm} km
                  </tspan>
                  <tspan fill="#737373"> • </tspan>
                  <tspan
                    fill={corridorMode === 'CONFIRMED' ? '#16815D' : corridorMode === 'PROPOSED' ? '#2C3480' : '#BB232B'}
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

              let nodeFill = '#FFFFFF';
              let nodeStroke = '#E5E5E8';
              let roleBadgeFill = '#F5F5F7';
              let roleBadgeStroke = '#E5E5E8';
              let roleBadgeText = '#737373';

              if (isRecipient) {
                nodeFill = '#FDF3F3';
                nodeStroke = '#BB232B';
                roleBadgeFill = '#FDF3F3';
                roleBadgeStroke = '#F5CACD';
                roleBadgeText = '#BB232B';
              } else if (isDonor) {
                nodeFill = '#FFFFFF';
                nodeStroke = '#16815D';
                roleBadgeFill = '#F0F8F5';
                roleBadgeStroke = '#BFDFD2';
                roleBadgeText = '#16815D';
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
                          ? 'rgba(20, 37, 54, 0.16)'
                          : isRecipient
                          ? 'rgba(231, 71, 50, 0.12)'
                          : isDonor
                          ? 'rgba(29, 112, 85, 0.12)'
                          : 'rgba(20, 37, 54, 0.08)'
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
                      stroke="#2C3480"
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
                    fill="#080808"
                  >
                    {clinic.code}
                  </text>

                  {/* Facility Name with Crisp White Readability Halo */}
                  <rect
                    x={pos.x - 44}
                    y={pos.labelY - 9}
                    width="88"
                    height="13"
                    rx="2.5"
                    fill="#FFFFFF"
                    stroke="#E5E5E8"
                    strokeWidth="0.5"
                  />
                  <text
                    x={pos.x}
                    y={pos.labelY}
                    textAnchor="middle"
                    fontFamily="Inter, sans-serif"
                    fontSize="9.5"
                    fontWeight="600"
                    fill="#080808"
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
      <div className="pt-2.5 border-t border-[#E5E5E8] text-xs text-[#737373] font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {activeInspectedClinic && inspectedStatus ? (
              <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#F5F5F7] p-2.5 rounded-lg border border-[#E5E5E8]">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-bold text-white bg-[#2C3480] px-1.5 py-0.5 rounded text-[10px]">
                      {activeInspectedClinic.code}
                    </span>
                    <span className="font-semibold text-[#080808] text-xs truncate">
                      {activeInspectedClinic.name}
                    </span>
                    <span className="text-[10px] text-[#737373] bg-white px-1.5 py-0.5 rounded border border-[#E5E5E8] hidden md:inline-block">
                      {activeInspectedClinic.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[#737373] mt-1 font-mono flex-wrap">
                    <span>{activeInspectedClinic.bedsCapacity} beds</span>
                    <span>•</span>
                    <span className="text-[#080808] font-semibold">{inspectedStatus.totalUnits}u in stock</span>
                    {inspectedStatus.criticalCount > 0 ? (
                      <span className="text-[#BB232B] font-bold">
                        • {inspectedStatus.criticalCount} deficits
                      </span>
                    ) : (
                      <span className="text-[#16815D] font-medium">
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
                          : 'bg-white text-[#080808] border-[#E5E5E8] hover:bg-[#E5E5E8]'
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
                    className="text-[#737373] hover:text-[#080808] p-1 rounded hover:bg-[#E5E5E8] cursor-pointer"
                    title="Dismiss inspect card"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : corridorMode === 'FOCUSED' && activeRoute && donorClinic && recipientClinic ? (
              <>
                <Truck className="w-3.5 h-3.5 text-[#BB232B] flex-shrink-0" />
                <span className="text-[11px] truncate">
                  Triage: <strong className="text-[#080808] font-mono">{donorClinic.code}</strong> &rarr;{' '}
                  <strong className="text-[#BB232B] font-mono">{recipientClinic.code}</strong>{' '}
                  <span className="font-mono text-[#080808] font-semibold">({activeRoute.distanceKm} km)</span>
                  {focusedCorridor?.medicineName ? ` • ${focusedCorridor.medicineName}` : ''}
                </span>
              </>
            ) : corridorMode === 'PROPOSED' && activeRoute && donorClinic && recipientClinic ? (
              <>
                <Truck className="w-3.5 h-3.5 text-[#2C3480] flex-shrink-0" />
                <span className="text-[11px] truncate">
                  Proposed: <strong className="text-[#080808] font-mono">{donorClinic.code}</strong> &rarr;{' '}
                  <strong className="text-[#2C3480] font-mono">{recipientClinic.code}</strong>{' '}
                  <span className="font-mono text-[#080808] font-semibold">({activeRoute.distanceKm} km)</span>
                  <span className="text-[#737373] italic ml-1">• Pending Approval (Not Dispatched)</span>
                </span>
              </>
            ) : corridorMode === 'CONFIRMED' && activeRoute && donorClinic && recipientClinic && latestTransfer ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#16815D] flex-shrink-0" />
                <span className="text-[11px] truncate">
                  Dispatched: <strong className="text-[#080808] font-mono">{donorClinic.code}</strong> &rarr;{' '}
                  <strong className="text-[#16815D] font-mono">{recipientClinic.code}</strong>{' '}
                  <span className="font-mono text-[#080808] font-semibold">({latestTransfer.quantity} units, {activeRoute.distanceKm} km)</span>
                  <span className="text-[#16815D] font-medium ml-1">• Session Ledger Confirmed</span>
                </span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-[#16815D] flex-shrink-0" />
                <span className="text-[11px] text-[#16815D] font-medium truncate">
                  All 5 facilities above safety threshold
                </span>
              </>
            )}
          </div>

          {!activeInspectedClinic && (
            <div className="flex items-center gap-2 flex-shrink-0 text-[10px] font-mono text-muted self-end sm:self-auto">
              <span>Min Buffer: 25–40u</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
