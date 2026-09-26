import { Inter } from "next/font/google";
import "./globals.css";
import { cookies } from 'next/headers';
import PwaRegister from "@/components/PwaRegister";
import { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JÓVENES CON TODO",
  description: "Plataforma oficial para Jóvenes CON TODO",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "Jóvenes ICC",
  },
};

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const theme = cookieStore.get('theme')?.value || 'dark';

  return (
    <html lang="es">
      <body className={`${inter.className} ${theme === 'light' ? 'theme-light' : ''}`}>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
