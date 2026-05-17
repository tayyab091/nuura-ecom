'use client'

import { useEffect, useState } from 'react'

type Settings = {
  storeName: string
  supportEmail: string
  supportPhone: string
  whatsappNumber: string
  storeAddressLine1: string
  storeCity: string
  storeProvince: string
  instagramUrl: string
  tiktokUrl: string
  lowStockThreshold: number
  currency: 'PKR'
  shippingFlatFee: number
  freeShippingThreshold: number
  paymentCodEnabled: boolean
  paymentJazzcashEnabled: boolean
  paymentEasypaisaEnabled: boolean
  paymentNayapayEnabled: boolean
  orderAutoConfirmCod: boolean
}

const DEFAULTS: Settings = {
  storeName: 'Nuura',
  supportEmail: '',
  supportPhone: '',
  whatsappNumber: '',
  storeAddressLine1: '',
  storeCity: '',
  storeProvince: '',
  instagramUrl: '',
  tiktokUrl: '',
  lowStockThreshold: 10,
  currency: 'PKR',
  shippingFlatFee: 0,
  freeShippingThreshold: 0,
  paymentCodEnabled: true,
  paymentJazzcashEnabled: false,
  paymentEasypaisaEnabled: false,
  paymentNayapayEnabled: false,
  orderAutoConfirmCod: true,
}

export default function AdminSettingsPage() {
  const [form, setForm] = useState<Settings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        const s = d?.settings
        if (s) {
          setForm({
            storeName: s.storeName ?? DEFAULTS.storeName,
            supportEmail: s.supportEmail ?? '',
            supportPhone: s.supportPhone ?? '',
            whatsappNumber: s.whatsappNumber ?? '',
            storeAddressLine1: s.storeAddressLine1 ?? '',
            storeCity: s.storeCity ?? '',
            storeProvince: s.storeProvince ?? '',
            instagramUrl: s.instagramUrl ?? '',
            tiktokUrl: s.tiktokUrl ?? '',
            lowStockThreshold: Number(s.lowStockThreshold ?? DEFAULTS.lowStockThreshold),
            currency: 'PKR',
            shippingFlatFee: Number(s.shippingFlatFee ?? 0),
            freeShippingThreshold: Number(s.freeShippingThreshold ?? 0),
            paymentCodEnabled: Boolean(s.paymentCodEnabled ?? true),
            paymentJazzcashEnabled: Boolean(s.paymentJazzcashEnabled ?? false),
            paymentEasypaisaEnabled: Boolean(s.paymentEasypaisaEnabled ?? false),
            paymentNayapayEnabled: Boolean(s.paymentNayapayEnabled ?? false),
            orderAutoConfirmCod: Boolean(s.orderAutoConfirmCod ?? true),
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function field<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSaved(false)
    setError('')
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function save() {
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'Failed to save')
        return
      }
      if (data?.settings) {
        const s = data.settings
        setForm({
          storeName: s.storeName ?? DEFAULTS.storeName,
          supportEmail: s.supportEmail ?? '',
          supportPhone: s.supportPhone ?? '',
          whatsappNumber: s.whatsappNumber ?? '',
          storeAddressLine1: s.storeAddressLine1 ?? '',
          storeCity: s.storeCity ?? '',
          storeProvince: s.storeProvince ?? '',
          instagramUrl: s.instagramUrl ?? '',
          tiktokUrl: s.tiktokUrl ?? '',
          lowStockThreshold: Number(s.lowStockThreshold ?? DEFAULTS.lowStockThreshold),
          currency: 'PKR',
          shippingFlatFee: Number(s.shippingFlatFee ?? 0),
          freeShippingThreshold: Number(s.freeShippingThreshold ?? 0),
          paymentCodEnabled: Boolean(s.paymentCodEnabled ?? true),
          paymentJazzcashEnabled: Boolean(s.paymentJazzcashEnabled ?? false),
          paymentEasypaisaEnabled: Boolean(s.paymentEasypaisaEnabled ?? false),
          paymentNayapayEnabled: Boolean(s.paymentNayapayEnabled ?? false),
          orderAutoConfirmCod: Boolean(s.orderAutoConfirmCod ?? true),
        })
      }
      setSaved(true)
    } catch {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    'bg-n-white border border-n-border text-n-ink placeholder-n-muted/70 px-4 py-3 w-full focus:outline-none focus:border-n-forest font-sans text-sm transition-colors'

  return (
    <div>
      <div className="mb-8 pb-6 border-b border-n-border">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="[font-family:var(--font-display)] text-3xl font-light text-n-ink">Settings</h1>
            <p className="font-sans text-sm text-n-muted mt-2">
              Configure store identity, shipping, and payment methods.
            </p>
          </div>

          <button
            type="button"
            onClick={save}
            disabled={loading || saving}
            className="bg-n-forest text-n-cream px-4 py-2.5 font-sans text-xs tracking-widest uppercase hover:bg-n-gold hover:text-n-forest transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {error && <p className="font-sans text-xs text-red-600 mt-4">{error}</p>}
        {saved && !error && <p className="font-sans text-xs text-n-forest mt-4">Saved.</p>}
      </div>

      {loading ? (
        <div className="bg-n-card border border-n-border px-6 py-16 text-center">
          <p className="font-sans text-sm text-n-muted">Loading...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-n-card border border-n-border p-6">
            <p className="font-sans text-[10px] tracking-widest uppercase text-n-muted mb-5">
              Store Profile
            </p>
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-2">
                <span className="font-sans text-[10px] tracking-widest uppercase text-n-muted">Store name</span>
                <input className={inputCls} value={form.storeName} onChange={(e) => field('storeName', e.target.value)} />
              </label>

              <label className="flex flex-col gap-2">
                <span className="font-sans text-[10px] tracking-widest uppercase text-n-muted">Store address</span>
                <input className={inputCls} value={form.storeAddressLine1} onChange={(e) => field('storeAddressLine1', e.target.value)} placeholder="Street / building / area" />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-2">
                  <span className="font-sans text-[10px] tracking-widest uppercase text-n-muted">City</span>
                  <input className={inputCls} value={form.storeCity} onChange={(e) => field('storeCity', e.target.value)} />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="font-sans text-[10px] tracking-widest uppercase text-n-muted">Province</span>
                  <input className={inputCls} value={form.storeProvince} onChange={(e) => field('storeProvince', e.target.value)} />
                </label>
              </div>

              <label className="flex flex-col gap-2">
                <span className="font-sans text-[10px] tracking-widest uppercase text-n-muted">Support email</span>
                <input className={inputCls} value={form.supportEmail} onChange={(e) => field('supportEmail', e.target.value)} placeholder="support@yourstore.com" />
              </label>
              <label className="flex flex-col gap-2">
                <span className="font-sans text-[10px] tracking-widest uppercase text-n-muted">Support phone</span>
                <input className={inputCls} value={form.supportPhone} onChange={(e) => field('supportPhone', e.target.value)} placeholder="+92..." />
              </label>

              <label className="flex flex-col gap-2">
                <span className="font-sans text-[10px] tracking-widest uppercase text-n-muted">WhatsApp number</span>
                <input className={inputCls} value={form.whatsappNumber} onChange={(e) => field('whatsappNumber', e.target.value)} placeholder="92300... (digits only)" />
                <span className="font-sans text-xs text-n-muted">Used for checkout & order confirmation links.</span>
              </label>
            </div>
          </div>

          <div className="bg-n-card border border-n-border p-6">
            <p className="font-sans text-[10px] tracking-widest uppercase text-n-muted mb-5">
              Social
            </p>
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-2">
                <span className="font-sans text-[10px] tracking-widest uppercase text-n-muted">Instagram URL</span>
                <input className={inputCls} value={form.instagramUrl} onChange={(e) => field('instagramUrl', e.target.value)} placeholder="https://instagram.com/..." />
              </label>
              <label className="flex flex-col gap-2">
                <span className="font-sans text-[10px] tracking-widest uppercase text-n-muted">TikTok URL</span>
                <input className={inputCls} value={form.tiktokUrl} onChange={(e) => field('tiktokUrl', e.target.value)} placeholder="https://tiktok.com/@..." />
              </label>
              <p className="font-sans text-xs text-n-muted">
                These links can be surfaced in your storefront footer later.
              </p>
            </div>
          </div>

          <div className="bg-n-card border border-n-border p-6">
            <p className="font-sans text-[10px] tracking-widest uppercase text-n-muted mb-5">
              Shipping
            </p>
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-2">
                <span className="font-sans text-[10px] tracking-widest uppercase text-n-muted">Flat shipping fee (PKR)</span>
                <input
                  className={inputCls}
                  inputMode="numeric"
                  value={String(form.shippingFlatFee)}
                  onChange={(e) => field('shippingFlatFee', Number(e.target.value) || 0)}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="font-sans text-[10px] tracking-widest uppercase text-n-muted">Free shipping threshold (PKR)</span>
                <input
                  className={inputCls}
                  inputMode="numeric"
                  value={String(form.freeShippingThreshold)}
                  onChange={(e) => field('freeShippingThreshold', Number(e.target.value) || 0)}
                />
              </label>
              <p className="font-sans text-xs text-n-muted">
                Tip: Use threshold 0 to disable free shipping.
              </p>
            </div>
          </div>

          <div className="bg-n-card border border-n-border p-6">
            <p className="font-sans text-[10px] tracking-widest uppercase text-n-muted mb-5">
              Payments
            </p>
            <div className="flex flex-col gap-3">
              {(
                [
                  ['paymentCodEnabled', 'Cash on Delivery (COD)'],
                  ['paymentJazzcashEnabled', 'JazzCash'],
                  ['paymentEasypaisaEnabled', 'EasyPaisa'],
                  ['paymentNayapayEnabled', 'NayaPay'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center justify-between gap-3 border border-n-border bg-n-white px-4 py-3">
                  <div>
                    <p className="font-sans text-sm text-n-ink">{label}</p>
                    <p className="font-sans text-xs text-n-muted mt-1">Enable this payment method at checkout.</p>
                  </div>
                  <input type="checkbox" checked={Boolean(form[key])} onChange={(e) => field(key, e.target.checked)} />
                </label>
              ))}
            </div>
          </div>

          <div className="bg-n-card border border-n-border p-6">
            <p className="font-sans text-[10px] tracking-widest uppercase text-n-muted mb-5">
              Order rules
            </p>
            <label className="flex items-center justify-between gap-3 border border-n-border bg-n-white px-4 py-3">
              <div>
                <p className="font-sans text-sm text-n-ink">Auto-confirm COD orders</p>
                <p className="font-sans text-xs text-n-muted mt-1">When enabled, COD orders are created as confirmed.</p>
              </div>
              <input type="checkbox" checked={form.orderAutoConfirmCod} onChange={(e) => field('orderAutoConfirmCod', e.target.checked)} />
            </label>
          </div>

          <div className="bg-n-card border border-n-border p-6">
            <p className="font-sans text-[10px] tracking-widest uppercase text-n-muted mb-5">
              Inventory alerts
            </p>
            <label className="flex flex-col gap-2">
              <span className="font-sans text-[10px] tracking-widest uppercase text-n-muted">Low stock threshold</span>
              <input
                className={inputCls}
                inputMode="numeric"
                value={String(form.lowStockThreshold)}
                onChange={(e) => field('lowStockThreshold', Number(e.target.value) || 0)}
              />
              <span className="font-sans text-xs text-n-muted">Used to flag products that need restocking.</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
