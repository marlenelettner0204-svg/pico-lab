"use client";

import { useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type UploadMeta = {
  file_name: string;
  project: string | null;
  customer: string | null;
  location: string | null;
  event_date: string | null;
};

type SearchImage = {
  fileName: string;
  publicUrl: string;
  thumbnailUrl: string;
  metadata?: UploadMeta;
};

const LONG_PRESS_MS = 550;

export default function SearchGallery({
  images,
}: {
  images: SearchImage[];
}) {
  const [query, setQuery] = useState("");
  const [libraryImages, setLibraryImages] = useState(images);

  const [selectedImage, setSelectedImage] =
    useState<SearchImage | null>(null);

  const [selectedFileNames, setSelectedFileNames] = useState<Set<string>>(
    new Set()
  );

  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const filteredImages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return libraryImages;

    return libraryImages.filter((image) => {
      const searchableText = [
        image.fileName,
        image.metadata?.project,
        image.metadata?.customer,
        image.metadata?.location,
        image.metadata?.event_date,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [libraryImages, query]);

  const selectionMode = selectedFileNames.size > 0;

  function toggleSelection(fileName: string) {
    setSelectedFileNames((current) => {
      const next = new Set(current);

      if (next.has(fileName)) {
        next.delete(fileName);
      } else {
        next.add(fileName);
      }

      return next;
    });

    setDeleteMessage("");
  }

  function clearSelection() {
    setSelectedFileNames(new Set());
    setShowDeleteConfirm(false);
    setDeleteMessage("");
  }

  function handleImageClick(
    event: React.MouseEvent<HTMLButtonElement>,
    image: SearchImage
  ) {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }

    const multiSelectKey = event.metaKey || event.ctrlKey;

    if (multiSelectKey || selectionMode) {
      toggleSelection(image.fileName);
      return;
    }

    setSelectedImage(image);
  }

  function startLongPress(image: SearchImage) {
    longPressTriggered.current = false;

    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      toggleSelection(image.fileName);
    }, LONG_PRESS_MS);
  }

  function cancelLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  async function deleteSelectedPhotos() {
    if (selectedFileNames.size === 0 || deleting) return;

    setDeleting(true);
    setDeleteMessage("");

    const fileNames = Array.from(selectedFileNames);

    const thumbnailNames = fileNames.map(
  (fileName) => `thumbnails/${fileName}.jpg`
);

const { error: storageError } = await supabase.storage
  .from("fotos")
  .remove([...fileNames, ...thumbnailNames]);
    if (storageError) {
      console.error(storageError);

      setDeleteMessage(
        `Fotos konnten nicht gelöscht werden: ${storageError.message}`
      );

      setDeleting(false);
      setShowDeleteConfirm(false);
      return;
    }

    const { error: databaseError } = await supabase
      .from("photo_uploads")
      .delete()
      .in("file_name", fileNames);

    if (databaseError) {
      console.error(databaseError);

      setDeleteMessage(
        `Fotos wurden aus dem Storage gelöscht, aber die Daten konnten nicht vollständig entfernt werden: ${databaseError.message}`
      );

      setDeleting(false);
      setShowDeleteConfirm(false);
      return;
    }

    setLibraryImages((current) =>
      current.filter((image) => !selectedFileNames.has(image.fileName))
    );

    if (
      selectedImage &&
      selectedFileNames.has(selectedImage.fileName)
    ) {
      setSelectedImage(null);
    }

    const deletedCount = fileNames.length;

    setSelectedFileNames(new Set());
    setShowDeleteConfirm(false);
    setDeleting(false);

    setDeleteMessage(
      deletedCount === 1
        ? "Foto gelöscht."
        : `${deletedCount} Fotos gelöscht.`
    );
  }

  return (
    <>
      <div className="mt-10">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search"
          className="w-full rounded-3xl border border-neutral-200 bg-white px-6 py-5 text-lg outline-none transition focus:border-neutral-500"
        />
      </div>

      {selectionMode && (
        <div className="mt-6 flex items-center justify-between rounded-2xl bg-neutral-900 px-5 py-4 text-white">
          <div>
            <p className="text-sm font-semibold">
              {selectedFileNames.size}{" "}
              {selectedFileNames.size === 1 ? "selected" : "selected"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={clearSelection}
              disabled={deleting}
              className="text-sm font-medium text-neutral-300 transition hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-200 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {deleteMessage && (
        <p className="mt-4 text-sm text-neutral-500">
          {deleteMessage}
        </p>
      )}

      <div className="mt-14 border-t border-neutral-200 pt-10">
        <p className="mb-6 text-sm font-medium uppercase tracking-widest text-neutral-500">
          {filteredImages.length}{" "}
          {filteredImages.length === 1 ? "Bild" : "Bilder"}
        </p>

       <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
          {filteredImages.map((image) => {
            const isSelected = selectedFileNames.has(image.fileName);

            return (
              <button
                key={image.fileName}
                type="button"
                onClick={(event) => handleImageClick(event, image)}
                onTouchStart={() => startLongPress(image)}
                onTouchEnd={cancelLongPress}
                onTouchCancel={cancelLongPress}
                onTouchMove={cancelLongPress}
                className={`group relative mb-3 w-full break-inside-avoid overflow-hidden rounded-3xl bg-white text-left shadow-sm transition ${
                  isSelected
                    ? "ring-4 ring-neutral-900"
                    : "hover:-translate-y-1 hover:shadow-lg"
                }`}
              >
              <img
  src={image.thumbnailUrl}
  alt={image.fileName}
  loading="eager"
  decoding="async"
  fetchPriority="high"
className="h-auto w-full object-cover transition duration-300 group-hover:scale-[1.02]"/>

                {isSelected && (
                  <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white shadow">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {filteredImages.length === 0 && (
          <p className="text-neutral-500">
            Keine passenden Bilder gefunden.
          </p>
        )}
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-md transition hover:bg-neutral-100"
              aria-label="Schließen"
            >
              ×
            </button>

            <div className="grid gap-8 md:grid-cols-[1.4fr_0.6fr]">
              <div className="overflow-hidden rounded-2xl bg-neutral-100">
                <img
                  src={selectedImage.publicUrl}
                  alt={selectedImage.fileName}
                  className="max-h-[80vh] w-full object-contain"
                />
              </div>

              <div className="py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
                  Photo details
                </p>

                <div className="mt-8 space-y-6">
                  {selectedImage.metadata?.project && (
                    <div>
                      <p className="text-xs uppercase tracking-widest text-neutral-400">
                        Project
                      </p>
                      <p className="mt-1 font-semibold">
                        {selectedImage.metadata.project}
                      </p>
                    </div>
                  )}

                  {selectedImage.metadata?.customer && (
                    <div>
                      <p className="text-xs uppercase tracking-widest text-neutral-400">
                        Customer
                      </p>
                      <p className="mt-1 font-semibold">
                        {selectedImage.metadata.customer}
                      </p>
                    </div>
                  )}

                  {selectedImage.metadata?.location && (
                    <div>
                      <p className="text-xs uppercase tracking-widest text-neutral-400">
                        Location
                      </p>
                      <p className="mt-1 font-semibold">
                        {selectedImage.metadata.location}
                      </p>
                    </div>
                  )}

                  {selectedImage.metadata?.event_date && (
                    <div>
                      <p className="text-xs uppercase tracking-widest text-neutral-400">
                        Event date
                      </p>
                      <p className="mt-1 font-semibold">
                        {selectedImage.metadata.event_date}
                      </p>
                    </div>
                  )}

                  {!selectedImage.metadata?.project &&
                    !selectedImage.metadata?.customer &&
                    !selectedImage.metadata?.location &&
                    !selectedImage.metadata?.event_date && (
                      <p className="text-sm text-neutral-400">
                        No additional details.
                      </p>
                    )}
                </div>

                <div className="mt-10 border-t border-neutral-200 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setSelectedFileNames(
                        new Set([selectedImage.fileName])
                      );
                      setShowDeleteConfirm(true);
                    }}
                    className="text-sm font-semibold text-red-600 transition hover:text-red-700"
                  >
                    Delete photo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
            <h2 className="text-2xl font-bold tracking-tight">
              {selectedFileNames.size === 1
                ? "Delete this photo?"
                : `Delete ${selectedFileNames.size} photos?`}
            </h2>

            <p className="mt-3 text-sm leading-6 text-neutral-500">
              This action cannot be undone.
            </p>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-semibold transition hover:bg-neutral-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={deleteSelectedPhotos}
                disabled={deleting}
                className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting
                  ? "Deleting..."
                  : selectedFileNames.size === 1
                  ? "Delete photo"
                  : `Delete ${selectedFileNames.size} photos`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}