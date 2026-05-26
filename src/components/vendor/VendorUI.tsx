import React from "react";

/* ─── KPI Tile ─── */
export function KpiTile({
  label,
  value,
  detail,
  detailVariant = "neutral",
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  detail: string;
  detailVariant?: "up" | "down" | "neutral";
  accent?: boolean;
}) {
  const detailColor =
    detailVariant === "up"
      ? "text-[var(--forest)]"
      : detailVariant === "down"
      ? "text-[var(--blue)]"
      : accent
      ? "text-[var(--lime)]"
      : "text-[var(--ink-soft)]";

  return (
    <div
      className={`rounded-2xl border p-5 ${
        accent
          ? "border-[var(--ink)] bg-[var(--ink)] text-white"
          : "border-[var(--line)] bg-white"
      }`}
    >
      <p
        className={`mb-2 text-[11px] font-semibold uppercase tracking-widest ${
          accent ? "text-white/60" : "text-[var(--mute)]"
        }`}
      >
        {label}
      </p>
      <p
        className="mb-1 font-display text-4xl font-light leading-none tracking-tight"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </p>
      <p className={`text-xs ${detailColor}`}>{detail}</p>
    </div>
  );
}

/* ─── Panel ─── */
export function Panel({
  title,
  right,
  children,
  noPadding = false,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  noPadding?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
        <h4
          className="text-base font-medium"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h4>
        {right && (
          <span className="text-xs text-[var(--ink-soft)]">{right}</span>
        )}
      </div>
      <div className={noPadding ? "" : "p-5"}>{children}</div>
    </div>
  );
}

/* ─── Badge ─── */
type BadgeVariant = "ok" | "pending" | "danger" | "info";

export function Badge({
  variant,
  children,
}: {
  variant: BadgeVariant;
  children: React.ReactNode;
}) {
  const styles: Record<BadgeVariant, string> = {
    ok: "bg-[var(--forest)]/10 text-[var(--forest)]",
    pending: "bg-[var(--lime)]/30 text-[var(--lime-ink)]",
    danger: "bg-[var(--blue)]/10 text-[var(--blue)]",
    info: "bg-[var(--grey-100)] text-[var(--ink-soft)]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

/* ─── Table ─── */
export function Table({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--line)] bg-[var(--grey-50)]">
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)] whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Tr({ children }: { children: React.ReactNode }) {
  return (
    <tr className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--grey-50)] transition-colors">
      {children}
    </tr>
  );
}

export function Td({
  children,
  mono = false,
  className = "",
}: {
  children: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <td
      className={`px-4 py-3.5 text-sm align-middle ${
        mono ? "font-mono text-xs" : ""
      } ${className}`}
    >
      {children}
    </td>
  );
}

/* ─── Form Field ─── */
export function FormField({
  label,
  value,
  hint,
  children,
}: {
  label: string;
  value?: React.ReactNode;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
        {label}
      </label>
      {children ?? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--grey-50)] px-3.5 py-3 text-sm text-[var(--ink)]">
          {value}
        </div>
      )}
      {hint && <p className="text-xs text-[var(--ink-soft)]">{hint}</p>}
    </div>
  );
}

/* ─── Page header ─── */
export function PageHeader({
  title,
  sub,
  children,
}: {
  title: React.ReactNode;
  sub: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1
          className="text-2xl font-medium tracking-tight md:text-3xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">{sub}</p>
      </div>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  );
}

/* ─── Meter / Progress bar ─── */
export function Meter({
  value,
  max,
  label,
  subleft,
  subright,
}: {
  value: number;
  max: number;
  label: React.ReactNode;
  subleft?: string;
  subright?: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--grey-50)] p-4">
      <div className="mb-2.5 flex items-center justify-between text-sm">
        <span className="font-medium text-[var(--ink)]">{label}</span>
        <span className="font-mono text-xs font-semibold text-[var(--ink-soft)]">
          {value} / {max}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--grey-100)]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, var(--lime), var(--blue))",
          }}
        />
      </div>
      {(subleft || subright) && (
        <div className="mt-2 flex justify-between text-xs text-[var(--ink-soft)]">
          <span>{subleft}</span>
          <span>{subright}</span>
        </div>
      )}
    </div>
  );
}
