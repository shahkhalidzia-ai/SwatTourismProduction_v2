import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ListingBuilderModal } from '../modules/business/ListingBuilderModal';
import { BusinessShell } from '../modules/business/BusinessShell';
import { AuthProvider } from '../context/AuthContext';

describe('Step 2: Listing Engine & Builder Verification', () => {
  it('renders ListingBuilderModal with all 6 business type options', () => {
    const handleClose = vi.fn();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ListingBuilderModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
        initialType="hotel"
      />
    );

    expect(screen.getByTestId('listing-builder-modal')).toBeDefined();
    expect(screen.getByText('Create Tourism Listing')).toBeDefined();

    // Verify all 6 category chips exist
    expect(screen.getByTestId('type-btn-hotel')).toBeDefined();
    expect(screen.getByTestId('type-btn-restaurant')).toBeDefined();
    expect(screen.getByTestId('type-btn-transport')).toBeDefined();
    expect(screen.getByTestId('type-btn-guide')).toBeDefined();
    expect(screen.getByTestId('type-btn-activity')).toBeDefined();
    expect(screen.getByTestId('type-btn-shop')).toBeDefined();
  });

  it('dynamically adapts form fields when switching between listing types', async () => {
    const handleClose = vi.fn();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ListingBuilderModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
        initialType="hotel"
      />
    );

    // Initial state: Hotel fields
    expect(screen.getByText('Hotel Specifications')).toBeDefined();
    expect(screen.getByTestId('select-hotel-stars')).toBeDefined();

    // Switch to Restaurant
    await act(async () => {
      fireEvent.click(screen.getByTestId('type-btn-restaurant'));
    });
    expect(screen.getByText('Restaurant Specifications')).toBeDefined();
    expect(screen.getByPlaceholderText(/Swati Trout & Traditional BBQ/i)).toBeDefined();
    expect(screen.getByText('100% Halal Certified')).toBeDefined();

    // Switch to Transport
    await act(async () => {
      fireEvent.click(screen.getByTestId('type-btn-transport'));
    });
    expect(screen.getByText('Transport Specifications')).toBeDefined();
    expect(screen.getByPlaceholderText(/4x4 Willys Jeep/i)).toBeDefined();

    // Switch to Guide
    await act(async () => {
      fireEvent.click(screen.getByTestId('type-btn-guide'));
    });
    expect(screen.getByText('Guide Specifications')).toBeDefined();
    expect(screen.getByText('Years Experience')).toBeDefined();

    // Switch to Activity
    await act(async () => {
      fireEvent.click(screen.getByTestId('type-btn-activity'));
    });
    expect(screen.getByText('Activity Specifications')).toBeDefined();
    expect(screen.getByText(/Safety Gear Included/i)).toBeDefined();

    // Switch to Shop
    await act(async () => {
      fireEvent.click(screen.getByTestId('type-btn-shop'));
    });
    expect(screen.getByText('Shop Specifications')).toBeDefined();
    expect(screen.getByText(/Authenticity Certificate Provided/i)).toBeDefined();
  });

  it('allows adding price items and validates required fields before submission', async () => {
    const handleClose = vi.fn();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ListingBuilderModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
        initialType="hotel"
      />
    );

    // Click "Add Item" to add another pricing row
    const addBtn = screen.getByTestId('btn-add-price-item');
    await act(async () => {
      fireEvent.click(addBtn);
    });

    expect(screen.getByTestId('price-item-name-0')).toBeDefined();
    expect(screen.getByTestId('price-item-name-1')).toBeDefined();

    // Try submit without title
    const saveDraftBtn = screen.getByTestId('btn-save-draft');
    await act(async () => {
      fireEvent.click(saveDraftBtn);
    });

    expect(screen.getByText(/Listing title is required/i)).toBeDefined();
    expect(handleSubmit).not.toHaveBeenCalled();

    // Fill title and price items
    const titleInput = screen.getByTestId('input-listing-title');
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'Mahodand Lake Glamping' } });
      fireEvent.change(screen.getByTestId('price-item-name-0'), { target: { value: 'Deluxe Alpine Tent' } });
      fireEvent.change(screen.getByTestId('price-item-price-0'), { target: { value: '9500' } });
    });

    // Submit as draft
    await act(async () => {
      fireEvent.click(saveDraftBtn);
    });

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Mahodand Lake Glamping',
        type_code: 'hotel',
        price_items: expect.arrayContaining([
          expect.objectContaining({ name: 'Deluxe Alpine Tent', price: 9500 }),
        ]),
      }),
      false, // publishNow = false
      undefined,
      expect.any(Array),
      undefined
    );
  });

  it('pre-populates existing property details and locks category for registered business', async () => {
    const handleClose = vi.fn();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    const mockExistingListing = {
      id: 'listing-serena-hotel',
      title: 'Swat Serena Hotel',
      type_code: 'hotel',
      address_text: 'Opposite Swat Museum, Saidu Sharif',
      phone: '+92 946 711640',
      price_items: [
        { id: 'r1', name: 'Executive Deluxe Room', price: 18500, unit: 'per_night', capacity: 2 },
      ],
    };

    render(
      <ListingBuilderModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
        existingListing={mockExistingListing}
        businessProfile={{ business_name: 'Swat Serena Hotel', primary_type: 'hotel' }}
        lockType={true}
      />
    );

    // Verify modal title reflects property
    expect(screen.getByText(/Edit Property Details — Swat Serena Hotel/i)).toBeDefined();

    // Verify title input is pre-populated
    const titleInput = screen.getByDisplayValue('Swat Serena Hotel');
    expect(titleInput).toBeDefined();

    // Verify category badge is present
    expect(screen.getByText(/Locked to Registered Business Profile: HOTEL/i)).toBeDefined();

    // Verify save button says "Save & Update Property"
    expect(screen.getByText('Save & Update Property')).toBeDefined();
  });

  it('supports dedicated room photo selection in ListingBuilderModal', async () => {
    const handleClose = vi.fn();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ListingBuilderModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
        initialType="hotel"
      />
    );

    // Verify room photo file input exists for room item 0
    const roomPhotoInput = screen.getByTestId('input-room-photo-0');
    expect(roomPhotoInput).toBeDefined();

    // Verify Upload Room Photo label
    expect(screen.getByText('Upload Room Photo')).toBeDefined();

    // Simulate selecting a room photo file
    const fakeFile = new File(['dummy photo content'], 'deluxe_room.jpg', { type: 'image/jpeg' });
    await act(async () => {
      fireEvent.change(roomPhotoInput, { target: { files: [fakeFile] } });
    });

    // Check that button text switches to Replace Room Photo
    expect(screen.getByText('Replace Room Photo')).toBeDefined();
  });

  it('BusinessShell triggers ListingBuilderModal on Add listing click', async () => {
    render(
      <AuthProvider>
        <BusinessShell activeTab="listings" />
      </AuthProvider>
    );

    // Initially modal is not open
    expect(screen.queryByTestId('listing-builder-modal')).toBeNull();

    // Click "Edit Property Details" button (opens builder)
    const addListingBtn = screen.getByTestId('btn-open-listing-builder');
    await act(async () => {
      fireEvent.click(addListingBtn);
    });

    // Modal is now open
    expect(screen.getByTestId('listing-builder-modal')).not.toBeNull();
  });
});
