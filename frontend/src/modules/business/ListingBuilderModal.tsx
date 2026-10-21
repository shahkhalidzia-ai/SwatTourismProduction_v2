import React, { useState, useEffect } from 'react';
import { Button } from '../../design/Button';
import { Tag as DesignTag } from '../../design/Tag';
import { fetchTags, type Tag, type ListingTypeCode, type PriceUnitCode, type CreateListingPayload } from '../../api/listings';
import {
  Hotel,
  Utensils,
  Car,
  Compass,
  Mountain,
  ShoppingBag,
  Store,
  X,
  Plus,
  Trash2,
  Upload,
  Sparkles,
  Camera,
} from 'lucide-react';

interface ListingBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    payload: CreateListingPayload,
    publishNow: boolean,
    imageFile?: File,
    roomPhotoFiles?: { roomIndex: number; file: File; name: string }[],
    existingId?: string
  ) => Promise<void>;
  initialType?: ListingTypeCode;
  existingListing?: any;
  businessProfile?: any;
  lockType?: boolean;
}

interface PriceItemForm {
  name: string;
  price: string;
  unit: PriceUnitCode;
  capacity?: string;
  category?: string; // Hotel: "Room" | "Extra" | "Activity"; Restaurant: "Starters" | "Main dishes" | "Drinks" | "Dessert"
  // Hotel Room specific fields:
  sleeps?: string;
  bedType?: string;
  size?: string;
  view?: string;
  amenities?: string;
  photoFile?: File;
  photoPreviewUrl?: string;
}

// Swat Valley Area Coordinates Presets
const SWAT_AREAS = [
  { name: 'Kalam Valley', lat: 35.4907, lng: 72.5796 },
  { name: 'Malam Jabba', lat: 34.7997, lng: 72.5714 },
  { name: 'Madyan', lat: 35.1347, lng: 72.5342 },
  { name: 'Bahrain', lat: 35.2064, lng: 72.5539 },
  { name: 'Mingora', lat: 34.7758, lng: 72.3626 },
  { name: 'Utror', lat: 35.5000, lng: 72.4500 },
  { name: 'Ushu Forest', lat: 35.5300, lng: 72.6300 },
];

export const ListingBuilderModal: React.FC<ListingBuilderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialType = 'hotel',
  existingListing,
  businessProfile,
  lockType = false,
}) => {
  const isEditMode = Boolean(existingListing?.id || existingListing?.rawListing?.id);
  const [selectedType, setSelectedType] = useState<ListingTypeCode>(initialType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [addressText, setAddressText] = useState('');
  const [selectedArea, setSelectedArea] = useState(SWAT_AREAS[0].name);
  const [latitude, setLatitude] = useState<number>(SWAT_AREAS[0].lat);
  const [longitude, setLongitude] = useState<number>(SWAT_AREAS[0].lng);
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('22:00');

  // Facilities tags picker (API facility tags)
  const [facilityTags, setFacilityTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [customFacilityInput, setCustomFacilityInput] = useState('');

  const DEFAULT_HOTEL_FACILITIES: Tag[] = [
    { id: 'f-1', tag_group: 'facility', label: 'High-Speed Wi-Fi' },
    { id: 'f-2', tag_group: 'facility', label: '24/7 Hot water' },
    { id: 'f-3', tag_group: 'facility', label: 'Room Heating' },
    { id: 'f-4', tag_group: 'facility', label: 'Secure Car Parking' },
    { id: 'f-5', tag_group: 'facility', label: '24/7 Generator / Power Backup' },
    { id: 'f-6', tag_group: 'facility', label: 'River / Mountain View' },
    { id: 'f-7', tag_group: 'facility', label: 'In-House Restaurant' },
    { id: 'f-8', tag_group: 'facility', label: 'Bonfire & BBQ Setup' },
    { id: 'f-9', tag_group: 'facility', label: '24/7 Front Desk' },
    { id: 'f-10', tag_group: 'facility', label: 'Daily Housekeeping' },
    { id: 'f-11', tag_group: 'facility', label: 'Complimentary Breakfast' },
    { id: 'f-12', tag_group: 'facility', label: 'Wheelchair Accessible' },
  ];

  useEffect(() => {
    fetchTags('facility')
      .then((tags) => {
        if (tags && tags.length > 0) {
          // Merge default hotel tags with backend tags without duplicates
          const existingLabels = new Set(tags.map((t) => t.label.toLowerCase()));
          const combined = [...tags];
          for (const defTag of DEFAULT_HOTEL_FACILITIES) {
            if (!existingLabels.has(defTag.label.toLowerCase())) {
              combined.push(defTag);
            }
          }
          setFacilityTags(combined);
        } else {
          setFacilityTags(DEFAULT_HOTEL_FACILITIES);
        }
      })
      .catch(() => {
        setFacilityTags(DEFAULT_HOTEL_FACILITIES);
      });
  }, []);

  const toggleFacilityTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleAddCustomFacility = () => {
    if (!customFacilityInput.trim()) return;
    const newId = `custom-facility-${Date.now()}`;
    const newTag: Tag = { id: newId, tag_group: 'facility', label: customFacilityInput.trim() };
    setFacilityTags((prev) => [...prev, newTag]);
    setSelectedTagIds((prev) => [...prev, newId]);
    setCustomFacilityInput('');
  };

  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Price Items State - clean initial state without hardcoded room info
  const [priceItems, setPriceItems] = useState<PriceItemForm[]>([
    {
      name: '',
      price: '',
      unit: 'per_night',
      category: 'Room',
      sleeps: '',
      bedType: '',
      size: '',
      view: '',
      amenities: '',
    },
  ]);

  // Loading & Error States
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Type-specific state
  // 1. Hotel
  const [starRating, setStarRating] = useState<number>(3);
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutTime, setCheckOutTime] = useState('11:00');
  const [totalRooms, setTotalRooms] = useState<string>('');
  const [petsAllowed, setPetsAllowed] = useState(false);

  // 2. Restaurant
  const [cuisine, setCuisine] = useState('Swati Trout & BBQ');
  const [seatingCapacity, setSeatingCapacity] = useState('40');
  const [takesReservations, setTakesReservations] = useState(true);
  const [halal, setHalal] = useState(true);
  const [hasDelivery, setHasDelivery] = useState(false);

  // 3. Transport & 4. Guide - Pickup point / Base location
  const [pickupPoint, setPickupPoint] = useState('Kalam Main Terminal / Bridge');
  const [vehicleType, setVehicleType] = useState('4x4 Willys Jeep');
  const [seats, setSeats] = useState('6');
  const [withDriver, setWithDriver] = useState(true);
  const [fuelIncluded, setFuelIncluded] = useState(true);
  const [routesText, setRoutesText] = useState('Kalam to Mahodand Lake, Kalam to Utror');

  // 4. Guide
  const [languagesText, setLanguagesText] = useState('Urdu, English, Pashto');
  const [yearsExperience, setYearsExperience] = useState('5');
  const [specialitiesText, setSpecialitiesText] = useState('Alpine Trekking, Historical Sites');
  const [licenseNo, setLicenseNo] = useState('KP-SWAT-401');
  const [maxGroupSize, setMaxGroupSize] = useState('10');

  // 5. Activity
  const [activityType, setActivityType] = useState('River Rafting');
  const [durationHours, setDurationHours] = useState('2.5');
  const [minAge, setMinAge] = useState('10');
  const [activityMaxGroup, setActivityMaxGroup] = useState('8');
  const [difficulty, setDifficulty] = useState('moderate');
  const [safetyGearIncluded, setSafetyGearIncluded] = useState(true);
  const [safetyRules, setSafetyRules] = useState('Always wear provided helmets and life vests. Follow river guide instructions at all times.');
  const [seasonStart, setSeasonStart] = useState('2026-05-01');
  const [seasonEnd, setSeasonEnd] = useState('2026-09-30');

  // 6. Shop
  const [shopCategory, setShopCategory] = useState('Handicrafts & Woolens');
  const [certificateProvided, setCertificateProvided] = useState(true);
  const [acceptsCards, setAcceptsCards] = useState(true);
  const [shipsOrders, setShipsOrders] = useState(false);

  // Auto-populate when editing existing listing or scoped to logged-in business profile
  useEffect(() => {
    if (isOpen) {
      const isCleanSlate = typeof window !== 'undefined' && localStorage.getItem('swat_clean_slate') === 'true';
      const isDemoSerena =
        !isCleanSlate &&
        Boolean(
          existingListing?.rawListing?.business_name?.toLowerCase().includes('serena') ||
          existingListing?.title?.toLowerCase().includes('serena') ||
          businessProfile?.business_name?.toLowerCase().includes('serena')
        );

      if (existingListing) {
        const raw = existingListing.rawListing || existingListing;
        const type = raw.type_code || raw.typeCode || businessProfile?.primary_type || initialType;
        setSelectedType(type as ListingTypeCode);
        setTitle(raw.title || businessProfile?.business_name || '');
        setDescription(
          raw.description ||
          (isDemoSerena
            ? 'Premier hospitality accommodation offering comfortable suites, warm Swati hospitality, and scenic valley views.'
            : '')
        );
        setAddressText(raw.address_text || raw.area || businessProfile?.address_text || '');
        setPhone(raw.phone || businessProfile?.contact_phone || (isDemoSerena ? '+92 946 711640' : ''));
        setWhatsapp(raw.whatsapp_number || businessProfile?.whatsapp_number || (isDemoSerena ? '+92 300 1234567' : ''));
        if (raw.latitude) setLatitude(raw.latitude);
        if (raw.longitude) setLongitude(raw.longitude);
        if (raw.opening_time) setOpeningTime(raw.opening_time);
        if (raw.closing_time) setClosingTime(raw.closing_time);

        const details = raw.details || {};
        if (details.star_rating) setStarRating(details.star_rating);
        if (details.check_in_time) setCheckInTime(details.check_in_time);
        if (details.check_out_time) setCheckOutTime(details.check_out_time);
        if (details.total_rooms || details.rooms_count) {
          setTotalRooms(String(details.total_rooms || details.rooms_count));
        }
        if (details.pets_allowed !== undefined) setPetsAllowed(details.pets_allowed);
        if (details.cuisine) setCuisine(details.cuisine);
        if (details.seating_capacity) setSeatingCapacity(String(details.seating_capacity));

        // Media preview
        if (raw.media && raw.media.length > 0) {
          setImagePreview(raw.media[0].url);
        } else if (isDemoSerena) {
          setImagePreview('/images/swat_serena.jpg');
        } else {
          setImagePreview(null);
        }

        // Price items / Rooms
        const rawPriceItems = raw.price_items;
        if (rawPriceItems && rawPriceItems.length > 0) {
          setPriceItems(
            rawPriceItems.map((p: any) => ({
              id: p.id,
              name: p.name || '',
              price: String(p.price || ''),
              unit: p.unit || 'per_night',
              capacity: p.capacity ? String(p.capacity) : '',
              category: p.category || 'Room',
              sleeps: p.details?.sleeps || p.capacity ? String(p.details?.sleeps || p.capacity) : '',
              bedType: p.details?.bed_type || '',
              size: p.details?.size || '',
              view: p.details?.view || '',
              amenities: p.details?.amenities || '',
              photoPreviewUrl: p.photo_url || null,
            }))
          );
        }
      } else if (businessProfile) {
        if (businessProfile.business_name) setTitle(businessProfile.business_name);
        if (businessProfile.primary_type) setSelectedType(businessProfile.primary_type as ListingTypeCode);
        if (businessProfile.address_text) setAddressText(businessProfile.address_text);
        if (businessProfile.contact_phone) setPhone(businessProfile.contact_phone);
        if (businessProfile.whatsapp_number) setWhatsapp(businessProfile.whatsapp_number);
        setImagePreview(isDemoSerena ? '/images/swat_serena.jpg' : null);
      }
    }
  }, [isOpen, existingListing, businessProfile, initialType]);

  if (!isOpen) return null;

  // Handle Area Change
  const handleAreaChange = (areaName: string) => {
    setSelectedArea(areaName);
    const found = SWAT_AREAS.find((a) => a.name === areaName);
    if (found) {
      setLatitude(found.lat);
      setLongitude(found.lng);
    }
  };

  // Handle Type Change
  const handleTypeChange = (type: ListingTypeCode) => {
    setSelectedType(type);
    let defaultUnit: PriceUnitCode = 'per_night';
    let defaultCat = 'Room';
    if (type === 'restaurant') {
      defaultUnit = 'per_item';
      defaultCat = 'Main dishes';
    } else if (type === 'shop') {
      defaultUnit = 'per_item';
      defaultCat = 'Handicrafts';
    } else if (type === 'transport') {
      defaultUnit = 'per_trip';
      defaultCat = 'Route';
    } else if (type === 'guide') {
      defaultUnit = 'per_day';
      defaultCat = 'Guiding';
    } else if (type === 'activity') {
      defaultUnit = 'per_person';
      defaultCat = 'Activity';
    }

    setPriceItems([
      {
        name: '',
        price: '',
        unit: defaultUnit,
        category: defaultCat,
        sleeps: '',
        bedType: '',
        size: '',
        view: '',
        amenities: '',
      },
    ]);
  };

  // Price Items handlers
  const addPriceItem = (specificCategory?: string) => {
    let unit: PriceUnitCode = 'per_night';
    let defaultCat: string = specificCategory || 'Room';
    if (selectedType === 'hotel') {
      if (defaultCat === 'Activity') unit = 'per_person';
      else if (defaultCat === 'Extra') unit = 'per_person';
      else unit = 'per_night';
    } else if (selectedType === 'restaurant') {
      unit = 'per_item';
      defaultCat = 'Main dishes';
    } else if (selectedType === 'shop') {
      unit = 'per_item';
      defaultCat = 'Handicrafts';
    } else if (selectedType === 'transport') {
      unit = 'per_trip';
      defaultCat = 'Route';
    } else if (selectedType === 'guide') {
      unit = 'per_day';
      defaultCat = 'Guiding';
    } else if (selectedType === 'activity') {
      unit = 'per_person';
      defaultCat = 'Activity';
    }

    setPriceItems([
      ...priceItems,
      {
        name: '',
        price: '',
        unit,
        category: defaultCat,
        sleeps: '',
        bedType: '',
        size: '',
        view: '',
        amenities: '',
      },
    ]);
  };

  const removePriceItem = (index: number) => {
    if (priceItems.length <= 1) return;
    setPriceItems(priceItems.filter((_, i) => i !== index));
  };

  const updatePriceItem = (index: number, field: keyof PriceItemForm, value: any) => {
    setPriceItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Handle Image File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Build type-specific details payload
  const buildDetailsPayload = (): Record<string, any> => {
    switch (selectedType) {
      case 'hotel':
        return {
          star_rating: Number(starRating),
          check_in_time: checkInTime,
          check_out_time: checkOutTime,
          total_rooms: totalRooms ? Number(totalRooms) : undefined,
          pets_allowed: petsAllowed,
          facilities: facilityTags.filter((t) => selectedTagIds.includes(t.id)).map((t) => t.label),
        };
      case 'restaurant':
        return {
          cuisine,
          seating_capacity: Number(seatingCapacity) || 30,
          takes_reservations: takesReservations,
          has_delivery: hasDelivery,
          halal,
        };
      case 'transport':
        return {
          vehicle_type: vehicleType,
          seats: Number(seats) || 4,
          with_driver: withDriver,
          routes: routesText.split(',').map((r) => r.trim()).filter(Boolean),
          fuel_included: fuelIncluded,
          pickup_point: pickupPoint,
        };
      case 'guide':
        return {
          languages: languagesText.split(',').map((l) => l.trim()).filter(Boolean),
          years_experience: Number(yearsExperience) || 0,
          specialities: specialitiesText.split(',').map((s) => s.trim()).filter(Boolean),
          license_no: licenseNo || undefined,
          max_group_size: Number(maxGroupSize) || 10,
          base_location: pickupPoint,
          pickup_point: pickupPoint,
        };
      case 'activity':
        return {
          activity_type: activityType,
          duration_hours: Number(durationHours) || 2,
          min_age: Number(minAge) || 8,
          max_group_size: Number(activityMaxGroup) || 10,
          difficulty,
          safety_gear_included: safetyGearIncluded,
          safety_rules: safetyRules,
          season_start: seasonStart,
          season_end: seasonEnd,
        };
      case 'shop':
        return {
          shop_category: shopCategory,
          certificate_provided: certificateProvided,
          accepts_cards: acceptsCards,
          ships_orders: shipsOrders,
        };
    }
  };

  // Form Submission
  const handleFormSubmit = async (publishNow: boolean) => {
    setErrorMessage(null);
    if (!title.trim()) {
      setErrorMessage('Listing title is required.');
      return;
    }

    const validPriceItems = priceItems
      .filter((p) => p.name.trim() && !isNaN(Number(p.price)) && Number(p.price) > 0)
      .map((p, idx) => {
        const itemCategory = p.category || (selectedType === 'hotel' ? 'Room' : selectedType === 'restaurant' ? 'Main dishes' : undefined);
        let itemDetails: Record<string, any> | undefined = undefined;

        if (selectedType === 'hotel') {
          if (itemCategory === 'Room' || !itemCategory) {
            itemDetails = {
              sleeps: p.sleeps ? Number(p.sleeps) : (p.capacity ? Number(p.capacity) : 2),
              bed_type: p.bedType?.trim() || undefined,
              size: p.size?.trim() || undefined,
              view: p.view?.trim() || undefined,
              amenities: p.amenities?.trim() || undefined,
            };
          } else if (itemCategory === 'Activity') {
            itemDetails = {
              activity_type: 'hotel_experience',
              duration: p.size?.trim() || '2 Hours',
              description: p.amenities?.trim() || p.view?.trim() || undefined,
            };
          } else if (itemCategory === 'Extra') {
            itemDetails = {
              service_type: 'hotel_service',
              description: p.amenities?.trim() || undefined,
            };
          }
        }

        return {
          name: p.name.trim(),
          price: Number(p.price),
          unit: p.unit,
          category: itemCategory,
          capacity: p.capacity ? Number(p.capacity) : (p.sleeps ? Number(p.sleeps) : undefined),
          sort_order: idx,
          is_bookable: true,
          is_active: true,
          details: itemDetails,
        };
      });

    if (validPriceItems.length === 0) {
      setErrorMessage('At least one valid price item with a positive price is required.');
      return;
    }

    const payload: CreateListingPayload = {
      type_code: selectedType,
      title: title.trim(),
      description: description.trim() || undefined,
      address_text: addressText.trim() || undefined,
      latitude,
      longitude,
      phone: phone.trim() || undefined,
      whatsapp_number: whatsapp.trim() || undefined,
      opening_time: selectedType === 'hotel' ? undefined : (openingTime || undefined),
      closing_time: selectedType === 'hotel' ? undefined : (closingTime || undefined),
      details: buildDetailsPayload(),
      tag_ids: selectedType === 'hotel' ? selectedTagIds : [],
      price_items: validPriceItems,
    };

    const roomPhotos = priceItems
      .map((p, idx) => ({ roomIndex: idx, file: p.photoFile, name: p.name }))
      .filter((p): p is { roomIndex: number; file: File; name: string } => Boolean(p.file));

    try {
      setSubmitting(true);
      const existingId = existingListing?.id || existingListing?.rawListing?.id;
      await onSubmit(payload, publishNow, imageFile || undefined, roomPhotos, existingId);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save listing. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const typeTabs: { code: ListingTypeCode; label: string; icon: React.ReactNode }[] = [
    { code: 'hotel', label: 'Hotel / Stay', icon: <Hotel size={16} /> },
    { code: 'restaurant', label: 'Restaurant', icon: <Utensils size={16} /> },
    { code: 'transport', label: 'Transport', icon: <Car size={16} /> },
    { code: 'guide', label: 'Guide', icon: <Compass size={16} /> },
    { code: 'activity', label: 'Activity', icon: <Mountain size={16} /> },
    { code: 'shop', label: 'Shop / Craft', icon: <ShoppingBag size={16} /> },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(18, 50, 74, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      data-testid="listing-builder-modal"
    >
      <div
        style={{
          backgroundColor: 'var(--card)',
          borderRadius: 'var(--radius-card)',
          width: '100%',
          maxWidth: '820px',
          maxHeight: 'min(90vh, 100%)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          border: '1px solid var(--line)',
          overflow: 'hidden',
          fontFamily: 'var(--font-family)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'var(--soft)',
                color: 'var(--pri)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Store size={22} color="var(--pri)" />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--pri)',
                    display: 'block',
                  }}
                >
                  Business Listing Engine
                </span>
                {isEditMode && (
                  <DesignTag variant="ok">Verified Business Scope</DesignTag>
                )}
              </div>
              <h2 style={{ fontSize: 'var(--font-xl)', color: 'var(--ink)', margin: '2px 0 0 0', fontWeight: 800, letterSpacing: '-0.02em', textAlign: 'left' }}>
                {isEditMode ? `Edit Property Details — ${title || 'My Property'}` : 'Create Tourism Listing'}
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: 'var(--font-xs)', color: 'var(--mute)', textAlign: 'left' }}>
                {isEditMode
                  ? `Update listings, pricing, and amenities for ${businessProfile?.business_name || title || 'your property'}`
                  : 'Unified listing engine for Swat businesses, Stays, and Services'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--mute)',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {errorMessage && (
            <div
              style={{
                backgroundColor: 'rgba(214, 86, 74, 0.12)',
                color: 'var(--bad)',
                border: '1px solid var(--bad)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                fontSize: 'var(--font-sm)',
                fontWeight: 500,
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* Type Selector Chips */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                Listing Category (One Listing Engine)
              </label>
              {(lockType || isEditMode) && (
                <DesignTag variant="accent">
                  Locked to Registered Business Profile: {selectedType.toUpperCase()}
                </DesignTag>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {typeTabs.map((tab) => {
                const isSelected = selectedType === tab.code;
                const isDisabled = (lockType || isEditMode) && !isSelected;
                return (
                  <button
                    key={tab.code}
                    type="button"
                    onClick={() => !isDisabled && handleTypeChange(tab.code)}
                    disabled={isDisabled}
                    data-testid={`type-btn-${tab.code}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-button)',
                      border: `1.5px solid ${isSelected ? 'var(--pri)' : 'var(--line)'}`,
                      backgroundColor: isSelected ? 'var(--soft)' : 'var(--card)',
                      color: isSelected ? 'var(--pri)' : isDisabled ? 'var(--mute)' : 'var(--ink)',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      opacity: isDisabled ? 0.45 : 1,
                      fontSize: 'var(--font-sm)',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* General Information */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                Listing Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  selectedType === 'hotel'
                    ? 'e.g. Pine River Retreat, Kalam'
                    : selectedType === 'restaurant'
                    ? 'e.g. Swat Trout Corner & Grill'
                    : selectedType === 'transport'
                    ? 'e.g. Kalam 4x4 Mountain Jeep Service'
                    : selectedType === 'guide'
                    ? 'e.g. Rashid Khan - Alpine Mountain Guide'
                    : selectedType === 'activity'
                    ? 'e.g. Swat River White Water Rafting'
                    : 'e.g. Kalam Heritage Handicrafts & Gems'
                }
                data-testid="input-listing-title"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-button)',
                  border: '1px solid var(--line)',
                  fontSize: 'var(--font-sm)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--ink)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Share unique features, services, view, and experiences offered..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-button)',
                  border: '1px solid var(--line)',
                  fontSize: 'var(--font-sm)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--ink)',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                Area / Region in Swat
              </label>
              <select
                value={selectedArea}
                onChange={(e) => handleAreaChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-button)',
                  border: '1px solid var(--line)',
                  fontSize: 'var(--font-sm)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--ink)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                {SWAT_AREAS.map((a) => (
                  <option key={a.name} value={a.name}>
                    {a.name} ({a.lat.toFixed(2)}°N, {a.lng.toFixed(2)}°E)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                Specific Address or Landmark
              </label>
              <input
                type="text"
                value={addressText}
                onChange={(e) => setAddressText(e.target.value)}
                placeholder="e.g. Main Kalam Bazaar, Near River Bridge"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-button)',
                  border: '1px solid var(--line)',
                  fontSize: 'var(--font-sm)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--ink)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                Contact Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0300-1234567"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-button)',
                  border: '1px solid var(--line)',
                  fontSize: 'var(--font-sm)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--ink)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                WhatsApp Number
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="0300-1234567"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-button)',
                  border: '1px solid var(--line)',
                  fontSize: 'var(--font-sm)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--ink)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {selectedType !== 'hotel' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                    Opening Time
                  </label>
                  <input
                    type="time"
                    value={openingTime}
                    onChange={(e) => setOpeningTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      fontSize: 'var(--font-sm)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                    Closing Time
                  </label>
                  <input
                    type="time"
                    value={closingTime}
                    onChange={(e) => setClosingTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      fontSize: 'var(--font-sm)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Type-Specific Details Box (Data Dictionary Section 4) */}
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--line)',
              backgroundColor: 'rgba(211, 230, 247, 0.25)',
            }}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: 'var(--font-base)', color: 'var(--ink)', fontWeight: 600 }}>
              {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Specifications
            </h3>

            {/* Hotel Form Fields */}
            {selectedType === 'hotel' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    Star Rating (1–5)
                  </label>
                  <select
                    value={starRating}
                    onChange={(e) => setStarRating(Number(e.target.value))}
                    data-testid="select-hotel-stars"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((s) => (
                      <option key={s} value={s}>
                        {s} Star{s > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    Total Rooms
                  </label>
                  <input
                    type="number"
                    value={totalRooms}
                    onChange={(e) => setTotalRooms(e.target.value)}
                    placeholder="e.g. 15"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    Check-in Time
                  </label>
                  <input
                    type="text"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    placeholder="14:00"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    Check-out Time
                  </label>
                  <input
                    type="text"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    placeholder="11:00"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '10px' }}>
                  <input
                    type="checkbox"
                    id="pets-check"
                    checked={petsAllowed}
                    onChange={(e) => setPetsAllowed(e.target.checked)}
                  />
                  <label htmlFor="pets-check" style={{ fontSize: 'var(--font-sm)', color: 'var(--ink)', fontWeight: 500 }}>
                    Pets Allowed
                  </label>
                </div>

                {/* Hotel Facilities & Amenities Tag Picker */}
                <div style={{ gridColumn: '1 / -1', marginTop: '6px', paddingTop: '10px', borderTop: '1px dashed var(--line)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)' }}>
                      Included Hotel Facilities & Amenities (Facility Tags)
                    </label>
                    <span style={{ fontSize: '11px', color: 'var(--mute)' }}>
                      {selectedTagIds.length} Selected
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                    {facilityTags.map((t) => {
                      const isSelected = selectedTagIds.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => toggleFacilityTag(t.id)}
                          data-testid={`btn-facility-tag-${t.id}`}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '16px',
                            border: `1px solid ${isSelected ? 'var(--pri)' : 'var(--line)'}`,
                            backgroundColor: isSelected ? 'var(--pri)' : 'var(--card)',
                            color: isSelected ? '#FFFFFF' : 'var(--ink)',
                            fontSize: '11px',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {isSelected && '✓ '}
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                  {/* Custom Facility Adder */}
                  <div style={{ display: 'flex', gap: '8px', maxWidth: '380px' }}>
                    <input
                      type="text"
                      placeholder="Add custom facility (e.g. Bonfire Pit)"
                      value={customFacilityInput}
                      onChange={(e) => setCustomFacilityInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomFacility();
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--line)',
                        fontSize: '12px',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--ink)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomFacility}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: 'var(--pri)',
                        color: '#FFF',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Restaurant Form Fields */}
            {selectedType === 'restaurant' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    Cuisine
                  </label>
                  <input
                    type="text"
                    value={cuisine}
                    onChange={(e) => setCuisine(e.target.value)}
                    placeholder="e.g. Swati Trout & Traditional BBQ"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    Seating Capacity
                  </label>
                  <input
                    type="number"
                    value={seatingCapacity}
                    onChange={(e) => setSeatingCapacity(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
                  <input
                    type="checkbox"
                    id="halal-check"
                    checked={halal}
                    onChange={(e) => setHalal(e.target.checked)}
                  />
                  <label htmlFor="halal-check" style={{ fontSize: 'var(--font-sm)', color: 'var(--ink)', fontWeight: 500 }}>
                    100% Halal Certified
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
                  <input
                    type="checkbox"
                    id="reserv-check"
                    checked={takesReservations}
                    onChange={(e) => setTakesReservations(e.target.checked)}
                  />
                  <label htmlFor="reserv-check" style={{ fontSize: 'var(--font-sm)', color: 'var(--ink)', fontWeight: 500 }}>
                    Takes Reservations
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
                  <input
                    type="checkbox"
                    id="deliv-check"
                    checked={hasDelivery}
                    onChange={(e) => setHasDelivery(e.target.checked)}
                  />
                  <label htmlFor="deliv-check" style={{ fontSize: 'var(--font-sm)', color: 'var(--ink)', fontWeight: 500 }}>
                    Has Delivery Service
                  </label>
                </div>
              </div>
            )}

            {/* Transport Form Fields */}
            {selectedType === 'transport' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    Pickup Point (Name & Landmark) *
                  </label>
                  <input
                    type="text"
                    value={pickupPoint}
                    onChange={(e) => setPickupPoint(e.target.value)}
                    placeholder="e.g. Kalam Main Jeep Stand / Kalam Bridge Terminal"
                    data-testid="input-transport-pickup-point"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                    }}
                  />
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--mute)' }}>
                    Map Pin (Lat/Lng: {latitude.toFixed(4)}, {longitude.toFixed(4)}) is established as the designated pickup location.
                  </p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    Vehicle Type
                  </label>
                  <input
                    type="text"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    placeholder="4x4 Willys Jeep / Prado / Hiace"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    Passenger Seats
                  </label>
                  <input
                    type="number"
                    value={seats}
                    onChange={(e) => setSeats(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
                  <input
                    type="checkbox"
                    id="driver-check"
                    checked={withDriver}
                    onChange={(e) => setWithDriver(e.target.checked)}
                  />
                  <label htmlFor="driver-check" style={{ fontSize: 'var(--font-sm)', color: 'var(--ink)', fontWeight: 500 }}>
                    With Experienced Local Driver
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
                  <input
                    type="checkbox"
                    id="fuel-check"
                    checked={fuelIncluded}
                    onChange={(e) => setFuelIncluded(e.target.checked)}
                  />
                  <label htmlFor="fuel-check" style={{ fontSize: 'var(--font-sm)', color: 'var(--ink)', fontWeight: 500 }}>
                    Fuel Included in Price
                  </label>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    Routes Covered (comma separated)
                  </label>
                  <input
                    type="text"
                    value={routesText}
                    onChange={(e) => setRoutesText(e.target.value)}
                    placeholder="Kalam to Mahodand Lake, Mingora to Malam Jabba"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Guide Form Fields */}
            {selectedType === 'guide' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    Base Location (Base Camp / Town Landmark) *
                  </label>
                  <input
                    type="text"
                    value={pickupPoint}
                    onChange={(e) => setPickupPoint(e.target.value)}
                    placeholder="e.g. Ushu Forest Base Camp / Kalam Tourist Information Center"
                    data-testid="input-guide-base-location"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                    }}
                  />
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--mute)' }}>
                    Map Pin (Lat/Lng: {latitude.toFixed(4)}, {longitude.toFixed(4)}) is set as the guide meet-up / base location.
                  </p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    Languages Spoken (comma separated)
                  </label>
                  <input
                    type="text"
                    value={languagesText}
                    onChange={(e) => setLanguagesText(e.target.value)}
                    placeholder="Urdu, Pashto, English"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    Years Experience
                  </label>
                  <input
                    type="number"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    License / Reg No.
                  </label>
                  <input
                    type="text"
                    value={licenseNo}
                    onChange={(e) => setLicenseNo(e.target.value)}
                    placeholder="KP-TOUR-123"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    Max Group Size
                  </label>
                  <input
                    type="number"
                    value={maxGroupSize}
                    onChange={(e) => setMaxGroupSize(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    Specialities (comma separated)
                  </label>
                  <input
                    type="text"
                    value={specialitiesText}
                    onChange={(e) => setSpecialitiesText(e.target.value)}
                    placeholder="Alpine Trekking, Kundol Lake, Wildlife & Flora"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Activity Form Fields */}
            {selectedType === 'activity' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    Activity Type
                  </label>
                  <input
                    type="text"
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value)}
                    placeholder="River Rafting / Zipline / Trek"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    Duration (Hours)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    Season Start Date *
                  </label>
                  <input
                    type="date"
                    value={seasonStart}
                    onChange={(e) => setSeasonStart(e.target.value)}
                    data-testid="input-activity-season-start"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    Season End Date *
                  </label>
                  <input
                    type="date"
                    value={seasonEnd}
                    onChange={(e) => setSeasonEnd(e.target.value)}
                    data-testid="input-activity-season-end"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    Min Age
                  </label>
                  <input
                    type="number"
                    value={minAge}
                    onChange={(e) => setMinAge(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    Max Group
                  </label>
                  <input
                    type="number"
                    value={activityMaxGroup}
                    onChange={(e) => setActivityMaxGroup(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="easy">Easy (Families)</option>
                    <option value="moderate">Moderate</option>
                    <option value="challenging">Challenging</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
                  <input
                    type="checkbox"
                    id="safety-gear"
                    checked={safetyGearIncluded}
                    onChange={(e) => setSafetyGearIncluded(e.target.checked)}
                  />
                  <label htmlFor="safety-gear" style={{ fontSize: 'var(--font-sm)', color: 'var(--ink)', fontWeight: 500 }}>
                    Safety Gear Included (Helmets, Lifejackets)
                  </label>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    Safety Rules & Operating Guidelines *
                  </label>
                  <textarea
                    rows={2}
                    value={safetyRules}
                    onChange={(e) => setSafetyRules(e.target.value)}
                    placeholder="e.g. Life jackets mandatory. Listen carefully to certified safety instructor."
                    data-testid="input-activity-safety-rules"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                      fontSize: 'var(--font-xs)',
                    }}
                  />
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--mute)' }}>
                    Tourists cannot book dates outside this season ({seasonStart || 'N/A'} to {seasonEnd || 'N/A'}).
                  </p>
                </div>
              </div>
            )}

            {/* Shop Form Fields */}
            {selectedType === 'shop' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    Shop Category
                  </label>
                  <input
                    type="text"
                    value={shopCategory}
                    onChange={(e) => setShopCategory(e.target.value)}
                    placeholder="Handicrafts / Gemstones / Shawls"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
                  <input
                    type="checkbox"
                    id="cards-check"
                    checked={acceptsCards}
                    onChange={(e) => setAcceptsCards(e.target.checked)}
                  />
                  <label htmlFor="cards-check" style={{ fontSize: 'var(--font-sm)', color: 'var(--ink)', fontWeight: 500 }}>
                    Accepts Cards / Digital Payments
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
                  <input
                    type="checkbox"
                    id="cert-check"
                    checked={certificateProvided}
                    onChange={(e) => setCertificateProvided(e.target.checked)}
                  />
                  <label htmlFor="cert-check" style={{ fontSize: 'var(--font-sm)', color: 'var(--ink)', fontWeight: 500 }}>
                    Authenticity Certificate Provided
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
                  <input
                    type="checkbox"
                    id="ships-check"
                    checked={shipsOrders}
                    onChange={(e) => setShipsOrders(e.target.checked)}
                  />
                  <label htmlFor="ships-check" style={{ fontSize: 'var(--font-sm)', color: 'var(--ink)', fontWeight: 500 }}>
                    Ships Orders Countrywide
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Pricing Engine Items */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <label style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--ink)' }}>
                  {selectedType === 'hotel' ? 'Rooms, Facilities, Activities & Services *' : 'Price Items & Units *'}
                </label>
                <p style={{ margin: 0, fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                  {selectedType === 'hotel'
                    ? 'Add room types (PKR/night), guest activities (tours, fishing, bonfire), or extra services'
                    : 'Room types, menu items, trips, products or services with transparent pricing (PKR)'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {selectedType === 'hotel' && (
                  <>
                    <Button type="button" variant="soft" size="sm" onClick={() => addPriceItem('Activity')} data-testid="btn-add-activity-item">
                      <Sparkles size={13} style={{ marginRight: '4px' }} />
                      + Activity
                    </Button>
                    <Button type="button" variant="soft" size="sm" onClick={() => addPriceItem('Extra')} data-testid="btn-add-extra-item">
                      <Plus size={13} style={{ marginRight: '4px' }} />
                      + Service
                    </Button>
                  </>
                )}
                <Button type="button" variant="soft" size="sm" onClick={() => addPriceItem('Room')} data-testid="btn-add-price-item">
                  <Plus size={14} style={{ marginRight: '4px' }} />
                  {selectedType === 'hotel' ? '+ Room Type' : 'Add Item'}
                </Button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {priceItems.map((item, idx) => {
                const isHotel = selectedType === 'hotel';
                const isRestaurant = selectedType === 'restaurant';
                const isRoom = isHotel && (item.category === 'Room' || !item.category);

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      padding: '12px 14px',
                      backgroundColor: 'var(--bg)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    {/* Top Row: Kind/Section, Name, Price, Unit, Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {/* Hotel Kind Dropdown */}
                      {isHotel && (
                        <div style={{ width: '120px' }}>
                          <select
                            value={item.category || 'Room'}
                            onChange={(e) => updatePriceItem(idx, 'category', e.target.value)}
                            data-testid={`price-item-kind-${idx}`}
                            style={{
                              width: '100%',
                              padding: '8px 8px',
                              borderRadius: 'var(--radius-button)',
                              border: '1px solid var(--line)',
                              fontSize: 'var(--font-xs)',
                              backgroundColor: 'var(--card)',
                              color: 'var(--ink)',
                              fontWeight: 600,
                              boxSizing: 'border-box',
                            }}
                          >
                            <option value="Room">🛏️ Room</option>
                            <option value="Activity">🎯 Activity</option>
                            <option value="Extra">✨ Service</option>
                          </select>
                        </div>
                      )}

                      {/* Restaurant Section Input / Selector */}
                      {isRestaurant && (
                        <div style={{ width: '130px' }}>
                          <input
                            type="text"
                            placeholder="Section (e.g. Starters)"
                            value={item.category || ''}
                            onChange={(e) => updatePriceItem(idx, 'category', e.target.value)}
                            list={`sections-list-${idx}`}
                            data-testid={`price-item-section-${idx}`}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: 'var(--radius-button)',
                              border: '1px solid var(--line)',
                              fontSize: 'var(--font-xs)',
                              backgroundColor: 'var(--card)',
                              color: 'var(--ink)',
                              fontWeight: 600,
                              boxSizing: 'border-box',
                            }}
                          />
                          <datalist id={`sections-list-${idx}`}>
                            <option value="Starters" />
                            <option value="Main dishes" />
                            <option value="Drinks" />
                            <option value="Dessert" />
                          </datalist>
                        </div>
                      )}

                      {/* Item Name */}
                      <input
                        type="text"
                        placeholder={
                          isHotel
                            ? item.category === 'Room' || !item.category
                              ? 'Room Type (e.g. Deluxe Balcony Suite)'
                              : item.category === 'Activity'
                              ? 'Activity Name (e.g. Guided Trout Fishing Excursion)'
                              : 'Service Name (e.g. Buffet Breakfast Spread)'
                            : isRestaurant
                            ? 'Dish / Beverage Name (e.g. Fresh River Trout)'
                            : 'Item / Service Name'
                        }
                        value={item.name}
                        onChange={(e) => updatePriceItem(idx, 'name', e.target.value)}
                        data-testid={`price-item-name-${idx}`}
                        style={{
                          flex: 2,
                          minWidth: '160px',
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-button)',
                          border: '1px solid var(--line)',
                          fontSize: 'var(--font-sm)',
                          backgroundColor: 'var(--card)',
                          color: 'var(--ink)',
                          boxSizing: 'border-box',
                        }}
                      />

                      {/* Price Input */}
                      <div style={{ display: 'flex', alignItems: 'center', width: '120px', gap: '4px' }}>
                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', fontWeight: 600 }}>Rs</span>
                        <input
                          type="number"
                          placeholder="Price"
                          value={item.price}
                          onChange={(e) => updatePriceItem(idx, 'price', e.target.value)}
                          data-testid={`price-item-price-${idx}`}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-button)',
                            border: '1px solid var(--line)',
                            fontSize: 'var(--font-sm)',
                            backgroundColor: 'var(--card)',
                            color: 'var(--ink)',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      {/* Unit Selector */}
                      <select
                        value={item.unit}
                        onChange={(e) => updatePriceItem(idx, 'unit', e.target.value as PriceUnitCode)}
                        data-testid={`price-item-unit-${idx}`}
                        style={{
                          width: '110px',
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-button)',
                          border: '1px solid var(--line)',
                          fontSize: 'var(--font-xs)',
                          backgroundColor: 'var(--card)',
                          color: 'var(--ink)',
                          boxSizing: 'border-box',
                        }}
                      >
                        {isHotel && item.category === 'Room' ? (
                          <>
                            <option value="per_night">per night</option>
                            <option value="per_person">per person</option>
                            <option value="per_day">per day</option>
                          </>
                        ) : isHotel && item.category === 'Activity' ? (
                          <>
                            <option value="per_person">per person</option>
                            <option value="per_trip">per trip</option>
                            <option value="per_hour">per hour</option>
                            <option value="per_day">per day</option>
                          </>
                        ) : isHotel && item.category === 'Extra' ? (
                          <>
                            <option value="per_person">per person</option>
                            <option value="per_item">per item</option>
                            <option value="per_night">per night</option>
                          </>
                        ) : (
                          <>
                            <option value="per_night">per night</option>
                            <option value="per_person">per person</option>
                            <option value="per_day">per day</option>
                            <option value="per_trip">per trip</option>
                            <option value="per_seat">per seat</option>
                            <option value="per_tent">per tent</option>
                            <option value="per_hour">per hour</option>
                            <option value="per_item">per item</option>
                          </>
                        )}
                      </select>

                      {/* Remove Button */}
                      {priceItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePriceItem(idx)}
                          style={{
                            border: 'none',
                            background: 'none',
                            color: 'var(--bad)',
                            cursor: 'pointer',
                            padding: '6px',
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {/* Room Specific Fields for Hotel Room */}
                    {isRoom && (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                          gap: '8px',
                          padding: '8px 10px',
                          backgroundColor: 'rgba(255,255,255,0.7)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px dashed var(--line)',
                        }}
                      >
                        <div>
                          <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--mute)', marginBottom: '2px' }}>
                            Sleeps (Guests)
                          </label>
                          <input
                            type="number"
                            placeholder="e.g. 2"
                            value={item.sleeps ?? ''}
                            onChange={(e) => updatePriceItem(idx, 'sleeps', e.target.value)}
                            data-testid={`room-sleeps-${idx}`}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--line)',
                              fontSize: '11px',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--mute)', marginBottom: '2px' }}>
                            Bed Setup
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 1 King Bed or 2 Twin Beds"
                            value={item.bedType ?? ''}
                            onChange={(e) => updatePriceItem(idx, 'bedType', e.target.value)}
                            data-testid={`room-bed-${idx}`}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--line)',
                              fontSize: '11px',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--mute)', marginBottom: '2px' }}>
                            Room Size
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 350 sq ft"
                            value={item.size ?? ''}
                            onChange={(e) => updatePriceItem(idx, 'size', e.target.value)}
                            data-testid={`room-size-${idx}`}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--line)',
                              fontSize: '11px',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--mute)', marginBottom: '2px' }}>
                            View
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. River Balcony or Mountain View"
                            value={item.view ?? ''}
                            onChange={(e) => updatePriceItem(idx, 'view', e.target.value)}
                            data-testid={`room-view-${idx}`}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--line)',
                              fontSize: '11px',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--mute)', marginBottom: '2px' }}>
                            Room Amenities
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Ensuite Bath, Balcony, Flat TV, Free Wi-Fi"
                            value={item.amenities ?? ''}
                            onChange={(e) => updatePriceItem(idx, 'amenities', e.target.value)}
                            data-testid={`room-amenities-${idx}`}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--line)',
                              fontSize: '11px',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>

                        {/* Dedicated Room Photo Picker */}
                        <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed var(--line)' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                              Dedicated Room Photo
                            </label>
                            <label
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '5px 10px',
                                borderRadius: 'var(--radius-button)',
                                border: '1px dashed var(--line)',
                                backgroundColor: 'var(--card)',
                                color: 'var(--pri)',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              <Camera size={13} />
                              {item.photoFile ? 'Replace Room Photo' : 'Upload Room Photo'}
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                data-testid={`input-room-photo-${idx}`}
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    const preview = URL.createObjectURL(file);
                                    updatePriceItem(idx, 'photoFile', file);
                                    updatePriceItem(idx, 'photoPreviewUrl', preview);
                                  }
                                }}
                              />
                            </label>
                          </div>
                          {item.photoPreviewUrl && (
                            <img
                              src={item.photoPreviewUrl}
                              alt="Room preview"
                              style={{ width: '40px', height: '32px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--line)' }}
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Activity Specific Fields for Hotel Experience */}
                    {isHotel && item.category === 'Activity' && (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                          gap: '8px',
                          padding: '8px 10px',
                          backgroundColor: 'rgba(254, 243, 199, 0.4)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px dashed #FCD34D',
                        }}
                      >
                        <div>
                          <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#92400E', marginBottom: '2px' }}>
                            Activity Duration
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 2 Hours, Half Day, Nightly"
                            value={item.size ?? ''}
                            onChange={(e) => updatePriceItem(idx, 'size', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--line)',
                              fontSize: '11px',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#92400E', marginBottom: '2px' }}>
                            Activity Description & Included Gear
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Fishing rods, riverside bonfire, tea & local guide included"
                            value={item.amenities ?? ''}
                            onChange={(e) => updatePriceItem(idx, 'amenities', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--line)',
                              fontSize: '11px',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Service / Extra Specific Fields for Hotel */}
                    {isHotel && item.category === 'Extra' && (
                      <div
                        style={{
                          padding: '8px 10px',
                          backgroundColor: 'rgba(239, 246, 255, 0.5)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px dashed #BFDBFE',
                        }}
                      >
                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#1E40AF', marginBottom: '2px' }}>
                          Service Details & Inclusions
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Airport/Terminal shuttle, fresh breakfast buffet, extra rollaway bed"
                          value={item.amenities ?? ''}
                          onChange={(e) => updatePriceItem(idx, 'amenities', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '5px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--line)',
                            fontSize: '11px',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Restaurant Section-Grouped Live Preview */}
            {selectedType === 'restaurant' && priceItems.some((p) => p.name.trim()) && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '12px 14px',
                  backgroundColor: 'rgba(200, 150, 62, 0.08)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(200, 150, 62, 0.25)',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--pri)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Owner Preview: Menu Grouped by Section
                </div>
                {Array.from(new Set(priceItems.map((p) => p.category?.trim() || 'Specialties'))).map((sec) => (
                  <div key={sec} style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', borderBottom: '1px solid var(--line)', paddingBottom: '2px', marginBottom: '4px' }}>
                      {sec}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {priceItems
                        .filter((p) => (p.category?.trim() || 'Specialties') === sec && p.name.trim())
                        .map((p, pIdx) => (
                          <div key={pIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--mute)' }}>
                            <span>• {p.name}</span>
                            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Rs {Number(p.price || 0).toLocaleString()}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Photo Upload */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
              Listing Photo
            </label>
            <div
              style={{
                border: '2px dashed var(--line)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                textAlign: 'center',
                backgroundColor: 'var(--bg)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
              onClick={() => document.getElementById('listing-file-input')?.click()}
            >
              <input
                id="listing-file-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              {imagePreview ? (
                <div style={{ position: 'relative', width: '120px', height: '80px', borderRadius: '8px', overflow: 'hidden' }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      fontSize: '10px',
                      padding: '2px',
                    }}
                  >
                    Change photo
                  </div>
                </div>
              ) : (
                <>
                  <Upload size={24} style={{ color: 'var(--pri)' }} />
                  <span style={{ fontSize: 'var(--font-sm)', color: 'var(--ink)', fontWeight: 500 }}>
                    Click or drop photo here
                  </span>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                    PNG, JPG, WEBP (Saved locally behind media interface)
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            backgroundColor: 'var(--card)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
            {isEditMode ? (
              <span>Editing Property: <strong style={{ color: 'var(--ink)' }}>{title || businessProfile?.business_name || 'Active Listing'}</strong></span>
            ) : (
              <span>Creating new business entity listing</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="soft"
              onClick={() => handleFormSubmit(false)}
              disabled={submitting}
              data-testid="btn-save-draft"
            >
              Save Draft
            </Button>
            <Button
              type="button"
              variant="accent"
              onClick={() => handleFormSubmit(true)}
              disabled={submitting}
              data-testid="btn-publish-listing"
            >
              {submitting ? 'Saving Property...' : isEditMode ? 'Save & Update Property' : 'Publish to Tourists'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
