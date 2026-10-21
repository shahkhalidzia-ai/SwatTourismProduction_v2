/**
 * Swat Tourism Platform — Tourist AI Service Engine
 * Powers Phases A to D:
 * - Phase A: Natural language prompt-to-itinerary parser & generator
 * - Phase B: Geographic sequence optimizer & mountain drive duration calculator
 * - Phase C: Proactive mountain weather, snow-chain & road advisory evaluator, bilingual SOS generator
 * - Phase D: Interactive tourist concierge query engine (cuisine, roads, etiquette, WhatsApp sync)
 */

import type { TripStop } from '../api/trips';

// Geographic ordering of Swat Valley from South (entrance) to North (high alpine)
export const SWAT_VALLEY_TOPOLOGY: Record<string, { rank: number; label: string; elevationMeters: number }> = {
  'saidu sharif': { rank: 1, label: 'Saidu Sharif', elevationMeters: 970 },
  'mingora': { rank: 2, label: 'Mingora', elevationMeters: 984 },
  'marghuzar': { rank: 3, label: 'Marghuzar (White Palace)', elevationMeters: 1250 },
  'malam jabba': { rank: 4, label: 'Malam Jabba (Peak)', elevationMeters: 2804 },
  'madyan': { rank: 5, label: 'Madyan', elevationMeters: 1320 },
  'miandam': { rank: 6, label: 'Miandam', elevationMeters: 1800 },
  'bahrain': { rank: 7, label: 'Bahrain', elevationMeters: 1400 },
  'kalam': { rank: 8, label: 'Kalam Valley', elevationMeters: 2000 },
  'ushu': { rank: 9, label: 'Ushu Pine Forest', elevationMeters: 2200 },
  'matiltan': { rank: 10, label: 'Matiltan Waterfall', elevationMeters: 2350 },
  'mahodand': { rank: 11, label: 'Mahodand Lake', elevationMeters: 2865 },
  'saifullah': { rank: 12, label: 'Saifullah Lake', elevationMeters: 2950 },
};

/**
 * PHASE A: Natural Language Trip Parser & Itinerary Generator
 */
export interface GeneratedAITrip {
  title: string;
  days: number;
  travellers: number;
  budgetPKR: number;
  originCity: string;
  theme: string;
  highlights: string[];
  stops: Array<{
    day_number: number;
    time_slot: string;
    custom_title: string;
    stop_type: 'destination' | 'listing' | 'custom';
    notes: string;
    destination_name?: string;
  }>;
}

export function parseAndGenerateTripFromPrompt(prompt: string): GeneratedAITrip {
  const p = prompt.toLowerCase();

  // Extract Days
  let days = 3;
  const daysMatch = p.match(/(\d+)\s*(?:day|days|d)/i);
  if (daysMatch) {
    days = Math.min(7, Math.max(1, parseInt(daysMatch[1], 10)));
  } else if (p.includes('weekend')) {
    days = 2;
  } else if (p.includes('week') || p.includes('7 days')) {
    days = 7;
  }

  // Extract Travellers
  let travellers = 2;
  const travMatch = p.match(/(\d+)\s*(?:person|persons|people|traveller|travellers|pax|adults)/i);
  if (travMatch) {
    travellers = Math.min(15, Math.max(1, parseInt(travMatch[1], 10)));
  } else if (p.includes('family')) {
    travellers = 4;
  } else if (p.includes('solo')) {
    travellers = 1;
  } else if (p.includes('couple') || p.includes('honeymoon')) {
    travellers = 2;
  }

  // Extract Budget
  let budgetPKR = days * 18000;
  const budgetMatch = p.match(/(\d+)\s*(?:k|thousand|000|pkr|rs)/i);
  if (budgetMatch) {
    const raw = parseInt(budgetMatch[1], 10);
    budgetPKR = raw < 100 ? raw * 1000 : raw;
  } else if (p.includes('luxury') || p.includes('serena') || p.includes('expensive')) {
    budgetPKR = days * 35000;
  } else if (p.includes('budget') || p.includes('cheap') || p.includes('backpacker')) {
    budgetPKR = days * 9000;
  }

  // Extract Origin City
  let originCity = 'Islamabad / Rawalpindi';
  if (p.includes('lahore')) originCity = 'Lahore';
  else if (p.includes('peshawar')) originCity = 'Peshawar';
  else if (p.includes('karachi')) originCity = 'Karachi';

  // Determine Primary Themes
  const hasSnow = p.includes('snow') || p.includes('ski') || p.includes('malam jabba') || p.includes('winter');
  const hasTrout = p.includes('trout') || p.includes('fish') || p.includes('bahrain') || p.includes('madyan') || p.includes('food');
  const hasAlpine = p.includes('lake') || p.includes('mahodand') || p.includes('kalam') || p.includes('ushu') || p.includes('4x4');
  const hasHeritage = p.includes('heritage') || p.includes('palace') || p.includes('history') || p.includes('museum') || p.includes('buddhist');

  // Title & Theme
  let theme = 'Scenic Mountain Discovery';
  let title = `${days}-Day Swat Valley Explorer`;

  if (hasSnow && hasAlpine) {
    theme = 'Snow Peaks & Alpine Lakes';
    title = `${days}-Day Snow & Alpine Odyssey`;
  } else if (hasSnow) {
    theme = 'Malam Jabba Ski & Snow Trail';
    title = `${days}-Day Malam Jabba Snow Adventure`;
  } else if (hasTrout) {
    theme = 'Riverside Trout & Valley Serenity';
    title = `${days}-Day Swat Riverside Gourmet Trail`;
  } else if (hasHeritage) {
    theme = 'Royal Palaces & Ancient Heritage';
    title = `${days}-Day Swati Heritage Discovery`;
  }

  // Generate Day-by-Day Stops
  const stops: GeneratedAITrip['stops'] = [];

  // Day 1: Arrival & Valley Entrance / Heritage
  stops.push({
    day_number: 1,
    time_slot: '07:30 AM',
    custom_title: `🚌 Swat Express Luxury Coach: ${originCity} ➔ Mingora`,
    stop_type: 'custom',
    notes: `VIP Departure via M-16 Swat Expressway. Journey duration ~3.5 hrs. Safe tunnel corridor transit.`,
  });

  if (hasHeritage) {
    stops.push({
      day_number: 1,
      time_slot: '01:30 PM',
      custom_title: '🏰 Marghuzar White Palace',
      stop_type: 'destination',
      notes: 'Historical 1940s royal white marble residence of Wali of Swat.',
      destination_name: 'White Palace Marghuzar',
    });
  } else {
    stops.push({
      day_number: 1,
      time_slot: '02:00 PM',
      custom_title: '🏨 Swat Serena Heritage Hotel Check-in',
      stop_type: 'listing',
      notes: 'Rose gardens, luxury heated rooms, and welcome Qahwa.',
    });
  }

  stops.push({
    day_number: 1,
    time_slot: '07:30 PM',
    custom_title: '🍲 Swat Trout Palace & BBQ Dinner',
    stop_type: 'listing',
    notes: 'Fresh spiced river trout with tandoori naan and green tea.',
  });

  // Day 2: High Elevation Adventure or Snow
  if (days >= 2) {
    if (hasSnow) {
      stops.push({
        day_number: 2,
        time_slot: '08:30 AM',
        custom_title: '⛷️ Malam Jabba Ski Resort & Chairlift Peak',
        stop_type: 'destination',
        notes: 'Snow sports, zipline, high-altitude chairlift ride overlooking snowy Karakoram peaks.',
        destination_name: 'Malam Jabba Ski Resort',
      });
      stops.push({
        day_number: 2,
        time_slot: '04:30 PM',
        custom_title: '☕ Peakview Pine Cafe & Herbal Qahwa',
        stop_type: 'custom',
        notes: 'Warm fireside hot chocolate and local walnut cake.',
      });
    } else {
      stops.push({
        day_number: 2,
        time_slot: '09:00 AM',
        custom_title: '🚗 4x4 Mountain Cruiser Safari to Kalam Valley',
        stop_type: 'custom',
        notes: 'Scenic riverbank drive via Madyan trout fish hatcheries and Bahrain bazaar.',
      });
      stops.push({
        day_number: 2,
        time_slot: '03:00 PM',
        custom_title: '🌲 Kalam Valley Cedar Heights Stay',
        stop_type: 'listing',
        notes: 'Alpine timber lodge overlooking rushing Swat River.',
      });
    }
  }

  // Day 3: Alpine Glacial Lakes or Cedar Forests
  if (days >= 3) {
    stops.push({
      day_number: 3,
      time_slot: '08:30 AM',
      custom_title: '💎 Mahodand & Saifullah Glacial Lakes Excursion',
      stop_type: 'destination',
      notes: 'Rugged 4x4 trail through Ushu pine forest to turquoise glacier waters.',
      destination_name: 'Mahodand Lake',
    });
    stops.push({
      day_number: 3,
      time_slot: '02:00 PM',
      custom_title: '🌲 Ushu Forest Riverside Walk & Photography',
      stop_type: 'destination',
      notes: 'Dense deodar cedar forest canopy with crystal streams.',
      destination_name: 'Ushu Forest',
    });
    stops.push({
      day_number: 3,
      time_slot: '08:00 PM',
      custom_title: '🔥 Mountain Bonfire & Shinwari Karahi',
      stop_type: 'custom',
      notes: 'Starlit alpine dinner with live local rubab music.',
    });
  }

  // Day 4+: Additional days extension
  for (let d = 4; d <= days; d++) {
    stops.push({
      day_number: d,
      time_slot: '10:00 AM',
      custom_title: `🌊 Day ${d} Alpine Leisure: Miandam Orchards & River Angling`,
      stop_type: 'custom',
      notes: 'Peaceful hiking, wild walnut gathering, and fresh trout fly-fishing.',
    });
  }

  return {
    title,
    days,
    travellers,
    budgetPKR,
    originCity,
    theme,
    highlights: [
      hasSnow ? '❄️ Malam Jabba Snow & Chairlift' : '🌲 Kalam Valley Alpine Forest',
      '🐟 Fresh Swati River Trout Dining',
      hasAlpine ? '💎 Mahodand Glacial Lake 4x4 Excursion' : '🏰 Royal White Palace Tour',
      '🚌 Direct M-16 Expressway Transit',
    ],
    stops,
  };
}

/**
 * PHASE B: Geographic Sequence & Route Optimizer
 */
export interface RouteOptimizationResult {
  hasInefficiencies: boolean;
  detectedBacktracks: string[];
  distanceSavedKm: number;
  timeSavedHours: number;
  optimizedStops: TripStop[];
  estimatedTotalDriveHours: number;
}

export function analyzeAndOptimizeRoute(stops: TripStop[]): RouteOptimizationResult {
  if (!stops || stops.length <= 1) {
    return {
      hasInefficiencies: false,
      detectedBacktracks: [],
      distanceSavedKm: 0,
      timeSavedHours: 0,
      optimizedStops: stops || [],
      estimatedTotalDriveHours: 1.5,
    };
  }

  // Detect geographic rank of each stop
  const getRank = (stop: TripStop): number => {
    const text = `${stop.custom_title || ''} ${stop.notes || ''} ${stop.listing?.title || ''} ${stop.destination?.name || ''}`.toLowerCase();
    for (const [key, data] of Object.entries(SWAT_VALLEY_TOPOLOGY)) {
      if (text.includes(key)) return data.rank;
    }
    return 5; // Default middle
  };

  const detectedBacktracks: string[] = [];
  let backtrackCount = 0;

  for (let i = 0; i < stops.length - 2; i++) {
    const r1 = getRank(stops[i]);
    const r2 = getRank(stops[i + 1]);
    const r3 = getRank(stops[i + 2]);

    // Backtracking pattern: North -> South -> North OR South -> North -> South with delta >= 3
    if ((r2 < r1 - 2 && r3 > r2 + 2) || (r2 > r1 + 2 && r3 < r2 - 2)) {
      backtrackCount++;
      const t1 = stops[i].custom_title || stops[i].listing?.title || 'Stop 1';
      const t2 = stops[i + 1].custom_title || stops[i + 1].listing?.title || 'Stop 2';
      const t3 = stops[i + 2].custom_title || stops[i + 2].listing?.title || 'Stop 3';
      detectedBacktracks.push(`Backtracking between "${t1}" ➔ "${t2}" ➔ "${t3}"`);
    }
  }

  // Sort stops per day by geographical linear rank to maximize fuel and time efficiency
  const optimized = [...stops].sort((a, b) => {
    if (a.day_number !== b.day_number) return a.day_number - b.day_number;
    return getRank(a) - getRank(b);
  });

  const distanceSavedKm = backtrackCount * 45;
  const timeSavedHours = Number((backtrackCount * 1.8).toFixed(1));

  return {
    hasInefficiencies: backtrackCount > 0,
    detectedBacktracks,
    distanceSavedKm,
    timeSavedHours,
    optimizedStops: optimized,
    estimatedTotalDriveHours: Number((3.5 + stops.length * 0.4).toFixed(1)),
  };
}

/**
 * Mountain Travel Time Calculator between Swat destinations
 */
export function getMountainTravelEstimate(origin: string, destination: string): { durationText: string; distanceKm: number; roadTip: string } {
  const o = origin.toLowerCase();
  const d = destination.toLowerCase();

  if ((o.includes('mingora') && d.includes('kalam')) || (o.includes('kalam') && d.includes('mingora'))) {
    return { durationText: '3.5 Hours', distanceKm: 98, roadTip: 'Winding asphalt highway along Swat River. Smooth till Bahrain.' };
  }
  if ((o.includes('kalam') && d.includes('mahodand')) || (o.includes('mahodand') && d.includes('kalam'))) {
    return { durationText: '2.5 Hours', distanceKm: 35, roadTip: 'Unpaved alpine jeep track. High clearance 4x4 strictly required.' };
  }
  if ((o.includes('mingora') && d.includes('malam jabba')) || (o.includes('malam jabba') && d.includes('mingora'))) {
    return { durationText: '1.5 Hours', distanceKm: 48, roadTip: 'Steep incline with hairpin curves. Snow chains needed above 2,200m in winter.' };
  }
  if ((o.includes('mingora') && d.includes('white palace')) || (o.includes('white palace') && d.includes('mingora'))) {
    return { durationText: '30 Minutes', distanceKm: 14, roadTip: 'Paved, gentle tourist route accessible by all vehicles.' };
  }

  return { durationText: '1.0 - 1.5 Hours', distanceKm: 30, roadTip: 'Scenic valley road. Moderate mountain curves.' };
}

/**
 * PHASE C: Proactive Weather, Road & SOS Evaluator
 */
export interface WeatherAlertInfo {
  severity: 'info' | 'warning' | 'alert';
  title: string;
  advice: string;
  recommendedGear: string[];
}

export function evaluateDestinationSafety(destinationName: string): WeatherAlertInfo {
  const name = destinationName.toLowerCase();

  if (name.includes('malam jabba')) {
    return {
      severity: 'warning',
      title: 'Snow Season & Icy Pass Advisory',
      advice: 'Steep climb. Tire snow chains recommended above Manglor checkpoint. Chairlift closes at 4:30 PM due to mountain fog.',
      recommendedGear: ['Tire Snow Chains', 'Heavy Thermal Jacket', 'Waterproof Gloves', 'UV Sunglasses'],
    };
  }

  if (name.includes('mahodand') || name.includes('saifullah')) {
    return {
      severity: 'alert',
      title: 'High Altitude Glacial Pass (4x4 Only)',
      advice: 'Sedans cannot traverse the boulder crossing past Ushu. Engage local 4x4 Cruiser with certified driver.',
      recommendedGear: ['High-clearance 4x4', 'Waterproof Hiking Boots', 'Emergency Powerbank', 'Cash (No ATMs)'],
    };
  }

  if (name.includes('kalam')) {
    return {
      severity: 'info',
      title: 'Cool Alpine Breeze (12°C)',
      advice: 'Main road open and clear. Evening temperatures drop sharply. Keep fleece jackets handy.',
      recommendedGear: ['Light Woolens', 'Comfortable Walking Shoes', 'Umbrella / Rain Poncho'],
    };
  }

  return {
    severity: 'info',
    title: 'Sunny & Clear Mountain Route',
    advice: 'Roads wide and fully open via M-16 Expressway corridor.',
    recommendedGear: ['Sunblock', 'Comfortable Footwear'],
  };
}

/**
 * Emergency SOS Bilingual Dispatch Formatter
 */
export function generateEmergencySOSDispatch(params: {
  touristName: string;
  phone: string;
  lat: number;
  lng: number;
  nearestArea: string;
  medicalNotes?: string;
}): { englishText: string; urduText: string; helpline: string } {
  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const mapLink = `https://maps.google.com/?q=${params.lat.toFixed(5)},${params.lng.toFixed(5)}`;

  const englishText =
    `🚨 EMERGENCY SOS ALERT — SWAT TOURIST RESCUE\n` +
    `• Tourist: ${params.touristName} (${params.phone})\n` +
    `• GPS: ${params.lat.toFixed(5)}, ${params.lng.toFixed(5)}\n` +
    `• Location: Near ${params.nearestArea}, Swat Valley\n` +
    `• Map: ${mapLink}\n` +
    `• Time: ${time}\n` +
    `${params.medicalNotes ? `• Medical/Condition: ${params.medicalNotes}\n` : ''}` +
    `Immediate dispatch requested via Rescue 1122 & Swat Tourist Police.`;

  const urduText =
    `🚨 ہنگامی امداد کا پیغام — سوات ٹورسٹ ریسکیو\n` +
    `• سیاح کا نام: ${params.touristName} (${params.phone})\n` +
    `• مقام: قریب ${params.nearestArea}، وادی سوات\n` +
    `• جی پی ایس نقشہ: ${mapLink}\n` +
    `براہ کرم فوری ریسکیو 1122 اور سوات ٹورازم پولیس روانہ کریں۔`;

  return {
    englishText,
    urduText,
    helpline: '1122 / +92-946-9240444',
  };
}

/**
 * PHASE D: Interactive Concierge Knowledge Query Engine
 */
export interface ConciergeAnswer {
  question: string;
  answer: string;
  category: 'hotel' | 'food' | 'roads' | 'culture' | 'safety';
  quickActionText?: string;
  quickActionTab?: string;
}

const CONCIERGE_KB: ConciergeAnswer[] = [
  {
    question: 'can sedan car reach kalam',
    answer: 'Yes! The main Swat road from Mingora through Bahrain to Kalam town is fully paved and easily accessible by Toyota Corolla, Honda Civic, or Suzuki Alto. However, for trips beyond Kalam (Mahodand Lake or Ushu Forest), a high-clearance 4x4 Jeep is required.',
    category: 'roads',
    quickActionText: 'Explore 4x4 Jeeps in Kalam',
    quickActionTab: 'explore',
  },
  {
    question: 'what is swati trout fish',
    answer: 'Swati River Trout is the signature culinary specialty of Swat Valley, farmed in cold freshwater glacial streams in Madyan and Kalam. It is typically served pan-fried with mild mountain spices or charcoal grilled with Kandahari tandoori naan.',
    category: 'food',
    quickActionText: 'View Trout Restaurants',
    quickActionTab: 'explore',
  },
  {
    question: 'do hotels have heating in winter',
    answer: 'Yes, verified hotels on the Swat Tourism Platform (such as Swat Serena, Kalam Heights, and Riverside Inn) are equipped with 24/7 central room heating, electric blankets, solar hot water, and backup generator power.',
    category: 'hotel',
    quickActionText: 'Browse Heated Hotels',
    quickActionTab: 'explore',
  },
  {
    question: 'local culture etiquette tips',
    answer: 'Swatis are famously hospitable ("Pashtunwali / Melmastia"). Always ask for permission before taking photographs of local residents or rural villages. Modest dress covering shoulders and knees is appreciated when visiting local bazaars and heritage shrines.',
    category: 'culture',
  },
  {
    question: 'are atms available in kalam',
    answer: 'There are limited ATMs in Kalam town (HBL and NBP), but they occasionally run out of cash during peak holiday weekends. We strongly recommend withdrawing sufficient cash in Mingora or Bahrain before heading up-valley.',
    category: 'safety',
  },
];

export function queryTouristAIConcierge(userQuery: string): ConciergeAnswer {
  const q = userQuery.toLowerCase().trim();

  for (const item of CONCIERGE_KB) {
    const keywords = item.question.split(' ');
    const matchCount = keywords.filter((k) => q.includes(k)).length;
    if (matchCount >= 2 || q.includes(item.question)) {
      return item;
    }
  }

  // Dynamic contextual fallback
  if (q.includes('hotel') || q.includes('room') || q.includes('stay')) {
    return {
      question: userQuery,
      answer: 'Swat offers verified stays ranging from heritage luxury (Swat Serena Hotel) to riverside trout inns in Madyan and alpine chalets in Kalam. All featured stays on this platform are certified by the Swat Tourism Authority.',
      category: 'hotel',
      quickActionText: 'Browse Verified Hotels',
      quickActionTab: 'explore',
    };
  }

  if (q.includes('road') || q.includes('drive') || q.includes('highway') || q.includes('motorway')) {
    return {
      question: userQuery,
      answer: 'The M-16 Swat Expressway provides a modern dual-carriageway direct link from Islamabad/Peshawar to Chakdara and Mingora. The road to Kalam is open and smooth. High-altitude trails to Mahodand require 4x4 cruisers.',
      category: 'roads',
      quickActionText: 'Check Road Status',
      quickActionTab: 'safety',
    };
  }

  if (q.includes('food') || q.includes('eat') || q.includes('restaurant') || q.includes('dinner')) {
    return {
      question: userQuery,
      answer: 'Must-try Swati specialties include: Pan-fried river trout, Shinwari lamb karahi, Chapli kebabs, Swati Kabuli pulao, and traditional Kalam wild-walnut halwa.',
      category: 'food',
      quickActionText: 'View Food & Restaurants',
      quickActionTab: 'explore',
    };
  }

  return {
    question: userQuery,
    answer: `Here is what Swat Tourism AI recommends for "${userQuery}": Swat Valley is in peak condition! For safety, always travel along certified routes, verify hotel heating in high alpine zones, and take advantage of 1-tap booking on this platform.`,
    category: 'safety',
    quickActionText: 'View Swat Discovery',
    quickActionTab: 'home',
  };
}
