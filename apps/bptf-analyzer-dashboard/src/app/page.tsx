"use client";
import { TrendingItemsList } from "@/components/trending-items-list";

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen p-4 pb-16 md:p-8 md:pb-20 gap-8 md:gap-16 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-6 md:gap-8 items-center w-full max-w-5xl">
        <div className="text-center pt-10 md:pt-4">
          <h1 className="text-2xl md:text-3xl lg:text-4xl">Trending Items on BPTF 📊</h1>
          <p className="text-xs md:text-sm text-zinc-500 mt-1 md:mt-2">(within the last 6 hours - fresh data will take around half a minute to retrieve)</p>
        </div>
        <TrendingItemsList />
      </main>
      <footer className="flex gap-4 md:gap-6 flex-wrap items-center justify-center mt-4">
        <span className="text-xs md:text-sm text-zinc-500">Data refreshes automatically</span>
      </footer>
    </div>
  );
}
