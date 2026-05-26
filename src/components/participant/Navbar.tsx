"use client";
import { useState } from "react";
import {
  HiOutlineMenuAlt3,
  HiOutlineX,
} from "react-icons/hi";
import Button from "../ui/Button";
import Link from "next/link";
import Logo from "../ui/Logo";


export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header
      className="
        sticky top-0 z-50
        border-b border-[var(--line)]
        bg-white/80
        backdrop-blur-xl
      "
    >
      <div
        className="
          mx-auto flex h-20 max-w-7xl
          items-center justify-between
          px-6
          "
      >
        {/* LOGO */}

        <div className="flex items-center gap-3">
          <Logo width="50" height="50" />

          <div>
            <h2 className="font-semibold">
              Pedrun
            </h2>

            <p className="text-sm text-[var(--ink-soft)]">
              Delivery, faster.
            </p>
          </div>
        </div>

        {/* DESKTOP */}

        <div className="hidden items-center gap-3 md:flex">
          <Link href={'/login'}>
            <Button variant="ghost">
              Login
            </Button>
          </Link>

          <Link href={'/signup'}>
            <Button>
              Get Started
            </Button>
          </Link>
        </div>

        {/* MOBILE BUTTON */}

        <button
          onClick={() => setOpen(!open)}
          className="
            flex h-11 w-11 items-center justify-center
            rounded-2xl
            border border-[var(--line)]
            bg-white
            md:hidden
          "
        >
          {open
            ? <HiOutlineX size={22} />
            : <HiOutlineMenuAlt3 size={22} />}
        </button>
      </div>

      {/* MOBILE MENU */}

      {open && (
        <div
          className="
            border-t border-[var(--line)]
            bg-white px-6 py-6
            md:hidden
          "
        >
          <div className="flex flex-col gap-3">
            <Link href={'/login'}>
              <Button variant="ghost">
                Login
              </Button>
            </Link>

            <Link href={'/signup'}>
              <Button>
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

