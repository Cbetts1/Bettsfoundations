import './globals.css';

export const metadata = {
  title: 'Betts Foundations – Digital Learning',
  description: 'Premium digital products, ebooks, and courses from Betts Foundations.',
  openGraph: {
    title: 'Betts Foundations',
    description: 'Premium digital products and ebooks.',
    url: 'https://bettsfoundations.org',
    siteName: 'Betts Foundations',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
