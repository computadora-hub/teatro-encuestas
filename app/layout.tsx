import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Teatro Encuestas",
  description: "Sistema de votación para eventos de teatro",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
