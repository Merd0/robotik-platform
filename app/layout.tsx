import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Robotik Öğrenme Platformu",
  description:
    "Robotiği tarayıcıda oynayarak öğreten, ortaokuldan mühendis seviyesine kadar kademeli ilerleyen, açık ve ücretsiz bir Türkçe kaynak.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
