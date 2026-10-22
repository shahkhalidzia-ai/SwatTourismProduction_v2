import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  Mic,
  ShieldAlert,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '../../design/Button';
import { queryTouristAIConcierge, generateEmergencySOSDispatch } from '../../services/touristAIService';

export interface TouristAIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
  onOpenTripPlan?: (prompt: string) => void;
  touristName?: string;
  touristPhone?: string;
}

const FREQUENT_QUESTIONS = [
  '2-day family trip from Islamabad, under 20k PKR, Mingora',
  'Can a sedan car reach Kalam?',
  'What is Swati trout fish & how is it cooked?',
  'Do verified hotels have room heating in winter?',
  'What local culture and etiquette tips should I follow?',
  'Are ATMs available in Kalam Valley?',
];

export const TouristAIAssistantModal: React.FC<TouristAIAssistantModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenTripPlan,
  touristName = 'Tourist Guest',
  touristPhone = '+92-300-1234567',
}) => {
  const [activeMode, setActiveMode] = useState<'chat' | 'emergency'>('chat');
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [copied, setCopied] = useState(false);
  const [conversation, setConversation] = useState<
    Array<{ sender: 'user' | 'ai'; text: string; actionText?: string; actionTab?: string; originPrompt?: string }>
  >([
    {
      sender: 'ai',
      text: 'Salam & Welcome to Swat Valley! I am your AI Mountain Concierge. Ask me anything about roads, pass clearance, authentic trout dining, hotel room heating, or emergency guidance.',
    },
  ]);

  if (!isOpen) return null;

  const handleAsk = (textToAsk: string) => {
    const text = textToAsk.trim();
    if (!text) return;

    const userEntry = { sender: 'user' as const, text };
    const ans = queryTouristAIConcierge(text);
    const aiEntry = {
      sender: 'ai' as const,
      text: ans.answer,
      actionText: ans.quickActionText,
      actionTab: ans.quickActionTab,
      originPrompt: text,
    };

    setConversation((prev) => [...prev, userEntry, aiEntry]);
    setQuery('');
  };

  const handleSimulateVoice = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      const voiceQuery = 'Can a sedan car reach Kalam Valley?';
      setQuery(voiceQuery);
      handleAsk(voiceQuery);
    }, 1200);
  };

  const emergencyData = generateEmergencySOSDispatch({
    touristName,
    phone: touristPhone,
    lat: 35.1347,
    lng: 72.5342,
    nearestArea: 'Madyan / Bahrain Valley',
    medicalNotes: 'Safe mountain traveler requesting clearance update',
  });

  const handleCopyEmergency = () => {
    navigator.clipboard.writeText(emergencyData.englishText + '\n\n' + emergencyData.urduText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      data-testid="tourist-ai-assistant-modal"
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '680px',
          height: '620px',
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
            padding: '14px 18px',
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
                width: '34px',
                height: '34px',
                borderRadius: '9px',
                backgroundColor: 'rgba(255, 255, 255, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34D399',
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>
                Swat Tourism AI Concierge
              </h3>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.8)' }}>
                Bilingual Mountain Assistant • 24/7 Verified Guide
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Mode switch */}
            <div style={{ display: 'flex', backgroundColor: 'rgba(255, 255, 255, 0.12)', borderRadius: '8px', padding: '2px' }}>
              <button
                type="button"
                onClick={() => setActiveMode('chat')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: activeMode === 'chat' ? '#FFFFFF' : 'transparent',
                  color: activeMode === 'chat' ? '#1B4F72' : '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                Chat Guide
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('emergency')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: activeMode === 'emergency' ? '#EF4444' : 'transparent',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                SOS Dispatch
              </button>
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
              }}
              aria-label="Close Assistant"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Mode 1: Chat Concierge */}
        {activeMode === 'chat' ? (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Quick Frequent Questions Strip */}
            <div
              style={{
                padding: '8px 14px',
                backgroundColor: '#F8FAFD',
                borderBottom: '1px solid rgba(27, 79, 114, 0.08)',
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                scrollbarWidth: 'none',
              }}
            >
              <span style={{ fontSize: '10.5px', color: 'var(--mute)', fontWeight: 700, alignSelf: 'center', whiteSpace: 'nowrap' }}>
                Frequent:
              </span>
              {FREQUENT_QUESTIONS.map((qText, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAsk(qText)}
                  style={{
                    fontSize: '10.5px',
                    padding: '3px 9px',
                    borderRadius: '6px',
                    border: '1px solid rgba(27, 79, 114, 0.15)',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--pri)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontWeight: 600,
                  }}
                >
                  {qText}
                </button>
              ))}
            </div>

            {/* Conversation Log */}
            <div
              style={{
                flex: 1,
                padding: '16px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                backgroundColor: '#FFFFFF',
              }}
              data-testid="ai-concierge-chat-log"
            >
              {conversation.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    gap: '4px',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '82%',
                      padding: '10px 14px',
                      borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      backgroundColor: msg.sender === 'user' ? 'var(--pri)' : '#F1F5F9',
                      color: msg.sender === 'user' ? '#FFFFFF' : 'var(--ink)',
                      fontSize: '12.5px',
                      lineHeight: 1.5,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    }}
                  >
                    {msg.text}
                  </div>

                  {/* AI Quick Navigation Action */}
                  {msg.actionText && (
                    <button
                      type="button"
                      onClick={() => {
                        if (msg.actionTab === 'ai-trip-plan' && onOpenTripPlan) {
                          onOpenTripPlan(msg.originPrompt || '2-day family trip from Islamabad, under 20k PKR, Mingora');
                          onClose();
                        } else if (msg.actionTab && onNavigateTab) {
                          onNavigateTab(msg.actionTab);
                          onClose();
                        }
                      }}
                      data-testid="btn-ai-quick-action"
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--pri)',
                        backgroundColor: '#F0F7FF',
                        border: '1px solid rgba(47, 127, 193, 0.3)',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        marginTop: '2px',
                      }}
                    >
                      ➔ {msg.actionText}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Input Bar */}
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid rgba(27, 79, 114, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#F8FAFD',
              }}
            >
              <button
                type="button"
                onClick={handleSimulateVoice}
                title="Voice Input (Speech-to-Text)"
                data-testid="btn-ai-voice-input"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '9px',
                  border: '1px solid rgba(27, 79, 114, 0.2)',
                  backgroundColor: isListening ? '#EF4444' : '#FFFFFF',
                  color: isListening ? '#FFFFFF' : 'var(--pri)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Mic size={16} />
              </button>

              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAsk(query);
                }}
                placeholder={isListening ? 'Listening to voice...' : 'Ask about roads, trout food, weather, or culture...'}
                data-testid="input-ai-concierge-query"
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '9px',
                  border: '1px solid rgba(27, 79, 114, 0.2)',
                  fontSize: '12.5px',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />

              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAsk(query)}
                disabled={!query.trim()}
                data-testid="btn-send-ai-query"
                style={{ borderRadius: '9px' }}
              >
                <Send size={14} />
              </Button>

              {/* Direct WhatsApp Concierge Button */}
              <a
                href={`https://wa.me/923001234567?text=${encodeURIComponent('Hello Swat Tourism AI Support! I have an inquiry about my trip.')}`}
                target="_blank"
                rel="noreferrer"
                title="Connect on WhatsApp"
                data-testid="btn-whatsapp-concierge"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  backgroundColor: '#25D366',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                WhatsApp
              </a>
            </div>
          </div>
        ) : (
          /* Mode 2: Emergency SOS Bilingual Dispatcher (Phase C) */
          <div style={{ padding: '18px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1.5px solid #FCA5A5',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <ShieldAlert size={24} color="#DC2626" />
              <div>
                <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#991B1B' }}>
                  AI Emergency SOS Dispatch Generator
                </h4>
                <span style={{ fontSize: '11.5px', color: '#7F1D1D' }}>
                  Prepares GPS location & bilingual rescue packets for Rescue 1122 and Swat Tourist Police.
                </span>
              </div>
            </div>

            {/* Bilingual Message Boxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ink)' }}>
                  English Emergency Dispatch:
                </span>
                <pre
                  style={{
                    backgroundColor: '#F8FAFD',
                    border: '1px solid rgba(27, 79, 114, 0.15)',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '11px',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    color: 'var(--ink)',
                    margin: '4px 0 0 0',
                  }}
                >
                  {emergencyData.englishText}
                </pre>
              </div>

              <div>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ink)' }}>
                  Urdu / Pashto Rescue Text (ہنگامی پیغام):
                </span>
                <pre
                  style={{
                    backgroundColor: '#F8FAFD',
                    border: '1px solid rgba(27, 79, 114, 0.15)',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '12px',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'sans-serif',
                    direction: 'rtl',
                    color: 'var(--ink)',
                    margin: '4px 0 0 0',
                  }}
                >
                  {emergencyData.urduText}
                </pre>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <div style={{ fontSize: '12px', color: '#DC2626', fontWeight: 700 }}>
                Direct Helplines: {emergencyData.helpline}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyEmergency}
                data-testid="btn-copy-sos-packet"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: 700,
                }}
              >
                {copied ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Distress Packet'}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
