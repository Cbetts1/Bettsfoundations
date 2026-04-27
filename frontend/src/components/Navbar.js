'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('bf_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
      } catch {}
    }
  }, [pathname]);

  const logout = () => {
    localStorage.removeItem('bf_token');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="text-xl font-bold text-brand-700">
          Betts Foundations
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/#products" className="hover:text-brand-600">Products</Link>
          {user ? (
            <>
              <Link href="/orders" className="hover:text-brand-600">My Orders</Link>
              {user.role === 'admin' && <Link href="/admin" className="hover:text-brand-600 text-brand-600">Admin</Link>}
              <button onClick={logout} className="hover:text-red-500">Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="hover:text-brand-600">Sign In</Link>
              <Link href="/auth/register" className="btn-primary py-2 px-4 text-sm">Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <span className="block w-5 h-0.5 bg-gray-600 mb-1" />
          <span className="block w-5 h-0.5 bg-gray-600 mb-1" />
          <span className="block w-5 h-0.5 bg-gray-600" />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-3 text-sm">
          <Link href="/#products" className="block text-gray-600">Products</Link>
          {user ? (
            <>
              <Link href="/orders" className="block text-gray-600">My Orders</Link>
              {user.role === 'admin' && <Link href="/admin" className="block text-brand-600">Admin</Link>}
              <button onClick={logout} className="block text-red-500">Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="block text-gray-600">Sign In</Link>
              <Link href="/auth/register" className="block text-brand-600 font-semibold">Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
