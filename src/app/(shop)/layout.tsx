import Navbar from '@/components/layout/Navbar'
import ConditionalFooter from '@/components/layout/ConditionalFooter'
import CartDrawer from '@/components/shop/CartDrawer'

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <CartDrawer />
      <main>{children}</main>
      <ConditionalFooter />
    </>
  )
}

