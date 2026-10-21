import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  UtensilsCrossed,
  CheckCircle2,
  Navigation,
  Plus,
  Check,
  Sparkles,
} from 'lucide-react';
import { Tag } from '../../design/Tag';
import { Button } from '../../design/Button';
import type { ListingItem, PriceItem } from '../../api/listings';
import { getDishImage, getDishBadge } from '../../utils/dishImages';

interface RestaurantDetailsModalProps {
  restaurant: ListingItem | null;
  onClose: () => void;
  onViewMap?: (lat: number, lng: number, title: string, areaName?: string) => void;
  onAddMenuItemToTrip?: (item: PriceItem) => void;
}

export const RestaurantDetailsModal: React.FC<RestaurantDetailsModalProps> = ({
  restaurant,
  onClose,
  onViewMap,
  onAddMenuItemToTrip,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!restaurant) return null;

  const details = restaurant.details || {};
  const phone = restaurant.phone || details.phone || '+92-946-812888';
  const whatsapp = restaurant.whatsapp_number || details.whatsapp_number || '+92-345-8128880';
  const address = restaurant.address_text || details.address || `${restaurant.area_name || 'Swat Valley'}, Swat, KP, Pakistan`;
  const hours = (restaurant.opening_time && restaurant.closing_time)
    ? `${restaurant.opening_time} - ${restaurant.closing_time}`
    : (details.opening_hours || '08:00 AM – 11:00 PM (Daily)');

  // Fallback / default menu items if price_items is small
  const defaultMenuItems: PriceItem[] = [
    {
      id: 'm-1',
      name: 'Pan-Fried Swat River Trout',
      category: 'Fresh River Trout',
      price: 1400,
      unit: 'per_item',
      description: 'Live catch cold-water river trout pan-seared with wild mountain mint, lemon, garlic, and served with hot naan.',
      is_bookable: false,
    },
    {
      id: 'm-2',
      name: 'Trout Fish Karahi (Full)',
      category: 'Fresh River Trout',
      price: 1800,
      unit: 'per_item',
      description: 'Fresh trout cooked in an authentic iron wok with fresh tomatoes, green chilies, ginger, and crushed black pepper.',
      is_bookable: false,
    },
    {
      id: 'm-3',
      name: 'Traditional Chapli Kebab (2 pcs)',
      category: 'BBQ & Kebabs',
      price: 600,
      unit: 'per_item',
      description: 'Crispy pan-fried beef patties spiced with crushed coriander, dried pomegranate seeds, and fresh tomato slices.',
      is_bookable: false,
    },
    {
      id: 'm-4',
      name: 'Special Mutton Karahi (1kg)',
      category: 'Karahi & Curries',
      price: 2200,
      unit: 'per_item',
      description: 'Slow-cooked mountain mutton in pure butter, green chilies, and ripe tomatoes. Serves 3-4 persons.',
      is_bookable: false,
    },
    {
      id: 'm-5',
      name: 'Chicken Shinwari Tikka (Half)',
      category: 'BBQ & Kebabs',
      price: 850,
      unit: 'per_item',
      description: 'Tender chicken pieces lightly salted and char-grilled over natural mountain wood coals.',
      is_bookable: false,
    },
    {
      id: 'm-6',
      name: 'Swati Kabuli Pulao',
      category: 'Rice & Breads',
      price: 650,
      unit: 'per_item',
      description: 'Long-grain fragrant Basmati rice with tender braised meat, sweet caramelized carrots, and golden sultanas.',
      is_bookable: false,
    },
    {
      id: 'm-7',
      name: 'Kandahari Sesame Tandoor Naan',
      category: 'Rice & Breads',
      price: 70,
      unit: 'per_item',
      description: 'Hot clay oven baked bread with sesame seeds and butter glaze.',
      is_bookable: false,
    },
    {
      id: 'm-8',
      name: 'Peshawari Cardamom Qahwa',
      category: 'Beverages',
      price: 120,
      unit: 'per_item',
      description: 'Traditional green tea infused with crushed cardamom pods and saffron, served with hard crystal candy.',
      is_bookable: false,
    },
    {
      id: 'm-9',
      name: 'Kalam Walnut & Desi Ghee Halwa',
      category: 'Desserts',
      price: 350,
      unit: 'per_item',
      description: 'Warm traditional dessert rich with local wild walnuts, milk khoya, and organic butter.',
      is_bookable: false,
    },
  ];

  const menuItems: PriceItem[] = (restaurant.price_items && restaurant.price_items.length >= 3)
    ? restaurant.price_items
    : defaultMenuItems;

  // Categories extraction
  const categories = ['all', ...Array.from(new Set(menuItems.map((m) => m.category || 'Specialties')))];


  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(10, 26, 40, 0.72)',
        backdropFilter: 'blur(5px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--card)',
          borderRadius: 'var(--radius-card)',
          maxWidth: '820px',
          width: '100%',
          maxHeight: 'min(92vh, 100%)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.28)',
          border: '1px solid var(--line)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
        data-testid="restaurant-details-modal"
      >
        {/* Restaurant Cover Photo Banner */}
        <div
          style={{
            height: '180px',
            backgroundImage: 'url(/images/trout_restaurant.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.65) 100%)',
            }}
          />
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--line)',
            background: 'var(--card)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <Tag variant="accent" icon={<UtensilsCrossed size={12} />}>
                Restaurant & Dining
              </Tag>
              {restaurant.is_verified && (
                <Tag variant="ok" icon={<CheckCircle2 size={12} />}>
                  Verified Food Hygiene
                </Tag>
              )}
              <Tag variant="neutral">
                {details.cuisine || 'Traditional Swati Cuisine'}
              </Tag>
            </div>

            <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
              {restaurant.title}
            </h2>

            <p style={{ margin: '6px 0 0 0', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
              {restaurant.description || 'Famous traditional restaurant serving fresh Swat river trout, authentic chapli kebabs, and mountain karahi dishes.'}
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
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close dialog"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* SECTION 1: CONTACT NO & LOCATION BOX */}
          <div
            style={{
              padding: '18px 20px',
              borderRadius: 'var(--radius-card)',
              backgroundColor: 'var(--soft)',
              border: '1px solid var(--line)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
            data-testid="restaurant-contact-location-box"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={16} color="var(--pri)" /> Contact & Location Information
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                <Clock size={13} color="var(--pri)" />
                <strong>Hours:</strong> {hours}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '16px',
              }}
            >
              {/* Contact Card */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-button)',
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--line)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', fontWeight: 600 }}>
                  DIRECT CONTACT & RESERVATIONS:
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--ink)' }}>
                  <Phone size={16} color="var(--ok)" />
                  <span>{phone}</span>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <a
                    href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-button)',
                      backgroundColor: 'var(--pri)',
                      color: '#FFFFFF',
                      fontSize: 'var(--font-xs)',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    <Phone size={13} /> Call Restaurant
                  </a>

                  {whatsapp && (
                    <a
                      href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-button)',
                        backgroundColor: '#25D366',
                        color: '#FFFFFF',
                        fontSize: 'var(--font-xs)',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      <MessageCircle size={13} /> WhatsApp
                    </a>
                  )}
                </div>
              </div>

              {/* Location Card */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-button)',
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--line)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)', fontWeight: 600 }}>
                  PHYSICAL LOCATION & AREA:
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: 'var(--font-xs)', color: 'var(--ink)' }}>
                  <MapPin size={16} color="var(--pri)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{address}</div>
                    <div style={{ color: 'var(--mute)', marginTop: '2px' }}>
                      Region: <strong>{restaurant.area_name || 'Kalam Valley, Swat'}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 'auto' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Navigation size={13} />}
                    onClick={() => {
                      if (onViewMap) {
                        onViewMap(restaurant.latitude || 35.48, restaurant.longitude || 72.58, restaurant.title, restaurant.area_name);
                      }
                    }}
                    id="btn-restaurant-view-map"
                  >
                    View Interactive Map & Coordinates
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: MENU OF THAT RESTAURANT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--ink)' }}>
                  Restaurant Menu & Specialties ({menuItems.length} items)
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                  Fresh authentic dishes prepared daily using local Swat ingredients and mountain recipes.
                </p>
              </div>

              {/* Category Filter Chips */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '16px',
                      border: '1px solid var(--line)',
                      backgroundColor: selectedCategory === cat ? 'var(--pri)' : 'var(--soft)',
                      color: selectedCategory === cat ? '#FFFFFF' : 'var(--ink)',
                      fontSize: '11px',
                      fontWeight: selectedCategory === cat ? 700 : 500,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Grouped by Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {(selectedCategory === 'all'
                ? Array.from(new Set(menuItems.map((m) => m.category || 'Specialties')))
                : [selectedCategory]
              ).map((sectionName) => {
                const sectionItems = menuItems.filter(
                  (m) => (m.category || 'Specialties') === sectionName
                );
                if (sectionItems.length === 0) return null;

                return (
                  <div key={sectionName}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '10px',
                        borderBottom: '1px solid var(--line)',
                        paddingBottom: '4px',
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          fontSize: 'var(--font-sm)',
                          fontWeight: 700,
                          color: 'var(--pri)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {sectionName}
                      </h4>
                      <span style={{ fontSize: '11px', color: 'var(--mute)' }}>
                        ({sectionItems.length} item{sectionItems.length > 1 ? 's' : ''})
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                        gap: '16px',
                      }}
                    >
                      {sectionItems.map((item) => {
                        const dishImg = getDishImage(item.name, item.category);
                        const dishBadge = getDishBadge(item.name, item.category);

                        return (
                          <div
                            key={item.id}
                            style={{
                              borderRadius: 'var(--radius-card)',
                              border: '1px solid var(--line)',
                              backgroundColor: 'var(--card)',
                              display: 'flex',
                              flexDirection: 'column',
                              overflow: 'hidden',
                              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            }}
                            data-testid={`restaurant-menu-item-${item.id}`}
                          >
                            {/* Elegant Dish Image Banner */}
                            <div
                              style={{
                                position: 'relative',
                                width: '100%',
                                height: '160px',
                                overflow: 'hidden',
                                backgroundColor: 'var(--soft)',
                              }}
                            >
                              <img
                                src={dishImg}
                                alt={item.name}
                                loading="lazy"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  display: 'block',
                                  transition: 'transform 0.3s ease',
                                }}
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = '/images/dishes/swat_trout.jpg';
                                }}
                              />

                              {/* Culinary Specialty Badge */}
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '10px',
                                  left: '10px',
                                  backgroundColor: 'rgba(15, 23, 42, 0.78)',
                                  backdropFilter: 'blur(6px)',
                                  color: '#FFFFFF',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '4px 10px',
                                  borderRadius: '20px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                                  letterSpacing: '0.3px',
                                }}
                              >
                                <Sparkles size={12} color="#FBBF24" />
                                {dishBadge}
                              </div>

                              {/* Price Floating Pill */}
                              <div
                                style={{
                                  position: 'absolute',
                                  bottom: '10px',
                                  right: '10px',
                                  backgroundColor: 'var(--pri)',
                                  color: '#FFFFFF',
                                  fontSize: 'var(--font-sm)',
                                  fontWeight: 800,
                                  padding: '5px 12px',
                                  borderRadius: '16px',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                                }}
                              >
                                PKR {Number(item.price).toLocaleString()}
                              </div>
                            </div>

                            {/* Card Content */}
                            <div
                              style={{
                                padding: '14px 16px',
                                display: 'flex',
                                flexDirection: 'column',
                                flex: 1,
                                justifyContent: 'space-between',
                                gap: '12px',
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                  <h4 style={{ margin: 0, fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.35 }}>
                                    {item.name}
                                  </h4>
                                </div>

                                {item.category && (
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      fontSize: '10.5px',
                                      fontWeight: 600,
                                      color: 'var(--mute)',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px',
                                      marginTop: '3px',
                                    }}
                                  >
                                    {item.category}
                                  </span>
                                )}

                                <p style={{ margin: '6px 0 0 0', fontSize: 'var(--font-xs)', color: 'var(--mute)', lineHeight: 1.45 }}>
                                  {item.description || 'Authentic dish prepared fresh to order with traditional mountain seasonings.'}
                                </p>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '10px', borderTop: '1px dashed var(--line)' }}>
                                <span style={{ fontSize: '11px', color: 'var(--ok)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                  <Check size={13} /> 100% Halal & Fresh
                                </span>

                                <Button
                                  variant="secondary"
                                  size="sm"
                                  icon={<Plus size={12} />}
                                  onClick={() => onAddMenuItemToTrip && onAddMenuItemToTrip(item)}
                                >
                                  Add to Trip Stop
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--line)',
            backgroundColor: 'var(--soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
            To reserve a table or order ahead, call{' '}
            <strong style={{ color: 'var(--ink)' }}>{phone}</strong>
          </div>

          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
