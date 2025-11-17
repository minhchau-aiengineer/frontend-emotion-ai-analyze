// src/features/upload/components/UploadTabs.tsx
import React from "react";
import { tokens } from "../utils/tokens";
import { UploadKind } from "../types/uploadTypes";

type Props = {
  kind: UploadKind;
  onChange: (k: UploadKind) => void;
  onClear: () => void;
};

export const UploadTabs: React.FC<Props> = ({ kind, onChange, onClear }) => {
  return (
    <div className="flex gap-2 mb-4">
      <button
        className={tokens.btn.tab}
        data-active={kind === "image"}
        onClick={() => onChange("image")}
      >
        Image
      </button>
      <button
        className={tokens.btn.tab}
        data-active={kind === "audio"}
        onClick={() => onChange("audio")}
      >
        Audio
      </button>
      <button
        className={tokens.btn.tab}
        data-active={kind === "video"}
        onClick={() => onChange("video")}
      >
        Video
      </button>
      <div className="ml-auto">
        <button className={tokens.btn.icon} onClick={onClear}>
          Clear
        </button>
      </div>
    </div>
  );
};
