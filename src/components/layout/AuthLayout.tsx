import Logo from "../ui/Logo";

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export default function AuthLayout({
  title,
  subtitle,
  children,
}: Props) {
  return (
    <main
      className="
        flex items-center justify-center
        min-h-screen px-6 py-10
      "
    >
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex justify-center items-center">
            <Logo width="50" height="50" />
          </div>

          <h1
            className="mb-2 text-4xl tracking-tight"
            style={{
              fontFamily: "var(--font-display)",
            }}
          >
            {title}
          </h1>

          <p className="text-[var(--ink-soft)]">
            {subtitle}
          </p>
        </div>

        <div
          className="
            rounded-[32px] border border-[var(--line)]
            bg-white shadow-xl p-8
          "
        >
          {children}
        </div>
      </div>
    </main>
  );
}