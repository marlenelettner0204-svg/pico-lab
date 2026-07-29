import Hero from "./components/Hero";
import EmptyState from "./components/EmptyState";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: files } = await supabase.storage
    .from("fotos")
    .list();

  const imageFiles =
    files?.filter((file) =>
      /\.(jpg|jpeg|png|webp)$/i.test(file.name)
    ) ?? [];

  const hasPhotos = imageFiles.length > 0;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-8">
      <Hero />

      <Link
        href="/gallery"
        className="mt-10 rounded-full bg-neutral-900 px-7 py-3 text-sm font-medium text-white transition hover:bg-neutral-700"
      >
        Fotos entdecken
      </Link>

      {!hasPhotos && <EmptyState />}
    </main>
  );
}