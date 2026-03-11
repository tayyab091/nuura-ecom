# NUURA — Project Memory File
> Paste this at the start of every new Claude conversation

## Brand
- Name: Nuura (Arabic: نور, meaning light/radiance)
- Tagline: "Glow in your own light"
- Market: Premium women's e-commerce, Pakistan (Lahore, Karachi, Islamabad)
- Target: Urban women 18–35, Instagram/TikTok native
- Categories: Self-care gadgets + Aesthetic accessories & small bags (NO clothing)
- Price range: PKR 1,500–7,500

## Aesthetic
- Colors: cream #F5F0E6, nude #EDE0D4, blush #F8D7DA, sage #B2BDB5, charcoal #2C2C2C, warm-white #FDFCFB
- Fonts: Cormorant Garamond (display), DM Sans (body), Italiana (logo/accent)
- Vibe: Luxury-minimal, soft feminine, NOT cluttered, award-worthy animations

## Tech Stack (LOCKED)
- Next.js 15 (App Router) + TypeScript + Tailwind CSS + Shadcn/ui
- Framer Motion + GSAP + Lenis (smooth scroll)
- MongoDB Atlas + Mongoose
- NextAuth.js v5
- Stripe + COD + JazzCash/EasyPaisa hooks
- Cloudinary (images), Redis (cache), Resend (email), Sentry (monitoring)
- Zustand (state), TanStack Query v5, Zod (validation)
- Vercel (frontend deployment)

## Tools
- Claude.ai (architecture, prompts, decisions) ← this
- VS Code + GitHub Copilot Pro with Claude Sonnet (code generation)
- v0.dev (complex UI components)

## Timeline
- 1 month total
- Week 1: Foundation + Design System + Navbar + Hero
- Week 2: Catalog + Product Detail Page
- Week 3: Cart + Checkout + COD
- Week 4: Admin + SEO + Polish + Deploy

## Build Progress
### Completed
- [ ] Nothing yet

### Current Phase
- Phase 1: Project initialization

## Key Decisions Made
- Custom cursor (small dot + ring follower)
- Lenis smooth scroll throughout
- GSAP ScrollTrigger for scroll animations
- Framer Motion for component transitions
- Route groups: (shop), (auth), (admin)

## Pakistan-Specific Features (Phase 4)
- Cash on Delivery as PRIMARY payment
- TCS + Leopard courier integration
- JazzCash + EasyPaisa payment hooks
- City-based shipping rates
- WhatsApp order notifications
