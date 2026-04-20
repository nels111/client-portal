import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Signature Cleans Portal",
  description: "Peace of mind, every time. Secure client portal for Signature Cleans.",
  robots: { index: false, follow: false }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap"
        />
        <link rel="icon" href="/logo.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
