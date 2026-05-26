import { InputHTMLAttributes } from "react";


// type Props = {
//   label: string;
//   type?: string;
//   placeholder?: string;
// };


type Props = {
  label: string;
} & InputHTMLAttributes<HTMLInputElement>;

export default function Input({ label, className = "", ...props }: Props) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[var(--ink)]">
        {label}
      </label>
      <input
        {...props}
        className={`
          w-full rounded-2xl border border-[var(--line)]
          bg-white px-4 py-4 text-sm outline-none transition-all
          placeholder:text-[var(--grey-300)]
          focus:border-[var(--blue)] focus:ring-4 focus:ring-[rgba(30,91,255,.10)]
          disabled:cursor-not-allowed disabled:opacity-50
          ${className}
        `}
      />
    </div>
  );
}


// export default function Input({
//   label,
//   type = "text",
//   placeholder,
// }: Props) {
//   return (
//     <div className="space-y-2">
//       <label
//         className="
//           block text-sm font-medium
//           text-[var(--ink)]
//         "
//       >
//         {label}
//       </label>

//       <input
//         type={type}
//         placeholder={placeholder}
//         className="
//           w-full
//           rounded-2xl
//           border border-[var(--line)]
//           bg-white
//           px-4 py-4
//           text-sm
//           outline-none
//           transition-all

//           placeholder:text-[var(--grey-300)]

//           focus:border-[var(--blue)]
//           focus:ring-4
//           focus:ring-[rgba(30,91,255,.10)]
//         "
//       />
//     </div>
//   );
// }