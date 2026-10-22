import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Calendar, Users, DollarSign, X, Loader2 } from 'lucide-react';
import { Button } from '../../design/Button';
import { Tag } from '../../design/Tag';
import { parseAndGenerateTripFromPrompt, type GeneratedAITrip } from '../../services/touristAIService';
import type { Trip } from '../../api/trips';

export interface AITripGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTrip: (tripData: any) => Promise<Trip | void>;
  onTripCreated?: (trip: Trip) => void;
  showToast?: (msg: string) => void;
  initialPrompt?: string;
}

const DEFAULT_PROMPT = '3-day family trip from Islamabad, under 60k PKR, snow in Malam Jabba and riverside trout';

const SAMPLE_PROMPTS = [
  '2-day family trip from Islamabad, under 20k PKR, Mingora',
  '3-day family trip from Islamabad, under 60k PKR, snow in Malam Jabba and riverside trout',
  '2-day weekend romantic getaway to Bahrain with luxury hotel and scenic river walks',
  '4-day high alpine adventure: Kalam, Mahodand Lake 4x4 trail and cedar forest camping',
  '2-day cultural heritage tour: Saidu Sharif museum, White Palace Marghuzar, and craft bazaars',
];

export const AITripGeneratorModal: React.FC<AITripGeneratorModalProps> = ({
  isOpen,
  onClose,
  onCreateTrip,
  onTripCreated,
  showToast,
  initialPrompt,
}) => {
  const [promptText, setPromptText] = useState(initialPrompt || DEFAULT_PROMPT);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [generatedTrip, setGeneratedTrip] = useState<GeneratedAITrip | null>(() =>
    parseAndGenerateTripFromPrompt(initialPrompt || DEFAULT_PROMPT)
  );

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync when initialPrompt or modal open state changes
  useEffect(() => {
    if (isOpen) {
      const activePrompt = initialPrompt?.trim() || promptText.trim() || DEFAULT_PROMPT;
      setPromptText(activePrompt);
      setGeneratedTrip(parseAndGenerateTripFromPrompt(activePrompt));
    }
  }, [isOpen, initialPrompt]);

  // Debounced auto-generation as user types (300ms)
  useEffect(() => {
    if (!promptText.trim()) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const plan = parseAndGenerateTripFromPrompt(promptText.trim());
      setGeneratedTrip(plan);
      setIsGenerating(false);
    }, 280);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [promptText]);

  if (!isOpen) return null;

  const handleGenerate = (text: string) => {
    setIsGenerating(true);
    setTimeout(() => {
      const gen = parseAndGenerateTripFromPrompt(text);
      setGeneratedTrip(gen);
      setIsGenerating(false);
    }, 200);
  };

  const handleConfirmCreate = async () => {
    // Guarantee plan is synthesized from latest promptText
    const planToSave = parseAndGenerateTripFromPrompt(promptText.trim() || DEFAULT_PROMPT);
    setIsCreating(true);
    try {
      const today = new Date();
      const end = new Date();
      end.setDate(today.getDate() + planToSave.days);

      const created = await onCreateTrip({
        title: planToSave.title,
        travellers: planToSave.travellers,
        start_date: today.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
        estimated_total: planToSave.budgetPKR,
        status: 'planned',
        stops: planToSave.stops.map((s, idx) => ({
          day_number: s.day_number,
          stop_order: idx + 1,
          time_slot: s.time_slot,
          stop_type: s.stop_type,
          custom_title: s.custom_title,
          notes: s.notes,
        })),
      });

      if (created) {
        const finalTrip: Trip = {
          ...created,
          stops:
            created.stops && created.stops.length > 0
              ? created.stops
              : planToSave.stops.map((s, idx) => ({
                  id: `stop-ai-${Date.now()}-${idx}`,
                  trip_id: created.id,
                  day_number: s.day_number,
                  stop_order: idx + 1,
                  time_slot: s.time_slot,
                  stop_type: s.stop_type,
                  custom_title: s.custom_title,
                  notes: s.notes,
                  created_at: new Date().toISOString(),
                })),
        };
        if (showToast) {
          showToast(`✓ AI created "${finalTrip.title}" with ${finalTrip.stops.length} stops!`);
        }
        if (onTripCreated) {
          onTripCreated(finalTrip);
        }
      }
      onClose();
    } catch (err: any) {
      if (showToast) {
        showToast(err.message || 'Failed to create AI trip');
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      data-testid="ai-trip-generator-modal"
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '740px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.22)',
          border: '1px solid rgba(27, 79, 114, 0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #1B4F72 0%, #0F344D 100%)',
            color: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34D399',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, letterSpacing: '-0.01em' }}>
                Swat AI Itinerary Co-Pilot
              </h3>
              <span style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.8)' }}>
                1-Prompt Natural Language Trip Builder (Less Input, More Output)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
            }}
            aria-label="Close AI Trip Generator"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '18px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Prompt Input Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>
              Describe your dream Swat trip in plain words:
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGenerate(promptText);
                }}
                placeholder="e.g. 3-day family trip from Lahore under 50k PKR with snow and riverside stays"
                data-testid="input-ai-trip-prompt"
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid rgba(27, 79, 114, 0.25)',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
              <Button
                variant="primary"
                size="md"
                onClick={() => handleGenerate(promptText)}
                disabled={isGenerating || !promptText.trim()}
                data-testid="btn-generate-ai-trip"
                style={{
                  background: 'linear-gradient(135deg, var(--pri) 0%, #1A5487 100%)',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                {isGenerating ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
                <span>{isGenerating ? 'Synthesizing...' : 'Generate Plan'}</span>
              </Button>
            </div>
          </div>

          {/* Quick Preset Sample Chips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 650, color: 'var(--mute)' }}>
              Or choose a 1-tap popular traveler prompt:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {SAMPLE_PROMPTS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPromptText(sample);
                    handleGenerate(sample);
                  }}
                  style={{
                    fontSize: '11px',
                    padding: '5px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(27, 79, 114, 0.15)',
                    backgroundColor: promptText === sample ? '#F0FDF4' : '#F8FAFD',
                    color: promptText === sample ? '#047857' : 'var(--ink)',
                    fontWeight: promptText === sample ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  ⚡ {sample}
                </button>
              ))}
            </div>
          </div>

          {/* Generated Plan Review Card */}
          {generatedTrip && (
            <div
              style={{
                backgroundColor: '#F8FAFD',
                borderRadius: '14px',
                border: '1.5px solid rgba(27, 79, 114, 0.12)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
              data-testid="ai-generated-trip-preview"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--ink)' }}>
                    {generatedTrip.title}
                  </h4>
                  <span style={{ fontSize: '12px', color: 'var(--pri)', fontWeight: 650 }}>
                    Theme: {generatedTrip.theme} • From {generatedTrip.originCity}
                  </span>
                </div>
                <Tag variant="ok" style={{ fontWeight: 700, fontSize: '12px' }}>
                  PKR {generatedTrip.budgetPKR.toLocaleString()} Total
                </Tag>
              </div>

              {/* Badges strip */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--ink)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                  <Calendar size={13} color="var(--pri)" /> {generatedTrip.days} Days
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                  <Users size={13} color="var(--pri)" /> {generatedTrip.travellers} Travellers
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600, color: '#047857' }}>
                  <DollarSign size={13} /> Realistic Family Budget
                </span>
              </div>

              {/* Highlights pills */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {generatedTrip.highlights.map((h, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid rgba(27, 79, 114, 0.15)',
                      fontWeight: 600,
                      color: 'var(--ink)',
                    }}
                  >
                    {h}
                  </span>
                ))}
              </div>

              {/* Day-by-day Generated Stops Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--mute)' }}>
                  Generated Itinerary Timeline ({generatedTrip.stops.length} Curated Stops):
                </span>
                {generatedTrip.stops.map((stop, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid rgba(27, 79, 114, 0.08)',
                      fontSize: '12px',
                    }}
                  >
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(47, 127, 193, 0.12)',
                        color: 'var(--pri)',
                        fontWeight: 700,
                        fontSize: '11px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Day {stop.day_number}
                    </span>
                    <span style={{ color: 'var(--mute)', fontSize: '11px', whiteSpace: 'nowrap' }}>
                      {stop.time_slot}
                    </span>
                    <span style={{ fontWeight: 650, color: 'var(--ink)', flex: 1 }}>
                      {stop.custom_title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid rgba(27, 79, 114, 0.1)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            backgroundColor: '#FFFFFF',
          }}
        >
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleConfirmCreate}
            disabled={isCreating || !generatedTrip}
            data-testid="btn-confirm-create-ai-trip"
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              fontWeight: 700,
              padding: '10px 20px',
              border: 'none',
              boxShadow: '0 3px 12px rgba(16, 185, 129, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isCreating ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
            <span>{isCreating ? 'Creating Trip...' : 'Confirm & Open AI Itinerary ➔'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
