"use client";
import { supabase } from "@/lib/supabase";
import { useRef, useState } from "react";

export default function UploadButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  function handleClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(
  event: React.ChangeEvent<HTMLInputElement>
) {
  const file = event.target.files?.[0];

  if (!file) return;

  const fileName = `${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("fotos")
    .upload(fileName, file);

  if (error) {
    console.error(error);
    alert("Upload fehlgeschlagen.");
    return;
  }

  alert("Upload erfolgreich!");
}
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        multiple
      />

      <button
        type="button"
        onClick={handleClick}
        className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700"
      >
        Datei auswählen
      </button>

      <p className="text-sm text-neutral-500">
        {selectedFile ? selectedFile.name : "Keine Datei ausgewählt"}
      </p>
    </div>
  );
}