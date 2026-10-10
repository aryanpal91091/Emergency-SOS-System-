import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapMarkerPoint {
  id: string;
  lat: number;
  lng: number;
  type: 'PATIENT' | 'AMBULANCE' | 'SIGNAL' | 'HOSPITAL';
  label: string;
  status?: string;
  details?: string;
}

interface EmergencyMapProps {
  markers?: MapMarkerPoint[];
  routePolyline?: { lat: number; lng: number }[];
  center?: [number, number];
  zoom?: number;
  height?: string;
}

const createCustomIcon = (type: MapMarkerPoint['type'], status?: string) => {
  let svgHtml = '';
  let iconSize: [number, number] = [36, 36];

  switch (type) {
    case 'PATIENT':
      svgHtml = `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(239, 68, 68, 0.45); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 34px; height: 34px; background: linear-gradient(135deg, #ef4444, #b91c1c); border: 2.5px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(239, 68, 68, 0.9);">
            <span style="font-size: 16px;">🚨</span>
          </div>
        </div>
      `;
      iconSize = [44, 44];
      break;

    case 'AMBULANCE':
      svgHtml = `
        <div style="position: relative; width: 46px; height: 46px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(59, 130, 246, 0.35); animation: pulse 2s infinite;"></div>
          <div style="width: 38px; height: 38px; background: linear-gradient(135deg, #2563eb, #1d4ed8); border: 2.5px solid #60a5fa; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 22px rgba(59, 130, 246, 0.95);">
            <span style="font-size: 18px;">🚑</span>
          </div>
        </div>
      `;
      iconSize = [46, 46];
      break;

    case 'SIGNAL':
      const isGreen = status === 'GREEN_CORRIDOR';
      const isPrepare = status === 'PREPARE';
      const bg = isGreen ? 'linear-gradient(135deg, #10b981, #047857)' : isPrepare ? 'linear-gradient(135deg, #f59e0b, #b45309)' : 'linear-gradient(135deg, #ef4444, #991b1b)';
      const glow = isGreen ? 'rgba(16, 185, 129, 0.95)' : isPrepare ? 'rgba(245, 158, 11, 0.8)' : 'rgba(239, 68, 68, 0.6)';

      svgHtml = `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <div style="width: 30px; height: 30px; background: ${bg}; border: 2px solid #ffffff; border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px ${glow};">
            <span style="font-size: 14px;">🚦</span>
          </div>
        </div>
      `;
      iconSize = [36, 36];
      break;

    case 'HOSPITAL':
      svgHtml = `
        <div style="position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;">
          <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #0284c7, #0369a1); border: 2.5px solid #38bdf8; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(56, 189, 248, 0.9);">
            <span style="font-size: 17px;">🏥</span>
          </div>
        </div>
      `;
      iconSize = [42, 42];
      break;
  }

  return L.divIcon({
    html: svgHtml,
    className: 'custom-map-icon',
    iconSize,
    iconAnchor: [iconSize[0] / 2, iconSize[1] / 2],
  });
};

function MapViewAdjuster({
  markers,
  routePolyline,
}: {
  markers?: MapMarkerPoint[];
  routePolyline?: { lat: number; lng: number }[];
}) {
  const map = useMap();

  useEffect(() => {
    // Invalidate size immediately to guarantee map renders on all screens
    map.invalidateSize();
    const timer = setTimeout(() => map.invalidateSize(), 300);

    const points: [number, number][] = [];
    if (markers && markers.length > 0) {
      markers.forEach((m) => {
        if (typeof m.lat === 'number' && typeof m.lng === 'number' && !isNaN(m.lat) && !isNaN(m.lng)) {
          points.push([m.lat, m.lng]);
        }
      });
    }
    if (routePolyline && routePolyline.length > 0) {
      routePolyline.forEach((p) => {
        if (typeof p.lat === 'number' && typeof p.lng === 'number' && !isNaN(p.lat) && !isNaN(p.lng)) {
          points.push([p.lat, p.lng]);
        }
      });
    }

    if (points.length > 0) {
      try {
        const bounds = L.latLngBounds(points);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [45, 45], maxZoom: 15 });
        }
      } catch (e) {
        console.warn('Map fitBounds notice:', e);
      }
    }

    return () => clearTimeout(timer);
  }, [markers, routePolyline, map]);

  return null;
}

export const EmergencyMap: React.FC<EmergencyMapProps> = ({
  markers = [],
  routePolyline = [],
  center = [28.6139, 77.209],
  zoom = 13,
  height = '460px',
}) => {
  const isLightMode = document.documentElement.getAttribute('data-theme') === 'light';
  const polylinePositions: [number, number][] = routePolyline
    .filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number' && !isNaN(p.lat) && !isNaN(p.lng))
    .map((p) => [p.lat, p.lng]);

  const validMarkers = markers.filter(
    (m) => typeof m.lat === 'number' && typeof m.lng === 'number' && !isNaN(m.lat) && !isNaN(m.lng)
  );

  return (
    <div style={{ height, width: '100%', borderRadius: '0.75rem', overflow: 'hidden' }} className="relative shadow-2xl border border-slate-800/80 bg-slate-950">
      {/* Map Legend Overlay */}
      <div className="absolute top-3 right-3 z-[1000] bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 shadow-lg text-[10px] font-mono text-slate-300 flex items-center gap-3 hidden sm:flex">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Patient</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Ambulance</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Green Corridor</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500" /> Hospital</span>
      </div>

      <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={
            isLightMode
              ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
              : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
          }
          maxZoom={16}
        />

        {polylinePositions.length > 0 && (
          <>
            <Polyline positions={polylinePositions} pathOptions={{ color: '#10b981', weight: 9, opacity: 0.3 }} />
            <Polyline positions={polylinePositions} pathOptions={{ color: '#34d399', weight: 4, dashArray: '8, 8' }} />
          </>
        )}

        {validMarkers.map((marker) => (
          <Marker key={marker.id} position={[marker.lat, marker.lng]} icon={createCustomIcon(marker.type, marker.status)}>
            <Popup>
              <div className="p-1 min-w-[170px]">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-slate-100 text-xs">{marker.label}</span>
                  {marker.status && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        marker.status === 'GREEN_CORRIDOR'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                          : marker.status === 'PREPARE'
                          ? 'bg-amber-950 text-amber-400 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {marker.status}
                    </span>
                  )}
                </div>
                {marker.details && <p className="text-[11px] text-slate-300 m-0 leading-relaxed font-sans">{marker.details}</p>}
                <div className="mt-2 text-[9px] font-mono text-slate-400 border-t border-slate-800 pt-1">
                  GPS: {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        <MapViewAdjuster markers={validMarkers} routePolyline={routePolyline} />
      </MapContainer>
    </div>
  );
};
