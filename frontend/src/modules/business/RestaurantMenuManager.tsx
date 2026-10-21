import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../../design/Card';
import { Button } from '../../design/Button';
import { Tag } from '../../design/Tag';
import { Chip } from '../../design/Chip';
import {
  Utensils,
  Plus,
  Pencil,
  Trash2,
  Search,
  CheckCircle2,
  X,
  AlertTriangle,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  addPriceItem,
  updatePriceItem,
  deletePriceItem,
  type ListingItem,
  type PriceItem,
  type PriceUnitCode,
} from '../../api/listings';
import { getDishImage, getDishBadge } from '../../utils/dishImages';

interface RestaurantMenuManagerProps {
  listing: ListingItem;
  restaurantName: string;
  onRefresh?: () => Promise<void> | void;
  showToast: (msg: string) => void;
}

export const MENU_CATEGORIES = [
  'All Dishes',
  'Fresh Trout & River Fish',
  'Traditional BBQ & Karahi',
  'Rice, Breads & Soups',
  'Desserts & Traditional Beverages',
  'Chef Specials & Platters',
];

export const DEFAULT_DISHES: PriceItem[] = [
  {
    id: 'p-dish-1',
    name: 'Swati River Fresh Trout (Per KG)',
    category: 'Fresh Trout & River Fish',
    price: 3200,
    unit: 'per_item',
    description: 'Freshly caught Swat River trout marinated in wild alpine herbs, pan-seared with crushed coriander, garlic butter, and traditional tamarind chutney.',
    is_active: true,
    is_bookable: true,
    default_units: 30,
  },
  {
    id: 'p-dish-2',
    name: 'Peshawari Chapli Kebab Family Platter',
    category: 'Traditional BBQ & Karahi',
    price: 1400,
    unit: 'per_item',
    description: 'Traditional spiced ground beef patties infused with dried pomegranate seeds, fresh mint, coriander, and pan-fried to crisp perfection. Served with hot Roghni Naan.',
    is_active: true,
    is_bookable: true,
    default_units: 50,
  },
  {
    id: 'p-dish-3',
    name: 'Authentic Shinwari Mutton Karahi',
    category: 'Traditional BBQ & Karahi',
    price: 2800,
    unit: 'per_item',
    description: 'Mountain-grazed lamb cooked in pure mutton fat with rock salt, whole green chilies, and ripe tomatoes. Zero artificial spices, pure alpine taste.',
    is_active: true,
    is_bookable: true,
    default_units: 25,
  },
  {
    id: 'p-dish-4',
    name: 'Fragrant Kabuli Pulao with Raisins',
    category: 'Rice, Breads & Soups',
    price: 950,
    unit: 'per_item',
    description: 'Long-grain sella basmati simmered in aromatic meat broth, crowned with caramelized carrots, golden raisins, and slivered almonds.',
    is_active: true,
    is_bookable: true,
    default_units: 40,
  },
  {
    id: 'p-dish-5',
    name: 'Swati Green Tea Kahwa (Pot of 4)',
    category: 'Desserts & Traditional Beverages',
    price: 350,
    unit: 'per_item',
    description: 'Pure green tea leaves brewed with crushed green cardamom, saffron threads, and crushed local almonds. Served with crystalline rock sugar.',
    is_active: true,
    is_bookable: true,
    default_units: 80,
  },
  {
    id: 'p-dish-6',
    name: 'Swat Valley Walnut Halwa Pudding',
    category: 'Desserts & Traditional Beverages',
    price: 600,
    unit: 'per_item',
    description: 'Slow-cooked semolina halwa enriched with pure desi ghee, organic honey, and hand-cracked Kalam walnuts.',
    is_active: true,
    is_bookable: true,
    default_units: 20,
  },
  {
    id: 'p-dish-7',
    name: 'Royal Swat River Trout & Shinwari BBQ Platter',
    category: 'Chef Specials & Platters',
    price: 4800,
    unit: 'per_item',
    description: 'Grand mountain feast featuring 1kg wood-smoked trout, succulent lamb chops, chapli kebabs, roghni naan, fresh mint raita, and saffron kahwa. Serves 4 persons.',
    is_active: true,
    is_bookable: true,
    default_units: 15,
  },
  {
    id: 'p-dish-8',
    name: 'Kalam Valley Chef Dumba Karahi Special',
    category: 'Chef Specials & Platters',
    price: 3900,
    unit: 'per_item',
    description: 'Signature slow-simmered organic mountain sheep karahi cooked in marrow fat with black pepper and whole green chilies. House specialty.',
    is_active: true,
    is_bookable: true,
    default_units: 20,
  },
];

/**
 * Checks if a given price item represents accommodation / rooms data rather than food.
 */
export const isRoomOrAccommodationItem = (item?: PriceItem | null): boolean => {
  if (!item) return false;
  // unit check: per_night is strictly hotel accommodation
  if (item.unit === 'per_night') return true;

  const nameLower = (item.name || '').toLowerCase();
  const catLower = (item.category || '').toLowerCase();

  // category check
  if (
    ['room', 'rooms', 'suite', 'suites', 'accommodation', 'lodging', 'stay', 'extra'].includes(
      catLower
    )
  ) {
    // If it's explicitly a food item that got miscategorized as 'extra', let's check name
    if (
      !nameLower.includes('trout') &&
      !nameLower.includes('karahi') &&
      !nameLower.includes('kebab') &&
      !nameLower.includes('kahwa') &&
      !nameLower.includes('salad') &&
      !nameLower.includes('cake') &&
      !nameLower.includes('platter') &&
      !nameLower.includes('special')
    ) {
      return true;
    }
  }

  // name check for typical room & hotel keywords
  if (
    nameLower.includes('deluxe room') ||
    nameLower.includes('twin room') ||
    nameLower.includes('presidential suite') ||
    nameLower.includes('mountain view suite') ||
    nameLower.includes('pine suite') ||
    nameLower.includes('river view room') ||
    nameLower.includes('banquet hall') ||
    nameLower.includes('conference hall') ||
    nameLower.includes('buffet breakfast extra') ||
    (nameLower.includes('room') && !nameLower.includes('mushroom')) ||
    (nameLower.includes('suite') && !nameLower.includes('sweet'))
  ) {
    return true;
  }

  return false;
};

/**
 * Maps any generic or backend category into standard Swati culinary categories.
 * Strictly respects official MENU_CATEGORIES so user selections are NEVER overridden!
 */
export const normalizeDishCategory = (category?: string, name?: string): string => {
  if (category && MENU_CATEGORIES.includes(category) && category !== 'All Dishes') {
    return category;
  }

  const cat = (category || '').toLowerCase();
  const n = (name || '').toLowerCase();

  if (cat.includes('special') || cat.includes('platter') || n.includes('platter') || n.includes('special')) {
    return 'Chef Specials & Platters';
  }
  if (cat.includes('trout') || cat.includes('fish') || n.includes('trout') || n.includes('fish')) {
    return 'Fresh Trout & River Fish';
  }
  if (
    cat.includes('bbq') ||
    cat.includes('karahi') ||
    cat.includes('kebab') ||
    cat.includes('mutton') ||
    cat.includes('beef') ||
    cat.includes('chicken') ||
    cat.includes('tikka') ||
    cat.includes('main') ||
    n.includes('karahi') ||
    n.includes('kebab')
  ) {
    return 'Traditional BBQ & Karahi';
  }
  if (
    cat.includes('rice') ||
    cat.includes('pulao') ||
    cat.includes('biryani') ||
    cat.includes('bread') ||
    cat.includes('naan') ||
    cat.includes('roti') ||
    cat.includes('soup') ||
    cat.includes('starter') ||
    cat.includes('salad') ||
    n.includes('pulao') ||
    n.includes('salad')
  ) {
    return 'Rice, Breads & Soups';
  }
  if (
    cat.includes('drink') ||
    cat.includes('beverage') ||
    cat.includes('tea') ||
    cat.includes('kahwa') ||
    cat.includes('qahwa') ||
    cat.includes('dessert') ||
    cat.includes('sweet') ||
    cat.includes('cake') ||
    cat.includes('halwa') ||
    n.includes('kahwa') ||
    n.includes('tea') ||
    n.includes('cake') ||
    n.includes('halwa')
  ) {
    return 'Desserts & Traditional Beverages';
  }
  return 'Chef Specials & Platters';
};

/**
 * Clears room data from price items and returns only pure restaurant dishes.
 */
export const sanitizeDishes = (items?: PriceItem[]): PriceItem[] => {
  if (!items || items.length === 0) return DEFAULT_DISHES;
  const dishesOnly = items
    .filter((item) => !isRoomOrAccommodationItem(item))
    .map((item) => ({
      ...item,
      category: normalizeDishCategory(item.category, item.name),
    }));

  // If every item was room data, fallback safely to standard Swat menu dishes
  if (dishesOnly.length === 0) {
    return DEFAULT_DISHES;
  }
  return dishesOnly;
};

/**
 * Local persistence helpers so user-added dishes persist reliably across refreshes.
 */
export const getStoredDishes = (restaurantName: string): PriceItem[] | null => {
  try {
    const raw = localStorage.getItem(
      `swat_restaurant_menu_${restaurantName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
    );
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return sanitizeDishes(parsed);
      }
    }
  } catch {
    // Ignore storage parse error
  }
  return null;
};

export const saveStoredDishes = (restaurantName: string, dishes: PriceItem[]) => {
  try {
    localStorage.setItem(
      `swat_restaurant_menu_${restaurantName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      JSON.stringify(dishes)
    );
  } catch {
    // Ignore storage quota error
  }
};

export const RestaurantMenuManager: React.FC<RestaurantMenuManagerProps> = ({
  listing,
  restaurantName,
  onRefresh,
  showToast,
}) => {
  const [menuItems, setMenuItems] = useState<PriceItem[]>(() => {
    const stored = getStoredDishes(restaurantName);
    if (stored && stored.length > 0) return stored;
    return sanitizeDishes(listing?.price_items);
  });

  // Re-synchronize when restaurant or listing ID changes
  useEffect(() => {
    const stored = getStoredDishes(restaurantName);
    if (stored && stored.length > 0) {
      setMenuItems(stored);
    } else {
      setMenuItems(sanitizeDishes(listing?.price_items));
    }
  }, [restaurantName, listing?.id]);

  const [selectedCategory, setSelectedCategory] = useState<string>('All Dishes');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<PriceItem | null>(null);

  // Form state
  const [dishName, setDishName] = useState('');
  const [dishCategory, setDishCategory] = useState('Fresh Trout & River Fish');
  const [dishPrice, setDishPrice] = useState<number | ''>(1200);
  const [dishUnit, setDishUnit] = useState<PriceUnitCode>('per_item');
  const [dishDescription, setDishDescription] = useState('');
  const [dishIsActive, setDishIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<PriceItem | null>(null);

  // Filtered menu list (strictly guarantees NO room data is ever displayed)
  const filteredDishes = useMemo(() => {
    return menuItems
      .filter((dish) => !isRoomOrAccommodationItem(dish))
      .filter((dish) => {
        const matchesCategory =
          selectedCategory === 'All Dishes' || dish.category === selectedCategory;
        const matchesSearch =
          !searchQuery.trim() ||
          dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (dish.description && dish.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (dish.category && dish.category.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
      });
  }, [menuItems, selectedCategory, searchQuery]);

  const handleOpenAddModal = (presetCategory?: string) => {
    setEditingItem(null);
    setDishName('');
    const targetCat =
      presetCategory && presetCategory !== 'All Dishes'
        ? presetCategory
        : selectedCategory !== 'All Dishes'
        ? selectedCategory
        : 'Chef Specials & Platters';
    setDishCategory(targetCat);
    setDishPrice(1500);
    setDishUnit('per_item');
    setDishDescription('');
    setDishIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dish: PriceItem) => {
    setEditingItem(dish);
    setDishName(dish.name);
    setDishCategory(dish.category || 'Fresh Trout & River Fish');
    setDishPrice(dish.price);
    setDishUnit(dish.unit || 'per_item');
    setDishDescription(dish.description || '');
    setDishIsActive(dish.is_active !== false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim()) {
      setFormError('Please enter a dish name');
      return;
    }
    if (dishPrice === '' || Number(dishPrice) <= 0) {
      setFormError('Please enter a valid price (greater than Rs 0)');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload: Omit<PriceItem, 'id' | 'listing_id'> = {
      name: dishName.trim(),
      category: dishCategory,
      price: Number(dishPrice),
      unit: dishUnit,
      description: dishDescription.trim(),
      is_active: dishIsActive,
      is_bookable: true,
      default_units: 30,
    };

    try {
      if (editingItem && editingItem.id) {
        // Try update via API if real backend ID
        try {
          if (editingItem.id && !editingItem.id.startsWith('dish-')) {
            await updatePriceItem(editingItem.id, payload);
          }
        } catch {
          // Local fallback for offline/demo
        }
        const nextItems = menuItems.map((item) =>
          item.id === editingItem.id ? { ...item, ...payload } : item
        );
        setMenuItems(nextItems);
        saveStoredDishes(restaurantName, nextItems);
        showToast(`Dish "${dishName.trim()}" updated successfully!`);
      } else {
        // Create new dish
        const newId = `dish-${Date.now()}`;
        try {
          if (listing?.id && !listing.id.startsWith('listing-')) {
            await addPriceItem(listing.id, payload);
          }
        } catch {
          // Local fallback for offline/demo
        }
        const created: PriceItem = {
          id: newId,
          ...payload,
        };
        const nextItems = [created, ...menuItems.filter((m) => m.id !== newId)];
        setMenuItems(nextItems);
        saveStoredDishes(restaurantName, nextItems);
        showToast(`Dish "${dishName.trim()}" added to menu!`);
        // If user is currently filtering by another category, switch to the newly created dish's category
        if (selectedCategory !== 'All Dishes' && selectedCategory !== dishCategory) {
          setSelectedCategory(dishCategory);
        }
      }
      setIsModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save menu dish');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStock = async (dish: PriceItem) => {
    const updatedStatus = !dish.is_active;
    try {
      if (dish.id && !dish.id.startsWith('dish-')) {
        await updatePriceItem(dish.id, { is_active: updatedStatus });
      }
    } catch {
      // Local fallback
    }
    const nextItems = menuItems.map((item) =>
      item.id === dish.id ? { ...item, is_active: updatedStatus } : item
    );
    setMenuItems(nextItems);
    saveStoredDishes(restaurantName, nextItems);
    showToast(
      updatedStatus
        ? `"${dish.name}" marked as In Stock`
        : `"${dish.name}" marked as Sold Out`
    );
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !deleteTarget.id) return;
    try {
      if (!deleteTarget.id.startsWith('dish-')) {
        await deletePriceItem(deleteTarget.id);
      }
    } catch {
      // Local fallback
    }
    const nextItems = menuItems.filter((item) => item.id !== deleteTarget.id);
    setMenuItems(nextItems);
    saveStoredDishes(restaurantName, nextItems);
    showToast(`Dish "${deleteTarget.name}" removed from menu`);
    setDeleteTarget(null);
    if (onRefresh) onRefresh();
  };

  const validDishes = useMemo(() => {
    return menuItems.filter((d) => !isRoomOrAccommodationItem(d));
  }, [menuItems]);

  const avgPrice =
    validDishes.length > 0
      ? Math.round(validDishes.reduce((acc, d) => acc + d.price, 0) / validDishes.length)
      : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Restaurant Header Banner & Quick Actions */}
      <Card padding="md" style={{ border: '1px solid var(--line)', background: 'var(--card-bg)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--soft)',
                  color: 'var(--pri)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Utensils size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                    {restaurantName} — Menu Manager
                  </h3>
                  <Tag variant="ok">Live Dining Menu</Tag>
                </div>
                <p style={{ margin: '3px 0 0', fontSize: 'var(--font-xs)', color: 'var(--mute)' }}>
                  Manage dishes, real-time pricing, ingredients, and in-stock availability for diners.
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            onClick={() => handleOpenAddModal()}
            id="btn-add-menu-item"
            data-testid="btn-add-menu-item"
          >
            Add New Dish
          </Button>
        </div>

        {/* Quick Menu Metrics Bar */}
        <div
          style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--line)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
          }}
        >
          <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--bg)' }}>
            <div style={{ fontSize: '11px', color: 'var(--mute)', textTransform: 'uppercase', fontWeight: 600 }}>
              Total Menu Items
            </div>
            <div style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--ink)' }}>
              {validDishes.length} Dishes
            </div>
          </div>

          <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--bg)' }}>
            <div style={{ fontSize: '11px', color: 'var(--mute)', textTransform: 'uppercase', fontWeight: 600 }}>
              Currently Available
            </div>
            <div style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--ok)' }}>
              {validDishes.filter((d) => d.is_active !== false).length} In Stock
            </div>
          </div>

          <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--bg)' }}>
            <div style={{ fontSize: '11px', color: 'var(--mute)', textTransform: 'uppercase', fontWeight: 600 }}>
              Average Dish Price
            </div>
            <div style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--pri)' }}>
              Rs {avgPrice.toLocaleString()}
            </div>
          </div>

          <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--bg)' }}>
            <div style={{ fontSize: '11px', color: 'var(--mute)', textTransform: 'uppercase', fontWeight: 600 }}>
              Food Authority Quality
            </div>
            <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <CheckCircle2 size={16} color="var(--ok)" /> 100% Halal & Verified
            </div>
          </div>
        </div>
      </Card>

      {/* Category Filter Chips & Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {MENU_CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              active={selectedCategory === cat}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Chip>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 240px', maxWidth: '360px' }}>
          <Search
            size={16}
            color="var(--mute)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search dish by name or ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: 'var(--radius-button)',
              border: '1px solid var(--line)',
              backgroundColor: 'var(--card)',
              color: 'var(--ink)',
              fontSize: 'var(--font-xs)',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Menu Dishes Grid */}
      {filteredDishes.length === 0 ? (
        <Card padding="lg" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Utensils size={36} color="var(--mute)" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ margin: 0, fontSize: 'var(--font-base)', color: 'var(--ink)', fontWeight: 700 }}>
            No dishes found
          </h4>
          <p style={{ margin: '6px 0 16px', fontSize: 'var(--font-sm)', color: 'var(--mute)' }}>
            No menu items match your search or selected category.
          </p>
          <Button
            type="button"
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            onClick={() => handleOpenAddModal(selectedCategory !== 'All Dishes' ? selectedCategory : undefined)}
            id="btn-add-first-dish"
            data-testid="btn-add-first-dish"
          >
            Add First Dish {selectedCategory !== 'All Dishes' ? `to ${selectedCategory}` : ''}
          </Button>
        </Card>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredDishes.map((dish) => {
            const isAvailable = dish.is_active !== false;
            const dishImg = getDishImage(dish.name, dish.category);
            const dishBadge = getDishBadge(dish.name, dish.category);

            return (
              <Card
                key={dish.id}
                padding="none"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: isAvailable ? '1px solid var(--line)' : '1px dashed var(--mute)',
                  opacity: isAvailable ? 1 : 0.8,
                  transition: 'all 0.2s ease',
                  backgroundColor: 'var(--card)',
                  overflow: 'hidden',
                  borderRadius: 'var(--radius-card)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                }}
              >
                {/* Dish Photo Header */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '150px',
                    overflow: 'hidden',
                    backgroundColor: 'var(--soft)',
                  }}
                >
                  <img
                    src={dishImg}
                    alt={dish.name}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/images/dishes/swat_trout.jpg';
                    }}
                  />

                  {/* Culinary Badge Overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '4px 9px',
                      borderRadius: '16px',
                      backgroundColor: 'rgba(15, 23, 42, 0.78)',
                      backdropFilter: 'blur(4px)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    }}
                  >
                    <Sparkles size={11} color="#FBBF24" />
                    {dishBadge}
                  </div>

                  {/* Stock Status Tag */}
                  <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    <Tag variant={isAvailable ? 'ok' : 'neutral'}>
                      {isAvailable ? 'In Stock' : 'Sold Out'}
                    </Tag>
                  </div>
                </div>

                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    {/* Category Label */}
                    <div style={{ marginBottom: '6px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--soft)',
                          color: 'var(--pri)',
                          display: 'inline-block',
                        }}
                      >
                        {dish.category || 'Specialty Dish'}
                      </span>
                    </div>

                    {/* Dish Title */}
                    <h4
                      style={{
                        margin: '0 0 6px',
                        fontSize: 'var(--font-base)',
                        fontWeight: 700,
                        color: 'var(--ink)',
                        lineHeight: 1.3,
                      }}
                    >
                      {dish.name}
                    </h4>

                    {/* Description */}
                    <p
                      style={{
                        margin: 0,
                        fontSize: 'var(--font-xs)',
                        color: 'var(--mute)',
                        lineHeight: 1.5,
                        minHeight: '36px',
                      }}
                    >
                      {dish.description || 'Traditional culinary preparation crafted fresh upon order.'}
                    </p>
                  </div>

                {/* Price and Action Bar */}
                <div
                  style={{
                    marginTop: '16px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--line)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink)' }}>
                      Rs {dish.price.toLocaleString()}
                    </div>
                    <span style={{ fontSize: '10.5px', color: 'var(--mute)' }}>
                      {dish.unit === 'per_person' ? 'Per Person' : 'Per Serving / Dish'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {/* Fast In-Stock / Sold-Out Toggle */}
                    <button
                      type="button"
                      title={isAvailable ? 'Mark as Sold Out' : 'Mark as In Stock'}
                      onClick={() => handleToggleStock(dish)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-button)',
                        border: '1px solid var(--line)',
                        backgroundColor: isAvailable ? 'var(--bg)' : 'var(--soft)',
                        color: isAvailable ? 'var(--mute)' : 'var(--pri)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {isAvailable ? 'Out of Stock?' : 'Set Available'}
                    </button>

                    {/* Edit button */}
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Pencil size={13} />}
                      onClick={() => handleOpenEditModal(dish)}
                      data-testid={`btn-edit-dish-${dish.id}`}
                    >
                      Edit
                    </Button>

                    {/* Delete button */}
                    <Button
                      variant="soft"
                      size="sm"
                      icon={<Trash2 size={13} color="var(--bad)" />}
                      onClick={() => setDeleteTarget(dish)}
                      data-testid={`btn-delete-dish-${dish.id}`}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
        </div>
      )}

      {/* Add / Edit Dish Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          data-testid="modal-restaurant-dish"
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: 'var(--card)',
              borderRadius: '16px',
              border: '1px solid var(--line)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--line)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Utensils size={18} color="var(--pri)" />
                <h3 style={{ margin: 0, fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--ink)' }}>
                  {editingItem ? 'Edit Menu Dish' : 'Add New Menu Dish'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--mute)',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveDish} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {formError && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(214, 86, 74, 0.1)',
                    border: '1px solid var(--bad)',
                    color: 'var(--bad)',
                    fontSize: 'var(--font-xs)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertTriangle size={15} />
                  {formError}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                  Dish Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Swati River Trout with Garlic Tamarind Dip"
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  required
                  data-testid="input-dish-name"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-button)',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: 'var(--font-sm)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Dynamic Image Preview */}
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--soft)',
                  border: '1px solid var(--line)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <img
                  src={getDishImage(dishName, dishCategory)}
                  alt="Dish Preview"
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                    border: '1px solid var(--line)',
                    flexShrink: 0,
                  }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/images/dishes/swat_trout.jpg';
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--mute)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Linked Authentic Image
                  </div>
                  <div style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--ink)', marginTop: '2px' }}>
                    {getDishBadge(dishName, dishCategory)} Photography
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--ok)', marginTop: '2px' }}>
                    ✓ Matched dynamically to dish name & category
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                    Category
                  </label>
                  <select
                    value={dishCategory}
                    onChange={(e) => setDishCategory(e.target.value)}
                    data-testid="select-dish-category"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-button)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--ink)',
                      fontSize: 'var(--font-sm)',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Fresh Trout & River Fish">Fresh Trout & River Fish</option>
                    <option value="Traditional BBQ & Karahi">Traditional BBQ & Karahi</option>
                    <option value="Rice, Breads & Soups">Rice, Breads & Soups</option>
                    <option value="Desserts & Traditional Beverages">Desserts & Traditional Beverages</option>
                    <option value="Chef Specials & Platters">Chef Specials & Platters</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                    Price (PKR) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 1500"
                    value={dishPrice}
                    onChange={(e) => setDishPrice(e.target.value ? Number(e.target.value) : '')}
                    required
                    data-testid="input-dish-price"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
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
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                  Serving / Unit
                </label>
                <select
                  value={dishUnit}
                  onChange={(e) => setDishUnit(e.target.value as PriceUnitCode)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-button)',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: 'var(--font-sm)',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="per_item">Per Dish / Item / Platter</option>
                  <option value="per_person">Per Person / Head</option>
                  <option value="per_day">Per Daily Catering Feast</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                  Description & Key Ingredients
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe seasoning, preparation method, side dips, serving size..."
                  value={dishDescription}
                  onChange={(e) => setDishDescription(e.target.value)}
                  data-testid="textarea-dish-description"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-button)',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: 'var(--font-sm)',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="chk-dish-active"
                  checked={dishIsActive}
                  onChange={(e) => setDishIsActive(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label
                  htmlFor="chk-dish-active"
                  style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--ink)', cursor: 'pointer' }}
                >
                  Mark this dish as available and in stock now
                </label>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  marginTop: '10px',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  borderTop: '1px solid var(--line)',
                  paddingTop: '16px',
                }}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={isSubmitting}
                  icon={isSubmitting ? undefined : <Check size={14} />}
                  data-testid="btn-save-dish"
                >
                  {isSubmitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Add to Menu'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          data-testid="modal-delete-dish"
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              backgroundColor: 'var(--card)',
              borderRadius: '16px',
              border: '1px solid var(--line)',
              padding: '24px',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(214, 86, 74, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--bad)',
                }}
              >
                <Trash2 size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--ink)' }}>
                Delete Menu Dish
              </h3>
            </div>

            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--ink)', margin: '0 0 20px', lineHeight: 1.5 }}>
              Are you sure you want to remove <strong>"{deleteTarget.name}"</strong> from your restaurant menu?
              Diners will no longer see this dish.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="accent"
                size="sm"
                onClick={handleConfirmDelete}
                data-testid="btn-confirm-delete-dish"
              >
                Yes, Delete Dish
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
