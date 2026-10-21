export interface IntercityRoute {
  id: string;
  origin_city: string;
  origin_city_ur?: string;
  destination_city: string;
  destination_city_ur?: string;
  distance_km: number;
  duration_mins: number;
  via_highway: string;
}

export interface TransportSchedule {
  id: string;
  operator_id: string;
  operator_name: string;
  operator_logo?: string;
  operator_phone: string;
  operator_type: 'luxury_bus' | 'standard_bus' | 'express_coaster' | 'private_car';
  vehicle_title: string;
  origin_city: string;
  destination_city: string;
  departure_terminal: string;
  arrival_terminal: string;
  departure_time: string;
  arrival_time: string;
  duration_text: string;
  frequency: string;
  ticket_price_pkr: number;
  pricing_type: 'per_seat' | 'per_vehicle';
  amenities: string[];
  total_seats: number;
  available_seats: number;
  rating: number;
  is_verified: boolean;
  via_highway: string;
}

export interface TransportBookingRecord {
  id: string;
  schedule_id: string;
  passenger_name: string;
  passenger_phone: string;
  passenger_cnic?: string;
  seat_count: number;
  travel_date: string;
  total_price_pkr: number;
  booking_status: 'confirmed' | 'pending';
  booking_reference: string;
  operator_name: string;
  departure_terminal: string;
  arrival_terminal: string;
  departure_time: string;
  created_at: string;
}

export const POPULAR_ORIGIN_CITIES = [
  'Islamabad / Rawalpindi',
  'Peshawar',
  'Lahore',
  'Faisalabad',
  'Multan',
  'Gujranwala / Sialkot',
  'Karachi',
  'Abbottabad / Haripur',
];

export const SWAT_DESTINATIONS = [
  'Mingora (Swat Central)',
  'Kalam Valley',
  'Malam Jabba Ski Resort',
  'Bahrain / Madyan',
];

// Seeded Comprehensive Intercity Schedules
export const MOCK_INTERCITY_SCHEDULES: TransportSchedule[] = [
  // 1. Daewoo Express - Islamabad -> Mingora
  {
    id: 'sch-dw-01',
    operator_id: 'op-daewoo',
    operator_name: 'Daewoo Express',
    operator_phone: '111-007-008',
    operator_type: 'luxury_bus',
    vehicle_title: 'Super Luxury AC Bus (2x2)',
    origin_city: 'Islamabad / Rawalpindi',
    destination_city: 'Mingora (Swat Central)',
    departure_terminal: 'Islamabad 26 Number / Faizabad Terminal',
    arrival_terminal: 'Mingora General Daewoo Terminal, G.T. Road',
    departure_time: '07:30 AM',
    arrival_time: '10:45 AM',
    duration_text: '3h 15m',
    frequency: 'Daily (Every 3 Hours)',
    ticket_price_pkr: 1950,
    pricing_type: 'per_seat',
    amenities: ['Air Conditioned', 'Free High-Speed Wi-Fi', 'Reclining Seats', 'Phone Charging Ports', 'Bottled Water & Snack', '30kg Luggage'],
    total_seats: 40,
    available_seats: 14,
    rating: 4.8,
    is_verified: true,
    via_highway: 'M-1 & Swat Expressway M-16',
  },
  {
    id: 'sch-dw-02',
    operator_id: 'op-daewoo',
    operator_name: 'Daewoo Express',
    operator_phone: '111-007-008',
    operator_type: 'luxury_bus',
    vehicle_title: 'Gold Class VIP Sleeper (2x1)',
    origin_city: 'Islamabad / Rawalpindi',
    destination_city: 'Mingora (Swat Central)',
    departure_terminal: 'Faizabad Intercity Terminal, Islamabad',
    arrival_terminal: 'Mingora General Daewoo Terminal, G.T. Road',
    departure_time: '02:00 PM',
    arrival_time: '05:15 PM',
    duration_text: '3h 15m',
    frequency: 'Daily Afternoon VIP',
    ticket_price_pkr: 2650,
    pricing_type: 'per_seat',
    amenities: ['VIP 2x1 Wide Leather Seats', 'Individual Media Screens', 'Air Conditioned & Heating', 'Hot Beverage / Snacks', 'Toll Highway Fast Track'],
    total_seats: 28,
    available_seats: 9,
    rating: 4.9,
    is_verified: true,
    via_highway: 'M-1 & Swat Expressway M-16',
  },

  // 2. Faisal Movers - Islamabad -> Mingora
  {
    id: 'sch-fm-01',
    operator_id: 'op-faisal',
    operator_name: 'Faisal Movers',
    operator_phone: '111-228-486',
    operator_type: 'luxury_bus',
    vehicle_title: 'Executive Class Yutong (2x2)',
    origin_city: 'Islamabad / Rawalpindi',
    destination_city: 'Mingora (Swat Central)',
    departure_terminal: 'Pirwadhai / I-8 Interchange Terminal',
    arrival_terminal: 'Mingora Motorway Bypass Terminal',
    departure_time: '08:30 AM',
    arrival_time: '12:00 PM',
    duration_text: '3h 30m',
    frequency: 'Daily (Every 2 Hours)',
    ticket_price_pkr: 1750,
    pricing_type: 'per_seat',
    amenities: ['Air Conditioned', 'Reclining Ergonomic Seats', 'Mobile Charging', 'Luggage Compartment', 'Rest Stop at Rashakai'],
    total_seats: 44,
    available_seats: 21,
    rating: 4.7,
    is_verified: true,
    via_highway: 'M-1 & Swat Expressway M-16',
  },
  {
    id: 'sch-fm-02',
    operator_id: 'op-faisal',
    operator_name: 'Faisal Movers',
    operator_phone: '111-228-486',
    operator_type: 'luxury_bus',
    vehicle_title: 'Business Class Luxury (2x1)',
    origin_city: 'Islamabad / Rawalpindi',
    destination_city: 'Mingora (Swat Central)',
    departure_terminal: 'Pirwadhai / Faizabad Terminal',
    arrival_terminal: 'Mingora Motorway Bypass Terminal',
    departure_time: '05:00 PM',
    arrival_time: '08:30 PM',
    duration_text: '3h 30m',
    frequency: 'Daily Evening',
    ticket_price_pkr: 2450,
    pricing_type: 'per_seat',
    amenities: ['2x1 Luxury Reclining Seats', 'Audio/Video Entertainment', 'Refreshments', 'Free Wi-Fi', 'Fast Toll Pass'],
    total_seats: 30,
    available_seats: 11,
    rating: 4.8,
    is_verified: true,
    via_highway: 'M-1 & Swat Expressway M-16',
  },

  // 3. Swat Coach Express - Rawalpindi/Islamabad -> Mingora
  {
    id: 'sch-sc-01',
    operator_id: 'op-swatcoach',
    operator_name: 'Swat Coach & Flying Express',
    operator_phone: '+92-946-724111',
    operator_type: 'express_coaster',
    vehicle_title: 'Toyota Coaster Saloon Express',
    origin_city: 'Islamabad / Rawalpindi',
    destination_city: 'Mingora (Swat Central)',
    departure_terminal: 'Pirwadhai General Bus Stand, Rawalpindi',
    arrival_terminal: 'Mingora General Bus Stand (GBS)',
    departure_time: '06:00 AM',
    arrival_time: '09:00 AM',
    duration_text: '3h 00m',
    frequency: 'Hourly (06:00 AM – 08:00 PM)',
    ticket_price_pkr: 1400,
    pricing_type: 'per_seat',
    amenities: ['Direct Non-Stop Service', 'Air Conditioned', 'Express Motorway Speed', 'Overhead Luggage Rack'],
    total_seats: 26,
    available_seats: 15,
    rating: 4.6,
    is_verified: true,
    via_highway: 'Swat Expressway M-16',
  },

  // 4. Kalam Direct Mountain Shuttle - Islamabad -> Kalam
  {
    id: 'sch-kl-01',
    operator_id: 'op-kalamshuttle',
    operator_name: 'Kalam Valley Direct Express (KPCTA Approved)',
    operator_phone: '+92-300-8594231',
    operator_type: 'express_coaster',
    vehicle_title: 'Mountain-Grade Toyota Coaster 4x4',
    origin_city: 'Islamabad / Rawalpindi',
    destination_city: 'Kalam Valley',
    departure_terminal: 'Faizabad Tourist Terminal, Islamabad',
    arrival_terminal: 'Kalam Main Pine Bazar Terminal, Swat',
    departure_time: '06:30 AM',
    arrival_time: '12:30 PM',
    duration_text: '6h 00m',
    frequency: 'Daily Morning Departure',
    ticket_price_pkr: 2800,
    pricing_type: 'per_seat',
    amenities: ['Direct to Upper Kalam (No Bus Swap)', 'Heated Mountain Cabin', 'Panoramic Scenic Windows', 'Breakfast Rest Stop at Madyan Trout Farm'],
    total_seats: 24,
    available_seats: 8,
    rating: 4.9,
    is_verified: true,
    via_highway: 'M-16 Expressway & N-95 Kalam Highway',
  },

  // 5. Private Chauffeur & Doorstep Car Rental - Islamabad -> Any Swat Destination
  {
    id: 'sch-pr-01',
    operator_id: 'op-privateswat',
    operator_name: 'Swat Tourism Chauffeur & Doorstep Cab Service',
    operator_phone: '+92-345-9876543',
    operator_type: 'private_car',
    vehicle_title: 'Private Sedan (Toyota Corolla / Yaris AC with Driver)',
    origin_city: 'Islamabad / Rawalpindi',
    destination_city: 'Mingora (Swat Central)',
    departure_terminal: 'Doorstep Pickup (Home / Hotel / Islamabad Airport)',
    arrival_terminal: 'Direct Drop at Swat Hotel / Destination',
    departure_time: 'On-Demand (Flexible 24/7)',
    arrival_time: 'Flexible (~3h 15m)',
    duration_text: '3h 15m',
    frequency: 'On-Demand Private Booking',
    ticket_price_pkr: 15000,
    pricing_type: 'per_vehicle',
    amenities: ['Private Chauffeur Included', 'Dedicated AC Car (Up to 4 Pax)', 'Highway Motorway Tolls Included', 'Custom Photo & Rest Stops', 'Doorstep Luggage Assist'],
    total_seats: 4,
    available_seats: 4,
    rating: 5.0,
    is_verified: true,
    via_highway: 'M-1 & Swat Expressway M-16',
  },
  {
    id: 'sch-pr-02',
    operator_id: 'op-privateswat',
    operator_name: 'Swat Tourism Chauffeur & Doorstep Cab Service',
    operator_phone: '+92-345-9876543',
    operator_type: 'private_car',
    vehicle_title: 'Private Executive Van (Toyota Grand Cabin 13-Seater)',
    origin_city: 'Islamabad / Rawalpindi',
    destination_city: 'Kalam Valley',
    departure_terminal: 'Doorstep Pickup (Islamabad / Rawalpindi)',
    arrival_terminal: 'Direct Kalam Hotel / Resort Doorstep',
    departure_time: 'On-Demand (Flexible)',
    arrival_time: 'Flexible (~5h 45m)',
    duration_text: '5h 45m',
    frequency: 'On-Demand Family / Group Booking',
    ticket_price_pkr: 28000,
    pricing_type: 'per_vehicle',
    amenities: ['13-Seater High-Roof Grand Cabin', 'Dual AC & Heating', 'Spacious Group Luggage Bay', 'Experienced Mountain Driver', 'Direct Drop to Kalam / Malam Jabba'],
    total_seats: 13,
    available_seats: 13,
    rating: 4.9,
    is_verified: true,
    via_highway: 'M-16 & N-95',
  },

  // 6. Peshawar -> Mingora / Swat
  {
    id: 'sch-psh-01',
    operator_id: 'op-daewoo',
    operator_name: 'Daewoo Express',
    operator_phone: '111-007-008',
    operator_type: 'luxury_bus',
    vehicle_title: 'Super Luxury Intercity Bus',
    origin_city: 'Peshawar',
    destination_city: 'Mingora (Swat Central)',
    departure_terminal: 'Peshawar Cantt / Ring Road Terminal',
    arrival_terminal: 'Mingora General Daewoo Terminal',
    departure_time: '08:00 AM',
    arrival_time: '10:30 AM',
    duration_text: '2h 30m',
    frequency: 'Daily (Every 2 Hours)',
    ticket_price_pkr: 1450,
    pricing_type: 'per_seat',
    amenities: ['Air Conditioned', 'Free Wi-Fi', 'Express Via Motorway', 'Charging Ports'],
    total_seats: 40,
    available_seats: 18,
    rating: 4.8,
    is_verified: true,
    via_highway: 'M-1 & Swat Expressway M-16',
  },
  {
    id: 'sch-psh-02',
    operator_id: 'op-swatcoach',
    operator_name: 'KP Highway Shuttle (KPCTA Express)',
    operator_phone: '+92-91-9213456',
    operator_type: 'express_coaster',
    vehicle_title: 'Express AC Hiace',
    origin_city: 'Peshawar',
    destination_city: 'Mingora (Swat Central)',
    departure_terminal: 'Peshawar General Bus Stand (Haji Camp)',
    arrival_terminal: 'Mingora GBS, Swat',
    departure_time: '09:30 AM',
    arrival_time: '12:00 PM',
    duration_text: '2h 30m',
    frequency: 'Hourly',
    ticket_price_pkr: 1100,
    pricing_type: 'per_seat',
    amenities: ['Direct Highway Fast Route', 'Air Conditioned', 'Quick Boarding'],
    total_seats: 15,
    available_seats: 7,
    rating: 4.6,
    is_verified: true,
    via_highway: 'Swat Expressway M-16',
  },

  // 7. Lahore -> Mingora / Swat
  {
    id: 'sch-lhr-01',
    operator_id: 'op-faisal',
    operator_name: 'Faisal Movers',
    operator_phone: '111-228-486',
    operator_type: 'luxury_bus',
    vehicle_title: 'Business Class Luxury (2x1 Sleeper)',
    origin_city: 'Lahore',
    destination_city: 'Mingora (Swat Central)',
    departure_terminal: 'Lahore Band Road / Kalma Chowk Terminal',
    arrival_terminal: 'Mingora Motorway Bypass Terminal',
    departure_time: '06:00 AM',
    arrival_time: '12:30 PM',
    duration_text: '6h 30m',
    frequency: 'Daily Morning',
    ticket_price_pkr: 2950,
    pricing_type: 'per_seat',
    amenities: ['2x1 Wide Reclining Seats', 'Hot Meal / Refreshments Included', 'Free Wi-Fi & Media Screens', 'Motorway Tolls Pass', 'Luggage 30kg'],
    total_seats: 30,
    available_seats: 12,
    rating: 4.9,
    is_verified: true,
    via_highway: 'M-2 Motorway & M-16 Swat Expressway',
  },
  {
    id: 'sch-lhr-02',
    operator_id: 'op-daewoo',
    operator_name: 'Daewoo Express',
    operator_phone: '111-007-008',
    operator_type: 'luxury_bus',
    vehicle_title: 'Super Luxury Night Coach (2x2)',
    origin_city: 'Lahore',
    destination_city: 'Mingora (Swat Central)',
    departure_terminal: 'Thokar Niaz Baig Terminal, Lahore',
    arrival_terminal: 'Mingora Daewoo Terminal, Swat',
    departure_time: '11:00 PM',
    arrival_time: '05:30 AM',
    duration_text: '6h 30m',
    frequency: 'Daily Night Express',
    ticket_price_pkr: 2750,
    pricing_type: 'per_seat',
    amenities: ['Night Sleeper Comfort Blankets', 'Air Conditioned / Heating', 'Rest Stop at Sukheki / Bhera', 'Direct Morning Arrival'],
    total_seats: 40,
    available_seats: 16,
    rating: 4.8,
    is_verified: true,
    via_highway: 'M-2 & M-16',
  },

  // 8. Faisalabad -> Mingora / Swat
  {
    id: 'sch-fsd-01',
    operator_id: 'op-faisal',
    operator_name: 'Faisal Movers',
    operator_phone: '111-228-486',
    operator_type: 'luxury_bus',
    vehicle_title: 'Executive AC Coach',
    origin_city: 'Faisalabad',
    destination_city: 'Mingora (Swat Central)',
    departure_terminal: 'Kohinoor City Terminal, Faisalabad',
    arrival_terminal: 'Mingora Motorway Bypass Terminal',
    departure_time: '07:00 AM',
    arrival_time: '01:15 PM',
    duration_text: '6h 15m',
    frequency: 'Daily Service',
    ticket_price_pkr: 2600,
    pricing_type: 'per_seat',
    amenities: ['Air Conditioned', 'Free Wi-Fi', 'Reclining Seats', 'Luggage Storage'],
    total_seats: 44,
    available_seats: 19,
    rating: 4.7,
    is_verified: true,
    via_highway: 'M-4 Motorway & M-16',
  },

  // 9. Multan -> Mingora / Swat
  {
    id: 'sch-mul-01',
    operator_id: 'op-daewoo',
    operator_name: 'Daewoo Express',
    operator_phone: '111-007-008',
    operator_type: 'luxury_bus',
    vehicle_title: 'Long-Haul Luxury Coach',
    origin_city: 'Multan',
    destination_city: 'Mingora (Swat Central)',
    departure_terminal: 'Daewoo Terminal, Khanewal Road, Multan',
    arrival_terminal: 'Mingora General Daewoo Terminal, Swat',
    departure_time: '09:00 PM',
    arrival_time: '06:00 AM',
    duration_text: '9h 00m',
    frequency: 'Daily Night Service',
    ticket_price_pkr: 3400,
    pricing_type: 'per_seat',
    amenities: ['Sleeper Rest Pillow & Blanket', 'Snacks & Tea', 'Air Conditioned', 'Charging Outlets'],
    total_seats: 40,
    available_seats: 10,
    rating: 4.8,
    is_verified: true,
    via_highway: 'M-4 Motorway & Swat Expressway M-16',
  },

  // 10. Karachi -> Mingora / Swat
  {
    id: 'sch-khi-01',
    operator_id: 'op-faisal',
    operator_name: 'Faisal Movers & KP Connect',
    operator_phone: '111-228-486',
    operator_type: 'luxury_bus',
    vehicle_title: 'Business Class Cross-Country Express',
    origin_city: 'Karachi',
    destination_city: 'Mingora (Swat Central)',
    departure_terminal: 'Sohrab Goth Super Highway Terminal, Karachi',
    arrival_terminal: 'Mingora Motorway Bypass Terminal, Swat',
    departure_time: '04:00 PM',
    arrival_time: '02:00 PM (Next Day)',
    duration_text: '22h 00m',
    frequency: 'Daily Luxury Cross-Country',
    ticket_price_pkr: 6800,
    pricing_type: 'per_seat',
    amenities: ['Full Sleeper Reclining', 'Meals Included', 'Personal Media Screen', 'Attendant Onboard'],
    total_seats: 32,
    available_seats: 7,
    rating: 4.7,
    is_verified: true,
    via_highway: 'M-5 & M-16 Swat Expressway',
  },
];

/**
 * Filter and search intercity schedules matching origin city and Swat destination.
 */
export function queryIntercitySchedules(
  originCity: string,
  destinationCity: string = 'Mingora (Swat Central)',
  operatorType?: string
): TransportSchedule[] {
  let results = MOCK_INTERCITY_SCHEDULES.filter((s) => {
    const originMatch = s.origin_city.toLowerCase().includes(originCity.toLowerCase()) ||
      originCity.toLowerCase().includes(s.origin_city.toLowerCase()) ||
      (originCity.includes('Islamabad') && s.origin_city.includes('Rawalpindi')) ||
      (originCity.includes('Rawalpindi') && s.origin_city.includes('Islamabad'));

    const destMatch = !destinationCity ||
      destinationCity === 'all' ||
      s.destination_city.toLowerCase().includes(destinationCity.toLowerCase()) ||
      destinationCity.toLowerCase().includes(s.destination_city.toLowerCase());

    return originMatch && destMatch;
  });

  if (operatorType && operatorType !== 'all') {
    results = results.filter((s) => s.operator_type === operatorType);
  }

  return results;
}

/**
 * Book / reserve a seat on an intercity transport service and produce a confirmation voucher.
 */
export function bookIntercitySeat(
  schedule: TransportSchedule,
  passengerName: string,
  passengerPhone: string,
  seatCount: number = 1,
  travelDate: string
): TransportBookingRecord {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const ref = `SWT-EXP-${randomSuffix}`;
  const totalPrice = schedule.pricing_type === 'per_vehicle'
    ? schedule.ticket_price_pkr
    : schedule.ticket_price_pkr * seatCount;

  const record: TransportBookingRecord = {
    id: `tbk-${Date.now()}`,
    schedule_id: schedule.id,
    passenger_name: passengerName,
    passenger_phone: passengerPhone,
    seat_count: seatCount,
    travel_date: travelDate,
    total_price_pkr: totalPrice,
    booking_status: 'confirmed',
    booking_reference: ref,
    operator_name: schedule.operator_name,
    departure_terminal: schedule.departure_terminal,
    arrival_terminal: schedule.arrival_terminal,
    departure_time: schedule.departure_time,
    created_at: new Date().toISOString(),
  };

  // Persist locally for session continuity
  try {
    const existing = JSON.parse(localStorage.getItem('swat_intercity_bookings') || '[]');
    existing.unshift(record);
    localStorage.setItem('swat_intercity_bookings', JSON.stringify(existing));
  } catch {
    // localStorage silent catch
  }

  return record;
}
