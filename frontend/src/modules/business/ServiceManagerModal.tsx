import React, { useState } from 'react';
import { Card } from '../../design/Card';
import { Button } from '../../design/Button';
import { Tag } from '../../design/Tag';
import {
  X,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  addPriceItem,
  updatePriceItem,
  deletePriceItem,
  type ListingItem,
  type PriceItem,
  type PriceUnitCode,
} from '../../api/listings';

interface ServiceManagerModalProps {
  isOpen?: boolean;
  onClose: () => void;
  listing: ListingItem | null;
  onRefresh?: () => Promise<void> | void;
  onUpdated?: () => Promise<void> | void;
}

const UNIT_OPTIONS: { code: PriceUnitCode; label: string }[] = [
  { code: 'per_night', label: 'Per Night (Hotels & Homestays)' },
  { code: 'per_item', label: 'Per Item (Restaurants & Shops)' },
  { code: 'per_person', label: 'Per Person (Activities & Tours)' },
  { code: 'per_trip', label: 'Per Trip (Transport & Jeeps)' },
  { code: 'per_day', label: 'Per Day (Guides)' },
  { code: 'per_hour', label: 'Per Hour (Rentals & Activities)' },
  { code: 'per_seat', label: 'Per Seat (Shared Rides)' },
];

export const ServiceManagerModal: React.FC<ServiceManagerModalProps> = ({
  isOpen,
  onClose,
  listing,
  onRefresh,
  onUpdated,
}) => {
  if (!listing || (isOpen !== undefined && !isOpen)) return null;

  return (
    <ServiceManagerModalContent
      onClose={onClose}
      listing={listing}
      onRefresh={onRefresh}
      onUpdated={onUpdated}
    />
  );
};

const ServiceManagerModalContent: React.FC<{
  onClose: () => void;
  listing: ListingItem;
  onRefresh?: () => Promise<void> | void;
  onUpdated?: () => Promise<void> | void;
}> = ({ onClose, listing, onRefresh, onUpdated }) => {
  const [items, setItems] = useState<PriceItem[]>(listing.price_items || []);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState<PriceUnitCode>(
    listing.type_code === 'restaurant' || listing.type_code === 'shop'
      ? 'per_item'
      : listing.type_code === 'transport'
      ? 'per_trip'
      : listing.type_code === 'guide'
      ? 'per_day'
      : listing.type_code === 'activity'
      ? 'per_person'
      : 'per_night'
  );
  const [capacity, setCapacity] = useState('');
  const [description, setDescription] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCategory('');
    setPrice('');
    setCapacity('');
    setDescription('');
    setErrorMsg(null);
  };

  const handleStartEdit = (item: PriceItem) => {
    setEditingId(item.id || null);
    setName(item.name);
    setCategory(item.category || '');
    setPrice(String(item.price));
    setUnit(item.unit);
    setCapacity(item.capacity ? String(item.capacity) : '');
    setDescription(item.description || '');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg('Service name is required.');
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setErrorMsg('Please enter a valid price greater than 0.');
      return;
    }

    const payload = {
      name: name.trim(),
      category: category.trim() || undefined,
      price: numPrice,
      unit,
      capacity: capacity ? parseInt(capacity, 10) : undefined,
      description: description.trim() || undefined,
      is_bookable: true,
      is_active: true,
    };

    setSaving(true);
    try {
      if (editingId) {
        const updated = await updatePriceItem(editingId, payload);
        setItems((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
        setSuccessMsg(`Updated "${updated.name}" successfully.`);
      } else {
        const created = await addPriceItem(listing.id, payload);
        setItems((prev) => [...prev, created]);
        setSuccessMsg(`Added "${created.name}" successfully.`);
      }
      resetForm();
      if (onRefresh) await onRefresh();
      if (onUpdated) await onUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save service.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId?: string) => {
    if (!itemId) return;
    if (!confirm('Are you sure you want to remove this service / price item?')) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await deletePriceItem(itemId);
      setItems((prev) => prev.filter((p) => p.id !== itemId));
      setSuccessMsg('Service removed successfully.');
      if (editingId === itemId) resetForm();
      if (onRefresh) await onRefresh();
      if (onUpdated) await onUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete service.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg)',
          borderRadius: 'var(--radius-card)',
          width: '100%',
          maxWidth: '750px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-elevated)',
          border: '1px solid var(--line)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--ink)' }}>
              Manage Services & Pricing
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
              {listing.title} • {listing.type_label}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--mute)',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {errorMsg && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--bad)',
                color: 'var(--bad)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid var(--ok)',
                color: 'var(--ok)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 size={16} />
              {successMsg}
            </div>
          )}

          {/* Add / Edit Form */}
          <Card padding="md" style={{ border: '1px solid var(--pri)' }}>
            <h4
              style={{
                margin: '0 0 12px 0',
                fontSize: 'var(--font-base)',
                fontWeight: 700,
                color: 'var(--pri)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {editingId ? <Pencil size={16} /> : <Plus size={16} />}
              {editingId ? 'Edit Existing Service' : 'Add New Service / Price Item'}
            </h4>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                    Service / Room / Item Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                      listing.type_code === 'hotel'
                        ? 'e.g. Deluxe Riverside Room'
                        : listing.type_code === 'restaurant'
                        ? 'e.g. Trout Karahi Platter'
                        : listing.type_code === 'transport'
                        ? 'e.g. Kalam to Mahodand Lake 4x4'
                        : 'e.g. Full Day Guided Trek'
                    }
                    data-testid="input-service-name"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                      fontSize: 'var(--font-sm)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                    Category / Menu Section
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder={
                      listing.type_code === 'hotel'
                        ? 'e.g. Room, Extra, Activity'
                        : listing.type_code === 'restaurant'
                        ? 'e.g. Starters, Main, BBQ'
                        : 'e.g. Standard, Luxury'
                    }
                    data-testid="input-service-category"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                      fontSize: 'var(--font-sm)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                    Price (PKR) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 8500"
                    data-testid="input-service-price"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                      fontSize: 'var(--font-sm)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                    Pricing Unit *
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as PriceUnitCode)}
                    data-testid="select-service-unit"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                      fontSize: 'var(--font-sm)',
                    }}
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u.code} value={u.code}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                    Capacity (Persons/Seats)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="e.g. 2"
                    data-testid="input-service-capacity"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                      fontSize: 'var(--font-sm)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--mute)', marginBottom: '4px' }}>
                  Description / Features (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. River facing, breakfast included, king bed"
                  data-testid="input-service-description"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-button)',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: 'var(--font-sm)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                {editingId && (
                  <Button variant="secondary" size="sm" onClick={resetForm} type="button">
                    Cancel Edit
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={saving}
                  data-testid="btn-save-service"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Service' : 'Add Service'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Existing Items List */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--ink)' }}>
                  Current Offerings & Rates ({items.length})
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--mute)' }}>
                  Active services and room categories live on the tourist booking portal.
                </p>
              </div>
            </div>

            {items.length === 0 ? (
              <div
                style={{
                  padding: '32px 20px',
                  textAlign: 'center',
                  borderRadius: '12px',
                  border: '1.5px dashed var(--line)',
                  backgroundColor: 'var(--bg)',
                }}
              >
                <p style={{ margin: 0, fontSize: 'var(--font-sm)', color: 'var(--mute)', fontWeight: 500 }}>
                  No services or price items added yet. Use the form above to add your first service.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
                {items.map((item) => (
                  <div
                    key={item.id || item.name}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--card)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--ink)' }}>
                              {item.name}
                            </span>
                            {item.category && (
                              <Tag variant="neutral">{item.category}</Tag>
                            )}
                          </div>
                          {item.capacity && (
                            <span style={{ fontSize: '11.5px', color: 'var(--mute)', display: 'inline-block', marginTop: '3px' }}>
                              Capacity: {item.capacity} guests
                            </span>
                          )}
                        </div>

                        <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--pri)' }}>
                            PKR {Number(item.price).toLocaleString()}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--mute)', display: 'block' }}>
                            / {item.unit.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {item.description && (
                        <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--mute)', lineHeight: 1.45 }}>
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--line)' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Pencil size={13} />}
                        onClick={() => handleStartEdit(item)}
                        data-testid={`btn-edit-service-${item.id}`}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<Trash2 size={13} />}
                        onClick={() => handleDelete(item.id)}
                        data-testid={`btn-delete-service-${item.id}`}
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
