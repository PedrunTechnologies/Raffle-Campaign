import { Spinner } from "@/components/ui/Loader";


type Props = {
  children:   React.ReactNode;
  variant?:   "primary" | "ghost";
  fullWidth?: boolean;
  disabled?:  boolean;
  loading?:   boolean;
  onClick?:   () => void;
  type?:      "button" | "submit" | "reset";
};

export default function Button({
  children,
  variant   = "primary",
  fullWidth,
  disabled,
  loading,
  onClick,
  type = "button",
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-2xl px-5 py-3
        text-sm font-semibold
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed

        ${variant === "primary"
          ? "bg-[var(--blue)] text-white hover:bg-[var(--blue-dark)] active:scale-[.98]"
          : "border border-[var(--line)] bg-white text-[var(--ink)] hover:bg-[var(--grey-50)] active:scale-[.98]"
        }

        ${fullWidth ? "w-full" : ""}
      `}
    >
      {loading && (
        <Spinner
          size={15}
          color={variant === "primary" ? "white" : "var(--ink-soft)"}
        />
      )}
      {children}
    </button>
  );
}

