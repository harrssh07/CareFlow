import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareFlow — Quarantine Operations",
  description: "Operational coordination for patient monitoring, clinical rounds, discharge clearances, and treatment outcomes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
