import Button from "../ui/Button";

type Props = {
  platform: string;
  handle: string;
  description: string;
};

export default function SocialCard({
  platform,
  handle,
  description,
}: Props) {
  return (
    <div
      className="
        rounded-[28px]
        border border-[var(--line)]
        bg-white
        p-6
      "
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="mb-1 text-lg font-semibold">
            {platform}
          </h3>

          <p className="text-sm text-[var(--blue)]">
            {handle}
          </p>
        </div>

        <div
          className="
            rounded-full
            bg-[var(--blue-soft)]
            px-3 py-1
            text-xs font-semibold
            text-[var(--blue)]
          "
        >
          Required
        </div>
      </div>

      <p
        className="
          mb-6
          text-sm leading-6
          text-[var(--ink-soft)]
        "
      >
        {description}
      </p>

      <Button fullWidth>
        Connect Account
      </Button>
    </div>
  );
}