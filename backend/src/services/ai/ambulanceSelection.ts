import { predictEmergencyETA, calculateDistanceKm } from './etaPredictor';

export interface AmbulanceCandidate {
  id: string;
  vehicleNumber: string;
  driverId: string | null;
  latitude: number;
  longitude: number;
  status: string; // ALLOW STRING FOR SQLITE PRISMA
  vehicleType: string;
  equipmentLevel: string;
}

export interface AmbulanceSelectionInput {
  emergencyLat: number;
  emergencyLng: number;
  emergencyType: string; // e.g. CARDIAC, ACCIDENT, STROKE, TRAUMA
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  availableAmbulances: any[];
}

export interface RankedAmbulance {
  ambulance: any;
  score: number; // Lower score is better
  distanceKm: number;
  estimatedEtaMin: number;
  capabilityMatch: boolean;
  matchReasons: string[];
}

export function rankAndSelectBestAmbulance(
  input: AmbulanceSelectionInput
): { bestMatch: RankedAmbulance | null; rankedList: RankedAmbulance[] } {
  const { emergencyLat, emergencyLng, emergencyType, priority, availableAmbulances } = input;

  // Filter AVAILABLE ambulances or take candidates
  const candidates = availableAmbulances.filter((a) => a.status === 'AVAILABLE' || a.status === 'RESPONDING');

  if (candidates.length === 0) {
    const fallbackList = availableAmbulances;
    if (fallbackList.length === 0) return { bestMatch: null, rankedList: [] };
  }

  const listToRank = candidates.length > 0 ? candidates : availableAmbulances;

  const rankedList: RankedAmbulance[] = listToRank.map((ambulance) => {
    const distanceKm = calculateDistanceKm(
      ambulance.latitude,
      ambulance.longitude,
      emergencyLat,
      emergencyLng
    );

    const etaResult = predictEmergencyETA({
      originLat: ambulance.latitude,
      originLng: ambulance.longitude,
      destLat: emergencyLat,
      destLng: emergencyLng,
      emergencyPriority: priority,
      trafficFactor: 1.3,
      isGreenCorridorActive: true,
    });

    const matchReasons: string[] = [];
    let capabilityMatch = false;

    // Capability scoring
    if (
      (emergencyType === 'CARDIAC' || emergencyType === 'STROKE') &&
      ambulance.vehicleType === 'ADVANCED_ICU'
    ) {
      capabilityMatch = true;
      matchReasons.push('Advanced ICU equipment matched for Cardiac/Stroke emergency');
    } else if (
      emergencyType === 'ACCIDENT' &&
      (ambulance.vehicleType === 'TRAUMA' || ambulance.vehicleType === 'ADVANCED_ICU')
    ) {
      capabilityMatch = true;
      matchReasons.push('Trauma & Resuscitation equipment matched for Accident site');
    } else if (ambulance.vehicleType === 'ADVANCED_ICU') {
      capabilityMatch = true;
      matchReasons.push('High-spec ICU Ambulance capable of all critical care');
    } else {
      matchReasons.push('Standard Basic Life Support (BLS) Ambulance');
    }

    matchReasons.push(`Estimated travel distance: ${distanceKm} km`);
    matchReasons.push(`Predicted ETA: ${etaResult.estimatedMinutes} mins`);

    let score = etaResult.estimatedMinutes * 0.5 + distanceKm * 0.5;

    if (capabilityMatch) {
      score -= 2.5; // Capability bonus offset
    }

    return {
      ambulance,
      score: parseFloat(score.toFixed(2)),
      distanceKm,
      estimatedEtaMin: etaResult.estimatedMinutes,
      capabilityMatch,
      matchReasons,
    };
  });

  rankedList.sort((a, b) => a.score - b.score);

  return {
    bestMatch: rankedList[0] || null,
    rankedList,
  };
}
