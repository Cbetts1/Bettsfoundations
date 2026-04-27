import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';

export const metadata = { title: 'Refund Policy – Betts Foundations' };

export default function RefundPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Refund Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: January 1, 2025</p>

        <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 mb-8">
          <p className="text-brand-800 font-medium">📋 Summary: Due to the digital nature of our products, all sales are final after the download link is accessed. We offer refunds in specific circumstances described below.</p>
        </div>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">1. Digital Product Policy</h2>
          <p className="text-gray-700 leading-relaxed">Because our products are digital and can be copied, we generally do not offer refunds once a download has been accessed. This policy is in line with standard digital goods industry practice and consumer protection regulations applicable to digital downloads.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">2. Eligible Refund Situations</h2>
          <p className="text-gray-700 leading-relaxed mb-3">We will issue a full refund in the following cases:</p>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>The purchased file is corrupted, unreadable, or fails to download despite multiple attempts</li>
            <li>You were charged more than once for the same product (duplicate charge)</li>
            <li>The product delivered is materially different from what was described on the product page</li>
            <li>Technical issues on our end prevented you from accessing the product within 24 hours of purchase</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">3. How to Request a Refund</h2>
          <p className="text-gray-700 leading-relaxed">To request a refund, email us within <strong>7 days</strong> of your purchase date at:</p>
          <p className="mt-2"><a href="mailto:support@bettsfoundations.org" className="text-brand-600 underline font-medium">support@bettsfoundations.org</a></p>
          <p className="text-gray-700 leading-relaxed mt-2">Please include your order ID, email address used during purchase, and a brief description of the issue. We will respond within 2 business days.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">4. Refund Processing</h2>
          <p className="text-gray-700 leading-relaxed">Approved refunds are processed through Stripe and typically appear on your original payment method within 5–10 business days, depending on your bank or card issuer.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">5. Non-Refundable Situations</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Change of mind after download access</li>
            <li>Failure to read the product description before purchase</li>
            <li>Incompatibility with your device (PDFs are universally compatible)</li>
            <li>Requests made more than 7 days after purchase</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">6. Contact</h2>
          <p className="text-gray-700 leading-relaxed">Refund inquiries: <a href="mailto:support@bettsfoundations.org" className="text-brand-600 underline">support@bettsfoundations.org</a></p>
        </section>
      </main>
      <Footer />
    </>
  );
}
