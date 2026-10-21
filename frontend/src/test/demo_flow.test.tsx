/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { App } from '../App';
import { DEMO_STEPS } from '../components/DemoTourGuide';

describe('Step 8: End-to-End Demo Flow & Guided Stepper Verification', () => {
  it('has all 15 demo steps configured covering the 4 user groups', () => {
    expect(DEMO_STEPS.length).toBe(15);

    const rolesCovered = new Set(DEMO_STEPS.map((s) => s.role));
    expect(rolesCovered.has('business')).toBe(true);
    expect(rolesCovered.has('authority')).toBe(true);
    expect(rolesCovered.has('tourist')).toBe(true);
    expect(rolesCovered.has('community')).toBe(true);

    // Verify key steps mentioned in docs/build_prompt.md
    expect(DEMO_STEPS[0].title).toContain('Business Registration');
    expect(DEMO_STEPS[1].title).toContain('Authority Review');
    expect(DEMO_STEPS[4].title).toContain('Tourist Explores');
    expect(DEMO_STEPS[5].title).toContain('Trip Creation');
    expect(DEMO_STEPS[6].title).toContain('Business Today Screen');
    expect(DEMO_STEPS[7].title).toContain('Authority Broadcasts');
    expect(DEMO_STEPS[9].title).toContain('Emergency SOS');
    expect(DEMO_STEPS[10].title).toContain('Rescue 1122');
    expect(DEMO_STEPS[11].title).toContain('Community Issue Report');
    expect(DEMO_STEPS[13].title).toContain('Become Host');
    expect(DEMO_STEPS[14].title).toContain('WhatsApp');
  });

  it('renders the interactive demo button and opens the walkthrough drawer', async () => {
    render(<App />);

    const demoBtn = screen.getByTestId('btn-demo-tour-toggle');
    expect(demoBtn).toBeDefined();

    // Open walkthrough drawer
    await act(async () => {
      fireEvent.click(demoBtn);
    });

    expect(screen.getByTestId('modal-demo-tour')).toBeDefined();
    expect(screen.getByText(/End-to-End 15-Step Platform Walkthrough/i)).toBeDefined();
    expect(screen.getByText('Business Registration & Document Upload')).toBeDefined();

    // Advance to Step 2
    const nextBtn = screen.getByTestId('btn-demo-next');
    await act(async () => {
      fireEvent.click(nextBtn);
    });

    expect(screen.getByText('Authority Review & Business Verification')).toBeDefined();

    // Jump to Step 10 (Emergency SOS)
    const step10Dot = screen.getByTestId('stepper-dot-10');
    await act(async () => {
      fireEvent.click(step10Dot);
    });

    expect(screen.getByText('Tourist Triggers Emergency SOS with GPS')).toBeDefined();

    // Close walkthrough drawer
    const closeBtn = screen.getByTestId('btn-close-demo-modal');
    await act(async () => {
      fireEvent.click(closeBtn);
    });

    expect(screen.queryByTestId('modal-demo-tour')).toBeNull();
  });

  it('docks at the bottom, auto-navigates pages on each step so they are clearly visible, and supports minimize', async () => {
    render(<App />);

    const demoBtn = screen.getByTestId('btn-demo-tour-toggle');
    // Open the walkthrough
    await act(async () => {
      fireEvent.click(demoBtn);
    });

    const dock = screen.getByTestId('modal-demo-tour');
    expect(dock).toBeDefined();
    // Positioned at the bottom
    expect(dock.style.position).toBe('fixed');
    expect(dock.style.bottom).toBe('0px');

    // Automatically navigated to Step 1: Business Profile
    expect(screen.getByText('Business Portal')).toBeDefined();
    expect(screen.getByText('Business Registration & Document Upload')).toBeDefined();

    // Minimize to slim bar
    const minimizeBtn = screen.getByLabelText('Minimize dock');
    await act(async () => {
      fireEvent.click(minimizeBtn);
    });
    expect(screen.getByLabelText('Expand Walkthrough Details')).toBeDefined();

    // In minimized mode, advance to Step 2
    const nextBtn = screen.getByTestId('btn-demo-next');
    await act(async () => {
      fireEvent.click(nextBtn);
    });

    // Page switched to Step 2: Authority
    expect(screen.getByText('Authority Dashboard')).toBeDefined();

    // Expand back
    const expandBtn = screen.getByLabelText('Expand Walkthrough Details');
    await act(async () => {
      fireEvent.click(expandBtn);
    });

    expect(screen.getByText('Authority Review & Business Verification')).toBeDefined();
    expect(screen.getByText(/End-to-End 15-Step Platform Walkthrough/i)).toBeDefined();

    // Close
    const closeBtn = screen.getByTestId('btn-close-demo-modal');
    await act(async () => {
      fireEvent.click(closeBtn);
    });
    expect(screen.queryByTestId('modal-demo-tour')).toBeNull();
  });

  it('guarantees all 15 demo steps are fully accessible without any Access Denied screens', async () => {
    render(<App />);

    // Open walkthrough drawer
    const demoBtn = screen.getByTestId('btn-demo-tour-toggle');
    await act(async () => {
      fireEvent.click(demoBtn);
    });

    // Walk through every single step from 1 to 15
    for (let stepIndex = 0; stepIndex < DEMO_STEPS.length; stepIndex++) {
      const stepDot = screen.getByTestId(`stepper-dot-${stepIndex + 1}`);
      await act(async () => {
        fireEvent.click(stepDot);
      });

      // Assert that Access Denied screen is NEVER rendered
      expect(screen.queryByTestId('access-denied-screen')).toBeNull();

      // Assert that current step modal header matches
      expect(screen.getByText(DEMO_STEPS[stepIndex].title)).toBeDefined();
    }
  });
});


