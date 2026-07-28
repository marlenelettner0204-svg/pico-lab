import { supabase } from "@/lib/supabase";

export default async function GalleryPage() {
  const { data: files, error } = await supabase.storage
    .from("fotos")
    .list();

  if (error) {
    return (
      <main className="min-h-screen bg-stone-50 px-8 py-16">
        <p className="text-red-600">Fehler: {error.message}</p>
      </main>
    );
  }

  const imageFiles = files.filter((file) =>
    /\.(jpg|jpeg|png|webp)$/i.test(file.name)
  );

  return (
    <main className="min-h-screen bg-stone-50 px-8 py-16">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-medium uppercase tracking-widest text-neutral-500">
          Pico Lab
        </p>

       <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
  <div>
    <h1 className="text-5xl font-black tracking-tight">
      Galerie
    </h1>

    <p className="mt-4 text-neutral-500">
      Gefundene Bilder: {imageFiles.length}
    </p>
  </div>

  <button
    type="button"
    className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700"
  >
    Foto hochladen
  </button>
</div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {imageFiles.map((file) => {
            const { data } = supabase.storage
              .from("fotos")
              .getPublicUrl(file.name);

            return (
              <article
                key={file.name}
                className="overflow-hidden rounded-3xl bg-white shadow-sm"
              >
                <img
                  src={data.publicUrl}
                  alt={file.name}
                  className="aspect-[4/5] w-full object-cover"
                />

                <p className="p-4 text-sm font-medium">
                  {file.name}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}