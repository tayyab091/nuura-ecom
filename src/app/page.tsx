import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/home/Hero'
import Marquee from '@/components/home/Marquee'
import FeaturedDrop from '@/components/home/FeaturedDrop'
import BrandStory from '@/components/home/BrandStory'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <FeaturedDrop />
        <BrandStory />
      </main>
      <Footer />
    </>
  )
}
