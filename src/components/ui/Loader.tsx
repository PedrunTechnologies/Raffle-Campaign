/**
 * Loader components — three variants, one import.
 *
 * Usage:
 *   import { Spinner, PageLoader, TableLoader } from "@/components/ui/Loader";
 *
 *   // Button loading state
 *   <Spinner size={16} color="white" />
 *
 *   // Full-page loading (replaces screen content while fetching)
 *   if (loading) return <PageLoader />;
 *
 *   // Table skeleton (replaces a Panel/table while rows are loading)
 *   <TableLoader rows={5} cols={4} />
 */

/* ── Spinner ────────────────────────────────────────────────────────────
   Lightweight inline spinner — used inside buttons and small contexts.
──────────────────────────────────────────────────────────────────────── */

interface SpinnerProps {
  /** Diameter in px. Default 18. */
  size?:  number;
  /** CSS colour value. Defaults to currentColor so it inherits text colour. */
  color?: string;
  /** Extra Tailwind classes */
  className?: string;
}

export function Spinner({ size = 18, color = "currentColor", className = "" }: SpinnerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin shrink-0 ${className}`}
      aria-hidden="true"
    >
      {/* Track */}
      <circle
        cx="12" cy="12" r="10"
        stroke={color}
        strokeWidth="3"
        strokeOpacity="0.2"
      />
      {/* Head */}
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ── PageLoader ─────────────────────────────────────────────────────────
   Full-height centred loader — swap in for page content while fetching.
──────────────────────────────────────────────────────────────────────── */

interface PageLoaderProps {
  /** Optional message shown below the spinner */
  message?: string;
  /** Use min-h-screen (default) or min-h-[50vh] for sub-section loaders */
  fullPage?: boolean;
}

export function PageLoader({ message, fullPage = true }: PageLoaderProps) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center gap-4
        ${fullPage ? "min-h-screen" : "min-h-[50vh]"}
      `}
      role="status"
      aria-label={message ?? "Loading"}
    >
      {/* Pulsing logo mark */}
      <div className="relative">
        {/* Outer ring — slow pulse */}
        <div
          className="absolute inset-0 rounded-full opacity-20 animate-ping"
          style={{ background: "var(--blue)", animationDuration: "1.4s" }}
        />
        {/* Inner circle */}
        <div
          className="relative flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: "var(--blue-soft)" }}
        >
          <Spinner size={26} color="var(--blue)" />
        </div>
      </div>

      {message && (
        <p className="text-sm font-medium" style={{ color: "var(--ink-soft)" }}>
          {message}
        </p>
      )}
    </div>
  );
}

/* ── TableLoader ────────────────────────────────────────────────────────
   Skeleton placeholder that mimics a table — drop inside a Panel while
   data is loading so layout doesn't jump.
──────────────────────────────────────────────────────────────────────── */

interface TableLoaderProps {
  /** Number of skeleton rows. Default 5. */
  rows?: number;
  /** Number of skeleton columns. Default 4. */
  cols?: number;
  /** Show a header skeleton row. Default true. */
  showHeader?: boolean;
}

export function TableLoader({ rows = 5, cols = 4, showHeader = true }: TableLoaderProps) {
  /* Width pattern — cycles through so columns look varied */
  const widths = ["w-24", "w-32", "w-20", "w-28", "w-16", "w-36", "w-24", "w-20"];

  return (
    <div className="overflow-hidden w-full" role="status" aria-label="Loading table">
      {/* Header row */}
      {showHeader && (
        <div
          className="flex justify-between gap-4 border-b px-4 py-3"
          style={{
            borderColor: "var(--line)",
            background:  "var(--grey-50)",
          }}
        >
          {Array.from({ length: cols }).map((_, i) => (
            <div
              key={i}
              className={`h-3 animate-pulse rounded-full ${widths[(i * 2) % widths.length]}`}
              style={{ background: "var(--grey-200)" }}
            />
          ))}
        </div>
      )}

      {/* Data rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex justify-between items-center gap-4 border-b px-4 py-4 last:border-0"
          style={{
            borderColor:      "var(--line)",
            animationDelay:   `${rowIdx * 60}ms`,
          }}
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <div
              key={colIdx}
              className={`
                h-3.5 animate-pulse rounded-full
                ${widths[(rowIdx + colIdx) % widths.length]}
              `}
              style={{
                background:     "var(--grey-100)",
                animationDelay: `${(rowIdx * cols + colIdx) * 40}ms`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── CardLoader ─────────────────────────────────────────────────────────
   Skeleton for a single stat / KPI card.
──────────────────────────────────────────────────────────────────────── */

export function CardLoader({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid gap-3 grid-cols-2 lg:grid-cols-${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border p-5 space-y-3"
          style={{ borderColor: "var(--line)", background: "white" }}
        >
          <div
            className="h-2.5 w-20 animate-pulse rounded-full"
            style={{ background: "var(--grey-100)", animationDelay: `${i * 80}ms` }}
          />
          <div
            className="h-8 w-14 animate-pulse rounded-xl"
            style={{ background: "var(--grey-200)", animationDelay: `${i * 80 + 40}ms` }}
          />
          <div
            className="h-2 w-24 animate-pulse rounded-full"
            style={{ background: "var(--grey-100)", animationDelay: `${i * 80 + 80}ms` }}
          />
        </div>
      ))}
    </div>
  );
}
