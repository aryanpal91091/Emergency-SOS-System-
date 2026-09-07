import { calculateDistanceKm } from './etaPredictor';

export interface TrafficSignalData {
  id: string;
  signalCode: string;
  name: string;
  latitude: number;
  longitude: number;
  status: string;
  intersectionGroup: string;
}

export interface RouteWaypoint {
  lat: number;
  lng: number;
}

export interface GreenCorridorSchedule {
  signalId: string;
  signalCode: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceFromStartKm: number;
  etaSecondsFromStart: number;
  status: string;
}

export interface CorridorPlanResult {
  waypoints: RouteWaypoint[];
  totalDistanceKm: number;
  estimatedDurationMin: number;
  upcomingSignals: GreenCorridorSchedule[];
}

export function generateCorridorPlan(
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number,
  signals: any[]
): CorridorPlanResult {
  const totalDistanceKm = calculateDistanceKm(startLat, startLng, destLat, destLng);
  
  const steps = 6;
  const waypoints: RouteWaypoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const lat = startLat + (destLat - startLat) * ratio;
    const lng = startLng + (destLng - startLng) * ratio;
    waypoints.push({
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
    });
  }

  const averageSpeedKmh = 50;
  const upcomingSignals: GreenCorridorSchedule[] = signals.map((signal) => {
    const distToSignalKm = calculateDistanceKm(startLat, startLng, signal.latitude, signal.longitude);
    const etaSecondsFromStart = Math.round((distToSignalKm / averageSpeedKmh) * 3600);

    return {
      signalId: signal.id,
      signalCode: signal.signalCode,
      name: signal.name,
      latitude: signal.latitude,
      longitude: signal.longitude,
      distanceFromStartKm: distToSignalKm,
      etaSecondsFromStart,
      status: signal.status,
    };
  });

  upcomingSignals.sort((a, b) => a.distanceFromStartKm - b.distanceFromStartKm);

  const estimatedDurationMin = parseFloat(((totalDistanceKm / averageSpeedKmh) * 60).toFixed(1));

  return {
    waypoints,
    totalDistanceKm,
    estimatedDurationMin,
    upcomingSignals,
  };
}
