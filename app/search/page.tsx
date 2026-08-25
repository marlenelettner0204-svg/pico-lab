import Link from "next/link";
import { supabase } from "@/lib/supabase";
import SearchGallery from "../components/SearchGallery";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const { data: files } = await supabase.storage
    .from("fotos")
    .list();

  const { data: uploads } = await supabase
    .from("photo_uploads")
    .select("file_name, project, customer, location, event_date");

  const imageFiles =
    files?.filter((file) =>
      /\.(jpg|jpeg|png|webp)$/i.test(file.name)
    ) ?? [];

  const images = imageFiles.map((file) => {
    const { data: originalData } = supabase.storage
      .from("fotos")
      .getPublicUrl(file.name);

    const { data: thumbnailData } = supabase.storage
      .from("fotos")
      .getPublicUrl(`thumbnails/${file.name}.jpg`);

    const metadata = uploads?.find(
      (upload) => upload.file_name === file.name
    );

    return {
      fileName: file.name,
      publicUrl: originalData.publicUrl,
      thumbnailUrl: thumbnailData.publicUrl,
      metadata,
    };
  });

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
        >
          ← Zurück
        </Link>

        <div className="mt-12">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-neutral-500">
            Pico Lab
          </p>

          <h1 className="mt-4 text-5xl font-black tracking-tight">
            Fotos suchen
          </h1>

          <p className="mt-4 max-w-xl text-lg leading-8 text-neutral-500">
            Finde Bilder über Projekte, Kunden, Locations oder visuelle Merkmale.
          </p>
        </div>

        <SearchGallery images={images} />
      </div>
    </main>
  );
}