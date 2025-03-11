import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider, ThemeProvider } from "@/components/providers";
import { Sidebar } from "@/components/sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BPTF Analyzer",
  description: "Track and analyze TF2 item trends from backpack.tf",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <div className="flex h-screen">
              {/* Sidebar - hidden on mobile, fixed width on desktop */}
              <div className="hidden md:block w-64 shrink-0">
                <Sidebar />
              </div>
              
              {/* Mobile sidebar - rendered separately to handle slide-in behavior */}
              <div className="md:hidden">
                <Sidebar />
              </div>
              
              {/* Main content with adjusted padding for mobile */}
              <div className="flex-1 overflow-auto w-full md:w-[calc(100%-16rem)]">
                {children}
              </div>
            </div>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
