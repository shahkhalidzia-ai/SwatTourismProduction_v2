import React, { useState, useEffect } from 'react';
import { UserManagementView } from './UserManagementView';
import { ThemeAppearanceSection } from '../../components/ThemeAppearanceSection';
import { Card } from '../../design/Card';
import { Button } from '../../design/Button';
import { Tag } from '../../design/Tag';
import { Chip } from '../../design/Chip';
import { DataTable } from '../../design/DataTable';
import type { Column } from '../../design/DataTable';
import {
  CheckCircle2,
  FileText,
  X,
  Eye,
  Check,
  RotateCcw,
  AlertTriangle,
  MapPin,
  PhoneCall,
  ShieldAlert,
  Plus,
  Compass,
  Shield,
  Store,
  Bed,
  Coffee,
  Car,
  Users,
  ShoppingBag,
  Sparkles,
  Search,
  Building2,
  Phone,
  User,
  Waves,
} from 'lucide-react';
import {
  fetchAuthorityAllListings,
  type ListingItem,
  type ListingTypeCode,
} from '../../api/listings';
import {
  fetchApprovalsQueue,
  decideVerification,
  type ApprovalQueueItem,
  type VerificationStatusCode,
} from '../../api/verification';
import {
  fetchAllAdvisories,
  createAdvisory,
  updateAdvisory,
  fetchRoadStatuses,
  createRoadStatus,
  updateRoadStatus,
  fetchAllSOSEvents,
  actOnSOS,
  type Advisory,
  type RoadStatus,
  type SOSEvent,
  type AdvisoryCategory,
  type AdvisorySeverity,
  type RoadConditionStatus,
  type SOSStatus,
} from '../../api/safety';
import { getAreas, type Area } from '../../api/trips';
import {
  fetchAllReports,
  updateReportStatus,
  fetchAllHostApplications,
  reviewHostApplication,
  getStoredHostApplications,
  updateStoredHostApplication,
  SWAT_COMMUNITY_APPS_EVENT,
  type IssueReport,
  type IssueStatus,
  type HostApplication,
} from '../../api/community';

interface AuthorityShellProps {
  activeTab: string;
  isMobile?: boolean;
  subTab?: string;
  onTabChange?: (tab: string) => void;
}

const DEFAULT_DEMO_APPROVALS: ApprovalQueueItem[] = [
  {
    business_id: 'b-ali-khan',
    business_name: 'Ali Khan Alpine Mountain Guide',
    primary_type: 'guide',
    registration_no: 'KP-TOUR-992',
    contact_phone: '0300-8877665',
    whatsapp_number: '0300-8877665',
    address_text: 'Main Kalam Bazaar, Kalam',
    owner_name: 'Ali Khan',
    owner_email: 'ali.guide@swat.pk',
    verification_status: 'pending',
    documents: [
      {
        id: 'doc-1',
        business_id: 'b-ali-khan',
        doc_type: 'license',
        file_url: '/uploads/documents/sample_guide_license.pdf',
        status: 'pending',
        created_at: '2026-10-01T10:00:00Z',
      },
      {
        id: 'doc-2',
        business_id: 'b-ali-khan',
        doc_type: 'identity_copy',
        file_url: '/uploads/documents/sample_cnic.jpg',
        status: 'pending',
        created_at: '2026-10-01T10:05:00Z',
      },
    ],
    pending_listings_count: 1,
    submitted_at: '2026-10-01T10:10:00Z',
  },
  {
    business_id: 'b-swat-gem',
    business_name: 'Swat Heritage Gem House',
    primary_type: 'shop',
    registration_no: 'SWT-COM-441',
    contact_phone: '0345-1122334',
    whatsapp_number: '0345-1122334',
    address_text: 'Main Fiza Ghat Road, Mingora',
    owner_name: 'Shahab Ud Din',
    owner_email: 'shahab.crafts@gmail.com',
    verification_status: 'verified',
    documents: [
      {
        id: 'doc-3',
        business_id: 'b-swat-gem',
        doc_type: 'registration',
        file_url: '/uploads/documents/sample_shop_reg.pdf',
        status: 'approved',
        created_at: '2026-09-28T09:00:00Z',
      },
    ],
    pending_listings_count: 0,
    submitted_at: '2026-09-28T09:30:00Z',
  },
];

const DEFAULT_DEMO_ADVISORIES: Advisory[] = [
  {
    id: 'adv-demo-1',
    author_id: 'auth-user-1',
    title: 'Malam Jabba Snow & Frost Alert',
    message: 'Snow chains required beyond Bahrain. High winds reported on chairlift routes.',
    category: 'weather',
    severity: 'warning',
    area_name: 'Malam Jabba',
    starts_at: new Date().toISOString(),
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'adv-demo-2',
    author_id: 'auth-user-1',
    title: 'Swat River High Water Warning',
    message: 'Increased seasonal runoff near Fizaghat park bank. Riverside camping strictly restricted.',
    category: 'flood',
    severity: 'danger',
    area_name: 'Mingora',
    starts_at: new Date().toISOString(),
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_DEMO_ROADS: RoadStatus[] = [
  {
    id: 'road-demo-1',
    road_name: 'Mingora to Kalam Highway (N-95)',
    status: 'open',
    vehicle_note: 'All vehicle types permitted',
    reason: 'Road clear and operational',
    source: 'authority',
    is_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'road-demo-2',
    road_name: 'Kalam to Mahodand Lake Track',
    status: 'limited',
    vehicle_note: '4x4 Only, tire chains recommended',
    reason: 'Glacial water run-off and mud near Matiltan',
    source: 'authority',
    is_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_DEMO_SOS: SOSEvent[] = [
  {
    id: 'sos-demo-1',
    tourist_id: 'tourist-user-1',
    tourist_name: 'Zeeshan Khan',
    tourist_phone: '+923001234567',
    latitude: 35.4851,
    longitude: 72.5852,
    accuracy_m: 8,
    message: 'Car tire punctured on unpaved stretch near Ushu forest. Low cell coverage.',
    status: 'new',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sos-demo-2',
    tourist_id: 'tourist-user-2',
    tourist_name: 'Ayesha Malik',
    tourist_phone: '+923339876543',
    latitude: 35.1347,
    longitude: 72.5342,
    accuracy_m: 12,
    message: 'Hiker with sprained ankle near Madyan river trail. Accompanied by guide.',
    status: 'acknowledged',
    acknowledged_by_name: 'District Control Officer',
    acknowledged_at: new Date().toISOString(),
    resolution_note: 'Dispatched Madyan 1122 basic life support unit.',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_DEMO_REPORTS: IssueReport[] = [
  {
    id: 'rep-demo-1',
    reporter_id: 'user-tourist-1',
    reporter_name: 'Zeeshan Khan',
    reporter_phone: '0300-1234567',
    category: 'road_blocked',
    title: 'Landslide partially blocking one lane',
    description: 'Debris from recent rainfall obstructing traffic near Ushu forest turn. Vehicles alternating single lane.',
    area_name: 'Kalam',
    latitude: 35.498,
    longitude: 72.583,
    status: 'new',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'rep-demo-2',
    reporter_id: 'user-tourist-2',
    reporter_name: 'Amina Tariq',
    reporter_phone: '0312-9876543',
    category: 'litter',
    title: 'Overflowing bins at Bahrain Riverside park',
    description: 'Tourist waste accumulating near the river walkway picnic spot. Needs municipal clearing.',
    area_name: 'Bahrain',
    latitude: 35.132,
    longitude: 72.529,
    status: 'assigned',
    assignee_name: 'Bahrain TMA Team',
    resolution_note: 'Sanitation unit dispatched for afternoon clearance.',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'rep-demo-3',
    reporter_id: 'user-tourist-3',
    reporter_name: 'Bilal Ahmad',
    reporter_phone: '0333-5551212',
    category: 'overcharging',
    title: 'Excessive parking fee demanded at Mahodand entry',
    description: 'Private operator charging PKR 1,000 for standard car parking without official municipal ticket receipt.',
    area_name: 'Matiltan',
    latitude: 35.534,
    longitude: 72.612,
    status: 'resolved',
    assignee_name: 'District Tourism Inspector',
    resolution_note: 'Enforcement unit visited site. Operator penalized and standard rates enforced.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_DEMO_DIRECTORY_LISTINGS: ListingItem[] = [
  {
    id: 'listing-serena-hotel',
    business_id: 'biz-hotel-1',
    business_name: 'Swat Serena Hotel',
    type_id: 'type-hotel',
    type_code: 'hotel',
    type_label: 'Luxury Heritage Hotel & Resort',
    area_id: 'area-mingora',
    area_name: 'Saidu Sharif / Mingora',
    title: 'Swat Serena Hotel',
    description: 'Premier heritage luxury hotel with royal architecture, lush rose gardens, heated rooms, and authentic Swati hospitality.',
    address_text: 'Saidu Sharif Road, Mingora, Swat Valley',
    latitude: 34.752,
    longitude: 72.358,
    phone: '+92-946-710201',
    whatsapp_number: '+92-946-710201',
    opening_time: '14:00',
    closing_time: '12:00',
    status: 'published',
    is_verified: true,
    rating_avg: 4.9,
    rating_count: 142,
    details: {
      facilities: ['High-Speed Wi-Fi', 'Room Heating & Climate Comfort', '24/7 Running Hot Water', '24/7 Power Backup / Generator', 'Secure Private Car Parking', 'In-House Riverside Restaurant'],
      activities: [
        { name: 'Fresh River Trout Fishing Excursion', price: 1500, duration: '2 Hours', description: 'Catch river trout with fishing gear & guide.' },
        { name: 'Evening Garden Bonfire & Musical Night', price: 0, duration: '3 Hours', description: 'Nightly gathering under starlit skies.' },
      ],
      check_in_time: '14:00',
      check_out_time: '12:00',
    },
    price_items: [
      { id: 'p1', name: 'Executive Deluxe Room', price: 18500, unit: 'per_night', capacity: 2, default_units: 12, is_bookable: true },
      { id: 'p2', name: 'Heritage Presidential Suite', price: 42000, unit: 'per_night', capacity: 4, default_units: 3, is_bookable: true },
      { id: 'p3', name: 'Standard Twin Room', price: 12000, unit: 'per_night', capacity: 2, default_units: 8, is_bookable: true },
    ],
    media: [
      { id: 'm1', owner_type: 'listing', owner_id: 'listing-serena-hotel', url: '/images/serena_hotel_swat.jpg', media_type: 'image', sort_order: 1, created_at: new Date().toISOString() },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'listing-riverside-inn',
    business_id: 'biz-riverside',
    business_name: 'Riverside Inn, Madyan',
    type_id: 'type-hotel',
    type_code: 'hotel',
    type_label: 'Riverside Lodge & Stay',
    area_id: 'area-madyan',
    area_name: 'Madyan',
    title: 'Riverside Inn, Madyan',
    description: 'Scenic hotel right over the rushing Swat River with wooden river-view balconies and family suites.',
    address_text: 'River Promenade, Madyan Valley',
    latitude: 35.132,
    longitude: 72.531,
    phone: '+92-300-9871122',
    whatsapp_number: '+92-300-9871122',
    opening_time: '13:00',
    closing_time: '11:00',
    status: 'published',
    is_verified: true,
    rating_avg: 4.7,
    rating_count: 88,
    details: {
      facilities: ['Free Wi-Fi', '24/7 Hot Water', 'Power Backup', 'Riverside Deck', 'Trout Dining'],
    },
    price_items: [
      { id: 'r1', name: 'Deluxe River View Room', price: 8500, unit: 'per_night', capacity: 2, default_units: 10, is_bookable: true },
      { id: 'r2', name: 'Riverside Family Suite', price: 14000, unit: 'per_night', capacity: 5, default_units: 4, is_bookable: true },
    ],
    media: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'listing-kalam-alpine',
    business_id: 'biz-alpine',
    business_name: 'Kalam Alpine Lodge & Suites',
    type_id: 'type-hotel',
    type_code: 'hotel',
    type_label: 'Alpine Mountain Resort',
    area_id: 'area-kalam',
    area_name: 'Kalam Valley',
    title: 'Kalam Alpine Lodge & Suites',
    description: 'Pine-wood alpine resort overlooking Ushu forest and snow-capped peaks in upper Kalam.',
    address_text: 'Upper Kalam Hilltop, Kalam',
    latitude: 35.491,
    longitude: 72.589,
    phone: '+92-333-8899001',
    whatsapp_number: '+92-333-8899001',
    status: 'published',
    is_verified: true,
    rating_avg: 4.8,
    rating_count: 110,
    details: {
      facilities: ['Mountain Balcony', 'Central Heating', '24/7 Hot Water', 'Bonfire Pit'],
    },
    price_items: [
      { id: 'ka1', name: 'Pine View Master Room', price: 11000, unit: 'per_night', capacity: 2, default_units: 8, is_bookable: true },
      { id: 'ka2', name: 'Alpine Panoramic Suite', price: 18000, unit: 'per_night', capacity: 4, default_units: 4, is_bookable: true },
    ],
    media: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'listing-malam-resort',
    business_id: 'biz-malam-resort',
    business_name: 'Malam Jabba Ski Resort & Stays',
    type_id: 'type-hotel',
    type_code: 'hotel',
    type_label: 'Ski & Adventure Resort',
    area_id: 'area-malam-jabba',
    area_name: 'Malam Jabba',
    title: 'Malam Jabba Ski Resort & Stays',
    description: 'Slope-side luxury resort next to the chairlift and ski trails with full winter gear support.',
    address_text: 'Chairlift Base Station, Malam Jabba',
    latitude: 34.801,
    longitude: 72.571,
    phone: '+92-946-880011',
    status: 'published',
    is_verified: true,
    rating_avg: 4.9,
    rating_count: 205,
    details: {
      facilities: ['Ski-In/Ski-Out', 'Heated Rooms', 'Fine Dining Restaurant', 'Sauna'],
    },
    price_items: [
      { id: 'mj1', name: 'Snow Valley Room', price: 16500, unit: 'per_night', capacity: 2, default_units: 14, is_bookable: true },
      { id: 'mj2', name: 'Ski Chalet Suite', price: 32000, unit: 'per_night', capacity: 4, default_units: 5, is_bookable: true },
    ],
    media: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'listing-riverside-trout',
    business_id: 'biz-trout-corner',
    business_name: 'Riverside Trout Corner',
    type_id: 'type-restaurant',
    type_code: 'restaurant',
    type_label: 'Restaurant & Trout Fry',
    area_id: 'area-madyan',
    area_name: 'Madyan',
    title: 'Riverside Trout Corner',
    description: 'Fresh live river trout char-grilled and pan-fried with traditional Swati spices, tandoori bread, and mint chutney.',
    address_text: 'Main Trout Hatchery Road, Madyan',
    latitude: 35.136,
    longitude: 72.536,
    phone: '+92-345-7766554',
    status: 'published',
    is_verified: true,
    rating_avg: 4.8,
    rating_count: 95,
    details: { facilities: ['Live Trout Tanks', 'Family Hall', 'River Dining Deck'] },
    price_items: [
      { id: 't1', name: 'Whole Grilled Trout (1 KG)', price: 2400, unit: 'per_item', default_units: 50, is_bookable: false },
      { id: 't2', name: 'Crispy Fried Trout Fillet', price: 1400, unit: 'per_item', default_units: 40, is_bookable: false },
    ],
    media: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'listing-kalam-jeep',
    business_id: 'biz-kalam-jeep',
    business_name: 'Kalam 4x4 Mountain Jeep Safari',
    type_id: 'type-transport',
    type_code: 'transport',
    type_label: '4x4 Mountain Transport',
    area_id: 'area-kalam',
    area_name: 'Kalam Valley',
    title: 'Kalam 4x4 Mountain Jeep Safari',
    description: 'Robust modified 4x4 Willy & Prado jeeps with seasoned mountain drivers for Mahodand Lake, Ushu Forest, and Saifullah Lake tracks.',
    address_text: 'Kalam Jeep Stand, Main Chowk, Kalam',
    latitude: 35.483,
    longitude: 72.582,
    phone: '+92-301-4455667',
    status: 'published',
    is_verified: true,
    rating_avg: 4.9,
    rating_count: 76,
    details: { facilities: ['Experienced Mountain Driver', 'Spare Tires & Winch', 'Roof Luggage Carrier'] },
    price_items: [
      { id: 'j1', name: 'Mahodand Lake Day Trip (Return)', price: 12000, unit: 'per_trip', capacity: 6, default_units: 15, is_bookable: true },
      { id: 'j2', name: 'Ushu & Matiltan Valley Tour', price: 7000, unit: 'per_trip', capacity: 6, default_units: 15, is_bookable: true },
    ],
    media: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'listing-ali-guide',
    business_id: 'b-ali-khan',
    business_name: 'Ali Khan Alpine Mountain Guide',
    type_id: 'type-guide',
    type_code: 'guide',
    type_label: 'Licensed Mountain Trekking Guide',
    area_id: 'area-kalam',
    area_name: 'Kalam Valley',
    title: 'Ali Khan Alpine Mountain Guide',
    description: 'Certified alpine mountain guide with 14 years experience across Kandol Lake, Spin Khwar, and high-altitude Swat passes.',
    address_text: 'Main Kalam Bazaar, Kalam',
    latitude: 35.485,
    longitude: 72.584,
    phone: '0300-8877665',
    status: 'published',
    is_verified: true,
    rating_avg: 5.0,
    rating_count: 64,
    details: { facilities: ['First Aid Certified', 'English/Urdu/Pashto Fluent', 'Camping Gear Equipment'] },
    price_items: [
      { id: 'g1', name: 'Full-Day Mountain Trekking Guide', price: 4500, unit: 'per_day', capacity: 10, default_units: 1, is_bookable: true },
    ],
    media: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'listing-rafting-madyan',
    business_id: 'biz-rafting',
    business_name: 'Swat River White Water Rafting',
    type_id: 'type-activity',
    type_code: 'activity',
    type_label: 'White Water River Rafting',
    area_id: 'area-madyan',
    area_name: 'Madyan',
    title: 'Swat River White Water Rafting',
    description: 'Thrilling grade 2 & 3 white-water rafting adventures on the crystal waters of Swat River with certified safety rescue marshals.',
    address_text: 'Rafting Launch Point, Madyan Riverbank',
    latitude: 35.129,
    longitude: 72.527,
    phone: '+92-313-9988776',
    status: 'published',
    is_verified: true,
    rating_avg: 4.9,
    rating_count: 53,
    details: { facilities: ['CE-Certified Life Jackets & Helmets', 'Rescue Kayaker Support', 'GoPro Footage Available'] },
    price_items: [
      { id: 'act1', name: 'Standard Rafting Course (5 KM)', price: 3000, unit: 'per_person', capacity: 8, default_units: 6, is_bookable: true },
    ],
    media: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'listing-kalam-crafts',
    business_id: 'biz-crafts',
    business_name: 'Kalam Traditional Handicrafts & Shawls',
    type_id: 'type-shop',
    type_code: 'shop',
    type_label: 'Local Artisan Crafts & Shawls',
    area_id: 'area-kalam',
    area_name: 'Kalam Valley',
    title: 'Kalam Traditional Handicrafts & Shawls',
    description: 'Authentic handmade Swati woolen pashmina shawls, walnut wood carved tables, and indigenous woven rugs.',
    address_text: 'Main Bazar, Kalam',
    latitude: 35.486,
    longitude: 72.583,
    phone: '+92-305-6677889',
    status: 'published',
    is_verified: true,
    rating_avg: 4.8,
    rating_count: 39,
    details: { facilities: ['Authentic Handmade Guarantee', 'All-Pakistan Courier Shipping', 'Debit/Credit Cards Accepted'] },
    price_items: [
      { id: 's1', name: 'Hand-Embroidered Swati Wool Shawl', price: 6500, unit: 'per_item', default_units: 25, is_bookable: false },
      { id: 's2', name: 'Carved Walnut Wood Honey Box', price: 2200, unit: 'per_item', default_units: 30, is_bookable: false },
    ],
    media: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const AuthorityShell: React.FC<AuthorityShellProps> = ({ activeTab, isMobile = false, subTab, onTabChange }) => {
  // Verification Queue State
  const [approvals, setApprovals] = useState<ApprovalQueueItem[]>(DEFAULT_DEMO_APPROVALS);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [inspectingItem, setInspectingItem] = useState<ApprovalQueueItem | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [isAskingChanges, setIsAskingChanges] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Community Offerings & Local Services Queue State
  const [approvalSubTab, setApprovalSubTab] = useState<'business' | 'community'>('business');
  const [communityApplications, setCommunityApplications] = useState<HostApplication[]>(getStoredHostApplications());
  const [communityFilter, setCommunityFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [communitySearch, setCommunitySearch] = useState<string>('');

  // Safety & Advisories State
  const [advisories, setAdvisories] = useState<Advisory[]>(DEFAULT_DEMO_ADVISORIES);
  const [roadStatuses, setRoadStatuses] = useState<RoadStatus[]>(DEFAULT_DEMO_ROADS);
  const [sosEvents, setSosEvents] = useState<SOSEvent[]>(DEFAULT_DEMO_SOS);
  const [reports, setReports] = useState<IssueReport[]>(DEFAULT_DEMO_REPORTS);
  const [areas, setAreas] = useState<Area[]>([]);

  // Filtering & Cases Sub-tab
  const [advisoryFilter, setAdvisoryFilter] = useState<string>('all');
  const [sosFilter, setSosFilter] = useState<string>('all');
  const [casesSubTab, setCasesSubTab] = useState<'sos' | 'reports'>(
    subTab === 'reports' ? 'reports' : 'sos'
  );
  const [reportFilter, setReportFilter] = useState<string>('all');

  useEffect(() => {
    if (subTab === 'reports' || subTab === 'sos') {
      setCasesSubTab(subTab);
    }
  }, [subTab]);

  // Directory State
  const [directoryListings, setDirectoryListings] = useState<ListingItem[]>(DEFAULT_DEMO_DIRECTORY_LISTINGS);
  const [directoryFilter, setDirectoryFilter] = useState<string>('all');
  const [directoryAreaId, setDirectoryAreaId] = useState<string>('');
  const [directorySearch, setDirectorySearch] = useState<string>('');
  const [inspectingListing, setInspectingListing] = useState<ListingItem | null>(null);

  // Report Action Modal State
  const [activeReportAction, setActiveReportAction] = useState<{
    report: IssueReport;
    targetStatus: IssueStatus;
  } | null>(null);
  const [reportActionNote, setReportActionNote] = useState('');

  // Advisory Modal State
  const [isCreateAdvisoryOpen, setIsCreateAdvisoryOpen] = useState(false);
  const [newAdvisory, setNewAdvisory] = useState<{
    title: string;
    message: string;
    category: AdvisoryCategory;
    severity: AdvisorySeverity;
    area_id: string;
    expires_at: string;
    status: 'published' | 'draft';
  }>({
    title: '',
    message: '',
    category: 'weather',
    severity: 'info',
    area_id: '',
    expires_at: '',
    status: 'published',
  });

  // Road Modal State
  const [isRoadModalOpen, setIsRoadModalOpen] = useState(false);
  const [editingRoadId, setEditingRoadId] = useState<string | null>(null);
  const [newRoad, setNewRoad] = useState<{
    road_name: string;
    status: RoadConditionStatus;
    vehicle_note: string;
    reason: string;
  }>({
    road_name: '',
    status: 'open',
    vehicle_note: '',
    reason: '',
  });

  // SOS Action Modal State
  const [activeSosAction, setActiveSosAction] = useState<{
    event: SOSEvent;
    targetStatus: SOSStatus;
  } | null>(null);
  const [sosActionNote, setSosActionNote] = useState('');

  // Initial Data Fetch
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [queue, advs, roads, cases, areasList, reportsList, dirListings, hostApps] = await Promise.all([
          fetchApprovalsQueue().catch(() => []),
          fetchAllAdvisories().catch(() => []),
          fetchRoadStatuses().catch(() => []),
          fetchAllSOSEvents().catch(() => []),
          getAreas().catch(() => []),
          fetchAllReports().catch(() => []),
          fetchAuthorityAllListings().catch(() => []),
          fetchAllHostApplications().catch(() => []),
        ]);
        if (isMounted) {
          if (queue && queue.length > 0) setApprovals(queue);
          if (advs && advs.length > 0) setAdvisories(advs);
          if (roads && roads.length > 0) {
            setRoadStatuses((prev) => {
              const roadIds = new Set(roads.map((r) => r.id));
              const localAdditions = prev.filter((r) => !roadIds.has(r.id));
              return [...localAdditions, ...roads];
            });
          }
          if (cases && cases.length > 0) setSosEvents(cases);
          if (areasList && areasList.length > 0) setAreas(areasList);
          if (reportsList && reportsList.length > 0) setReports(reportsList);
          if (dirListings && dirListings.length > 0) setDirectoryListings(dirListings);

          const stored = getStoredHostApplications();
          if (hostApps && hostApps.length > 0) {
            const serverIds = new Set(hostApps.map((h) => h.id));
            const localOnly = stored.filter((s) => !serverIds.has(s.id));
            setCommunityApplications([...localOnly, ...hostApps]);
          } else {
            setCommunityApplications(stored);
          }
        }
      } catch {
        // Fall back gracefully to demo data
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync community applications in real-time
  useEffect(() => {
    const handleAppsUpdate = () => {
      setCommunityApplications(getStoredHostApplications());
    };
    window.addEventListener(SWAT_COMMUNITY_APPS_EVENT, handleAppsUpdate);
    window.addEventListener('storage', handleAppsUpdate);
    return () => {
      window.removeEventListener(SWAT_COMMUNITY_APPS_EVENT, handleAppsUpdate);
      window.removeEventListener('storage', handleAppsUpdate);
    };
  }, []);

  // Re-fetch directory and approvals when tabs are selected
  useEffect(() => {
    if (activeTab === 'directory') {
      fetchAuthorityAllListings()
        .then((res) => {
          if (res && res.length > 0) setDirectoryListings(res);
        })
        .catch(() => {});
      fetchApprovalsQueue()
        .then((res) => {
          if (res && res.length > 0) setApprovals(res);
        })
        .catch(() => {});
    }
    if (activeTab === 'approvals' || activeTab === 'overview') {
      fetchApprovalsQueue()
        .then((res) => {
          if (res && res.length > 0) setApprovals(res);
        })
        .catch(() => {});
      fetchAllHostApplications()
        .then((res) => {
          if (res && res.length > 0) {
            const stored = getStoredHostApplications();
            const serverIds = new Set(res.map((r) => r.id));
            const localOnly = stored.filter((s) => !serverIds.has(s.id));
            setCommunityApplications([...localOnly, ...res]);
          }
        })
        .catch(() => {});
    }
  }, [activeTab]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ---------------------------------------------------------------------------
  // Community Services Review Handler
  // ---------------------------------------------------------------------------
  const handleReviewCommunityApp = async (appId: string, decision: 'approved' | 'rejected', notes?: string) => {
    try {
      await reviewHostApplication(appId, decision, notes);
    } catch {}
    updateStoredHostApplication(appId, decision, notes);
    setCommunityApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: decision, reviewed_at: new Date().toISOString() } : a))
    );
    showToast(
      decision === 'approved'
        ? 'Verified & Published to Tourists!'
        : 'Community offering status updated.'
    );
    window.dispatchEvent(new CustomEvent('swat_explore_services_updated'));
  };

  // ---------------------------------------------------------------------------
  // Verification Handlers
  // ---------------------------------------------------------------------------
  const handleDecision = async (businessId: string, decision: 'approved' | 'rejected', note?: string) => {
    try {
      await decideVerification(businessId, decision, note);
    } catch {
      // Local fallback for smooth demo
    }

    setApprovals((prev) =>
      prev.map((item) =>
        item.business_id === businessId
          ? {
              ...item,
              verification_status: (decision === 'approved' ? 'verified' : 'rejected') as VerificationStatusCode,
              rejection_reason: decision === 'rejected' ? note : undefined,
              pending_listings_count: decision === 'approved' ? 0 : item.pending_listings_count,
            }
          : item
      )
    );

    setInspectingItem(null);
    setIsAskingChanges(false);
    setRejectionNote('');
    showToast(
      decision === 'approved'
        ? 'Business approved! Pending listings are now verified and published to tourists.'
        : 'Changes requested. Feedback sent to business.'
    );
  };

  const filteredApprovals = approvals.filter((item) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'pending') return item.verification_status === 'pending' || item.verification_status === 'unverified';
    if (selectedFilter === 'unverified') return item.verification_status === 'unverified';
    if (selectedFilter === 'verified') return item.verification_status === 'verified';
    if (selectedFilter === 'rejected') return item.verification_status === 'rejected';
    return true;
  });

  const approvalColumns: Column<ApprovalQueueItem>[] = [
    { key: 'business_name', header: 'Business / Guide', sortable: true },
    {
      key: 'primary_type',
      header: 'Category',
      render: (item) => (
        <span style={{ textTransform: 'capitalize' }}>{item.primary_type}</span>
      ),
    },
    { key: 'owner_name', header: 'Applicant' },
    {
      key: 'documents',
      header: 'Documents',
      render: (item) => (
        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
          {item.documents.length} uploaded
        </span>
      ),
    },
    {
      key: 'verification_status',
      header: 'Status',
      render: (item) => (
        <Tag
          variant={
            item.verification_status === 'verified'
              ? 'ok'
              : item.verification_status === 'pending'
              ? 'accent'
              : 'bad'
          }
        >
          {item.verification_status}
        </Tag>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={<Eye size={12} />}
            onClick={() => setInspectingItem(item)}
            data-testid={`btn-inspect-${item.business_id}`}
          >
            Review
          </Button>
          {(item.verification_status === 'pending' || item.verification_status === 'unverified') && (
            <Button
              variant="primary"
              size="sm"
              icon={<Check size={12} />}
              onClick={() => handleDecision(item.business_id, 'approved', 'Verified by Tourism Department')}
              data-testid={`btn-quick-approve-${item.business_id}`}
            >
              Approve
            </Button>
          )}
        </div>
      ),
    },
  ];

  // ---------------------------------------------------------------------------
  // Advisories Handlers
  // ---------------------------------------------------------------------------
  const handleCreateAdvisory = async () => {
    if (!newAdvisory.title.trim() || !newAdvisory.message.trim()) {
      alert('Please fill out the advisory title and message.');
      return;
    }

    try {
      const created = await createAdvisory({
        title: newAdvisory.title,
        message: newAdvisory.message,
        category: newAdvisory.category,
        severity: newAdvisory.severity,
        area_id: newAdvisory.area_id || undefined,
        status: newAdvisory.status,
        expires_at: newAdvisory.expires_at ? new Date(newAdvisory.expires_at).toISOString() : undefined,
      });
      setAdvisories((prev) => [created, ...prev]);
    } catch {
      // Local fallback for smooth demo
      const selectedArea = areas.find((a) => a.id === newAdvisory.area_id);
      const fallbackAdv: Advisory = {
        id: 'adv-' + Date.now(),
        author_id: 'auth-user-current',
        title: newAdvisory.title,
        message: newAdvisory.message,
        category: newAdvisory.category,
        severity: newAdvisory.severity,
        area_id: newAdvisory.area_id || undefined,
        area_name: selectedArea ? selectedArea.name : undefined,
        starts_at: new Date().toISOString(),
        expires_at: newAdvisory.expires_at || undefined,
        status: newAdvisory.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setAdvisories((prev) => [fallbackAdv, ...prev]);
    }

    setIsCreateAdvisoryOpen(false);
    setNewAdvisory({
      title: '',
      message: '',
      category: 'weather',
      severity: 'info',
      area_id: '',
      expires_at: '',
      status: 'published',
    });
    showToast('Advisory successfully published and broadcast to tourists!');
  };

  const handleWithdrawAdvisory = async (advisoryId: string) => {
    try {
      await updateAdvisory(advisoryId, { status: 'withdrawn' });
    } catch {
      // Local fallback
    }
    setAdvisories((prev) =>
      prev.map((a) => (a.id === advisoryId ? { ...a, status: 'withdrawn' } : a))
    );
    showToast('Advisory withdrawn and archived.');
  };

  const filteredAdvisories = advisories.filter((a) => {
    if (advisoryFilter === 'all') return true;
    return a.status === advisoryFilter;
  });

  const advisoryColumns: Column<Advisory>[] = [
    { key: 'title', header: 'Title & Summary', sortable: true },
    {
      key: 'area_name',
      header: 'Valley Area',
      sortable: true,
      render: (item) => <span>{item.area_name || 'All Swat Valley'}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      render: (item) => <Tag variant="soft">{item.category}</Tag>,
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (item) => (
        <Tag
          variant={
            item.severity === 'danger'
              ? 'bad'
              : item.severity === 'warning'
              ? 'accent'
              : 'pri'
          }
        >
          {item.severity.toUpperCase()}
        </Tag>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Tag
          variant={
            item.status === 'published'
              ? 'ok'
              : item.status === 'draft'
              ? 'accent'
              : 'neutral'
          }
        >
          {item.status}
        </Tag>
      ),
    },
    {
      key: 'created_at',
      header: 'Date',
      render: (item) => (
        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
          {new Date(item.starts_at || item.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          {item.status !== 'withdrawn' && (
            <Button
              variant="soft"
              size="sm"
              onClick={() => handleWithdrawAdvisory(item.id)}
              data-testid={`btn-withdraw-${item.id}`}
            >
              Withdraw
            </Button>
          )}
        </div>
      ),
    },
  ];

  // ---------------------------------------------------------------------------
  // Road Status Handlers
  // ---------------------------------------------------------------------------
  const handleSaveRoadStatus = async () => {
    if (!newRoad.road_name.trim()) {
      alert('Please enter route name.');
      return;
    }

    if (editingRoadId) {
      try {
        await updateRoadStatus(editingRoadId, {
          status: newRoad.status,
          vehicle_note: newRoad.vehicle_note || undefined,
          reason: newRoad.reason || undefined,
        });
      } catch {
        // Local fallback
      }
      setRoadStatuses((prev) =>
        prev.map((r) =>
          r.id === editingRoadId
            ? {
                ...r,
                status: newRoad.status,
                vehicle_note: newRoad.vehicle_note,
                reason: newRoad.reason,
              }
            : r
        )
      );
      showToast('Road condition successfully updated.');
    } else {
      try {
        const created = await createRoadStatus({
          road_name: newRoad.road_name,
          status: newRoad.status,
          vehicle_note: newRoad.vehicle_note || undefined,
          reason: newRoad.reason || undefined,
        });
        setRoadStatuses((prev) => [created, ...prev]);
      } catch {
        const fallbackRoad: RoadStatus = {
          id: 'road-' + Date.now(),
          road_name: newRoad.road_name,
          status: newRoad.status,
          vehicle_note: newRoad.vehicle_note,
          reason: newRoad.reason,
          source: 'authority',
          is_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setRoadStatuses((prev) => [fallbackRoad, ...prev]);
      }
      showToast('New road condition entry recorded.');
    }

    setIsRoadModalOpen(false);
    setEditingRoadId(null);
    setNewRoad({
      road_name: '',
      status: 'open',
      vehicle_note: '',
      reason: '',
    });
  };

  const roadColumns: Column<RoadStatus>[] = [
    { key: 'road_name', header: 'Route / Pass', sortable: true },
    {
      key: 'status',
      header: 'Condition',
      render: (item) => (
        <Tag
          variant={
            item.status === 'open'
              ? 'ok'
              : item.status === 'limited'
              ? 'accent'
              : 'bad'
          }
        >
          {item.status.toUpperCase()}
        </Tag>
      ),
    },
    {
      key: 'vehicle_note',
      header: 'Vehicle Requirement',
      render: (item) => (
        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--ink)' }}>
          {item.vehicle_note || 'All Vehicles'}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Details & Note',
      render: (item) => (
        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
          {item.reason || '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setEditingRoadId(item.id);
            setNewRoad({
              road_name: item.road_name,
              status: item.status,
              vehicle_note: item.vehicle_note || '',
              reason: item.reason || '',
            });
            setIsRoadModalOpen(true);
          }}
          data-testid={`btn-edit-road-${item.id}`}
        >
          Update
        </Button>
      ),
    },
  ];

  // ---------------------------------------------------------------------------
  // Cases / SOS Emergency Handlers
  // ---------------------------------------------------------------------------
  const handleConfirmSosAction = async () => {
    if (!activeSosAction) return;
    const { event, targetStatus } = activeSosAction;

    try {
      await actOnSOS(event.id, targetStatus, sosActionNote || undefined);
    } catch {
      // Local fallback
    }

    setSosEvents((prev) =>
      prev.map((c) =>
        c.id === event.id
          ? {
              ...c,
              status: targetStatus,
              acknowledged_by_name:
                targetStatus === 'acknowledged' || targetStatus === 'responding'
                  ? 'District Control Officer'
                  : c.acknowledged_by_name,
              acknowledged_at:
                targetStatus === 'acknowledged' ? new Date().toISOString() : c.acknowledged_at,
              resolved_at:
                targetStatus === 'resolved' ? new Date().toISOString() : c.resolved_at,
              resolution_note: sosActionNote || c.resolution_note,
            }
          : c
      )
    );

    setActiveSosAction(null);
    setSosActionNote('');
    showToast(
      targetStatus === 'resolved'
        ? 'Emergency case resolved and archived.'
        : `SOS status updated to ${targetStatus}. Response units notified.`
    );
  };

  const filteredSosEvents = sosEvents.filter((c) => {
    if (sosFilter === 'all') return true;
    if (sosFilter === 'active') return c.status !== 'resolved';
    return c.status === sosFilter;
  });

  const caseColumns: Column<SOSEvent>[] = [
    {
      key: 'created_at',
      header: 'Time',
      render: (item) => (
        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
          {new Date(item.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'tourist_name',
      header: 'Tourist & Phone',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600 }}>{item.tourist_name || 'Tourist in Distress'}</div>
          {item.tourist_phone ? (
            <a
              href={`tel:${item.tourist_phone}`}
              style={{ fontSize: 'var(--font-xs)', color: 'var(--pri)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <PhoneCall size={12} /> {item.tourist_phone}
            </a>
          ) : (
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>No phone</span>
          )}
        </div>
      ),
    },
    {
      key: 'latitude',
      header: 'GPS Location',
      render: (item) => (
        <div style={{ fontSize: 'var(--font-xs)', fontFamily: 'monospace' }}>
          <div>{item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</div>
          {item.accuracy_m && (
            <span style={{ fontSize: '10px', color: 'var(--mute)' }}>Acc: ±{item.accuracy_m}m</span>
          )}
        </div>
      ),
    },
    {
      key: 'message',
      header: 'Emergency Report',
      render: (item) => (
        <div style={{ fontSize: 'var(--font-sm)', color: 'var(--ink)' }}>
          {item.message || 'Distress assistance requested'}
          {item.resolution_note && (
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--acc)', marginTop: '4px' }}>
              Note: {item.resolution_note}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Tag
          variant={
            item.status === 'resolved'
              ? 'ok'
              : item.status === 'new'
              ? 'bad'
              : item.status === 'responding'
              ? 'pri'
              : 'accent'
          }
        >
          {item.status.toUpperCase()}
        </Tag>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          {item.status === 'new' && (
            <Button
              variant="accent"
              size="sm"
              onClick={() => {
                setActiveSosAction({ event: item, targetStatus: 'acknowledged' });
                setSosActionNote('Dispatched Rescue 1122 team.');
              }}
              data-testid={`btn-ack-sos-${item.id}`}
            >
              Acknowledge
            </Button>
          )}
          {item.status === 'acknowledged' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setActiveSosAction({ event: item, targetStatus: 'responding' });
                setSosActionNote('Rescue units actively on site.');
              }}
            >
              Responding
            </Button>
          )}
          {item.status !== 'resolved' && (
            <Button
              variant="soft"
              size="sm"
              onClick={() => {
                setActiveSosAction({ event: item, targetStatus: 'resolved' });
                setSosActionNote('Tourist located and safely escorted.');
              }}
              data-testid={`btn-resolve-sos-${item.id}`}
            >
              Resolve
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleConfirmReportAction = async () => {
    if (!activeReportAction) return;
    const { report, targetStatus } = activeReportAction;

    try {
      await updateReportStatus(report.id, {
        status: targetStatus,
        resolution_note: reportActionNote || undefined,
      });
    } catch {
      // Local fallback
    }

    setReports((prev) =>
      prev.map((r) =>
        r.id === report.id
          ? {
              ...r,
              status: targetStatus,
              resolution_note: reportActionNote || r.resolution_note,
              assignee_name: targetStatus === 'assigned' ? 'District Authority Team' : r.assignee_name,
              updated_at: new Date().toISOString(),
            }
          : r
      )
    );

    setActiveReportAction(null);
    setReportActionNote('');
    showToast(
      targetStatus === 'resolved'
        ? 'Community report resolved and marked closed.'
        : `Community report marked as ${targetStatus}. Assignee notified.`
    );
  };

  const filteredReports = reports.filter((r) => {
    if (reportFilter === 'all') return true;
    if (reportFilter === 'active') return r.status !== 'resolved';
    return r.status === reportFilter;
  });

  const reportColumns: Column<IssueReport>[] = [
    {
      key: 'created_at',
      header: 'Reported',
      render: (item) => (
        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
          {new Date(item.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (item) => (
        <Tag
          variant={
            item.category === 'road_blocked'
              ? 'bad'
              : item.category === 'litter'
              ? 'accent'
              : item.category === 'overcharging'
              ? 'pri'
              : 'neutral'
          }
        >
          {item.category.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      key: 'title',
      header: 'Issue Details & Reporter',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: 'var(--ink)' }}>
            {item.title}
          </div>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', marginTop: '2px' }}>
            {item.description}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--pri)', marginTop: '4px' }}>
            Reported by: {item.reporter_name || 'Anonymous Tourist'}
            {item.reporter_phone && ` (${item.reporter_phone})`}
          </div>
          {item.resolution_note && (
            <div style={{ fontSize: '11px', color: 'var(--ok)', marginTop: '3px', fontWeight: 600 }}>
              Resolution: {item.resolution_note}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'latitude',
      header: 'Location',
      render: (item) => (
        <div style={{ fontSize: 'var(--font-xs)' }}>
          <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{item.area_name || 'Swat'}</div>
          {item.latitude && item.longitude ? (
            <div style={{ color: 'var(--mute)', fontFamily: 'monospace', fontSize: '11px' }}>
              {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
            </div>
          ) : (
            <span style={{ color: 'var(--mute)', fontSize: '11px' }}>No GPS coordinates</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Tag
          variant={
            item.status === 'resolved'
              ? 'ok'
              : item.status === 'new'
              ? 'bad'
              : item.status === 'assigned'
              ? 'accent'
              : 'neutral'
          }
        >
          {item.status.toUpperCase()}
        </Tag>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          {item.status === 'new' && (
            <Button
              variant="accent"
              size="sm"
              onClick={() => {
                setActiveReportAction({ report: item, targetStatus: 'assigned' });
                setReportActionNote('Assigned to municipal response team.');
              }}
              data-testid={`btn-assign-report-${item.id}`}
            >
              Assign
            </Button>
          )}
          {item.status !== 'resolved' && (
            <Button
              variant="soft"
              size="sm"
              onClick={() => {
                setActiveReportAction({ report: item, targetStatus: 'resolved' });
                setReportActionNote('Inspected and resolved on-site.');
              }}
              data-testid={`btn-resolve-report-${item.id}`}
            >
              Resolve
            </Button>
          )}
        </div>
      ),
    },
  ];

  const pendingCount = approvals.filter((a) => a.verification_status === 'pending' || a.verification_status === 'unverified').length;
  const unverifiedCount = approvals.filter((a) => a.verification_status === 'unverified').length;
  const activeAdvisoryCount = advisories.filter((a) => a.status === 'published').length;
  const activeSosCount = sosEvents.filter((s) => s.status !== 'resolved').length;
  const activeReportCount = reports.filter((r) => r.status !== 'resolved').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toastMessage && (
        <div
          style={{
            backgroundColor: 'var(--soft)',
            color: 'var(--pri)',
            border: '1px solid var(--pri)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 16px',
            fontSize: 'var(--font-sm)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} />
          {toastMessage}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 1: OVERVIEW */}
      {/* ===================================================================== */}
      {activeTab === 'overview' && (
        <>
          <div className="portal-header-row" style={{ marginBottom: '14px' }}>
            <div>
              <div className="portal-kicker">
                <Shield size={13} /> AUTHORITY COMMAND HUB
              </div>
              <h3 className="portal-section-title">Valley Oversight & Active Status</h3>
              <p className="portal-section-subtitle">
                Real-time monitoring of Swat mountain corridors, SOS emergency response units, and verification pipelines.
              </p>
            </div>
          </div>

          <div className="grid-cards">
            <div className="kpi-card">
              <div className="kpi-top-row">
                <div className="kpi-icon-badge kpi-icon-pri">
                  <AlertTriangle size={18} />
                </div>
                <Tag variant={activeAdvisoryCount > 0 ? 'accent' : 'ok'}>
                  {activeAdvisoryCount > 0 ? 'Published to Tourists' : 'All Clear'}
                </Tag>
              </div>
              <div>
                <div className="kpi-label">Active Advisories</div>
                <div className="kpi-number" style={{ color: 'var(--pri)' }}>
                  {activeAdvisoryCount}
                </div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top-row">
                <div className="kpi-icon-badge kpi-icon-bad">
                  <ShieldAlert size={18} />
                </div>
                <Tag variant={activeSosCount > 0 ? 'bad' : 'ok'}>
                  {activeSosCount > 0 ? 'Immediate Action Needed' : 'No Active Cases'}
                </Tag>
              </div>
              <div>
                <div className="kpi-label">Open SOS Emergencies</div>
                <div className="kpi-number" style={{ color: activeSosCount > 0 ? 'var(--bad)' : 'var(--ok)' }}>
                  {activeSosCount}
                </div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top-row">
                <div className="kpi-icon-badge kpi-icon-acc">
                  <CheckCircle2 size={18} />
                </div>
                <Tag variant={pendingCount > 0 ? 'accent' : 'ok'}>
                  {pendingCount > 0 ? 'Requires Action' : 'All Clear'}
                </Tag>
              </div>
              <div>
                <div className="kpi-label">Pending Business Approvals</div>
                <div className="kpi-number" style={{ color: 'var(--acc)' }}>
                  {pendingCount}
                </div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top-row">
                <div className="kpi-icon-badge kpi-icon-ok">
                  <Compass size={18} />
                </div>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>Live status broadcast</span>
              </div>
              <div>
                <div className="kpi-label">Monitored Mountain Routes</div>
                <div className="kpi-number">
                  {roadStatuses.length}
                </div>
              </div>
            </div>

            <div
              className="kpi-card"
              onClick={() => onTabChange && onTabChange('users')}
              style={{ cursor: onTabChange ? 'pointer' : 'default' }}
              title="Click to view and manage registered platform users"
              data-testid="kpi-card-registered-users"
            >
              <div className="kpi-top-row">
                <div className="kpi-icon-badge kpi-icon-pri">
                  <Users size={18} />
                </div>
                <Tag variant="ok">All Portals Loaded</Tag>
              </div>
              <div>
                <div className="kpi-label">Registered Users &amp; Operators</div>
                <div className="kpi-number" style={{ color: 'var(--pri)' }}>
                  12 Active
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <ThemeAppearanceSection />
          </div>
        </>
      )}

      {/* ===================================================================== */}
      {/* TAB: USERS / USER MANAGEMENT & GOVERNANCE */}
      {/* ===================================================================== */}
      {activeTab === 'users' && <UserManagementView />}

      {/* ===================================================================== */}
      {/* TAB: DIRECTORY / ALL BUSINESS LISTINGS */}
      {/* ===================================================================== */}
      {activeTab === 'directory' && (() => {
        // Merge verified/approved businesses from approvals queue if they are not already represented
        const existingBizNames = new Set(
          directoryListings.map((l) => (l.business_name || l.title || '').trim().toLowerCase())
        );
        const existingBizIds = new Set(directoryListings.map((l) => l.business_id));

        const approvedBizAsListings: ListingItem[] = approvals
          .filter((a) => a.verification_status === 'verified')
          .filter(
            (a) =>
              !existingBizIds.has(a.business_id) &&
              !existingBizNames.has((a.business_name || '').trim().toLowerCase())
          )
          .map((a) => ({
            id: `biz-${a.business_id}`,
            business_id: a.business_id,
            business_name: a.business_name,
            type_id: `type-${a.primary_type}`,
            type_code: (a.primary_type as ListingTypeCode) || 'restaurant',
            type_label:
              a.primary_type === 'restaurant'
                ? 'Restaurants & Cafes'
                : a.primary_type === 'hotel'
                ? 'Hotels & Stays'
                : a.primary_type === 'transport'
                ? 'Transport & Rentals'
                : a.primary_type === 'guide'
                ? 'Local Guides'
                : a.primary_type === 'activity'
                ? 'Activities & Adventures'
                : 'Shops & Artisans',
            area_id: 'area-mingora',
            area_name: 'Swat Valley',
            title: a.business_name,
            description: `Official registered ${a.primary_type} business in Swat Valley. Managed by ${a.owner_name || 'Registered Owner'}.`,
            address_text: a.address_text || 'Swat Valley, KP, Pakistan',
            latitude: 35.2227,
            longitude: 72.4258,
            phone: a.contact_phone || a.whatsapp_number,
            whatsapp_number: a.whatsapp_number || a.contact_phone,
            opening_time: '08:00',
            closing_time: '23:00',
            status: 'published',
            is_verified: true,
            rating_avg: 5.0,
            rating_count: 1,
            details: {
              facilities: ['Registered Business Operator', 'Verified Ownership', 'Customer Service Desk'],
              verification_status: a.verification_status,
              registration_no: a.registration_no,
              owner: a.owner_name,
              email: a.owner_email,
            },
            price_items: [],
            media: [],
            created_at: a.submitted_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

        const combinedDirectoryListings = [...directoryListings, ...approvedBizAsListings];

        const filteredDirectoryListings = combinedDirectoryListings
          .filter((l) => (directoryFilter === 'all' ? true : l.type_code === directoryFilter))
          .filter((l) => (!directoryAreaId ? true : l.area_id === directoryAreaId))
          .filter((l) => {
            if (!directorySearch.trim()) return true;
            const q = directorySearch.toLowerCase();
            return (
              l.title.toLowerCase().includes(q) ||
              (l.business_name && l.business_name.toLowerCase().includes(q)) ||
              (l.address_text && l.address_text.toLowerCase().includes(q)) ||
              (l.phone && l.phone.includes(q))
            );
          });

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} data-testid="authority-directory-tab">
            {/* Header Card Frame */}
            <div
              style={{
                backgroundColor: 'var(--card)',
                border: '1.5px solid rgba(27, 79, 114, 0.14)',
                borderLeft: '5px solid var(--pri)',
                borderRadius: '16px',
                padding: '20px 24px',
                boxShadow: '0 4px 20px -4px rgba(18, 50, 74, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div style={{ flex: '1 1 340px' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(47, 127, 193, 0.1)',
                    color: 'var(--pri)',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                  }}
                >
                  <Building2 size={13} />
                  <span>REGULATORY OVERSIGHT & BUSINESS REGISTRY</span>
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '22px',
                    fontWeight: 800,
                    color: 'var(--ink)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  <Store size={24} color="var(--pri)" />
                  <span>Swat Valley Business Directory & Listings Oversight</span>
                </h3>
                <p
                  style={{
                    margin: '6px 0 0',
                    fontSize: '13.5px',
                    color: 'var(--mute)',
                    lineHeight: 1.5,
                  }}
                >
                  Full cross-type regulatory oversight of all registered hotels, restaurants, transport fleets, guides, activities, and shops across Swat.
                </p>

                {/* Quick Stat Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--soft)',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--ink)',
                    }}
                  >
                    <Store size={13} color="var(--pri)" />
                    <span>{combinedDirectoryListings.length} Total Operators</span>
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      backgroundColor: '#ECFDF5',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#065F46',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                    }}
                  >
                    <CheckCircle2 size={13} color="#10B981" />
                    <span>{combinedDirectoryListings.filter((l) => l.status === 'published').length} Verified & Active</span>
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      backgroundColor: '#FEF3C7',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#92400E',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                    }}
                  >
                    <Sparkles size={13} color="#D97706" />
                    <span>{combinedDirectoryListings.filter((l) => l.status === 'pending').length} Pending Reviews</span>
                  </div>
                </div>
              </div>

              {/* Authority Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(47, 127, 193, 0.08)',
                  border: '1.5px solid rgba(47, 127, 193, 0.25)',
                  color: 'var(--pri)',
                  fontSize: '12.5px',
                  fontWeight: 700,
                }}
              >
                <Shield size={18} color="var(--pri)" />
                <span>Official Tourism Department Register</span>
              </div>
            </div>

            {/* Filter Toolbar Frame */}
            <div
              style={{
                backgroundColor: 'var(--card)',
                border: '1.5px solid rgba(27, 79, 114, 0.12)',
                borderRadius: '14px',
                padding: '10px 14px',
                boxShadow: '0 2px 8px rgba(18, 50, 74, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              {/* Category Filter Tabs */}
              <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', alignItems: 'center' }}>
                {[
                  { type: 'all', label: 'All Types', count: combinedDirectoryListings.length, icon: <Store size={14} /> },
                  { type: 'hotel', label: 'Hotels', count: combinedDirectoryListings.filter((l) => l.type_code === 'hotel').length, icon: <Bed size={14} /> },
                  { type: 'restaurant', label: 'Restaurants', count: combinedDirectoryListings.filter((l) => l.type_code === 'restaurant').length, icon: <Coffee size={14} /> },
                  { type: 'transport', label: 'Transport', count: combinedDirectoryListings.filter((l) => l.type_code === 'transport').length, icon: <Car size={14} /> },
                  { type: 'guide', label: 'Guides', count: combinedDirectoryListings.filter((l) => l.type_code === 'guide').length, icon: <Users size={14} /> },
                  { type: 'activity', label: 'Activities', count: combinedDirectoryListings.filter((l) => l.type_code === 'activity').length, icon: <Compass size={14} /> },
                  { type: 'shop', label: 'Shops', count: combinedDirectoryListings.filter((l) => l.type_code === 'shop').length, icon: <ShoppingBag size={14} /> },
                ].map((tab) => {
                  const isActive = directoryFilter === tab.type;
                  return (
                    <button
                      key={tab.type}
                      type="button"
                      onClick={() => setDirectoryFilter(tab.type)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '7px',
                        padding: '7px 12px',
                        borderRadius: '9px',
                        fontSize: '12.5px',
                        fontWeight: isActive ? 700 : 600,
                        cursor: 'pointer',
                        border: isActive
                          ? '1.5px solid var(--pri)'
                          : '1.5px solid rgba(27, 79, 114, 0.12)',
                        backgroundColor: isActive ? 'var(--pri)' : 'var(--bg)',
                        color: isActive ? '#FFFFFF' : 'var(--ink)',
                        boxShadow: isActive ? '0 2px 8px rgba(47, 127, 193, 0.28)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'var(--soft)';
                          e.currentTarget.style.borderColor = 'rgba(27, 79, 114, 0.25)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'var(--bg)';
                          e.currentTarget.style.borderColor = 'rgba(27, 79, 114, 0.12)';
                        }
                      }}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                      <span
                        style={{
                          padding: '1px 6px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(27, 79, 114, 0.08)',
                          color: isActive ? '#FFFFFF' : 'var(--mute)',
                        }}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right Search & Area Controls */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <select
                    value={directoryAreaId}
                    onChange={(e) => setDirectoryAreaId(e.target.value)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '9px',
                      border: '1.5px solid rgba(27, 79, 114, 0.2)',
                      backgroundColor: '#FFFFFF',
                      color: 'var(--ink)',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)',
                    }}
                  >
                    <option value="">All Valley Areas</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={14} color="var(--mute)" style={{ position: 'absolute', left: '10px' }} />
                  <input
                    type="text"
                    value={directorySearch}
                    onChange={(e) => setDirectorySearch(e.target.value)}
                    placeholder="Search title, owner, address..."
                    style={{
                      padding: '7px 12px 7px 30px',
                      borderRadius: '9px',
                      border: '1.5px solid rgba(27, 79, 114, 0.2)',
                      backgroundColor: '#FFFFFF',
                      color: 'var(--ink)',
                      fontSize: '12.5px',
                      fontWeight: 500,
                      minWidth: '220px',
                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Directory Listings Grid Frame */}
            {filteredDirectoryListings.length === 0 ? (
              <div
                style={{
                  backgroundColor: 'var(--card)',
                  border: '1.5px dashed rgba(27, 79, 114, 0.2)',
                  borderRadius: '16px',
                  padding: '40px 24px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    backgroundColor: 'var(--soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--pri)',
                  }}
                >
                  <Store size={26} />
                </div>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>
                  No business listings match the selected criteria
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--mute)', maxWidth: '420px' }}>
                  Try resetting your filters or clearing the search keyword to browse all cross-type operators in the registry.
                </p>
                {(directoryFilter !== 'all' || directoryAreaId || directorySearch) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setDirectoryFilter('all');
                      setDirectoryAreaId('');
                      setDirectorySearch('');
                    }}
                  >
                    Reset All Filters
                  </Button>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                {filteredDirectoryListings.map((listing) => {
                  const isHotel = listing.type_code === 'hotel';
                  const isRestaurant = listing.type_code === 'restaurant';
                  const isTransport = listing.type_code === 'transport';
                  const isGuide = listing.type_code === 'guide';
                  const isActivity = listing.type_code === 'activity';
                  const isPublished = listing.status === 'published';
                  const isPending = listing.status === 'pending';

                  return (
                    <div
                      key={listing.id}
                      style={{
                        backgroundColor: 'var(--card)',
                        border: '1.5px solid rgba(27, 79, 114, 0.12)',
                        borderRadius: '16px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 4px 16px -3px rgba(18, 50, 74, 0.06)',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(47, 127, 193, 0.35)';
                        e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(18, 50, 74, 0.12)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(27, 79, 114, 0.12)';
                        e.currentTarget.style.boxShadow = '0 4px 16px -3px rgba(18, 50, 74, 0.06)';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      <div>
                        {/* Top Type Category & Status Row */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '12px',
                            gap: '8px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: isHotel
                                ? '#EFF6FF'
                                : isRestaurant
                                ? '#FEF3C7'
                                : isTransport
                                ? '#ECFEFF'
                                : isGuide
                                ? '#ECFDF5'
                                : isActivity
                                ? '#F5F3FF'
                                : '#FFF1F2',
                              color: isHotel
                                ? '#1E40AF'
                                : isRestaurant
                                ? '#92400E'
                                : isTransport
                                ? '#0E7490'
                                : isGuide
                                ? '#065F46'
                                : isActivity
                                ? '#5B21B6'
                                : '#9F1239',
                              border: isHotel
                                ? '1px solid rgba(59, 130, 246, 0.3)'
                                : isRestaurant
                                ? '1px solid rgba(245, 158, 11, 0.35)'
                                : isTransport
                                ? '1px solid rgba(6, 182, 212, 0.3)'
                                : isGuide
                                ? '1px solid rgba(16, 185, 129, 0.3)'
                                : isActivity
                                ? '1px solid rgba(139, 92, 246, 0.3)'
                                : '1px solid rgba(244, 63, 94, 0.3)',
                            }}
                          >
                            {isHotel ? (
                              <Bed size={12} />
                            ) : isRestaurant ? (
                              <Coffee size={12} />
                            ) : isTransport ? (
                              <Car size={12} />
                            ) : isGuide ? (
                              <Users size={12} />
                            ) : isActivity ? (
                              <Compass size={12} />
                            ) : (
                              <ShoppingBag size={12} />
                            )}
                            <span>{listing.type_label || listing.type_code.toUpperCase()}</span>
                          </div>

                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '4px 9px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: isPublished ? '#ECFDF5' : isPending ? '#FEF3C7' : '#F3F4F6',
                              color: isPublished ? '#065F46' : isPending ? '#92400E' : '#4B5563',
                              border: isPublished
                                ? '1px solid rgba(16, 185, 129, 0.3)'
                                : isPending
                                ? '1px solid rgba(245, 158, 11, 0.35)'
                                : '1px solid rgba(156, 163, 175, 0.3)',
                            }}
                          >
                            {isPublished && <CheckCircle2 size={11} />}
                            <span>{listing.status.toUpperCase()}</span>
                          </div>
                        </div>

                        {/* Listing Title */}
                        <h4
                          style={{
                            margin: '0 0 6px',
                            fontWeight: 800,
                            fontSize: '16.5px',
                            color: 'var(--ink)',
                            lineHeight: 1.35,
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {listing.title}
                        </h4>

                        {/* Registered Business & Area */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            color: 'var(--mute)',
                            marginBottom: '8px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <User size={12} color="var(--pri)" />
                          <span>
                            Owner: <strong style={{ color: 'var(--ink)' }}>{listing.business_name || 'Registered Business'}</strong>
                          </span>
                          <span>•</span>
                          <MapPin size={12} color="var(--pri)" />
                          <span>{listing.area_name || 'Swat Valley'}</span>
                        </div>

                        {/* Address Excerpt Frame */}
                        {listing.address_text && (
                          <div
                            style={{
                              padding: '8px 12px',
                              backgroundColor: 'rgba(232, 241, 250, 0.35)',
                              borderLeft: '3px solid var(--pri)',
                              borderRadius: '0 8px 8px 0',
                              marginBottom: '10px',
                              fontSize: '12px',
                              color: 'var(--ink)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <MapPin size={13} color="var(--pri)" style={{ flexShrink: 0 }} />
                            <span style={{ lineHeight: 1.4 }}>{listing.address_text}</span>
                          </div>
                        )}

                        {/* Included Services & Rates */}
                        <div
                          style={{
                            marginTop: '8px',
                            paddingTop: '8px',
                            borderTop: '1px solid rgba(27, 79, 114, 0.08)',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: 'var(--mute)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              marginBottom: '6px',
                            }}
                          >
                            Included Services & Rates ({listing.price_items?.length || 0}):
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                            {(listing.price_items || []).slice(0, 3).map((item, idx) => (
                              <span
                                key={item.id || idx}
                                style={{
                                  fontSize: '11px',
                                  backgroundColor: 'var(--soft)',
                                  color: 'var(--ink)',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontWeight: 600,
                                  border: '1px solid rgba(27, 79, 114, 0.1)',
                                }}
                              >
                                {item.name}: PKR {Number(item.price).toLocaleString()}
                              </span>
                            ))}
                            {(listing.price_items?.length || 0) > 3 && (
                              <span
                                style={{
                                  fontSize: '11px',
                                  color: 'var(--pri)',
                                  fontWeight: 700,
                                  alignSelf: 'center',
                                }}
                              >
                                +{listing.price_items!.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Footer Action Frame */}
                      <div
                        style={{
                          marginTop: '14px',
                          borderTop: '1px solid rgba(27, 79, 114, 0.09)',
                          paddingTop: '12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '8px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ fontSize: '11px', color: 'var(--mute)' }}>
                          {listing.phone && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Phone size={11} color="var(--pri)" />
                              {listing.phone}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setInspectingListing(listing)}
                          data-testid={`btn-inspect-listing-${listing.id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '7px 14px',
                            borderRadius: '9px',
                            backgroundColor: '#FFFFFF',
                            border: '1.5px solid rgba(27, 79, 114, 0.28)',
                            color: 'var(--pri)',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(27, 79, 114, 0.06)',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--soft)';
                            e.currentTarget.style.borderColor = 'var(--pri)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                            e.currentTarget.style.borderColor = 'rgba(27, 79, 114, 0.28)';
                            e.currentTarget.style.transform = 'none';
                          }}
                        >
                          <Eye size={13} style={{ strokeWidth: 2 }} />
                          <span>Inspect Details</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ===================================================================== */}
      {/* TAB 2: ADVISORIES */}
      {/* ===================================================================== */}
      {activeTab === 'advisories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Advisories Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, margin: 0 }}>
                  Safety & Weather Advisories
                </h3>
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', margin: '2px 0 0' }}>
                  Publish flood, snow, road hazard, and security warnings to all visiting tourists.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="accent"
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={() => setIsCreateAdvisoryOpen(true)}
                  data-testid="btn-create-advisory"
                >
                  Create Advisory
                </Button>
              </div>
            </div>

            {/* Filter Chips */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              <Chip active={advisoryFilter === 'all'} onClick={() => setAdvisoryFilter('all')}>
                All Advisories ({advisories.length})
              </Chip>
              <Chip active={advisoryFilter === 'published'} onClick={() => setAdvisoryFilter('published')}>
                Published ({advisories.filter((a) => a.status === 'published').length})
              </Chip>
              <Chip active={advisoryFilter === 'draft'} onClick={() => setAdvisoryFilter('draft')}>
                Drafts ({advisories.filter((a) => a.status === 'draft').length})
              </Chip>
              <Chip active={advisoryFilter === 'withdrawn'} onClick={() => setAdvisoryFilter('withdrawn')}>
                Withdrawn ({advisories.filter((a) => a.status === 'withdrawn').length})
              </Chip>
            </div>

            <DataTable<Advisory>
              data={filteredAdvisories}
              columns={advisoryColumns}
              keyExtractor={(a) => a.id}
              isMobile={isMobile}
              searchPlaceholder="Search advisories by title or message..."
              renderMobileCard={(item) => (
                <Card padding="md">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontWeight: 600, margin: 0 }}>{item.title}</h4>
                      <p style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', marginTop: '2px' }}>
                        Area: {item.area_name || 'All Swat'} • {item.category}
                      </p>
                    </div>
                    <Tag variant={item.severity === 'danger' ? 'bad' : item.severity === 'warning' ? 'accent' : 'pri'}>
                      {item.severity}
                    </Tag>
                  </div>
                  <p style={{ fontSize: 'var(--font-sm)', color: 'var(--ink)', margin: '8px 0' }}>
                    {item.message}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', borderTop: '1px solid var(--line)', paddingTop: '8px' }}>
                    <Tag variant={item.status === 'published' ? 'ok' : 'neutral'}>{item.status}</Tag>
                    {item.status !== 'withdrawn' && (
                      <Button variant="soft" size="sm" onClick={() => handleWithdrawAdvisory(item.id)}>
                        Withdraw
                      </Button>
                    )}
                  </div>
                </Card>
              )}
            />
          </div>

          {/* Road Status Management Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={18} color="var(--pri)" /> Road & Mountain Passes Status
                </h3>
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', margin: '2px 0 0' }}>
                  Update live route access (Open, 4x4 Only, Closed) and pass requirements.
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => {
                  setEditingRoadId(null);
                  setNewRoad({ road_name: '', status: 'open', vehicle_note: '', reason: '' });
                  setIsRoadModalOpen(true);
                }}
                data-testid="btn-add-road"
              >
                + Add / Update Route Status
              </Button>
            </div>

            <DataTable<RoadStatus>
              data={roadStatuses}
              columns={roadColumns}
              keyExtractor={(r) => r.id}
              isMobile={isMobile}
              searchPlaceholder="Search routes by name or condition..."
              renderMobileCard={(item) => (
                <Card padding="md">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h4 style={{ fontWeight: 600, margin: 0 }}>{item.road_name}</h4>
                    <Tag variant={item.status === 'open' ? 'ok' : item.status === 'limited' ? 'accent' : 'bad'}>
                      {item.status}
                    </Tag>
                  </div>
                  <p style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', marginTop: '4px' }}>
                    Req: {item.vehicle_note || 'All Vehicles'} • {item.reason || 'Clear'}
                  </p>
                  <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingRoadId(item.id);
                        setNewRoad({
                          road_name: item.road_name,
                          status: item.status,
                          vehicle_note: item.vehicle_note || '',
                          reason: item.reason || '',
                        });
                        setIsRoadModalOpen(true);
                      }}
                    >
                      Update
                    </Button>
                  </div>
                </Card>
              )}
            />
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: APPROVALS */}
      {/* ===================================================================== */}
      {activeTab === 'approvals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Sub-tab Switcher: Commercial Businesses vs Community Services */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              borderBottom: '1px solid var(--line)',
              paddingBottom: '12px',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button
                variant={approvalSubTab === 'business' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setApprovalSubTab('business')}
                data-testid="subtab-biz-approvals"
              >
                🏢 Commercial Businesses ({pendingCount})
              </Button>
              <Button
                variant={approvalSubTab === 'community' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setApprovalSubTab('community')}
                data-testid="subtab-community-approvals"
              >
                🤝 Community Services & Guides ({communityApplications.filter((a) => a.status === 'pending').length})
              </Button>
            </div>
            <Tag
              variant={
                (approvalSubTab === 'business'
                  ? pendingCount
                  : communityApplications.filter((a) => a.status === 'pending').length) > 0
                  ? 'accent'
                  : 'ok'
              }
            >
              {approvalSubTab === 'business'
                ? `${pendingCount} Businesses Pending Verification`
                : `${communityApplications.filter((a) => a.status === 'pending').length} Community Services Pending Review`}
            </Tag>
          </div>

          {approvalSubTab === 'business' ? (
            <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              <Chip active={selectedFilter === 'all'} onClick={() => setSelectedFilter('all')}>
                All Records ({approvals.length})
              </Chip>
              <Chip active={selectedFilter === 'pending'} onClick={() => setSelectedFilter('pending')}>
                Pending Action ({pendingCount})
              </Chip>
              <Chip active={selectedFilter === 'unverified'} onClick={() => setSelectedFilter('unverified')}>
                New Signups ({unverifiedCount})
              </Chip>
              <Chip active={selectedFilter === 'verified'} onClick={() => setSelectedFilter('verified')}>
                Verified
              </Chip>
              <Chip active={selectedFilter === 'rejected'} onClick={() => setSelectedFilter('rejected')}>
                Rejected / Needs Changes
              </Chip>
            </div>
            <Tag variant={pendingCount > 0 ? 'accent' : 'ok'}>
              {pendingCount} Pending Verification
            </Tag>
          </div>

          <DataTable<ApprovalQueueItem>
            data={filteredApprovals}
            columns={approvalColumns}
            keyExtractor={(a) => a.business_id}
            isMobile={isMobile}
            searchPlaceholder="Search queue by business name or applicant..."
            renderMobileCard={(item) => (
              <Card padding="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontWeight: 600, margin: 0 }}>{item.business_name}</h4>
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', marginTop: '4px' }}>
                      {item.primary_type.toUpperCase()} • Applicant: {item.owner_name}
                    </p>
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--ink)', marginTop: '2px' }}>
                      Reg: {item.registration_no || 'None'} • {item.documents.length} doc(s)
                    </p>
                  </div>
                  <Tag
                    variant={
                      item.verification_status === 'verified'
                        ? 'ok'
                        : item.verification_status === 'pending'
                        ? 'accent'
                        : 'bad'
                    }
                  >
                    {item.verification_status}
                  </Tag>
                </div>

                <div style={{ marginTop: '12px', display: 'flex', gap: '6px', borderTop: '1px solid var(--line)', paddingTop: '8px' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Eye size={12} />}
                    onClick={() => setInspectingItem(item)}
                  >
                    Review
                  </Button>
                  {(item.verification_status === 'pending' || item.verification_status === 'unverified') && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Check size={12} />}
                      onClick={() => handleDecision(item.business_id, 'approved', 'Verified')}
                    >
                      Approve
                    </Button>
                  )}
                </div>
              </Card>
            )}
          />
            </>
          ) : (
            <>
              {/* Community Services Sub-tab View */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  <Chip active={communityFilter === 'all'} onClick={() => setCommunityFilter('all')}>
                    All Offerings ({communityApplications.length})
                  </Chip>
                  <Chip active={communityFilter === 'pending'} onClick={() => setCommunityFilter('pending')}>
                    Pending Review ({communityApplications.filter((a) => a.status === 'pending').length})
                  </Chip>
                  <Chip active={communityFilter === 'approved'} onClick={() => setCommunityFilter('approved')}>
                    Verified & Published ({communityApplications.filter((a) => a.status === 'approved').length})
                  </Chip>
                  <Chip active={communityFilter === 'rejected'} onClick={() => setCommunityFilter('rejected')}>
                    Rejected ({communityApplications.filter((a) => a.status === 'rejected').length})
                  </Chip>
                </div>

                <div style={{ flex: 1, minWidth: '220px', maxWidth: '380px' }}>
                  <input
                    type="text"
                    placeholder="Search applicant, vehicle, guide, activity..."
                    value={communitySearch}
                    onChange={(e) => setCommunitySearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      fontSize: '12.5px',
                      backgroundColor: 'var(--card)',
                      color: 'var(--ink)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Community Applications List */}
              {communityApplications.filter((a) => {
                if (communityFilter !== 'all' && a.status !== communityFilter) return false;
                if (communitySearch.trim()) {
                  const q = communitySearch.toLowerCase();
                  const match =
                    (a.applicant_name || '').toLowerCase().includes(q) ||
                    (a.applicant_phone || '').toLowerCase().includes(q) ||
                    (a.applicant_email || '').toLowerCase().includes(q) ||
                    a.offer_type.toLowerCase().includes(q) ||
                    a.description.toLowerCase().includes(q);
                  if (!match) return false;
                }
                return true;
              }).length === 0 ? (
                <Card padding="lg" style={{ textAlign: 'center', color: 'var(--mute)' }}>
                  <p style={{ margin: 0 }}>No community service applications match the selected filter.</p>
                </Card>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {communityApplications
                    .filter((a) => {
                      if (communityFilter !== 'all' && a.status !== communityFilter) return false;
                      if (communitySearch.trim()) {
                        const q = communitySearch.toLowerCase();
                        const match =
                          (a.applicant_name || '').toLowerCase().includes(q) ||
                          (a.applicant_phone || '').toLowerCase().includes(q) ||
                          (a.applicant_email || '').toLowerCase().includes(q) ||
                          a.offer_type.toLowerCase().includes(q) ||
                          a.description.toLowerCase().includes(q);
                        if (!match) return false;
                      }
                      return true;
                    })
                    .map((app) => (
                      <Card
                        key={app.id}
                        padding="md"
                        style={{
                          borderLeft:
                            app.status === 'approved'
                              ? '4px solid var(--ok)'
                              : app.status === 'pending'
                              ? '4px solid var(--accent)'
                              : '4px solid var(--bad)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '5px 12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 700,
                                backgroundColor:
                                  app.offer_type === 'transport'
                                    ? '#EFF6FF'
                                    : app.offer_type === 'guide'
                                    ? '#F0FDF4'
                                    : app.offer_type === 'activity'
                                    ? '#FEF3C7'
                                    : '#F5F3FF',
                                color:
                                  app.offer_type === 'transport'
                                    ? '#1D4ED8'
                                    : app.offer_type === 'guide'
                                    ? '#15803D'
                                    : app.offer_type === 'activity'
                                    ? '#B45309'
                                    : '#6D28D9',
                                border: '1px solid rgba(0,0,0,0.06)',
                              }}
                            >
                              {app.offer_type === 'transport' ? (
                                <>
                                  <Car size={14} /> 4x4 Tour Ride / Transport
                                </>
                              ) : app.offer_type === 'guide' ? (
                                <>
                                  <Compass size={14} /> Mountain & Trekking Guide
                                </>
                              ) : app.offer_type === 'activity' ? (
                                <>
                                  <Waves size={14} /> Adventure Activity
                                </>
                              ) : app.offer_type === 'craft' ? (
                                <>
                                  <ShoppingBag size={14} /> Cottage Craft Products
                                </>
                              ) : (
                                <>
                                  <Users size={14} /> Village Homestay & Meals
                                </>
                              )}
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                              Applicant: {app.applicant_name || 'Community Member'}
                            </span>
                          </div>

                          <Tag variant={app.status === 'approved' ? 'ok' : app.status === 'pending' ? 'accent' : 'bad'}>
                            {app.status === 'approved'
                              ? 'Verified & Published to Tourists'
                              : app.status === 'pending'
                              ? 'Pending Authority Review'
                              : 'Rejected'}
                          </Tag>
                        </div>

                        {/* Contact details */}
                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--mute)', margin: '8px 0', flexWrap: 'wrap' }}>
                          {app.applicant_phone && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Phone size={12} /> {app.applicant_phone}
                            </span>
                          )}
                          {app.applicant_email && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <User size={12} /> {app.applicant_email}
                            </span>
                          )}
                          <span>Applied: {new Date(app.created_at).toLocaleDateString()}</span>
                          {app.reviewed_at && <span>Reviewed: {new Date(app.reviewed_at).toLocaleDateString()}</span>}
                        </div>

                        {/* Detailed Description */}
                        <div
                          style={{
                            padding: '10px 14px',
                            backgroundColor: 'var(--bg)',
                            borderRadius: '8px',
                            border: '1px solid var(--line)',
                            fontSize: '12.5px',
                            color: 'var(--ink)',
                            lineHeight: 1.5,
                            margin: '8px 0 12px 0',
                          }}
                        >
                          {app.description}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
                          {app.status !== 'approved' && (
                            <Button
                              variant="primary"
                              size="sm"
                              icon={<Check size={14} />}
                              onClick={() => handleReviewCommunityApp(app.id, 'approved', 'Verified and approved by Swat Tourism Authority')}
                              data-testid={`btn-approve-community-${app.id}`}
                              style={{ backgroundColor: 'var(--ok)', borderColor: 'var(--ok)', color: '#FFFFFF' }}
                            >
                              Approve & Publish to Tourists
                            </Button>
                          )}
                          {app.status !== 'rejected' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<X size={14} />}
                              onClick={() => handleReviewCommunityApp(app.id, 'rejected', 'Service details require updates or documentation')}
                              data-testid={`btn-reject-community-${app.id}`}
                            >
                              Reject Offering
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: CASES (SOS EMERGENCIES & COMMUNITY ISSUE REPORTS) */}
      {/* ===================================================================== */}
      {activeTab === 'cases' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Sub-tab Switcher: SOS vs Community Reports */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              borderBottom: '1px solid var(--line)',
              paddingBottom: '12px',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant={casesSubTab === 'sos' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setCasesSubTab('sos')}
                data-testid="subtab-sos"
              >
                🚨 SOS Emergencies ({activeSosCount})
              </Button>
              <Button
                variant={casesSubTab === 'reports' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setCasesSubTab('reports')}
                data-testid="subtab-reports"
              >
                📋 Community Reports ({activeReportCount})
              </Button>
            </div>
            <Tag variant={casesSubTab === 'sos' ? (activeSosCount > 0 ? 'bad' : 'ok') : (activeReportCount > 0 ? 'accent' : 'ok')}>
              {casesSubTab === 'sos'
                ? `${activeSosCount} Active Emergency Cases`
                : `${activeReportCount} Open Community Issues`}
            </Tag>
          </div>

          {/* SUB-SECTION 1: SOS ALERTS */}
          {casesSubTab === 'sos' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldAlert size={20} color="var(--bad)" /> Emergency SOS Alerts & Tourist Dispatch Queue
                  </h3>
                  <p style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', margin: '2px 0 0' }}>
                    Real-time distress broadcasts received from tourists across Swat Valley.
                  </p>
                </div>
              </div>

              {/* Filter Chips */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                <Chip active={sosFilter === 'all'} onClick={() => setSosFilter('all')}>
                  All Incidents ({sosEvents.length})
                </Chip>
                <Chip active={sosFilter === 'active'} onClick={() => setSosFilter('active')}>
                  Active Cases ({activeSosCount})
                </Chip>
                <Chip active={sosFilter === 'new'} onClick={() => setSosFilter('new')}>
                  New Unacknowledged ({sosEvents.filter((s) => s.status === 'new').length})
                </Chip>
                <Chip active={sosFilter === 'acknowledged'} onClick={() => setSosFilter('acknowledged')}>
                  Dispatched / Ack ({sosEvents.filter((s) => s.status === 'acknowledged').length})
                </Chip>
                <Chip active={sosFilter === 'resolved'} onClick={() => setSosFilter('resolved')}>
                  Resolved ({sosEvents.filter((s) => s.status === 'resolved').length})
                </Chip>
              </div>

              <DataTable<SOSEvent>
                data={filteredSosEvents}
                columns={caseColumns}
                keyExtractor={(c) => c.id}
                isMobile={isMobile}
                searchPlaceholder="Search SOS by tourist name, phone, or location..."
                renderMobileCard={(item) => (
                  <Card padding="md">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ fontWeight: 700, margin: 0, color: 'var(--bad)' }}>
                          SOS: {item.tourist_name || 'Tourist in Distress'}
                        </h4>
                        {item.tourist_phone && (
                          <a href={`tel:${item.tourist_phone}`} style={{ fontSize: 'var(--font-xs)', color: 'var(--pri)', fontWeight: 600 }}>
                            {item.tourist_phone}
                          </a>
                        )}
                      </div>
                      <Tag variant={item.status === 'resolved' ? 'ok' : item.status === 'new' ? 'bad' : 'accent'}>
                        {item.status.toUpperCase()}
                      </Tag>
                    </div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', margin: '4px 0' }}>
                      GPS: {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                    </div>
                    <p style={{ fontSize: 'var(--font-sm)', color: 'var(--ink)', margin: '8px 0' }}>
                      {item.message}
                    </p>
                    {item.resolution_note && (
                      <p style={{ fontSize: 'var(--font-xs)', color: 'var(--acc)', margin: '4px 0' }}>
                        Note: {item.resolution_note}
                      </p>
                    )}
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px', borderTop: '1px solid var(--line)', paddingTop: '8px' }}>
                      {item.status === 'new' && (
                        <Button
                          variant="accent"
                          size="sm"
                          onClick={() => {
                            setActiveSosAction({ event: item, targetStatus: 'acknowledged' });
                            setSosActionNote('Dispatched Rescue 1122 team.');
                          }}
                        >
                          Acknowledge
                        </Button>
                      )}
                      {item.status !== 'resolved' && (
                        <Button
                          variant="soft"
                          size="sm"
                          onClick={() => {
                            setActiveSosAction({ event: item, targetStatus: 'resolved' });
                            setSosActionNote('Tourist located and safely escorted.');
                          }}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </Card>
                )}
              />
            </>
          )}

          {/* SUB-SECTION 2: COMMUNITY REPORTS */}
          {casesSubTab === 'reports' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={20} color="var(--pri)" /> Citizen & Tourist Issue Reports
                  </h3>
                  <p style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', margin: '2px 0 0' }}>
                    Road obstructions, litter complaints, overcharging reports, and public hazards.
                  </p>
                </div>
              </div>

              {/* Filter Chips */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                <Chip active={reportFilter === 'all'} onClick={() => setReportFilter('all')}>
                  All Reports ({reports.length})
                </Chip>
                <Chip active={reportFilter === 'active'} onClick={() => setReportFilter('active')}>
                  Active ({activeReportCount})
                </Chip>
                <Chip active={reportFilter === 'new'} onClick={() => setReportFilter('new')}>
                  New ({reports.filter((r) => r.status === 'new').length})
                </Chip>
                <Chip active={reportFilter === 'assigned'} onClick={() => setReportFilter('assigned')}>
                  Assigned ({reports.filter((r) => r.status === 'assigned').length})
                </Chip>
                <Chip active={reportFilter === 'resolved'} onClick={() => setReportFilter('resolved')}>
                  Resolved ({reports.filter((r) => r.status === 'resolved').length})
                </Chip>
              </div>

              <DataTable<IssueReport>
                data={filteredReports}
                columns={reportColumns}
                keyExtractor={(r) => r.id}
                isMobile={isMobile}
                searchPlaceholder="Search community reports by title, category, or area..."
                renderMobileCard={(item) => (
                  <Card padding="md">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ fontWeight: 600, margin: 0 }}>{item.title}</h4>
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', marginTop: '2px' }}>
                          {item.area_name || 'Swat'} • {item.category.replace('_', ' ')}
                        </div>
                      </div>
                      <Tag
                        variant={
                          item.status === 'resolved'
                            ? 'ok'
                            : item.status === 'new'
                            ? 'bad'
                            : 'accent'
                        }
                      >
                        {item.status.toUpperCase()}
                      </Tag>
                    </div>

                    <p style={{ fontSize: 'var(--font-sm)', color: 'var(--ink)', margin: '8px 0' }}>
                      {item.description}
                    </p>

                    {item.resolution_note && (
                      <p style={{ fontSize: 'var(--font-xs)', color: 'var(--ok)', margin: '4px 0', fontWeight: 600 }}>
                        Resolution: {item.resolution_note}
                      </p>
                    )}

                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px', borderTop: '1px solid var(--line)', paddingTop: '8px' }}>
                      {item.status === 'new' && (
                        <Button
                          variant="accent"
                          size="sm"
                          onClick={() => {
                            setActiveReportAction({ report: item, targetStatus: 'assigned' });
                            setReportActionNote('Assigned to municipal response team.');
                          }}
                        >
                          Assign
                        </Button>
                      )}
                      {item.status !== 'resolved' && (
                        <Button
                          variant="soft"
                          size="sm"
                          onClick={() => {
                            setActiveReportAction({ report: item, targetStatus: 'resolved' });
                            setReportActionNote('Inspected and resolved on-site.');
                          }}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </Card>
                )}
              />
            </>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: CREATE ADVISORY */}
      {/* ===================================================================== */}
      {isCreateAdvisoryOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          data-testid="modal-create-advisory"
        >
          <div
            style={{
              backgroundColor: 'var(--card)',
              borderRadius: 'var(--radius-card)',
              width: '100%',
              maxWidth: '560px',
              padding: '24px',
              border: '1px solid var(--line)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, margin: 0 }}>
                Publish Safety Advisory
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateAdvisoryOpen(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--mute)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                  Advisory Title *
                </label>
                <input
                  type="text"
                  value={newAdvisory.title}
                  onChange={(e) => setNewAdvisory({ ...newAdvisory, title: e.target.value })}
                  placeholder="E.g., High Avalanche Warning Kalam Pass"
                  data-testid="input-advisory-title"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-button)',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: 'var(--font-sm)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                    Category
                  </label>
                  <select
                    value={newAdvisory.category}
                    onChange={(e) => setNewAdvisory({ ...newAdvisory, category: e.target.value as AdvisoryCategory })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                      fontSize: 'var(--font-sm)',
                    }}
                  >
                    <option value="weather">Weather Warning</option>
                    <option value="road">Road Hazard / Landslide</option>
                    <option value="flood">Flood Alert</option>
                    <option value="security">Security / Police Notice</option>
                    <option value="health">Health & Medical</option>
                    <option value="general">General Notice</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                    Severity
                  </label>
                  <select
                    value={newAdvisory.severity}
                    onChange={(e) => setNewAdvisory({ ...newAdvisory, severity: e.target.value as AdvisorySeverity })}
                    data-testid="select-advisory-severity"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                      fontSize: 'var(--font-sm)',
                    }}
                  >
                    <option value="info">Info (Standard)</option>
                    <option value="warning">Warning (Medium Risk)</option>
                    <option value="danger">Danger (High Alert / Red)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                    Target Valley / Area
                  </label>
                  <select
                    value={newAdvisory.area_id}
                    onChange={(e) => setNewAdvisory({ ...newAdvisory, area_id: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                      fontSize: 'var(--font-sm)',
                    }}
                  >
                    <option value="">All Swat Valley</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                    Expires At
                  </label>
                  <input
                    type="datetime-local"
                    value={newAdvisory.expires_at}
                    onChange={(e) => setNewAdvisory({ ...newAdvisory, expires_at: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                      fontSize: 'var(--font-sm)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                  Detailed Advisory Message *
                </label>
                <textarea
                  rows={4}
                  value={newAdvisory.message}
                  onChange={(e) => setNewAdvisory({ ...newAdvisory, message: e.target.value })}
                  placeholder="Explain instructions, precautions, tire chain rules, or alternate routes..."
                  data-testid="input-advisory-message"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 'var(--radius-button)',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: 'var(--font-sm)',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setIsCreateAdvisoryOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="accent"
                onClick={handleCreateAdvisory}
                data-testid="btn-submit-advisory"
              >
                Broadcast Advisory
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ROAD STATUS */}
      {/* ===================================================================== */}
      {isRoadModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          data-testid="modal-road-status"
        >
          <div
            style={{
              backgroundColor: 'var(--card)',
              borderRadius: 'var(--radius-card)',
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              border: '1px solid var(--line)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, margin: 0 }}>
                {editingRoadId ? 'Update Road Status' : 'Record Route Condition'}
              </h3>
              <button
                type="button"
                onClick={() => setIsRoadModalOpen(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--mute)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                  Route / Pass Name *
                </label>
                <input
                  type="text"
                  value={newRoad.road_name}
                  onChange={(e) => setNewRoad({ ...newRoad, road_name: e.target.value })}
                  placeholder="E.g., Bahrain to Kalam Highway (N-95)"
                  data-testid="input-road-name"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-button)',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: 'var(--font-sm)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                  Road Condition Status
                </label>
                <select
                  value={newRoad.status}
                  onChange={(e) => setNewRoad({ ...newRoad, status: e.target.value as RoadConditionStatus })}
                  data-testid="select-road-status"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-button)',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: 'var(--font-sm)',
                  }}
                >
                  <option value="open">Open (Normal Traffic)</option>
                  <option value="limited">Limited (4x4 Only / Chains Advised)</option>
                  <option value="closed">Closed (Blocked / No Passage)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                  Vehicle Requirement Note
                </label>
                <input
                  type="text"
                  value={newRoad.vehicle_note}
                  onChange={(e) => setNewRoad({ ...newRoad, vehicle_note: e.target.value })}
                  placeholder="E.g., 4x4 vehicles only, tire chains compulsory"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-button)',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: 'var(--font-sm)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                  Reason / Situation Details
                </label>
                <input
                  type="text"
                  value={newRoad.reason}
                  onChange={(e) => setNewRoad({ ...newRoad, reason: e.target.value })}
                  placeholder="E.g., Landslide debris removal near Madyan bypass"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-button)',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: 'var(--font-sm)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setIsRoadModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveRoadStatus}
                data-testid="btn-submit-road"
              >
                Save Route Status
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: SOS DISPATCH / RESOLUTION */}
      {/* ===================================================================== */}
      {activeSosAction && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          data-testid="modal-sos-action"
        >
          <div
            style={{
              backgroundColor: 'var(--card)',
              borderRadius: 'var(--radius-card)',
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              border: '1px solid var(--line)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, margin: 0, color: activeSosAction.targetStatus === 'resolved' ? 'var(--ok)' : 'var(--acc)' }}>
                {activeSosAction.targetStatus === 'resolved'
                  ? 'Resolve Emergency Case'
                  : `Update Status: ${activeSosAction.targetStatus.toUpperCase()}`}
              </h3>
              <button
                type="button"
                onClick={() => setActiveSosAction(null)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--mute)' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--ink)' }}>
              Case for <strong>{activeSosAction.event.tourist_name || 'Tourist'}</strong> at coordinates{' '}
              <code>{activeSosAction.event.latitude.toFixed(4)}, {activeSosAction.event.longitude.toFixed(4)}</code>.
            </p>

            <div style={{ marginTop: '12px' }}>
              <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                Resolution / Dispatch Notes
              </label>
              <textarea
                rows={3}
                value={sosActionNote}
                onChange={(e) => setSosActionNote(e.target.value)}
                placeholder="E.g., Dispatched Kalam Rescue 1122 team; tourist safely reached hotel..."
                data-testid="input-sos-action-note"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 'var(--radius-button)',
                  border: '1px solid var(--line)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--ink)',
                  fontSize: 'var(--font-sm)',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setActiveSosAction(null)}>
                Cancel
              </Button>
              <Button
                variant={activeSosAction.targetStatus === 'resolved' ? 'primary' : 'accent'}
                onClick={handleConfirmSosAction}
                data-testid="btn-confirm-sos-action"
              >
                Confirm Update
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: COMMUNITY REPORT ACTION / RESOLUTION */}
      {/* ===================================================================== */}
      {activeReportAction && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          data-testid="modal-report-action"
        >
          <div
            style={{
              backgroundColor: 'var(--card)',
              borderRadius: 'var(--radius-card)',
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              border: '1px solid var(--line)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, margin: 0, color: activeReportAction.targetStatus === 'resolved' ? 'var(--ok)' : 'var(--acc)' }}>
                {activeReportAction.targetStatus === 'resolved'
                  ? 'Resolve Community Issue Report'
                  : `Assign Report / Take Action`}
              </h3>
              <button
                type="button"
                onClick={() => setActiveReportAction(null)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--mute)' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--ink)' }}>
              Report: <strong>{activeReportAction.report.title}</strong> ({activeReportAction.report.category})
            </p>

            <div style={{ marginTop: '12px' }}>
              <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                Action / Resolution Note *
              </label>
              <textarea
                rows={3}
                value={reportActionNote}
                onChange={(e) => setReportActionNote(e.target.value)}
                placeholder="Enter actions taken, assigned department, or site inspection notes..."
                data-testid="input-report-action-note"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 'var(--radius-button)',
                  border: '1px solid var(--line)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--ink)',
                  fontSize: 'var(--font-sm)',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setActiveReportAction(null)}>
                Cancel
              </Button>
              <Button
                variant={activeReportAction.targetStatus === 'resolved' ? 'primary' : 'accent'}
                onClick={handleConfirmReportAction}
                data-testid="btn-confirm-report-action"
              >
                {activeReportAction.targetStatus === 'resolved' ? 'Mark Resolved' : 'Confirm Assignment'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: DOCUMENT INSPECTION & DECISION (Step 3 verification) */}
      {/* ===================================================================== */}
      {inspectingItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          data-testid="verification-inspect-modal"
        >
          <div
            style={{
              backgroundColor: 'var(--card)',
              borderRadius: 'var(--radius-card)',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: '1px solid var(--line)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid var(--line)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 'var(--font-lg)', fontWeight: 700 }}>
                  Verification Review: {inspectingItem.business_name}
                </h3>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                  Category: {inspectingItem.primary_type.toUpperCase()} • Submitted:{' '}
                  {new Date(inspectingItem.submitted_at).toLocaleDateString()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInspectingItem(null);
                  setIsAskingChanges(false);
                }}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: 'var(--mute)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', fontWeight: 600 }}>
                    Applicant / Owner Name
                  </label>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: 'var(--ink)' }}>
                    {inspectingItem.owner_name}
                  </div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                    {inspectingItem.owner_email}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', fontWeight: 600 }}>
                    Official Registration No.
                  </label>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: 'var(--ink)' }}>
                    {inspectingItem.registration_no || 'Not provided'}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', fontWeight: 600 }}>
                    Contact Phone / WhatsApp
                  </label>
                  <div style={{ fontSize: 'var(--font-sm)', color: 'var(--ink)' }}>
                    {inspectingItem.contact_phone || 'None'} / {inspectingItem.whatsapp_number || 'None'}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', fontWeight: 600 }}>
                    Registered Physical Address
                  </label>
                  <div style={{ fontSize: 'var(--font-sm)', color: 'var(--ink)' }}>
                    {inspectingItem.address_text || 'None'}
                  </div>
                </div>
              </div>

              {/* Uploaded Documents List */}
              <div>
                <h4 style={{ fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: '8px' }}>
                  Submitted Credentials & Documents ({inspectingItem.documents.length})
                </h4>

                {inspectingItem.documents.length === 0 ? (
                  <div style={{ padding: '16px', backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-sm)', textAlign: 'center', color: 'var(--mute)', fontSize: 'var(--font-xs)' }}>
                    No documents uploaded yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {inspectingItem.documents.map((doc) => (
                      <div
                        key={doc.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--line)',
                          backgroundColor: 'var(--bg)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <FileText size={18} color="var(--pri)" />
                          <div>
                            <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, textTransform: 'capitalize' }}>
                              {doc.doc_type.replace('_', ' ')}
                            </span>
                            <div style={{ fontSize: '11px', color: 'var(--mute)' }}>
                              Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: 'var(--font-xs)',
                            color: 'var(--pri)',
                            fontWeight: 600,
                            textDecoration: 'underline',
                          }}
                        >
                          View Document
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rejection / Note Input */}
              {isAskingChanges && (
                <div style={{ padding: '14px', backgroundColor: 'rgba(214, 86, 74, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bad)' }}>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--bad)', marginBottom: '6px' }}>
                    Feedback & Reason for Revision *
                  </label>
                  <textarea
                    rows={3}
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    placeholder="Explain what needs to be changed (e.g., 'Please re-upload a clear copy of your hotel registration certificate with seal visible')..."
                    data-testid="input-rejection-note"
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--bad)',
                      fontSize: 'var(--font-sm)',
                      backgroundColor: 'var(--card)',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                  />
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Button variant="secondary" size="sm" onClick={() => setIsAskingChanges(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() => handleDecision(inspectingItem.business_id, 'rejected', rejectionNote)}
                      data-testid="btn-confirm-rejection"
                    >
                      Send Revision Request
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Button
                variant="secondary"
                onClick={() => {
                  setInspectingItem(null);
                  setIsAskingChanges(false);
                }}
              >
                Close
              </Button>

              <div style={{ display: 'flex', gap: '8px' }}>
                {!isAskingChanges && (
                  <>
                    <Button
                      variant="secondary"
                      icon={<RotateCcw size={14} />}
                      onClick={() => setIsAskingChanges(true)}
                      data-testid="btn-modal-ask-changes"
                    >
                      Ask changes
                    </Button>
                    <Button
                      variant="primary"
                      icon={<Check size={14} />}
                      onClick={() => handleDecision(inspectingItem.business_id, 'approved', 'Approved credentials')}
                      data-testid="btn-modal-approve"
                    >
                      Approve & Publish Listings
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Listing Inspector Modal */}
      {inspectingListing && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(18, 50, 74, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--card)',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '820px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(18, 50, 74, 0.28)',
              border: '1.5px solid rgba(27, 79, 114, 0.18)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid rgba(27, 79, 114, 0.12)',
                background: 'linear-gradient(180deg, rgba(248, 250, 252, 0.9) 0%, rgba(255, 255, 255, 1) 100%)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, var(--pri), #1E40AF)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(47, 127, 193, 0.3)',
                    flexShrink: 0,
                  }}
                >
                  <Building2 size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <Tag variant="neutral">{inspectingListing.type_label || inspectingListing.type_code.toUpperCase()}</Tag>
                    <Tag
                      variant={
                        inspectingListing.status === 'published'
                          ? 'ok'
                          : inspectingListing.status === 'pending'
                          ? 'accent'
                          : 'neutral'
                      }
                    >
                      {inspectingListing.status.toUpperCase()}
                    </Tag>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                    {inspectingListing.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setInspectingListing(null)}
                style={{
                  background: 'var(--soft)',
                  border: '1px solid rgba(27, 79, 114, 0.12)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  color: 'var(--ink)',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.color = '#DC2626';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--soft)';
                  e.currentTarget.style.color = 'var(--ink)';
                  e.currentTarget.style.borderColor = 'rgba(27, 79, 114, 0.12)';
                }}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '22px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Business & Location Info */}
              <div
                style={{
                  backgroundColor: 'var(--card)',
                  borderRadius: '14px',
                  border: '1.5px solid rgba(27, 79, 114, 0.12)',
                  padding: '18px 20px',
                  boxShadow: '0 2px 8px rgba(18, 50, 74, 0.04)',
                }}
              >
                <h4
                  style={{
                    margin: '0 0 14px',
                    fontSize: '15px',
                    fontWeight: 800,
                    color: 'var(--ink)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Store size={16} color="var(--pri)" />
                  <span>Business & Location Details</span>
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '13.5px' }}>
                  <div style={{ padding: '8px 12px', backgroundColor: 'var(--soft)', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--mute)', display: 'block', fontSize: '11.5px', textTransform: 'uppercase', fontWeight: 700 }}>Business Name</span>
                    <strong style={{ color: 'var(--ink)', fontSize: '14px' }}>{inspectingListing.business_name || 'N/A'}</strong>
                  </div>
                  <div style={{ padding: '8px 12px', backgroundColor: 'var(--soft)', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--mute)', display: 'block', fontSize: '11.5px', textTransform: 'uppercase', fontWeight: 700 }}>Valley Area</span>
                    <strong style={{ color: 'var(--ink)', fontSize: '14px' }}>{inspectingListing.area_name || 'Swat Valley'}</strong>
                  </div>
                  <div style={{ padding: '8px 12px', backgroundColor: 'var(--soft)', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--mute)', display: 'block', fontSize: '11.5px', textTransform: 'uppercase', fontWeight: 700 }}>Contact Phone</span>
                    <strong style={{ color: 'var(--ink)', fontSize: '14px' }}>{inspectingListing.phone || 'N/A'}</strong>
                  </div>
                  <div style={{ padding: '8px 12px', backgroundColor: 'var(--soft)', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--mute)', display: 'block', fontSize: '11.5px', textTransform: 'uppercase', fontWeight: 700 }}>WhatsApp</span>
                    <strong style={{ color: 'var(--ink)', fontSize: '14px' }}>{inspectingListing.whatsapp_number || 'N/A'}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2', padding: '8px 12px', backgroundColor: 'var(--soft)', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--mute)', display: 'block', fontSize: '11.5px', textTransform: 'uppercase', fontWeight: 700 }}>Physical Address</span>
                    <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{inspectingListing.address_text || 'Swat Valley'}</span>
                  </div>
                  <div style={{ padding: '8px 12px', backgroundColor: 'var(--soft)', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--mute)', display: 'block', fontSize: '11.5px', textTransform: 'uppercase', fontWeight: 700 }}>GPS Coordinates</span>
                    <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{(Number(inspectingListing.latitude) || 35.2227).toFixed(4)}, {(Number(inspectingListing.longitude) || 72.4258).toFixed(4)}</span>
                  </div>
                  <div style={{ padding: '8px 12px', backgroundColor: 'var(--soft)', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--mute)', display: 'block', fontSize: '11.5px', textTransform: 'uppercase', fontWeight: 700 }}>Operating Hours</span>
                    <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{inspectingListing.opening_time || '08:00'} – {inspectingListing.closing_time || '22:00'}</span>
                  </div>
                </div>
              </div>

              {/* Type-Specific Details */}
              {inspectingListing.details && Object.keys(inspectingListing.details).length > 0 && (
                <div
                  style={{
                    backgroundColor: 'var(--card)',
                    borderRadius: '14px',
                    border: '1.5px solid rgba(27, 79, 114, 0.12)',
                    padding: '18px 20px',
                    boxShadow: '0 2px 8px rgba(18, 50, 74, 0.04)',
                  }}
                >
                  <h4
                    style={{
                      margin: '0 0 14px',
                      fontSize: '15px',
                      fontWeight: 800,
                      color: 'var(--ink)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Sparkles size={16} color="var(--pri)" />
                    <span>Operational Specifications</span>
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', fontSize: '13.5px' }}>
                    {Object.entries(inspectingListing.details).map(([key, value]) => (
                      <div key={key} style={{ padding: '8px 12px', backgroundColor: 'var(--soft)', borderRadius: '8px' }}>
                        <span style={{ color: 'var(--mute)', textTransform: 'capitalize', display: 'block', fontSize: '11.5px', fontWeight: 700 }}>
                          {key.replace(/_/g, ' ')}
                        </span>
                        <strong style={{ color: 'var(--ink)' }}>
                          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : Array.isArray(value) ? value.join(', ') : String(value)}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Services & Pricing Items */}
              <div
                style={{
                  backgroundColor: 'var(--card)',
                  borderRadius: '14px',
                  border: '1.5px solid rgba(27, 79, 114, 0.12)',
                  padding: '18px 20px',
                  boxShadow: '0 2px 8px rgba(18, 50, 74, 0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: '15px',
                      fontWeight: 800,
                      color: 'var(--ink)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <ShoppingBag size={16} color="var(--pri)" />
                    <span>Registered Services, Rooms & Rates ({inspectingListing.price_items?.length || 0})</span>
                  </h4>
                </div>

                {(!inspectingListing.price_items || inspectingListing.price_items.length === 0) ? (
                  <p style={{ fontSize: '13.5px', color: 'var(--mute)', margin: 0 }}>
                    No price items registered for this listing.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {inspectingListing.price_items.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: '1px solid rgba(27, 79, 114, 0.12)',
                          backgroundColor: 'var(--soft)',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--ink)' }}>
                              {item.name}
                            </span>
                            {item.category && <Tag variant="neutral">{item.category}</Tag>}
                            {item.capacity && (
                              <span style={{ fontSize: '12px', color: 'var(--mute)', fontWeight: 600 }}>
                                • Capacity: {item.capacity}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--mute)' }}>
                              {item.description}
                            </p>
                          )}
                        </div>

                        <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--pri)' }}>
                          PKR {Number(item.price).toLocaleString()}{' '}
                          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--mute)' }}>
                            / {item.unit.replace('_', ' ')}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid rgba(27, 79, 114, 0.1)',
                backgroundColor: 'rgba(248, 250, 252, 0.8)',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <Button
                variant="secondary"
                onClick={() => setInspectingListing(null)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  border: '1.5px solid rgba(27, 79, 114, 0.18)',
                  boxShadow: '0 2px 6px rgba(18, 50, 74, 0.05)',
                }}
              >
                Close Inspector
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
