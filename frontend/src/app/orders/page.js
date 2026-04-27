'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

function formatPrice(cents) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function StatusBadge({ status }) {
  const colors = {
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
  };
  return <span className={`badge ${colors[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('bf_token');
    if (!token) { router.push('/auth/login?redirect=/orders'); return; }
    apiFetch('/orders/my')
      .then((d) => setOrders(d.orders || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>
        {loading && <p className="text-gray-500">Loading…</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && orders.length === 0 && (
          <div className="card p-8 text-center text-gray-500">
            <p className="text-lg mb-4">No orders yet.</p>
            <a href="/#products" className="btn-primary">Browse Products</a>
          </div>
        )}
        {orders.map((o) => (
          <div key={o.id} className="card p-6 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">{o.title}</h3>
              <p className="text-sm text-gray-500 capitalize">{o.category} · {formatPrice(o.amount_cents)}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(o.created_at * 1000).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-4">
              <StatusBadge status={o.status} />
              {o.status === 'paid' && (
                <a href={`/orders/download/${o.id}`} className="btn-primary py-2 px-4 text-sm">
                  Download
                </a>
              )}
            </div>
          </div>
        ))}
      </main>
      <Footer />
    </>
  );
}
