"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const PARALLEL_UPLOADS = 4;
const MAX_RETRIES = 2;
async function createThumbnail(file: File): Promise<Blob> {
  const imageBitmap = await createImageBitmap(file);

  const maxSize = 900;

  const scale = Math.min(
    maxSize / imageBitmap.width,
    maxSize / imageBitmap.height,
    1
  );

  const width = Math.round(imageBitmap.width * scale);
  const height = Math.round(imageBitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Thumbnail konnte nicht erstellt werden.");
  }

  context.drawImage(imageBitmap, 0, 0, width, height);

  imageBitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Thumbnail konnte nicht erstellt werden."));
        }
      },
      "image/jpeg",
      0.82
    );
  });
}
type UploadResult =
  | {
      success: true;
      file: File;
      fileName: string;
    }
  | {
      success: false;
      file: File;
      error: string;
    };

export default function PhotoPicker() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [project, setProject] = useState("");
  const [customer, setCustomer] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");

  const [showProject, setShowProject] = useState(false);
  const [showCustomer, setShowCustomer] = useState(false);
  const [showLocation, setShowLocation] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadSuccessful, setUploadSuccessful] = useState(false);
const [successfulUploadCount, setSuccessfulUploadCount] = useState(0);

  const [completedUploads, setCompletedUploads] = useState(0);
  const [totalUploads, setTotalUploads] = useState(0);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);

    setFiles(selectedFiles);
    setUploadMessage("");
    setCompletedUploads(0);
    setTotalUploads(0);
 setUploadSuccessful(false);
setSuccessfulUploadCount(0);
 }
  async function uploadToStorage(file: File, fileName: string) {
    let lastError = "";

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const { error } = await supabase.storage
        .from("fotos")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (!error) {
        return;
      }

      lastError = error.message;

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, 500 * (attempt + 1))
        );
      }
    }

    throw new Error(lastError || "Unbekannter Uploadfehler");
  }

  async function uploadSingleFile(file: File): Promise<UploadResult> {
    const fileName = `${Date.now()}-${crypto.randomUUID()}-${file.name}`;

    try {
      await uploadToStorage(file, fileName);
console.log("THUMBNAIL START:", file.name);
const thumbnail = await createThumbnail(file);
console.log("THUMBNAIL CREATED:", thumbnail.size, "bytes");
const thumbnailName = `thumbnails/${fileName}.jpg`;

const { error: thumbnailError } = await supabase.storage
  .from("fotos")
  .upload(thumbnailName, thumbnail, {
    contentType: "image/jpeg",
    cacheControl: "3600",
    upsert: false,
  });

if (thumbnailError) {
  console.error(
    `${file.name}: Thumbnail konnte nicht hochgeladen werden – ${thumbnailError.message}`
  );
}

return {
  success: true,
  file,
  fileName,
};
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unbekannter Fehler";

      console.error(`${file.name}:`, message);

      return {
        success: false,
        file,
        error: message,
      };
    }
  }

  async function saveMetadata(
    successfulUploads: Array<{
      file: File;
      fileName: string;
    }>
  ) {
    if (successfulUploads.length === 0) return;

    const rows = successfulUploads.map(({ fileName }) => ({
      file_name: fileName,
      project: project || null,
      customer: customer || null,
      location: location || null,
      event_date: eventDate || null,
    }));

    const { error } = await supabase
      .from("photo_uploads")
      .insert(rows);

    if (!error) {
      return;
    }

    const fileNames = successfulUploads.map(
      ({ fileName }) => fileName
    );

    await supabase.storage
      .from("fotos")
      .remove(fileNames);

    throw new Error(error.message);
  }

  async function handleUpload() {
    if (files.length === 0 || uploading) return;

    const filesToUpload = [...files];

    setUploading(true);
    setUploadMessage("");
    setCompletedUploads(0);
    setTotalUploads(filesToUpload.length);

    const results: UploadResult[] = [];

    let nextFileIndex = 0;

    async function worker() {
      while (true) {
        const currentIndex = nextFileIndex;
        nextFileIndex += 1;

        if (currentIndex >= filesToUpload.length) {
          return;
        }

        const file = filesToUpload[currentIndex];

        const result = await uploadSingleFile(file);

        results.push(result);

        setCompletedUploads((current) => current + 1);
      }
    }

    const workerCount = Math.min(
      PARALLEL_UPLOADS,
      filesToUpload.length
    );

    const workers = Array.from(
      { length: workerCount },
      () => worker()
    );

    await Promise.all(workers);

    const successfulUploads = results.filter(
      (
        result
      ): result is Extract<UploadResult, { success: true }> =>
        result.success
    );

    const failedUploads = results.filter(
      (
        result
      ): result is Extract<UploadResult, { success: false }> =>
        !result.success
    );

    try {
      await saveMetadata(successfulUploads);
    } catch (error) {
      console.error("Metadata error:", error);

      setFiles(filesToUpload);

      const message =
        error instanceof Error
          ? error.message
          : "Unbekannter Datenbankfehler";

      setUploadMessage(
        `Die Fotos konnten nicht vollständig gespeichert werden: ${message}`
      );

      setUploading(false);
      return;
    }

    const failedFiles = failedUploads.map(
      (result) => result.file
    );

    setFiles(failedFiles);
    setUploading(false);

    if (failedUploads.length === 0) {
  setSuccessfulUploadCount(successfulUploads.length);
  setUploadSuccessful(true);
  setUploadMessage("");

  return;
}

    setUploadMessage(
      `${successfulUploads.length} von ${filesToUpload.length} Fotos erfolgreich hochgeladen. ` +
        `${failedUploads.length} ${
          failedUploads.length === 1
            ? "Foto ist"
            : "Fotos sind"
        } fehlgeschlagen. Bitte erneut versuchen.`
    );

    console.error(
      "Fehlgeschlagene Uploads:",
      failedUploads
    );
  }

  const uploadProgress =
    totalUploads > 0
      ? Math.round(
          (completedUploads / totalUploads) * 100
        )
      : 0;

  return (
    <div className="mt-6">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="rounded-full bg-neutral-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Fotos auswählen
      </button>

      {uploadMessage && (
        <p className="mt-4 text-sm text-neutral-600">
          {uploadMessage}
        </p>
      )}
{uploadSuccessful && (
  <div className="mt-10 flex flex-col items-center rounded-3xl bg-white px-6 py-10 text-center shadow-sm">
<div className="success-check-circle">
  <svg
    viewBox="0 0 52 52"
    className="success-check-svg"
    aria-hidden="true"
  >
    <circle
      cx="26"
      cy="26"
      r="24"
      className="success-check-circle-line"
    />

    <path
      d="M15 27 L23 35 L38 18"
      className="success-check-path"
    />
  </svg>
</div>

    <h2 className="mt-6 text-2xl font-bold tracking-tight">
      Upload successful
    </h2>

    <p className="mt-2 text-sm text-neutral-500">
      {successfulUploadCount === 1
        ? "1 photo has been added to Pico."
        : `${successfulUploadCount} photos have been added to Pico.`}
    </p>

    <Link
      href="/search"
      className="mt-7 rounded-full bg-neutral-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700"
    >
      View Gallery
    </Link>
  </div>
)}
      {files.length > 0 && (
        <div className="mt-10">
          <p className="mb-4 text-sm text-neutral-500">
            {files.length}{" "}
            {files.length === 1
              ? "Foto ausgewählt"
              : "Fotos ausgewählt"}
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="aspect-square overflow-hidden rounded-2xl bg-neutral-100"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>

          <div className="mt-12 border-t border-neutral-200 pt-10 text-left">
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowProject(!showProject)}
                disabled={uploading}
                className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium transition hover:border-neutral-400 disabled:opacity-50"
              >
                + Project
              </button>

              <button
                type="button"
                onClick={() => setShowCustomer(!showCustomer)}
                disabled={uploading}
                className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium transition hover:border-neutral-400 disabled:opacity-50"
              >
                + Customer
              </button>

              <button
                type="button"
                onClick={() => setShowLocation(!showLocation)}
                disabled={uploading}
                className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium transition hover:border-neutral-400 disabled:opacity-50"
              >
                + Location
              </button>
            </div>

            {showProject && (
              <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4">
                <label className="mb-2 block text-sm font-semibold">
                  Project
                </label>

                <input
                  type="text"
                  value={project}
                  disabled={uploading}
                  onChange={(event) =>
                    setProject(event.target.value)
                  }
                  placeholder="z. B. Opernball 2027"
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-neutral-500 disabled:opacity-50"
                />

                {project && (
                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-semibold">
                      Eventdatum
                    </label>

                    <input
                      type="date"
                      value={eventDate}
                      disabled={uploading}
                      onChange={(event) =>
                        setEventDate(event.target.value)
                      }
                      className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-neutral-500 disabled:opacity-50"
                    />
                  </div>
                )}
              </div>
            )}

            {showCustomer && (
              <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
                <label className="mb-2 block text-sm font-semibold">
                  Customer
                </label>

                <input
                  type="text"
                  value={customer}
                  disabled={uploading}
                  onChange={(event) =>
                    setCustomer(event.target.value)
                  }
                  placeholder="z. B. Wiener Staatsoper"
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-neutral-500 disabled:opacity-50"
                />
              </div>
            )}

            {showLocation && (
              <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
                <label className="mb-2 block text-sm font-semibold">
                  Location
                </label>

                <input
                  type="text"
                  value={location}
                  disabled={uploading}
                  onChange={(event) =>
                    setLocation(event.target.value)
                  }
                  placeholder="z. B. Hofburg Wien"
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-neutral-500 disabled:opacity-50"
                />
              </div>
            )}

            <div className="mt-12 rounded-3xl bg-neutral-100 p-6">
              <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
                Übersicht
              </p>

              <div className="mt-5 space-y-2 text-sm">
                <p>
                  <strong>Fotos:</strong> {files.length}
                </p>

                {project && (
                  <p>
                    <strong>Project:</strong> {project}
                  </p>
                )}

                {eventDate && (
                  <p>
                    <strong>Eventdatum:</strong> {eventDate}
                  </p>
                )}

                {customer && (
                  <p>
                    <strong>Customer:</strong> {customer}
                  </p>
                )}

                {location && (
                  <p>
                    <strong>Location:</strong> {location}
                  </p>
                )}

                <p>
                  <strong>Upload by:</strong> Marlene
                </p>
              </div>

              {uploading && (
                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      Uploading {completedUploads} / {totalUploads}
                    </span>

                    <span className="text-neutral-500">
                      {uploadProgress}%
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-200">
                    <div
                      className="h-full rounded-full bg-neutral-900 transition-all duration-300"
                      style={{
                        width: `${uploadProgress}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="mt-6 w-full rounded-full bg-neutral-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading
                  ? `Uploading ${completedUploads} / ${totalUploads}`
                  : `${files.length} ${
                      files.length === 1
                        ? "Foto"
                        : "Fotos"
                    } hochladen`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}