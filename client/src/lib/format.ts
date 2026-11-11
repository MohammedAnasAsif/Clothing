const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const money = (n: number) => inr.format(n);

/** Unsplash photo id → sized, cropped image URL. */
export function img(id: string, w = 800, h?: number) {
  const size = h ? `&h=${h}` : '';
  return `https://images.unsplash.com/photo-${id}?w=${w}${size}&q=78&auto=format&fit=crop`;
}

/**
 * Crop to an exact width × height around a focal point (0–1 from the left/top), so a subject
 * stays in frame when a landscape photo is shown on a tall phone screen.
 */
export function imgFocus(id: string, w: number, h: number, fx: number, fy: number) {
  return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&q=78&auto=format&fit=crop&crop=focalpoint&fp-x=${fx}&fp-y=${fy}`;
}

export function focusSet(id: string, ratio: number, fx: number, fy: number, widths: number[]) {
  return widths.map((w) => `${imgFocus(id, w, Math.round(w * ratio), fx, fy)} ${w}w`).join(', ');
}

export function srcSet(id: string, widths = [400, 640, 900, 1200], ratio?: number) {
  return widths.map((w) => `${img(id, w, ratio ? Math.round(w * ratio) : undefined)} ${w}w`).join(', ');
}

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];
