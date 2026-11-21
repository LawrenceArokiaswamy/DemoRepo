import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stepwise — learn anything, to real mastery",
  description: "An adaptive learning platform that measures what you know, teaches one step at a time, and tracks mastery of every concept.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <div className="container">
            <Link href="/" className="brand">
              <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
                <defs>
                  <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="var(--neuron-a)" />
                    <stop offset="1" stopColor="var(--neuron-b)" />
                  </linearGradient>
                </defs>
                <path d="M5 20 L13 6 L21 15" fill="none" stroke="url(#lg)" strokeWidth="1.6" />
                <circle cx="5" cy="20" r="2.6" fill="var(--neuron-b)" />
                <circle cx="13" cy="6" r="3.4" fill="url(#lg)" />
                <circle cx="21" cy="15" r="2.6" fill="var(--neuron-a)" />
              </svg>
              Stepwise
            </Link>
            <nav className="nav">
              <Link href="/">Courses</Link>
              <Link href="/#how">How it works</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
