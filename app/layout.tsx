import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { LanguageProvider } from "@/components/layout/language-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Smart Force Taxi | Premium Corporate Fleet & Taxi Service",
    template: "%s | Smart Force Taxi",
  },
  description: "Enterprise-grade Fleet Management System for vehicle tracking, driver scheduling, and maintenance logging.",
  keywords: ["fleet management", "logistics", "trip closing", "vehicle condition", "driver attendance", "fuel log"],
  authors: [{ name: "Smart Force Taxi" }],
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "Smart Force Taxi | Premium Corporate Fleet & Taxi Service",
    description: "Enterprise-grade Fleet Management System for vehicle tracking, driver scheduling, and maintenance logging.",
    url: "http://localhost:3000",
    siteName: "Smart Force Taxi",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Force Taxi | Premium Corporate Fleet & Taxi Service",
    description: "Enterprise-grade Fleet Management System for vehicle tracking, driver scheduling, and maintenance logging.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <ThemeProvider>
          <LanguageProvider>
            {children}
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(function(registrations) {
                      var unregisteredCount = 0;
                      for (var i = 0; i < registrations.length; i++) {
                        registrations[i].unregister();
                        unregisteredCount++;
                      }
                      if (unregisteredCount > 0) {
                        window.location.reload();
                      }
                    });
                  }
                `,
              }}
            />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
