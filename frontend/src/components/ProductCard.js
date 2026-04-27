import Link from 'next/link';

function formatPrice(cents) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default function ProductCard({ product }) {
  return (
    <article className="card hover:shadow-md transition-shadow group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <span className="badge bg-brand-100 text-brand-700 capitalize">{product.category || 'ebook'}</span>
          {product.ai_generated ? (
            <span className="badge bg-purple-100 text-purple-700">AI-Enhanced</span>
          ) : null}
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-brand-600 transition-colors line-clamp-2">
          {product.title}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-3 mb-4">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-brand-700">{formatPrice(product.price_cents)}</span>
          <Link
            href={`/products/${product.id}`}
            className="btn-primary py-2 px-4 text-sm"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}
