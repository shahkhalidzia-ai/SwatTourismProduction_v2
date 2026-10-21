import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  parseAndGenerateTripFromPrompt,
  analyzeAndOptimizeRoute,
  getMountainTravelEstimate,
  evaluateDestinationSafety,
  generateEmergencySOSDispatch,
  queryTouristAIConcierge,
} from '../services/touristAIService';
import { AITripGeneratorModal } from '../modules/tourist/AITripGeneratorModal';
import { TouristAIAssistantModal } from '../modules/tourist/TouristAIAssistantModal';

describe('Tourist AI Assistance Engine (Phases A, B, C, D)', () => {
  // --------------------------------------------------------------------------
  // Phase A: Natural Language Itinerary Generation
  // --------------------------------------------------------------------------
  describe('Phase A: 1-Prompt Natural Language Trip Generation', () => {
    it('parses natural language prompt and synthesizes complete multi-day Swat itinerary', () => {
      const prompt = '3-day family trip from Lahore, under 55k PKR, snow in Malam Jabba and riverside trout';
      const result = parseAndGenerateTripFromPrompt(prompt);

      expect(result.days).toBe(3);
      expect(result.travellers).toBe(4); // family defaults to 4
      expect(result.originCity).toBe('Lahore');
      expect(result.budgetPKR).toBe(55000);
      expect(result.title).toContain('Snow');
      expect(result.stops.length).toBeGreaterThanOrEqual(4);

      // Verify specific stops generated
      const titles = result.stops.map((s) => s.custom_title).join(' ');
      expect(titles).toContain('Malam Jabba');
      expect(titles).toContain('Swat Express');
    });

    it('renders AITripGeneratorModal, allows selecting quick prompt and confirming trip creation with populated stops', async () => {
      const mockCreate = vi.fn().mockImplementation(async (data) => ({
        id: 'trip-ai-1',
        title: data.title || '3-Day Malam Jabba Snow Adventure',
        travellers: data.travellers || 4,
        stops: data.stops || [],
      }));
      const mockTripCreated = vi.fn();
      const mockClose = vi.fn();

      render(
        <AITripGeneratorModal
          isOpen={true}
          onClose={mockClose}
          onCreateTrip={mockCreate}
          onTripCreated={mockTripCreated}
        />
      );

      expect(screen.getByTestId('ai-trip-generator-modal')).toBeInTheDocument();
      expect(screen.getByText('Swat AI Itinerary Co-Pilot')).toBeInTheDocument();

      // Trigger creation
      const confirmBtn = screen.getByTestId('btn-confirm-create-ai-trip');
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledTimes(1);
        expect(mockTripCreated).toHaveBeenCalledTimes(1);
        const createdTrip = mockTripCreated.mock.calls[0][0];
        expect(createdTrip.stops.length).toBeGreaterThan(0);
        expect(createdTrip.stops[0].custom_title).toBeDefined();
        expect(mockClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  // --------------------------------------------------------------------------
  // Phase B: Route Sequence Optimization & Mountain Travel Times
  // --------------------------------------------------------------------------
  describe('Phase B: Route Sequence & Mountain Drive Time Optimizer', () => {
    it('detects geographic backtracking inefficiencies along Swat Valley and optimizes order', () => {
      // Inefficient order: Kalam (North) -> Mingora (South) -> Mahodand (North)
      const unoptimizedStops: any[] = [
        { id: 's1', day_number: 1, custom_title: 'Kalam Alpine Hotel', notes: 'Kalam Valley' },
        { id: 's2', day_number: 1, custom_title: 'Mingora Bazaar & Museum', notes: 'Mingora' },
        { id: 's3', day_number: 1, custom_title: 'Mahodand Glacial Lake', notes: 'Mahodand' },
      ];

      const analysis = analyzeAndOptimizeRoute(unoptimizedStops);
      expect(analysis.hasInefficiencies).toBe(true);
      expect(analysis.distanceSavedKm).toBeGreaterThan(0);
      expect(analysis.timeSavedHours).toBeGreaterThan(0);

      // Verify optimized order is South to North: Mingora (rank 2) -> Kalam (rank 8) -> Mahodand (rank 11)
      expect(analysis.optimizedStops[0].custom_title).toContain('Mingora');
      expect(analysis.optimizedStops[1].custom_title).toContain('Kalam');
      expect(analysis.optimizedStops[2].custom_title).toContain('Mahodand');
    });

    it('calculates realistic mountain driving duration and terrain advice', () => {
      const estimate = getMountainTravelEstimate('Mingora', 'Kalam');
      expect(estimate.durationText).toBe('3.5 Hours');
      expect(estimate.distanceKm).toBe(98);
      expect(estimate.roadTip).toContain('Swat River');

      const lakeEstimate = getMountainTravelEstimate('Kalam', 'Mahodand');
      expect(lakeEstimate.durationText).toBe('2.5 Hours');
      expect(lakeEstimate.roadTip).toContain('4x4 strictly required');
    });
  });

  // --------------------------------------------------------------------------
  // Phase C: Proactive Safety & Bilingual Emergency SOS
  // --------------------------------------------------------------------------
  describe('Phase C: Proactive Mountain Safety & Emergency SOS', () => {
    it('evaluates high elevation snow-chain & 4x4 road advisories', () => {
      const malamJabbaSafety = evaluateDestinationSafety('Malam Jabba Ski Resort');
      expect(malamJabbaSafety.severity).toBe('warning');
      expect(malamJabbaSafety.title).toContain('Snow Season');
      expect(malamJabbaSafety.recommendedGear).toContain('Tire Snow Chains');

      const mahodandSafety = evaluateDestinationSafety('Mahodand Lake');
      expect(mahodandSafety.severity).toBe('alert');
      expect(mahodandSafety.advice).toContain('4x4');
    });

    it('generates bilingual English and Urdu SOS emergency distress dispatch with GPS', () => {
      const sos = generateEmergencySOSDispatch({
        touristName: 'Ali Khan',
        phone: '+92-300-9876543',
        lat: 35.1347,
        lng: 72.5342,
        nearestArea: 'Madyan',
        medicalNotes: 'Safe traveler',
      });

      expect(sos.englishText).toContain('EMERGENCY SOS ALERT');
      expect(sos.englishText).toContain('Ali Khan');
      expect(sos.englishText).toContain('35.13470');
      expect(sos.englishText).toContain('maps.google.com');

      expect(sos.urduText).toContain('ہنگامی امداد کا پیغام');
      expect(sos.urduText).toContain('Ali Khan');
      expect(sos.helpline).toContain('1122');
    });
  });

  // --------------------------------------------------------------------------
  // Phase D: Interactive Concierge & Voice/WhatsApp Travel Buddy
  // --------------------------------------------------------------------------
  describe('Phase D: Interactive Concierge & Voice Assistant', () => {
    it('answers tourist inquiries about terrain clearance, heating, and local cuisine', () => {
      const sedanAnswer = queryTouristAIConcierge('Can a sedan reach Kalam?');
      expect(sedanAnswer.answer).toContain('Yes!');
      expect(sedanAnswer.answer).toContain('Mahodand Lake');

      const troutAnswer = queryTouristAIConcierge('Tell me about swati trout fish');
      expect(troutAnswer.answer).toContain('freshwater glacial streams');
    });

    it('renders TouristAIAssistantModal, handles query, voice simulation, and WhatsApp link', async () => {
      const mockClose = vi.fn();
      render(
        <TouristAIAssistantModal
          isOpen={true}
          onClose={mockClose}
          touristName="Zainab Bibi"
        />
      );

      expect(screen.getByTestId('tourist-ai-assistant-modal')).toBeInTheDocument();
      expect(screen.getByText('Swat Tourism AI Concierge')).toBeInTheDocument();

      // Check WhatsApp concierge link exists
      const whatsappBtn = screen.getByTestId('btn-whatsapp-concierge');
      expect(whatsappBtn).toBeInTheDocument();
      expect(whatsappBtn.getAttribute('href')).toContain('https://wa.me/');

      // Check input query
      const input = screen.getByTestId('input-ai-concierge-query');
      fireEvent.change(input, { target: { value: 'Do hotels have heating in winter?' } });
      const sendBtn = screen.getByTestId('btn-send-ai-query');
      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(screen.getByText(/24\/7 central room heating/i)).toBeInTheDocument();
      });
    });
  });
});
