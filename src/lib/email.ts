import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface OrderEmailData {
  orderNumber: string
  customerName: string
  customerEmail: string
  items: Array<{ name: string; quantity: number; price: number }>
  total: number
  paymentMethod: string
  shippingAddress: {
    street: string
    city: string
    province: string
  }
}

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY) return

  await resend.emails.send({
    from: 'Nuura <orders@nuura.pk>',
    to: data.customerEmail,
    subject: `Order Confirmed — ${data.orderNumber} ✨`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #FDFCFB; color: #2C2C2C;">
        <h1 style="font-size: 32px; font-weight: 300; letter-spacing: -0.02em; margin-bottom: 8px;">
          Thank you, ${data.customerName.split(' ')[0]}. ✨
        </h1>
        <p style="font-family: system-ui, sans-serif; font-size: 14px; color: #8A7F7A; margin-bottom: 32px;">
          Your order has been placed successfully.
        </p>

        <div style="background: #F5F0E6; padding: 24px; margin-bottom: 24px;">
          <p style="font-family: system-ui, sans-serif; font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #8A7F7A; margin-bottom: 4px;">
            Order Number
          </p>
          <p style="font-size: 24px; font-weight: 400; margin: 0;">
            ${data.orderNumber}
          </p>
        </div>

        <div style="margin-bottom: 24px;">
          <p style="font-family: system-ui, sans-serif; font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #8A7F7A; margin-bottom: 16px;">
            Your Items
          </p>
          ${data.items.map(item => `
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #EDE0D4;">
              <span style="font-family: system-ui, sans-serif; font-size: 14px;">
                ${item.name} <span style="color: #8A7F7A;">x${item.quantity}</span>
              </span>
              <span style="font-family: system-ui, sans-serif; font-size: 14px;">
                PKR ${(item.price * item.quantity).toLocaleString()}
              </span>
            </div>
          `).join('')}
          <div style="display: flex; justify-content: space-between; padding: 16px 0; font-size: 20px;">
            <span>Total</span>
            <span>PKR ${data.total.toLocaleString()}</span>
          </div>
        </div>

        <div style="background: #F5F0E6; padding: 24px; margin-bottom: 32px;">
          <p style="font-family: system-ui, sans-serif; font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #8A7F7A; margin-bottom: 8px;">
            Payment Method
          </p>
          <p style="font-family: system-ui, sans-serif; font-size: 14px; margin: 0;">
            ${data.paymentMethod === 'cod'
              ? '&#128181; Cash on Delivery'
              : `&#128241; ${data.paymentMethod} &#8212; Please send screenshot on WhatsApp`}
          </p>
        </div>

        <div style="background: #F5F0E6; padding: 24px; margin-bottom: 32px;">
          <p style="font-family: system-ui, sans-serif; font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #8A7F7A; margin-bottom: 8px;">
            Delivering To
          </p>
          <p style="font-family: system-ui, sans-serif; font-size: 14px; margin: 0; line-height: 1.6;">
            ${data.shippingAddress.street}<br />
            ${data.shippingAddress.city}, ${data.shippingAddress.province}
          </p>
        </div>

        <p style="font-family: system-ui, sans-serif; font-size: 12px; color: #8A7F7A; text-align: center; margin-top: 40px;">
          Nuura &#8212; Glow in your own light &#127800;
        </p>
      </div>
    `,
  })
}
