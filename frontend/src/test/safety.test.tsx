/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { TouristShell } from '../modules/tourist/TouristShell';
import { AuthorityShell } from '../modules/authority/AuthorityShell';

vi.mock('../api/safety', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/safety')>();
  return {
    ...actual,
    createRoadStatus: vi.fn().mockImplementation((data: any) =>
      Promise.resolve({
        id: 'road-test-created',
        road_name: data.road_name,
        status: data.status,
        vehicle_note: data.vehicle_note,
        reason: data.reason,
        source: 'authority',
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    ),
  };
});

describe('Step 6: Safety, Advisories, Road Status, and Emergency SOS', () => {
  it('renders Tourist Safety tab with emergency contacts and road statuses', async () => {
    render(<TouristShell activeTab="safety" />);

    expect(screen.getByTestId('safety-tab-content')).toBeDefined();
    expect(screen.getByText(/Emergency SOS & Tourist Dispatch/i)).toBeDefined();
    expect(screen.getByText(/Active Safety & Weather Advisories/i)).toBeDefined();
    expect(screen.getByText(/Road Status Updates & Mountain Passes/i)).toBeDefined();
    expect(screen.getByText(/24\/7 District Emergency Directory/i)).toBeDefined();

    // Check emergency numbers
    expect(screen.getAllByText(/Rescue 1122/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Police Emergency/i).length).toBeGreaterThan(0);
  });

  it('allows tourist to open SOS modal and submit distress alert with GPS', async () => {
    render(<TouristShell activeTab="safety" />);

    // Click Raise SOS Alert
    const triggerBtn = screen.getByTestId('btn-trigger-sos-modal');
    await act(async () => {
      fireEvent.click(triggerBtn);
    });

    // Verify SOS modal
    expect(screen.getByTestId('sos-modal-backdrop')).toBeDefined();
    expect(screen.getByText(/Confirm Emergency SOS/i)).toBeDefined();

    // Fill optional emergency message
    const msgInput = screen.getByTestId('input-sos-message');
    await act(async () => {
      fireEvent.change(msgInput, { target: { value: 'Engine stalled in snow near Mahodand. Cold weather.' } });
    });

    // Confirm transmission
    const confirmBtn = screen.getByTestId('btn-confirm-sos');
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    // Active SOS banner should now appear
    await waitFor(() => {
      expect(screen.getByText(/EMERGENCY SOS ACTIVE/i)).toBeDefined();
      expect(screen.getByText(/Engine stalled in snow near Mahodand/i)).toBeDefined();
    });
  });

  it('renders Authority Advisories tab with real data and allows creating new advisory', async () => {
    render(<AuthorityShell activeTab="advisories" />);

    expect(screen.getByText(/Safety & Weather Advisories/i)).toBeDefined();
    expect(screen.getByTestId('btn-create-advisory')).toBeDefined();

    // Open Create Advisory modal
    const createBtn = screen.getByTestId('btn-create-advisory');
    await act(async () => {
      fireEvent.click(createBtn);
    });

    expect(screen.getByTestId('modal-create-advisory')).toBeDefined();

    // Fill form
    const titleInput = screen.getByTestId('input-advisory-title');
    const msgInput = screen.getByTestId('input-advisory-message');
    const severitySelect = screen.getByTestId('select-advisory-severity');

    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'Ghabral River Flash Flood Alert' } });
      fireEvent.change(msgInput, { target: { value: 'Stay clear of river banks. Evacuation order in low lying areas.' } });
      fireEvent.change(severitySelect, { target: { value: 'danger' } });
    });

    // Submit
    const submitBtn = screen.getByTestId('btn-submit-advisory');
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('Ghabral River Flash Flood Alert')).toBeDefined();
      expect(screen.getByText(/Advisory successfully published/i)).toBeDefined();
    });
  });

  it('allows authority to update road condition status', async () => {
    render(<AuthorityShell activeTab="advisories" />);

    expect(screen.getByTestId('btn-add-road')).toBeDefined();

    // Click Add/Update Route Status
    const addRoadBtn = screen.getByTestId('btn-add-road');
    await act(async () => {
      fireEvent.click(addRoadBtn);
    });

    expect(screen.getByTestId('modal-road-status')).toBeDefined();

    const nameInput = screen.getByTestId('input-road-name');
    const statusSelect = screen.getByTestId('select-road-status');

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Kalam to Utror Road' } });
      fireEvent.change(statusSelect, { target: { value: 'limited' } });
    });

    const submitBtn = screen.getByTestId('btn-submit-road');
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('Kalam to Utror Road')).toBeDefined();
      expect(screen.getByText(/New road condition entry recorded/i)).toBeDefined();
    }, { timeout: 3000 });
  });

  it('renders Authority Cases tab with SOS events and allows acknowledging/resolving', async () => {
    render(<AuthorityShell activeTab="cases" />);

    expect(screen.getByText(/Emergency SOS Alerts & Tourist Dispatch Queue/i)).toBeDefined();
    expect(screen.getByText(/Zeeshan Khan/i)).toBeDefined();

    // Acknowledge the new SOS event
    const ackBtn = screen.getByTestId('btn-ack-sos-sos-demo-1');
    await act(async () => {
      fireEvent.click(ackBtn);
    });

    expect(screen.getByTestId('modal-sos-action')).toBeDefined();

    const noteInput = screen.getByTestId('input-sos-action-note');
    await act(async () => {
      fireEvent.change(noteInput, { target: { value: 'Dispatched Ushu rescue 1122 team.' } });
    });

    const confirmActionBtn = screen.getByTestId('btn-confirm-sos-action');
    await act(async () => {
      fireEvent.click(confirmActionBtn);
    });

    await waitFor(() => {
      expect(screen.getByText(/SOS status updated to acknowledged/i)).toBeDefined();
    });
  });
});
