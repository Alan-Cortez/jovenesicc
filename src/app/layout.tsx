import { Inter } from "next/font/google";
import "./globals.css";
import { cookies } from 'next/headers';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "JÓVENES CON TODO",
  description: "Plataforma oficial para Jóvenes CON TODO",
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
      <body className={`${inter.className} ${theme === 'light' ? 'theme-light' : ''}`}>{children}</body>
    </html>
  );
}
