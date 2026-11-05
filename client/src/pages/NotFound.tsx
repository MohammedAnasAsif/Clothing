import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container empty" style={{ padding: '120px 20px 140px' }}>
      <p className="eyebrow muted">Error 404</p>
      <h2 style={{ fontSize: 'clamp(48px, 7vw, 96px)', lineHeight: 1 }}>Lost the thread</h2>
      <p>The page you were looking for has moved or no longer exists.</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/" className="btn">Back to home</Link>
        <Link to="/shop" className="btn btn--ghost">Shop all</Link>
      </div>
    </div>
  );
}
