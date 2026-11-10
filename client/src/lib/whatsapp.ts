import { BRAND } from '../../../shared/catalog';
import type { CartLine, Order } from '../../../shared/types';
import { money } from './format';

/**
 * WhatsApp click-to-chat. Opens a chat with the shop's number with the message already typed,
 * in the WhatsApp app on phones and WhatsApp Web on desktop. The customer still presses send.
 */
export function waLink(text?: string) {
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${BRAND.whatsapp}${q}`;
}

function pageUrl(path: string) {
  // Hash routing on the static preview, normal paths on the full site.
  const { origin, pathname } = window.location;
  return import.meta.env.MODE === 'preview' ? `${origin}${pathname}#${path}` : `${origin}${path}`;
}

export const greeting = () => `Hi ${BRAND.name}! I have a question about your products.`;

export function productMessage(p: { name: string; slug: string; price: number }, opts: { color?: string; size?: string; qty?: number }) {
  const lines: Array<string | null> = [
    `Hi ${BRAND.name}! I'd like to order:`,
    '',
    `• ${p.name}`,
    opts.color ? `  Colour: ${opts.color}` : null,
    opts.size && opts.size !== 'One size' ? `  Size: ${opts.size}` : null,
    `  Qty: ${opts.qty ?? 1}`,
    `  Price: ${money(p.price)} each`,
    '',
    pageUrl(`/product/${p.slug}`),
  ];
  return lines.filter((l) => l !== null).join('\n');
}

type Line = CartLine & { name: string; price: number };

export function cartMessage(cart: Line[], subtotal: number, shipping: number) {
  const items = cart.map((l, i) => {
    const size = l.size !== 'One size' ? `, ${l.size}` : '';
    return `${i + 1}. ${l.name} (${l.color}${size}) × ${l.qty} = ${money(l.price * l.qty)}`;
  });
  return [
    `Hi ${BRAND.name}! I'd like to order:`,
    '',
    ...items,
    '',
    `Subtotal: ${money(subtotal)}`,
    `Shipping: ${shipping ? money(shipping) : 'Free'}`,
    `Total: ${money(subtotal + shipping)}`,
    '',
    'Name:',
    'Delivery address:',
    'PIN code:',
  ].join('\n');
}

export function orderMessage(o: Order) {
  const items = o.items.map((l) => {
    const size = l.size !== 'One size' ? `, ${l.size}` : '';
    return `• ${l.name} (${l.color}${size}) × ${l.qty}`;
  });
  return [
    `Hi ${BRAND.name}! I just placed order ${o.number} on your website.`,
    '',
    ...items,
    '',
    `Total: ${money(o.total)} (${o.payment === 'cod' ? 'cash on delivery' : 'UPI on delivery'})`,
    `Deliver to: ${o.customer.name}, ${o.customer.city} ${o.customer.pincode}`,
    '',
    'Please confirm my order.',
  ].join('\n');
}
