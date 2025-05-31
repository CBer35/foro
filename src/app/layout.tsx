import type { Metadata } from 'next';
import { PT_Sans } from 'next/font/google'; // Correctly import PT Sans
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

// Configure PT Sans font
const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans', // CSS variable for Tailwind
});

export const metadata: Metadata = {
  title: 'AnonymChat',
  description: 'An anonymous forum for messages and polls.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${ptSans.variable}`}>
      <head>
        {/* Keep existing Google Fonts links if any, or rely on next/font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
