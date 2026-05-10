import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://kastj.io"),
  title: "Kastj | Conditional Crowdfunding on Kaspa",
  description: "The most advanced crowdfunding platform on Kaspa. Transparent, secure, and conditional.",
  openGraph: {
    title: "Kastj | Conditional Crowdfunding",
    description: "Support Kaspa projects with total security. Funds are only released if the minimum threshold is met.",
    images: ["/og-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kastj | Conditional Crowdfunding on Kaspa",
    description: "Transparent, secure, and conditional crowdfunding.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" style={{ scrollBehavior: 'smooth' }}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}