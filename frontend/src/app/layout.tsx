import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";

import { TabNav } from "@/components/shell/TabNav";
import { Icon } from "@/components/ui/Icon";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GridFlex",
  description: "Grid-interactive control room for hyperscale AI campuses.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <div className="border-line bg-bg/90 sticky top-0 z-30 border-b backdrop-blur-md">
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6">
            <div className="flex items-center justify-between pt-3.5">
              <Link href="/" className="focus-ring flex items-center gap-2.5 rounded-md">
                <span className="grid size-7 place-items-center rounded-[8px] bg-[oklch(72%_0.08_20)] text-[oklch(25%_0.04_20)]">
                  <Icon name="bolt" size={15} weight={2} />
                </span>
                <span className="text-[15px] font-semibold tracking-tight">GridFlex</span>
              </Link>
              <div className="border-line-strong bg-surface-2 text-ink-2 flex items-center gap-2 rounded-[10px] border py-1 pr-3 pl-1 text-[13px]">
                <span className="bg-surface-4 text-ink-1 grid size-6 place-items-center rounded-[6px] text-[10px] font-semibold">
                  TA
                </span>
                Hyperscaler Ops
              </div>
            </div>
            <TabNav />
          </div>
        </div>
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-16 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
