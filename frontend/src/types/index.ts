export type Role = 'CITIZEN' | 'DRIVER' | 'POLICE' | 'HOSPITAL' | 'ADMIN';

export type AmbulanceStatus = 'AVAILABLE' | 'RESPONDING' | 'BUSY' | 'OFFLINE';

export type VehicleType = 'BASIC' | 'ADVANCED_ICU' | 'NEONATAL' | 'TRAUMA';

export type SignalStatus = 'NORMAL' | 'PREPARE' | 'GREEN_CORRIDOR';

export type EmergencyStatus =
  | 'SOS_TRIGGERED'
  | 'LOCATION_DETECTED'
  | 'AMBULANCE_SEARCHING'
  | 'AMBULANCE_ASSIGNED'
  | 'AMBULANCE_ACCEPTED'
  | 'EN_ROUTE_TO_PATIENT'
  | 'PATIENT_PICKED_UP'
  | 'EN_ROUTE_TO_HOSPITAL'
  | 'HOSPITAL_READY'
  | 'PATIENT_ARRIVED'
  | 'EMERGENCY_COMPLETED';

export type HospitalAlertStatus = 'PENDING' | 'PREPARING' | 'READY' | 'PATIENT_ARRIVED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
}

export interface Ambulance {
  id: string;
  vehicleNumber: string;
  driverId?: string | null;
  driver?: User | null;
  latitude: number;
  longitude: number;
  status: AmbulanceStatus | string;
  vehicleType: VehicleType | string;
  equipmentLevel: string;
  hospitalId?: string | null;
}

export interface Hospital {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  totalBeds: number;
  availableBeds: number;
  icuBeds: number;
  contactPhone: string;
  alerts?: HospitalAlert[];
}

export interface TrafficSignal {
  id: string;
  signalCode: string;
  name: string;
  latitude: number;
  longitude: number;
  status: SignalStatus | string;
  intersectionGroup: string;
}

export interface HospitalAlert {
  id: string;
  emergencyId: string;
  hospitalId: string;
  status: HospitalAlertStatus | string;
  patientCondition: string;
  notes?: string;
  hospital?: Hospital;
  emergency?: Emergency;
}

export interface Emergency {
  id: string;
  citizenId: string;
  patientName: string;
  patientPhone: string;
  emergencyType: string;
  priority: string;
  status: EmergencyStatus | string;
  latitude: number;
  longitude: number;
  address: string;
  assignedAmbulanceId?: string | null;
  assignedAmbulance?: Ambulance | null;
  targetHospitalId?: string | null;
  targetHospital?: Hospital | null;
  etaMinutes?: number | null;
  createdAt: string;
  updatedAt: string;
  routes?: any[];
  hospAlerts?: HospitalAlert[];
  trafficAlerts?: any[];
}
