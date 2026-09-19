import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Carelink | Connected Healthcare",
  description: "Keep your medical history close, so every care decision feels more personal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jetbrainsMono.variable} font-mono h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f0fff4] text-[#092c20] font-mono">
        {children}
      </body>
    </html>
  );
}
