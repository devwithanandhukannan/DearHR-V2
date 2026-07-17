"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { X } from "lucide-react";

export type ToastType = "success" | "danger" | "info";

export interface ToastMessage {
  id: string;
  title: string;
  body: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (title: string, body: string, type: ToastType) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((title: string, body: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, body, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const clearAll = () => setToasts([]);

  const getBorderStyles = (type: ToastType) => {
    switch (type) {
      case "success":
        return "border-l-[3px] border-l-emerald-500";
      case "danger":
        return "border-l-[3px] border-l-rose-500";
      case "info":
      default:
        return "border-l-[3px] border-l-blue-500";
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, clearAll }}>
      {children}

      {/* Viewport container fixed to top right */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col items-end gap-2 w-[280px] pointer-events-none">
        
        {/* Tiny Clear All Action */}
        {toasts.length > 1 && (
          <button
            onClick={clearAll}
            className="pointer-events-auto text-[10px] font-medium tracking-wide bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 px-2 py-0.5 rounded border border-zinc-800 transition-colors"
          >
            Clear ({toasts.length})
          </button>
        )}

        {/* Micro-Notification Cards */}
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto relative w-full bg-zinc-900 text-zinc-100 p-2.5 rounded shadow-lg border border-zinc-800/80 transition-all duration-200 animate-in slide-in-from-right-4 ${getBorderStyles(
              toast.type
            )}`}
          >
            {/* Unified Interior Container */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h4 className="text-[11px] font-semibold tracking-wide text-zinc-200 leading-tight">
                  {toast.title}
                </h4>
                <p className="text-[10px] text-zinc-400 font-normal leading-normal mt-0.5 break-words">
                  {toast.body}
                </p>
              </div>

              {/* Securely Bound Close Button */}
              <button
                onClick={() => removeToast(toast.id)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors p-0.5 rounded hover:bg-zinc-800 flex-shrink-0 focus:outline-none"
              >
                <X className="w-3 h-3 stroke-[2.5]" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useGlassToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useGlassToast must be used within a ToastProvider");
  }
  return context;
};