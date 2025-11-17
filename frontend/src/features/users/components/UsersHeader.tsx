import React from "react";
import { Users } from "lucide-react"; // ✅ thêm icon phù hợp
import { KEYFRAMES } from "../utils/keyframes";

type UsersHeaderProps = {
  title?: string;
  subtitle?: string;
};

export const UsersHeader: React.FC<UsersHeaderProps> = ({
  title = "Users Management",
  subtitle = "Quản lý tài khoản & phân quyền trong hệ thống.",
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 mb-6">
      {/* inject keyframes */}
      <style>{KEYFRAMES}</style>

      {/* moving gradient bg */}
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background:
            "linear-gradient(90deg,#6366f1,#8b5cf6,#0ea5e9,#6366f1,#6366f1)",
          backgroundSize: "280% 100%",
          animation: "moveX 16s linear infinite",
        }}
      />
      {/* dark overlay */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]" />

      {/* dots */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/30"
            style={{
              left: `${(i * 53) % 100}%`,
              top: `${(i * 37) % 100}%`,
              opacity: 0.35,
              animation: `floatDot ${6 + (i % 5)}s ease-in-out ${
                i * 0.25
              }s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative px-6 py-7 md:px-10 md:py-9 flex items-center gap-4">
        {/* ✅ icon mới */}
        <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 grid place-items-center text-violet-200">
          <Users className="w-6 h-6" />
        </div>

        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-50">
            {title}
          </h1>
          <p className="text-slate-100/80 text-sm md:text-base">{subtitle}</p>
        </div>

        {/* badges desktop */}
        <div className="hidden md:flex items-center gap-2 ml-auto">
          <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-slate-50">
            Glow UI
          </span>
          <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-slate-50">
            Admin-ready
          </span>
        </div>
      </div>

      {/* bottom line */}
      <div className="relative h-[3px] rounded-b-2xl overflow-hidden">
        <div
          className="absolute top-0 h-[3px] w-[35%] rounded-full"
          style={{
            background: "linear-gradient(90deg,#22d3ee,#a855f7,#22d3ee)",
            animation: "runLine 8s linear infinite",
          }}
        />
      </div>
    </div>
  );
};
