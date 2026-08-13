import type { Metadata, Viewport } from "next";
import { Inter, Lora, Nunito, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { THEME_CSS_VARS, DEFAULT_THEME } from "@/shared/theme/themes";
import { MobileTabBar } from "@/components/navigation/MobileTabBar";

// Four logical font roles the theme bundles reference (sans/serif/rounded/mono).
// Default theme (focus) uses sans + serif, so those preload; the rest are only
// pulled in when a theme that uses them is active (Next self-hosts either way).
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const lora = Lora({ subsets: ["latin"], variable: "--font-serif", display: "swap" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-rounded", display: "swap", preload: false });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap", preload: false });

const fontVars = `${inter.variable} ${lora.variable} ${nunito.variable} ${jetbrains.variable}`;

// Runs before paint to avoid a flash of the wrong theme: reads the stored
// preference, resolves "system", then applies that theme's CSS variables +
// data-theme + body font from the injected bundle (single source of truth).
const THEME_INIT_SCRIPT = `
(function() {
  try {
    var CSS = ${JSON.stringify(THEME_CSS_VARS)};
    var DEFAULT = ${JSON.stringify(DEFAULT_THEME)};
    var names = Object.keys(CSS);
    var pref = localStorage.getItem('bubbly_theme') || localStorage.getItem('studix_theme') || 'system';
    if (pref !== 'system' && names.indexOf(pref) === -1) pref = 'system';
    var theme = pref;
    if (pref === 'system') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : DEFAULT;
    }
    var root = document.documentElement;
    var vars = CSS[theme] || CSS[DEFAULT];
    for (var k in vars) root.style.setProperty(k, vars[k]);
    root.setAttribute('data-theme', theme);
    if (theme === 'dark') root.classList.add('dark');
    var font = localStorage.getItem('bubbly_font');
    root.style.setProperty('--font-body', font === 'serif' ? 'var(--font-serif)' : 'var(--font-sans)');
  } catch (e) {}
})();
})();

const SW_INIT_SCRIPT = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(registration) {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function(err) {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}
`;

export const metadata: Metadata = {
  title: "Bubbly - Academic Intelligence Platform",
  description: "Unified Intelligence Academic Layer - Bubbly",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fontVars} suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="YK6Hr3TBqPo3VbkdXhKU-DZqh9qa8S521p_uSRpKI8s" />
        <link rel="icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: SW_INIT_SCRIPT }} />
      </head>
      <body
        className="bg-[var(--background)] text-[var(--text-primary)] min-h-[100dvh] overflow-hidden antialiased"
        style={{ fontFamily: "var(--font-body, var(--font-sans))" }}
      >
        <ThemeProvider>
          <I18nProvider>
            {children}
            <MobileTabBar />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
