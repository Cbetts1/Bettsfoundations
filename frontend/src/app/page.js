import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';

async function getProducts() {
  try {
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://backend:4000/api';
    const res = await fetch(`${apiUrl}/products?limit=12`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const products = await getProducts();

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-brand-700 to-brand-900 text-white py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Betts Foundations
            </h1>
            <p className="text-xl text-brand-100 mb-8 max-w-2xl mx-auto">
              Premium digital ebooks and learning resources — instantly delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="#products" className="btn-primary bg-white text-brand-700 hover:bg-brand-50">
                Browse Products
              </Link>
              <Link href="/auth/register" className="btn-secondary border-white text-white hover:bg-brand-800">
                Create Account
              </Link>
            </div>
          </div>
        </section>

        {/* Features strip */}
        <section className="bg-white border-b border-gray-200 py-8">
          <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: '⚡', title: 'Instant Download', desc: 'Access your purchase immediately after payment.' },
              { icon: '🔒', title: 'Secure Payments', desc: 'All transactions processed by Stripe.' },
              { icon: '📚', title: 'AI-Enhanced Content', desc: 'Quality content crafted with AI assistance.' },
            ].map((f) => (
              <div key={f.title} className="p-4">
                <div className="text-3xl mb-2">{f.icon}</div>
                <h3 className="font-semibold text-gray-800 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Products */}
        <section id="products" className="py-16 px-4 max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">Our Digital Library</h2>
          {products.length === 0 ? (
            <div className="text-center text-gray-500 py-20">
              <p className="text-xl">Products coming soon. Check back shortly!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
