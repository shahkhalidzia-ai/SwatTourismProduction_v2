/**
 * Utilities for high-definition, authentic dish images and culinary photography
 * tailored specifically for Swat Valley restaurant specialties.
 */

export interface DishImageInfo {
  url: string;
  badge: string;
  alt: string;
}

/**
 * Returns an authentic, elegant food photograph based on the dish name and category.
 */
export function getDishImage(name?: string, category?: string, customUrl?: string): string {
  if (customUrl && (customUrl.startsWith('/images/') || customUrl.startsWith('http'))) {
    return customUrl;
  }

  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();

  // 1. Swat River Fresh Trout / Fish
  if (
    n.includes('trout') ||
    n.includes('fish') ||
    n.includes('mahasheer') ||
    c.includes('trout') ||
    c.includes('river fish')
  ) {
    return '/images/dishes/swat_trout.jpg';
  }

  // 2. Chapli Kebab / Kebabs / Kabab
  if (
    n.includes('chapli') ||
    n.includes('kebab') ||
    n.includes('kabab') ||
    c.includes('kebab')
  ) {
    return '/images/dishes/chapli_kebab.jpg';
  }

  // 3. Karahi / Curry / Dumba / Mutton / Lamb / Handi
  if (
    n.includes('karahi') ||
    n.includes('dumba') ||
    n.includes('curry') ||
    n.includes('handi') ||
    n.includes('mutton') ||
    n.includes('lamb') ||
    c.includes('karahi')
  ) {
    return '/images/dishes/mutton_karahi.jpg';
  }

  // 4. Shinwari Tikka / BBQ / Boti / Skewer / Char-grilled / Sajji
  if (
    n.includes('tikka') ||
    n.includes('bbq') ||
    n.includes('boti') ||
    n.includes('shinwari') ||
    n.includes('char-grilled') ||
    n.includes('sajji') ||
    n.includes('chops')
  ) {
    return '/images/dishes/shinwari_tikka.jpg';
  }

  // 5. Pulao / Biryani / Rice / Kabuli
  if (
    n.includes('pulao') ||
    n.includes('kabuli') ||
    n.includes('biryani') ||
    n.includes('rice') ||
    c.includes('rice')
  ) {
    return '/images/dishes/kabuli_pulao.jpg';
  }

  // 6. Naan / Roti / Bread / Paratha / Kulcha
  if (
    n.includes('naan') ||
    n.includes('roti') ||
    n.includes('bread') ||
    n.includes('paratha') ||
    n.includes('kulcha') ||
    c.includes('bread')
  ) {
    return '/images/dishes/tandoori_naan.jpg';
  }

  // 7. Halwa / Dessert / Sweet / Pudding / Kheer / Walnut
  if (
    n.includes('halwa') ||
    n.includes('dessert') ||
    n.includes('sweet') ||
    n.includes('pudding') ||
    n.includes('kheer') ||
    n.includes('walnut') ||
    c.includes('dessert')
  ) {
    return '/images/dishes/walnut_halwa.jpg';
  }

  // 8. Qahwa / Kahwa / Tea / Chai / Beverage / Drink
  if (
    n.includes('qahwa') ||
    n.includes('kahwa') ||
    n.includes('tea') ||
    n.includes('chai') ||
    n.includes('beverage') ||
    n.includes('drink') ||
    c.includes('beverage')
  ) {
    return '/images/dishes/peshawari_kahwa.jpg';
  }

  // 9. Grand Platters / Feast / Royal Specials
  if (
    n.includes('platter') ||
    n.includes('feast') ||
    n.includes('royal') ||
    c.includes('platter') ||
    c.includes('special')
  ) {
    return '/images/dishes/royal_platter.jpg';
  }

  // Default fallback
  return '/images/dishes/swat_trout.jpg';
}

/**
 * Returns a descriptive culinary badge for the dish.
 */
export function getDishBadge(name?: string, category?: string): string {
  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();

  if (n.includes('trout') || c.includes('trout')) return 'Fresh Swat Trout';
  if (n.includes('chapli')) return 'Crispy Chapli';
  if (n.includes('karahi')) return 'Sizzling Karahi';
  if (n.includes('tikka') || n.includes('bbq')) return 'Charcoal BBQ';
  if (n.includes('pulao')) return 'Swati Pulao';
  if (n.includes('naan')) return 'Clay Oven Naan';
  if (n.includes('halwa')) return 'Organic Honey & Walnuts';
  if (n.includes('kahwa') || n.includes('qahwa')) return 'Cardamom & Saffron';
  if (n.includes('platter')) return 'Royal Feast Platter';

  return 'Chef Specialty';
}
