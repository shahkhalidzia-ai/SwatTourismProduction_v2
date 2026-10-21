import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../../design/Card';
import { Button } from '../../design/Button';
import { Tag } from '../../design/Tag';
import { Chip } from '../../design/Chip';
import {
  Car,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  AlertTriangle,
  Check,
  ShieldCheck,
  Users,
  Clock,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  addPriceItem,
  updatePriceItem,
  deletePriceItem,
  type ListingItem,
  type PriceUnitCode,
} from '../../api/listings';

export interface FleetVehicle {
  id: string;
  name: string;
  category: string;
  fare: number;
  unit: PriceUnitCode;
  capacity: number;
  regNumber: string;
  driverName: string;
  driverPhone?: string;
  description?: string;
  features: string[];
  is_active: boolean; // Published status (true = Live on portal, false = Draft)
  is_in_service: boolean; // Availability status (true = In Service & Taking Bookings, false = Off Duty)
  availabilityNote?: string;
  providerId?: string;
  providerName?: string;
  userId?: string;
  business_id?: string;
}

export const DEFAULT_VEHICLE_IDS = new Set([
  'veh-jeep-1',
  'veh-hiace-1',
  'veh-prado-1',
  'veh-coaster-1',
  'veh-brv-1',
]);

export const VEHICLE_CATEGORIES = [
  'All Vehicles',
  '4x4 Mountain Jeeps',
  'High-Roof Vans',
  'Luxury 4WD SUVs',
  'Group Coasters & Mini-Buses',
  'Passenger Sedans & Wagons',
];

export const DEFAULT_FLEET: FleetVehicle[] = [
  {
    id: 'veh-jeep-1',
    name: '4x4 Mountain Jeep (Willys / CJ7 Alpine Special)',
    category: '4x4 Mountain Jeeps',
    fare: 12000,
    unit: 'per_day',
    capacity: 6,
    regNumber: 'SWT-4921',
    driverName: 'Usman Khan (Alpine Certified)',
    driverPhone: '0345-9871234',
    description: 'High-clearance 4WD jeep customized for rugged mountain roads (Kalam, Mahodand Lake, Ushu Forest, Kundol). Heavy-duty suspension and all-terrain tires.',
    features: ['4x4 Low-Range', 'Snow Chains Equipped', 'Roof Luggage Carrier', 'High Clearance', 'First Aid Kit'],
    is_active: true,
    is_in_service: true,
    availabilityNote: 'Daily 06:00 AM – 09:00 PM',
  },
  {
    id: 'veh-hiace-1',
    name: 'Grand Cabin Hiace (Executive High-Roof)',
    category: 'High-Roof Vans',
    fare: 1800,
    unit: 'per_seat',
    capacity: 14,
    regNumber: 'ICT-8812',
    driverName: 'Kamran Shah (Coach Captain)',
    driverPhone: '0301-4455667',
    description: 'Luxury high-roof passenger van for Swat Express intercity and valley transfers. Spacious legroom with individual reclining seats.',
    features: ['Dual Climate AC & Heater', 'Individual Reclining Seats', 'High Luggage Capacity', 'USB Phone Charging'],
    is_active: true,
    is_in_service: true,
    availabilityNote: 'Scheduled Morning & Evening Trips',
  },
  {
    id: 'veh-prado-1',
    name: 'Toyota Land Cruiser Prado TX (VIP 4WD)',
    category: 'Luxury 4WD SUVs',
    fare: 25000,
    unit: 'per_day',
    capacity: 7,
    regNumber: 'LES-3091',
    driverName: 'Bilal Ahmad (Executive Chauffeur)',
    driverPhone: '0333-8877665',
    description: 'Executive 4WD luxury SUV for VIP tours to Malam Jabba, Bahrain, and Kalam. Equipped with plush leather seating and chilled drinks console.',
    features: ['4WD All-Terrain', 'Leather Interior', 'Dual Zone Climate AC', 'Center Chilled Console', 'Bluetooth Audio'],
    is_active: true,
    is_in_service: true,
    availabilityNote: '24/7 VIP On-Call Reservation',
  },
  {
    id: 'veh-coaster-1',
    name: 'Toyota Coaster Saloon (Executive 29-Seater)',
    category: 'Group Coasters & Mini-Buses',
    fare: 38000,
    unit: 'per_day',
    capacity: 28,
    regNumber: 'SWT-1102',
    driverName: 'Gul Zada (Senior Highway Captain)',
    driverPhone: '0312-3322110',
    description: 'Full-size group coach for family reunions, school excursions, and corporate retreats traveling through Swat Valley and Mingora.',
    features: ['High-Power AC & Cabin Heater', 'PA Tour Guide Mic System', 'Overhead Luggage Racks', 'Emergency Exit'],
    is_active: true,
    is_in_service: true,
    availabilityNote: 'Advance Group Charter Booking',
  },
  {
    id: 'veh-brv-1',
    name: 'Honda BR-V (7-Seater Family Wagon)',
    category: 'Passenger Sedans & Wagons',
    fare: 9500,
    unit: 'per_day',
    capacity: 6,
    regNumber: 'MN-4520',
    driverName: 'Fawad Khan (Swat Valley Guide)',
    driverPhone: '0346-5544332',
    description: 'Comfortable and fuel-efficient 7-seater compact SUV suitable for day trips around Mingora, White Palace Marghazar, and Saidu Sharif museums.',
    features: ['Rear AC Vents', 'Foldable 3rd Row Luggage Space', 'Modern Audio System', 'Family Child-Seat Friendly'],
    is_active: true,
    is_in_service: false, // Demo off-duty vehicle to showcase toggle
    availabilityNote: 'Scheduled Maintenance / Available Tomorrow',
  },
];

const AVAILABLE_FEATURES = [
  '4x4 Low-Range',
  'Snow Chains Equipped',
  'Roof Luggage Carrier',
  'Dual Climate AC & Heater',
  'High Clearance',
  'First Aid Kit',
  'USB Phone Charging',
  'Leather Interior',
  'PA Tour Guide Mic System',
  'GPS Fleet Tracking',
];

export function getAllFleetVehicles(): FleetVehicle[] {
  const vehicleMap = new Map<string, FleetVehicle>();
  let foundStored = false;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('swat_transport_fleet_') || key === 'swat_transport_fleet_global')) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list) && list.length > 0) {
              foundStored = true;
              for (const v of list) {
                if (v && v.id && v.name) {
                  vehicleMap.set(v.id, v);
                }
              }
            }
          }
        } catch {
          // ignore parsing error
        }
      }
    }
  } catch {
    // ignore storage access error
  }

  // Fallback to DEFAULT_FLEET if no stored fleet found and not in clean slate mode
  const isCleanSlate = typeof window !== 'undefined' && localStorage.getItem('swat_clean_slate') === 'true';
  if (!isCleanSlate && !foundStored && vehicleMap.size === 0) {
    for (const v of DEFAULT_FLEET) {
      vehicleMap.set(v.id, v);
    }
  }

  return Array.from(vehicleMap.values());
}

export function getFleetVehiclesForProvider(providerName?: string, providerId?: string): FleetVehicle[] {
  if (!providerName && !providerId) {
    return getAllFleetVehicles();
  }

  const cleanName = (providerName || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const storageKey = cleanName ? `swat_transport_fleet_${cleanName}` : '';

  // 1. Check provider storage key
  if (storageKey) {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          const userAdded = list.filter((v) => !DEFAULT_VEHICLE_IDS.has(v.id));
          if (userAdded.length > 0) return userAdded;
        }
      }
    } catch {}
  }

  // 2. Check providerId storage key
  if (providerId) {
    try {
      const idKey = `swat_transport_fleet_id_${providerId}`;
      const raw = localStorage.getItem(idKey);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          const userAdded = list.filter((v) => !DEFAULT_VEHICLE_IDS.has(v.id));
          if (userAdded.length > 0) return userAdded;
        }
      }
    } catch {}
  }

  // 3. Check global fleet registry for vehicles explicitly tagged with this provider
  try {
    const globalRaw = localStorage.getItem('swat_transport_fleet_global');
    if (globalRaw) {
      const list = JSON.parse(globalRaw);
      if (Array.isArray(list) && list.length > 0) {
        const matched = list.filter(
          (v: any) =>
            !DEFAULT_VEHICLE_IDS.has(v.id) &&
            ((providerId && v.providerId === providerId) ||
              (cleanName && v.providerName && v.providerName.toLowerCase().replace(/[^a-z0-9]/g, '_') === cleanName))
        );
        if (matched.length > 0) return matched;
      }
    }
  } catch {}

  // 4. Default demo provider fallback (for demo runners / unit tests without explicit custom vehicle)
  const isDefaultProvider =
    cleanName.includes('swat_valley_4x4') ||
    cleanName.includes('swat_valley_transport') ||
    cleanName === 'default';

  if (isDefaultProvider && !providerId) {
    return DEFAULT_FLEET;
  }

  return [];
}

export function fleetVehicleToListingItem(v: FleetVehicle, providerName?: string): ListingItem {
  const effectiveProviderName = v.providerName || providerName || 'Swat Transport & 4x4 Services';
  const effectiveBizId = v.providerId || v.business_id || 'biz-transport-provider';
  return {
    id: `listing-${v.id}`,
    business_id: effectiveBizId,
    business_name: effectiveProviderName,
    type_id: 'bef2e082a8664dbba8cb7c7e5eb014f5',
    type_code: 'transport',
    type_label: 'Transport & 4x4',
    area_name: 'Swat Valley',
    title: v.name,
    description:
      v.description ||
      `${v.category} with driver ${v.driverName}. Capacity: ${v.capacity} passengers. Plate: ${v.regNumber}.`,
    address_text: `Plate: ${v.regNumber}${v.driverName ? ` • Driver: ${v.driverName}` : ''}`,
    latitude: 34.78,
    longitude: 72.36,
    is_verified: true,
    rating_avg: 4.9,
    rating_count: 24,
    status: v.is_active ? 'published' : 'draft',
    details: {
      category: v.category,
      vehicle_type: v.category,
      registration_no: v.regNumber,
      driver_name: v.driverName,
      driver_phone: v.driverPhone,
      seating_capacity: v.capacity,
      seats: v.capacity,
      features: v.features || [],
      availability_note: v.availabilityNote || 'Daily In-Service',
      is_in_service: v.is_in_service,
      is_active: v.is_active,
    },
    price_items: [
      {
        id: `pi-${v.id}`,
        name: `${v.name} (${v.capacity} Seats)`,
        price: v.fare,
        unit: v.unit || 'per_day',
        capacity: v.capacity,
        default_units: v.capacity,
        is_bookable: v.is_in_service !== false,
        is_active: v.is_active !== false,
      },
    ],
    media: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function getPublishedTransportListingItems(): ListingItem[] {
  const allVehicles = getAllFleetVehicles();
  return allVehicles
    .filter((v) => v.is_active !== false && v.is_in_service !== false)
    .map((v) => fleetVehicleToListingItem(v));
}

interface TransportFleetManagerProps {
  listing?: ListingItem | null;
  transportName: string;
  providerId?: string;
  userId?: string;
  isLoggedInUser?: boolean;
  onRefresh?: () => Promise<void> | void;
  showToast: (msg: string) => void;
}

export const TransportFleetManager: React.FC<TransportFleetManagerProps> = ({
  listing,
  transportName,
  providerId,
  userId,
  isLoggedInUser = false,
  onRefresh,
  showToast,
}) => {
  const cleanName = transportName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const storageKey = `swat_transport_fleet_${cleanName}`;

  const [vehicles, setVehicles] = useState<FleetVehicle[]>(() => {
    // 1. Check provider storage key
    let candidateVehicles: FleetVehicle[] = [];
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          candidateVehicles = parsed;
        }
      }
    } catch {}

    // 2. Check providerId key if present
    if (providerId && candidateVehicles.length === 0) {
      try {
        const stored = localStorage.getItem(`swat_transport_fleet_id_${providerId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            candidateVehicles = parsed;
          }
        }
      } catch {}
    }

    // 3. Check global registry
    if (candidateVehicles.length === 0) {
      try {
        const globalRaw = localStorage.getItem('swat_transport_fleet_global');
        if (globalRaw) {
          const parsed = JSON.parse(globalRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const matched = parsed.filter(
              (v: any) =>
                (providerId && v.providerId === providerId) ||
                (userId && v.userId === userId) ||
                (v.providerName && v.providerName.toLowerCase().replace(/[^a-z0-9]/g, '_') === cleanName)
            );
            if (matched.length > 0) {
              candidateVehicles = matched;
            }
          }
        }
      } catch {}
    }

    // 4. Scoping enforcement:
    // If logged-in user (isLoggedInUser is true, or providerId / userId provided):
    // Only return vehicles added by this user/provider. Never include DEFAULT_FLEET demo vehicles.
    if (isLoggedInUser || providerId || userId) {
      const userAddedOnly = candidateVehicles.filter((v) => !DEFAULT_VEHICLE_IDS.has(v.id));
      return userAddedOnly;
    }

    // If candidate vehicles exist, return them
    if (candidateVehicles.length > 0) {
      return candidateVehicles;
    }

    // Fallback for default demo provider in unauthenticated test environments
    const isDefaultProvider =
      cleanName.includes('swat_valley_transport') ||
      cleanName.includes('swat_valley_4x4') ||
      cleanName === 'default';

    if (isDefaultProvider) {
      return DEFAULT_FLEET;
    }

    return [];
  });

  // Persist whenever vehicles change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(vehicles));
      if (providerId) {
        localStorage.setItem(`swat_transport_fleet_id_${providerId}`, JSON.stringify(vehicles));
      }

      // Merge into global fleet registry so other providers' vehicles and default fleet are not lost
      let globalList: FleetVehicle[] = [];
      try {
        const rawGlobal = localStorage.getItem('swat_transport_fleet_global');
        if (rawGlobal) {
          const parsed = JSON.parse(rawGlobal);
          if (Array.isArray(parsed)) {
            globalList = parsed;
          }
        }
      } catch {}

      // Keep vehicles that DO NOT belong to this provider
      const otherVehicles = globalList.filter((g) => {
        if (providerId && g.providerId === providerId) return false;
        if (userId && g.userId === userId) return false;
        if (g.providerName && g.providerName.toLowerCase().replace(/[^a-z0-9]/g, '_') === cleanName) return false;
        if (vehicles.some((v) => v.id === g.id)) return false;
        return true;
      });

      const updatedGlobal = [...vehicles, ...otherVehicles];
      localStorage.setItem('swat_transport_fleet_global', JSON.stringify(updatedGlobal));
      window.dispatchEvent(new CustomEvent('swat_transport_fleet_updated', { detail: vehicles }));
    } catch {
      // ignore
    }
  }, [vehicles, storageKey, cleanName, providerId, userId]);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('All Vehicles');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'in_service' | 'off_duty'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Vehicle Modal (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState(VEHICLE_CATEGORIES[1]);
  const [formFare, setFormFare] = useState<number>(12000);
  const [formUnit, setFormUnit] = useState<PriceUnitCode>('per_day');
  const [formCapacity, setFormCapacity] = useState<number>(6);
  const [formRegNumber, setFormRegNumber] = useState('');
  const [formDriverName, setFormDriverName] = useState('');
  const [formDriverPhone, setFormDriverPhone] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formFeatures, setFormFeatures] = useState<string[]>(['4x4 Low-Range', 'First Aid Kit']);
  const [formIsActive, setFormIsActive] = useState<boolean>(true); // Published
  const [formIsInService, setFormIsInService] = useState<boolean>(true); // In service
  const [formAvailabilityNote, setFormAvailabilityNote] = useState('Daily 06:00 AM – 09:00 PM');
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirmation Modal
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; vehicle: FleetVehicle | null }>({
    open: false,
    vehicle: null,
  });

  // Filtered list
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      // Category filter
      if (selectedCategory !== 'All Vehicles' && v.category !== selectedCategory) {
        return false;
      }
      // Availability filter
      if (availabilityFilter === 'in_service' && !v.is_in_service) {
        return false;
      }
      if (availabilityFilter === 'off_duty' && v.is_in_service) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = v.name.toLowerCase().includes(q);
        const matchesReg = v.regNumber.toLowerCase().includes(q);
        const matchesDriver = v.driverName.toLowerCase().includes(q);
        const matchesCategory = v.category.toLowerCase().includes(q);
        if (!matchesName && !matchesReg && !matchesDriver && !matchesCategory) {
          return false;
        }
      }
      return true;
    });
  }, [vehicles, selectedCategory, availabilityFilter, searchQuery]);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = vehicles.length;
    const inService = vehicles.filter((v) => v.is_in_service).length;
    const offDuty = total - inService;
    const published = vehicles.filter((v) => v.is_active).length;
    const fares = vehicles.map((v) => v.fare).filter((f) => f > 0);
    const minFare = fares.length > 0 ? Math.min(...fares) : 0;
    const maxFare = fares.length > 0 ? Math.max(...fares) : 0;
    return { total, inService, offDuty, published, minFare, maxFare };
  }, [vehicles]);

  const openAddModal = () => {
    setEditingVehicleId(null);
    setFormName('');
    setFormCategory(selectedCategory !== 'All Vehicles' ? selectedCategory : VEHICLE_CATEGORIES[1]);
    setFormFare(12000);
    setFormUnit('per_day');
    setFormCapacity(6);
    setFormRegNumber('');
    setFormDriverName('');
    setFormDriverPhone('');
    setFormDescription('');
    setFormFeatures(['4x4 Low-Range', 'First Aid Kit']);
    setFormIsActive(true);
    setFormIsInService(true);
    setFormAvailabilityNote('Daily 06:00 AM – 09:00 PM');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (v: FleetVehicle) => {
    setEditingVehicleId(v.id);
    setFormName(v.name);
    setFormCategory(v.category);
    setFormFare(v.fare);
    setFormUnit(v.unit);
    setFormCapacity(v.capacity);
    setFormRegNumber(v.regNumber);
    setFormDriverName(v.driverName);
    setFormDriverPhone(v.driverPhone || '');
    setFormDescription(v.description || '');
    setFormFeatures(v.features || []);
    setFormIsActive(v.is_active);
    setFormIsInService(v.is_in_service);
    setFormAvailabilityNote(v.availabilityNote || 'Daily 06:00 AM – 09:00 PM');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggleFeature = (feat: string) => {
    setFormFeatures((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
    );
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Please enter a vehicle name or model.');
      return;
    }
    if (!formFare || formFare <= 0) {
      setFormError('Please enter a valid fare price (PKR).');
      return;
    }
    if (!formCapacity || formCapacity <= 0) {
      setFormError('Please enter the passenger seating capacity.');
      return;
    }
    if (!formRegNumber.trim()) {
      setFormError('Please enter the vehicle registration / plate number.');
      return;
    }

    if (editingVehicleId) {
      // Update vehicle
      const updatedList = vehicles.map((v) =>
        v.id === editingVehicleId
          ? {
              ...v,
              name: formName.trim(),
              category: formCategory,
              fare: Number(formFare),
              unit: formUnit,
              capacity: Number(formCapacity),
              regNumber: formRegNumber.trim().toUpperCase(),
              driverName: formDriverName.trim() || 'Assigned Company Driver',
              driverPhone: formDriverPhone.trim(),
              description: formDescription.trim(),
              features: formFeatures,
              is_active: formIsActive,
              is_in_service: formIsInService,
              availabilityNote: formAvailabilityNote.trim(),
              providerId: v.providerId || providerId || listing?.business_id,
              providerName: v.providerName || transportName,
              userId: v.userId || userId,
              business_id: v.business_id || listing?.business_id || providerId,
            }
          : v
      );
      setVehicles(updatedList);

      // Attempt API sync if listing is available
      if (listing?.id) {
        try {
          await updatePriceItem(editingVehicleId, {
            name: formName.trim(),
            price: Number(formFare),
            unit: formUnit,
            description: formDescription.trim(),
            is_active: formIsActive,
            is_bookable: formIsInService,
            default_units: Number(formCapacity),
          });
        } catch {
          // offline fallback
        }
      }

      showToast(`Vehicle "${formName}" updated successfully.`);
    } else {
      // Add new vehicle
      const newVehicle: FleetVehicle = {
        id: `veh-${Date.now()}`,
        name: formName.trim(),
        category: formCategory,
        fare: Number(formFare),
        unit: formUnit,
        capacity: Number(formCapacity),
        regNumber: formRegNumber.trim().toUpperCase(),
        driverName: formDriverName.trim() || 'Assigned Company Driver',
        driverPhone: formDriverPhone.trim(),
        description: formDescription.trim(),
        features: formFeatures,
        is_active: formIsActive,
        is_in_service: formIsInService,
        availabilityNote: formAvailabilityNote.trim(),
        providerId: providerId || listing?.business_id,
        providerName: transportName,
        userId: userId,
        business_id: listing?.business_id || providerId,
      };

      setVehicles((prev) => {
        const cleanPrev = (isLoggedInUser || providerId || userId)
          ? prev.filter((v) => !DEFAULT_VEHICLE_IDS.has(v.id))
          : prev;
        return [newVehicle, ...cleanPrev];
      });

      // Attempt API sync
      if (listing?.id) {
        try {
          await addPriceItem(listing.id, {
            name: formName.trim(),
            price: Number(formFare),
            unit: formUnit,
            description: formDescription.trim(),
            is_active: formIsActive,
            is_bookable: formIsInService,
            default_units: Number(formCapacity),
          });
        } catch {
          // offline fallback
        }
      }

      showToast(`Vehicle "${formName}" added & published to fleet!`);
    }

    setIsModalOpen(false);
    if (onRefresh) onRefresh();
  };

  // Toggle in-service availability directly
  const handleToggleAvailability = async (v: FleetVehicle) => {
    const nextAvailability = !v.is_in_service;
    const updated = vehicles.map((item) =>
      item.id === v.id ? { ...item, is_in_service: nextAvailability } : item
    );
    setVehicles(updated);

    if (listing?.id) {
      try {
        await updatePriceItem(v.id, {
          is_bookable: nextAvailability,
        });
      } catch {
        // offline fallback
      }
    }

    showToast(
      nextAvailability
        ? `"${v.name}" is now In Service & Available for tourist bookings!`
        : `"${v.name}" marked Off-Duty / Maintenance.`
    );
  };

  // Toggle publication status (Published vs Draft)
  const handleTogglePublish = async (v: FleetVehicle) => {
    const nextPublished = !v.is_active;
    const updated = vehicles.map((item) =>
      item.id === v.id ? { ...item, is_active: nextPublished } : item
    );
    setVehicles(updated);

    if (listing?.id) {
      try {
        await updatePriceItem(v.id, {
          is_active: nextPublished,
        });
      } catch {
        // offline fallback
      }
    }

    showToast(
      nextPublished
        ? `"${v.name}" published live to tourist portal.`
        : `"${v.name}" unpublished and moved to draft.`
    );
  };

  // Delete vehicle
  const handleConfirmDelete = async () => {
    if (!deleteModal.vehicle) return;
    const toDelete = deleteModal.vehicle;
    const remaining = vehicles.filter((v) => v.id !== toDelete.id);
    setVehicles(remaining);

    if (listing?.id) {
      try {
        await deletePriceItem(toDelete.id);
      } catch {
        // offline fallback
      }
    }

    setDeleteModal({ open: false, vehicle: null });
    showToast(`Vehicle "${toDelete.name}" removed from fleet.`);
    if (onRefresh) onRefresh();
  };

  const formatUnitLabel = (unit: PriceUnitCode) => {
    switch (unit) {
      case 'per_day':
        return '/ day';
      case 'per_seat':
        return '/ seat';
      case 'per_trip':
        return '/ trip';
      case 'per_hour':
        return '/ hour';
      default:
        return `/${unit.replace('_', ' ')}`;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Executive Fleet Header & Stats */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Car size={22} color="var(--pri)" />
            <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
              {transportName} • Fleet & Vehicles
            </h3>
            <Tag variant="ok">Live Operator</Tag>
          </div>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--mute)', margin: '4px 0 0' }}>
            Manage your transport fleet, set custom fares, publish vehicle availability, and assign certified mountain drivers.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            onClick={openAddModal}
            id="btn-add-vehicle"
            data-testid="btn-add-vehicle"
          >
            Add Vehicle to Fleet
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
        }}
      >
        <Card padding="md" style={{ borderLeft: '4px solid var(--pri)' }}>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Fleet Vehicles
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--ink)', marginTop: '4px' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--ok)', marginTop: '2px', fontWeight: 600 }}>
            {stats.published} Published Live
          </div>
        </Card>

        <Card padding="md" style={{ borderLeft: '4px solid var(--ok)' }}>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            In Service & Available
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--ok)', marginTop: '4px' }}>
            {stats.inService}
          </div>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', marginTop: '2px' }}>
            Ready for instant dispatch
          </div>
        </Card>

        <Card padding="md" style={{ borderLeft: '4px solid var(--accent, #e59819)' }}>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Off-Duty / Maintenance
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--ink)', marginTop: '4px' }}>
            {stats.offDuty}
          </div>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', marginTop: '2px' }}>
            Not taking new bookings
          </div>
        </Card>

        <Card padding="md" style={{ borderLeft: '4px solid var(--pri)' }}>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Fare Range
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', marginTop: '4px' }}>
            Rs {stats.minFare.toLocaleString()} – {stats.maxFare.toLocaleString()}
          </div>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', marginTop: '2px' }}>
            Flexible daily & seat rates
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card padding="md" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Category Chips */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {VEHICLE_CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              active={selectedCategory === cat}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Chip>
          ))}
        </div>

        {/* Sub-strip: Search + Availability Status filter */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 280px', maxWidth: '420px', position: 'relative' }}>
            <Search size={16} color="var(--mute)" style={{ position: 'absolute', left: '12px' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by vehicle model, plate #, or driver..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--line)',
                fontSize: 'var(--font-sm)',
                backgroundColor: 'var(--bg)',
                color: 'var(--ink)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--mute)',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', fontWeight: 600 }}>
              Availability:
            </span>
            <Chip
              active={availabilityFilter === 'all'}
              onClick={() => setAvailabilityFilter('all')}
            >
              All ({vehicles.length})
            </Chip>
            <Chip
              active={availabilityFilter === 'in_service'}
              onClick={() => setAvailabilityFilter('in_service')}
            >
              In Service ({stats.inService})
            </Chip>
            <Chip
              active={availabilityFilter === 'off_duty'}
              onClick={() => setAvailabilityFilter('off_duty')}
            >
              Off Duty ({stats.offDuty})
            </Chip>
          </div>
        </div>
      </Card>

      {/* Fleet Vehicles Grid */}
      {filteredVehicles.length === 0 ? (
        <Card padding="lg" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Car size={40} color="var(--mute)" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ fontSize: 'var(--font-base)', fontWeight: 700, margin: '0 0 6px' }}>
            {vehicles.length === 0 ? 'No Vehicles in Your Fleet' : 'No Vehicles Found'}
          </h4>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--mute)', maxWidth: '420px', margin: '0 auto 16px' }}>
            {vehicles.length === 0
              ? 'You have not added any vehicles to your fleet yet. Click "+ Add Vehicle to Fleet" to register and publish your vehicle with daily fares and mountain driver details.'
              : 'No vehicles match the selected filter or search term. Try selecting "All Vehicles" or add a new vehicle to your fleet.'}
          </p>
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={openAddModal}>
            Add Vehicle to Fleet
          </Button>
        </Card>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '16px',
          }}
          data-testid="fleet-vehicles-grid"
        >
          {filteredVehicles.map((vehicle) => (
            <Card
              key={vehicle.id}
              padding="md"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: vehicle.is_in_service ? '1px solid var(--line)' : '1px dashed var(--line)',
                position: 'relative',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Card Header */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <span
                      style={{
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontWeight: 700,
                        color: 'var(--pri)',
                      }}
                    >
                      {vehicle.category}
                    </span>
                    <h4
                      style={{
                        margin: '2px 0 0',
                        fontSize: 'var(--font-base)',
                        fontWeight: 700,
                        color: 'var(--ink)',
                      }}
                    >
                      {vehicle.name}
                    </h4>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '4px',
                        fontSize: 'var(--font-xs)',
                        color: 'var(--mute)',
                      }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                        Plate: {vehicle.regNumber}
                      </span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={12} /> {vehicle.capacity} Seats
                      </span>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <Tag variant={vehicle.is_in_service ? 'ok' : 'neutral'}>
                      {vehicle.is_in_service ? 'In Service' : 'Off Duty'}
                    </Tag>
                    <Tag variant={vehicle.is_active ? 'accent' : 'neutral'}>
                      {vehicle.is_active ? 'Published' : 'Draft'}
                    </Tag>
                  </div>
                </div>

                {/* Driver Info */}
                <div
                  style={{
                    backgroundColor: 'var(--soft)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    marginTop: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 'var(--font-xs)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={14} color="var(--pri)" />
                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                      {vehicle.driverName}
                    </span>
                  </div>
                  {vehicle.driverPhone && (
                    <span style={{ color: 'var(--mute)' }}>{vehicle.driverPhone}</span>
                  )}
                </div>

                {/* Description */}
                {vehicle.description && (
                  <p
                    style={{
                      fontSize: 'var(--font-xs)',
                      color: 'var(--mute)',
                      margin: '10px 0 0',
                      lineHeight: 1.4,
                    }}
                  >
                    {vehicle.description}
                  </p>
                )}

                {/* Features Tags */}
                {vehicle.features && vehicle.features.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '10px' }}>
                    {vehicle.features.map((feat) => (
                      <span
                        key={feat}
                        style={{
                          fontSize: '10.5px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg)',
                          color: 'var(--ink)',
                          border: '1px solid var(--line)',
                        }}
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Bottom: Fare, Availability Toggle & Actions */}
              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: '10px',
                  }}
                >
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                    Standard Fare Rate:
                  </span>
                  <div>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink)' }}>
                      Rs {vehicle.fare.toLocaleString()}
                    </span>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', marginLeft: '4px' }}>
                      {formatUnitLabel(vehicle.unit)}
                    </span>
                  </div>
                </div>

                {/* Availability Publish Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: vehicle.is_in_service ? 'rgba(46, 125, 50, 0.08)' : 'rgba(18, 50, 74, 0.05)',
                    marginBottom: '12px',
                    border: `1px solid ${vehicle.is_in_service ? 'rgba(46, 125, 50, 0.2)' : 'var(--line)'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-xs)' }}>
                    <Clock size={13} color={vehicle.is_in_service ? 'var(--ok)' : 'var(--mute)'} />
                    <span style={{ fontWeight: 600, color: vehicle.is_in_service ? 'var(--ok)' : 'var(--mute)' }}>
                      {vehicle.is_in_service ? 'Available for Tours' : 'Vehicle Off Duty'}
                    </span>
                  </div>

                  <Button
                    variant={vehicle.is_in_service ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => handleToggleAvailability(vehicle)}
                    data-testid={`btn-toggle-availability-${vehicle.id}`}
                  >
                    {vehicle.is_in_service ? 'Set Off Duty' : 'Publish Available'}
                  </Button>
                </div>

                {/* Footer Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <Button
                    variant="soft"
                    size="sm"
                    icon={vehicle.is_active ? <EyeOff size={13} /> : <Eye size={13} />}
                    onClick={() => handleTogglePublish(vehicle)}
                    data-testid={`btn-toggle-publish-${vehicle.id}`}
                  >
                    {vehicle.is_active ? 'Draft' : 'Publish'}
                  </Button>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Pencil size={13} />}
                      onClick={() => openEditModal(vehicle)}
                      data-testid={`btn-edit-vehicle-${vehicle.id}`}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<Trash2 size={13} />}
                      onClick={() => setDeleteModal({ open: true, vehicle })}
                      data-testid={`btn-delete-vehicle-${vehicle.id}`}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Vehicle Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          data-testid="modal-vehicle-builder"
        >
          <div
            style={{
              backgroundColor: 'var(--card-bg, #fff)',
              borderRadius: 'var(--radius-md)',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid var(--line)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 22px',
                borderBottom: '1px solid var(--line)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--ink)' }}>
                  {editingVehicleId ? 'Edit Fleet Vehicle' : 'Add & Publish Vehicle'}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                  Configure vehicle details, fare pricing, capacity, and service availability.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--mute)',
                }}
                data-testid="btn-close-vehicle-modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveVehicle} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {formError && (
                <div
                  style={{
                    backgroundColor: 'rgba(214, 86, 74, 0.1)',
                    border: '1px solid var(--bad)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    fontSize: 'var(--font-xs)',
                    color: 'var(--bad)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertTriangle size={15} />
                  {formError}
                </div>
              )}

              {/* Name & Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, marginBottom: '6px' }}>
                    Vehicle Model / Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Toyota Prado TX 4WD"
                    data-testid="input-vehicle-name"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--line)',
                      fontSize: 'var(--font-sm)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, marginBottom: '6px' }}>
                    Vehicle Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    data-testid="select-vehicle-category"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--line)',
                      fontSize: 'var(--font-sm)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                    }}
                  >
                    {VEHICLE_CATEGORIES.filter((c) => c !== 'All Vehicles').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fare & Pricing Unit */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, marginBottom: '6px' }}>
                    Fare (PKR) *
                  </label>
                  <input
                    type="number"
                    min="100"
                    required
                    value={formFare}
                    onChange={(e) => setFormFare(Number(e.target.value))}
                    data-testid="input-vehicle-fare"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--line)',
                      fontSize: 'var(--font-sm)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, marginBottom: '6px' }}>
                    Fare Basis / Unit *
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value as PriceUnitCode)}
                    data-testid="select-vehicle-unit"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--line)',
                      fontSize: 'var(--font-sm)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                    }}
                  >
                    <option value="per_day">Per Day (Daily Charter)</option>
                    <option value="per_seat">Per Seat (Individual Ticket)</option>
                    <option value="per_trip">Per Trip (Point-to-Point Route)</option>
                    <option value="per_hour">Per Hour (Hourly Rental)</option>
                  </select>
                </div>
              </div>

              {/* Capacity & Reg Number */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, marginBottom: '6px' }}>
                    Passenger Seating Capacity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Number(e.target.value))}
                    data-testid="input-vehicle-capacity"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--line)',
                      fontSize: 'var(--font-sm)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, marginBottom: '6px' }}>
                    Registration Plate Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formRegNumber}
                    onChange={(e) => setFormRegNumber(e.target.value)}
                    placeholder="e.g. SWT-8820"
                    data-testid="input-vehicle-reg"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--line)',
                      fontSize: 'var(--font-sm)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                    }}
                  />
                </div>
              </div>

              {/* Driver Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, marginBottom: '6px' }}>
                    Assigned Driver Name
                  </label>
                  <input
                    type="text"
                    value={formDriverName}
                    onChange={(e) => setFormDriverName(e.target.value)}
                    placeholder="e.g. Tariq Mehmood"
                    data-testid="input-vehicle-driver-name"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--line)',
                      fontSize: 'var(--font-sm)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, marginBottom: '6px' }}>
                    Driver Contact / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formDriverPhone}
                    onChange={(e) => setFormDriverPhone(e.target.value)}
                    placeholder="e.g. 0345-1234567"
                    data-testid="input-vehicle-driver-phone"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--line)',
                      fontSize: 'var(--font-sm)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                    }}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, marginBottom: '6px' }}>
                  Vehicle Description & Route Suitability
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Equipped for off-road tracks, Kalam to Mahodand Lake, heated cabin..."
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--line)',
                    fontSize: 'var(--font-sm)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Features / Equipment Tags */}
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, marginBottom: '6px' }}>
                  Features & Safety Equipment
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {AVAILABLE_FEATURES.map((feat) => {
                    const active = formFeatures.includes(feat);
                    return (
                      <button
                        type="button"
                        key={feat}
                        onClick={() => handleToggleFeature(feat)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '999px',
                          border: active ? '1px solid var(--pri)' : '1px solid var(--line)',
                          backgroundColor: active ? 'var(--soft)' : 'var(--bg)',
                          color: active ? 'var(--pri)' : 'var(--ink)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {active && <Check size={11} />}
                        {feat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Availability & Publishing Controls */}
              <div
                style={{
                  backgroundColor: 'var(--soft)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--ink)' }}>
                      Vehicle Availability Status
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--mute)' }}>
                      Enable to accept tourist bookings immediately.
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formIsInService}
                      onChange={(e) => setFormIsInService(e.target.checked)}
                      data-testid="checkbox-vehicle-in-service"
                    />
                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600 }}>
                      {formIsInService ? 'In Service' : 'Off Duty'}
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--line)' }}>
                  <div>
                    <div style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--ink)' }}>
                      Publish Status
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--mute)' }}>
                      Visible in tourist search results and booking directory.
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      data-testid="checkbox-vehicle-publish"
                    />
                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600 }}>
                      {formIsActive ? 'Published' : 'Draft'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '10px',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--line)',
                }}
              >
                <Button variant="secondary" size="md" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" type="submit" data-testid="btn-submit-vehicle">
                  {editingVehicleId ? 'Save Changes' : 'Add & Publish Vehicle'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && deleteModal.vehicle && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          data-testid="modal-delete-vehicle"
        >
          <div
            style={{
              backgroundColor: 'var(--card-bg, #fff)',
              borderRadius: 'var(--radius-md)',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              border: '1px solid var(--line)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--bad)' }}>
              <Trash2 size={24} />
              <h3 style={{ margin: 0, fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--ink)' }}>
                Remove Vehicle from Fleet?
              </h3>
            </div>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--mute)', margin: '14px 0 20px', lineHeight: 1.5 }}>
              Are you sure you want to remove <strong>{deleteModal.vehicle.name}</strong> (Plate: {deleteModal.vehicle.regNumber})? Tourists will no longer be able to book this vehicle.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setDeleteModal({ open: false, vehicle: null })}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleConfirmDelete}
                data-testid="btn-confirm-delete-vehicle"
              >
                Remove Vehicle
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
