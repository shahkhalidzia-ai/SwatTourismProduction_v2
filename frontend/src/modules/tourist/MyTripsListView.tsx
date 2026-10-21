import React, { useState } from 'react';
import { Card } from '../../design/Card';
import { Button } from '../../design/Button';
import { Tag } from '../../design/Tag';
import {
  Calendar,
  Users,
  Compass,
  Plus,
  Star,
  Plane,
  X,
  History,
  Check,
  ChevronRight,
  AlertCircle,
  Trash2,
  Wallet,
  Clock,
  Save,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { Trip } from '../../api/trips';
import { AITripGeneratorModal } from './AITripGeneratorModal';

export interface MyTripsListViewProps {
  trips: Trip[];
  activeTripId: string | null;
  onSelectActiveTrip: (tripId: string) => void;
  onOpenTrip: (trip: Trip) => void;
  onCreateTrip: (data: {
    title: string;
    start_date?: string;
    end_date?: string;
    travellers: number;
    notes?: string;
  }) => Promise<Trip | void>;
  onDeleteTrip?: (tripId: string) => Promise<void>;
  onWriteReview?: (trip: Trip) => void;
}

export const MyTripsListView: React.FC<MyTripsListViewProps> = ({
  trips,
  activeTripId,
  onSelectActiveTrip,
  onOpenTrip,
  onCreateTrip,
  onDeleteTrip,
  onWriteReview,
}) => {
  const [showNewTripModal, setShowNewTripModal] = useState(false);
  const [showAIGeneratorModal, setShowAIGeneratorModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form state for + New trip
  const [title, setTitle] = useState('Autumn in Swat');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [nights, setNights] = useState(3);
  const [travellers, setTravellers] = useState(2);
  const [budget, setBudget] = useState('45000');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Sightseeing',
    'Trout Dining',
  ]);
  const [showPreferences, setShowPreferences] = useState(false);

  const quickDestinations = [
    'Kalam Valley',
    'Malam Jabba Ski Resort',
    'Mahodand & Ushu',
    'Kumrat Explorer',
  ];

  const availableInterests = [
    'Sightseeing',
    'Trout Dining',
    'Hiking & Trekking',
    'Riverside Stays',
    'Cultural Crafts',
    'Photography',
  ];

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      // Calculate end_date based on start_date and nights
      let endDateStr: string | undefined = undefined;
      if (startDate) {
        const start = new Date(startDate);
        const end = new Date(start.getTime() + nights * 86400000);
        endDateStr = end.toISOString().split('T')[0];
      }

      const notesParts: string[] = [];
      if (budget) notesParts.push(`Budget: PKR ${budget}`);
      if (selectedInterests.length > 0)
        notesParts.push(`Interests: ${selectedInterests.join(', ')}`);

      const createdTrip = await onCreateTrip({
        title: title.trim(),
        start_date: startDate || undefined,
        end_date: endDateStr,
        travellers: travellers || 1,
        notes: notesParts.join(' | ') || undefined,
      });
      setShowNewTripModal(false);
      setErrorMessage(null);
      if (createdTrip) {
        onOpenTrip(createdTrip);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create trip. Please check details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Curated Itinerary Templates (1-Click Setup: Less Input, More Output)
  const CURATED_PACKAGES = [
    {
      id: 'kalam-alpine',
      title: '3-Day Kalam Alpine Tour',
      badge: 'Most Popular',
      durationDays: 3,
      durationText: '3 Days / 2 Nights',
      budget: 28000,
      icon: '🏔️',
      highlights: ['Kalam Valley & River Confluence', 'Mahodand Lake 4x4 Jeep Safari', 'Ushu Ancient Cedar Forest'],
      notes: 'Kalam Valley Alpine Safari with Mahodand Lake 4x4 and Ushu Forest tour',
    },
    {
      id: 'malam-jabba-adventure',
      title: '2-Day Malam Jabba Ski & Adventure',
      badge: 'Adventure & Snow',
      durationDays: 2,
      durationText: '2 Days / 1 Night',
      budget: 18500,
      icon: '⛷️',
      highlights: ['Malam Jabba Resort & Chairlift Peak', 'Alpine Zipline & Giant Swing', 'Saidu Sharif White Palace (Marghuzar)'],
      notes: 'Malam Jabba Ski Resort & White Palace Heritage Experience',
    },
    {
      id: 'bahrain-cultural',
      title: 'Weekend Bahrain & Trout Trail',
      badge: 'Relaxation & Culture',
      durationDays: 2,
      durationText: '2 Days / 1 Night',
      budget: 15000,
      icon: '🌊',
      highlights: ['Bahrain River Confluence & Roaring Waters', 'Woodcrafts & Wild Honey Bazaars', 'Miandam Valley Terraced Orchards'],
      notes: 'Weekend Swat Valley Cultural & Riverside Culinary Experience',
    },
  ];

  const handleUseCuratedItinerary = async (pkg: typeof CURATED_PACKAGES[0]) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const now = new Date();
      const start = new Date(now.getTime() + 86400000 * 2);
      const end = new Date(start.getTime() + 86400000 * pkg.durationDays);
      const startDateStr = start.toISOString().split('T')[0];
      const endDateStr = end.toISOString().split('T')[0];

      const createdTrip = await onCreateTrip({
        title: pkg.title,
        start_date: startDateStr,
        end_date: endDateStr,
        travellers: 2,
        notes: `${pkg.notes} | Curated Budget: PKR ${pkg.budget.toLocaleString()}`,
      });
      if (createdTrip) {
        onOpenTrip(createdTrip);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initialize curated itinerary. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Partition into upcoming and past trips
  const todayStr = new Date().toISOString().split('T')[0];

  const isTripPast = (trip: Trip) => {
    if (trip.status === 'completed' || trip.status === 'cancelled') return true;
    if (trip.status === 'planned' || trip.status === 'draft') return false;
    if (trip.end_date && trip.end_date < todayStr) return true;
    return false;
  };

  const upcomingTrips = trips.filter((t) => !isTripPast(t));
  const pastTrips = trips.filter((t) => isTripPast(t));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header Card with Prominent + New Trip Button */}
      <Card
        padding="lg"
        style={{
          background: 'linear-gradient(135deg, var(--card) 0%, rgba(211, 230, 247, 0.45) 100%)',
          border: '1.5px solid rgba(27, 79, 114, 0.18)',
          borderRadius: '16px',
          boxShadow: '0 6px 20px rgba(18, 50, 74, 0.08)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Plane size={24} color="var(--pri)" />
              <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                My Trips
              </h2>
            </div>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--mute)', margin: 0 }}>
              Plan, customize itineraries, manage bookings, and track every stop across Swat Valley.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              size="md"
              icon={<Sparkles size={16} color="var(--acc)" />}
              onClick={() => setShowAIGeneratorModal(true)}
              data-testid="btn-open-ai-generator"
              id="btn-open-ai-generator"
              style={{
                borderRadius: '10px',
                fontWeight: 750,
                backgroundColor: '#F0FDF4',
                color: '#065F46',
                border: '1.5px solid #86EFAC',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)',
              }}
            >
              ✨ AI Trip Builder
            </Button>

            <Button
              variant="primary"
              size="md"
              icon={<Plus size={18} />}
              onClick={() => setShowNewTripModal(true)}
              id="btn-new-trip"
              style={{
                background: 'linear-gradient(135deg, var(--pri) 0%, #164670 100%)',
                color: '#FFFFFF',
                boxShadow: '0 4px 14px rgba(27, 79, 114, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '10px',
                fontWeight: 800,
                padding: '10px 18px',
              }}
            >
              + New trip
            </Button>
          </div>
        </div>
      </Card>

      {/* 🌟 1-Click Curated Swat Itineraries (Less Input, More Output) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--pri)" />
            <div>
              <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                1-Click Curated Itineraries
              </h3>
              <p style={{ fontSize: '11.5px', color: 'var(--mute)', margin: '2px 0 0 0' }}>
                Zero-planning ready packages — verified stays, 4x4 rides & scenic stops pre-assembled
              </p>
            </div>
          </div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 10px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: '#059669',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            <Zap size={12} /> Less Input • Instant Output
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {CURATED_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              style={{
                backgroundColor: 'var(--card)',
                borderRadius: '14px',
                border: '1.5px solid rgba(27, 79, 114, 0.12)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 16px rgba(18, 50, 74, 0.05)',
                transition: 'transform 0.18s ease, box-shadow 0.18s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '24px' }}>{pkg.icon}</span>
                  <Tag variant="accent" style={{ fontSize: '10.5px', fontWeight: 700 }}>
                    {pkg.badge}
                  </Tag>
                </div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 750, color: 'var(--ink)' }}>
                  {pkg.title}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--mute)', marginBottom: '10px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                    <Calendar size={12} color="var(--pri)" /> {pkg.durationText}
                  </span>
                  <span>•</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#059669', fontWeight: 700 }}>
                    <Wallet size={12} /> PKR {pkg.budget.toLocaleString()} (Est.)
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '14px' }}>
                  {pkg.highlights.map((h, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--ink)' }}>
                      <Check size={12} color="#059669" style={{ strokeWidth: 2.5, flexShrink: 0 }} />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleUseCuratedItinerary(pkg)}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '9px',
                  backgroundColor: 'var(--pri)',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(47, 127, 193, 0.25)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Sparkles size={13} />
                <span>Use This Itinerary (1-Click)</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming / Active Trips Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
            Upcoming & Active Plans ({upcomingTrips.length})
          </h3>
        </div>

        {upcomingTrips.length === 0 ? (
          <Card
            padding="lg"
            style={{
              textAlign: 'center',
              background: 'var(--card)',
              border: '1.5px solid rgba(18, 50, 74, 0.12)',
              borderRadius: '16px',
              boxShadow: '0 4px 16px rgba(18, 50, 74, 0.04)',
            }}
          >
            <Compass size={44} color="var(--mute)" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: 'var(--font-md)', fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px' }}>
              No upcoming trips planned yet
            </h4>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--mute)', maxWidth: '420px', margin: '0 auto 16px' }}>
              Create your itinerary, set your travel dates, and start adding hotels, transport, and mountain activities from Explore.
            </p>
            <Button
              variant="primary"
              size="md"
              icon={<Plus size={18} />}
              onClick={() => setShowNewTripModal(true)}
              style={{
                background: 'linear-gradient(135deg, var(--pri) 0%, #164670 100%)',
                color: '#FFFFFF',
                boxShadow: '0 4px 14px rgba(27, 79, 114, 0.35)',
                fontWeight: 700,
              }}
            >
              + New trip
            </Button>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {upcomingTrips.map((trip) => {
              const isActive = trip.id === activeTripId;
              const bookingCount = trip.summary
                ? trip.summary.confirmed_count + trip.summary.waiting_count + trip.summary.need_action_count
                : 0;
              const stopCount = trip.stops ? trip.stops.length : 0;

              return (
                <Card
                  key={trip.id}
                  padding="md"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: isActive ? '2px solid var(--pri)' : '1.5px solid rgba(18, 50, 74, 0.14)',
                    boxShadow: isActive
                      ? '0 8px 24px -4px rgba(27, 79, 114, 0.22), 0 2px 6px rgba(0,0,0,0.04)'
                      : '0 4px 16px -2px rgba(18, 50, 74, 0.07)',
                    background: isActive ? 'linear-gradient(180deg, #FFFFFF 0%, #F5F9FD 100%)' : 'var(--card)',
                    borderRadius: '16px',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                  }}
                  id={`trip-card-${trip.id}`}
                >
                  <div>
                    {/* Header line with title and active badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                      <h4 style={{ fontSize: 'var(--font-md)', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                        {trip.title}
                      </h4>
                      {isActive ? (
                        <Tag variant="ok" style={{ fontWeight: 800, boxShadow: '0 2px 6px rgba(46, 157, 107, 0.2)' }}>
                          Active (Adding to this)
                        </Tag>
                      ) : (
                        <Tag variant="soft" style={{ fontWeight: 700 }}>{trip.status.toUpperCase()}</Tag>
                      )}
                    </div>

                    {/* Dates & Travelers */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                        <Calendar size={14} color="var(--pri)" />
                        <span>
                          {trip.start_date || 'Dates flexible'}
                          {trip.end_date ? ` to ${trip.end_date}` : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                        <Users size={14} color="var(--pri)" />
                        <span>{trip.travellers} traveller{trip.travellers > 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Stats Pill Bar */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        padding: '9px 14px',
                        background: '#EEF5FA',
                        borderRadius: '10px',
                        border: '1px solid rgba(27, 79, 114, 0.12)',
                        marginBottom: '16px',
                        fontSize: 'var(--font-xs)',
                      }}
                    >
                      <div>
                        <strong style={{ color: 'var(--ink)' }}>{stopCount}</strong>{' '}
                        <span style={{ color: 'var(--mute)' }}>stop{stopCount !== 1 ? 's' : ''}</span>
                      </div>
                      <div style={{ color: 'var(--line)' }}>•</div>
                      <div>
                        <strong style={{ color: 'var(--ink)' }}>{bookingCount}</strong>{' '}
                        <span style={{ color: 'var(--mute)' }}>booking{bookingCount !== 1 ? 's' : ''}</span>
                      </div>
                      {trip.summary && trip.summary.trip_total > 0 && (
                        <>
                          <div style={{ color: 'var(--line)' }}>•</div>
                          <div>
                            <strong style={{ color: 'var(--pri)' }}>
                              PKR {trip.summary.trip_total.toLocaleString()}
                            </strong>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1.5px solid rgba(18, 50, 74, 0.08)' }}>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<ChevronRight size={16} />}
                      onClick={() => onOpenTrip(trip)}
                      id={`btn-open-trip-${trip.id}`}
                      style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, var(--pri) 0%, #1A5487 100%)',
                        color: '#FFFFFF',
                        boxShadow: '0 3px 10px rgba(27, 79, 114, 0.28)',
                        fontWeight: 700,
                        borderRadius: '8px',
                        border: 'none',
                        minHeight: '34px',
                      }}
                    >
                      Open trip
                    </Button>

                    {!isActive && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Check size={14} />}
                        onClick={() => onSelectActiveTrip(trip.id)}
                        title="Set this trip as active so items from Explore are added here"
                        style={{
                          background: '#FFFFFF',
                          border: '1.5px solid var(--pri)',
                          color: 'var(--pri)',
                          fontWeight: 700,
                          boxShadow: '0 2px 6px rgba(27, 79, 114, 0.1)',
                          borderRadius: '8px',
                          minHeight: '34px',
                        }}
                      >
                        Set active
                      </Button>
                    )}

                    {onDeleteTrip && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Trash2 size={14} color="var(--err)" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Are you sure you want to delete trip "${trip.title}"?`)) {
                            onDeleteTrip(trip.id);
                          }
                        }}
                        title="Delete this trip"
                        id={`btn-delete-trip-${trip.id}`}
                        style={{
                          background: '#FFF5F5',
                          border: '1.5px solid rgba(220, 38, 38, 0.35)',
                          color: '#DC2626',
                          fontWeight: 700,
                          borderRadius: '8px',
                          minHeight: '34px',
                        }}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Trips Section */}
      <div style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <History size={18} color="var(--mute)" />
          <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
            Past Trips ({pastTrips.length})
          </h3>
        </div>

        {pastTrips.length === 0 ? (
          <Card
            padding="md"
            style={{
              background: 'var(--card)',
              color: 'var(--mute)',
              fontSize: 'var(--font-sm)',
              border: '1.5px solid rgba(18, 50, 74, 0.12)',
              borderRadius: '16px',
            }}
          >
            No past trips yet. Once your scheduled trips conclude, they will appear here along with review options for your completed bookings.
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {pastTrips.map((trip) => {
              const stopCount = trip.stops ? trip.stops.length : 0;
              return (
                <Card
                  key={trip.id}
                  padding="md"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: 'var(--card)',
                    border: '1.5px solid rgba(18, 50, 74, 0.14)',
                    boxShadow: '0 4px 14px rgba(18, 50, 74, 0.05)',
                    borderRadius: '16px',
                    opacity: 0.95,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h4 style={{ fontSize: 'var(--font-md)', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                        {trip.title}
                      </h4>
                      <Tag variant="neutral" style={{ fontWeight: 700 }}>COMPLETED</Tag>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-xs)', color: 'var(--mute)', marginBottom: '8px' }}>
                      <Calendar size={14} />
                      <span>{trip.start_date || 'Past'} — {trip.end_date || ''}</span>
                    </div>

                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', margin: '0 0 12px' }}>
                      {stopCount} stops • {trip.travellers} travellers
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingTop: '10px', borderTop: '1.5px solid rgba(18, 50, 74, 0.08)' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onOpenTrip(trip)}
                      style={{
                        flex: 1,
                        background: '#FFFFFF',
                        border: '1.5px solid var(--line)',
                        color: 'var(--ink)',
                        fontWeight: 700,
                        borderRadius: '8px',
                        minHeight: '34px',
                      }}
                    >
                      View details
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Star size={14} />}
                      onClick={() => {
                        if (onWriteReview) {
                          onWriteReview(trip);
                        } else {
                          onOpenTrip(trip);
                        }
                      }}
                      id={`btn-write-review-${trip.id}`}
                      style={{
                        background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 3px 10px rgba(245, 158, 11, 0.3)',
                        minHeight: '34px',
                      }}
                    >
                      Write a review
                    </Button>

                    {onDeleteTrip && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Trash2 size={14} color="var(--err)" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Are you sure you want to delete past trip "${trip.title}"?`)) {
                            onDeleteTrip(trip.id);
                          }
                        }}
                        title="Delete this trip"
                        id={`btn-delete-past-trip-${trip.id}`}
                        style={{
                          background: '#FFF5F5',
                          border: '1.5px solid rgba(220, 38, 38, 0.35)',
                          color: '#DC2626',
                          fontWeight: 700,
                          borderRadius: '8px',
                          minHeight: '34px',
                        }}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: + New Trip Form */}
      {showNewTripModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(18, 50, 74, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '16px',
          }}
          data-testid="new-trip-modal"
        >
          <div
            style={{
              backgroundColor: 'var(--card)',
              borderRadius: '20px',
              maxWidth: '580px',
              width: '100%',
              maxHeight: 'min(90vh, 780px)',
              boxShadow: '0 25px 60px -12px rgba(18, 50, 74, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid var(--line)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header (Fixed at top) */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--line)',
                background: 'linear-gradient(135deg, rgba(47, 127, 193, 0.08) 0%, rgba(242, 163, 58, 0.06) 100%)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, var(--pri) 0%, #1A5487 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(47, 127, 193, 0.3)',
                  }}
                >
                  <Plane size={20} color="#FFFFFF" />
                </div>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pri)', display: 'block', marginBottom: '2px' }}>
                    KP Official Itinerary Planner
                  </span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', margin: 0, letterSpacing: '-0.02em' }}>
                    Create New Trip
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewTripModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '50%',
                  color: 'var(--mute)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.15s ease',
                }}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleCreate}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
              }}
            >
              {/* Scrollable Form Body */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {errorMessage && (
                  <div
                    data-testid="new-trip-error-banner"
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(214, 86, 74, 0.12)',
                      border: '1.5px solid var(--bad)',
                      color: 'var(--bad)',
                      fontSize: '13px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Step 1: Trip Title */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>
                    <Compass size={14} color="var(--pri)" /> Trip Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Kalam Summer Getaway"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '11px 15px',
                      borderRadius: '10px',
                      border: '1.5px solid var(--line)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      outline: 'none',
                      transition: 'border-color 0.15s ease',
                    }}
                    id="input-trip-title"
                  />
                  {/* Quick Destination Ideas */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--mute)', fontWeight: 600 }}>Quick ideas:</span>
                    {quickDestinations.map((dest) => (
                      <button
                        key={dest}
                        type="button"
                        onClick={() => setTitle(dest)}
                        style={{
                          padding: '3px 9px',
                          borderRadius: '6px',
                          border: '1px solid var(--line)',
                          backgroundColor: title === dest ? 'var(--soft)' : 'var(--bg)',
                          color: title === dest ? 'var(--pri)' : 'var(--ink)',
                          fontSize: '11px',
                          fontWeight: title === dest ? 700 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.12s ease',
                        }}
                      >
                        {dest}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: Dates and Duration (Clean 2-Column Row) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>
                      <Calendar size={14} color="var(--pri)" /> Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1.5px solid var(--line)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--ink)',
                        fontSize: '13px',
                        fontWeight: 600,
                        outline: 'none',
                      }}
                      id="input-trip-start-date"
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>
                        <Clock size={14} color="var(--pri)" /> Duration
                      </label>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--pri)' }}>
                        {nights} Nights ({nights + 1} Days)
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {[
                        { n: 2, label: '2N' },
                        { n: 3, label: '3N' },
                        { n: 5, label: '5N' },
                        { n: 7, label: '7N' },
                      ].map((item) => (
                        <button
                          key={item.n}
                          type="button"
                          onClick={() => setNights(item.n)}
                          style={{
                            flex: 1,
                            padding: '8px 4px',
                            borderRadius: '8px',
                            border: nights === item.n ? '1.5px solid var(--pri)' : '1px solid var(--line)',
                            backgroundColor: nights === item.n ? 'var(--soft)' : 'var(--bg)',
                            color: nights === item.n ? 'var(--pri)' : 'var(--ink)',
                            fontSize: '11.5px',
                            fontWeight: nights === item.n ? 700 : 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={nights}
                        onChange={(e) => setNights(parseInt(e.target.value) || 1)}
                        title="Custom Nights"
                        style={{
                          width: '56px',
                          boxSizing: 'border-box',
                          padding: '7px 4px',
                          borderRadius: '8px',
                          border: '1.5px solid var(--line)',
                          backgroundColor: 'var(--bg)',
                          color: 'var(--ink)',
                          fontSize: '12px',
                          fontWeight: 700,
                          textAlign: 'center',
                          outline: 'none',
                        }}
                        id="input-trip-nights"
                      />
                    </div>
                  </div>
                </div>

                {/* Step 3: Travellers */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>
                    <Users size={14} color="var(--pri)" /> Travellers
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setTravellers((prev) => Math.max(1, prev - 1))}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        border: '1.5px solid var(--line)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--ink)',
                        fontSize: '18px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      aria-label="Decrease travellers"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={travellers}
                      onChange={(e) => setTravellers(parseInt(e.target.value) || 1)}
                      style={{
                        width: '70px',
                        boxSizing: 'border-box',
                        textAlign: 'center',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1.5px solid var(--line)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--ink)',
                        fontSize: '13px',
                        fontWeight: 700,
                        outline: 'none',
                      }}
                      id="input-trip-travellers"
                    />
                    <button
                      type="button"
                      onClick={() => setTravellers((prev) => Math.min(20, prev + 1))}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        border: '1.5px solid var(--line)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--ink)',
                        fontSize: '18px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      aria-label="Increase travellers"
                    >
                      +
                    </button>
                    <span style={{ fontSize: '12px', color: 'var(--mute)', fontWeight: 600 }}>
                      {travellers === 1 ? 'Solo Traveller' : `${travellers} Persons Travelling`}
                    </span>
                  </div>
                </div>

                {/* Step 4: Optional Preferences (Budget & Focus) */}
                <div style={{ borderTop: '1px dashed var(--line)', paddingTop: '10px', marginTop: '2px' }}>
                  <button
                    type="button"
                    onClick={() => setShowPreferences(!showPreferences)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--pri)',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {showPreferences ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    <span>{showPreferences ? 'Hide Optional Preferences' : '+ Additional Preferences (Budget & Interests)'}</span>
                  </button>

                  {showPreferences && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Optional Budget */}
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>
                          <Wallet size={14} color="var(--pri)" /> Target Budget (PKR)
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 50000"
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            border: '1.5px solid var(--line)',
                            backgroundColor: 'var(--bg)',
                            color: 'var(--ink)',
                            fontSize: '13px',
                            fontWeight: 600,
                            outline: 'none',
                          }}
                        />
                      </div>

                      {/* Interests */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ink)', marginBottom: '8px' }}>
                          Trip Focus & Activities
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {availableInterests.map((interest) => {
                            const isSelected = selectedInterests.includes(interest);
                            return (
                              <button
                                type="button"
                                key={interest}
                                onClick={() => toggleInterest(interest)}
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: '16px',
                                  border: isSelected ? '1.5px solid var(--pri)' : '1px solid var(--line)',
                                  backgroundColor: isSelected ? 'var(--soft)' : 'var(--bg)',
                                  color: isSelected ? 'var(--pri)' : 'var(--ink)',
                                  fontSize: '11.5px',
                                  fontWeight: isSelected ? 700 : 500,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                {isSelected && <Check size={11} color="var(--pri)" />}
                                {interest}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sticky / Fixed Footer with Save Button (Always Visible) */}
              <div
                style={{
                  flexShrink: 0,
                  padding: '14px 24px',
                  borderTop: '1px solid var(--line)',
                  backgroundColor: 'var(--card)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.04)',
                }}
              >
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setShowNewTripModal(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '13px',
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={isSubmitting}
                  id="btn-submit-new-trip"
                  data-testid="btn-save-trip"
                  style={{
                    padding: '10px 24px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '13.5px',
                    background: 'linear-gradient(135deg, var(--pri) 0%, #1A5487 100%)',
                    boxShadow: '0 4px 14px rgba(47, 127, 193, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Save size={16} />
                  Save: Create & open trip
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Natural Language Trip Generator Modal (Phase A) */}
      <AITripGeneratorModal
        isOpen={showAIGeneratorModal}
        onClose={() => setShowAIGeneratorModal(false)}
        onCreateTrip={onCreateTrip as any}
        onTripCreated={(t) => onOpenTrip(t)}
      />
    </div>
  );
};
