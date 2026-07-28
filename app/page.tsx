"use client";
import Hero from "./components/Hero";
import EmptyState from "./components/EmptyState";
import Link from "next/link";
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-8 text-center">
      <Hero />

      <Link
  href="/gallery"
  className="mt-10 rounded-full bg-neutral-900 px-7 py-3 text-sm font-medium text-white transition hover:scale-105"
>
  Fotos entdecken
</Link>
<EmptyState />
    </main>
  );
}