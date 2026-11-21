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
              <span className="brand-mark">S</span> Stepwise
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
