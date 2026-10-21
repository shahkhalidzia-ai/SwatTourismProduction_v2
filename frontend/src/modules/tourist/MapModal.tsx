import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { X, ExternalLink, Navigation, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '../../design/Button';
import { POPULAR_ORIGIN_CITIES } from '../../api/intercityTransport';
import { calculateRouteDetails } from '../../api/routeGeo';

export interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  latitude: number;
  longitude: number;
  areaName?: string;
  categoryOrType?: string;
  originCity?: string;
  destinationCity?: string;
  distanceKm?: number;
  durationText?: string;
  viaHighway?: string;
}

export const MapModal: React.FC<MapModalProps> = ({
  isOpen,
  onClose,
  title,
  latitude,
  longitude,
  areaName,
  categoryOrType,
  originCity: initialOriginCity,
  destinationCity: initialDestinationCity,
  distanceKm: initialDistanceKm,
  durationText: initialDurationText,
  viaHighway: initialViaHighway,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const [selectedOrigin, setSelectedOrigin] = useState<string>(
    initialOriginCity || 'Islamabad / Rawalpindi'
  );

  // Sync state if initialOriginCity prop updates
  useEffect(() => {
    if (initialOriginCity) {
      setSelectedOrigin(initialOriginCity);
    }
  }, [initialOriginCity]);

  // Compute realistic route geometry, distance in km, and expected travel time
  const route = useMemo(() => {
    const destinationInput =
      initialDestinationCity || areaName || title || { lat: latitude, lng: longitude, title };
    return calculateRouteDetails(selectedOrigin, destinationInput);
  }, [selectedOrigin, initialDestinationCity, areaName, title, latitude, longitude]);

  const displayDistanceKm = initialDistanceKm ?? route.distanceKm;
  const displayDurationText = initialDurationText ?? route.durationText;
  const displayViaHighway = initialViaHighway ?? route.viaHighway;

  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Timeout allows DOM modal animation to render before leaflet calculates bounds
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      // Clean up previous instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: route.destinationCoords,
        zoom: 9,
        zoomControl: true,
      });
      mapInstanceRef.current = map;

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // 1. Highlighted Highway Path Polyline
      // Outer glow line for high contrast
      L.polyline(route.waypoints, {
        color: '#38BDF8',
        weight: 9,
        opacity: 0.45,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // Inner bold primary route line
      const routePolyline = L.polyline(route.waypoints, {
        color: '#0284C7',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      routePolyline.bindPopup(`
        <div style="font-family: inherit; font-size: 12.5px; line-height: 1.45;">
          <strong style="color: #0284C7; font-size: 13.5px;">🛣️ Route: ${route.originCity} ➔ ${route.destinationCity}</strong><br/>
          <strong>Distance:</strong> ${displayDistanceKm} km<br/>
          <strong>Expected Travel Time:</strong> ${displayDurationText}<br/>
          <span style="color: #5E7A92;">${displayViaHighway}</span>
        </div>
      `);

      // 2. Custom styled Origin Pin (Green Departure)
      const originIcon = L.divIcon({
        className: 'swat-leaflet-origin-pin',
        html: `
          <div style="
            background: #10B981;
            color: #ffffff;
            width: 34px;
            height: 34px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px rgba(16, 185, 129, 0.45);
            border: 2px solid #ffffff;
          ">
            <span style="transform: rotate(45deg); font-size: 16px;">🟢</span>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -34],
      });

      const originMarker = L.marker(route.originCoords, { icon: originIcon }).addTo(map);
      originMarker.bindPopup(`
        <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
          <strong style="color: #059669; font-size: 13.5px;">📍 Departure: ${route.originCity}</strong><br/>
          <span style="color: #5E7A92;">Starting Point to Swat Valley</span>
        </div>
      `);

      // 3. Custom styled Destination Pin (Blue Arrival)
      const destIcon = L.divIcon({
        className: 'swat-leaflet-dest-pin',
        html: `
          <div style="
            background: #2563EB;
            color: #ffffff;
            width: 36px;
            height: 36px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.45);
            border: 2px solid #ffffff;
          ">
            <span style="transform: rotate(45deg); font-size: 16px;">🏁</span>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      const destMarker = L.marker(route.destinationCoords, { icon: destIcon }).addTo(map);
      destMarker.bindPopup(`
        <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
          <strong style="color: #1E40AF; font-size: 14px;">🏁 Arrival: ${title || route.destinationCity}</strong><br/>
          <span style="color: #5E7A92;">${areaName || 'Swat Valley, KP'}</span><br/>
          <strong style="color: #059669; font-size: 12px; display: inline-block; margin-top: 3px;">
            ${displayDistanceKm} km • Expected: ${displayDurationText}
          </strong>
        </div>
      `).openPopup();

      // Fit map bounds to encompass the entire highlighted path
      try {
        const bounds = routePolyline.getBounds();
        if (bounds.isValid && bounds.isValid()) {
          map.fitBounds(bounds, { padding: [45, 45] });
        }
      } catch {
        // Fallback to center view if bounds calculation is constrained
        map.setView(route.destinationCoords, 9);
      }

      map.invalidateSize();
    }, 120);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [
    isOpen,
    route,
    title,
    areaName,
    displayDistanceKm,
    displayDurationText,
    displayViaHighway,
  ]);

  if (!isOpen) return null;

  const gmapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    selectedOrigin
  )}&destination=${latitude},${longitude}&travelmode=driving`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(18, 50, 74, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={onClose}
      data-testid="map-route-modal"
    >
      <div
        style={{
          backgroundColor: 'var(--card)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--line)',
          width: '100%',
          maxWidth: '760px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 48px rgba(18, 50, 74, 0.22)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'var(--soft)',
                color: 'var(--pri)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Navigation size={22} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: 'var(--font-lg)',
                  color: 'var(--ink)',
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                {selectedOrigin.split(' / ')[0]} ➔ {title || route.destinationCity}
              </h3>
              <p
                style={{
                  fontSize: 'var(--font-xs)',
                  color: 'var(--mute)',
                  margin: '2px 0 0 0',
                }}
              >
                Highlighted Route • Swat Valley Travel Map {categoryOrType ? `• ${categoryOrType}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: '8px',
              color: 'var(--mute)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            aria-label="Close map"
            data-testid="btn-close-map-modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Route Details & Metrics Bar */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: 'rgba(235, 245, 255, 0.65)',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          data-testid="route-metrics-bar"
        >
          {/* Origin selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--mute)',
                textTransform: 'uppercase',
              }}
            >
              Origin City:
            </span>
            <select
              value={selectedOrigin}
              onChange={(e) => setSelectedOrigin(e.target.value)}
              data-testid="map-origin-selector"
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--card)',
                color: 'var(--ink)',
                fontSize: '12px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {POPULAR_ORIGIN_CITIES.map((city) => (
                <option key={city} value={city}>
                  📍 {city}
                </option>
              ))}
            </select>
          </div>

          {/* Distance & Expected Travel Time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {/* Distance in KM */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              data-testid="metric-distance"
            >
              <Navigation size={15} color="var(--pri)" />
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    color: 'var(--mute)',
                    display: 'block',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                  }}
                >
                  Distance
                </span>
                <strong
                  style={{ fontSize: '13.5px', color: 'var(--pri)' }}
                  data-testid="map-distance-km"
                >
                  {displayDistanceKm} km
                </strong>
              </div>
            </div>

            {/* Expected Travel Time */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              data-testid="metric-travel-time"
            >
              <Clock size={15} color="#0284C7" />
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    color: 'var(--mute)',
                    display: 'block',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                  }}
                >
                  Expected Travel Time
                </span>
                <strong
                  style={{ fontSize: '13.5px', color: 'var(--ink)' }}
                  data-testid="map-travel-time"
                >
                  {displayDurationText}
                </strong>
              </div>
            </div>

            {/* Highway Corridor */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              data-testid="metric-highway"
            >
              <ShieldCheck size={15} color="var(--ok)" />
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    color: 'var(--mute)',
                    display: 'block',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                  }}
                >
                  Corridor
                </span>
                <span
                  style={{ fontSize: '11px', color: 'var(--ok)', fontWeight: 700 }}
                  data-testid="map-via-highway"
                >
                  {displayViaHighway}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div
          ref={mapContainerRef}
          data-testid="leaflet-map-container"
          style={{
            width: '100%',
            height: '400px',
            backgroundColor: '#e5e3df',
          }}
        />

        {/* Footer with Route Summary, Navigation Link, and Close */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            fontSize: 'var(--font-xs)',
            color: 'var(--mute)',
            background: 'var(--card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                }}
              />
              <strong>{route.originCity.split(' / ')[0]}</strong>
            </span>
            <span>➔</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#2563EB',
                }}
              />
              <strong>{title || route.destinationCity.split(' (')[0]}</strong>
            </span>
            <span
              style={{
                color: 'var(--pri)',
                fontWeight: 700,
                backgroundColor: 'var(--soft)',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              {displayDistanceKm} km • ~{displayDurationText}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <a
              href={gmapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--pri)',
                fontWeight: 600,
                fontSize: 'var(--font-xs)',
                textDecoration: 'none',
              }}
            >
              Driving Directions <ExternalLink size={12} />
            </a>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
