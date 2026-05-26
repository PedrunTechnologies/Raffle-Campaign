import Button from "../ui/Button";

type Props = {
  title: string;
  description: string;
  reward: string;
  completed?: boolean;
};

export default function TaskCard({
  title,
  description,
  reward,
  completed,
}: Props) {
  return (
    <div
      className="
        rounded-[32px]
        border border-[var(--line)]
        bg-white
        p-6
      "
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <h3 className="text-lg font-semibold">
              {title}
            </h3>

            <div
              className={`
                rounded-full
                px-3 py-1
                text-xs font-semibold

                ${
                  completed
                    ? "bg-green-100 text-green-700"
                    : "bg-[var(--blue-soft)] text-[var(--blue)]"
                }
              `}
            >
              {completed ? "Completed" : "Pending"}
            </div>
          </div>

          <p
            className="
              max-w-xl
              text-sm leading-6
              text-[var(--ink-soft)]
            "
          >
            {description}
          </p>
        </div>

        <div
          className="
            rounded-2xl
            bg-[var(--grey-50)]
            px-4 py-3
            text-right
          "
        >
          <p className="text-xs text-[var(--ink-soft)]">
            Reward
          </p>

          <h4 className="font-semibold">
            {reward}
          </h4>
        </div>
      </div>

      <Button
        variant={completed ? "ghost" : "primary"}
      >
        {completed
          ? "Completed"
          : "Complete Task"}
      </Button>
    </div>
  );
}