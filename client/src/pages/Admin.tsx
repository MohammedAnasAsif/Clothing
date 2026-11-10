import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { fmtDate, money } from '../lib/format';

interface Summary {
  stats: { orders: number; revenue: number; subscribers: number; messages: number; lowStock: number };
  recentOrders: Array<{ number: string; email: string; total: number; payment: string; status: string; createdAt: string; units: number }>;
  messages: Array<{ id: number; name: string; email: string; subject: string; message: string; created_at: string }>;
  subscribers: Array<{ email: string; created_at: string }>;
  lowStock: Array<{ slug: string; name: string; stock: number }>;
}

/** Minimal back office: orders, messages, subscribers. Protected by ADMIN_TOKEN on the server. */
export default function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem('sh:admin') ?? '');
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState('');

  const load = async (t = token) => {
    setError('');
    try {
      setData(await api.admin<Summary>('/summary', t));
      sessionStorage.setItem('sh:admin', t);
    } catch (e) {
      setData(null);
      setError((e as Error).message);
    }
  };
  useEffect(() => {
    if (token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setStatus = async (number: string, status: string) => {
    try {
      await api.admin(`/orders/${number}`, token, { method: 'PATCH', body: JSON.stringify({ status }) });
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: 110 }}>
      <div className="page-head"><h1>Store admin</h1></div>
      {!data && (
        <form className="form" style={{ maxWidth: 420 }} onSubmit={(e) => { e.preventDefault(); load(); }}>
          <label className="field"><span>Admin token</span><input type="password" value={token} onChange={(e) => setToken(e.target.value)} autoComplete="off" /></label>
          {error && <p className="notice notice--error" role="alert">{error}</p>}
          <button className="btn" style={{ justifySelf: 'start' }}>Open dashboard</button>
        </form>
      )}
      {data && (
        <>
          <div className="admin-stats">
            <div><b>{data.stats.orders}</b><span>Orders</span></div>
            <div><b>{money(data.stats.revenue)}</b><span>Revenue</span></div>
            <div><b>{data.stats.subscribers}</b><span>Subscribers</span></div>
            <div><b>{data.stats.messages}</b><span>Messages</span></div>
            <div><b>{data.stats.lowStock}</b><span>Low stock</span></div>
          </div>
          {error && <p className="notice notice--error">{error}</p>}
          <h2 className="serif" style={{ fontSize: 28, fontWeight: 400, marginBottom: 12 }}>Recent orders</h2>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Units</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
              <tbody>
                {data.recentOrders.length === 0 && <tr><td colSpan={7} className="muted">No orders yet.</td></tr>}
                {data.recentOrders.map((o) => (
                  <tr key={o.number}>
                    <td>{o.number}</td><td>{fmtDate(o.createdAt)}</td><td>{o.email}</td><td>{o.units}</td><td>{money(o.total)}</td>
                    <td>{o.payment.toUpperCase()}</td>
                    <td>
                      <select className="select" value={o.status} onChange={(e) => setStatus(o.number, e.target.value)} aria-label={`Status of ${o.number}`}>
                        {['placed', 'packed', 'shipped', 'delivered'].map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h2 className="serif" style={{ fontSize: 28, fontWeight: 400, marginBottom: 12 }}>Low stock</h2>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Product</th><th>Stock</th></tr></thead>
              <tbody>{data.lowStock.map((p) => <tr key={p.slug}><td>{p.name}</td><td>{p.stock}</td></tr>)}</tbody>
            </table>
          </div>
          <h2 className="serif" style={{ fontSize: 28, fontWeight: 400, marginBottom: 12 }}>Messages</h2>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>From</th><th>Subject</th><th>Message</th><th>Date</th></tr></thead>
              <tbody>
                {data.messages.length === 0 && <tr><td colSpan={4} className="muted">No messages yet.</td></tr>}
                {data.messages.map((m) => <tr key={m.id}><td>{m.name}<br /><span className="muted">{m.email}</span></td><td>{m.subject}</td><td>{m.message}</td><td>{fmtDate(m.created_at)}</td></tr>)}
              </tbody>
            </table>
          </div>
          <h2 className="serif" style={{ fontSize: 28, fontWeight: 400, marginBottom: 12 }}>Subscribers</h2>
          <p className="muted">{data.subscribers.map((s) => s.email).join(', ') || 'No subscribers yet.'}</p>
        </>
      )}
    </div>
  );
}
