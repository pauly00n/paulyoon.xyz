import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display, STIX_Two_Text } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/nav';
import { HeroBackground } from '@/components/hero-background';

const _inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const _playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });
const _stix = STIX_Two_Text({ subsets: ["latin"], variable: "--font-stix", display: "swap" });
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://paulyoon.xyz').replace(/\/$/, '')
const ogImageUrl = `${siteUrl}/og-image2.png`
const serializeJsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c')

export const viewport: Viewport = {
  themeColor: '#e0f1f9',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Paul Yoon',
  description: 'Stanford University Undergraduate studying Computer Science and Music',
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: 'Paul Yoon',
    description: 'Stanford University Undergraduate studying Computer Science and Music',
    url: siteUrl,
    siteName: 'Paul Yoon',
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: 'Paul Yoon',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Paul Yoon',
    description: 'Stanford University Undergraduate studying Computer Science and Music',
    images: [ogImageUrl],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" style={{ backgroundColor: "#e0f1f9" }}>

        <head>
                <script
                    id="schema-person"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: serializeJsonLd({
                            "@context": "https://schema.org",
                            "@type": "Person",
                            "name": "Paul Yoon",
                            "affiliation": {
                                "@type": "CollegeOrUniversity",
                                "name": "Stanford University"
                            },
                            "url": "https://paulyoon.xyz"
                        }),
                    }}
                />
                <script
                    id="schema-website"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: serializeJsonLd({
                            "@context": "https://schema.org",
                            "@type": "WebSite",
                            "name": "Paul Yoon",
                            "alternateName": "paulyoon.xyz",
                            "url": siteUrl
                        }),
                    }}
                />
            </head>
      <body className={`${_inter.variable} ${_playfair.variable} ${_stix.variable} font-sans antialiased`} style={{ background: 'transparent' }}>
        <div style={{ position: 'fixed', top: '-300px', bottom: '-300px', left: 0, right: 0, zIndex: -10, willChange: 'auto' }}>
          <HeroBackground />
        </div>
        <Nav />
        {children}
      </body>
    </html>
  )
}
