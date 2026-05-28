"use client";

import { useState } from "react";
import { HiOutlineMenuAlt3, HiOutlineX, HiOutlineUser } from "react-icons/hi";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Logo from "../ui/Logo";
import Button from "../ui/Button";
import { useAuth } from "@/context/AuthContext";

interface AuthNavbarProps {
  userName?: string;
}

export default function AuthNavbar({ userName = "Participant" }: AuthNavbarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { profile, logout } = useAuth();
  const isActive = (href: string) => pathname === href;

  return (
    <header
      className="
        sticky top-0 z-50
        border-b border-[var(--line)]
        bg-white/80
        backdrop-blur-xl
      "
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Logo width="36" height="36" />
          <span className="font-semibold">Pedrun</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/dashboard"
            className={`
              rounded-xl px-4 py-2 text-sm font-medium transition-colors
              ${isActive("/dashboard")
                ? "bg-[var(--grey-50)] text-[var(--ink)]"
                : "text-[var(--ink-soft)] hover:bg-[var(--grey-50)] hover:text-[var(--ink)]"
              }
            `}
          >
            Dashboard
          </Link>
          <Link
            href="/how-it-works"
            className="
              rounded-xl px-4 py-2
              text-sm font-medium text-[var(--ink-soft)]
              transition-colors hover:bg-[var(--grey-50)] hover:text-[var(--ink)]
            "
          >
            How it works
          </Link>
          <Link
            href="/voucher-detail"
            className={`
              rounded-xl px-4 py-2 text-sm font-medium transition-colors
              ${isActive("/voucher-detail")
                ? "bg-[var(--grey-50)] text-[var(--ink)]"
                : "text-[var(--ink-soft)] hover:bg-[var(--grey-50)] hover:text-[var(--ink)]"
              }
  `}
          >
            My voucher
          </Link>
          <Button variant="ghost" onClick={logout}>Sign out</Button>
          <Link
            href="/profile"
            //           className={`
            // rounded-xl px-4 py-2 text-sm font-medium transition-colors
            // `}
            className={`
              ml-2 flex items-center gap-2
              rounded-2xl border border-[var(--line)]
              bg-white px-4 py-2
              text-sm font-semibold text-[var(--ink)]
              transition-all hover:border-[var(--grey-200)]
              ${isActive("/profile")
                ? "bg-[var(--grey-50)] text-[var(--ink)]"
                : "text-[var(--ink-soft)] hover:bg-[var(--grey-50)] hover:text-[var(--ink)]"
              }
            `}
          >
            <HiOutlineUser size={16} />
            {profile?.name?.split(" ")[0] || 'Participant'}
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="
            flex h-10 w-10 items-center justify-center
            rounded-2xl border border-[var(--line)] bg-white
            md:hidden
          "
        >
          {open ? <HiOutlineX size={20} /> : <HiOutlineMenuAlt3 size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-[var(--line)] bg-white px-6 py-5 md:hidden">
          <div className="flex flex-col gap-1">
            {[
              { href: "/dashboard", label: "Dashboard" },
              { href: "/voucher", label: "My voucher" },
              { href: "/how-it-works", label: "How it works" },
              { href: "/profile", label: "Profile" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`
                  rounded-xl px-4 py-3 text-sm font-medium
                  ${isActive(item.href)
                    ? "bg-[var(--grey-50)] text-[var(--ink)]"
                    : "text-[var(--ink)] hover:bg-[var(--grey-50)]"
                  }
                `}
              >
                {item.label}
              </Link>
            ))}
            <Button variant="ghost" onClick={logout}>Sign out</Button>
          </div>
        </div>
      )}
    </header>
  );
}
