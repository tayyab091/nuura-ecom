export const SITE_CONFIG = {
  name: 'Nuura',
  tagline: 'Glow in your own light',
  description: 'Premium self-care gadgets and aesthetic accessories for the modern Pakistani woman.',
  url: 'https://nuura.pk',
  handle: '@nuura.pk',
} as const

export const COLORS = {
  cream: '#F5F0E6',
  nude: '#EDE0D4',
  blush: '#F8D7DA',
  sage: '#B2BDB5',
  charcoal: '#2C2C2C',
  warmWhite: '#FDFCFB',
  muted: '#8A7F7A',
} as const

export const NAV_LINKS = [
  { label: 'Shop', href: '/shop' },
  { label: 'Self-Care', href: '/shop?category=self-care' },
  { label: 'Accessories', href: '/shop?category=accessories' },
  { label: 'Drops', href: '/shop?filter=new' },
] as const

export const SHIPPING_CITIES = [
  'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi',
  'Faisalabad', 'Multan', 'Peshawar', 'Quetta',
] as const

export const PRODUCT_CATEGORIES = [
  { label: 'Self-Care', slug: 'self-care' },
  { label: 'Accessories', slug: 'accessories' },
] as const
