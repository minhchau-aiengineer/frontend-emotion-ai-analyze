// src/features/upload/components/UploadDropzone.tsx
import React from "react";
import { UploadKind } from "../types/uploadTypes";

type Props = {
  kind: UploadKind;
  onPick: (f: File) => void;
  file?: File | null;
};

const acceptMap: Record<UploadKind, string> = {
  image: "image/*",
  audio: "audio/*",
  video: "video/*",
};

const labelMap: Record<UploadKind, string> = {
  image: "Drop image here or click to browse",
  audio: "Drop audio here or click to browse",
  video: "Drop video here or click to browse",
};

const hintMap: Record<UploadKind, string> = {
  image: "PNG, JPG, JPEG, BMP, TIFF • up to 25MB",
  audio: "MP3, WAV, OGG • up to 50MB",
  video: "MP4, MOV, WEBM • up to 200MB",
};

export const UploadDropzone: React.FC<Props> = ({ kind, onPick, file }) => {
  return (
    <label className="block">
      <div className="w-full border-2 border-dashed border-sky-500/40 hover:border-sky-400/70 transition-colors rounded-2xl bg-slate-900/40 p-6 text-center cursor-pointer">
        <div className="text-sky-200 font-medium">{labelMap[kind]}</div>
        <div className="mt-1 text-sm text-slate-400">{hintMap[kind]}</div>
        <input
          type="file"
          accept={acceptMap[kind]}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f);
          }}
        />
      </div>
      {file && (
        <div className="mt-3 text-sm text-slate-300">
          Selected: {file.name} • {(file.size / 1024).toFixed(1)} KB
        </div>
      )}
    </label>
  );
};
