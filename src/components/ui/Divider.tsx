type Props = {
  label: string;
};

export default function Divider({
  label,
}: Props) {
  return (
    <div className="relative my-6">
      <div className="border-t border-[var(--line)]" />

      <span
        className="
          absolute left-1/2 top-1/2
          -translate-x-1/2 -translate-y-1/2

          bg-white
          px-3

          text-sm
          text-[var(--mute)]
        "
      >
        {label}
      </span>
    </div>
  );
}