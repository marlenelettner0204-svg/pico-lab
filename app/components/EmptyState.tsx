export default function EmptyState() {
  return (
    <div className="mt-20 flex flex-col items-center">
      <p className="text-5xl">📷</p>

      <h2 className="mt-4 text-2xl font-bold">
        Keine Fotos vorhanden
      </h2>

      <p className="mt-2 text-neutral-500">
        Lade dein erstes Bild hoch.
      </p>
    </div>
  );
}