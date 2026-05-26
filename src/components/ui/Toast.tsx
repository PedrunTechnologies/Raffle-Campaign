"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/* ── types ──────────────────────────────────────────────────────────── */

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface Toast {
  id:       string;
  message:  string;
  variant:  ToastVariant;
  duration: number; // ms
}

interface ToastContextValue {
  toasts: Toast[];
  toast:  (message: string, variant?: ToastVariant, duration?: number) => void;
  dismiss:(id: string) => void;
}

/* ── context ────────────────────────────────────────────────────────── */

const ToastContext = createContext<ToastContextValue | null>(null);

/* ── styles ─────────────────────────────────────────────────────────── */

const VARIANT_STYLES: Record<ToastVariant, { bar: string; icon: string; text: string; bg: string; border: string }> = {
  success: {
    bar:    "bg-[var(--forest)]",
    icon:   "✓",
    text:   "text-[var(--forest)]",
    bg:     "bg-[var(--forest)]/5",
    border: "border-[var(--forest)]/20",
  },
  error: {
    bar:    "bg-red-500",
    icon:   "✕",
    text:   "text-red-500",
    bg:     "bg-white/90",
    border: "border-red-500/20",
  },
  warning: {
    bar:    "bg-amber-500",
    icon:   "⚠",
    text:   "text-amber-700",
    bg:     "bg-amber-50",
    border: "border-amber-200",
  },
  info: {
    bar:    "bg-[var(--ink)]",
    icon:   "i",
    text:   "text-[var(--ink)]",
    bg:     "bg-[var(--grey-50)]",
    border: "border-[var(--line)]",
  },
};

/* ── single toast item ──────────────────────────────────────────────── */

function ToastItem({ t, onDismiss }: { t: Toast; onDismiss: (id: string) => void }) {
  const s         = VARIANT_STYLES[t.variant];
  const barRef    = useRef<HTMLDivElement>(null);

  // Animate the progress bar
  useEffect(() => {
    if (!barRef.current) return;
    barRef.current.style.transition = `width ${t.duration}ms linear`;
    barRef.current.style.width      = "0%";
  }, [t.duration]);

  return (
    <div
      className={`
        relative flex w-full max-w-sm items-start gap-3 overflow-hidden
        rounded-2xl border px-4 py-3.5 shadow-md
        animate-in slide-in-from-right-4 fade-in duration-300
        ${s.bg} ${s.border}
      `}
      role="alert"
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 h-full w-1 ${s.bar}`} />

      {/* Icon */}
      <div
        className={`
          mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center
          rounded-full text-[10px] font-bold text-white ${s.bar}
        `}
      >
        {s.icon}
      </div>

      {/* Message */}
      <p className={`flex-1 text-sm font-medium leading-snug ${s.text}`}>
        {t.message}
      </p>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(t.id)}
        className="mt-0.5 shrink-0 text-[var(--mute)] transition-colors hover:text-[var(--ink)]"
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Progress bar */}
      <div
        ref={barRef}
        className={`absolute bottom-0 left-0 h-[2px] w-full transition-none ${s.bar} opacity-30`}
        style={{ width: "100%" }}
      />
    </div>
  );
}

/* ── provider ───────────────────────────────────────────────────────── */

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info", duration = 6000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newToast: Toast = { id, message, variant, duration };

      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}

      {/* Toast portal — fixed bottom-right */}
      <div
        className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} t={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ── hook ───────────────────────────────────────────────────────────── */

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

/* ── convenience helpers (call these anywhere after wrapping with provider) ── */
export const toastSuccess = (msg: string) => {
  // Fallback for non-component contexts — use the hook in components
  console.log("[toast:success]", msg);
};
