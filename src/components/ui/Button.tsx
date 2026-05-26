type Props = {
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: any
};

export default function Button({
  children,
  variant = "primary",
  fullWidth,
  disabled,
  onClick,
}: Props) {
  return (
    <button
    disabled={disabled}
    onClick={onClick}
      className={`
        inline-flex items-center justify-center
        rounded-2xl
        px-5 py-3
        text-sm font-semibold
        transition-all duration-200

        ${
          variant === "primary"
            ? "bg-[var(--blue)] text-white hover:bg-[var(--blue-dark)]"
            : "border border-[var(--line)] bg-white text-[var(--ink)]"
        }

        ${fullWidth ? "w-full" : ""}
      `}
    >
      {children}
    </button>
  );
}