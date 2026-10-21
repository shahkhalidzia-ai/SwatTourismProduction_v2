import React, { useState, useMemo } from 'react';
import {
  Bus,
  MapPin,
  Map,
  Phone,
  ShieldCheck,
  Star,
  Car,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../design/Button';
import { Card } from '../../design/Card';
import {
  POPULAR_ORIGIN_CITIES,
  SWAT_DESTINATIONS,
  queryIntercitySchedules,
  type TransportSchedule,
  type TransportBookingRecord,
} from '../../api/intercityTransport';
import { calculateRouteDetails } from '../../api/routeGeo';
import { IntercityBookingModal } from './IntercityBookingModal';
import { MapModal } from './MapModal';

interface IntercityTransportExplorerProps {
  onAddToTrip?: (schedule: TransportSchedule) => void;
  onViewRouteMap?: (origin: string, destination: string, schedule?: TransportSchedule) => void;
  initialOrigin?: string;
  initialDestination?: string;
}

export const IntercityTransportExplorer: React.FC<IntercityTransportExplorerProps> = ({
  onAddToTrip,
  onViewRouteMap,
  initialOrigin = 'Islamabad / Rawalpindi',
  initialDestination = 'Mingora (Swat Central)',
}) => {
  const [originCity, setOriginCity] = useState<string>(initialOrigin);
  const [destinationCity, setDestinationCity] = useState<string>(initialDestination);
  const [travelDate, setTravelDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedFleetType, setSelectedFleetType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'price_asc' | 'time_asc' | 'rating_desc' | 'fastest'>('price_asc');
  const [activeBookingSchedule, setActiveBookingSchedule] = useState<TransportSchedule | null>(null);
  const [bookingSuccessToast, setBookingSuccessToast] = useState<string | null>(null);
  const [mapModalState, setMapModalState] = useState<{
    isOpen: boolean;
    origin: string;
    destination: string;
    schedule?: TransportSchedule | null;
  }>({
    isOpen: false,
    origin: initialOrigin,
    destination: initialDestination,
  });

  const routeMetrics = useMemo(() => {
    return calculateRouteDetails(originCity, destinationCity);
  }, [originCity, destinationCity]);

  // Filter & query schedules
  const rawSchedules = useMemo(() => {
    return queryIntercitySchedules(originCity, destinationCity, selectedFleetType);
  }, [originCity, destinationCity, selectedFleetType]);

  // Sort results
  const sortedSchedules = useMemo(() => {
    const list = [...rawSchedules];
    switch (sortBy) {
      case 'price_asc':
        return list.sort((a, b) => a.ticket_price_pkr - b.ticket_price_pkr);
      case 'time_asc':
        return list.sort((a, b) => a.departure_time.localeCompare(b.departure_time));
      case 'rating_desc':
        return list.sort((a, b) => b.rating - a.rating);
      case 'fastest':
        return list.sort((a, b) => {
          const parseMin = (s: string) => {
            const h = s.includes('h') ? parseInt(s.split('h')[0]) : 0;
            const m = s.includes('m') ? parseInt(s.split('m')[0].split('h')[1] || '0') : 0;
            return h * 60 + m;
          };
          return parseMin(a.duration_text) - parseMin(b.duration_text);
        });
      default:
        return list;
    }
  }, [rawSchedules, sortBy]);

  const handleBookingSuccess = (record: TransportBookingRecord) => {
    setBookingSuccessToast(
      `Seat reserved with ${record.operator_name}! Reference: ${record.booking_reference}`
    );
    setTimeout(() => {
      setBookingSuccessToast(null);
    }, 6000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} data-testid="intercity-transport-explorer">
      {/* Toast alert */}
      {bookingSuccessToast && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '10px',
            backgroundColor: 'rgba(46, 157, 107, 0.15)',
            border: '1px solid rgba(46, 157, 107, 0.4)',
            color: 'var(--ok)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: 'var(--font-sm)',
            fontWeight: 700,
          }}
        >
          <Sparkles size={18} color="var(--ok)" />
          <span>{bookingSuccessToast}</span>
        </div>
      )}

      {/* 1. Main Search & Filter Console */}
      <Card
        padding="md"
        style={{
          background: 'linear-gradient(135deg, var(--card) 0%, rgba(232, 241, 250, 0.7) 100%)',
          border: '1px solid var(--line)',
          borderRadius: '16px',
          boxShadow: '0 4px 20px -4px rgba(18, 50, 74, 0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--pri)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bus size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                Intercity Transport & Buses to Swat
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--mute)', margin: '1px 0 0 0' }}>
                Compare schedules, luxury express buses, fares, and timings from major cities across Pakistan.
              </p>
            </div>
          </div>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 9px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(46, 157, 107, 0.15)',
              border: '1px solid rgba(46, 157, 107, 0.35)',
              fontSize: '10.5px',
              fontWeight: 700,
              color: 'var(--ok)',
            }}
          >
            <ShieldCheck size={13} color="var(--ok)" />
            <span>KP Tourism Verified Fleets</span>
          </span>
        </div>

        {/* Origin & Destination Selector Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {/* Origin City */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--mute)', marginBottom: '4px' }}>
              ORIGIN CITY (From Pakistan)
            </label>
            <select
              value={originCity}
              onChange={(e) => setOriginCity(e.target.value)}
              data-testid="select-origin-city"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--card)',
                color: 'var(--ink)',
                fontSize: 'var(--font-sm)',
                fontWeight: 600,
                outline: 'none',
              }}
            >
              {POPULAR_ORIGIN_CITIES.map((city) => (
                <option key={city} value={city}>
                  📍 {city}
                </option>
              ))}
            </select>
          </div>

          {/* Destination City */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--mute)', marginBottom: '4px' }}>
              DESTINATION IN SWAT
            </label>
            <select
              value={destinationCity}
              onChange={(e) => setDestinationCity(e.target.value)}
              data-testid="select-destination-city"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--card)',
                color: 'var(--ink)',
                fontSize: 'var(--font-sm)',
                fontWeight: 600,
                outline: 'none',
              }}
            >
              {SWAT_DESTINATIONS.map((dest) => (
                <option key={dest} value={dest}>
                  🏁 {dest}
                </option>
              ))}
            </select>
          </div>

          {/* Travel Date */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--mute)', marginBottom: '4px' }}>
              TRAVEL DATE
            </label>
            <input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--card)',
                color: 'var(--ink)',
                fontSize: 'var(--font-sm)',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Quick Origin Selector Pills */}
        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: 'var(--mute)', fontWeight: 600 }}>Quick Origin:</span>
          {['Islamabad / Rawalpindi', 'Peshawar', 'Lahore', 'Faisalabad', 'Karachi'].map((city) => {
            const isSelected = originCity === city;
            return (
              <button
                key={city}
                type="button"
                onClick={() => setOriginCity(city)}
                style={{
                  padding: '3px 9px',
                  borderRadius: '6px',
                  border: isSelected ? '1px solid var(--pri)' : '1px solid var(--line)',
                  backgroundColor: isSelected ? 'var(--soft)' : 'var(--card)',
                  color: isSelected ? 'var(--pri)' : 'var(--ink)',
                  fontSize: '11px',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  minHeight: 'auto',
                }}
              >
                {city.split(' / ')[0]}
              </button>
            );
          })}
        </div>
      </Card>

      {/* 2. Secondary Filter & Sorting Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        {/* Fleet Type Tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Services' },
            { id: 'luxury_bus', label: 'Luxury Buses (Daewoo / Faisal)' },
            { id: 'express_coaster', label: 'Express Coaches & Shuttles' },
            { id: 'private_car', label: 'Private Chauffeur & Cabs' },
          ].map((tab) => {
            const active = selectedFleetType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedFleetType(tab.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: active ? '1px solid var(--pri)' : '1px solid var(--line)',
                  backgroundColor: active ? 'var(--pri)' : 'var(--card)',
                  color: active ? '#FFFFFF' : 'var(--ink)',
                  fontSize: '11.5px',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  minHeight: 'auto',
                  transition: 'all 0.18s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Sort Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--mute)', fontWeight: 600 }}>Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            data-testid="select-sort-transport"
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid var(--line)',
              backgroundColor: 'var(--card)',
              color: 'var(--ink)',
              fontSize: '11.5px',
              fontWeight: 600,
            }}
          >
            <option value="price_asc">Lowest Ticket Price (PKR)</option>
            <option value="time_asc">Earliest Departure Time</option>
            <option value="fastest">Fastest Travel Duration</option>
            <option value="rating_desc">Highest Customer Rating</option>
          </select>
        </div>
      </div>

      {/* 3. Schedules Count & Route Status Indicator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '11.5px', color: 'var(--mute)' }}>
        <span>
          Showing <strong>{sortedSchedules.length} transport options</strong> from <strong>{originCity}</strong> to <strong>{destinationCity}</strong>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (onViewRouteMap) {
                onViewRouteMap(originCity, destinationCity);
              } else {
                setMapModalState({
                  isOpen: true,
                  origin: originCity,
                  destination: destinationCity,
                });
              }
            }}
            data-testid="btn-view-route-map"
            style={{
              fontSize: '11px',
              padding: '4px 10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              color: 'var(--pri)',
              fontWeight: 600,
            }}
          >
            <Map size={13} color="var(--pri)" />
            <span>View Route Map ({routeMetrics.distanceKm} km • {routeMetrics.durationText})</span>
          </Button>
          <span style={{ color: 'var(--ok)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--ok)' }} />
            Swat Expressway M-16 Clear & Operational
          </span>
        </div>
      </div>

      {/* 4. Schedule Results Cards */}
      {sortedSchedules.length === 0 ? (
        <Card padding="lg" style={{ textAlign: 'center', color: 'var(--mute)' }}>
          <AlertCircle size={32} color="var(--acc)" style={{ margin: '0 auto 8px auto' }} />
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
            No direct transport services found for this specific route.
          </h4>
          <p style={{ fontSize: 'var(--font-xs)', marginTop: '4px' }}>
            Try selecting <strong>Islamabad / Rawalpindi</strong> as the origin city for the highest frequency of Swat Expressway luxury buses.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {sortedSchedules.map((sch) => {
            const isPerVehicle = sch.pricing_type === 'per_vehicle';
            return (
              <Card
                key={sch.id}
                interactive
                padding="md"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  border: '1px solid var(--line)',
                  borderRadius: '14px',
                  boxShadow: '0 2px 10px rgba(18, 50, 74, 0.04)',
                }}
                data-testid="schedule-card"
              >
                {/* Top Row: Operator Info & Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--soft)',
                        border: '1px solid rgba(47, 127, 193, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--pri)',
                      }}
                    >
                      {sch.operator_type === 'private_car' ? <Car size={22} /> : <Bus size={22} />}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--ink)' }}>
                          {sch.operator_name}
                        </span>
                        {sch.is_verified && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(46, 157, 107, 0.14)',
                              color: 'var(--ok)',
                              fontSize: '10px',
                              fontWeight: 700,
                            }}
                          >
                            <ShieldCheck size={11} /> Verified
                          </span>
                        )}
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--ink)',
                          }}
                        >
                          <Star size={12} fill="var(--acc)" color="var(--acc)" />
                          {sch.rating}
                        </span>
                      </div>

                      <div style={{ fontSize: '11.5px', color: 'var(--mute)' }}>
                        {sch.vehicle_title} • <span style={{ color: 'var(--pri)', fontWeight: 600 }}>{sch.frequency}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Box */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--pri)', letterSpacing: '-0.02em' }}>
                      PKR {sch.ticket_price_pkr.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--mute)', fontWeight: 600 }}>
                      {isPerVehicle ? 'Full Vehicle Charter' : 'Per Seat • Taxes Included'}
                    </div>
                  </div>
                </div>

                {/* Timeline Row: Departure -> Duration -> Arrival */}
                <div
                  style={{
                    backgroundColor: 'var(--bg)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    border: '1px solid var(--line)',
                  }}
                >
                  {/* Departure */}
                  <div style={{ minWidth: '130px' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)' }}>
                      {sch.departure_time}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--mute)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={11} color="var(--pri)" />
                      <span>{sch.origin_city.split(' / ')[0]}</span>
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--mute)', opacity: 0.85, marginTop: '2px' }}>
                      {sch.departure_terminal}
                    </div>
                  </div>

                  {/* Travel Duration Pill */}
                  <div style={{ textAlign: 'center', flex: 1, minWidth: '120px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mute)', marginBottom: '3px' }}>
                      {sch.duration_text}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--pri)' }} />
                      <div style={{ flex: 1, maxWidth: '120px', height: '2px', backgroundColor: 'var(--line)', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '-7px', left: '45%', fontSize: '10px' }}>➔</div>
                      </div>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--ok)' }} />
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--ok)', fontWeight: 600, marginTop: '3px' }}>
                      {sch.via_highway}
                    </div>
                  </div>

                  {/* Arrival */}
                  <div style={{ textAlign: 'right', minWidth: '130px' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--pri)' }}>
                      {sch.arrival_time}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--mute)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                      <MapPin size={11} color="var(--ok)" />
                      <span>{sch.destination_city.split(' (')[0]}</span>
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--mute)', opacity: 0.85, marginTop: '2px' }}>
                      {sch.arrival_terminal}
                    </div>
                  </div>
                </div>

                {/* Amenities Badges & Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '4px' }}>
                  {/* Amenities */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {sch.amenities.slice(0, 4).map((amenity) => (
                      <span
                        key={amenity}
                        style={{
                          fontSize: '10.5px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--line)',
                          color: 'var(--mute)',
                          fontWeight: 500,
                        }}
                      >
                        ✓ {amenity}
                      </span>
                    ))}
                    {sch.available_seats <= 10 && !isPerVehicle && (
                      <span
                        style={{
                          fontSize: '10.5px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(242, 163, 58, 0.15)',
                          color: 'var(--acc)',
                          fontWeight: 700,
                        }}
                      >
                        Only {sch.available_seats} seats left
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* Call Hotline */}
                    <a
                      href={`tel:${sch.operator_phone}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--line)',
                        backgroundColor: 'var(--card)',
                        color: 'var(--ink)',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                      title={`Call ${sch.operator_name}`}
                    >
                      <Phone size={13} color="var(--pri)" />
                      <span>{sch.operator_phone}</span>
                    </a>

                    {/* View Route on Map */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (onViewRouteMap) {
                          onViewRouteMap(sch.origin_city, sch.destination_city, sch);
                        } else {
                          setMapModalState({
                            isOpen: true,
                            origin: sch.origin_city,
                            destination: sch.destination_city,
                            schedule: sch,
                          });
                        }
                      }}
                      data-testid={`btn-view-map-${sch.id}`}
                      style={{ fontSize: '11.5px', padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      title={`View highlighted route on map from ${sch.origin_city} to ${sch.destination_city}`}
                    >
                      <Map size={13} color="var(--pri)" />
                      <span>View Map</span>
                    </Button>

                    {/* Add to Itinerary if prop supplied */}
                    {onAddToTrip && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onAddToTrip(sch)}
                        data-testid={`btn-add-itinerary-${sch.id}`}
                        style={{ fontSize: '11.5px', padding: '8px 12px' }}
                      >
                        + Add to Trip
                      </Button>
                    )}

                    {/* Book Seat Modal Trigger */}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setActiveBookingSchedule(sch)}
                      data-testid={`btn-book-seat-${sch.id}`}
                      style={{ fontSize: '11.5px', padding: '8px 16px', fontWeight: 700 }}
                    >
                      {isPerVehicle ? 'Charter Vehicle' : 'Book Seat'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Booking Drawer Modal */}
      <IntercityBookingModal
        isOpen={!!activeBookingSchedule}
        onClose={() => setActiveBookingSchedule(null)}
        schedule={activeBookingSchedule}
        defaultDate={travelDate}
        onBookingSuccess={handleBookingSuccess}
      />

      {/* Interactive Route Map Modal */}
      <MapModal
        isOpen={mapModalState.isOpen}
        onClose={() => setMapModalState((prev) => ({ ...prev, isOpen: false }))}
        title={`${mapModalState.origin.split(' / ')[0]} ➔ ${mapModalState.destination}`}
        latitude={34.7717}
        longitude={72.3602}
        originCity={mapModalState.origin}
        destinationCity={mapModalState.destination}
        durationText={mapModalState.schedule?.duration_text}
        viaHighway={mapModalState.schedule?.via_highway}
      />
    </div>
  );
};
