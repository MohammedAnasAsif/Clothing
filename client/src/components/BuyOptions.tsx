import { useState } from 'react';
import { Heart, MessageCircle, Minus, Plus } from 'lucide-react';
import type { Product } from '../../../shared/types';
import { useStore } from '../lib/store';
import { productMessage, waLink } from '../lib/whatsapp';

/** Colour, size and quantity pickers plus the add-to-cart / wishlist buttons. */
export function BuyOptions({ p, compact, onSizeGuide }: { p: Product; compact?: boolean; onSizeGuide?: () => void }) {
  const { addToCart, toggleWishlist, inWishlist } = useStore();
  const [color, setColor] = useState(p.colors[0].name);
  const [size, setSize] = useState<string | null>(p.sizes.length === 1 ? p.sizes[0] : null);
  const [qty, setQty] = useState(1);
  const [needSize, setNeedSize] = useState(false);
  const saved = inWishlist(p.slug);
  const soldOut = p.stock <= 0;

  const add = () => {
    if (!size) {
      setNeedSize(true);
      return;
    }
    addToCart(p, { size, color, qty });
  };

  return (
    <div style={{ display: 'grid', gap: 22 }}>
      <div>
        <div className="buy__label">
          <span>
            Colour: <b>{color}</b>
          </span>
        </div>
        <div className="swatches" role="group" aria-label="Colour">
          {p.colors.map((c) => (
            <button
              key={c.name}
              type="button"
              className="swatch"
              style={{ background: c.hex }}
              aria-pressed={c.name === color}
              aria-label={c.name}
              title={c.name}
              onClick={() => setColor(c.name)}
            />
          ))}
        </div>
      </div>

      {p.sizes.length > 1 && (
      <div>
        <div className="buy__label">
          <span>
            Size: <b>{size ?? 'Select'}</b>
          </span>
          {onSizeGuide && (
            <button type="button" className="link-u" onClick={onSizeGuide}>
              Size guide
            </button>
          )}
        </div>
        <div className="sizes" role="group" aria-label="Size">
          {p.sizes.map((s) => (
            <button
              key={s}
              type="button"
              className={`size${s === size ? ' is-active' : ''}`}
              aria-pressed={s === size}
              onClick={() => {
                setSize(s);
                setNeedSize(false);
              }}
            >
              {s}
            </button>
          ))}
        </div>
        {needSize && (
          <p className="field__err" role="alert" style={{ marginTop: 8 }}>
            Please choose a size first.
          </p>
        )}
      </div>
      )}

      <div className="buy__row" style={compact ? { gridTemplateColumns: 'auto 1fr' } : undefined}>
        <div className="qty qty--lg" aria-label="Quantity">
          <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}>
            <Minus size={14} />
          </button>
          <span aria-live="polite">{qty}</span>
          <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(10, Math.min(p.stock, q + 1)))}>
            <Plus size={14} />
          </button>
        </div>
        <button type="button" className="btn" onClick={add} disabled={soldOut}>
          {soldOut ? 'Sold out' : 'Add to cart'}
        </button>
        {!compact && (
          <button
            type="button"
            className="btn btn--ghost"
            style={{ padding: 0, width: 48 }}
            aria-pressed={saved}
            aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
            onClick={() => toggleWishlist(p.slug)}
          >
            <Heart size={18} strokeWidth={1.5} fill={saved ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
      <a
        className="btn btn--wa btn--block"
        href={waLink(productMessage(p, { color, size: size ?? undefined, qty }))}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => {
          if (!size) {
            e.preventDefault();
            setNeedSize(true);
          }
        }}
      >
        <MessageCircle size={17} strokeWidth={1.8} /> Order on WhatsApp
      </a>
    </div>
  );
}
