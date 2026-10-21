import React, { useState } from 'react';
import { Button } from '../design/Button';
import { Tag } from '../design/Tag';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { UserRole } from '../layouts/navItems';

export interface DemoStep {
  step: number;
  title: string;
  role: UserRole;
  tab: string;
  subTab?: string;
  category: 'business' | 'tourist' | 'safety' | 'community';
  description: string;
  instructions: string;
  highlightText: string;
}

export const DEMO_STEPS: DemoStep[] = [
  {
    step: 1,
    title: 'Business Registration & Document Upload',
    role: 'business',
    tab: 'profile',
    category: 'business',
    description: 'Business registers credentials and uploads official licensing / CNIC copies for review.',
    instructions: 'Notice the business profile showing official registration, phone, and uploaded verification documents ready for authority inspection.',
    highlightText: 'Step 1 of 15: Business Onboarding',
  },
  {
    step: 2,
    title: 'Authority Review & Business Verification',
    role: 'authority',
    tab: 'approvals',
    category: 'business',
    description: 'District Tourism Officer inspects submitted credentials and approves the business with the Verified badge.',
    instructions: 'Click "Review" on any pending business to inspect credentials, or click "Approve" to grant the official green Verified badge.',
    highlightText: 'Step 2 of 15: Verification Gate',
  },
  {
    step: 3,
    title: 'Business Creates Verified Listing',
    role: 'business',
    tab: 'listings',
    category: 'business',
    description: 'Business builds an offering (stay, restaurant, transport, guide, activity, shop) with multi-item price tiers.',
    instructions: 'Explore the Listing Builder adapting form fields dynamically based on service type with transparent price item controls.',
    highlightText: 'Step 3 of 15: Listing Builder',
  },
  {
    step: 4,
    title: 'Authority Approves Listing for Publishing',
    role: 'authority',
    tab: 'approvals',
    category: 'business',
    description: 'Authority reviews newly created listing details and approves it to become visible to tourists across Swat.',
    instructions: 'Authority queue ensures zero unverified businesses or unsafe operators can reach visiting tourists.',
    highlightText: 'Step 4 of 15: Quality Gate',
  },
  {
    step: 5,
    title: 'Tourist Explores & Filters Destinations',
    role: 'tourist',
    tab: 'explore',
    category: 'tourist',
    description: 'Tourist discovers verified stays, local guides, transport jeeps, and traditional eateries across Swat valleys.',
    instructions: 'Use the valley filter pills (Kalam, Bahrain, Madyan, Mingora) and category chips to inspect detailed cards.',
    highlightText: 'Step 5 of 15: Tourist Discovery',
  },
  {
    step: 6,
    title: 'Trip Creation, Multi-Booking & Mock Pay',
    role: 'tourist',
    tab: 'trips',
    category: 'tourist',
    description: 'Tourist organizes an itinerary, calculates transparent multi-item costs, and books verified listings.',
    instructions: 'View the active Autumn Trip with scheduled itinerary stops, traveller count updates, and mock Pay & Confirm.',
    highlightText: 'Step 6 of 15: Itinerary & Booking',
  },
  {
    step: 7,
    title: 'Business Today Screen & Booking Confirmation',
    role: 'business',
    tab: 'today',
    category: 'tourist',
    description: 'Business reviews real-time arrivals, pending booking requests, and confirms reservations with one click.',
    instructions: 'Check the real-time operational KPI counters (Today Arrivals, Pending Requests) and click "Accept" on incoming bookings.',
    highlightText: 'Step 7 of 15: Business Operations',
  },
  {
    step: 8,
    title: 'Authority Broadcasts Safety Advisory & Roads',
    role: 'authority',
    tab: 'advisories',
    category: 'safety',
    description: 'Authority publishes high water flood / weather advisory and updates mountain pass road conditions.',
    instructions: 'View active advisories broadcasted to travellers and road condition updates (e.g. Kalam to Mahodand 4x4 track).',
    highlightText: 'Step 8 of 15: Safety Broadcast',
  },
  {
    step: 9,
    title: 'Tourist Views Safety Banner & Road Pass Status',
    role: 'tourist',
    tab: 'home',
    category: 'safety',
    description: 'Tourists receive live alert banners right on their Home screen before travelling into alpine valleys.',
    instructions: 'Notice the high-priority amber advisory alert banner on Home, keeping tourists informed of seasonal hazards.',
    highlightText: 'Step 9 of 15: Tourist Safety Notice',
  },
  {
    step: 10,
    title: 'Tourist Triggers Emergency SOS with GPS',
    role: 'tourist',
    tab: 'safety',
    category: 'safety',
    description: 'Tourist in distress triggers one-tap emergency SOS broadcast with GPS coordinates and optional note.',
    instructions: 'In the Safety tab, click "Raise Emergency SOS" to test the rapid distress transmission with geolocation auto-fill.',
    highlightText: 'Step 10 of 15: Distress Transmission',
  },
  {
    step: 11,
    title: 'Authority Dispatches Emergency Rescue 1122',
    role: 'authority',
    tab: 'cases',
    subTab: 'sos',
    category: 'safety',
    description: 'District Control Room receives live SOS alerts, acknowledges caller, and dispatches Rescue 1122 team.',
    instructions: 'Under Cases -> 🚨 SOS Emergencies, click "Acknowledge" or "Resolve" to record on-site rescue notes.',
    highlightText: 'Step 11 of 15: Emergency Dispatch',
  },
  {
    step: 12,
    title: 'Citizen/Tourist Submits Community Issue Report',
    role: 'community',
    tab: 'report',
    category: 'community',
    description: 'Locals and tourists report road rockfalls, overflowing river litter, or unfair overcharging.',
    instructions: 'Submit a road blockage or environmental complaint with category tag and GPS location.',
    highlightText: 'Step 12 of 15: Community Reporting',
  },
  {
    step: 13,
    title: 'Authority Assigns & Resolves Issue Report',
    role: 'authority',
    tab: 'cases',
    subTab: 'reports',
    category: 'community',
    description: 'Authority reviews citizen reports, assigns municipal clearance crews, and resolves with notes.',
    instructions: 'Under Cases -> 📋 Community Reports, click "Assign" to dispatch maintenance or "Resolve" with resolution notes.',
    highlightText: 'Step 13 of 15: Issue Resolution',
  },
  {
    step: 14,
    title: 'Local Resident Applies to Become Host & Register Services',
    role: 'community',
    tab: 'hosts',
    category: 'community',
    description: 'Village resident offers traditional stone cottage homestay, 4x4 tour ride, or guided nature hike.',
    instructions: 'Select offering type (4x4 Tour Ride, Tour Guide, Adventure Activity, Cottage Crafts, Homestay) and submit application.',
    highlightText: 'Step 14 of 15: Local Host Program',
  },
  {
    step: 15,
    title: 'Local Artisan Crafts & Direct WhatsApp Orders',
    role: 'community',
    tab: 'hosts',
    category: 'community',
    description: 'Community members publish handcrafted shawls, organic honey, and local services with live status and removal options.',
    instructions: 'Review your published services list, inspect verification status, or remove/unpublish any service.',
    highlightText: 'Step 15 of 15: Artisan Economic Inclusion',
  },
];

interface DemoTourGuideProps {
  currentRole: UserRole;
  currentTab: string;
  onNavigate: (role: UserRole, tab: string, subTab?: string) => void;
  onTourOpenChange?: (isOpen: boolean) => void;
}

export const DemoTourGuide: React.FC<DemoTourGuideProps> = ({
  currentRole,
  currentTab,
  onNavigate,
  onTourOpenChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const step = DEMO_STEPS[currentStepIndex];

  const safeScrollToTop = () => {
    try {
      if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch {
      // Safe no-op in testing environments
    }
  };

  const handleToggleOpen = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    onTourOpenChange?.(nextOpen);
    if (nextOpen) {
      // Auto-navigate to active step so target page is immediately rendered
      const current = DEMO_STEPS[currentStepIndex];
      onNavigate(current.role, current.tab, current.subTab);
      safeScrollToTop();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onTourOpenChange?.(false);
  };

  const handleNext = () => {
    if (currentStepIndex < DEMO_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      const nextStep = DEMO_STEPS[nextIndex];
      onNavigate(nextStep.role, nextStep.tab, nextStep.subTab);
      safeScrollToTop();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      const prevStep = DEMO_STEPS[prevIndex];
      onNavigate(prevStep.role, prevStep.tab, prevStep.subTab);
      safeScrollToTop();
    }
  };

  const handleJumpToStep = (index: number) => {
    setCurrentStepIndex(index);
    const target = DEMO_STEPS[index];
    onNavigate(target.role, target.tab, target.subTab);
    safeScrollToTop();
  };

  const isCurrentStepActive = currentRole === step.role && currentTab === step.tab;

  return (
    <>
      {/* Floating Demo Launcher Pill - visible when bottom dock is closed */}
      {!isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(var(--bottom-bar-height, 64px) + 14px)',
            left: '20px',
            zIndex: 9000,
          }}
        >
          <button
            type="button"
            onClick={handleToggleOpen}
            data-testid="btn-demo-tour-toggle"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: 'var(--pri)',
              color: '#ffffff',
              borderRadius: '9999px',
              fontWeight: 700,
              fontSize: 'var(--font-sm)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
              cursor: 'pointer',
              transition: 'transform var(--transition-fast), background-color var(--transition-fast)',
            }}
          >
            <Sparkles size={16} />
            <span>Interactive 15-Step Demo</span>
            <Tag variant="accent" style={{ padding: '1px 6px', fontSize: '11px', color: '#fff', backgroundColor: 'var(--acc)' }}>
              {currentStepIndex + 1}/15
            </Tag>
          </button>
        </div>
      )}

      {/* Guided Tour Bottom Dock (Positioned at bottom, non-blocking page view) */}
      {isOpen && (
        <aside
          role="region"
          aria-label="Platform Walkthrough Dock"
          data-testid="modal-demo-tour"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            padding: '0 16px 12px 16px',
            pointerEvents: 'none', // Allows unobstructed scrolling and viewing of page content above
          }}
        >
          <div
            style={{
              pointerEvents: 'auto',
              backgroundColor: 'var(--card)',
              borderRadius: '16px 16px 12px 12px',
              width: '100%',
              maxWidth: '960px',
              border: '2px solid var(--pri)',
              boxShadow: '0 -8px 30px rgba(0, 0, 0, 0.25), 0 4px 16px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              transition: 'all 0.25s ease-in-out',
            }}
          >
            {/* Minimized View Bar */}
            {isMinimized ? (
              <div
                style={{
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  backgroundColor: 'var(--bg)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                  <Sparkles size={18} color="var(--acc)" style={{ flexShrink: 0 }} />
                  <span style={{ fontWeight: 800, fontSize: 'var(--font-sm)', color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                    Walkthrough:
                  </span>
                  <Tag variant="accent" style={{ fontSize: '11px', padding: '1px 6px', flexShrink: 0 }}>
                    Step {currentStepIndex + 1}/15
                  </Tag>
                  <span
                    style={{
                      fontSize: 'var(--font-sm)',
                      fontWeight: 700,
                      color: 'var(--ink)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={step.title}
                  >
                    {step.title}
                  </span>
                  <Tag variant="pri" style={{ fontSize: '11px', padding: '1px 6px', textTransform: 'uppercase', flexShrink: 0 }}>
                    {step.role} • {step.tab}
                  </Tag>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<ChevronLeft size={14} />}
                    onClick={handlePrev}
                    disabled={currentStepIndex === 0}
                    data-testid="btn-demo-prev"
                    style={{ padding: '4px 8px', fontSize: '12px' }}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleNext}
                    disabled={currentStepIndex === DEMO_STEPS.length - 1}
                    data-testid="btn-demo-next"
                    style={{ padding: '4px 8px', fontSize: '12px' }}
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </Button>
                  <button
                    type="button"
                    onClick={() => setIsMinimized(false)}
                    title="Expand Walkthrough Details"
                    aria-label="Expand Walkthrough Details"
                    style={{
                      border: '1px solid var(--line)',
                      background: 'var(--card)',
                      cursor: 'pointer',
                      color: 'var(--ink)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    <ChevronUp size={14} />
                    <span>Expand</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    title="Close Walkthrough"
                    aria-label="Close Walkthrough"
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--mute)', padding: '4px' }}
                    data-testid="btn-close-demo-modal"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Header Bar */}
                <div
                  style={{
                    padding: '10px 18px',
                    borderBottom: '1px solid var(--line)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'var(--bg)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <Sparkles size={18} color="var(--acc)" />
                    <h3 style={{ margin: 0, fontSize: 'var(--font-base)', fontWeight: 800, color: 'var(--ink)' }}>
                      End-to-End 15-Step Platform Walkthrough
                    </h3>
                    <Tag variant="accent" style={{ padding: '1px 8px', fontSize: '11px', fontWeight: 700 }}>
                      Step {currentStepIndex + 1} of {DEMO_STEPS.length}
                    </Tag>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        fontSize: '12px',
                        color: isCurrentStepActive ? 'var(--ok)' : 'var(--mute)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 600,
                        backgroundColor: 'var(--card)',
                        padding: '3px 8px',
                        borderRadius: '999px',
                        border: '1px solid var(--line)',
                      }}
                    >
                      <CheckCircle2 size={13} color={isCurrentStepActive ? 'var(--ok)' : 'var(--mute)'} />
                      <span>Viewing: <strong style={{ textTransform: 'capitalize' }}>{step.role}</strong> • <strong style={{ textTransform: 'capitalize' }}>{step.tab}</strong></span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsMinimized(true)}
                      title="Minimize dock to status bar"
                      aria-label="Minimize dock"
                      style={{
                        border: '1px solid var(--line)',
                        background: 'var(--card)',
                        cursor: 'pointer',
                        color: 'var(--ink)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '3px 8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      <ChevronDown size={14} />
                      <span>Minimize</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClose}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--mute)', padding: '4px' }}
                      title="Close Walkthrough"
                      aria-label="Close Walkthrough"
                      data-testid="btn-close-demo-modal"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Stepper Progress Bar */}
                <div
                  style={{
                    display: 'flex',
                    gap: '4px',
                    padding: '8px 18px',
                    backgroundColor: 'var(--card)',
                    borderBottom: '1px solid var(--line)',
                    overflowX: 'auto',
                  }}
                >
                  {DEMO_STEPS.map((s, idx) => (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => handleJumpToStep(idx)}
                      title={`Step ${s.step}: ${s.title}`}
                      style={{
                        flex: '1 0 16px',
                        height: '7px',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor:
                          idx === currentStepIndex
                            ? 'var(--pri)'
                            : idx < currentStepIndex
                            ? 'var(--ok)'
                            : 'var(--line)',
                        transition: 'all var(--transition-fast)',
                      }}
                      data-testid={`stepper-dot-${s.step}`}
                    />
                  ))}
                </div>

                {/* Active Step Details Body (Horizontal split, compact height) */}
                <div
                  style={{
                    padding: '12px 18px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '12px',
                    backgroundColor: 'var(--card)',
                    maxHeight: '190px',
                    overflowY: 'auto',
                  }}
                >
                  {/* Step Description Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--acc)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {step.highlightText}
                      </span>
                      <Tag variant="pri" style={{ textTransform: 'capitalize', fontSize: '11px', padding: '1px 6px' }}>
                        Role: {step.role}
                      </Tag>
                    </div>

                    <h2 style={{ fontSize: 'var(--font-base)', fontWeight: 800, margin: 0, color: 'var(--ink)', lineHeight: 1.3 }}>
                      {step.title}
                    </h2>

                    <p style={{ fontSize: '13px', color: 'var(--mute)', margin: 0, lineHeight: 1.4 }}>
                      {step.description}
                    </p>
                  </div>

                  {/* Verification Instructions Column */}
                  <div
                    style={{
                      padding: '10px 12px',
                      backgroundColor: 'var(--bg)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--line)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--pri)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          marginBottom: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>👉 What to verify on this screen:</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--ink)', lineHeight: 1.4, fontWeight: 500 }}>
                        {step.instructions}
                      </div>
                    </div>

                    {!isCurrentStepActive && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<ExternalLink size={13} />}
                        onClick={() => {
                          onNavigate(step.role, step.tab, step.subTab);
                          safeScrollToTop();
                        }}
                        data-testid="btn-jump-to-screen"
                        style={{ padding: '3px 10px', fontSize: '12px', alignSelf: 'flex-start' }}
                      >
                        Switch to {step.role.toUpperCase()} • {step.tab}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div
                  style={{
                    padding: '8px 18px',
                    borderTop: '1px solid var(--line)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'var(--bg)',
                  }}
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<ChevronLeft size={14} />}
                    onClick={handlePrev}
                    disabled={currentStepIndex === 0}
                    data-testid="btn-demo-prev"
                    style={{ padding: '4px 12px', fontSize: '12px' }}
                  >
                    Previous
                  </Button>

                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mute)' }}>
                    Step {currentStepIndex + 1} of {DEMO_STEPS.length} • Category: <span style={{ textTransform: 'capitalize' }}>{step.category}</span>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleNext}
                    disabled={currentStepIndex === DEMO_STEPS.length - 1}
                    data-testid="btn-demo-next"
                    style={{ padding: '4px 12px', fontSize: '12px' }}
                  >
                    <span>Next Step</span>
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </>
            )}
          </div>
        </aside>
      )}
    </>
  );
};
