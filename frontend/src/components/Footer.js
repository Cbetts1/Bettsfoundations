import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-white font-bold mb-3">Betts Foundations</h3>
          <p className="text-sm leading-relaxed">
            Premium digital products delivered instantly. Quality learning resources for everyone.
          </p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
            <li><Link href="/#products" className="hover:text-white transition-colors">Products</Link></li>
            <li><Link href="/auth/login" className="hover:text-white transition-colors">Sign In</Link></li>
            <li><Link href="/auth/register" className="hover:text-white transition-colors">Register</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/legal/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            <li><Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link href="/legal/refund" className="hover:text-white transition-colors">Refund Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 px-4 py-4 text-center text-xs text-gray-600">
        © {year} Betts Foundations. All rights reserved. Payments secured by Stripe.
      </div>
    </footer>
  );
}
