import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  Search,
  Phone,
  Mail,
  Building2,
  MapPin,
  CheckCircle2,
  MessageSquare,
  Plus,
  RefreshCw,
  Trash2,
  Info,
  X,
  Hotel,
  Car,
  Sparkles,
  ShieldAlert,
  Copy,
} from 'lucide-react';
import { Button } from '../../design/Button';
import { Card } from '../../design/Card';

export type SystemUserRole = 'tourist' | 'business' | 'community' | 'authority' | 'admin';
export type UserStatus = 'active' | 'deactivated';

export interface ManagedUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  contact_no: string;
  role: SystemUserRole;
  business_name: string;
  business_type?: string;
  status: UserStatus;
  city_or_area: string;
  registered_at: string;
  last_active: string;
  verified: boolean;
  notes?: string;
}

const STORAGE_KEY = 'swat_admin_users_list';

const INITIAL_MANAGED_USERS: ManagedUser[] = [
  {
    id: 'usr-biz-01',
    full_name: 'Tariq Mehmood (General Manager)',
    email: 'hotel@swattourism.pk',
    phone: '+92-300-9990002',
    contact_no: '+92-946-710201',
    role: 'business',
    business_name: 'Swat Serena Hotel',
    business_type: 'hotel',
    status: 'active',
    city_or_area: 'Saidu Sharif, Swat',
    registered_at: '2026-01-10',
    last_active: '5 mins ago',
    verified: true,
    notes: 'Premium 5-Star Heritage Hotel approved by Tourism Directorate.',
  },
  {
    id: 'usr-biz-02',
    full_name: 'Sher Alam Khan',
    email: 'transport@swattourism.pk',
    phone: '+92-300-9990006',
    contact_no: '+92-300-8881122',
    role: 'business',
    business_name: 'Swat 4x4 Mountain Rides & Jeep Safari',
    business_type: 'transport',
    status: 'active',
    city_or_area: 'Kalam Valley & Mingora',
    registered_at: '2026-01-14',
    last_active: '18 mins ago',
    verified: true,
    notes: 'Licensed 4x4 Alpine Jeep Fleet serving Mahodand Lake and Kalam passes.',
  },
  {
    id: 'usr-biz-03',
    full_name: 'Fazal Rabbi',
    email: 'restaurant@swattourism.pk',
    phone: '+92-300-9990007',
    contact_no: '+92-300-7773344',
    role: 'business',
    business_name: 'The Hujra Traditional Cafe & Restaurant',
    business_type: 'restaurant',
    status: 'active',
    city_or_area: 'Fizagat Park, Mingora',
    registered_at: '2026-01-18',
    last_active: '42 mins ago',
    verified: true,
    notes: 'Authentic Pashtun cuisine, Shinwari barbecue, and local Swati trout specialties.',
  },
  {
    id: 'usr-biz-04',
    full_name: 'Bilal Tariq',
    email: 'kalam.continental@gmail.com',
    phone: '+92-312-9988771',
    contact_no: '+92-946-880120',
    role: 'business',
    business_name: 'Kalam Continental Luxury Suites',
    business_type: 'hotel',
    status: 'active',
    city_or_area: 'Upper Kalam, Swat',
    registered_at: '2026-02-01',
    last_active: '1 hour ago',
    verified: true,
    notes: 'Scenic riverfront lodge with heated alpine suites and mountain balcony views.',
  },
  {
    id: 'usr-biz-05',
    full_name: 'Naveed Bacha',
    email: 'naveed.rafting@yahoo.com',
    phone: '+92-321-7788990',
    contact_no: '+92-321-7788990',
    role: 'business',
    business_name: 'Swat River White Water Rafting Club',
    business_type: 'activity',
    status: 'deactivated',
    city_or_area: 'Madyan Riverfront',
    registered_at: '2025-11-20',
    last_active: '5 days ago',
    verified: false,
    notes: 'Temporarily deactivated pending annual safety equipment inspection and life vest audit.',
  },
  {
    id: 'usr-comm-01',
    full_name: 'Gul Zaman',
    email: 'community@swattourism.pk',
    phone: '+92-300-9990003',
    contact_no: '+92-345-9876543',
    role: 'community',
    business_name: 'Ushu Valley Homestay & Guided Alpine Treks',
    business_type: 'homestay',
    status: 'active',
    city_or_area: 'Ushu Valley, Kalam',
    registered_at: '2026-01-05',
    last_active: '2 hours ago',
    verified: true,
    notes: 'Certified local community guide and traditional wooden cottage host.',
  },
  {
    id: 'usr-comm-02',
    full_name: 'Master Rahim Khan Swati',
    email: 'swat.crafts@heritage.pk',
    phone: '+92-301-4433221',
    contact_no: '+92-301-4433221',
    role: 'community',
    business_name: 'Swat Heritage Woodcraft & Gem Collective',
    business_type: 'crafts',
    status: 'active',
    city_or_area: 'Islampur, Swat',
    registered_at: '2026-02-10',
    last_active: 'Yesterday',
    verified: true,
    notes: 'Master wood carver producing walnut furniture and emerald jewelry artifacts.',
  },
  {
    id: 'usr-comm-03',
    full_name: 'Bakhtawar Jan',
    email: 'bakhtawar.honey@gmail.com',
    phone: '+92-346-6655443',
    contact_no: '+92-346-6655443',
    role: 'community',
    business_name: 'Kalam Pure Mountain Honey & Berry Farms',
    business_type: 'producer',
    status: 'deactivated',
    city_or_area: 'Matiltan, Upper Kalam',
    registered_at: '2025-12-05',
    last_active: '12 days ago',
    verified: false,
    notes: 'Deactivated at user request during winter season hibernation.',
  },
  {
    id: 'usr-tour-01',
    full_name: 'Sara Ahmed',
    email: 'tourist@swattourism.pk',
    phone: '+92-300-9990001',
    contact_no: '+92-300-9990001',
    role: 'tourist',
    business_name: 'Individual Traveler (Tourist)',
    business_type: 'tourist',
    status: 'active',
    city_or_area: 'Islamabad / Swat Tour',
    registered_at: '2026-02-12',
    last_active: '12 mins ago',
    verified: true,
    notes: 'Frequent eco-tourist with active SOS beacon enabled.',
  },
  {
    id: 'usr-tour-02',
    full_name: 'Zainab Malik',
    email: 'zainab.malik@outlook.com',
    phone: '+92-333-8889911',
    contact_no: '+92-333-8889911',
    role: 'tourist',
    business_name: 'Individual Traveler (Tourist)',
    business_type: 'tourist',
    status: 'active',
    city_or_area: 'Lahore, Punjab',
    registered_at: '2026-02-20',
    last_active: '3 hours ago',
    verified: true,
    notes: 'Family winter vacation group leader.',
  },
  {
    id: 'usr-auth-01',
    full_name: 'District Tourism Officer',
    email: 'authority@swattourism.pk',
    phone: '+92-300-9990004',
    contact_no: '+92-946-924011',
    role: 'authority',
    business_name: 'Swat District Tourism Authority (KP Govt)',
    business_type: 'authority',
    status: 'active',
    city_or_area: 'Saidu Sharif Secretariat',
    registered_at: '2025-01-01',
    last_active: 'Active Now',
    verified: true,
    notes: 'Chief regulatory officer responsible for licensing and corridor safety.',
  },
  {
    id: 'usr-admin-01',
    full_name: 'Antigravity Super Admin',
    email: 'admin@swattourism.pk',
    phone: '+92-300-9990005',
    contact_no: '+92-946-924000',
    role: 'admin',
    business_name: 'Swat Tourism Platform Directorate',
    business_type: 'admin',
    status: 'active',
    city_or_area: 'Platform Operations Center',
    registered_at: '2025-01-01',
    last_active: 'Active Now',
    verified: true,
    notes: 'System Root Administrator with full governance privileges.',
  },
];

export const UserManagementView: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>(() => {
    try {
      const isCleaned = localStorage.getItem('swat_data_cleaned') === 'true';
      if (isCleaned) return [];
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse local stored users:', e);
    }
    return INITIAL_MANAGED_USERS;
  });

  // Try to sync with backend database users on mount
  useEffect(() => {
    const isCleaned = localStorage.getItem('swat_data_cleaned') === 'true';
    if (isCleaned) return;

    fetch('/api/v1/auth/admin/users')
      .then((res) => (res.ok ? res.json() : null))
      .then((dbUsers) => {
        if (Array.isArray(dbUsers) && dbUsers.length > 0) {
          const mapped: ManagedUser[] = dbUsers.map((u: any) => ({
            id: u.id,
            full_name: u.full_name,
            email: u.email || '',
            phone: u.phone || '',
            contact_no: u.business_profile?.contact_phone || u.phone || '+92-300-0000000',
            role: u.role,
            business_name: u.business_profile?.business_name || (u.role === 'tourist' ? 'Individual Traveler (Tourist)' : 'Platform Directorate'),
            business_type: u.business_profile?.primary_type || u.role,
            status: u.status === 'suspended' ? 'deactivated' : 'active',
            city_or_area: u.tourist_profile?.home_city || 'Swat Valley',
            registered_at: u.created_at ? u.created_at.split('T')[0] : 'Today',
            last_active: 'Active in system',
            verified: true,
            notes: 'Database verified account.',
          }));
          setUsers(mapped);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
        }
      })
      .catch(() => {});
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | SystemUserRole>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | UserStatus>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [inspectingUser, setInspectingUser] = useState<ManagedUser | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Clean all data function
  const handlePurgeAllData = async () => {
    if (typeof window !== 'undefined' && window.confirm && !window.confirm('Are you sure you want to completely clean up all transactional data and users? All bookings, listings, and mock users will be wiped so you can create everything manually.')) {
      return;
    }
    localStorage.setItem('swat_data_cleaned', 'true');
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    localStorage.removeItem('swat_token');
    localStorage.removeItem('swat_refresh_token');
    localStorage.removeItem('swat_community_host_applications');
    localStorage.removeItem('swat_trips');
    localStorage.removeItem('swat_my_trips');

    try {
      await fetch('/api/v1/auth/admin/reset-data', { method: 'POST' });
    } catch {}

    setUsers([]);
    showToast('All transactional data and mock users have been completely cleared! Fresh slate ready.');
  };

  // New user form state
  const [newUser, setNewUser] = useState<Partial<ManagedUser>>({
    full_name: '',
    email: '',
    phone: '',
    contact_no: '',
    role: 'business',
    business_name: '',
    business_type: 'hotel',
    city_or_area: 'Kalam, Swat',
    status: 'active',
    notes: '',
  });

  // Save changes to localStorage
  const saveUsers = (updated: ManagedUser[]) => {
    setUsers(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save users to localStorage', e);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Toggle Activate / Deactivate
  const handleToggleStatus = (userId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    const newStatus: UserStatus = target.status === 'active' ? 'deactivated' : 'active';
    const updated = users.map((u) => (u.id === userId ? { ...u, status: newStatus } : u));
    saveUsers(updated);

    if (inspectingUser && inspectingUser.id === userId) {
      setInspectingUser({ ...inspectingUser, status: newStatus });
    }

    if (newStatus === 'deactivated') {
      showToast(`User "${target.full_name}" has been deactivated. System access suspended.`);
    } else {
      showToast(`User "${target.full_name}" has been reactivated successfully.`);
    }
  };

  // Add new user
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.full_name || !newUser.contact_no) {
      alert('Please fill out Full Name and Contact Number.');
      return;
    }

    const created: ManagedUser = {
      id: `usr-${Date.now()}`,
      full_name: newUser.full_name.trim(),
      email: newUser.email?.trim() || `user_${Date.now()}@swattourism.pk`,
      phone: newUser.phone?.trim() || newUser.contact_no?.trim() || '',
      contact_no: newUser.contact_no.trim(),
      role: newUser.role || 'business',
      business_name:
        newUser.role === 'tourist'
          ? 'Individual Traveler (Tourist)'
          : (newUser.business_name?.trim() || 'Swat Local Business Enterprise'),
      business_type: newUser.business_type || 'hotel',
      status: (newUser.status as UserStatus) || 'active',
      city_or_area: newUser.city_or_area || 'Swat Valley',
      registered_at: new Date().toISOString().split('T')[0],
      last_active: 'Just registered',
      verified: true,
      notes: newUser.notes || 'Created via Admin Management Portal.',
    };

    const updated = [created, ...users];
    saveUsers(updated);
    setIsAddModalOpen(false);
    setNewUser({
      full_name: '',
      email: '',
      phone: '',
      contact_no: '',
      role: 'business',
      business_name: '',
      business_type: 'hotel',
      city_or_area: 'Kalam, Swat',
      status: 'active',
      notes: '',
    });
    showToast(`New user "${created.full_name}" registered and loaded successfully.`);
  };

  // Copy to clipboard helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    showToast(`Copied ${label}: ${text}`);
  };

  // Filtered dataset
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (selectedRole !== 'all' && u.role !== selectedRole) return false;
      // Status filter
      if (selectedStatus !== 'all' && u.status !== selectedStatus) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = u.full_name.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchBusiness = u.business_name.toLowerCase().includes(q);
        const matchPhone = u.contact_no.toLowerCase().includes(q) || u.phone.toLowerCase().includes(q);
        const matchCity = u.city_or_area.toLowerCase().includes(q);
        return matchName || matchEmail || matchBusiness || matchPhone || matchCity;
      }
      return true;
    });
  }, [users, selectedRole, selectedStatus, searchQuery]);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === 'active').length;
    const deactivated = users.filter((u) => u.status === 'deactivated').length;
    const businesses = users.filter((u) => u.role === 'business').length;
    const community = users.filter((u) => u.role === 'community').length;
    const tourists = users.filter((u) => u.role === 'tourist').length;
    return { total, active, deactivated, businesses, community, tourists };
  }, [users]);

  // Role tag styling helper
  const renderRoleBadge = (role: SystemUserRole, businessType?: string) => {
    switch (role) {
      case 'business':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(217, 119, 6, 0.12)',
              color: '#B45309',
              fontWeight: 700,
              fontSize: '11px',
              border: '1px solid rgba(217, 119, 6, 0.25)',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            {businessType === 'hotel' ? <Hotel size={12} /> : businessType === 'transport' ? <Car size={12} /> : <Building2 size={12} />}
            Business {businessType ? `• ${businessType}` : ''}
          </span>
        );
      case 'community':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#047857',
              fontWeight: 700,
              fontSize: '11px',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            <Sparkles size={12} /> Community Host
          </span>
        );
      case 'tourist':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              color: '#1D4ED8',
              fontWeight: 700,
              fontSize: '11px',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            <Users size={12} /> Tourist Traveler
          </span>
        );
      case 'authority':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(124, 58, 237, 0.12)',
              color: '#6D28D9',
              fontWeight: 700,
              fontSize: '11px',
              border: '1px solid rgba(124, 58, 237, 0.25)',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            <ShieldCheck size={12} /> Authority Officer
          </span>
        );
      case 'admin':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(225, 29, 72, 0.12)',
              color: '#BE123C',
              fontWeight: 700,
              fontSize: '11px',
              border: '1px solid rgba(225, 29, 72, 0.25)',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            <ShieldAlert size={12} /> Super Admin
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            padding: '14px 20px',
            borderRadius: '12px',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.28)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            fontWeight: 600,
            border: '1px solid rgba(255, 255, 255, 0.15)',
            animation: 'fadeIn 0.2s ease-in-out',
          }}
        >
          <CheckCircle2 size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Executive Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(27, 79, 114, 0.08) 0%, rgba(217, 119, 6, 0.05) 50%, rgba(16, 185, 129, 0.05) 100%)',
          border: '1px solid rgba(27, 79, 114, 0.16)',
          borderRadius: '16px',
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '18px',
          boxShadow: '0 4px 20px -2px rgba(27, 79, 114, 0.06)',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              backgroundColor: 'rgba(27, 79, 114, 0.1)',
              color: '#1B4F72',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}
          >
            <ShieldCheck size={14} /> Authority Governance &amp; Administration
          </div>
          <h2
            style={{
              fontSize: '26px',
              fontWeight: 800,
              color: 'var(--ink)',
              margin: '0 0 6px 0',
              letterSpacing: '-0.02em',
            }}
          >
            User Management &amp; Access Control
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--mute)',
              margin: 0,
              maxWidth: '680px',
              lineHeight: 1.5,
            }}
          >
            All registered system users loaded with their authorized role, business name, and official contact numbers. Admin can inspect credentials and toggle active/deactivated state in real time.
          </p>
        </div>

        {/* Quick Top Actions */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePurgeAllData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '10px',
              color: '#DC2626',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              backgroundColor: 'rgba(239, 68, 68, 0.06)',
            }}
            data-testid="btn-purge-all-data"
            title="Clean up all transactional data, listings, and users"
          >
            <Trash2 size={14} /> Clean Up All Data
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              localStorage.removeItem('swat_data_cleaned');
              saveUsers(INITIAL_MANAGED_USERS);
              showToast('Loaded demo template pack (12 users).');
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '10px' }}
            title="Load demo template dataset"
          >
            <RefreshCw size={14} /> Demo Pack
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '10px',
              boxShadow: '0 4px 14px rgba(27, 79, 114, 0.25)',
            }}
            data-testid="btn-add-new-user"
          >
            <Plus size={16} /> Register New User
          </Button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
        }}
      >
        <Card
          style={{
            padding: '16px 18px',
            borderRadius: '14px',
            border: '1px solid rgba(27, 79, 114, 0.12)',
            background: 'var(--card)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--mute)', textTransform: 'uppercase' }}>
              Total Users
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(27, 79, 114, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1B4F72',
              }}
            >
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--ink)' }}>{stats.total}</div>
          <div style={{ fontSize: '11px', color: 'var(--mute)', marginTop: '4px' }}>Entire Swat Platform Roster</div>
        </Card>

        <Card
          style={{
            padding: '16px 18px',
            borderRadius: '14px',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.04) 0%, var(--card) 100%)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>
              Active Accounts
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669',
              }}
            >
              <UserCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#059669' }}>{stats.active}</div>
          <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px', fontWeight: 600 }}>
            {Math.round((stats.active / (stats.total || 1)) * 100)}% Operating Normally
          </div>
        </Card>

        <Card
          style={{
            padding: '16px 18px',
            borderRadius: '14px',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.04) 0%, var(--card) 100%)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#B91C1C', textTransform: 'uppercase' }}>
              Deactivated / Inactive
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#DC2626',
              }}
            >
              <UserX size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: stats.deactivated > 0 ? '#DC2626' : 'var(--mute)' }}>
            {stats.deactivated}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--mute)', marginTop: '4px' }}>Suspended or Paused Access</div>
        </Card>

        <Card
          style={{
            padding: '16px 18px',
            borderRadius: '14px',
            border: '1px solid rgba(217, 119, 6, 0.2)',
            background: 'var(--card)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#B45309', textTransform: 'uppercase' }}>
              Business Operators
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(217, 119, 6, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#D97706',
              }}
            >
              <Building2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--ink)' }}>{stats.businesses}</div>
          <div style={{ fontSize: '11px', color: 'var(--mute)', marginTop: '4px' }}>Hotels, 4x4 Fleets, Cafes</div>
        </Card>

        <Card
          style={{
            padding: '16px 18px',
            borderRadius: '14px',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            background: 'var(--card)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase' }}>
              Tourists &amp; Community
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB',
              }}
            >
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--ink)' }}>
            {stats.tourists + stats.community}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--mute)', marginTop: '4px' }}>
            {stats.tourists} Tourists • {stats.community} Hosts
          </div>
        </Card>
      </div>

      {/* Control Bar: Search, Role Pills & View Mode */}
      <Card
        style={{
          padding: '16px 20px',
          borderRadius: '14px',
          border: '1px solid rgba(27, 79, 114, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          background: 'var(--card)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {/* Search Box */}
          <div
            style={{
              position: 'relative',
              flex: '1 1 320px',
              minWidth: '260px',
            }}
          >
            <Search
              size={17}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--mute)',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by full name, business name, email, or contact number..."
              data-testid="input-user-search"
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
                borderRadius: '10px',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--bg)',
                color: 'var(--ink)',
                fontSize: '13px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--mute)',
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Status Filter Dropdown */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mute)' }}>Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as 'all' | UserStatus)}
              data-testid="select-status-filter"
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--bg)',
                color: 'var(--ink)',
                fontSize: '13px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Statuses ({users.length})</option>
              <option value="active">Active Only ({stats.active})</option>
              <option value="deactivated">Deactivated Only ({stats.deactivated})</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg)',
              borderRadius: '8px',
              padding: '3px',
              border: '1px solid var(--line)',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'table' ? 'var(--card)' : 'transparent',
                color: viewMode === 'table' ? 'var(--ink)' : 'var(--mute)',
                fontWeight: viewMode === 'table' ? 700 : 500,
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Table View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'cards' ? 'var(--card)' : 'transparent',
                color: viewMode === 'cards' ? 'var(--ink)' : 'var(--mute)',
                fontWeight: viewMode === 'cards' ? 700 : 500,
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: viewMode === 'cards' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Cards View
            </button>
          </div>
        </div>

        {/* Role Filtering Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '2px',
            borderTop: '1px solid var(--line)',
            paddingTop: '12px',
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedRole('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: selectedRole === 'all' ? 'var(--pri)' : 'var(--line)',
              backgroundColor: selectedRole === 'all' ? 'var(--pri)' : 'var(--bg)',
              color: selectedRole === 'all' ? '#FFFFFF' : 'var(--ink)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            All Roles ({users.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('business')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: selectedRole === 'business' ? '#D97706' : 'var(--line)',
              backgroundColor: selectedRole === 'business' ? '#D97706' : 'var(--bg)',
              color: selectedRole === 'business' ? '#FFFFFF' : 'var(--ink)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            🏢 Businesses ({stats.businesses})
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('community')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: selectedRole === 'community' ? '#10B981' : 'var(--line)',
              backgroundColor: selectedRole === 'community' ? '#10B981' : 'var(--bg)',
              color: selectedRole === 'community' ? '#FFFFFF' : 'var(--ink)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            ✨ Community Hosts ({stats.community})
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('tourist')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: selectedRole === 'tourist' ? '#3B82F6' : 'var(--line)',
              backgroundColor: selectedRole === 'tourist' ? '#3B82F6' : 'var(--bg)',
              color: selectedRole === 'tourist' ? '#FFFFFF' : 'var(--ink)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            🎒 Tourists ({stats.tourists})
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('authority')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: selectedRole === 'authority' ? '#7C3AED' : 'var(--line)',
              backgroundColor: selectedRole === 'authority' ? '#7C3AED' : 'var(--bg)',
              color: selectedRole === 'authority' ? '#FFFFFF' : 'var(--ink)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            🛡️ Authority Officers
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('admin')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: selectedRole === 'admin' ? '#E11D48' : 'var(--line)',
              backgroundColor: selectedRole === 'admin' ? '#E11D48' : 'var(--bg)',
              color: selectedRole === 'admin' ? '#FFFFFF' : 'var(--ink)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            ⚡ Super Admin
          </button>
        </div>
      </Card>

      {/* Empty State */}
      {users.length === 0 ? (
        <Card
          style={{
            padding: '54px 28px',
            textAlign: 'center',
            borderRadius: '16px',
            border: '2px dashed rgba(27, 79, 114, 0.25)',
            background: 'linear-gradient(180deg, rgba(27, 79, 114, 0.03) 0%, var(--card) 100%)',
          }}
          data-testid="clean-slate-card"
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              backgroundColor: 'rgba(27, 79, 114, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1B4F72',
              margin: '0 auto 18px auto',
            }}
          >
            <Users size={32} />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--ink)' }}>
            System Data Cleaned &amp; Fresh Slate
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--mute)', margin: '0 auto 24px auto', maxWidth: '540px', lineHeight: 1.5 }}>
            All transactional data, bookings, listings, and mock user accounts have been completely purged. You can now register and configure your own businesses, community hosts, and users manually to test the application end-to-end.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsAddModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              data-testid="btn-register-first-user"
            >
              <Plus size={16} /> Register First User / Business
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                localStorage.removeItem('swat_data_cleaned');
                saveUsers(INITIAL_MANAGED_USERS);
                showToast('Loaded demo template pack (12 users).');
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={15} /> Load Demo Template Pack
            </Button>
          </div>
        </Card>
      ) : filteredUsers.length === 0 ? (
        <Card
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            borderRadius: '16px',
            border: '1.5px dashed var(--line)',
          }}
        >
          <Users size={48} color="var(--mute)" style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
          <h4 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0' }}>No Matching Users Found</h4>
          <p style={{ fontSize: '13px', color: 'var(--mute)', margin: '0 0 16px 0' }}>
            No registered users match your search criteria or filter selections.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedRole('all');
              setSelectedStatus('all');
            }}
          >
            Clear Filters &amp; Show All
          </Button>
        </Card>
      ) : null}

      {/* Main Data Presentation: Table View */}
      {filteredUsers.length > 0 && viewMode === 'table' && (
        <Card
          style={{
            borderRadius: '16px',
            border: '1px solid rgba(27, 79, 114, 0.14)',
            overflow: 'hidden',
            padding: 0,
            background: 'var(--card)',
            boxShadow: '0 4px 20px -2px rgba(27, 79, 114, 0.05)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '13px',
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: 'rgba(27, 79, 114, 0.04)',
                    borderBottom: '1.5px solid rgba(27, 79, 114, 0.12)',
                    color: 'var(--mute)',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <th style={{ padding: '14px 20px' }}>User / Identity</th>
                  <th style={{ padding: '14px 16px' }}>Role</th>
                  <th style={{ padding: '14px 16px' }}>Registered Business Name</th>
                  <th style={{ padding: '14px 16px' }}>Contact Number</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Admin Governance</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, idx) => {
                  const isActive = user.status === 'active';
                  return (
                    <tr
                      key={user.id}
                      onClick={() => setInspectingUser(user)}
                      style={{
                        borderBottom: '1px solid var(--line)',
                        backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(27, 79, 114, 0.015)',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(27, 79, 114, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          idx % 2 === 0 ? 'transparent' : 'rgba(27, 79, 114, 0.015)';
                      }}
                      data-testid={`user-row-${user.id}`}
                    >
                      {/* User / Identity */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              backgroundColor: isActive ? 'rgba(27, 79, 114, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                              color: isActive ? '#1B4F72' : '#DC2626',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '14px',
                              flexShrink: 0,
                              border: isActive ? '1.5px solid rgba(27, 79, 114, 0.2)' : '1.5px solid rgba(239, 68, 68, 0.3)',
                            }}
                          >
                            {user.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {user.full_name}
                              {user.verified && (
                                <span title="Verified System User" style={{ color: '#059669', display: 'inline-flex' }}>
                                  <CheckCircle2 size={14} />
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--mute)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Mail size={11} /> {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '16px 16px' }}>
                        {renderRoleBadge(user.role, user.business_type)}
                      </td>

                      {/* Registered Business Name */}
                      <td style={{ padding: '16px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {user.role === 'business' || user.role === 'community' ? (
                            <Building2 size={16} color="#B45309" style={{ flexShrink: 0 }} />
                          ) : (
                            <Users size={16} color="var(--mute)" style={{ flexShrink: 0 }} />
                          )}
                          <div>
                            <div
                              style={{
                                fontWeight: 700,
                                color: user.role === 'business' || user.role === 'community' ? 'var(--ink)' : 'var(--mute)',
                                fontSize: '13px',
                              }}
                            >
                              {user.business_name}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--mute)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <MapPin size={10} /> {user.city_or_area}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Number */}
                      <td style={{ padding: '16px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <a
                            href={`tel:${user.contact_no}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: '#1B4F72',
                              fontWeight: 700,
                              textDecoration: 'none',
                              fontSize: '13px',
                            }}
                            title="Click to place phone call"
                          >
                            <Phone size={13} /> {user.contact_no}
                          </a>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(user.contact_no, 'Contact Number');
                              }}
                              style={{
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                color: 'var(--mute)',
                                fontSize: '10px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px',
                                padding: 0,
                              }}
                              title="Copy contact number"
                            >
                              <Copy size={10} /> Copy
                            </button>
                            <span style={{ color: 'var(--line)', fontSize: '10px' }}>•</span>
                            <a
                              href={`https://wa.me/${user.contact_no.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                color: '#059669',
                                fontSize: '10px',
                                fontWeight: 600,
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px',
                              }}
                              title="Open WhatsApp chat"
                            >
                              <MessageSquare size={10} /> WhatsApp
                            </a>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 16px' }}>
                        {isActive ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              backgroundColor: 'rgba(16, 185, 129, 0.12)',
                              color: '#047857',
                              fontWeight: 700,
                              fontSize: '11px',
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                            }}
                          >
                            <span
                              style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                backgroundColor: '#10B981',
                                boxShadow: '0 0 6px #10B981',
                              }}
                            />
                            Active
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              backgroundColor: 'rgba(239, 68, 68, 0.12)',
                              color: '#B91C1C',
                              fontWeight: 700,
                              fontSize: '11px',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                            }}
                          >
                            <span
                              style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                backgroundColor: '#EF4444',
                              }}
                            />
                            Deactivated
                          </span>
                        )}
                      </td>

                      {/* Admin Governance Actions */}
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={(e) => handleToggleStatus(user.id, e)}
                            data-testid={`btn-toggle-status-${user.id}`}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: isActive ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(16, 185, 129, 0.35)',
                              backgroundColor: isActive ? 'rgba(239, 68, 68, 0.06)' : 'rgba(16, 185, 129, 0.08)',
                              color: isActive ? '#DC2626' : '#059669',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              transition: 'all 0.15s ease',
                            }}
                            title={isActive ? 'Click to suspend and deactivate user' : 'Click to reactivate user'}
                          >
                            {isActive ? (
                              <>
                                <UserX size={14} /> Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck size={14} /> Activate
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectingUser(user);
                            }}
                            data-testid={`btn-inspect-user-${user.id}`}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: '1px solid var(--line)',
                              backgroundColor: 'var(--card)',
                              color: 'var(--ink)',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Info size={13} /> Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Main Data Presentation: Cards Grid View */}
      {filteredUsers.length > 0 && viewMode === 'cards' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredUsers.map((user) => {
            const isActive = user.status === 'active';
            return (
              <Card
                key={user.id}
                onClick={() => setInspectingUser(user)}
                style={{
                  borderRadius: '16px',
                  border: isActive ? '1px solid rgba(27, 79, 114, 0.14)' : '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  cursor: 'pointer',
                  position: 'relative',
                  background: 'var(--card)',
                  boxShadow: '0 4px 16px -2px rgba(27, 79, 114, 0.06)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px -2px rgba(27, 79, 114, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px -2px rgba(27, 79, 114, 0.06)';
                }}
              >
                {/* Card Top: Identity & Role */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        backgroundColor: isActive ? 'rgba(27, 79, 114, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: isActive ? '#1B4F72' : '#DC2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '16px',
                      }}
                    >
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--ink)', fontSize: '15px' }}>{user.full_name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--mute)' }}>{user.email}</div>
                    </div>
                  </div>
                  {renderRoleBadge(user.role, user.business_type)}
                </div>

                {/* Business Name Highlight */}
                <div
                  style={{
                    backgroundColor: 'rgba(27, 79, 114, 0.04)',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(27, 79, 114, 0.08)',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mute)', textTransform: 'uppercase', marginBottom: '2px' }}>
                    Registered Business / Enterprise
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={14} color="#B45309" />
                    {user.business_name}
                  </div>
                </div>

                {/* Contact & Location Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--mute)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Phone size={13} /> Contact No:
                    </span>
                    <a
                      href={`tel:${user.contact_no}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{ fontWeight: 700, color: '#1B4F72', textDecoration: 'none' }}
                    >
                      {user.contact_no}
                    </a>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--mute)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin size={13} /> Location:
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{user.city_or_area}</span>
                  </div>
                </div>

                {/* Card Bottom: Status & Toggle Button */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid var(--line)',
                    paddingTop: '12px',
                    marginTop: 'auto',
                  }}
                >
                  <div>
                    {isActive ? (
                      <span style={{ color: '#059669', fontWeight: 700, fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                        Active User
                      </span>
                    ) : (
                      <span style={{ color: '#DC2626', fontWeight: 700, fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                        Deactivated
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleToggleStatus(user.id, e)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: isActive ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(16, 185, 129, 0.35)',
                      backgroundColor: isActive ? 'rgba(239, 68, 68, 0.06)' : 'rgba(16, 185, 129, 0.08)',
                      color: isActive ? '#DC2626' : '#059669',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    {isActive ? (
                      <>
                        <UserX size={14} /> Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck size={14} /> Activate
                      </>
                    )}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Inspect User Dossier */}
      {inspectingUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setInspectingUser(null)}
          data-testid="modal-inspect-user"
        >
          <div
            style={{
              backgroundColor: 'var(--card)',
              borderRadius: '20px',
              maxWidth: '560px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 45px rgba(0,0,0,0.3)',
              border: '1px solid rgba(27, 79, 114, 0.18)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '16px',
                    backgroundColor: inspectingUser.status === 'active' ? 'rgba(27, 79, 114, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    color: inspectingUser.status === 'active' ? '#1B4F72' : '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '20px',
                  }}
                >
                  {inspectingUser.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--ink)' }}>
                    {inspectingUser.full_name}
                  </h3>
                  <div style={{ marginTop: '4px' }}>
                    {renderRoleBadge(inspectingUser.role, inspectingUser.business_type)}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingUser(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mute)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Status Banner inside Modal */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: inspectingUser.status === 'active' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                border: inspectingUser.status === 'active' ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: inspectingUser.status === 'active' ? '#047857' : '#B91C1C' }}>
                  Current System State
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: inspectingUser.status === 'active' ? '#059669' : '#DC2626' }}>
                  {inspectingUser.status === 'active' ? 'Active & Authorized' : 'Deactivated / Access Suspended'}
                </div>
              </div>
              <Button
                variant={inspectingUser.status === 'active' ? 'accent' : 'primary'}
                size="sm"
                onClick={() => handleToggleStatus(inspectingUser.id)}
                data-testid="modal-btn-toggle-status"
              >
                {inspectingUser.status === 'active' ? 'Deactivate Now' : 'Reactivate User'}
              </Button>
            </div>

            {/* Profile Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: 'var(--bg)', padding: '12px 14px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--mute)', fontWeight: 600 }}>Registered Business Name</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginTop: '2px' }}>
                  {inspectingUser.business_name}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg)', padding: '12px 14px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--mute)', fontWeight: 600 }}>Primary Contact Number</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B4F72', marginTop: '2px' }}>
                  {inspectingUser.contact_no}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg)', padding: '12px 14px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--mute)', fontWeight: 600 }}>Email Address</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginTop: '2px' }}>
                  {inspectingUser.email}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg)', padding: '12px 14px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--mute)', fontWeight: 600 }}>Corridor / Location</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginTop: '2px' }}>
                  {inspectingUser.city_or_area}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg)', padding: '12px 14px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--mute)', fontWeight: 600 }}>Registration Date</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginTop: '2px' }}>
                  {inspectingUser.registered_at}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg)', padding: '12px 14px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--mute)', fontWeight: 600 }}>Last System Activity</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginTop: '2px' }}>
                  {inspectingUser.last_active}
                </div>
              </div>
            </div>

            {/* Notes */}
            {inspectingUser.notes && (
              <div
                style={{
                  backgroundColor: 'rgba(27, 79, 114, 0.04)',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(27, 79, 114, 0.08)',
                  marginBottom: '20px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mute)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Authority Audit &amp; Compliance Notes
                </div>
                <div style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.5 }}>
                  {inspectingUser.notes}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="secondary" onClick={() => setInspectingUser(null)}>
                Close Dossier
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Register New System User */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setIsAddModalOpen(false)}
          data-testid="modal-add-user"
        >
          <div
            style={{
              backgroundColor: 'var(--card)',
              borderRadius: '20px',
              maxWidth: '540px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 45px rgba(0,0,0,0.3)',
              border: '1px solid rgba(27, 79, 114, 0.18)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--ink)' }}>
                  Register New System User
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--mute)' }}>
                  Add a business operator, community host, or traveler to the central directory.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mute)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ink)', marginBottom: '5px' }}>
                  Full Name / Operator Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Javed Khan or Kalam Mountain Lodge"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                  data-testid="input-new-user-fullname"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ink)', marginBottom: '5px' }}>
                    Contact Number (Phone/Mobile) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+92-300-1234567"
                    value={newUser.contact_no}
                    onChange={(e) => setNewUser({ ...newUser, contact_no: e.target.value, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                    data-testid="input-new-user-contact"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ink)', marginBottom: '5px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="operator@swattourism.pk"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                    data-testid="input-new-user-email"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ink)', marginBottom: '5px' }}>
                    System Role
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as SystemUserRole })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                      fontSize: '13px',
                    }}
                    data-testid="select-new-user-role"
                  >
                    <option value="business">Business Operator</option>
                    <option value="community">Community Host / Guide</option>
                    <option value="tourist">Tourist Traveler</option>
                    <option value="authority">Authority Officer</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ink)', marginBottom: '5px' }}>
                    Initial Status
                  </label>
                  <select
                    value={newUser.status}
                    onChange={(e) => setNewUser({ ...newUser, status: e.target.value as UserStatus })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                      fontSize: '13px',
                    }}
                  >
                    <option value="active">Active (Granted Access)</option>
                    <option value="deactivated">Deactivated (Suspended)</option>
                  </select>
                </div>
              </div>

              {newUser.role !== 'tourist' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ink)', marginBottom: '5px' }}>
                    Registered Business / Enterprise Name *
                  </label>
                  <input
                    type="text"
                    placeholder="E.g., Swat Pine Valley Resort"
                    value={newUser.business_name}
                    onChange={(e) => setNewUser({ ...newUser, business_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                    data-testid="input-new-user-business-name"
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ink)', marginBottom: '5px' }}>
                  Corridor / City / Area
                </label>
                <input
                  type="text"
                  placeholder="E.g., Kalam, Saidu Sharif, Bahrain, Malam Jabba"
                  value={newUser.city_or_area}
                  onChange={(e) => setNewUser({ ...newUser, city_or_area: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <Button variant="secondary" type="button" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" data-testid="btn-submit-new-user">
                  Save &amp; Load User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
