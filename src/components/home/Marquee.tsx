'use client'

const MARQUEE_ITEMS = [
  'Glow in your own light',
  'Premium Self-Care',
  'Crafted for Pakistani Women',
  'Aesthetic Accessories',
  'Free Shipping on Rs. 3000+',
  'New Drops Monthly',
]

export default function Marquee() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]

  return (
    <div className="py-5 bg-[#2C2C2C] overflow-hidden">
      <div className="flex whitespace-nowrap animate-marquee">
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-6 mr-6">
            <span className="font-sans text-xs tracking-[0.25em] uppercase text-[#FDFCFB]">
              {item}
            </span>
            <span className="text-[#8A7F7A] text-xs">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}
