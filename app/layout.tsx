import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Kastj | Crowdfunding Condicional en Kaspa",
  description: "La plataforma de crowdfunding más avanzada en Kaspa. Transparente, segura y condicional.",
  openGraph: {
    title: "Kastj | Crowdfunding Condicional",
    description: "Apoya proyectos en Kaspa con seguridad total. Los fondos solo se liberan si se alcanza el umbral mínimo.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}