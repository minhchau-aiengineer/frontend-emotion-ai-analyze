// src/features/upload/utils/tokens.ts
export const cx = (...a: Array<string | false | null | undefined>) =>
  a.filter(Boolean).join(" ");

export const tokens = {
  card:
    "rounded-2xl bg-slate-800/60 backdrop-blur-md border border-white/10 shadow-xl transition-shadow duration-300 hover:shadow-sky-900/20 hover:shadow-xl animate-[fadeIn_.42s_ease]",
  btn: {
    primary:
      "inline-flex items-center gap-2 px-4 h-11 rounded-xl bg-gradient-to-r from-sky-500 to-fuchsia-500 hover:from-sky-400 hover:to-fuchsia-400 text-white font-medium shadow-lg shadow-sky-900/20 disabled:opacity-60 disabled:pointer-events-none",
    tab:
      "px-4 h-10 rounded-xl font-medium border border-white/10 data-[active=true]:bg-sky-500/20 data-[active=true]:text-sky-200 hover:bg-white/5 text-slate-200",
    subtle:
      "px-3 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 disabled:opacity-40",
    icon:
      "inline-flex items-center gap-2 px-3 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200",
  },
};
