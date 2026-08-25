import Link from "next/link";
import PhotoPicker from "../components/PhotoPicker";

export default function UploadPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
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
            Fotos hochladen
          </h1>

          <p className="mt-4 max-w-xl text-lg leading-8 text-neutral-500">
            Füge neue Arbeiten, Projekte und visuelle Notizen zu deiner Bibliothek hinzu.
          </p>
        </div>

        <div className="mt-12 rounded-3xl border border-dashed border-neutral-300 bg-white p-12 text-center">
          <p className="text-xl font-semibold">
            Fotos hier ablegen
          </p>

          <p className="mt-2 text-sm text-neutral-500">
            oder vom Gerät auswählen
          </p>

          <PhotoPicker />
        </div>
      </div>
    </main>
  );
}