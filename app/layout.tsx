import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import Header from '@/components/header';
import Footer from '@/components/footer';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
});

export const metadata: Metadata = {
    title: 'Paul Yoon | Stanford University Undergraduate',
    description: "Paul Yoon - Stanford University Undergraduate studying Mathematics and Computer Science",
    icons: [
        { rel: 'icon', url: '/icon-light.png', media: '(prefers-color-scheme: light)' },
        { rel: 'icon', url: '/icon-dark.png', media: '(prefers-color-scheme: dark)' },
    ],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script
                    id="schema-person"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Person",
                            "name": "Paul Yoon",
                            "affiliation": {
                                "@type": "CollegeOrUniversity",
                                "name": "Stanford University"
                            },
                            "url": "https://paulyoon.com"
                        }),
                    }}
                />
            </head>
            <body className={`${inter.className} min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem
                    disableTransitionOnChange
                >
                    <Header />
                    <main className="flex-grow">
                        {children}
                    </main>
                    <Footer />
                </ThemeProvider>
            </body>
        </html>
    );
}
