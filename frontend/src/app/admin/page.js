'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

function formatPrice(cents) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function StatCard({ label, value, color = 'text-gray-900' }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function AIGenerator() {
  const [tab, setTab] = useState('description');
  const [inputs, setInputs] = useState({ topic: '', title: '', page_count: 50, chapters: 5 });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    setLoading(true); setError(''); setResult('');
    try {
      let data;
      if (tab === 'description') {
        data = await apiFetch('/ai/generate-description', { method: 'POST', body: JSON.stringify({ topic: inputs.topic }) });
        setResult(data.description);
      } else if (tab === 'pricing') {
        data = await apiFetch('/ai/generate-pricing', { method: 'POST', body: JSON.stringify({ topic: inputs.topic, page_count: inputs.page_count }) });
        setResult(`Suggested price: ${formatPrice(Math.round(data.price_usd * 100))}\n\nReason: ${data.reasoning}`);
      } else {
        data = await apiFetch('/ai/generate-ebook', { method: 'POST', body: JSON.stringify({ title: inputs.title, chapters: inputs.chapters }) });
        setResult(JSON.stringify(data.content, null, 2));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold mb-4">AI Generator</h2>
      <div className="flex gap-2 mb-4">
        {['description', 'pricing', 'ebook'].map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setResult(''); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {(tab === 'description' || tab === 'pricing') && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Topic / Product Name</label>
          <input className="input" value={inputs.topic} onChange={(e) => setInputs({ ...inputs, topic: e.target.value })} placeholder="e.g. Mastering Personal Finance" />
        </div>
      )}
      {tab === 'pricing' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Approximate Page Count</label>
          <input type="number" className="input" value={inputs.page_count} onChange={(e) => setInputs({ ...inputs, page_count: Number(e.target.value) })} min={1} max={500} />
        </div>
      )}
      {tab === 'ebook' && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ebook Title</label>
            <input className="input" value={inputs.title} onChange={(e) => setInputs({ ...inputs, title: e.target.value })} placeholder="e.g. The Beginner's Guide to Investing" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Chapters</label>
            <input type="number" className="input" value={inputs.chapters} onChange={(e) => setInputs({ ...inputs, chapters: Number(e.target.value) })} min={3} max={20} />
          </div>
        </>
      )}

      <button onClick={generate} disabled={loading} className="btn-primary">
        {loading ? 'Generating…' : 'Generate with AI'}
      </button>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {result && (
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{result}</pre>
        </div>
      )}
    </div>
  );
}

function ProductApproval({ products, onRefresh }) {
  const [loading, setLoading] = useState('');

  const action = async (id, act) => {
    setLoading(id + act);
    try {
      await apiFetch(`/admin/products/${id}/${act}`, { method: 'PATCH' });
      onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading('');
    }
  };

  const pending = products.filter((p) => p.status === 'pending');
  if (!pending.length) return <p className="text-gray-500 text-sm">No products pending approval.</p>;

  return (
    <div className="space-y-3">
      {pending.map((p) => (
        <div key={p.id} className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-semibold text-gray-900">{p.title}</h4>
            <p className="text-sm text-gray-500">{formatPrice(p.price_cents)} · {p.category}</p>
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.description}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => action(p.id, 'approve')}
              disabled={!!loading}
              className="btn-primary py-2 px-4 text-sm bg-green-600 hover:bg-green-700"
            >
              {loading === p.id + 'approve' ? '…' : 'Approve'}
            </button>
            <button
              onClick={() => action(p.id, 'reject')}
              disabled={!!loading}
              className="btn-secondary py-2 px-4 text-sm text-red-600 hover:bg-red-50"
            >
              {loading === p.id + 'reject' ? '…' : 'Reject'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const loadDashboard = useCallback(async () => {
    try {
      const [dash, prods, ords] = await Promise.all([
        apiFetch('/admin/dashboard'),
        apiFetch('/admin/products'),
        apiFetch('/admin/orders'),
      ]);
      setStats(dash);
      setAiEnabled(dash.aiEnabled);
      setProducts(prods.products || []);
      setOrders(ords.orders || []);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        router.push('/auth/login');
      } else {
        setError(err.message);
      }
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('bf_token');
    if (!token) { router.push('/auth/login'); return; }
    loadDashboard();
  }, [loadDashboard, router]);

  const toggleAI = async () => {
    try {
      const data = await apiFetch('/admin/ai-toggle', {
        method: 'PATCH',
        body: JSON.stringify({ enabled: !aiEnabled }),
      });
      setAiEnabled(data.ai_enabled);
    } catch (err) {
      alert(err.message);
    }
  };

  const tabs = ['dashboard', 'approvals', 'orders', 'ai'];

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">AI Generation</span>
            <button
              onClick={toggleAI}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${aiEnabled ? 'bg-brand-600' : 'bg-gray-300'}`}
              aria-label="Toggle AI"
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${aiEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 mb-4">{error}</div>}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 capitalize text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === t ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t}
              {t === 'approvals' && stats?.pendingProducts > 0 && (
                <span className="ml-2 badge bg-red-100 text-red-700">{stats.pendingProducts}</span>
              )}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {activeTab === 'dashboard' && stats && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <StatCard label="Total Products" value={stats.totalProducts} />
              <StatCard label="Pending" value={stats.pendingProducts} color="text-yellow-600" />
              <StatCard label="Total Orders" value={stats.totalOrders} />
              <StatCard label="Paid Orders" value={stats.paidOrders} color="text-green-600" />
              <StatCard label="Revenue" value={formatPrice(stats.revenue_cents)} color="text-brand-600" />
              <StatCard label="Users" value={stats.totalUsers} />
            </div>

            <div className="card p-6">
              <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
              {orders.slice(0, 5).map((o) => (
                <div key={o.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-sm text-gray-800">{o.product_title}</p>
                    <p className="text-xs text-gray-400">{o.user_email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatPrice(o.amount_cents)}</p>
                    <span className={`badge text-xs ${o.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approvals */}
        {activeTab === 'approvals' && (
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4">Product Approvals</h2>
            <ProductApproval products={products} onRefresh={loadDashboard} />
          </div>
        )}

        {/* Orders */}
        {activeTab === 'orders' && (
          <div className="card p-6 overflow-x-auto">
            <h2 className="text-xl font-bold mb-4">All Orders</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-2 pr-4">Customer</th>
                  <th className="pb-2 pr-4">Product</th>
                  <th className="pb-2 pr-4">Amount</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Downloads</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 pr-4 text-gray-600">{o.user_email}</td>
                    <td className="py-2 pr-4">{o.product_title}</td>
                    <td className="py-2 pr-4 font-medium">{formatPrice(o.amount_cents)}</td>
                    <td className="py-2 pr-4">
                      <span className={`badge ${o.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{o.status}</span>
                    </td>
                    <td className="py-2 pr-4">{o.download_count}/{o.download_limit}</td>
                    <td className="py-2 text-gray-400">{new Date(o.created_at * 1000).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && <p className="text-gray-500 text-sm mt-4">No orders yet.</p>}
          </div>
        )}

        {/* AI Generator */}
        {activeTab === 'ai' && (
          aiEnabled
            ? <AIGenerator />
            : <div className="card p-8 text-center text-gray-500">
                <p className="text-lg mb-2">AI Generation is currently disabled.</p>
                <p className="text-sm">Toggle it on using the switch at the top of the page.</p>
              </div>
        )}
      </main>
      <Footer />
    </>
  );
}
