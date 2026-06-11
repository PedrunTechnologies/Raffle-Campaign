type Option = { value: string; label: string };

type Props = {
  label: string;
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  hint?: string;
};

export default function SelectField({ label, options, value, onChange, hint }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      {!!label && <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
        {label}
      </label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full appearance-none rounded-2xl
          border border-[var(--line)]
          bg-white
          px-4 py-4
          text-sm text-[var(--ink)]
          outline-none transition-all
          focus:border-[var(--blue)]
          focus:ring-4 focus:ring-[rgba(30,91,255,.10)]
          bg-[right_1rem_center]
          bg-no-repeat
        "
        style={{
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <p className="text-xs text-[var(--ink-soft)]">{hint}</p>}
    </div>
  );
}
