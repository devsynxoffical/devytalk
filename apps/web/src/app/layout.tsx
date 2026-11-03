import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Header } from "@/components/layout-header";
import { Footer } from "@/components/layout-footer";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "DevyTalk — Cloud phone system & AI call center", template: "%s · DevyTalk" },
  description:
    "DevyTalk is the cloud phone system for sales and support teams: power dialers, smart routing, IVR, call recording, analytics and AI voice agents in one platform.",
  openGraph: { siteName: "DevyTalk", type: "website" },
};

export const viewport: Viewport = { themeColor: "#0b1324" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
