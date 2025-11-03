import { useMemo, useState } from "react";
import {
  Plus, Home as HomeIcon, AlertCircle, Trash2, Cloud,
  ChevronRight, ChevronDown, Settings, HelpCircle,
  Upload, Video, Music, FileText, Mic, Image, Layers, Film,
  ShieldAlert
} from "lucide-react";
import "../types/drive-sidebar.css";
import SettingsButton from "./SettingsButton";
import HelpButton from "./HelpButton";

type ItemKey =
  | "home" | "dashboard" | "new-analysis"
  | "text-sentiment" | "audio-sentiment" 
  | "vision-sentiment" | "fused-model" 
  | "max-fusion" | "review-queue" | "trash" 
  | "storage" | "storage-upgrade";

type SidebarItem = {
  key: ItemKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  className?: string;
};

const PRIMARY: SidebarItem[] = [
  { key: "home", label: "Home", icon: HomeIcon },
  { key: "dashboard", label: "Dashboard", icon: HomeIcon },

  { key: "text-sentiment", label: "Text Sentiment", icon: FileText },
  { key: "audio-sentiment", label: "Audio Sentiment", icon: Mic },
  { key: "vision-sentiment", label: "Vision Sentiment", icon: Image },
  { key: "fused-model", label: "Fused Model", icon: Layers },
  { key: "max-fusion", label: "Max Fusion (Video)", icon: Film },

  { key: "review-queue", label: "Review Queue", icon: ShieldAlert, badge: "12" },
  { key: "trash", label: "Trash", icon: Trash2 },

  { key: "storage", label: "Storage", icon: Cloud, badge: "" },
];

export interface DriveLeftSidebarProps {
  active?: ItemKey;
  onChange?: (key: ItemKey) => void;
  usedStorageGB?: number;
  totalStorageGB?: number;
  className?: string;
  onUploadClick?: () => void;
  onRecord?: (mode: 'video' | 'audio') => void;
  onBuyStorage?: () => void;  
}

export default function DriveLeftSidebar({
  active = "home",
  onChange,
  usedStorageGB = 13.39,
  totalStorageGB = 2048,
  className = "",
  onUploadClick,
  onRecord,
  onBuyStorage, 
}: DriveLeftSidebarProps) {
  const [open, setOpen] = useState(true);

  const pct = Math.min(100, Math.round((usedStorageGB / totalStorageGB) * 10000) / 100);
  const storageText = `${usedStorageGB.toLocaleString("vi-VN")} GB trong tổng số ${(totalStorageGB / 1024).toLocaleString("vi-VN")} TB`;

  /** ===== pretty groups ===== */
  const nonStorageItems = useMemo(() => PRIMARY.filter(i => i.key !== "storage"), []);
  const storageItem = useMemo(() => PRIMARY.find(i => i.key === "storage"), []);

  /** ===== item component with glow/indicator ===== */
  const Item = ({ item }: { item: SidebarItem }) => {
    const Icon = item.icon;
    const isActive = active === item.key;

    return (
      <button
        onClick={() => onChange?.(item.key)}
        className={[
          "relative w-full overflow-hidden rounded-xl text-sm px-3 py-2.5",
          "flex items-center gap-3 transition-all duration-300 group",
          isActive
            ? "bg-gradient-to-r from-blue-600/15 via-indigo-600/10 to-purple-600/15 text-blue-300 ring-1 ring-inset ring-blue-500/30"
            : "text-gray-300 hover:text-white hover:bg-white/5"
        ].join(" ")}
      >
        {/* left indicator bar */}
        <span
          className={[
            "absolute left-0 top-0 h-full w-[3px] rounded-r",
            "bg-gradient-to-b from-fuchsia-400 via-purple-400 to-sky-400",
            "transition-transform duration-300",
            isActive ? "scale-y-100" : "scale-y-0 group-hover:scale-y-100"
          ].join(" ")}
          aria-hidden
        />
        {/* soft glow */}
        <span
          className="pointer-events-none absolute -inset-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl
                     bg-[radial-gradient(60px_60px_at_left,theme(colors.sky.500/.15),transparent),
                         radial-gradient(80px_80px_at_right,theme(colors.fuchsia.500/.12),transparent)]"
          aria-hidden
        />
        {/* ripple */}
        <span className="pointer-events-none absolute inset-0 opacity-0 group-active:opacity-100 animate-ripple"
              aria-hidden />

        <Icon className="h-4.5 w-4.5 shrink-0 text-current" />
        <span className="flex-1 text-left">{item.label}</span>

        {item.badge && (
          <span className="px-2 py-0.5 text-[10px] rounded-full bg-white/5 border border-white/10 text-gray-300">
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside
      className={[
        "drive-sidebar relative h-full w-72 min-w-56 max-w-80",
        "bg-[rgba(8,12,28,0.6)] backdrop-blur-xl",
        "border-r border-slate-800/70 px-3 py-3",
        "overflow-hidden", // for particles
        className
      ].join(" ")}
    >
      {/* floating particles (auto) */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="absolute w-1 h-1 bg-white/15 rounded-full animate-float-slow"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 80}%`,
              animationDelay: `${i * 0.25}s`,
              animationDuration: `${8 + (i % 7)}s`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2 items-center">
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-sky-600 text-white
                       hover:from-fuchsia-500 hover:to-sky-500 transition-all shadow-lg shadow-sky-900/20 px-3 py-2
                       ring-1 ring-white/10 hover:ring-white/20"
            onClick={() => onChange?.("new-analysis")}
            aria-label="New Analysis"
          >
            <Plus className="h-4.5 w-4.5" />
            <span className="font-medium">New Analysis</span>
          </button>
        </div>

        <button
          className="md:hidden p-2 rounded-lg hover:bg-white/5 text-gray-300"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Quick actions */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <button
          onClick={() => onUploadClick ? onUploadClick() : onChange?.("text-sentiment")}
          className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs transition-all
                     ring-1 ring-inset ring-white/10 hover:ring-white/20 group"
          title="Upload file"
        >
          <Upload className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
          <span>Upload</span>
        </button>
        <button
          onClick={() => onRecord ? onRecord('video') : onChange?.("max-fusion")}
          className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs transition-all
                     ring-1 ring-inset ring-white/10 hover:ring-white/20 group"
          title="Record video"
        >
          <Video className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span>Video</span>
        </button>
        <button
          onClick={() => onRecord ? onRecord('audio') : onChange?.("audio-sentiment")}
          className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs transition-all
                     ring-1 ring-inset ring-white/10 hover:ring-white/20 group"
          title="Record audio"
        >
          <Music className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
          <span>Audio</span>
        </button>
      </div>

      {/* Menu */}
      <nav className={`${open ? "block" : "hidden md:block"} space-y-1`}>
        {nonStorageItems.map((item) => (
          <Item key={item.key} item={item} />
        ))}

        {/* Storage block */}
        {storageItem && (
          <div className="pt-2 mt-2 border-t border-gray-800/70">
            <Item item={storageItem} />
            <div className="px-3 py-2">
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden ring-1 ring-inset ring-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 via-fuchsia-500 to-purple-500
                             animate-stripes"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-gray-400">{storageText}</div>

              

              <button
                className="sb-btn mt-2 w-full text-center text-sm rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 transition
                           ring-1 ring-inset ring-white/10 hover:ring-white/20"
                onClick={() => (onBuyStorage ? onBuyStorage() : onChange?.("storage"))}
              >
                Mua thêm bộ nhớ
              </button>
            </div>
          </div>
        )}

        {/* Footer actions */}
      <div className="mt-3 flex items-center justify-between px-1 text-gray-400">
        <SettingsButton
          onChange={(s) => console.log("Saved settings:", s)}
          renderTrigger={({ onClick }) => (
            <button
              className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-white/5 transition"
              onClick={onClick}
            >
              <Settings className="h-4.5 w-4.5" />
              <span className="text-sm">Cài đặt</span>
            </button>
          )}
        />

        <HelpButton
          renderTrigger={({ onClick }) => (
            <button
              className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-white/5 transition"
              onClick={onClick}
            >
              <HelpCircle className="w-4 h-4" />
              <span className="text-sm">Trợ giúp</span>
            </button>
          )}
        />
      </div>

      </nav>

      {/* local styles for micro-animations */}
      <style>{`
        .h-4.5 { height: 1.125rem; }
        .w-4.5 { width: 1.125rem; }

        @keyframes floatSlow {
          0%,100% { transform: translateY(0) }
          50% { transform: translateY(-6px) }
        }
        .animate-float-slow { animation: floatSlow 7.5s ease-in-out infinite; }

        @keyframes ripple {
          0% { opacity: .0; }
          30% { opacity: .12; }
          100% { opacity: 0; }
        }
        .animate-ripple {
          background: radial-gradient(120px 120px at var(--mx,50%) var(--my,50%), rgba(255,255,255,.08), transparent 60%);
          animation: ripple .6s ease-out 1;
        }
        /* let ripple follow cursor */
        .group:active .animate-ripple { --mx: 50%; --my: 50%; }

        @keyframes stripes {
          0% { background-position: 0 0; }
          100% { background-position: 40px 0; }
        }
        .animate-stripes {
          background-size: 40px 100%;
          mask-image: linear-gradient(90deg, rgba(0,0,0,.2), rgba(0,0,0,1));
          animation: stripes 1.8s linear infinite;
        }

        @keyframes bgFlow {
          0%,100% { transform: translateY(0) }
          50% { transform: translateY(-10px) }
        }
        .animate-bgflow { animation: bgFlow 10s ease-in-out infinite; }
      `}</style>
    </aside>
  );
}
