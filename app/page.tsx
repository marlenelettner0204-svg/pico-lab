import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-50 px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col justify-center">
        <div className="mb-12 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-neutral-500">
            Pico Lab
          </p>

          <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">
            Keep what matters.
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-neutral-500 sm:text-lg">
            Finde bestehende Bilder oder füge neue Arbeiten zu deiner Bibliothek hinzu.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href="/search"
            className="group rounded-3xl border border-neutral-200 bg-white p-8 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-sm font-medium uppercase tracking-widest text-neutral-400">
              01
            </p>

            <h2 className="mt-8 text-3xl font-bold tracking-tight">
              Fotos suchen
            </h2>

            <p className="mt-3 max-w-sm text-neutral-500">
              Durchsuche deine Bibliothek nach Projekten, Motiven, Farben und mehr.
            </p>

            <p className="mt-8 text-sm font-semibold">
              Zur Bibliothek →
            </p>
          </Link>

          <Link
            href="/upload"
            className="group rounded-3xl bg-neutral-900 p-8 text-white transition hover:-translate-y-1 hover:bg-neutral-800 hover:shadow-lg"
          >
            <p className="text-sm font-medium uppercase tracking-widest text-neutral-400">
              02
            </p>

            <h2 className="mt-8 text-3xl font-bold tracking-tight">
              Fotos hochladen
            </h2>

            <p className="mt-3 max-w-sm text-neutral-300">
              Füge neue Bilder zu Pico Lab hinzu und ordne sie später automatisch ein.
            </p>

            <p className="mt-8 text-sm font-semibold">
              Upload starten →
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
