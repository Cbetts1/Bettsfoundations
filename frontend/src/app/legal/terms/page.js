import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';

export const metadata = { title: 'Terms of Service – Betts Foundations' };

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 prose prose-gray">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: January 1, 2025</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p className="text-gray-700 leading-relaxed">By accessing or using <strong>Betts Foundations</strong> (bettsfoundations.org) and purchasing any digital products, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">2. Digital Products</h2>
          <p className="text-gray-700 leading-relaxed">Betts Foundations sells digital products including ebooks, templates, and courses. All products are delivered electronically. Upon successful payment you will receive a secure download link via your account dashboard. Downloads are limited to 3 attempts per purchase.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">3. License and Intellectual Property</h2>
          <p className="text-gray-700 leading-relaxed">All digital products sold on this platform are for personal, non-commercial use only unless stated otherwise. You may not reproduce, distribute, resell, sublicense, or publicly share any purchased product without explicit written permission from Betts Foundations.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">4. Payment & Pricing</h2>
          <p className="text-gray-700 leading-relaxed">All prices are listed in US Dollars (USD). Payments are processed securely through Stripe. We do not store your payment card details on our servers. Prices are subject to change without notice.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">5. User Accounts</h2>
          <p className="text-gray-700 leading-relaxed">You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate and current information during registration. We reserve the right to suspend or terminate accounts that violate these terms.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">6. Prohibited Use</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Sharing purchased downloads with others</li>
            <li>Using our platform for any unlawful purpose</li>
            <li>Attempting to reverse-engineer our systems</li>
            <li>Creating multiple accounts to circumvent restrictions</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">7. Disclaimer of Warranties</h2>
          <p className="text-gray-700 leading-relaxed">Our products and services are provided &ldquo;as is&rdquo; without any warranties, express or implied. We do not guarantee that our services will be uninterrupted or error-free.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
          <p className="text-gray-700 leading-relaxed">Betts Foundations shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our products or services. Our total liability shall not exceed the amount paid for the specific product in question.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">9. Governing Law</h2>
          <p className="text-gray-700 leading-relaxed">These terms are governed by the laws of the United States. Any disputes shall be resolved through binding arbitration in accordance with applicable law.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">10. Contact</h2>
          <p className="text-gray-700 leading-relaxed">For questions regarding these terms, please contact us at: <a href="mailto:support@bettsfoundations.org" className="text-brand-600 underline">support@bettsfoundations.org</a></p>
        </section>
      </main>
      <Footer />
    </>
  );
}
