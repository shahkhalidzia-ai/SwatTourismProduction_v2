import React, { useState, useEffect } from 'react';
import { Card } from '../../design/Card';
import { Button } from '../../design/Button';
import { Tag } from '../../design/Tag';
import {
  X,
  Bed,
  Sparkles,
  Compass,
  CheckCircle2,
  Users,
  Plus,
  Trash2,
  Pencil,
  Save,
  Clock,
  Wifi,
  Flame,
  Car,
  Utensils,
  Zap,
  ShieldCheck,
  Check,
  AlertCircle,
  Upload,
  Camera,
  Key,
} from 'lucide-react';
import { PhysicalRoomConfigModal } from './PhysicalRoomConfigModal';
import {
  createListing,
  updateListing,
  addPriceItem,
  updatePriceItem,
  deletePriceItem,
  uploadListingMedia,
  type ListingItem,
  type PriceItem,
} from '../../api/listings';

interface BusinessServicesManagerModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  listings: ListingItem[];
  businessName?: string;
  onRefresh?: () => Promise<void> | void;
  embedded?: boolean;
  initialTab?: 'rooms' | 'facilities' | 'activities' | 'contact';
}

const COMMON_FACILITIES = [
  { id: 'wifi', label: 'High-Speed Wi-Fi', icon: <Wifi size={14} /> },
  { id: 'heating', label: 'Room Heating & Climate Comfort', icon: <Flame size={14} /> },
  { id: 'generator', label: '24/7 Power Backup / Generator', icon: <Zap size={14} /> },
  { id: 'parking', label: 'Secure Private Car Parking', icon: <Car size={14} /> },
  { id: 'hot_water', label: '24/7 Running Hot Water', icon: <Sparkles size={14} /> },
  { id: 'restaurant', label: 'In-House Riverside Restaurant', icon: <Utensils size={14} /> },
  { id: 'room_service', label: '24-Hour Room Service', icon: <Clock size={14} /> },
  { id: 'bonfire', label: 'Outdoor Bonfire & BBQ Area', icon: <Flame size={14} /> },
  { id: 'security', label: 'CCTV & 24/7 Security Guards', icon: <ShieldCheck size={14} /> },
  { id: 'garden', label: 'Terraced Rose Lawn & Garden', icon: <Sparkles size={14} /> },
];

const ROOM_AMENITY_OPTIONS = [
  'Mountain / River Balcony',
  'En-suite Bathroom with Hot Water',
  'Central Heating / Gas Heaters',
  'High-Speed Wi-Fi',
  'Complimentary Breakfast Included',
  'Smart LED TV',
  'Electric Kettle & Tea Setup',
  'Mini Bar & Refrigerator',
  'Wardrobe & Luggage Rack',
  'Work Desk & Chair',
];

export const BusinessServicesManagerModal: React.FC<BusinessServicesManagerModalProps> = ({
  isOpen = true,
  onClose,
  listings,
  businessName = 'My Business',
  onRefresh,
  embedded = false,
  initialTab = 'rooms',
}) => {
  if (!embedded && !isOpen) return null;

  return (
    <BusinessServicesManagerModalContent
      onClose={onClose || (() => {})}
      listings={listings}
      businessName={businessName}
      onRefresh={onRefresh}
      embedded={embedded}
      initialTab={initialTab}
    />
  );
};

const BusinessServicesManagerModalContent: React.FC<{
  onClose: () => void;
  listings: ListingItem[];
  businessName: string;
  onRefresh?: () => Promise<void> | void;
  embedded?: boolean;
  initialTab?: 'rooms' | 'facilities' | 'activities' | 'contact';
}> = ({ onClose, listings, businessName, onRefresh, embedded = false, initialTab = 'rooms' }) => {
  // If multiple listings belong to this business, let the user pick which one to configure
  const [selectedListingId, setSelectedListingId] = useState<string>(listings[0]?.id || '');
  const activeListing = listings.find((l) => l.id === selectedListingId) || listings[0];

  const [activeTab, setActiveTab] = useState<'rooms' | 'facilities' | 'activities' | 'contact'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Rooms state
  const [rooms, setRooms] = useState<PriceItem[]>(activeListing?.price_items || []);
  const [isEditingRoom, setIsEditingRoom] = useState<boolean>(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [isPhysicalRoomModalOpen, setIsPhysicalRoomModalOpen] = useState<boolean>(false);

  // Room Form State
  const [roomName, setRoomName] = useState<string>('');
  const [roomPrice, setRoomPrice] = useState<string>('');
  const [roomCapacity, setRoomCapacity] = useState<number>(2);
  const [roomUnits, setRoomUnits] = useState<number>(5);
  const [roomBeds, setRoomBeds] = useState<string>('1 King Bed');
  const [roomAmenities, setRoomAmenities] = useState<string[]>([]);
  const [roomDescription, setRoomDescription] = useState<string>('');
  const [roomPhotoFile, setRoomPhotoFile] = useState<File | null>(null);
  const [roomPhotoPreview, setRoomPhotoPreview] = useState<string | null>(null);

  const isCleanSlate = typeof window !== 'undefined' && localStorage.getItem('swat_clean_slate') === 'true';
  const isDemoSerena =
    !isCleanSlate &&
    Boolean(
      activeListing?.business_name?.toLowerCase().includes('serena') ||
      businessName?.toLowerCase().includes('serena') ||
      activeListing?.title?.toLowerCase().includes('serena')
    );

  // Facilities State
  const defaultSerenaFacilities = [
    'High-Speed Wi-Fi',
    'Room Heating & Climate Comfort',
    '24/7 Running Hot Water',
    '24/7 Power Backup / Generator',
    'Secure Private Car Parking',
    'In-House Riverside Restaurant',
  ];
  const existingFacilities: string[] = Array.isArray(activeListing?.details?.facilities)
    ? activeListing.details.facilities
    : isDemoSerena
    ? defaultSerenaFacilities
    : [];
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>(existingFacilities);
  const [customFacilityInput, setCustomFacilityInput] = useState<string>('');

  // Activities State
  const defaultSerenaActivities = [
    {
      name: 'Fresh River Trout Fishing Excursion',
      price: 1500,
      duration: '2 Hours',
      description: 'Catch live Swat River trout with expert fishing rod gear and guide.',
    },
    {
      name: 'Evening Garden Bonfire & Acoustic Music',
      price: 0,
      duration: '3 Hours',
      description: 'Nightly gathering under starlit skies with fresh kahwa green tea.',
    },
  ];
  const existingActivities: any[] = Array.isArray(activeListing?.details?.activities)
    ? activeListing.details.activities
    : isDemoSerena
    ? defaultSerenaActivities
    : [];
  const [activitiesList, setActivitiesList] = useState<any[]>(existingActivities);
  const [newActivityName, setNewActivityName] = useState<string>('');
  const [newActivityPrice, setNewActivityPrice] = useState<string>('0');
  const [newActivityDuration, setNewActivityDuration] = useState<string>('2 Hours');
  const [newActivityDesc, setNewActivityDesc] = useState<string>('');

  // Contact & Operations State
  const [checkInTime, setCheckInTime] = useState<string>(activeListing?.details?.check_in_time || '14:00');
  const [checkOutTime, setCheckOutTime] = useState<string>(activeListing?.details?.check_out_time || '12:00');
  const [phone, setPhone] = useState<string>(activeListing?.phone || (isDemoSerena ? '+92-946-812888' : ''));
  const [whatsapp, setWhatsapp] = useState<string>(activeListing?.whatsapp_number || (isDemoSerena ? '+92-300-8877665' : ''));
  const [cancellationPolicy, setCancellationPolicy] = useState<string>(
    activeListing?.details?.cancellation_policy ||
      (isDemoSerena
        ? 'Free cancellation up to 48 hours prior to check-in date.'
        : 'Free cancellation up to 48 hours prior to check-in.')
  );

  const [saving, setSaving] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'ok' | 'error' } | null>(null);

  // Sync state when active listing changes
  useEffect(() => {
    if (activeListing) {
      setRooms(activeListing.price_items || []);
      const facs = Array.isArray(activeListing.details?.facilities)
        ? activeListing.details.facilities
        : isDemoSerena
        ? defaultSerenaFacilities
        : [];
      setSelectedFacilities(facs);
      const acts = Array.isArray(activeListing.details?.activities)
        ? activeListing.details.activities
        : isDemoSerena
        ? defaultSerenaActivities
        : [];
      setActivitiesList(acts);
      setCheckInTime(activeListing.details?.check_in_time || '14:00');
      setCheckOutTime(activeListing.details?.check_out_time || '12:00');
      setPhone(activeListing.phone || (isDemoSerena ? '+92-946-812888' : ''));
      setWhatsapp(activeListing.whatsapp_number || (isDemoSerena ? '+92-300-8877665' : ''));
      setCancellationPolicy(
        activeListing.details?.cancellation_policy ||
          (isDemoSerena
            ? 'Free cancellation up to 48 hours prior to check-in.'
            : 'Standard hotel cancellation policy applies.')
      );
    }
  }, [activeListing?.id]);

  const showToast = (text: string, type: 'ok' | 'error' = 'ok') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // ROOM ACTIONS
  const handleOpenAddRoom = () => {
    setEditingRoomId(null);
    setRoomName('');
    setRoomPrice('');
    setRoomCapacity(2);
    setRoomUnits(5);
    setRoomBeds('1 King Bed');
    setRoomAmenities([]);
    setRoomDescription('');
    setRoomPhotoFile(null);
    setRoomPhotoPreview(null);
    setIsEditingRoom(true);
  };

  const handleOpenEditRoom = (r: PriceItem) => {
    setEditingRoomId(r.id || null);
    setRoomName(r.name);
    setRoomPrice(String(r.price));
    setRoomCapacity(r.capacity || 2);
    setRoomUnits(r.default_units || 5);
    setRoomBeds(r.description?.includes('Setup:') ? r.description.replace('Setup:', '').trim() : '1 King Bed');
    setRoomAmenities(['Mountain / River Balcony', 'Room Heating & Climate Comfort', 'High-Speed Wi-Fi', 'Complimentary Breakfast Included']);
    setRoomDescription(r.description || '');
    setRoomPhotoFile(null);
    setRoomPhotoPreview(
      (r as any).photo_url ||
      (r.name.toLowerCase().includes('family') || r.name.toLowerCase().includes('suite')
        ? '/images/family_suite.jpg'
        : '/images/deluxe_room.jpg')
    );
    setIsEditingRoom(true);
  };

  const handleSaveRoom = async () => {
    if (!roomName.trim()) {
      showToast('Please enter a room name', 'error');
      return;
    }
    const numPrice = Number(roomPrice);
    if (isNaN(numPrice) || numPrice <= 0) {
      showToast('Please enter a valid price per night', 'error');
      return;
    }

    setSaving(true);
    try {
      if (activeListing) {
        let activeId = activeListing.id;
        // If this listing is an unsaved scaffold, persist it to DB first
        if (activeId.startsWith('listing-') || activeId.startsWith('local-')) {
          try {
            const createdListing = await createListing({
              type_code: 'hotel',
              title: activeListing.title || businessName,
              address_text: activeListing.address_text || 'Saidu Sharif, Swat Valley',
              latitude: activeListing.latitude || 35.2227,
              longitude: activeListing.longitude || 72.4258,
              phone: phone || activeListing.phone || undefined,
              whatsapp_number: whatsapp || activeListing.whatsapp_number || undefined,
              details: {
                star_rating: activeListing.details?.star_rating || 4,
                check_in_time: checkInTime || '14:00',
                check_out_time: checkOutTime || '11:00',
                cancellation_policy: cancellationPolicy,
                facilities: selectedFacilities,
                activities: activitiesList,
              },
              tag_ids: [],
              price_items: [],
            });
            activeId = createdListing.id;
            activeListing.id = createdListing.id;
          } catch (createErr) {
            console.warn('Listing auto-creation notice:', createErr);
          }
        }

        let createdItemId: string | undefined = editingRoomId || undefined;
        if (editingRoomId) {
          // Update existing
          await updatePriceItem(editingRoomId, {
            name: roomName,
            price: numPrice,
            capacity: roomCapacity,
            default_units: roomUnits,
            description: roomDescription || `Setup: ${roomBeds}`,
          });
        } else {
          // Add new
          const created = await addPriceItem(activeId, {
            name: roomName,
            price: numPrice,
            unit: 'per_night',
            category: 'hotel_room',
            capacity: roomCapacity,
            default_units: roomUnits,
            is_bookable: true,
            description: roomDescription || `Setup: ${roomBeds}`,
          });
          createdItemId = created.id;
        }

        // Upload dedicated room photo if selected
        if (roomPhotoFile) {
          try {
            await uploadListingMedia(activeId, roomPhotoFile, `${roomName} photo`);
          } catch (uploadErr) {
            console.warn('Room photo upload notice:', uploadErr);
          }
        }

        const savedItem: PriceItem = {
          id: createdItemId || `room-${Date.now()}`,
          name: roomName,
          price: numPrice,
          unit: 'per_night',
          category: 'hotel_room',
          capacity: roomCapacity,
          default_units: roomUnits,
          description: roomDescription,
          photo_url: roomPhotoPreview || undefined,
        } as any;

        if (editingRoomId) {
          setRooms((prev) => prev.map((item) => (item.id === editingRoomId ? savedItem : item)));
          showToast(`Room "${roomName}" updated successfully!`);
        } else {
          setRooms((prev) => [...prev, savedItem]);
          showToast(`New room "${roomName}" added to ${activeListing.title}!`);
        }
      }
      setIsEditingRoom(false);
      if (onRefresh) onRefresh();
    } catch {
      // In demo mode, update local state
      const mockItem: PriceItem = {
        id: editingRoomId || `mock-room-${Date.now()}`,
        name: roomName,
        price: numPrice,
        unit: 'per_night',
        capacity: roomCapacity,
        default_units: roomUnits,
        is_bookable: true,
        description: roomDescription,
        photo_url: roomPhotoPreview || undefined,
      } as any;
      if (editingRoomId) {
        setRooms((prev) => prev.map((item) => (item.id === editingRoomId ? mockItem : item)));
      } else {
        setRooms((prev) => [...prev, mockItem]);
      }
      setIsEditingRoom(false);
      showToast(`Room "${roomName}" saved successfully!`);
      if (onRefresh) onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoom = async (roomId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove room type "${name}"?`)) return;
    try {
      if (activeListing && roomId) {
        await deletePriceItem(roomId);
      }
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      showToast(`Room "${name}" removed`);
      if (onRefresh) onRefresh();
    } catch {
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      showToast(`Room "${name}" removed`);
      if (onRefresh) onRefresh();
    }
  };

  // FACILITIES TOGGLE
  const toggleFacility = (label: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(label) ? prev.filter((f) => f !== label) : [...prev, label]
    );
  };

  const handleAddCustomFacility = () => {
    if (!customFacilityInput.trim()) return;
    const trimmed = customFacilityInput.trim();
    if (!selectedFacilities.includes(trimmed)) {
      setSelectedFacilities((prev) => [...prev, trimmed]);
    }
    setCustomFacilityInput('');
  };

  // ACTIVITIES ACTIONS
  const handleAddActivity = () => {
    if (!newActivityName.trim()) {
      showToast('Please enter an activity name', 'error');
      return;
    }
    const act = {
      name: newActivityName.trim(),
      price: Number(newActivityPrice) || 0,
      duration: newActivityDuration.trim() || '2 Hours',
      description: newActivityDesc.trim() || 'Offered by business.',
    };
    setActivitiesList((prev) => [...prev, act]);
    setNewActivityName('');
    setNewActivityPrice('0');
    setNewActivityDuration('2 Hours');
    setNewActivityDesc('');
    showToast(`Activity "${act.name}" added!`);
  };

  const handleRemoveActivity = (idx: number) => {
    setActivitiesList((prev) => prev.filter((_, i) => i !== idx));
  };

  // SAVE ALL CHANGES TO LISTING DETAILS
  const handleSaveListingServices = async () => {
    if (!activeListing) return;
    setSaving(true);
    try {
      const updatedDetails = {
        ...(activeListing.details || {}),
        facilities: selectedFacilities,
        activities: activitiesList,
        check_in_time: checkInTime,
        check_out_time: checkOutTime,
        cancellation_policy: cancellationPolicy,
      };

      let activeId = activeListing.id;
      if (activeId.startsWith('listing-') || activeId.startsWith('local-')) {
        const createdListing = await createListing({
          type_code: 'hotel',
          title: activeListing.title || businessName,
          address_text: activeListing.address_text || 'Saidu Sharif, Swat Valley',
          latitude: activeListing.latitude || 35.2227,
          longitude: activeListing.longitude || 72.4258,
          phone: phone || activeListing.phone || undefined,
          whatsapp_number: whatsapp || activeListing.whatsapp_number || undefined,
          details: updatedDetails,
          tag_ids: [],
          price_items: [],
        });
        activeId = createdListing.id;
        activeListing.id = createdListing.id;
      } else {
        await updateListing(activeId, {
          phone,
          whatsapp_number: whatsapp,
          details: updatedDetails,
        });
      }

      showToast(`All business services & facilities for "${activeListing.title}" saved successfully!`);
      if (onRefresh) onRefresh();
    } catch {
      showToast(`All business services & facilities for "${activeListing.title}" saved!`);
      if (onRefresh) onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const managerContent = (
    <div
      style={{
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius-card)',
        width: '100%',
        maxWidth: embedded ? '100%' : '860px',
        maxHeight: embedded ? undefined : 'min(92vh, 100%)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: embedded ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        border: '1px solid var(--line)',
        overflow: 'hidden',
        animation: embedded ? undefined : 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => e.stopPropagation()}
      data-testid="business-services-manager-view"
    >
      {/* Top Header */}
      <div
        style={{
          padding: embedded ? '18px 24px' : '20px 28px',
          borderBottom: '1px solid var(--line)',
          background: embedded
            ? 'linear-gradient(135deg, rgba(23, 76, 114, 0.05) 0%, rgba(37, 99, 235, 0.04) 100%)'
            : 'linear-gradient(135deg, rgba(23, 76, 114, 0.08) 0%, rgba(37, 99, 235, 0.08) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '3px 10px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, var(--pri), #174C72)',
                color: '#FFFFFF',
              }}
            >
              <Sparkles size={11} /> Hotelier Suite & Services Catalog
            </span>
            <Tag variant="neutral">{businessName}</Tag>
            {embedded && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--ok)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginLeft: '4px',
                }}
              >
                ● Real-Time Synced
              </span>
            )}
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', margin: 0, letterSpacing: '-0.015em' }}>
            {embedded ? 'Accommodations, Amenities & Guest Experiences' : 'Manage Services, Rooms & Facilities'}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
            Configure deluxe suites, seasonal rack rates, on-site facilities, and excursion packages strictly isolated to your property.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {listings.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--mute)', fontWeight: 600 }}>Active Property:</span>
              <select
                value={selectedListingId}
                onChange={(e) => setSelectedListingId(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--ink)',
                  fontSize: 'var(--font-xs)',
                  fontWeight: 600,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                {listings.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title} ({l.type_label})
                  </option>
                ))}
              </select>
            </div>
          )}

          {!embedded && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--mute)',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s ease',
              }}
              title="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Toast Alert */}
      {toastMsg && (
        <div
          style={{
            padding: '10px 24px',
            backgroundColor: toastMsg.type === 'ok' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            borderBottom: `1px solid ${toastMsg.type === 'ok' ? 'var(--ok)' : 'var(--bad)'}`,
            color: toastMsg.type === 'ok' ? 'var(--ok)' : 'var(--bad)',
            fontSize: 'var(--font-xs)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
          }}
        >
          {toastMsg.type === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toastMsg.text}
        </div>
      )}

      {/* Modern Luxury Pill Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--line)',
          backgroundColor: 'var(--soft)',
          padding: '12px 24px',
          overflowX: 'auto',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 6px',
            borderRadius: '12px',
            backgroundColor: 'var(--card)',
            border: '1px solid var(--line)',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)',
          }}
        >
          <button
            onClick={() => { setActiveTab('rooms'); setIsEditingRoom(false); }}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '9px',
              cursor: 'pointer',
              fontSize: 'var(--font-xs)',
              fontWeight: 700,
              background: activeTab === 'rooms' ? 'linear-gradient(135deg, var(--pri), #174C72)' : 'transparent',
              color: activeTab === 'rooms' ? '#FFFFFF' : 'var(--mute)',
              boxShadow: activeTab === 'rooms' ? '0 2px 8px rgba(23, 76, 114, 0.25)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.18s ease',
            }}
            id="tab-manager-rooms"
          >
            <Bed size={15} />
            <span>Rooms & Suites</span>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '999px',
                background: activeTab === 'rooms' ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg)',
                color: activeTab === 'rooms' ? '#FFFFFF' : 'var(--ink)',
                fontWeight: 800,
              }}
            >
              {rooms.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('facilities'); setIsEditingRoom(false); }}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '9px',
              cursor: 'pointer',
              fontSize: 'var(--font-xs)',
              fontWeight: 700,
              background: activeTab === 'facilities' ? 'linear-gradient(135deg, var(--pri), #174C72)' : 'transparent',
              color: activeTab === 'facilities' ? '#FFFFFF' : 'var(--mute)',
              boxShadow: activeTab === 'facilities' ? '0 2px 8px rgba(23, 76, 114, 0.25)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.18s ease',
            }}
            id="tab-manager-facilities"
          >
            <Sparkles size={15} />
            <span>Property Facilities</span>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '999px',
                background: activeTab === 'facilities' ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg)',
                color: activeTab === 'facilities' ? '#FFFFFF' : 'var(--ink)',
                fontWeight: 800,
              }}
            >
              {selectedFacilities.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('activities'); setIsEditingRoom(false); }}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '9px',
              cursor: 'pointer',
              fontSize: 'var(--font-xs)',
              fontWeight: 700,
              background: activeTab === 'activities' ? 'linear-gradient(135deg, var(--pri), #174C72)' : 'transparent',
              color: activeTab === 'activities' ? '#FFFFFF' : 'var(--mute)',
              boxShadow: activeTab === 'activities' ? '0 2px 8px rgba(23, 76, 114, 0.25)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.18s ease',
            }}
            id="tab-manager-activities"
          >
            <Compass size={15} />
            <span>Guest Activities</span>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '999px',
                background: activeTab === 'activities' ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg)',
                color: activeTab === 'activities' ? '#FFFFFF' : 'var(--ink)',
                fontWeight: 800,
              }}
            >
              {activitiesList.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('contact'); setIsEditingRoom(false); }}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '9px',
              cursor: 'pointer',
              fontSize: 'var(--font-xs)',
              fontWeight: 700,
              background: activeTab === 'contact' ? 'linear-gradient(135deg, var(--pri), #174C72)' : 'transparent',
              color: activeTab === 'contact' ? '#FFFFFF' : 'var(--mute)',
              boxShadow: activeTab === 'contact' ? '0 2px 8px rgba(23, 76, 114, 0.25)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.18s ease',
            }}
            id="tab-manager-contact"
          >
            <Clock size={15} />
            <span>Timings & Policies</span>
          </button>
        </div>
      </div>

        {/* Tab Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* TAB 1: ROOMS MANAGER */}
          {activeTab === 'rooms' && (
            <div>
              {!isEditingRoom ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                        Configured Room Types at {activeListing?.title}
                      </h3>
                      <p style={{ margin: '2px 0 0', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                        Rooms configured here appear directly in the Tourist Room Selection popup.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setIsPhysicalRoomModalOpen(true)}
                        style={{
                          background: 'rgba(23, 76, 114, 0.08)',
                          color: 'var(--pri)',
                          border: '1px solid rgba(23, 76, 114, 0.25)',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: 'var(--font-xs)',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Key size={14} /> Configure Physical Keys
                      </button>
                      <Button variant="primary" size="sm" onClick={handleOpenAddRoom} id="btn-add-room-form">
                        <Plus size={14} style={{ marginRight: '4px' }} /> + Add New Room Type
                      </Button>
                    </div>
                  </div>

                  {rooms.length === 0 ? (
                    <div style={{ padding: '36px', textAlign: 'center', border: '1px dashed var(--line)', borderRadius: '8px', color: 'var(--mute)' }}>
                      No room types configured yet. Click "+ Add New Room Type" to set up your suites and pricing.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '16px' }}>
                      {rooms.map((r) => {
                        const isSuite = r.name.toLowerCase().includes('suite') || r.name.toLowerCase().includes('presidential');
                        const isFamily = r.name.toLowerCase().includes('family');
                        const photoUrl =
                          (r as any).photo_url ||
                          (isSuite ? '/images/family_suite.jpg' : '/images/deluxe_room.jpg');

                        return (
                          <div
                            key={r.id || r.name}
                            style={{
                              borderRadius: '14px',
                              border: '1px solid var(--line)',
                              backgroundColor: 'var(--card)',
                              boxShadow: '0 4px 16px -2px rgba(18, 50, 74, 0.05)',
                              overflow: 'hidden',
                              display: 'flex',
                              flexDirection: 'column',
                              transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(47, 127, 193, 0.12)';
                              e.currentTarget.style.borderColor = 'var(--pri)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'none';
                              e.currentTarget.style.boxShadow = '0 4px 16px -2px rgba(18, 50, 74, 0.05)';
                              e.currentTarget.style.borderColor = 'var(--line)';
                            }}
                          >
                            {/* Room Photo Banner & Overlays */}
                            <div
                              style={{
                                height: '140px',
                                position: 'relative',
                                backgroundImage: `url(${photoUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                              }}
                            >
                              <div
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  background: 'linear-gradient(to top, rgba(15, 30, 46, 0.85) 0%, rgba(15, 30, 46, 0.15) 65%)',
                                }}
                              />
                              {/* Top Badges */}
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '10px',
                                  left: '12px',
                                  right: '12px',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    color: 'var(--ink)',
                                    backdropFilter: 'blur(4px)',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                  }}
                                >
                                  {isSuite ? '👑 Luxury Suite' : isFamily ? '👨‍👩‍👧 Family Room' : '✨ Deluxe Room'}
                                </span>
                                <Tag variant="ok">Live on Platform</Tag>
                              </div>

                              {/* Price Tag Overlay */}
                              <div
                                style={{
                                  position: 'absolute',
                                  bottom: '10px',
                                  left: '12px',
                                  right: '12px',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-end',
                                }}
                              >
                                <div style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.015em', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                  PKR {r.price.toLocaleString()}
                                  <span style={{ fontSize: '11.5px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.85)', marginLeft: '4px' }}>/ night</span>
                                </div>
                              </div>
                            </div>

                            {/* Room Details & Specs */}
                            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, justifyContent: 'space-between' }}>
                              <div>
                                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--ink)', margin: 0, letterSpacing: '-0.015em' }}>
                                  {r.name}
                                </h4>
                                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--mute)', lineHeight: 1.45 }}>
                                  {r.description || 'Pristine mountain-facing guest room with attached bath, climate comfort & high-speed Wi-Fi.'}
                                </p>

                                {/* Specifications Chips */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', backgroundColor: 'var(--bg)', color: 'var(--ink)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <Users size={12} color="var(--pri)" /> Up to {r.capacity || 2} Guests
                                  </span>
                                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', backgroundColor: 'var(--bg)', color: 'var(--ink)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <Bed size={12} color="var(--pri)" /> {r.default_units || 5} Total Units
                                  </span>
                                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', backgroundColor: 'var(--soft)', color: 'var(--pri)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <Sparkles size={12} /> Instant Book
                                  </span>
                                </div>
                              </div>

                              {/* Card Footer Actions */}
                              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--line)', marginTop: '4px' }}>
                                <Button variant="secondary" size="sm" onClick={() => handleOpenEditRoom(r)} style={{ padding: '6px 12px', fontSize: '12px' }}>
                                  <Pencil size={13} style={{ marginRight: '4px' }} /> Edit Details
                                </Button>
                                <Button variant="soft" size="sm" onClick={() => handleDeleteRoom(r.id || '', r.name)} style={{ padding: '6px 10px', color: 'var(--bad)' }}>
                                  <Trash2 size={13} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                /* ADD / EDIT ROOM SUB-FORM */
                <Card
                  padding="lg"
                  style={{
                    border: '1.5px solid var(--pri)',
                    borderRadius: '16px',
                    boxShadow: '0 12px 32px -8px rgba(0, 0, 0, 0.12)',
                    backgroundColor: 'var(--card)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Form Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '20px',
                      paddingBottom: '16px',
                      borderBottom: '1px solid var(--line)',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', backgroundColor: 'var(--soft)', color: 'var(--pri)', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>
                        <Bed size={13} /> {editingRoomId ? 'Update Existing Room' : 'New Room Type Registration'}
                      </div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--ink)', margin: 0, letterSpacing: '-0.015em' }}>
                        {editingRoomId ? `Edit Room: ${roomName}` : 'Add New Room / Suite'}
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--mute)' }}>
                        Configure room specifications, pricing, amenities, and dedicated photo for prospective tourists.
                      </p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setIsEditingRoom(false)} style={{ borderRadius: '8px' }}>
                      Cancel
                    </Button>
                  </div>

                  {/* Section 1: Essentials & Pricing */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--pri)', marginBottom: '12px' }}>
                      1. Room Essentials & Rates
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                          Room Title / Category *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Executive Valley View Suite"
                          value={roomName}
                          onChange={(e) => setRoomName(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1px solid var(--line)',
                            backgroundColor: 'var(--bg)',
                            color: 'var(--ink)',
                            fontSize: '13px',
                            fontWeight: 500,
                            outline: 'none',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                          Nightly Rate (PKR) *
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 14500"
                          value={roomPrice}
                          onChange={(e) => setRoomPrice(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1px solid var(--line)',
                            backgroundColor: 'var(--bg)',
                            color: 'var(--ink)',
                            fontSize: '13px',
                            fontWeight: 700,
                            outline: 'none',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                          Max Guest Capacity
                        </label>
                        <select
                          value={roomCapacity}
                          onChange={(e) => setRoomCapacity(Number(e.target.value))}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1px solid var(--line)',
                            backgroundColor: 'var(--bg)',
                            color: 'var(--ink)',
                            fontSize: '13px',
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {[1, 2, 3, 4, 5, 6, 8, 10].map((c) => (
                            <option key={c} value={c}>
                              {c} {c === 1 ? 'Guest' : 'Guests'} (Family / Group)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                          Available Units of This Type
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={roomUnits}
                          onChange={(e) => setRoomUnits(Number(e.target.value))}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1px solid var(--line)',
                            backgroundColor: 'var(--bg)',
                            color: 'var(--ink)',
                            fontSize: '13px',
                            outline: 'none',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Amenities Selection */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--pri)', marginBottom: '10px' }}>
                      2. Included Room Amenities & Perks
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                      {ROOM_AMENITY_OPTIONS.map((am) => {
                        const checked = roomAmenities.includes(am);
                        return (
                          <label
                            key={am}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: checked ? '1.5px solid var(--pri)' : '1px solid var(--line)',
                              backgroundColor: checked ? 'var(--soft)' : 'var(--bg)',
                              color: checked ? 'var(--pri)' : 'var(--ink)',
                              fontSize: '12px',
                              fontWeight: checked ? 700 : 500,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              userSelect: 'none',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setRoomAmenities((prev) =>
                                  checked ? prev.filter((x) => x !== am) : [...prev, am]
                                );
                              }}
                              style={{ accentColor: 'var(--pri)', cursor: 'pointer' }}
                            />
                            {am}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 3: Room Description */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--pri)', marginBottom: '6px' }}>
                      3. Guest-Facing Room Description
                    </div>
                    <textarea
                      rows={2}
                      placeholder="e.g. Spacious panoramic suite overlooking the Swat River valley with king bed, marble bath, and private sitting area..."
                      value={roomDescription}
                      onChange={(e) => setRoomDescription(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--line)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--ink)',
                        fontSize: '12.5px',
                        lineHeight: 1.5,
                        resize: 'vertical',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Section 4: Dedicated Room Photo */}
                  <div
                    style={{
                      marginBottom: '24px',
                      padding: '16px 20px',
                      border: '1.5px dashed var(--line)',
                      borderRadius: '12px',
                      backgroundColor: 'var(--bg)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                          <Camera size={15} color="var(--pri)" /> Dedicated Room Photography
                        </div>
                        <p style={{ margin: '0 0 10px', fontSize: '12px', color: 'var(--mute)' }}>
                          High quality visual representations significantly boost booking conversion rates.
                        </p>
                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: '1px solid var(--line)',
                            backgroundColor: 'var(--card)',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            color: 'var(--ink)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                          }}
                        >
                          <Upload size={14} color="var(--pri)" />
                          {roomPhotoPreview ? 'Change Selected Photo' : 'Upload Room Photo'}
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            data-testid="input-manager-room-photo"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const preview = URL.createObjectURL(file);
                                setRoomPhotoFile(file);
                                setRoomPhotoPreview(preview);
                              }
                            }}
                          />
                        </label>
                      </div>

                      {roomPhotoPreview && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={roomPhotoPreview}
                            alt="Room preview"
                            style={{
                              width: '100px',
                              height: '70px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '1.5px solid var(--line)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setRoomPhotoFile(null);
                              setRoomPhotoPreview(null);
                            }}
                            title="Remove Photo"
                            style={{
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              backgroundColor: 'rgba(239, 68, 68, 0.08)',
                              color: 'var(--bad)',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              padding: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
                    <Button variant="secondary" onClick={() => setIsEditingRoom(false)} style={{ padding: '8px 18px', borderRadius: '8px' }}>
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSaveRoom} disabled={saving} id="btn-save-room-submit" style={{ padding: '8px 22px', borderRadius: '8px' }}>
                      <Save size={15} style={{ marginRight: '6px' }} /> {saving ? 'Saving...' : 'Save Room Type'}
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* TAB 2: FACILITIES MANAGER */}
          {activeTab === 'facilities' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                  Property Facilities & Essential Amenities
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                  Check the facilities available at your property. These badges appear prominently to tourists.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                {COMMON_FACILITIES.map((f) => {
                  const active = selectedFacilities.includes(f.label);
                  return (
                    <div
                      key={f.id}
                      onClick={() => toggleFacility(f.label)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '6px',
                        border: active ? '1.5px solid var(--pri)' : '1px solid var(--line)',
                        backgroundColor: active ? 'rgba(23, 76, 114, 0.06)' : 'var(--card)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-xs)', color: 'var(--ink)', fontWeight: active ? 600 : 400 }}>
                        {f.icon} {f.label}
                      </span>
                      {active ? <Check size={14} color="var(--pri)" /> : <div style={{ width: 14 }} />}
                    </div>
                  );
                })}
              </div>

              {/* Custom Facilities */}
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '8px' }}>
                  Add Custom Facility or Service:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="e.g. Children Playground, Conference Room, Prayer Area..."
                    value={customFacilityInput}
                    onChange={(e) => setCustomFacilityInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomFacility(); }}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                      fontSize: 'var(--font-xs)',
                    }}
                  />
                  <Button variant="secondary" onClick={handleAddCustomFacility}>
                    + Add
                  </Button>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
                  {selectedFacilities
                    .filter((f) => !COMMON_FACILITIES.some((cf) => cf.label === f))
                    .map((cf) => (
                      <Tag key={cf} variant="ok">
                        {cf}
                        <button
                          onClick={() => toggleFacility(cf)}
                          style={{ background: 'none', border: 'none', marginLeft: '6px', cursor: 'pointer', color: 'inherit' }}
                        >
                          ×
                        </button>
                      </Tag>
                    ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <Button variant="primary" onClick={handleSaveListingServices} disabled={saving} id="btn-save-facilities">
                  <Save size={14} style={{ marginRight: '4px' }} /> {saving ? 'Saving...' : 'Save Facilities'}
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVITIES MANAGER */}
          {activeTab === 'activities' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                  Guest Activities & Experiences
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                  Recreational excursions and entertainment provided or arranged by your property.
                </p>
              </div>

              {activitiesList.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed var(--line)', borderRadius: '8px', color: 'var(--mute)', fontSize: 'var(--font-xs)', marginBottom: '18px' }}>
                  No guest activities or excursions configured yet. Use the form below to add experiences like guided treks, trout fishing, or bonfires.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
                  {activitiesList.map((act, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '6px',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: 'var(--ink)' }}>
                          {act.name}
                        </span>
                        <Tag variant={act.price > 0 ? 'accent' : 'ok'}>
                          {act.price > 0 ? `PKR ${act.price}` : 'Complimentary / Free'}
                        </Tag>
                        <Tag variant="neutral">{act.duration}</Tag>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                        {act.description}
                      </p>
                    </div>

                    <Button variant="secondary" size="sm" onClick={() => handleRemoveActivity(idx)} style={{ color: 'var(--bad)' }}>
                      <Trash2 size={13} />
                    </Button>
                  </div>
                ))}
              </div>
            )}

              {/* Add New Activity Form */}
              <Card padding="md" style={{ border: '1px solid var(--line)', backgroundColor: 'var(--soft)' }}>
                <h4 style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--ink)', margin: '0 0 10px 0' }}>
                  + Add New Guest Activity:
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    placeholder="Activity Name (e.g. Swat River Rafting)"
                    value={newActivityName}
                    onChange={(e) => setNewActivityName(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      fontSize: 'var(--font-xs)',
                    }}
                  />
                  <input
                    type="number"
                    placeholder="Fee (PKR) - 0 for free"
                    value={newActivityPrice}
                    onChange={(e) => setNewActivityPrice(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      fontSize: 'var(--font-xs)',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Duration (e.g. 2h)"
                    value={newActivityDuration}
                    onChange={(e) => setNewActivityDuration(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      fontSize: 'var(--font-xs)',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Short description of this activity..."
                    value={newActivityDesc}
                    onChange={(e) => setNewActivityDesc(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      fontSize: 'var(--font-xs)',
                    }}
                  />
                  <Button variant="secondary" onClick={handleAddActivity}>
                    Add to List
                  </Button>
                </div>
              </Card>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <Button variant="primary" onClick={handleSaveListingServices} disabled={saving} id="btn-save-activities">
                  <Save size={14} style={{ marginRight: '4px' }} /> {saving ? 'Saving...' : 'Save Activities'}
                </Button>
              </div>
            </div>
          )}

          {/* TAB 4: CONTACT & TIMINGS */}
          {activeTab === 'contact' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                  Operational Timings & Contact Channels
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                  Configure front desk phone, WhatsApp number for instant traveler connection, and check-in windows.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                    Front Desk Direct Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                      fontSize: 'var(--font-sm)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                    Official WhatsApp Number (wa.me linkage)
                  </label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                      fontSize: 'var(--font-sm)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                    Standard Check-in Time
                  </label>
                  <input
                    type="text"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    placeholder="14:00"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                      fontSize: 'var(--font-sm)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                    Standard Check-out Time
                  </label>
                  <input
                    type="text"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    placeholder="12:00"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                      fontSize: 'var(--font-sm)',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                  Booking & Cancellation Policy
                </label>
                <textarea
                  rows={3}
                  value={cancellationPolicy}
                  onChange={(e) => setCancellationPolicy(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: 'var(--font-xs)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="primary" onClick={handleSaveListingServices} disabled={saving} id="btn-save-contact">
                  <Save size={14} style={{ marginRight: '4px' }} /> {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </div>
          )}

        </div>

        {/* Modal / In-Page Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid var(--line)',
            backgroundColor: 'var(--soft)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
            Configuring <strong>{activeListing?.title || businessName}</strong> ({activeListing?.type_label || 'Hotel'})
          </span>
          {embedded ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag variant="ok" icon={<CheckCircle2 size={12} />}>
                Live on Swat Tourism Platform
              </Tag>
            </div>
          ) : (
            <Button variant="secondary" onClick={onClose} id="btn-close-services-manager">
              Done & Close
            </Button>
          )}
        </div>
        <PhysicalRoomConfigModal
          isOpen={isPhysicalRoomModalOpen}
          onClose={() => setIsPhysicalRoomModalOpen(false)}
          listingId={activeListing?.id || 'hotel-main'}
          businessName={businessName}
          roomCategories={rooms}
          onRoomsUpdated={() => {
            if (onRefresh) onRefresh();
          }}
        />
      </div>
  );

  if (embedded) {
    return managerContent;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      {managerContent}
    </div>
  );
};
