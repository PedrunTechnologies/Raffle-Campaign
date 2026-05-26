import { FcGoogle } from "react-icons/fc";


type Props = {
  onClick?: () => void;
  disabled?: boolean;
};


export default function GoogleButton({ onClick, disabled }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="
        flex w-full items-center justify-center gap-3
        rounded-2xl border border-[var(--line)] bg-white
        px-5 py-4 text-sm font-semibold
        transition-all duration-200
        hover:bg-[var(--grey-50)]
        disabled:cursor-not-allowed disabled:opacity-50
      "
    >
      <FcGoogle size={20} />
      Continue with Google
    </button>
  );
}

