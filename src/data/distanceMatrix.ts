import { Clinic } from '../types';

// Pre-calculated road network distance (in km) and standard medical courier travel time (in minutes)
const ROAD_MATRIX: Record<string, Record<string, { distanceKm: number; transitMinutes: number }>> = {
  c1: { // Metro Hope General
    c1: { distanceKm: 0, transitMinutes: 0 },
    c2: { distanceKm: 5.4, transitMinutes: 14 },
    c3: { distanceKm: 6.8, transitMinutes: 16 },
    c4: { distanceKm: 8.2, transitMinutes: 20 },
    c5: { distanceKm: 18.5, transitMinutes: 32 },
  },
  c2: { // St. Jude Community Health
    c1: { distanceKm: 5.4, transitMinutes: 14 },
    c2: { distanceKm: 0, transitMinutes: 0 },
    c3: { distanceKm: 8.9, transitMinutes: 22 },
    c4: { distanceKm: 12.1, transitMinutes: 28 },
    c5: { distanceKm: 15.3, transitMinutes: 27 },
  },
  c3: { // Riverdale Pediatric Clinic
    c1: { distanceKm: 6.8, transitMinutes: 16 },
    c2: { distanceKm: 8.9, transitMinutes: 22 },
    c3: { distanceKm: 0, transitMinutes: 0 },
    c4: { distanceKm: 9.5, transitMinutes: 21 },
    c5: { distanceKm: 23.4, transitMinutes: 38 },
  },
  c4: { // Northside Urgent Care
    c1: { distanceKm: 8.2, transitMinutes: 20 },
    c2: { distanceKm: 12.1, transitMinutes: 28 },
    c3: { distanceKm: 9.5, transitMinutes: 21 },
    c4: { distanceKm: 0, transitMinutes: 0 },
    c5: { distanceKm: 14.8, transitMinutes: 26 },
  },
  c5: { // Pinecrest Family Medical
    c1: { distanceKm: 18.5, transitMinutes: 32 },
    c2: { distanceKm: 15.3, transitMinutes: 27 },
    c3: { distanceKm: 23.4, transitMinutes: 38 },
    c4: { distanceKm: 14.8, transitMinutes: 26 },
    c5: { distanceKm: 0, transitMinutes: 0 },
  },
};

export const getRouteInfo = (fromClinicId: string, toClinicId: string, isEmergency = false) => {
  if (ROAD_MATRIX[fromClinicId] && ROAD_MATRIX[fromClinicId][toClinicId]) {
    const base = ROAD_MATRIX[fromClinicId][toClinicId];
    return {
      distanceKm: base.distanceKm,
      transitMinutes: isEmergency ? Math.max(5, Math.round(base.transitMinutes * 0.65)) : base.transitMinutes,
    };
  }

  return { distanceKm: 10.0, transitMinutes: isEmergency ? 12 : 25 };
};

// Fallback Haversine if custom clinics are dynamically added
export const calculateHaversineDistance = (c1: Clinic, c2: Clinic): number => {
  const R = 6371; // Earth radius in km
  const dLat = ((c2.coordinates.lat - c1.coordinates.lat) * Math.PI) / 180;
  const dLon = ((c2.coordinates.lng - c1.coordinates.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1.coordinates.lat * Math.PI) / 180) *
      Math.cos((c2.coordinates.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};
