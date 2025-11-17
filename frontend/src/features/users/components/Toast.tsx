// users/components/Toast.tsx
import React from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
}

export const Toast: React.FC<ToastProps> = ({ message, type = "success" }) => {
  return (
    <div
      className={`px-4 py-2 rounded-xl shadow-lg text-sm flex items-center gap-2 ${
        type === "success"
          ? "bg-emerald-500 text-white"
          : "bg-rose-500 text-white"
      } animate-[fadeIn_.15s_ease-out]`}
    >
      <span>{message}</span>
    </div>
  );
};
