import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { LayoutGrid, List, SlidersHorizontal, X } from 'lucide-react';
import type { Gender, ProductQuery } from '../../../shared/types';
import { products as allProducts } from '../../../shared/catalog';
import { api } from '../lib/api';
import { img } from '../lib/format';
import { useAsync } from '../lib/store';
import { ProductCard } from '../components/ProductCard';
import { CardSkeleton, Rise } from '../components/ui';
import { Drawer } from '../components/Overlays';
import NotFound from './NotFound';

const PRICE_BANDS = [
  { label: 'Under ₹1,500', min: undefined, max: 1499 },
  { label: '₹1,500 – ₹2,500', min: 1500, max: 2500 },
  { label: '₹2,500 – ₹4,000', min: 2501, max: 4000 },
  { label: 'Over ₹4,000', min: 4001, max: undefined },
];
const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SORTS: Array<[NonNullable<ProductQuery['sort']>, string]> = [
  ['featured', 'Featured'],
  ['newest', 'Newest'],
  ['rating', 'Top rated'],
  ['price-asc', 'Price: low to high'],
  ['price-desc', 'Price: high to low'],
];
const LIMIT = 9;

export default function Shop() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'grid' | 'list'>(() => (localStorage.getItem('st:view') as 'grid' | 'list') || 'grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { data: categories } = useAsync(() => api.categories(), []);

  const category = slug ?? params.get('category') ?? undefined;
  const query: ProductQuery = {
    category,
    gender: (params.get('gender') as Gender) || undefined,
    type: params.get('type') || undefined,
    size: params.get('size') || undefined,
    sale: params.get('sale') === '1' || undefined,
    min: params.get('min') ? Number(params.get('min')) : undefined,
    max: params.get('max') ? Number(params.get('max')) : undefined,
    q: params.get('q') || undefined,
    sort: (params.get('sort') as ProductQuery['sort']) || 'featured',
  };
  const key = JSON.stringify(query);
  useEffect(() => setPage(1), [key]);
  useEffect(() => {
    try { localStorage.setItem('st:view', view); } catch { /* ignore */ }
  }, [view]);

  const { data, loading, error, reload } = useAsync(() => api.products({ ...query, page, limit: LIMIT }), [key, page]);
  const cat = categories?.find((c) => c.slug === category);

  // Types offered within the current category (from the bundled catalogue index — cheap and static).
  const types = useMemo(
    () => [...new Set(allProducts.filter((p) => !category || p.category === category).map((p) => p.type))].sort(),
    [category],
  );

  const set = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v == null || v === '') next.delete(k);
    else next.set(k, v);
    setParams(next, { replace: true, preventScrollReset: true });
  };
  const setPrice = (min?: number, max?: number) => {
    const next = new URLSearchParams(params);
    min != null ? next.set('min', String(min)) : next.delete('min');
    max != null ? next.set('max', String(max)) : next.delete('max');
    setParams(next, { replace: true, preventScrollReset: true });
  };
  const clearAll = () => setParams(query.sort && query.sort !== 'featured' ? { sort: query.sort } : {}, { replace: true });

  if (slug && categories && !cat) return <NotFound />;

  const active: Array<[string, string, () => void]> = [];
  if (query.q) active.push(['q', `“${query.q}”`, () => set('q', null)]);
  if (!slug && category) active.push(['category', cat?.name ?? category, () => set('category', null)]);
  if (query.gender) active.push(['gender', query.gender === 'men' ? 'Men' : 'Women', () => set('gender', null)]);
  if (query.type) active.push(['type', query.type, () => set('type', null)]);
  if (query.size) active.push(['size', `Size ${query.size}`, () => set('size', null)]);
  if (query.sale) active.push(['sale', 'On sale', () => set('sale', null)]);
  if (query.min != null || query.max != null)
    active.push(['price', PRICE_BANDS.find((b) => b.min === query.min && b.max === query.max)?.label ?? 'Price', () => setPrice()]);

  const filters = (
    <>
      <div>
        <h3>Categories</h3>
        <Link to={{ pathname: '/shop', search: params.toString() }} className={`opt${!category ? ' is-active' : ''}`} onClick={() => setFiltersOpen(false)}>
          All products <small>{categories?.reduce((s, c) => s + c.count, 0)}</small>
        </Link>
        {categories?.map((c) => {
          const rest = new URLSearchParams(params);
          rest.delete('category');
          rest.delete('type');
          return (
            <Link key={c.slug} to={{ pathname: `/category/${c.slug}`, search: rest.toString() }} className={`opt${category === c.slug ? ' is-active' : ''}`} onClick={() => setFiltersOpen(false)}>
              {c.name} <small>{c.count}</small>
            </Link>
          );
        })}
      </div>
      <div>
        <h3>Department</h3>
        {([['', 'Everyone'], ['women', 'Women'], ['men', 'Men']] as const).map(([v, l]) => (
          <button key={l} className={`opt${(query.gender ?? '') === v ? ' is-active' : ''}`} onClick={() => set('gender', v || null)}>{l}</button>
        ))}
      </div>
      <div>
        <h3>Style</h3>
        <button className={`opt${!query.type ? ' is-active' : ''}`} onClick={() => set('type', null)}>All styles</button>
        {types.map((t) => (
          <button key={t} className={`opt${query.type === t ? ' is-active' : ''}`} onClick={() => set('type', t)}>{t}</button>
        ))}
      </div>
      <div>
        <h3>Size</h3>
        <div className="sizes">
          {ALL_SIZES.map((s) => (
            <button key={s} className={`size${query.size === s ? ' is-active' : ''}`} aria-pressed={query.size === s} onClick={() => set('size', query.size === s ? null : s)}>{s}</button>
          ))}
        </div>
      </div>
      <div>
        <h3>Price</h3>
        {PRICE_BANDS.map((b) => {
          const on = query.min === b.min && query.max === b.max;
          return (
            <label key={b.label} className="check">
              <input type="radio" name="price" checked={on} onChange={() => setPrice(b.min, b.max)} onClick={() => on && setPrice()} />
              {b.label}
            </label>
          );
        })}
      </div>
      <div>
        <h3>Offers</h3>
        <label className="check">
          <input type="checkbox" checked={!!query.sale} onChange={(e) => set('sale', e.target.checked ? '1' : null)} />
          On sale
        </label>
      </div>
      {active.length > 0 && <button className="btn btn--ghost btn--sm" onClick={clearAll}>Clear all filters</button>}
    </>
  );

  const shown = data?.items.length ?? 0;
  const total = data?.total ?? 0;

  return (
    <>
      {cat ? (
        <section className="cat-hero">
          <img src={img(cat.image, 1800, 700)} alt="" />
          <div className="container">
            <nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link> / <Link to="/shop">Shop</Link> / <span>{cat.name}</span></nav>
            <Rise as="h1" lines={[cat.name]} immediate />
            <p>{cat.description}</p>
          </div>
        </section>
      ) : (
        <div className="container page-head">
          <nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link> / <span>Shop</span></nav>
          <Rise as="h1" lines={[query.sale ? 'Sale' : query.gender === 'women' ? 'Women' : query.gender === 'men' ? 'Men' : query.q ? 'Search' : 'Shop all']} immediate />
          <p>{query.q ? `Results for “${query.q}”.` : 'Tees, shirts, hoodies and ladies wear — made to be worn, washed and worn again.'}</p>
        </div>
      )}

      <div className="container shop" style={{ paddingTop: cat ? 40 : 0 }}>
        <aside className="filters" aria-label="Filters">{filters}</aside>

        <div>
          <div className="toolbar">
            <button className="btn btn--ghost btn--sm filters-btn" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal size={15} /> Filters{active.length ? ` (${active.length})` : ''}
            </button>
            <span className="toolbar__count" aria-live="polite">
              {loading && !data ? 'Loading…' : `Showing ${shown} of ${total} ${total === 1 ? 'product' : 'products'}`}
            </span>
            <div className="toolbar__right">
              <label className="sr-only" htmlFor="sort">Sort by</label>
              <select id="sort" className="select" value={query.sort} onChange={(e) => set('sort', e.target.value === 'featured' ? null : e.target.value)}>
                {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <div className="view-toggle" role="group" aria-label="Layout">
                <button aria-pressed={view === 'grid'} aria-label="Grid view" onClick={() => setView('grid')}><LayoutGrid size={16} /></button>
                <button aria-pressed={view === 'list'} aria-label="List view" onClick={() => setView('list')}><List size={16} /></button>
              </div>
            </div>
          </div>

          {active.length > 0 && (
            <div className="active-filters">
              {active.map(([k, label, clear]) => (
                <button key={k} className="chip is-active" onClick={clear} aria-label={`Remove filter ${label}`}>
                  {label} <X size={12} style={{ verticalAlign: -1, marginLeft: 4 }} />
                </button>
              ))}
            </div>
          )}

          {error ? (
            <div className="notice notice--error">
              {error.message}
              <button className="btn btn--sm btn--ghost" onClick={reload}>Try again</button>
            </div>
          ) : !loading && total === 0 ? (
            <div className="empty">
              <h2>Nothing matches just yet</h2>
              <p>Try removing a filter or two — or browse everything we make.</p>
              <button className="btn" onClick={clearAll}>Clear filters</button>
            </div>
          ) : (
            <>
              <div className={`grid${view === 'list' ? ' grid--list' : ''}`}>
                {data?.items.map((p, i) => <ProductCard key={p.slug} p={p} eager={i < 3} />)}
                {loading && Array.from({ length: data ? 3 : 6 }, (_, i) => <CardSkeleton key={`s${i}`} />)}
              </div>
              {data && shown < total && (
                <div className="load-more">
                  <span>You have viewed {shown} of {total} products</span>
                  <div className="load-more__bar"><span style={{ width: `${(shown / total) * 100}%` }} /></div>
                  <button className="btn btn--ghost" onClick={() => setPage((p) => p + 1)} disabled={loading}>
                    {loading ? 'Loading…' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} side="left" title="Filters" footer={<button className="btn btn--block" onClick={() => setFiltersOpen(false)}>Show {total} products</button>}>
        <div className="filters" style={{ display: 'grid', position: 'static', maxHeight: 'none', padding: '16px 0' }}>{filters}</div>
      </Drawer>
    </>
  );
}
