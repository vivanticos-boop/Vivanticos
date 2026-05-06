import type { Metadata } from "next";
import { League_Spartan, Libre_Franklin } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const leagueSpartan = League_Spartan({
  variable: "--font-league-spartan",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const libreFranklin = Libre_Franklin({
  variable: "--font-libre-franklin",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vivanticos - Mobiliario Infantil",
  description: "Sistema de gestión para Vivanticos - Mobiliario Infantil. Catálogo, cotizaciones, entregas y más.",
  keywords: ["Vivanticos", "mobiliario infantil", "cunas", "camas", "muebles bebé"],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${leagueSpartan.variable} ${libreFranklin.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
