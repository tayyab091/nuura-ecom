'use client'

interface MarqueeProps {
  reverse?: boolean
}

const ITEMS =
  'Self-Care ✦ Glow Up ✦ Curated Drops ✦ Aesthetic Accessories ✦ New Arrivals ✦ Limited Edition ✦ Nuura ✦ '

export default function Marquee({ reverse = false }: MarqueeProps) {
  /* Duplicate text so the loop appears seamless */
  const text = ITEMS.repeat(8)

  return (
    <div className="w-full overflow-hidden bg-[--color-nuura-charcoal] py-4">
      <div
        className={[
          'flex whitespace-nowrap w-max',
          reverse ? 'animate-[marquee_20s_linear_infinite_reverse]' : 'animate-marquee',
        ].join(' ')}
      >
        {/* Two identical halves — first exits left while second slides in */}
        <span className="font-sans text-[11px] tracking-[0.25em] uppercase text-[--color-nuura-cream]/80 pr-0">
          {text}
        </span>
        <span
          className="font-sans text-[11px] tracking-[0.25em] uppercase text-[--color-nuura-cream]/80"
          aria-hidden="true"
        >
          {text}
        </span>
      </div>
    </div>
  )
}
