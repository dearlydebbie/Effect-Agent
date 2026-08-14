import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { productConfig } from "../config/product";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: { default: productConfig.name, template: `%s · ${productConfig.name}` },
  description: productConfig.description,
  icons: { icon: "/og.png", shortcut: "/og.png" },
  openGraph: { title: productConfig.name, description: "From idea to effect.", images: [{ url: "/og.png", width: 1708, height: 904, alt: "Effect Lab. From idea to effect." }] },
  twitter: { card: "summary_large_image", title: productConfig.name, description: "From idea to effect.", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
