import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SafeBus Chennai — Bus-Reservation Scam Prevention (STA-TN)",
  description: "Official omnibus verification and scam monitoring platform protecting South Chennai (Kilambakkam KCBT, Tambaram, Perungalathur, Guindy) passengers from fake ticketing portals, scalping, and counterfeit tickets.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SafeBus Chennai",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#183264",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#F5F7FB] text-[#183264] overflow-x-hidden w-full max-w-full">
        {children}
      </body>
    </html>
  );
}
