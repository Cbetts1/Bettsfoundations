import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';

export const metadata = { title: 'Privacy Policy – Betts Foundations' };

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: January 1, 2025</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
          <p className="text-gray-700 leading-relaxed mb-2"><strong>Account Information:</strong> Email address and hashed password when you register.</p>
          <p className="text-gray-700 leading-relaxed mb-2"><strong>Order Information:</strong> Product purchases, Stripe payment session references (we do NOT store card numbers or CVV).</p>
          <p className="text-gray-700 leading-relaxed"><strong>Usage Data:</strong> Basic server logs (IP address, request timestamps) for security and fraud prevention purposes.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>To process and fulfil your orders</li>
            <li>To secure your account and prevent fraud</li>
            <li>To send order confirmation and download links</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">3. Third-Party Services</h2>
          <p className="text-gray-700 leading-relaxed mb-2"><strong>Stripe:</strong> Payment processing. Your payment data is handled solely by Stripe under their <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">Privacy Policy</a>.</p>
          <p className="text-gray-700 leading-relaxed"><strong>OpenAI:</strong> AI content generation for product descriptions. No personal user data is sent to OpenAI.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">4. Data Retention</h2>
          <p className="text-gray-700 leading-relaxed">We retain your account and order data for as long as your account is active or as required by law. You may request deletion of your account data by contacting us.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">5. Your Rights</h2>
          <p className="text-gray-700 leading-relaxed">You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at <a href="mailto:support@bettsfoundations.org" className="text-brand-600 underline">support@bettsfoundations.org</a>.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">6. Cookies</h2>
          <p className="text-gray-700 leading-relaxed">We use minimal session cookies required for authentication. We do not use advertising or tracking cookies.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">7. Security</h2>
          <p className="text-gray-700 leading-relaxed">We implement industry-standard security measures including TLS encryption, bcrypt password hashing, JWT authentication, and rate limiting to protect your data.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">8. Contact</h2>
          <p className="text-gray-700 leading-relaxed">Privacy questions: <a href="mailto:support@bettsfoundations.org" className="text-brand-600 underline">support@bettsfoundations.org</a></p>
        </section>
      </main>
      <Footer />
    </>
  );
}
