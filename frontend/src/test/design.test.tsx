/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../design/Button';
import { Tag } from '../design/Tag';
import { Card } from '../design/Card';
import { ROLE_NAV_ITEMS } from '../layouts/navItems';

describe('Design System Tokens and Components', () => {
  it('renders Button with correct variant and text', () => {
    render(<Button variant="accent">Publish to tourists</Button>);
    const btn = screen.getByRole('button', { name: /Publish to tourists/i });
    expect(btn).toBeDefined();
    expect(btn.textContent).toContain('Publish to tourists');
  });

  it('renders Tag with status pill', () => {
    render(<Tag variant="ok">Verified</Tag>);
    const tag = screen.getByText('Verified');
    expect(tag).toBeDefined();
  });

  it('renders Card with children', () => {
    render(<Card><div>Card Content</div></Card>);
    const el = screen.getByText('Card Content');
    expect(el).toBeDefined();
  });

  it('ensures each role has navigation items matching the role specifications', () => {
    expect(ROLE_NAV_ITEMS.tourist).toHaveLength(5);
    expect(ROLE_NAV_ITEMS.business).toHaveLength(5);
    expect(ROLE_NAV_ITEMS.community).toHaveLength(4);
    expect(ROLE_NAV_ITEMS.authority).toHaveLength(6);

    expect(ROLE_NAV_ITEMS.tourist.map(i => i.label)).toEqual(['Home', 'Explore', 'Trips', 'Safety', 'Profile']);
    expect(ROLE_NAV_ITEMS.business.map(i => i.label)).toEqual(['Today', 'Listings', 'Availability', 'Reviews', 'Profile']);
    expect(ROLE_NAV_ITEMS.community.map(i => i.label)).toEqual(['Stories', 'Report', 'Services', 'Profile']);
    expect(ROLE_NAV_ITEMS.authority.map(i => i.label)).toEqual(['Overview', 'User Management', 'Directory', 'Advisories', 'Approvals', 'Cases']);
    expect(ROLE_NAV_ITEMS.admin.map(i => i.label)).toEqual(['Overview', 'User Management', 'Directory', 'Approvals', 'Cases & SOS', 'Advisories']);
  });
});
