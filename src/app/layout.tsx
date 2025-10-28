import { Outfit } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import {Metadata} from "next";

const outfit = Outfit({
  subsets: ["latin"],
});

// 🔹 Global metadata
export const metadata: Metadata = {
    title: {
        default: "Ciyex",
        template: "Ciyex | %s",
    },
    description: "Ciyex Admin Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
