import type { Order } from '../../shared/types';

/**
 * Optional: message the shop on WhatsApp whenever a website order is placed, using the
 * WhatsApp Business Cloud API (Meta). Off unless these are set in .env:
 *
 *   WHATSAPP_TOKEN            permanent access token for the WhatsApp Business app
 *   WHATSAPP_PHONE_NUMBER_ID  the sending business number's ID (from Meta's WhatsApp settings)
 *   WHATSAPP_NOTIFY_TO        the shop's number to alert, digits only, e.g. 918056221231
 *   WHATSAPP_TEMPLATE         (recommended) an approved template name with 4 body variables:
 *                             {{1}} order number, {{2}} customer, {{3}} total, {{4}} items
 *   WHATSAPP_TEMPLATE_LANG    template language code, default "en"
 *
 * Without a template the alert is sent as plain text, which WhatsApp only delivers if the
 * shop's number has messaged the business number in the last 24 hours.
 * Failures are logged and never block or fail the order.
 */
export async function notifyNewOrder(order: Order): Promise<void> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const to = process.env.WHATSAPP_NOTIFY_TO;
  if (!token || !phoneId || !to) return;

  const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  const items = order.items.map((l) => `${l.name} (${l.color}${l.size !== 'One size' ? `, ${l.size}` : ''}) × ${l.qty}`).join('; ');
  const customer = `${order.customer.name}, ${order.customer.phone}, ${order.customer.city} ${order.customer.pincode}`;
  const total = `${rupees(order.total)} ${order.payment === 'cod' ? 'COD' : 'UPI on delivery'}`;

  const template = process.env.WHATSAPP_TEMPLATE;
  const body = template
    ? {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: template,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG ?? 'en' },
          components: [
            {
              type: 'body',
              parameters: [order.number, customer, total, items].map((text) => ({ type: 'text', text: text.slice(0, 900) })),
            },
          ],
        },
      }
    : {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: `New order ${order.number}\n${customer}\n${items}\nTotal: ${total}` },
      };

  const version = process.env.WHATSAPP_API_VERSION ?? 'v21.0';
  try {
    const res = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.warn(`WhatsApp alert for ${order.number} failed: HTTP ${res.status} ${await res.text()}`);
  } catch (e) {
    console.warn(`WhatsApp alert for ${order.number} failed:`, (e as Error).message);
  }
}
