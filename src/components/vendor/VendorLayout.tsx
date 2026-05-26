"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/ui/Logo";
import { useVendorAuth } from "@/context/VendorAuthContext";
import {
  HiOutlineViewGrid, HiOutlineCheckCircle, HiOutlineCollection,
  HiOutlineCog, HiOutlineMenuAlt3, HiOutlineX, HiOutlinePlus,
  HiOutlineUser, HiOutlineLogout,
} from "react-icons/hi";



const NAV_ITEMS = [
  { href: "/vendor/dashboard", icon: HiOutlineViewGrid, label: "Dashboard" },
  { href: "/vendor/opt-in", icon: HiOutlinePlus, label: "Opt-in" },
  { href: "/vendor/verify", icon: HiOutlineCheckCircle, label: "Verify code" },
  { href: "/vendor/redemptions", icon: HiOutlineCollection, label: "Redemptions" },
];

const NAV_ACCOUNT = [
  { href: "/vendor/profile", icon: HiOutlineUser, label: "Profile" },
  { href: "/vendor/settings", icon: HiOutlineCog, label: "Settings" },
];


function NavLink({ href, icon: Icon, label, onClick }: {
  href: string; icon: React.ElementType; label: string; onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        flex items-center gap-3 rounded-xl px-3 py-2.5
        text-sm font-medium transition-all
        ${active
          ? "bg-[var(--ink)] text-white"
          : "text-[var(--ink-soft)] hover:bg-[var(--grey-100)] hover:text-[var(--ink)]"
        }
      `}
    >
      <Icon size={16} />
      {label}
    </Link>
  );
}

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const { vendor, logout } = useVendorAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const Sidebar = ({ onNav }: { onNav?: () => void }) => (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center gap-3 px-1">
        <Logo width="32" height="32" />
        <div>
          <p className="text-sm font-bold leading-tight">Pedrun</p>
          <p className="text-xs text-[var(--mute)]">Vendor portal</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} {...item} onClick={onNav} />
        ))}
      </nav>

      <div className="mt-6">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--mute)]">
          Account
        </p>
        <nav className="flex flex-col gap-1">
          {NAV_ACCOUNT.map((item) => (
            <NavLink key={item.href} {...item} onClick={onNav} />
          ))}
        </nav>
      </div>

      <div className="mt-auto pt-6">
        <Link
          href="/vendor/profile"
          onClick={onNav}
          className="mb-2 block rounded-2xl border border-[var(--line)] bg-white p-4 transition-colors hover:border-[var(--grey-200)]"
        >
          <p className="text-sm font-semibold text-[var(--ink)]">
            {vendor?.name ?? "Your business"}
          </p>
          <p className="text-xs text-[var(--ink-soft)]">
            {vendor?.address?.split(",")[0] ?? ""} ·{" "}
            {vendor?.status === "active" ? "Active" : vendor?.status ?? ""}
          </p>
        </Link>

        <button
          onClick={logout}
          className="
            flex w-full items-center gap-3 rounded-xl px-3 py-2.5
            text-sm font-medium text-[var(--ink-soft)]
            transition-all hover:bg-red-50 hover:text-red-600
          "
        >
          <HiOutlineLogout size={16} />
          Log out
        </button>
      </div>
    </div>
  );


  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 overflow-y-auto border-r border-[var(--line)] bg-[var(--grey-50)] p-5 lg:flex lg:flex-col">
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 overflow-y-auto border-r border-[var(--line)] bg-[var(--grey-50)] p-5">
            <button
              onClick={() => setMobileOpen(false)}
              className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--line)] bg-white"
            >
              <HiOutlineX size={18} />
            </button>
            <Sidebar onNav={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[var(--line)] bg-white/80 px-5 backdrop-blur-xl lg:hidden">
          <div className="flex items-center gap-3">
            <Logo width="28" height="28" />
            <span className="text-sm font-bold">Vendor portal</span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--line)] bg-white"
          >
            <HiOutlineMenuAlt3 size={18} />
          </button>
        </header>

        <main className="flex-1 overflow-x-hidden p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}

