'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '../../../lib/api';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';

function SuccessContent() {
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const params = useSearchParams();
  const sessionId = params.get('session_id');

  useEffect(() => {
    if (!sessionId) return;
    apiFetch(`/orders/success?session_id=${encodeURIComponent(sessionId)}`)
      .then((d) => setOrder(d.order))
      .catch((err) => setError(err.message));
  }, [sessionId]);

  if (!sessionId) return <p className="text-red-600">Invalid payment session.</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!order) return <p className="text-gray-500">Confirming your payment…</p>;

  return (
    <div className="card p-8 text-center">
      <div className="text-5xl mb-4">🎉</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
      <p className="text-gray-600 mb-6">Thank you for your purchase. Your digital product is ready to download.</p>
      {order.download_url ? (
        <a
          href={order.download_url}
          className="btn-primary inline-flex"
          download
        >
          ⬇ Download Your Product
        </a>
      ) : (
        <p className="text-yellow-600">Your download link is being prepared. Check back shortly.</p>
      )}
      <div className="mt-6">
        <Link href="/orders" className="text-sm text-brand-600 hover:underline">View all orders</Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-16">
        <Suspense fallback={<p className="text-gray-500">Loading…</p>}>
          <SuccessContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
