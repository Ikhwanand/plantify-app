'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FiBarChart2,
  FiBell,
  FiCheckSquare,
  FiClock,
  FiCompass,
  // FiHome,
  FiLogOut,
  FiMenu,
  FiUsers,
  FiX,
} from "react-icons/fi";

import type { AuthUser } from "../../lib/api";
import { clearAuthSession, readAuthSession } from "../../lib/auth";
import { PageHeader } from "./PageHeader";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: FiBarChart2 },
  { href: "/scan", label: "Scan Tanaman", icon: FiCompass },
  { href: "/history", label: "Riwayat", icon: FiClock },
  { href: "/logbook", label: "Logbook", icon: FiCheckSquare },
  { href: "/reminders", label: "Pengingat", icon: FiBell },
  { href: "/community", label: "Komunitas", icon: FiUsers },
];

type AppShellProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export function AppShell({ title, subtitle, actions, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const syncSession = () => {
      const session = readAuthSession();
      if (!session) {
        setUser(null);
        setReady(true);
        router.replace("/auth");
        return;
      }
      setUser(session.user);
      setReady(true);
    };

    syncSession();
    window.addEventListener("storage", syncSession);
    return () => window.removeEventListener("storage", syncSession);
  }, [router]);

  const activeNav = useMemo(() => {
    return navItems.find((item) => pathname.startsWith(item.href))?.href ?? "";
  }, [pathname]);

  const initials = useMemo(() => {
    if (!user?.name) return "";
    const segments = user.name.trim().split(" ");
    if (segments.length === 0) return "";
    if (segments.length === 1) return segments[0][0]?.toUpperCase() ?? "";
    return `${segments[0][0] ?? ""}${segments[segments.length - 1][0] ?? ""}`.toUpperCase();
  }, [user]);

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    router.replace("/auth");
  };

  if (!ready || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-100/70 via-white to-emerald-50 text-emerald-950">
      <header className="sticky top-0 z-40 border-b border-emerald-100/70 bg-white/75 backdrop-blur-xl">
        <div className="section-wrapper flex items-center justify-between py-2">
          <Link href="/dashboard" className="flex items-center gap-2 text-base font-semibold text-emerald-700">
            {/* <FiHome className="text-emerald-500" />
            <span className="hidden sm:inline">Plantify Console</span> */}
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-full px-2.5 py-1.5 text-sm text-emerald-700 transition-colors ${
                    isActive ? "bg-emerald-100 font-semibold" : "hover:bg-emerald-50"
                  }`}
                >
                  <Icon size={18} />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 uppercase text-white">
                  {initials || user.name[0]?.toUpperCase()}
                </span>
                <div className="hidden flex-col leading-tight sm:flex">
                  <span>{user.name || user.email}</span>
                  <span className="text-[10px] text-emerald-600/80">{user.email}</span>
                </div>
              </div>
            ) : null}
            <button
              type="button"
              onClick={handleLogout}
              className="hidden items-center gap-2 rounded-full border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 md:flex"
            >
              <FiLogOut size={14} />
              Keluar
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-200 text-emerald-600 md:hidden"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              aria-label="Buka navigasi"
            >
              {mobileNavOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>

        {mobileNavOpen ? (
          <div className="section-wrapper pb-3 md:hidden">
            <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-emerald-700">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={`flex flex-1 min-w-[140px] items-center gap-2 rounded-full border border-emerald-100 px-3 py-2 transition-colors ${
                      isActive ? "bg-emerald-100 text-emerald-700" : "hover:bg-emerald-50"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  handleLogout();
                }}
                className="flex flex-1 min-w-[140px] items-center gap-2 rounded-full border border-emerald-100 px-3 py-2 text-emerald-600 transition-colors hover:bg-emerald-50"
              >
                <FiLogOut size={18} />
                Keluar
              </button>
            </nav>
          </div>
        ) : null}
      </header>

      <main className="flex flex-col gap-8 py-8">
        <PageHeader title={title} subtitle={subtitle} actions={actions} />
        {children}
      </main>
    </div>
  );
}
