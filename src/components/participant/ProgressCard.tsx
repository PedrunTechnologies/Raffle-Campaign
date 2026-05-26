type Props = {
  completed: number;
  total: number;
};

export default function ProgressCard({
  completed,
  total,
}: Props) {
  const progress = (completed / total) * 100;

  return (
    <div
      className="
        rounded-[32px]
        border border-[var(--line)]
        bg-white
        p-6
      "
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--ink-soft)]">
            Campaign Progress
          </p>

          <h3
            className="text-3xl"
            style={{
              fontFamily: "var(--font-display)",
            }}
          >
            {completed}/{total}
          </h3>
        </div>

        <div
          className="
            rounded-2xl
            bg-[var(--lime)]
            px-4 py-2
            text-sm font-semibold
          "
        >
          Active
        </div>
      </div>

      <div
        className="
          h-3 overflow-hidden
          rounded-full
          bg-[var(--grey-100)]
        "
      >
        <div
          className="
            h-full rounded-full
            bg-[var(--blue)]
            transition-all duration-300
          "
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
    </div>
  );
}