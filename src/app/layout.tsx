import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#B3BA95",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Vivanticos - Mobiliario Infantil",
  description: "Sistema de gestión para Vivanticos - Catálogo, cotizaciones, entregas y más.",
  keywords: ["Vivanticos", "mobiliario infantil", "cunas", "camas", "muebles bebé"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vivanticos",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
  openGraph: {
    title: "Vivanticos - Mobiliario Infantil",
    description: "Catálogo, cotizaciones y gestión de entregas",
    images: ["/logo-vivanticos.jpeg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${leagueSpartan.variable} ${libreFranklin.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster position="top-right" richColors />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  // Register SW with updateViaCache: 'none' to always check network for SW updates
                  navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(function(reg) {
                    // Force update check on every page load
                    reg.update();

                    // Check for updates every 2 minutes (mobile needs frequent checks)
                    setInterval(function() { reg.update(); }, 120000);

                    // If there's a waiting SW, activate it immediately
                    if (reg.waiting) {
                      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }

                    // Listen for new SW installations
                    reg.addEventListener('updatefound', function() {
                      var newWorker = reg.installing;
                      if (newWorker) {
                        newWorker.addEventListener('statechange', function() {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New version ready — activate immediately
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                          }
                        });
                      }
                    });
                  }).catch(function(err) {
                    console.log('SW registration failed:', err);
                  });
                });

                // Listen for SW updates and forced reloads
                navigator.serviceWorker.addEventListener('message', function(event) {
                  if (event.data) {
                    if (event.data.type === 'FORCE_RELOAD' || event.data.type === 'SW_UPDATED') {
                      // Clear localStorage cache to force fresh data from Supabase
                      try {
                        var stored = localStorage.getItem('vivanticos-catalogo');
                        if (stored) {
                          var parsed = JSON.parse(stored);
                          // Keep the data but mark it as needing refresh
                          parsed._needsRefresh = true;
                          localStorage.setItem('vivanticos-catalogo', JSON.stringify(parsed));
                        }
                      } catch(e) {}
                      window.location.reload();
                    }
                  }
                });

                // When SW controller changes (new SW took over), reload
                navigator.serviceWorker.addEventListener('controllerchange', function() {
                  window.location.reload();
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
