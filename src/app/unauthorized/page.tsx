import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-n-offwhite flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg bg-n-card border border-n-border rounded-2xl overflow-hidden">
        <div className="h-1 bg-n-gold" />
        <div className="p-8 text-center">
          <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-n-muted">Unauthorized</p>
          <h1 className="[font-family:var(--font-display)] text-4xl font-light text-n-ink mt-4">Access restricted</h1>
          <p className="font-sans text-sm text-n-muted mt-4">
            You do not have permission to view this area.
          </p>
          <Link
            href="/"
            className="inline-flex mt-8 bg-n-forest text-n-cream px-5 py-3 rounded-lg font-sans text-xs tracking-widest uppercase hover:bg-n-gold hover:text-n-forest transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    </main>
  )
}