import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCFB]">
      <h1 className="font-display text-6xl text-[#2C2C2C] mb-4">404</h1>
      <p className="font-sans text-[#8A7F7A] mb-8">This page does not exist.</p>
      <Link
        href="/"
        className="font-sans text-xs tracking-widest uppercase border border-[#2C2C2C] px-8 py-3 text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white transition-colors duration-300"
      >
        Back to Home
      </Link>
    </div>
  )
}
