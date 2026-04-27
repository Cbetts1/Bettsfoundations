'use client';
import { useState } from 'react';
import { apiFetch } from '../lib/api';

export default function BuyButton({ productId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBuy = async () => {
    const token = localStorage.getItem('bf_token');
    if (!token) {
      window.location.href = `/auth/login?redirect=/products/${productId}`;
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/orders/create-session', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId }),
      });
      window.location.href = data.url;
    } catch (err) {
      setError(err.message || 'Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button onClick={handleBuy} disabled={loading} className="btn-primary text-lg px-8 py-3">
        {loading ? 'Redirecting to checkout…' : 'Buy Now'}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
