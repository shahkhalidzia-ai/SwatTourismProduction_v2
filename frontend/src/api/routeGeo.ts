/**
 * Geographic coordinates, motorway waypoints, distance (km), and travel duration
 * for routes connecting major Pakistan cities to Swat destinations.
 */

export interface RouteDetails {
  originCity: string;
  originCoords: [number, number];
  destinationCity: string;
  destinationCoords: [number, number];
  distanceKm: number;
  durationText: string;
  durationMins: number;
  viaHighway: string;
  waypoints: [number, number][];
}

export const ORIGIN_CITY_COORDS: Record<string, [number, number]> = {
  'Islamabad / Rawalpindi': [33.6844, 73.0479],
  'Islamabad': [33.6844, 73.0479],
  'Rawalpindi': [33.5973, 73.0479],
  'Peshawar': [34.0151, 71.5249],
  'Lahore': [31.5204, 74.3587],
  'Faisalabad': [31.4504, 73.1350],
  'Multan': [30.1575, 71.5249],
  'Gujranwala / Sialkot': [32.1877, 74.1945],
  'Gujranwala': [32.1877, 74.1945],
  'Sialkot': [32.4945, 74.5229],
  'Karachi': [24.8607, 67.0011],
  'Abbottabad / Haripur': [34.1688, 73.2215],
  'Abbottabad': [34.1688, 73.2215],
  'Haripur': [33.9993, 72.9341],
};

export const SWAT_DESTINATION_COORDS: Record<string, [number, number]> = {
  'Mingora (Swat Central)': [34.7717, 72.3602],
  'Mingora': [34.7717, 72.3602],
  'Saidu Sharif': [34.7500, 72.3550],
  'Kalam Valley': [35.4800, 72.5800],
  'Kalam': [35.4800, 72.5800],
  'Malam Jabba Ski Resort': [34.7997, 72.5714],
  'Malam Jabba': [34.7997, 72.5714],
  'Bahrain / Madyan': [35.2064, 72.5539],
  'Bahrain': [35.2064, 72.5539],
  'Madyan': [35.1347, 72.5342],
  'Mahodand Lake': [35.7142, 72.6486],
  'Ushu Forest': [35.5333, 72.6333],
  'Miandam': [35.0431, 72.5489],
  'Fizagat': [34.8050, 72.3850],
  'Marghazar': [34.6540, 72.3120],
};

// Known motorway route metrics (distance in km, duration in mins & text, highway corridor)
const ROUTE_MATRIX: Record<string, Record<string, { distanceKm: number; durationText: string; durationMins: number; viaHighway: string }>> = {
  'islamabad / rawalpindi': {
    'mingora (swat central)': { distanceKm: 247, durationText: '3h 15m', durationMins: 195, viaHighway: 'M-1 & Swat Expressway M-16' },
    'kalam valley': { distanceKm: 344, durationText: '5h 45m', durationMins: 345, viaHighway: 'M-16 Expressway & N-95 Kalam Highway' },
    'malam jabba ski resort': { distanceKm: 292, durationText: '4h 30m', durationMins: 270, viaHighway: 'M-16 Expressway & Malam Jabba Hill Road' },
    'bahrain / madyan': { distanceKm: 308, durationText: '4h 45m', durationMins: 285, viaHighway: 'M-16 & N-95 Highway' },
  },
  'peshawar': {
    'mingora (swat central)': { distanceKm: 165, durationText: '2h 15m', durationMins: 135, viaHighway: 'M-1 & Swat Expressway M-16' },
    'kalam valley': { distanceKm: 262, durationText: '4h 45m', durationMins: 285, viaHighway: 'M-16 & N-95 Highway' },
    'malam jabba ski resort': { distanceKm: 210, durationText: '3h 30m', durationMins: 210, viaHighway: 'M-16 & Malam Jabba Hill Road' },
    'bahrain / madyan': { distanceKm: 226, durationText: '3h 45m', durationMins: 225, viaHighway: 'M-16 & N-95 Highway' },
  },
  'lahore': {
    'mingora (swat central)': { distanceKm: 615, durationText: '7h 30m', durationMins: 450, viaHighway: 'M-2, M-1 & Swat Expressway M-16' },
    'kalam valley': { distanceKm: 712, durationText: '10h 00m', durationMins: 600, viaHighway: 'M-2, M-16 & N-95 Highway' },
    'malam jabba ski resort': { distanceKm: 660, durationText: '8h 45m', durationMins: 525, viaHighway: 'M-2, M-16 & Malam Jabba Hill Road' },
    'bahrain / madyan': { distanceKm: 676, durationText: '9h 00m', durationMins: 540, viaHighway: 'M-2, M-16 & N-95 Highway' },
  },
  'faisalabad': {
    'mingora (swat central)': { distanceKm: 560, durationText: '6h 50m', durationMins: 410, viaHighway: 'M-4, M-2, M-1 & Swat Expressway M-16' },
    'kalam valley': { distanceKm: 657, durationText: '9h 20m', durationMins: 560, viaHighway: 'M-4, M-2, M-16 & N-95 Highway' },
    'malam jabba ski resort': { distanceKm: 605, durationText: '8h 05m', durationMins: 485, viaHighway: 'M-4, M-2, M-16 & Malam Jabba Road' },
    'bahrain / madyan': { distanceKm: 621, durationText: '8h 20m', durationMins: 500, viaHighway: 'M-4, M-2, M-16 & N-95 Highway' },
  },
  'multan': {
    'mingora (swat central)': { distanceKm: 790, durationText: '9h 45m', durationMins: 585, viaHighway: 'M-4, M-2, M-1 & Swat Expressway M-16' },
    'kalam valley': { distanceKm: 887, durationText: '12h 15m', durationMins: 735, viaHighway: 'M-4, M-2, M-16 & N-95' },
    'malam jabba ski resort': { distanceKm: 835, durationText: '11h 00m', durationMins: 660, viaHighway: 'M-4, M-2, M-16 & Malam Jabba Road' },
    'bahrain / madyan': { distanceKm: 851, durationText: '11h 15m', durationMins: 675, viaHighway: 'M-4, M-2, M-16 & N-95' },
  },
  'gujranwala / sialkot': {
    'mingora (swat central)': { distanceKm: 480, durationText: '6h 00m', durationMins: 360, viaHighway: 'M-2 & Swat Expressway M-16' },
    'kalam valley': { distanceKm: 577, durationText: '8h 30m', durationMins: 510, viaHighway: 'M-2, M-16 & N-95 Highway' },
    'malam jabba ski resort': { distanceKm: 525, durationText: '7h 15m', durationMins: 435, viaHighway: 'M-2, M-16 & Malam Jabba Road' },
    'bahrain / madyan': { distanceKm: 541, durationText: '7h 30m', durationMins: 450, viaHighway: 'M-2, M-16 & N-95 Highway' },
  },
  'abbottabad / haripur': {
    'mingora (swat central)': { distanceKm: 195, durationText: '3h 10m', durationMins: 190, viaHighway: 'M-15 Hazara & Swat Expressway M-16' },
    'kalam valley': { distanceKm: 292, durationText: '5h 40m', durationMins: 340, viaHighway: 'M-15, M-16 & N-95 Highway' },
    'malam jabba ski resort': { distanceKm: 240, durationText: '4h 25m', durationMins: 265, viaHighway: 'M-15, M-16 & Malam Jabba Road' },
    'bahrain / madyan': { distanceKm: 256, durationText: '4h 40m', durationMins: 280, viaHighway: 'M-15, M-16 & N-95 Highway' },
  },
  'karachi': {
    'mingora (swat central)': { distanceKm: 1680, durationText: '21h 30m', durationMins: 1290, viaHighway: 'M-5, M-4, M-2 & Swat Expressway M-16' },
    'kalam valley': { distanceKm: 1777, durationText: '24h 00m', durationMins: 1440, viaHighway: 'M-5, M-4, M-2, M-16 & N-95' },
    'malam jabba ski resort': { distanceKm: 1725, durationText: '22h 45m', durationMins: 1365, viaHighway: 'M-5, M-4, M-2, M-16 & Malam Jabba Road' },
    'bahrain / madyan': { distanceKm: 1741, durationText: '23h 00m', durationMins: 1380, viaHighway: 'M-5, M-4, M-2, M-16 & N-95' },
  },
};

// Swat Expressway Core Path (Rashakai Interchange M-1 -> Mingora Swat)
const SWAT_EXPRESSWAY_WAYPOINTS: [number, number][] = [
  [34.0955, 71.9774], // Rashakai Interchange (M-1 meets M-16 Swat Expressway)
  [34.1500, 71.9800], // Col. Sher Khan Interchange
  [34.2500, 72.0100], // Katlang Interchange
  [34.3800, 72.0400], // Bakhshali
  [34.5200, 71.9200], // Palai Twin Tunnels
  [34.6100, 71.9800], // Landakay Checkpost
  [34.6542, 72.0306], // Chakdara Interchange (End of Expressway M-16)
  [34.6764, 72.2356], // Barikot & Shamozai bridge into Swat Valley
  [34.7200, 72.2900], // Odigram
  [34.7717, 72.3602], // Mingora / Saidu Sharif (Central Swat)
];

// Swat Valley Upper Highway (Mingora -> Madyan -> Bahrain -> Kalam)
const MINGORA_TO_KALAM_WAYPOINTS: [number, number][] = [
  [34.7717, 72.3602], // Mingora
  [34.8050, 72.3850], // Fizagat Riverside Park
  [34.8350, 72.4350], // Charbagh
  [34.9215, 72.4630], // Khwazakhela
  [35.0400, 72.5000], // Fatehpur
  [35.1347, 72.5342], // Madyan Trout Valley
  [35.2064, 72.5539], // Bahrain Riverside
  [35.3200, 72.5600], // Mankial / Asrit
  [35.4800, 72.5800], // Kalam Valley
];

// Kalam to Mahodand Lake
const KALAM_TO_MAHODAND_WAYPOINTS: [number, number][] = [
  [35.4800, 72.5800], // Kalam
  [35.5333, 72.6333], // Ushu Forest
  [35.6100, 72.6400], // Matiltan Waterfall
  [35.7142, 72.6486], // Mahodand Alpine Lake
];

// Khwazakhela to Malam Jabba Ski Resort
const KHWAZAKHELA_TO_MALAM_JABBA: [number, number][] = [
  [34.9215, 72.4630], // Khwazakhela junction
  [34.8800, 72.5200], // Malam Jabba Road mountain ascent
  [34.7997, 72.5714], // Malam Jabba Ski Resort
];

// Highway legs from cities to Rashakai Interchange (M-16 start)
const ORIGIN_TO_RASHAKAI: Record<string, [number, number][]> = {
  'islamabad / rawalpindi': [
    [33.6844, 73.0479], // Islamabad Zero Point
    [33.6300, 72.8500], // Islamabad Toll Plaza M-1
    [33.8200, 72.6800], // Burhan Interchange
    [34.1200, 72.4600], // Swabi Interchange
    [34.0955, 71.9774], // Rashakai Interchange
  ],
  'peshawar': [
    [34.0151, 71.5249], // Peshawar Cantt
    [34.0300, 71.6800], // Peshawar Motorway Toll
    [34.0150, 71.9800], // Nowshera
    [34.0955, 71.9774], // Rashakai Interchange
  ],
  'lahore': [
    [31.5204, 74.3587], // Lahore Central
    [31.4700, 74.2400], // Thokar Niaz Baig M-2
    [31.7200, 73.9800], // Sheikhupura
    [32.0100, 73.4900], // Sukheke Service Area
    [32.7700, 72.7000], // Kallar Kahar Salt Range
    [33.6300, 72.8500], // Islamabad M-2/M-1 Junction
    [33.8200, 72.6800], // Burhan Interchange
    [34.1200, 72.4600], // Swabi Interchange
    [34.0955, 71.9774], // Rashakai Interchange
  ],
  'faisalabad': [
    [31.4504, 73.1350], // Faisalabad
    [31.8900, 73.2700], // Pindi Bhattian M-4 to M-2
    [32.7700, 72.7000], // Kallar Kahar
    [33.6300, 72.8500], // Islamabad Junction
    [33.8200, 72.6800], // Burhan
    [34.0955, 71.9774], // Rashakai
  ],
  'multan': [
    [30.1575, 71.5249], // Multan
    [30.5500, 72.1000], // Khanewal / Abdul Hakeem M-4
    [31.4504, 73.1350], // Faisalabad M-4
    [31.8900, 73.2700], // Pindi Bhattian M-2
    [33.6300, 72.8500], // Islamabad Junction
    [34.0955, 71.9774], // Rashakai
  ],
  'gujranwala / sialkot': [
    [32.1877, 74.1945], // Gujranwala / Sialkot
    [32.5700, 74.0700], // Gujrat / Chenab
    [32.9300, 73.7300], // Jhelum
    [33.5200, 73.1800], // Rawat / Islamabad
    [33.6300, 72.8500], // M-1 Junction
    [34.0955, 71.9774], // Rashakai
  ],
  'abbottabad / haripur': [
    [34.1688, 73.2215], // Abbottabad
    [33.9900, 72.9300], // Haripur M-15
    [33.8200, 72.6800], // Burhan / Hasan Abdal
    [34.1200, 72.4600], // Swabi
    [34.0955, 71.9774], // Rashakai
  ],
  'karachi': [
    [24.8607, 67.0011], // Karachi
    [25.3900, 68.3500], // Hyderabad M-9
    [27.7000, 68.8500], // Sukkur M-5
    [30.1575, 71.5249], // Multan M-5
    [31.8900, 73.2700], // Pindi Bhattian M-2
    [33.6300, 72.8500], // Islamabad Junction
    [34.0955, 71.9774], // Rashakai
  ],
};

function normalizeName(str: string): string {
  return str.trim().toLowerCase();
}

/**
 * Calculates accurate route details including:
 * - Origin & destination coordinates
 * - Total distance in kilometers (km)
 * - Expected travel duration text and minutes
 * - Highway corridor info
 * - Detailed highway waypoints polyline for Leaflet map highlighting
 */
export function calculateRouteDetails(
  originCityName: string,
  destinationInput: string | { lat: number; lng: number; title?: string }
): RouteDetails {
  // Normalize origin
  let matchedOrigin = 'Islamabad / Rawalpindi';
  const normOrigin = normalizeName(originCityName || '');
  for (const city of Object.keys(ORIGIN_CITY_COORDS)) {
    if (
      normOrigin.includes(normalizeName(city)) ||
      normalizeName(city).includes(normOrigin) ||
      (normOrigin.includes('islamabad') && city.includes('Islamabad')) ||
      (normOrigin.includes('rawalpindi') && city.includes('Rawalpindi'))
    ) {
      matchedOrigin = city;
      break;
    }
  }

  const originCoords: [number, number] = ORIGIN_CITY_COORDS[matchedOrigin] || [33.6844, 73.0479];

  // Normalize destination
  let destinationName = 'Mingora (Swat Central)';
  let destinationCoords: [number, number] = [34.7717, 72.3602];

  if (typeof destinationInput === 'string') {
    const normDest = normalizeName(destinationInput || '');
    for (const [key, coords] of Object.entries(SWAT_DESTINATION_COORDS)) {
      if (normDest.includes(normalizeName(key)) || normalizeName(key).includes(normDest)) {
        destinationName = key;
        destinationCoords = coords;
        break;
      }
    }
    if (!destinationName && destinationInput) {
      destinationName = destinationInput;
    }
  } else if (destinationInput && typeof destinationInput === 'object') {
    destinationCoords = [destinationInput.lat, destinationInput.lng];
    destinationName = destinationInput.title || 'Swat Destination';
  }

  // Check predefined route matrix
  const originKey = normalizeName(matchedOrigin);
  const destKey = normalizeName(destinationName);
  const matrixOrigin = ROUTE_MATRIX[originKey];
  let matrixMatch = matrixOrigin ? matrixOrigin[destKey] : undefined;

  // Fallback match by substring in matrix
  if (!matrixMatch && matrixOrigin) {
    for (const [k, meta] of Object.entries(matrixOrigin)) {
      if (destKey.includes(k) || k.includes(destKey)) {
        matrixMatch = meta;
        break;
      }
    }
  }

  let distanceKm = matrixMatch ? matrixMatch.distanceKm : 247;
  let durationText = matrixMatch ? matrixMatch.durationText : '3h 15m';
  let durationMins = matrixMatch ? matrixMatch.durationMins : 195;
  let viaHighway = matrixMatch ? matrixMatch.viaHighway : 'Swat Expressway M-16';

  // If no matrix match, estimate distance and time using geographic distance + road winding factor
  if (!matrixMatch) {
    const baseIslamabadDist = 247;
    // calculate haversine between Mingora and custom destination coords
    const mingoraCoords = SWAT_DESTINATION_COORDS['Mingora (Swat Central)'];
    const dLat = (destinationCoords[0] - mingoraCoords[0]) * (Math.PI / 180);
    const dLon = (destinationCoords[1] - mingoraCoords[1]) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(mingoraCoords[0] * (Math.PI / 180)) *
        Math.cos(destinationCoords[0] * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const localKm = Math.round(6371 * c * 1.35); // 1.35 mountain road winding factor

    // If origin is from matrix to Mingora, add local distance
    const mingoraRoute = matrixOrigin ? matrixOrigin['mingora (swat central)'] : null;
    const baseDist = mingoraRoute ? mingoraRoute.distanceKm : baseIslamabadDist;
    const baseMins = mingoraRoute ? mingoraRoute.durationMins : 195;

    distanceKm = baseDist + localKm;
    durationMins = baseMins + Math.round((localKm / 35) * 60); // 35 km/h avg in mountain valleys
    const hrs = Math.floor(durationMins / 60);
    const mins = durationMins % 60;
    durationText = `${hrs}h ${mins > 0 ? `${mins}m` : ''}`.trim();
    viaHighway = 'M-16 Expressway & Swat Valley Road';
  }

  // Construct Realistic Polyline Waypoints
  const waypoints: [number, number][] = [];

  // 1. Origin to Rashakai Interchange
  const originLeg = ORIGIN_TO_RASHAKAI[originKey] || ORIGIN_TO_RASHAKAI['islamabad / rawalpindi'];
  waypoints.push(...originLeg);

  // 2. Rashakai Interchange along M-16 Expressway to Mingora
  // Skip first point of expressway if already at Rashakai
  const expresswayLeg = SWAT_EXPRESSWAY_WAYPOINTS.slice(1);
  waypoints.push(...expresswayLeg);

  // 3. From Mingora to destination if destination is further up the valley
  const normDestLower = destKey;
  if (normDestLower.includes('kalam') || normDestLower.includes('ush') || normDestLower.includes('mahodand')) {
    // Upper valley towards Kalam
    waypoints.push(...MINGORA_TO_KALAM_WAYPOINTS.slice(1));
    if (normDestLower.includes('ush') || normDestLower.includes('mahodand')) {
      waypoints.push(...KALAM_TO_MAHODAND_WAYPOINTS.slice(1));
    }
  } else if (normDestLower.includes('malam jabba')) {
    // Branch at Khwazakhela towards Malam Jabba
    waypoints.push([34.8050, 72.3850]); // Fizagat
    waypoints.push([34.8350, 72.4350]); // Charbagh
    waypoints.push(...KHWAZAKHELA_TO_MALAM_JABBA);
  } else if (normDestLower.includes('bahrain') || normDestLower.includes('madyan')) {
    waypoints.push([34.8050, 72.3850]); // Fizagat
    waypoints.push([34.8350, 72.4350]); // Charbagh
    waypoints.push([34.9215, 72.4630]); // Khwazakhela
    waypoints.push([35.1347, 72.5342]); // Madyan
    if (normDestLower.includes('bahrain')) {
      waypoints.push([35.2064, 72.5539]); // Bahrain
    }
  }

  // Ensure destination coordinate is the final point if not already close
  const lastPoint = waypoints[waypoints.length - 1];
  const distToLast = Math.hypot(lastPoint[0] - destinationCoords[0], lastPoint[1] - destinationCoords[1]);
  if (distToLast > 0.01) {
    waypoints.push(destinationCoords);
  }

  return {
    originCity: matchedOrigin,
    originCoords,
    destinationCity: destinationName,
    destinationCoords,
    distanceKm,
    durationText,
    durationMins,
    viaHighway,
    waypoints,
  };
}
