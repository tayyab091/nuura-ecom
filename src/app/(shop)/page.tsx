import Hero from '@/components/home/Hero'
import Marquee from '@/components/home/Marquee'
import FeaturedDrop from '@/components/home/FeaturedDrop'
import BrandStory from '@/components/home/BrandStory'

export const metadata = {
  title: 'Nuura — Glow in your own light',
  description:
    'Premium self-care gadgets and aesthetic accessories for the modern Pakistani woman.',
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee />
      <FeaturedDrop />
      <Marquee reverse />
      <BrandStory />
    </>
  )
}
