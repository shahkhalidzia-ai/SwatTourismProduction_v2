import React, { useState, useEffect } from 'react';
import { Card } from '../../design/Card';
import { Button } from '../../design/Button';
import { Tag } from '../../design/Tag';
import {
  Plus,
  BookOpen,
  ShoppingBag,
  FileWarning,
  Users,
  MapPin,
  CheckCircle2,
  X,
  User,
  LogOut,
  Save,
  Send,
  Compass,
  Calendar,
  Sparkles,
  FileText,
  Car,
  Waves,
  Trash2,
} from 'lucide-react';
import { apiRequest } from '../../api/client';
import { ThemeAppearanceSection } from '../../components/ThemeAppearanceSection';
import {
  fetchPublishedPosts,
  createPost,
  createIssueReport,
  fetchMyReports,
  applyToHost,
  fetchMyHostApplications,
  addStoredHostApplication,
  getStoredHostApplications,
  removeStoredHostApplication,
  deleteHostApplication,
  SWAT_COMMUNITY_APPS_EVENT,
  type CommunityPost,
  type IssueReport,
  type HostApplication,
  type PostType,
  type IssueCategory,
  type HostOfferType,
} from '../../api/community';
import { getAreas, type Area } from '../../api/trips';
import { useAuth } from '../../context/AuthContext';

interface CommunityShellProps {
  activeTab: string;
}

const DEMO_STORIES: CommunityPost[] = [
  {
    id: 'post-1',
    author_id: 'user-gul',
    author_name: 'Gul Zaman',
    post_type: 'hidden_spot',
    title: 'Secret Waterfall in Utror Valley',
    body: 'A 30-minute peaceful hike past the wooden suspension bridge leads to this crystal clear glacier cascade untouched by commercial tourist crowds. Best visited in the early morning sunlight when the valley mist lifts.',
    area_name: 'Utror',
    latitude: 35.5012,
    longitude: 72.4821,
    status: 'published',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'post-2',
    author_id: 'user-rashid',
    author_name: 'Rashid Minhas',
    post_type: 'story',
    title: 'The Centuries-Old Walnut Woodcarvers of Madyan',
    body: 'Walking through the back alleys of Madyan, you can hear the gentle tapping of chisels. Master artisans here have crafted cedar and walnut doors for five generations, each pattern representing Swati heritage.',
    area_name: 'Madyan',
    status: 'published',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'post-3',
    author_id: 'user-bakht',
    author_name: 'Bakht Rawan',
    post_type: 'tip',
    title: 'Autumn Trout Fishing Secrets in Upper Swat',
    body: 'October brings cool river currents and pristine conditions for river trout near Bahrain and Kalam. Remember to always purchase a local fishing permit from the Fisheries checkpoint and pack all litter.',
    area_name: 'Bahrain',
    status: 'published',
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date(Date.now() - 259200000).toISOString(),
  },
];

export const CommunityShell: React.FC<CommunityShellProps> = ({ activeTab }) => {
  const { user, refreshUser, logout } = useAuth();
  // Master data
  const [areas, setAreas] = useState<Area[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>(DEMO_STORIES);
  const [myReports, setMyReports] = useState<IssueReport[]>([]);
  const [myApplications, setMyApplications] = useState<HostApplication[]>(() => {
    try {
      const stored = getStoredHostApplications();
      return stored.filter((a) => a && !['host-demo-2', 'host-demo-3', 'host-demo-4'].includes(a.id));
    } catch {
      return [];
    }
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Community Profile Tab State (Gap 1.2)
  const [profileFullName, setProfileFullName] = useState(user?.full_name || 'Gul Zaman');
  const [profileBio, setProfileBio] = useState(
    user?.community_profile?.bio ||
    'Local trekking guide, heritage advocate and community homestay host based in Utror, Swat Valley.'
  );
  const [profileMemberType, setProfileMemberType] = useState<string>(
    user?.community_profile?.member_type || 'host'
  );
  const [profilePhone, setProfilePhone] = useState(user?.phone || '+92 301 5544332');
  const [isSavingCommunityProfile, setIsSavingCommunityProfile] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.full_name) setProfileFullName(user.full_name);
      if (user.phone) setProfilePhone(user.phone);
      if (user.community_profile?.bio) setProfileBio(user.community_profile.bio);
      if (user.community_profile?.member_type) setProfileMemberType(user.community_profile.member_type);
    }
  }, [user]);

  const handleSaveCommunityProfile = async () => {
    setIsSavingCommunityProfile(true);
    try {
      await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: profileFullName.trim(),
          bio: profileBio.trim(),
          member_type: profileMemberType,
        }),
      });
      if (refreshUser) await refreshUser();
      showToast('Community profile updated successfully!');
    } catch {
      showToast('Profile updated (local demo mode)!');
    } finally {
      setIsSavingCommunityProfile(false);
    }
  };

  const isApprovedHost = Boolean(
    user?.community_profile?.is_host_approved ||
    myApplications.some((app) => app.status === 'approved')
  );

  // Stories Filter
  const [selectedPostType, setSelectedPostType] = useState<string>('all');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [newPost, setNewPost] = useState<{
    post_type: PostType;
    title: string;
    body: string;
    area_id: string;
    latitude: string;
    longitude: string;
  }>({
    post_type: 'story',
    title: '',
    body: '',
    area_id: '',
    latitude: '35.4851',
    longitude: '72.5852',
  });

  // Issue Reporting Form State
  const [reportCategory, setReportCategory] = useState<IssueCategory>('road_blocked');
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportAreaId, setReportAreaId] = useState('');
  const [reportLat, setReportLat] = useState('35.2051');
  const [reportLng, setReportLng] = useState('72.5521');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // Host Application & Local Services Form State
  const [hostOfferType, setHostOfferType] = useState<HostOfferType>('homestay');
  const [hostDescription, setHostDescription] = useState('');
  const [hostSubmitting, setHostSubmitting] = useState(false);
  const [hostVehicleModel, setHostVehicleModel] = useState('');
  const [hostVehicleReg, setHostVehicleReg] = useState('');
  const [hostVehicleCapacity, setHostVehicleCapacity] = useState('5-7 Passengers');
  const [hostGuideLanguages, setHostGuideLanguages] = useState('Pashto, Urdu, English');
  const [hostGuideSpecialties, setHostGuideSpecialties] = useState('Mountain Trekking, Lakes & Valleys');
  const [hostActivityName, setHostActivityName] = useState('Swat River Rafting / Ski Lessons');
  const [hostCraftType, setHostCraftType] = useState('Swati Woolen Shawls & Acacia Honey');
  const [hostDailyRate, setHostDailyRate] = useState('');
  const [hostContactPhone, setHostContactPhone] = useState(user?.phone || '+92 345 1234567');
  const [hostAreaName, setHostAreaName] = useState('Kalam Valley');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const isMyApplication = (app: HostApplication) => {
    if (!app) return false;
    // 1. Matches current user ID
    if (user?.id && (app.user_id === user.id || app.user_id === `user-${user.id}`)) return true;
    // 2. Generic fallback user_id from offline/demo submission
    if (app.user_id === 'current-user' || app.user_id === 'cp-1') return true;
    // 3. Matches current user email or name
    if (user?.email && app.applicant_email && app.applicant_email.toLowerCase() === user.email.toLowerCase()) return true;
    if (user?.full_name && app.applicant_name && app.applicant_name.toLowerCase() === user.full_name.toLowerCase()) return true;

    // 4. Filter out other demo personas unless current user explicitly matches them
    const otherDemoPersonas = ['host-demo-2', 'host-demo-3', 'host-demo-4'];
    if (otherDemoPersonas.includes(app.id)) {
      if (user?.email && app.applicant_email && app.applicant_email.toLowerCase() === user.email.toLowerCase()) {
        return true;
      }
      return false;
    }

    // 5. Default demo community host (Gul Zaman) homestay in seed data
    if (app.id === 'host-demo-1') {
      return !user?.role || user.role === 'community';
    }

    // 6. Any other service (custom host-* or UUID created by backend) was created by the user in this session/account
    return true;
  };

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [areasList, publishedPosts] = await Promise.all([
          getAreas().catch(() => []),
          fetchPublishedPosts().catch(() => []),
        ]);
        if (isMounted) {
          if (areasList && areasList.length > 0) setAreas(areasList);
          if (publishedPosts && publishedPosts.length > 0) {
            setPosts((current) => {
              const existingIds = new Set(publishedPosts.map((p) => p.id));
              const newlyAdded = current.filter(
                (p) => !existingIds.has(p.id) && !DEMO_STORIES.some((d) => d.id === p.id)
              );
              return [...newlyAdded, ...publishedPosts];
            });
          }
        }

        const token = localStorage.getItem('swat_token');
        const [reports, apps] = await Promise.all([
          token ? fetchMyReports().catch(() => []) : Promise.resolve([]),
          token ? fetchMyHostApplications().catch(() => []) : Promise.resolve([]),
        ]);
        if (isMounted) {
          if (reports && reports.length > 0) setMyReports(reports);
          const serverList = Array.isArray(apps) ? apps : [];
          // Sync server applications into local storage cache
          for (const sApp of serverList) {
            addStoredHostApplication(sApp);
          }
          const stored = getStoredHostApplications();
          const serverIds = new Set(serverList.map((a) => a.id));

          // Merge: all server apps + local stored apps belonging to this member
          const localOnly = stored.filter((s) => !serverIds.has(s.id) && isMyApplication(s));
          const combined = [...serverList, ...localOnly];

          if (combined.length > 0) {
            setMyApplications(combined);
          } else {
            const memberStored = stored.filter((s) => isMyApplication(s));
            setMyApplications(memberStored);
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
  }, [user]);

  // Sync community applications in real-time when approved by Authority, updated, or removed
  useEffect(() => {
    const handleAppsUpdate = () => {
      const stored = getStoredHostApplications();
      setMyApplications((prev) => {
        const storedMap = new Map(stored.map((s) => [s.id, s]));
        const prevIds = new Set(prev.map((p) => p.id));

        // Keep existing apps updated with latest review status from stored; remove if deleted from stored
        const updated = prev
          .filter((p) => storedMap.has(p.id))
          .map((p) => storedMap.get(p.id) || p);

        // Include any new apps added for this member
        for (const s of stored) {
          if (!prevIds.has(s.id) && isMyApplication(s)) {
            updated.unshift(s);
          }
        }
        return updated;
      });
    };
    window.addEventListener(SWAT_COMMUNITY_APPS_EVENT, handleAppsUpdate);
    window.addEventListener('storage', handleAppsUpdate);
    return () => {
      window.removeEventListener(SWAT_COMMUNITY_APPS_EVENT, handleAppsUpdate);
      window.removeEventListener('storage', handleAppsUpdate);
    };
  }, [user]);

  // ---------------------------------------------------------------------------
  // Post Submission Handler
  // ---------------------------------------------------------------------------
  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.body.trim()) {
      alert('Please fill out both the title and story description.');
      return;
    }

    try {
      const created = await createPost({
        post_type: newPost.post_type,
        title: newPost.title,
        body: newPost.body,
        area_id: newPost.area_id || undefined,
        latitude: parseFloat(newPost.latitude) || undefined,
        longitude: parseFloat(newPost.longitude) || undefined,
      });
      setPosts((prev) => [created, ...prev]);
    } catch {
      // Offline fallback for smooth demo
      const selectedArea = areas.find((a) => a.id === newPost.area_id);
      const fallbackPost: CommunityPost = {
        id: 'post-' + Date.now(),
        author_id: 'user-current',
        author_name: 'Local Resident',
        post_type: newPost.post_type,
        title: newPost.title,
        body: newPost.body,
        area_id: newPost.area_id || undefined,
        area_name: selectedArea ? selectedArea.name : 'Swat Valley',
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setPosts((prev) => [fallbackPost, ...prev]);
    }

    setIsShareModalOpen(false);
    setNewPost({
      post_type: 'story',
      title: '',
      body: '',
      area_id: '',
      latitude: '35.4851',
      longitude: '72.5852',
    });
    showToast('Your community story has been shared with Swat travellers!');
  };

  // ---------------------------------------------------------------------------
  // Report Submission Handler
  // ---------------------------------------------------------------------------
  const handleSubmitReport = async () => {
    if (!reportTitle.trim() || !reportDescription.trim()) {
      alert('Please provide a summary title and detailed issue description.');
      return;
    }

    setReportSubmitting(true);
    try {
      const created = await createIssueReport({
        category: reportCategory,
        title: reportTitle,
        description: reportDescription,
        area_id: reportAreaId || undefined,
        latitude: parseFloat(reportLat) || undefined,
        longitude: parseFloat(reportLng) || undefined,
      });
      setMyReports((prev) => [created, ...prev]);
      setReportTitle('');
      setReportDescription('');
      showToast('Issue report logged and forwarded to Swat District Control!');
    } catch {
      // Local fallback for prototype testing
      const selectedArea = areas.find((a) => a.id === reportAreaId);
      const fallbackReport: IssueReport = {
        id: 'rep-' + Date.now(),
        reporter_id: 'current-user',
        category: reportCategory,
        title: reportTitle,
        description: reportDescription,
        area_id: reportAreaId || undefined,
        area_name: selectedArea ? selectedArea.name : 'Bahrain',
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setMyReports((prev) => [fallbackReport, ...prev]);
      setReportTitle('');
      setReportDescription('');
      showToast('Report logged locally. Authorities notified.');
    } finally {
      setReportSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Host Application & Local Service Submission Handler
  // ---------------------------------------------------------------------------
  const handleApplyHost = async () => {
    let detailedDesc = hostDescription.trim();
    if (hostOfferType === 'transport' && hostVehicleModel.trim()) {
      const parts = [`4x4 Vehicle: ${hostVehicleModel.trim()}`];
      if (hostVehicleReg.trim()) parts.push(`Reg: ${hostVehicleReg.trim()}`);
      if (hostVehicleCapacity.trim()) parts.push(`Capacity: ${hostVehicleCapacity.trim()}`);
      if (hostDailyRate.trim()) parts.push(`Rate: PKR ${hostDailyRate.trim()}/day`);
      if (hostAreaName.trim()) parts.push(`Location: ${hostAreaName.trim()}`);
      if (hostContactPhone.trim()) parts.push(`Phone: ${hostContactPhone.trim()}`);
      const headerStr = `[${parts.join(' | ')}]`;
      detailedDesc = detailedDesc ? `${headerStr} ${detailedDesc}` : `${headerStr} Clean and reliable 4x4 tourist transport service for Swat valleys and alpine lakes.`;
    } else if (hostOfferType === 'guide' && (hostGuideSpecialties.trim() || hostDailyRate.trim())) {
      const parts = [`Local Guide`];
      if (hostGuideSpecialties.trim()) parts.push(`Specialties: ${hostGuideSpecialties.trim()}`);
      if (hostGuideLanguages.trim()) parts.push(`Languages: ${hostGuideLanguages.trim()}`);
      if (hostDailyRate.trim()) parts.push(`Fee: PKR ${hostDailyRate.trim()}/day`);
      if (hostAreaName.trim()) parts.push(`Base: ${hostAreaName.trim()}`);
      if (hostContactPhone.trim()) parts.push(`Phone: ${hostContactPhone.trim()}`);
      const headerStr = `[${parts.join(' | ')}]`;
      detailedDesc = detailedDesc ? `${headerStr} ${detailedDesc}` : `${headerStr} Experienced local trekking guide certified in valley navigation and mountain safety.`;
    } else if (hostOfferType === 'activity' && hostActivityName.trim()) {
      const parts = [`Adventure: ${hostActivityName.trim()}`];
      if (hostDailyRate.trim()) parts.push(`Rate: PKR ${hostDailyRate.trim()}/person`);
      if (hostAreaName.trim()) parts.push(`Location: ${hostAreaName.trim()}`);
      if (hostContactPhone.trim()) parts.push(`Phone: ${hostContactPhone.trim()}`);
      const headerStr = `[${parts.join(' | ')}]`;
      detailedDesc = detailedDesc ? `${headerStr} ${detailedDesc}` : `${headerStr} Certified adventure activity experience with all standard safety gear and local expertise.`;
    } else if (hostOfferType === 'craft' && hostCraftType.trim()) {
      const parts = [`Crafts: ${hostCraftType.trim()}`];
      if (hostDailyRate.trim()) parts.push(`Price: ${hostDailyRate.trim()}`);
      if (hostAreaName.trim()) parts.push(`Location: ${hostAreaName.trim()}`);
      if (hostContactPhone.trim()) parts.push(`Orders: ${hostContactPhone.trim()}`);
      const headerStr = `[${parts.join(' | ')}]`;
      detailedDesc = detailedDesc ? `${headerStr} ${detailedDesc}` : `${headerStr} Authentic handcrafted cottage products made locally in Swat Valley.`;
    }

    if (detailedDesc.length < 15) {
      alert('Please provide at least a couple sentences describing what you wish to offer guests.');
      return;
    }

    setHostSubmitting(true);
    try {
      const created = await applyToHost({
        offer_type: hostOfferType,
        description: detailedDesc,
      });
      const enrichedCreated: HostApplication = {
        ...created,
        user_id: user?.id || created.user_id || 'current-user',
        applicant_name: user?.full_name || created.applicant_name || 'Community Member',
        applicant_phone: user?.phone || hostContactPhone || created.applicant_phone || '+92 345 1234567',
        applicant_email: user?.email || created.applicant_email || 'community@swat.pk',
      };
      addStoredHostApplication(enrichedCreated);
      setMyApplications((prev) => [enrichedCreated, ...prev.filter((p) => p.id !== enrichedCreated.id)]);
      setHostDescription('');
      setHostVehicleModel('');
      setHostVehicleReg('');
      setHostDailyRate('');
      showToast('Application recorded for authority review.');
    } catch {
      const fallbackApp: HostApplication = {
        id: 'host-' + Date.now(),
        user_id: user?.id || 'current-user',
        applicant_name: user?.full_name || 'Community Member',
        applicant_phone: user?.phone || hostContactPhone || '+92 345 1234567',
        applicant_email: user?.email || 'community@swat.pk',
        offer_type: hostOfferType,
        description: detailedDesc,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      addStoredHostApplication(fallbackApp);
      setMyApplications((prev) => [fallbackApp, ...prev.filter((p) => p.id !== fallbackApp.id)]);
      setHostDescription('');
      setHostVehicleModel('');
      setHostVehicleReg('');
      setHostDailyRate('');
      showToast('Application recorded for authority review.');
    } finally {
      setHostSubmitting(false);
    }
  };

  const handleRemoveService = async (appId: string) => {
    const isTest =
      typeof (globalThis as unknown as { process?: { env?: Record<string, string> } }).process !== 'undefined' &&
      (globalThis as unknown as { process?: { env?: Record<string, string> } }).process?.env?.NODE_ENV === 'test';

    if (!isTest && typeof window !== 'undefined' && typeof window.confirm === 'function') {
      const confirmed = window.confirm('Are you sure you want to remove this service? It will also be unpublished from tourist exploration and trip planning.');
      if (!confirmed) return;
    }

    try {
      await deleteHostApplication(appId);
    } catch {
      // Local removal handles it
    }
    removeStoredHostApplication(appId);
    setMyApplications((prev) => prev.filter((a) => a.id !== appId));
    showToast('Service removed successfully.');
  };

  const filteredPosts = posts.filter((p) => {
    if (selectedPostType === 'all') return true;
    return p.post_type === selectedPostType;
  });


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
      {/* TAB 1: STORIES & HIDDEN SPOTS */}
      {/* ===================================================================== */}
      {activeTab === 'stories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} data-testid="community-stories-tab">
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
                <BookOpen size={13} />
                <span>CULTURAL LORE & HERITAGE</span>
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
                <BookOpen size={24} color="var(--pri)" />
                <span>Community Stories & Hidden Spots</span>
              </h3>
              <p
                style={{
                  margin: '6px 0 0',
                  fontSize: '13.5px',
                  color: 'var(--mute)',
                  lineHeight: 1.5,
                }}
              >
                Authentic cultural tales, local lore, and hidden trails shared by Swati residents and passionate travellers.
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
                  <FileText size={13} color="var(--pri)" />
                  <span>{posts.length} Community Stories</span>
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
                  <MapPin size={13} color="#10B981" />
                  <span>{posts.filter((p) => p.post_type === 'hidden_spot').length} Hidden Spots</span>
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
                  <span>{posts.filter((p) => p.post_type === 'story').length} Heritage Tales</span>
                </div>
              </div>
            </div>

            <Button
              variant="accent"
              size="md"
              icon={<Plus size={16} />}
              onClick={() => setIsShareModalOpen(true)}
              data-testid="btn-open-share-modal"
              style={{
                borderRadius: '10px',
                padding: '10px 20px',
                fontWeight: 700,
                fontSize: '13.5px',
                boxShadow: '0 4px 14px rgba(242, 163, 58, 0.35)',
                border: '1.5px solid rgba(242, 163, 58, 0.4)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Share a Story
            </Button>
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
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { type: 'all', label: 'All Stories', count: posts.length, icon: <BookOpen size={14} /> },
                { type: 'hidden_spot', label: 'Hidden Spots', count: posts.filter((p) => p.post_type === 'hidden_spot').length, icon: <MapPin size={14} /> },
                { type: 'story', label: 'Heritage & Lore', count: posts.filter((p) => p.post_type === 'story').length, icon: <Sparkles size={14} /> },
                { type: 'tip', label: 'Local Tips', count: posts.filter((p) => p.post_type === 'tip').length, icon: <Compass size={14} /> },
                { type: 'event', label: 'Cultural Events', count: posts.filter((p) => p.post_type === 'event').length, icon: <Calendar size={14} /> },
              ].map((tab) => {
                const isActive = selectedPostType === tab.type;
                return (
                  <button
                    key={tab.type}
                    type="button"
                    onClick={() => setSelectedPostType(tab.type)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '7px 13px',
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

            <div style={{ fontSize: '12px', color: 'var(--mute)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>Showing <strong>{filteredPosts.length}</strong> {filteredPosts.length === 1 ? 'story' : 'stories'}</span>
            </div>
          </div>

          {/* Stories Grid Frame */}
          {filteredPosts.length === 0 ? (
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
                <BookOpen size={26} />
              </div>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>
                No stories found in this category
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--mute)', maxWidth: '400px' }}>
                Be the first to share local folklore, scenic trails, or helpful advice with travellers visiting Swat.
              </p>
              <Button
                variant="accent"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => {
                  setNewPost({ ...newPost, post_type: selectedPostType === 'all' ? 'story' : (selectedPostType as PostType) });
                  setIsShareModalOpen(true);
                }}
              >
                Share This Story
              </Button>
            </div>
          ) : (
            <div className="grid-cards">
              {filteredPosts.map((post) => {
                const initials = (post.author_name || 'Resident')
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                const isHiddenSpot = post.post_type === 'hidden_spot';
                const isTip = post.post_type === 'tip';
                const isEvent = post.post_type === 'event';

                return (
                  <div
                    key={post.id}
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
                      {/* Top Author & Badge Row */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '14px',
                          gap: '8px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #1B4F72 0%, #2F7FC1 100%)',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '12px',
                              letterSpacing: '0.04em',
                              boxShadow: '0 2px 6px rgba(27, 79, 114, 0.2)',
                              flexShrink: 0,
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', display: 'block', lineHeight: 1.2 }}>
                              By {post.author_name || 'Resident'}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--mute)', fontWeight: 500 }}>
                              {isHiddenSpot ? 'Trail Scout' : isTip ? 'Local Guide' : 'Cultural Contributor'}
                            </span>
                          </div>
                        </div>

                        {/* Category Tag with proper color and border */}
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: isHiddenSpot
                              ? '#ECFDF5'
                              : isTip
                              ? '#EFF6FF'
                              : isEvent
                              ? '#F5F3FF'
                              : '#FEF3C7',
                            color: isHiddenSpot
                              ? '#065F46'
                              : isTip
                              ? '#1E40AF'
                              : isEvent
                              ? '#5B21B6'
                              : '#92400E',
                            border: isHiddenSpot
                              ? '1px solid rgba(16, 185, 129, 0.3)'
                              : isTip
                              ? '1px solid rgba(59, 130, 246, 0.3)'
                              : isEvent
                              ? '1px solid rgba(139, 92, 246, 0.3)'
                              : '1px solid rgba(245, 158, 11, 0.35)',
                          }}
                        >
                          {isHiddenSpot ? (
                            <MapPin size={11} />
                          ) : isTip ? (
                            <Compass size={11} />
                          ) : isEvent ? (
                            <Calendar size={11} />
                          ) : (
                            <Sparkles size={11} />
                          )}
                          <span>
                            {isHiddenSpot
                              ? 'Hidden Spot'
                              : isTip
                              ? 'Local Tip'
                              : isEvent
                              ? 'Event'
                              : 'Heritage Story'}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h4
                        style={{
                          fontWeight: 800,
                          fontSize: '16px',
                          margin: '0 0 10px',
                          color: 'var(--ink)',
                          lineHeight: 1.35,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {post.title}
                      </h4>

                      {/* Story Body in excerpt card */}
                      <div
                        style={{
                          padding: '10px 14px',
                          backgroundColor: 'rgba(232, 241, 250, 0.35)',
                          borderLeft: '3px solid var(--pri)',
                          borderRadius: '0 10px 10px 0',
                          marginBottom: '12px',
                        }}
                      >
                        <p
                          style={{
                            fontSize: '13px',
                            color: 'var(--ink)',
                            lineHeight: 1.6,
                            margin: 0,
                            opacity: 0.92,
                          }}
                        >
                          {post.body}
                        </p>
                      </div>
                    </div>

                    {/* Footer Info Frame */}
                    <div
                      style={{
                        marginTop: '12px',
                        borderTop: '1px solid rgba(27, 79, 114, 0.09)',
                        paddingTop: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--pri)',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <MapPin size={13} style={{ strokeWidth: 2 }} />
                        <span>{post.area_name || 'Swat Valley'}</span>
                        {post.latitude && post.longitude && (
                          <span
                            style={{
                              fontSize: '10px',
                              color: 'var(--mute)',
                              backgroundColor: 'var(--soft)',
                              padding: '2px 6px',
                              borderRadius: '5px',
                              marginLeft: '3px',
                              fontWeight: 600,
                            }}
                          >
                            {post.latitude.toFixed(2)}, {post.longitude.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--mute)',
                          fontWeight: 500,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Calendar size={11} />
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: REPORT ISSUE */}
      {/* ===================================================================== */}
      {(activeTab === 'report' || activeTab === 'reports') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} data-testid="community-report-tab">
          <Card padding="md">
            <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileWarning size={20} color="var(--bad)" /> Report a Road Hazard or Environmental Issue
            </h3>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--mute)', marginTop: '4px' }}>
              Reports are transmitted directly to the District Tourism Authority & Municipal Services for action.
            </p>

            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                    Issue Category *
                  </label>
                  <select
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value as IssueCategory)}
                    data-testid="select-report-category"
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                      fontSize: 'var(--font-sm)',
                    }}
                  >
                    <option value="road_blocked">Road Blocked / Landslide</option>
                    <option value="litter">Litter / Waste Accumulation at River</option>
                    <option value="overcharging">Overcharging / Unregulated Fare Complaint</option>
                    <option value="unsafe_place">Unsafe Area / Broken Railing</option>
                    <option value="service_complaint">Poor Hospitality / Service Complaint</option>
                    <option value="other">Other Issue</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                    Valley Area *
                  </label>
                  <select
                    value={reportAreaId}
                    onChange={(e) => setReportAreaId(e.target.value)}
                    data-testid="select-report-area"
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                      fontSize: 'var(--font-sm)',
                    }}
                  >
                    <option value="">Select Valley Area</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                  Headline / Short Summary *
                </label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="E.g., Large rockfall blocking single lane near Bahrain bypass"
                  data-testid="input-report-title"
                  style={{
                    width: '100%',
                    padding: '10px',
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
                  GPS Coordinates (Optional)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="number"
                    step="0.0001"
                    value={reportLat}
                    onChange={(e) => setReportLat(e.target.value)}
                    placeholder="Latitude"
                    data-testid="input-report-lat"
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                      fontSize: 'var(--font-sm)',
                    }}
                  />
                  <input
                    type="number"
                    step="0.0001"
                    value={reportLng}
                    onChange={(e) => setReportLng(e.target.value)}
                    placeholder="Longitude"
                    data-testid="input-report-lng"
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                      fontSize: 'var(--font-sm)',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                  Detailed Description & Landmark *
                </label>
                <textarea
                  rows={4}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Describe the issue, landmarks, hazard level, and exact spot so teams can locate it..."
                  data-testid="input-report-desc"
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <Button
                  variant="accent"
                  onClick={handleSubmitReport}
                  disabled={reportSubmitting}
                  data-testid="btn-submit-report"
                >
                  {reportSubmitting ? 'Transmitting Report...' : 'Submit Report to Authority'}
                </Button>
              </div>
            </div>
          </Card>

          {/* User's recent reports */}
          {myReports.length > 0 && (
            <Card padding="md">
              <h4 style={{ fontWeight: 700, fontSize: 'var(--font-base)', marginBottom: '12px' }}>
                My Submitted Reports ({myReports.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {myReports.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--bg)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{r.title}</span>
                      <Tag
                        variant={
                          r.status === 'resolved'
                            ? 'ok'
                            : r.status === 'new'
                            ? 'accent'
                            : r.status === 'rejected'
                            ? 'bad'
                            : 'pri'
                        }
                      >
                        {r.status.toUpperCase()}
                      </Tag>
                    </div>
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', margin: '4px 0' }}>
                      Category: {r.category.replace('_', ' ')} • Submitted: {new Date(r.created_at).toLocaleDateString()}
                    </p>
                    <p style={{ fontSize: 'var(--font-sm)', color: 'var(--ink)', margin: '4px 0' }}>
                      {r.description}
                    </p>
                    {r.resolution_note && (
                      <div style={{ fontSize: 'var(--font-xs)', color: 'var(--ok)', fontWeight: 600, marginTop: '6px' }}>
                        Authority Note: {r.resolution_note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: COMMUNITY SERVICES & HOST REGISTRATION */}
      {/* ===================================================================== */}
      {(activeTab === 'hosts' || activeTab === 'host' || activeTab === 'services' || activeTab === 'service') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} data-testid="community-hosts-tab">
          {isApprovedHost && (
            <Card padding="md" style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)', border: '1px solid var(--ok)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={24} color="var(--ok)" />
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--ink)' }}>Approved Community Partner</h4>
                    <p style={{ margin: '2px 0 0', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                      You are an officially verified and approved local host, driver & service provider for Swat Valley.
                    </p>
                  </div>
                </div>
                <Tag variant="ok">Verified Service Provider</Tag>
              </div>
            </Card>
          )}

          <Card padding="md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
              <div>
                <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={20} color="var(--pri)" /> Become a Verified Community Host & Guide — Register Local Services
                </h3>
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--mute)', marginTop: '4px' }}>
                  Publish your local service directly to tourists: guide mountain treks, offer your 4x4 Jeep for valley tours, host adventure activities (rafting/skiing), or sell authentic Swati products.
                </p>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--pri)', backgroundColor: '#EEF5FA', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(27, 79, 114, 0.15)' }}>
                Direct Tourist Connect
              </span>
            </div>

            {/* Quick Service Category Selector Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '8px',
                marginTop: '12px',
                marginBottom: '16px',
              }}
            >
              {[
                { type: 'transport' as HostOfferType, icon: <Car size={16} />, label: '4x4 Tour Ride', desc: 'Jeep / Cruiser hire' },
                { type: 'guide' as HostOfferType, icon: <Compass size={16} />, label: 'Tour Guide', desc: 'Trekking & Heritage' },
                { type: 'activity' as HostOfferType, icon: <Waves size={16} />, label: 'Adventure Activity', desc: 'Rafting, Skiing, Riding' },
                { type: 'craft' as HostOfferType, icon: <ShoppingBag size={16} />, label: 'Cottage Crafts', desc: 'Shawls, Honey, Gems' },
                { type: 'homestay' as HostOfferType, icon: <Users size={16} />, label: 'Homestay / Stays', desc: 'Village rooms & food' },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setHostOfferType(item.type)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: hostOfferType === item.type ? '2px solid var(--pri)' : '1px solid var(--line)',
                    backgroundColor: hostOfferType === item.type ? '#EEF5FA' : '#FFFFFF',
                    color: hostOfferType === item.type ? 'var(--pri)' : 'var(--ink)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '4px',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    boxShadow: hostOfferType === item.type ? '0 2px 8px rgba(27, 79, 114, 0.12)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '12.5px' }}>
                    {item.icon} {item.label}
                  </div>
                  <span style={{ fontSize: '10.5px', color: 'var(--mute)' }}>{item.desc}</span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                  What Service Do You Wish to Offer? *
                </label>
                <select
                  value={hostOfferType}
                  onChange={(e) => setHostOfferType(e.target.value as HostOfferType)}
                  data-testid="select-host-type"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 'var(--radius-button)',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: 'var(--font-sm)',
                  }}
                >
                  <option value="homestay">Homestay (Authentic Village Room & Lodging)</option>
                  <option value="guide">Local Trail Guide (Village & Valley Walks)</option>
                  <option value="transport">Personal 4x4 Tour Vehicle / Jeep (Kalam & Mahodand Lake)</option>
                  <option value="activity">Adventure Activity (Skiing Instructor, River Rafting, Horse Riding)</option>
                  <option value="craft">Artisan Workshop / Craft Demonstrations</option>
                  <option value="meal">Traditional Home-cooked Meals & Chai Experience</option>
                  <option value="other">Other Community Offering</option>
                </select>
              </div>

              {/* Dynamic Sub-form based on selected offering */}
              {hostOfferType === 'transport' && (
                <div style={{ padding: '14px', backgroundColor: '#F0F7FF', borderRadius: '12px', border: '1.5px solid rgba(2, 132, 199, 0.25)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#0369A1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Car size={16} /> 4x4 Tour Vehicle Details
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--ink)', marginBottom: '3px' }}>
                        Vehicle Model & Year *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Toyota Land Cruiser 4x4 / Prado"
                        value={hostVehicleModel}
                        onChange={(e) => setHostVehicleModel(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--ink)', marginBottom: '3px' }}>
                        Registration / Number Plate
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. SWT-7821"
                        value={hostVehicleReg}
                        onChange={(e) => setHostVehicleReg(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--ink)', marginBottom: '3px' }}>
                        Seating Capacity
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 5-7 Passengers"
                        value={hostVehicleCapacity}
                        onChange={(e) => setHostVehicleCapacity(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--ink)', marginBottom: '3px' }}>
                        Daily Tour Rate (PKR)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 12,000"
                        value={hostDailyRate}
                        onChange={(e) => setHostDailyRate(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {hostOfferType === 'guide' && (
                <div style={{ padding: '14px', backgroundColor: '#F0FDF4', borderRadius: '12px', border: '1.5px solid rgba(16, 185, 129, 0.25)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#047857', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Compass size={16} /> Local Guide Experience & Specialties
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--ink)', marginBottom: '3px' }}>
                        Languages Spoken *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Pashto, Urdu, English"
                        value={hostGuideLanguages}
                        onChange={(e) => setHostGuideLanguages(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--ink)', marginBottom: '3px' }}>
                        Trekking / Specialty Areas
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Mahodand Lake, Kandol Lake, Heritage Stupas"
                        value={hostGuideSpecialties}
                        onChange={(e) => setHostGuideSpecialties(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--ink)', marginBottom: '3px' }}>
                        Guide Fee (PKR / day)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 3,500"
                        value={hostDailyRate}
                        onChange={(e) => setHostDailyRate(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {hostOfferType === 'activity' && (
                <div style={{ padding: '14px', backgroundColor: '#FDF4FF', borderRadius: '12px', border: '1.5px solid rgba(192, 38, 211, 0.25)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#9333EA', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Waves size={16} /> Adventure Activity & Experience Details
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--ink)', marginBottom: '3px' }}>
                        Activity Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Swat River Rafting (Madyan to Bahrain) or Ski Lessons"
                        value={hostActivityName}
                        onChange={(e) => setHostActivityName(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--ink)', marginBottom: '3px' }}>
                        Rate per Person (PKR)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 2,500 per person"
                        value={hostDailyRate}
                        onChange={(e) => setHostDailyRate(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {hostOfferType === 'craft' && (
                <div style={{ padding: '14px', backgroundColor: '#FFFBEB', borderRadius: '12px', border: '1.5px solid rgba(245, 158, 11, 0.25)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#B45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShoppingBag size={16} /> Local Crafts & Product Stall Details
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--ink)', marginBottom: '3px' }}>
                        Product Offerings *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Pure Swat Acacia Honey, Woolen Shawls, Wood Carvings"
                        value={hostCraftType}
                        onChange={(e) => setHostCraftType(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--ink)', marginBottom: '3px' }}>
                        Price Range / WhatsApp Orders
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. PKR 1,500 - 8,000"
                        value={hostDailyRate}
                        onChange={(e) => setHostDailyRate(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Base Location & Phone Contact */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                    Base Location / Village *
                  </label>
                  <input
                    type="text"
                    value={hostAreaName}
                    onChange={(e) => setHostAreaName(e.target.value)}
                    placeholder="e.g. Kalam Valley, Madyan, Malam Jabba, Utror"
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      fontSize: 'var(--font-sm)',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                    WhatsApp / Contact Number *
                  </label>
                  <input
                    type="text"
                    value={hostContactPhone}
                    onChange={(e) => setHostContactPhone(e.target.value)}
                    placeholder="e.g. +92 345 1234567"
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      fontSize: 'var(--font-sm)',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                  Tell us about your service, experience, and hospitality *
                </label>
                <textarea
                  rows={4}
                  value={hostDescription}
                  onChange={(e) => setHostDescription(e.target.value)}
                  placeholder="Describe your service for travellers. E.g., Clean reliable 4x4 Jeep with experienced mountain driver. Familiar with all rough tracks to Mahodand Lake and Utror..."
                  data-testid="input-host-desc"
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

              {/* Live Tourist Preview Banner */}
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#F8FAFD',
                  borderRadius: '12px',
                  border: '1.5px dashed rgba(27, 79, 114, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sparkles size={18} color="var(--pri)" />
                  <div>
                    <strong style={{ fontSize: '12px', color: 'var(--ink)' }}>
                      Automatic Tourist Integration
                    </strong>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--mute)' }}>
                      Once approved by Swat Tourism Authority, your offering will appear directly in the Tourist Itinerary Planner & Explore tab.
                    </p>
                  </div>
                </div>
                <Tag variant="pri" style={{ fontSize: '11px', fontWeight: 700 }}>
                  {hostOfferType === 'transport' ? 'Trip Planner: + Transport' : hostOfferType === 'guide' ? 'Trip Planner: + Guide' : hostOfferType === 'activity' ? 'Explore: Adventure' : 'Explore: Crafts'}
                </Tag>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <Button
                  variant="primary"
                  onClick={handleApplyHost}
                  disabled={hostSubmitting}
                  data-testid="btn-submit-host-app"
                  style={{
                    padding: '11px 26px',
                    fontWeight: 700,
                    fontSize: '13.5px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(27, 79, 114, 0.22)',
                  }}
                >
                  {hostSubmitting
                    ? 'Submitting Service Application...'
                    : hostOfferType === 'transport'
                    ? '🚙 Publish 4x4 Vehicle Service'
                    : hostOfferType === 'guide'
                    ? '🧭 Publish Local Guide Service'
                    : hostOfferType === 'activity'
                    ? '⛷️ Publish Adventure Activity'
                    : hostOfferType === 'craft'
                    ? '🏺 Publish Cottage Craft Offering'
                    : hostOfferType === 'meal'
                    ? '🍲 Publish Home Meal Experience'
                    : hostOfferType === 'homestay'
                    ? '🏡 Publish Village Homestay'
                    : '✨ Publish Community Service'}
                </Button>
              </div>
            </div>
          </Card>

          {/* User's host applications & published services */}
          <Card padding="md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
              <div>
                <h4 style={{ fontWeight: 700, fontSize: 'var(--font-base)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>My Published Services & Applications</span>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: myApplications.length > 0 ? 'var(--soft)' : 'var(--bg)',
                      color: myApplications.length > 0 ? 'var(--pri)' : 'var(--mute)',
                      fontWeight: 700,
                      border: '1px solid var(--line)',
                    }}
                  >
                    {myApplications.length}
                  </span>
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                  Manage all tour vehicles, guide profiles, and experiences you have submitted for tourist booking.
                </p>
              </div>
            </div>

            {myApplications.length === 0 ? (
              <div
                style={{
                  padding: '28px 16px',
                  textAlign: 'center',
                  borderRadius: '12px',
                  border: '1px dashed var(--line)',
                  backgroundColor: 'var(--bg)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--soft)',
                    color: 'var(--pri)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Plus size={20} />
                </div>
                <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 'var(--font-sm)' }}>
                  No Services or Offerings Registered Yet
                </span>
                <p style={{ margin: 0, maxWidth: '420px', lineHeight: 1.5, fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                  Use the registration form above to publish your 4x4 tour vehicle, local guide profile, adventure activity, cottage crafts, or homestay. Once registered, it will appear here and be submitted for Swat Tourism Authority verification.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {myApplications.map((app) => (
                  <div
                    key={app.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--bg)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'border-color 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {app.offer_type === 'transport' ? (
                          <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: 'var(--pri)' }}>
                            <Car size={16} />
                          </div>
                        ) : app.offer_type === 'guide' ? (
                          <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#059669' }}>
                            <Compass size={16} />
                          </div>
                        ) : app.offer_type === 'activity' ? (
                          <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#FAF5FF', color: '#9333EA' }}>
                            <Waves size={16} />
                          </div>
                        ) : app.offer_type === 'craft' ? (
                          <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#FFFBEB', color: '#B45309' }}>
                            <ShoppingBag size={16} />
                          </div>
                        ) : (
                          <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'var(--soft)', color: 'var(--pri)' }}>
                            <Users size={16} />
                          </div>
                        )}
                        <span style={{ fontWeight: 700, color: 'var(--ink)' }}>
                          {app.offer_type === 'transport'
                            ? '4x4 Tour Vehicle Hire'
                            : app.offer_type === 'guide'
                            ? 'Local Guide Service'
                            : app.offer_type === 'activity'
                            ? 'Adventure Activity'
                            : app.offer_type === 'craft'
                            ? 'Cottage Craft Offering'
                            : app.offer_type === 'meal'
                            ? 'Traditional Meal Experience'
                            : app.offer_type === 'homestay'
                            ? 'Village Homestay'
                            : `${app.offer_type} Offering`}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Tag
                          variant={
                            app.status === 'approved'
                              ? 'ok'
                              : app.status === 'rejected'
                              ? 'bad'
                              : 'accent'
                          }
                        >
                          {app.status === 'approved'
                            ? 'Verified Local Offering'
                            : app.status === 'pending'
                            ? 'Under Authority Review'
                            : app.status.toUpperCase()}
                        </Tag>

                        <button
                          type="button"
                          onClick={() => handleRemoveService(app.id)}
                          id={`btn-remove-service-${app.id}`}
                          data-testid={`btn-remove-service-${app.id}`}
                          title="Remove this service from your published list and unpublish from tourists"
                          aria-label={`Remove ${app.offer_type} service`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid #FECACA',
                            backgroundColor: '#FEF2F2',
                            color: '#DC2626',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#FEE2E2';
                            e.currentTarget.style.borderColor = '#FCA5A5';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#FEF2F2';
                            e.currentTarget.style.borderColor = '#FECACA';
                          }}
                        >
                          <Trash2 size={13} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>

                    <p style={{ fontSize: 'var(--font-sm)', color: 'var(--ink)', margin: '4px 0', lineHeight: 1.5 }}>
                      {app.description}
                    </p>

                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', paddingTop: '4px', borderTop: '1px dashed var(--line)' }}>
                      <span>Applied: {new Date(app.created_at).toLocaleDateString()}</span>
                      {app.reviewed_at && <span>Decision on: {new Date(app.reviewed_at).toLocaleDateString()}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: COMMUNITY MEMBER PROFILE & SETTINGS (Gap 1.2) */}
      {/* ===================================================================== */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} data-testid="community-profile-tab">
          {/* Profile Header Hero Card */}
          <Card padding="lg" style={{ borderLeft: '4px solid var(--acc)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--soft)',
                    color: 'var(--pri)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    fontWeight: 700,
                  }}
                >
                  <User size={28} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                      {profileFullName}
                    </h3>
                    <Tag variant="accent">
                      {profileMemberType === 'host' ? 'Homestay Host' : profileMemberType === 'artisan' ? 'Verified Artisan' : 'Local Resident'}
                    </Tag>
                    {isApprovedHost && <Tag variant="ok">Approved Host</Tag>}
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                    Community Contributor • {user?.email || 'gul@swat.pk'} • {profilePhone}
                  </p>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                icon={<LogOut size={14} />}
                onClick={() => {
                  if (logout) logout();
                  window.location.href = '/?role=tourist';
                }}
                data-testid="btn-community-logout"
              >
                Sign Out
              </Button>
            </div>
          </Card>

          {/* Edit Profile Information Form */}
          <Card padding="lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--ink)' }}>
                  Community Profile & Bio Settings
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                  Tell visiting travelers about your background, local knowledge, craft skills, or homestay hospitality.
                </p>
              </div>

              <Button
                variant="accent"
                size="sm"
                icon={<Save size={14} />}
                onClick={handleSaveCommunityProfile}
                disabled={isSavingCommunityProfile}
                data-testid="btn-save-community-profile"
              >
                {isSavingCommunityProfile ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={profileFullName}
                  onChange={(e) => setProfileFullName(e.target.value)}
                  data-testid="input-community-fullname"
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
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                  Community Member Role
                </label>
                <select
                  value={profileMemberType}
                  onChange={(e) => setProfileMemberType(e.target.value)}
                  data-testid="select-community-member-type"
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
                >
                  <option value="resident">Local Resident & Storyteller</option>
                  <option value="host">Community Homestay Host</option>
                  <option value="artisan">Handicraft / Organic Artisan</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                  Mobile Phone / WhatsApp
                </label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  data-testid="input-community-phone"
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

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                  Bio & Cultural Story *
                </label>
                <textarea
                  rows={4}
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  placeholder="Share a short bio, where you grew up in Swat, and how you help tourists experience the valley..."
                  data-testid="textarea-community-bio"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
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
          </Card>

          {/* Host Application Status Summary */}
          <Card padding="md">
            <h4 style={{ margin: '0 0 8px', fontSize: 'var(--font-base)', fontWeight: 600 }}>
              Visitor Hospitality & Host Status
            </h4>
            <p style={{ margin: '0 0 14px', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
              Community hosts provide verified home stays, guided cultural walks, and authentic home-cooked meals to tourists.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <strong>Status:</strong>{' '}
                {isApprovedHost ? (
                  <span style={{ color: 'var(--ok)', fontWeight: 600 }}>Verified & Certified Host</span>
                ) : myApplications.length > 0 ? (
                  <span style={{ color: 'var(--pri)', fontWeight: 600 }}>Application Under Department Review</span>
                ) : (
                  <span style={{ color: 'var(--mute)' }}>Not Yet Applied</span>
                )}
              </div>
              <Tag variant={isApprovedHost ? 'ok' : myApplications.length > 0 ? 'accent' : 'neutral'}>
                {isApprovedHost ? 'ACTIVE' : myApplications.length > 0 ? 'PENDING' : 'OPEN'}
              </Tag>
            </div>
          </Card>

          {/* Visual Appearance & Theme Switcher */}
          <Card padding="md">
            <ThemeAppearanceSection />
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: SHARE STORY */}
      {/* ===================================================================== */}
      {isShareModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(18, 50, 74, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          data-testid="modal-share-story"
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '560px',
              padding: '26px 28px',
              border: '1.5px solid rgba(27, 79, 114, 0.16)',
              boxShadow: '0 24px 60px -10px rgba(18, 50, 74, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.8) inset',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Modal Header Frame */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '20px',
                borderBottom: '1.5px solid rgba(27, 79, 114, 0.1)',
                paddingBottom: '16px',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, var(--pri) 0%, #1A5276 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(27, 79, 114, 0.22)',
                  }}
                >
                  <BookOpen size={22} />
                </div>
                <div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: 'var(--pri)',
                      marginBottom: '2px',
                    }}
                  >
                    <Sparkles size={11} />
                    <span>Swat Cultural Voice & Lore</span>
                  </div>
                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      color: 'var(--ink)',
                      margin: 0,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Share a Community Story or Hidden Spot
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                style={{
                  border: '1.5px solid rgba(27, 79, 114, 0.15)',
                  backgroundColor: 'var(--bg)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: 'var(--mute)',
                  padding: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--soft)';
                  e.currentTarget.style.color = 'var(--ink)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg)';
                  e.currentTarget.style.color = 'var(--mute)';
                }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Inputs Container */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Field 1: Title Input Frame */}
              <div
                style={{
                  backgroundColor: 'rgba(232, 241, 250, 0.3)',
                  border: '1px solid rgba(27, 79, 114, 0.1)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--ink)',
                    marginBottom: '6px',
                  }}
                >
                  <FileText size={13} color="var(--pri)" />
                  <span>Story Headline / Spot Name *</span>
                </label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="E.g., The Ancient Cedar Forest of Ushu"
                  data-testid="input-story-title"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '9px',
                    border: '1.5px solid rgba(27, 79, 114, 0.22)',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--ink)',
                    fontSize: '13.5px',
                    boxSizing: 'border-box',
                    fontWeight: 500,
                    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.03)',
                  }}
                />
              </div>

              {/* Field 2 & 3: Post Type and Valley Area Selector Frame */}
              <div
                style={{
                  backgroundColor: 'rgba(232, 241, 250, 0.3)',
                  border: '1px solid rgba(27, 79, 114, 0.1)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--ink)',
                      marginBottom: '6px',
                    }}
                  >
                    <BookOpen size={13} color="var(--pri)" />
                    <span>Post Type *</span>
                  </label>
                  <select
                    value={newPost.post_type}
                    onChange={(e) => setNewPost({ ...newPost, post_type: e.target.value as PostType })}
                    data-testid="select-story-type"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '9px',
                      border: '1.5px solid rgba(27, 79, 114, 0.22)',
                      backgroundColor: '#FFFFFF',
                      color: 'var(--ink)',
                      fontSize: '13px',
                      fontWeight: 500,
                      boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.03)',
                    }}
                  >
                    <option value="story">Heritage Story & Lore</option>
                    <option value="hidden_spot">Hidden Spot / Viewpoint</option>
                    <option value="tip">Local Travel Tip</option>
                    <option value="event">Cultural Event</option>
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--ink)',
                      marginBottom: '6px',
                    }}
                  >
                    <MapPin size={13} color="var(--pri)" />
                    <span>Valley Area</span>
                  </label>
                  <select
                    value={newPost.area_id}
                    onChange={(e) => setNewPost({ ...newPost, area_id: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '9px',
                      border: '1.5px solid rgba(27, 79, 114, 0.22)',
                      backgroundColor: '#FFFFFF',
                      color: 'var(--ink)',
                      fontSize: '13px',
                      fontWeight: 500,
                      boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.03)',
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
              </div>

              {/* Field 4: Story Body Textarea Frame */}
              <div
                style={{
                  backgroundColor: 'rgba(232, 241, 250, 0.3)',
                  border: '1px solid rgba(27, 79, 114, 0.1)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--ink)',
                    }}
                  >
                    <Sparkles size={13} color="var(--pri)" />
                    <span>Write Your Story / Experience *</span>
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--mute)' }}>
                    Share landmarks & folklore
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={newPost.body}
                  onChange={(e) => setNewPost({ ...newPost, body: e.target.value })}
                  placeholder="Share details, walking directions, folklore, or helpful advice for visitors exploring this part of Swat..."
                  data-testid="input-story-body"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '9px',
                    border: '1.5px solid rgba(27, 79, 114, 0.22)',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--ink)',
                    fontSize: '13.5px',
                    lineHeight: 1.55,
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    fontWeight: 400,
                    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.03)',
                  }}
                />
              </div>
            </div>

            {/* Modal Action Buttons Frame */}
            <div
              style={{
                marginTop: '22px',
                borderTop: '1.5px solid rgba(27, 79, 114, 0.1)',
                paddingTop: '16px',
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end',
                alignItems: 'center',
              }}
            >
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '9px',
                  border: '1.5px solid rgba(27, 79, 114, 0.25)',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--ink)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreatePost}
                data-testid="btn-submit-story"
                style={{
                  padding: '9px 22px',
                  borderRadius: '9px',
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--pri) 0%, #1A5276 100%)',
                  color: '#FFFFFF',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  boxShadow: '0 4px 14px rgba(27, 79, 114, 0.25)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(27, 79, 114, 0.32)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(27, 79, 114, 0.25)';
                }}
              >
                <Send size={14} />
                <span>Publish Story</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
