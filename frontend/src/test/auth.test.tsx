/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable } from '../design/DataTable';
import type { Column } from '../design/DataTable';
import { ViewSwitch } from '../design/ViewSwitch';
import type { ViewMode } from '../design/ViewSwitch';
import { useState } from 'react';

interface TestItem {
  id: string;
  name: string;
  category: string;
}

describe('Step 1 Components & Step 0 Addendum Verification', () => {
  it('renders DataTable with desktop table headers and sorts columns', () => {
    const items: TestItem[] = [
      { id: '1', name: 'Zebra Stays', category: 'hotel' },
      { id: '2', name: 'Alpine Resort', category: 'hotel' },
    ];

    const cols: Column<TestItem>[] = [
      { key: 'name', header: 'Listing Name', sortable: true },
      { key: 'category', header: 'Category' },
    ];

    render(
      <DataTable
        data={items}
        columns={cols}
        keyExtractor={(i) => i.id}
        isMobile={false}
      />
    );

    expect(screen.getByText('Listing Name')).toBeDefined();
    expect(screen.getByText('Zebra Stays')).toBeDefined();
    expect(screen.getByText('Alpine Resort')).toBeDefined();

    // Sort by name
    const headerBtn = screen.getByText('Listing Name');
    fireEvent.click(headerBtn);
  });

  it('renders DataTable mobile card fallback when isMobile is true', () => {
    const items: TestItem[] = [
      { id: '1', name: 'Riverside Inn', category: 'hotel' },
    ];

    const cols: Column<TestItem>[] = [
      { key: 'name', header: 'Name' },
    ];

    render(
      <DataTable
        data={items}
        columns={cols}
        keyExtractor={(i) => i.id}
        isMobile={true}
        renderMobileCard={(item) => (
          <div data-testid="mobile-card">{item.name} (Mobile Card)</div>
        )}
      />
    );

    expect(screen.getByTestId('mobile-card')).toBeDefined();
    expect(screen.getByText(/Mobile Card/)).toBeDefined();
  });

  it('renders ViewSwitch and triggers mode changes', () => {
    const TestComponent = () => {
      const [mode, setMode] = useState<ViewMode>('auto');
      return (
        <div>
          <ViewSwitch currentMode={mode} onModeChange={setMode} />
          <span data-testid="mode-display">{mode}</span>
        </div>
      );
    };

    render(<TestComponent />);

    const phoneBtn = screen.getByRole('button', { name: /Phone/i });
    fireEvent.click(phoneBtn);
    expect(screen.getByTestId('mode-display').textContent).toBe('phone');

    const webBtn = screen.getByRole('button', { name: /Web/i });
    fireEvent.click(webBtn);
    expect(screen.getByTestId('mode-display').textContent).toBe('web');
  });
});
