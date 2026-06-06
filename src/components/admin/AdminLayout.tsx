"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/ui/Logo";
import {
  HiOutlineViewGrid,
  HiOutlineRefresh,
  HiOutlineCollection,
  HiOutlineUsers,
  HiOutlineMenuAlt3,
  HiOutlineX,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineClipboardList,
  HiOutlineViewBoards,
  HiOutlineTicket,
} from "react-icons/hi";
import { GiDiceSixFacesFive } from "react-icons/gi";
import { RiStoreLine } from "react-icons/ri";
import { useAdminAuth } from "@/context/AdminAuthContext";


const NAV_MAIN = [
  { href: "/admin/overview", icon: HiOutlineViewGrid, label: "Overview" },
  { href: "/admin/cycle-control", icon: HiOutlineRefresh, label: "Cycle control" },
  { href: "/admin/draw", icon: GiDiceSixFacesFive, label: "Trigger draw" },
];

const NAV_MANAGE = [
  { href: "/admin/vendors", icon: RiStoreLine, label: "Vendors" },
  { href: "/admin/participants", icon: HiOutlineUsers, label: "Participants" },
  { href: "/admin/vouchers",     icon: HiOutlineTicket,        label: "Vouchers"     },
  { href: "/admin/cycles",        icon: HiOutlineViewBoards,    label: "Cycles"       },
  { href: "/admin/tasks", icon: HiOutlineClipboardList, label: "Tasks" },
  { href: "/admin/draw-logs", icon: HiOutlineCollection, label: "Draw logs" },
];

// const NAV_SETTINGS = [
//   { href: "/admin/configuration", icon: HiOutlineCog, label: "Configuration" },
// ];


function NavLink({
  href, icon: Icon, label, onClick,
}: {
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
      <Icon size={15} />
      {label}
    </Link>
  );
}

function NavGroup({ label }: { label: string }) {
  return (
    <p className="mb-2 mt-5 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--mute)]">
      {label}
    </p>
  );
}


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, logout } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const Sidebar = ({ onNav }: { onNav?: () => void }) => (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center gap-3 px-1">
        <Logo width="32" height="32" />
        <div>
          <p className="text-sm font-bold leading-tight">Pedrun</p>
          <p className="text-xs text-[var(--mute)]">Admin console</p>
        </div>
      </div>

      <nav className="flex flex-col">
        {NAV_MAIN.map((i) => <NavLink key={i.href} {...i} onClick={onNav} />)}
        <NavGroup label="Manage" />
        {NAV_MANAGE.map((i) => <NavLink key={i.href} {...i} onClick={onNav} />)}
        {/* <NavGroup label="Settings" />
        {NAV_SETTINGS.map((i) => <NavLink key={i.href} {...i} onClick={onNav} />)} */}
      </nav>

      {/* Identity + logout */}
      <div className="mt-auto pt-6">
        <div className="mb-2 rounded-2xl border border-[var(--line)] bg-white p-4">
          <p className="text-sm font-semibold text-[var(--ink)]">
            {admin?.displayName ?? "Admin"}
          </p>
          <p className="text-xs text-[var(--ink-soft)]">
            {admin?.role ?? "Ops"} . Super Admin
          </p>
        </div>
        <button
          onClick={logout}
          className="
            flex w-full items-center gap-3 rounded-xl px-3 py-2.5
            text-sm font-medium text-[var(--ink-soft)]
            transition-all hover:bg-red-50 hover:text-red-600
          "
        >
          <HiOutlineLogout size={15} />
          Log out
        </button>
      </div>

    </div>
  );


  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col overflow-y-auto border-r border-[var(--line)] bg-[var(--grey-50)] p-5 lg:flex">
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
            <span className="text-sm font-bold">Admin console</span>
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


