/* Legacy CitizenApp Backup */
import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Navigation,
  PhoneCall,
  Hospital,
  Clock,
  MapPin,
  CheckCircle2,
  Check,
  Loader2,
  AlertTriangle,
  Radio,
  UserCheck,
  Zap,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { emergencyApi } from '../services/api';
import { socket } from '../services/socket';
import { EmergencyMap, MapMarkerPoint } from '../components/map/EmergencyMap';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmergencyTimeline } from '../components/ui/EmergencyTimeline';

const EMERGENCY_TYPES = [
  { id: 'ACCIDENT', label: 'Road Accident', icon: '🚗', color: 'border-red-500/40 text-red-400 bg-red-950/40' },
  { id: 'CARDIAC', label: 'Cardiac Arrest', icon: '🫀', color: 'border-rose-500/40 text-rose-400 bg-rose-950/40' },
  { id: 'STROKE', label: 'Stroke & Brain', icon: '🧠', color: 'border-purple-500/40 text-purple-400 bg-purple-950/40' },
  { id: 'TRAUMA', label: 'Severe Trauma', icon: '🩸', color: 'border-amber-500/40 text-amber-400 bg-amber-950/40' },
];

export const CitizenApp: React.FC = () => {
  const [sosActive, setSosActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emergencyData, setEmergencyData] = useState<any>(null);
  const [emergencyType, setEmergencyType] = useState('ACCIDENT');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState('Detecting GPS location...');
  const [liveAmbulancePos, setLiveAmbulancePos] = useState<{ lat: number; lng: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationStatus('GPS Location Verified (High Precision)');
        },
        () => {
          setUserLocation({ lat: 28.6175, lng: 77.213 });
          setLocationStatus('GPS Fallback Active (Central Hub)');
        },
        { timeout: 8000 }
      );
    } else {
      setUserLocation({ lat: 28.6175, lng: 77.213 });
      setLocationStatus('GPS Fallback Active (Central Hub)');
    }
  }, []);

  useEffect(() => {
    socket.on('emergency:created', (data: any) => {
      if (data?.emergency) {
        setEmergencyData(data.emergency);
        setSosActive(true);
        if (data.assignedAmbulance) {
          setLiveAmbulancePos({
            lat: data.assignedAmbulance.latitude,
            lng: data.assignedAmbulance.longitude,
          });
        }
      }
    });

    socket.on('live:ambulance_position', (data: any) => {
      setLiveAmbulancePos({ lat: data.latitude, lng: data.longitude });
    });

    socket.on('emergency:status_changed', (data: any) => {
      if (emergencyData && data.emergencyId === emergencyData.id) {
        setEmergencyData((prev: any) => ({ ...prev, status: data.status }));
      }
    });

    return () => {
      socket.off('emergency:created');
      socket.off('live:ambulance_position');
      socket.off('emergency:status_changed');
    };
  }, [emergencyData]);

  const handleTriggerSOS = async () => {
    if (!userLocation) return;
    setErrorMessage(null);
    try {
      setLoading(true);
      const res = await emergencyApi.triggerSOS({
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        address: 'Connaught Circle Emergency Zone, Sector 1',
        emergencyType,
        priority: 'CRITICAL',
      });

      if (res.data?.success) {
        setEmergencyData(res.data.emergency);
        setSosActive(true);
        if (res.data.assignedAmbulance) {
          setLiveAmbulancePos({
            lat: res.data.assignedAmbulance.latitude,
            lng: res.data.assignedAmbulance.longitude,
          });
        }
      }
    } catch (err: any) {
      console.error('Trigger SOS error:', err);
      setErrorMessage(err.message || 'Failed to connect to backend emergency services');
    } finally {
      setLoading(false);
    }
  };

  const handleResetEmergency = () => {
    setSosActive(false);
    setEmergencyData(null);
    setLiveAmbulancePos(null);
    setErrorMessage(null);
  };

  return <div>Legacy CitizenApp Backup</div>;
};
