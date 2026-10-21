/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { CommunityShell } from '../modules/community/CommunityShell';
import { AuthorityShell } from '../modules/authority/AuthorityShell';

describe('Step 7: Community & Reports (Stories, Crafts, Reports, Host Applications, Authority Cases)', () => {
  it('renders Stories tab with published stories and opens Share a Story modal', async () => {
    render(<CommunityShell activeTab="stories" />);

    expect(screen.getByText(/Community Stories & Hidden Spots/i)).toBeDefined();
    expect(screen.getByText(/Secret Waterfall in Utror Valley/i)).toBeDefined();
    expect(screen.getByTestId('btn-open-share-modal')).toBeDefined();

    // Open modal
    const openBtn = screen.getByTestId('btn-open-share-modal');
    await act(async () => {
      fireEvent.click(openBtn);
    });

    expect(screen.getByTestId('modal-share-story')).toBeDefined();
    expect(screen.getByText(/Share a Community Story or Hidden Spot/i)).toBeDefined();

    // Fill form
    const titleInput = screen.getByTestId('input-story-title');
    const bodyInput = screen.getByTestId('input-story-body');

    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'Secret Pine Forest Spring' } });
      fireEvent.change(bodyInput, {
        target: { value: 'Follow the river trail past Ushu bridge for 2 kilometers to reach clear glacial spring waters.' },
      });
    });

    // Submit
    const submitBtn = screen.getByTestId('btn-submit-story');
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('Secret Pine Forest Spring')).toBeDefined();
      expect(screen.getByText(/Your community story has been shared/i)).toBeDefined();
    }, { timeout: 4000 });
  });

  it('allows community member to register and publish Cottage Crafts in the Services tab/form', async () => {
    render(<CommunityShell activeTab="hosts" />);

    expect(screen.getByText(/Become a Verified Community Host & Guide/i)).toBeDefined();

    // Select craft offer type
    const typeSelect = screen.getByTestId('select-host-type');
    const descInput = screen.getByTestId('input-host-desc');

    await act(async () => {
      fireEvent.change(typeSelect, { target: { value: 'craft' } });
      fireEvent.change(descInput, {
        target: { value: 'Pure Swat handwoven woolen shawls and organic mountain honey directly from village artisans.' },
      });
    });

    // Submit craft service
    const submitBtn = screen.getByTestId('btn-submit-host-app');
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(screen.getByText(/Application recorded for authority review/i)).toBeDefined();
      expect(screen.getByText('Cottage Craft Offering')).toBeDefined();
    });
  });

  it('allows tourist/citizen to submit a road blockage or litter complaint with GPS auto-fill', async () => {
    render(<CommunityShell activeTab="report" />);

    expect(screen.getByText(/Report a Road Hazard or Environmental Issue/i)).toBeDefined();
    expect(screen.getByTestId('btn-submit-report')).toBeDefined();

    // Fill report form
    const catSelect = screen.getByTestId('select-report-category');
    const titleInput = screen.getByTestId('input-report-title');
    const descInput = screen.getByTestId('input-report-desc');

    await act(async () => {
      fireEvent.change(catSelect, { target: { value: 'road_blocked' } });
      fireEvent.change(titleInput, { target: { value: 'Fallen rock on Bahrain Highway' } });
      fireEvent.change(descInput, { target: { value: 'Large boulder obstructing northern lane after heavy morning rain.' } });
    });

    // Submit
    const submitBtn = screen.getByTestId('btn-submit-report');
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(screen.getByText(/Report logged locally. Authorities notified./i)).toBeDefined();
      expect(screen.getByText('Fallen rock on Bahrain Highway')).toBeDefined();
    });
  });

  it('allows community member to submit host application and view application status', async () => {
    render(<CommunityShell activeTab="hosts" />);

    expect(screen.getByText(/Become a Verified Community Host & Guide/i)).toBeDefined();
    expect(screen.getByTestId('btn-submit-host-app')).toBeDefined();

    // Fill application form
    const typeSelect = screen.getByTestId('select-host-type');
    const descInput = screen.getByTestId('input-host-desc');

    await act(async () => {
      fireEvent.change(typeSelect, { target: { value: 'homestay' } });
      fireEvent.change(descInput, {
        target: { value: 'Traditional 3-room stone cottage in Kalam with mountain stream views and organic local breakfast.' },
      });
    });

    // Submit
    const submitBtn = screen.getByTestId('btn-submit-host-app');
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(screen.getByText(/Application recorded for authority review/i)).toBeDefined();
    });
  });

  it('allows community member to publish a 4x4 tour vehicle ride service, view it in services list, and remove it', async () => {
    render(<CommunityShell activeTab="hosts" />);

    expect(screen.getByText(/Become a Verified Community Host & Guide/i)).toBeDefined();

    // Select transport offer type
    const typeSelect = screen.getByTestId('select-host-type');
    const descInput = screen.getByTestId('input-host-desc');

    await act(async () => {
      fireEvent.change(typeSelect, { target: { value: 'transport' } });
      fireEvent.change(descInput, {
        target: { value: 'Mountain 4x4 Prado available for Lake Mahodand expeditions and Kalam valley tours.' },
      });
    });

    // Submit service
    const submitBtn = screen.getByTestId('btn-submit-host-app');
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // Check that it appears in published services
    await waitFor(() => {
      expect(screen.getByText(/4x4 Tour Vehicle Hire/i)).toBeDefined();
    });

    // Find remove button for the newly created service
    const removeButtons = screen.getAllByRole('button', { name: /Remove .* service/i });
    expect(removeButtons.length).toBeGreaterThan(0);

    const initialRemoveButtonsCount = removeButtons.length;
    await act(async () => {
      fireEvent.click(removeButtons[0]);
    });

    // Verify it is removed
    await waitFor(() => {
      const remaining = screen.queryAllByRole('button', { name: /Remove .* service/i });
      expect(remaining.length).toBe(initialRemoveButtonsCount - 1);
    });
  });

  it('renders Authority Cases tab with Community Reports sub-tab and resolves report with notes', async () => {
    render(<AuthorityShell activeTab="cases" />);

    // Switch to Community Reports sub-tab
    const reportsSubTabBtn = screen.getByTestId('subtab-reports');
    await act(async () => {
      fireEvent.click(reportsSubTabBtn);
    });

    expect(screen.getByText(/Citizen & Tourist Issue Reports/i)).toBeDefined();
    expect(screen.getByText(/Landslide partially blocking one lane/i)).toBeDefined();

    // Click Assign on the new report
    const assignBtn = screen.getByTestId('btn-assign-report-rep-demo-1');
    await act(async () => {
      fireEvent.click(assignBtn);
    });

    expect(screen.getByTestId('modal-report-action')).toBeDefined();
    expect(screen.getByText(/Assign Report \/ Take Action/i)).toBeDefined();

    // Fill assignment note and confirm
    const noteInput = screen.getByTestId('input-report-action-note');
    await act(async () => {
      fireEvent.change(noteInput, { target: { value: 'Assigned to Swat District Highway clearance team.' } });
    });

    const confirmBtn = screen.getByTestId('btn-confirm-report-action');
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    await waitFor(() => {
      expect(screen.getByText(/Community report marked as assigned/i)).toBeDefined();
    });
  });
});

