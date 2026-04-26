import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdSlot from "@/components/AdSlot";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vtiportal.com";
const ADSENSE_CLIENT = "ca-pub-2437073177304126";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "VTIportal — Drame, ispovijesti i priče iz života",
    template: "%s | VTIportal",
  },
  description:
    "VTIportal donosi najzanimljivije ispovijesti, drame i priče iz svakodnevnog života. Čitaj nove priče svaki dan.",
  openGraph: {
    title: "VTIportal",
    description: "Drame, ispovijesti i priče iz života.",
    url: SITE_URL,
    siteName: "VTIportal",
    locale: "bs_BA",
    type: "website",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.ico" },
  alternates: {
    types: {
      "application/rss+xml": `${SITE_URL}/rss.xml`,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bs">
      <head>
        {/* Ezoic CMP — Gatekeeper Consent */}
        <Script
          id="ezoic-cmp-min"
          src="https://cmp.gatekeeperconsent.com/min.js"
          data-cfasync="false"
          strategy="afterInteractive"
        />
        <Script
          id="ezoic-cmp"
          src="https://the.gatekeeperconsent.com/cmp.min.js"
          data-cfasync="false"
          strategy="afterInteractive"
        />
        {/* Ezoic Standalone */}
        <Script
          id="ezoic-sa"
          async
          src="https://www.ezojs.com/ezoic/sa.min.js"
          strategy="afterInteractive"
        />
        <Script id="ezoic-init" strategy="afterInteractive">
          {`
            window.ezstandalone = window.ezstandalone || {};
            ezstandalone.cmd = ezstandalone.cmd || [];
          `}
        </Script>
        <Script
          id="ezoic-analytics"
          src="https://ezoicanalytics.com/analytics.js"
          strategy="afterInteractive"
        />
        {/* AdSense — Ezoic koristi tvoj AdSense kao demand source */}
        <Script
          id="google-adsense"
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        {/* Google Analytics (gtag.js) */}
        <Script
          id="ga-loader"
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-NYF0RCBD8K"
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-NYF0RCBD8K');
          `}
        </Script>
      </head>
      <body>
        <Header />
        <div className="top-ad-wrap">
          <AdSlot slot="top-leaderboard" className="ad-box ad-leaderboard" placeholder="Reklama · 728×90" />
        </div>
        {children}
        <Footer />
        <div className="mobile-sticky-ad">
          <AdSlot slot="mobile-sticky" className="ad-box" placeholder="Reklama · 320×50" />
        </div>
      </body>
    </html>
  );
}
