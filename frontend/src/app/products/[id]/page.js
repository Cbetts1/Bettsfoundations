import { notFound } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import BuyButton from '../../../components/BuyButton';

function formatPrice(cents) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

async function getProduct(id) {
  try {
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://backend:4000/api';
    const res = await fetch(`${apiUrl}/products/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.product;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: 'Not Found' };
  return {
    title: `${product.title} – Betts Foundations`,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12">
        <div className="card p-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="badge bg-brand-100 text-brand-700 capitalize">{product.category}</span>
            {product.ai_generated ? (
              <span className="badge bg-purple-100 text-purple-700">AI-Enhanced</span>
            ) : null}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.title}</h1>
          <p className="text-gray-600 leading-relaxed mb-8 whitespace-pre-wrap">{product.description}</p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-gray-200">
            <div>
              <div className="text-sm text-gray-500 mb-1">Price</div>
              <div className="text-4xl font-bold text-brand-700">{formatPrice(product.price_cents)}</div>
              <div className="text-xs text-gray-400 mt-1">One-time payment · Instant PDF download</div>
            </div>
            <BuyButton productId={product.id} />
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg text-sm text-gray-500">
            <p>✅ Secure payment via Stripe &nbsp;|&nbsp; 📥 Instant download &nbsp;|&nbsp; 🔒 Your data is safe</p>
            <p className="mt-1">
              By purchasing you agree to our{' '}
              <a href="/legal/terms" className="text-brand-600 underline">Terms of Service</a> and{' '}
              <a href="/legal/refund" className="text-brand-600 underline">Refund Policy</a>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
