'use client';

import Link from "next/link";
import { useEffect } from "react";
import { FiBell, FiCheckSquare, FiClock, FiCompass, FiLoader, FiUsers } from "react-icons/fi";
import { fetchDashboardMetrics } from "../../lib/api";
import { useApiRequest } from "../../lib/useApiRequest";
import { AppShell } from "../components/AppShell";
import { SectionCard } from "../components/SectionCard";
import { DataState } from "../components/DataState";

const quickLinks = [
  {
    href: "/scan",
    label: "Scan baru",
    description: "Upload foto tanaman dan lanjutkan checklist gejala.",
    icon: FiCompass,
  },
  {
    href: "/history",
    label: "Riwayat",
    description: "Lihat diagnosis terakhir dan bandingkan confidence.",
    icon: FiClock,
  },
  {
    href: "/logbook",
    label: "Logbook",
    description: "Catat tindakan perawatan harian untuk setiap tanaman.",
    icon: FiCheckSquare,
  },
  {
    href: "/reminders",
    label: "Pengingat",
    description: "Jadwalkan perawatan selanjutnya agar tidak terlewat.",
    icon: FiBell,
  },
  {
    href: "/community",
    label: "Komunitas",
    description: "Diskusikan kasus lapangan dengan petani lain.",
    icon: FiUsers,
  },
];

export default function DashboardPage() {
  const { data, loading, error, execute } = useApiRequest(fetchDashboardMetrics);

  useEffect(() => {
    execute().catch((err) => console.error("Dashboard gagal dimuat", err));
  }, [execute]);

  return (
    <AppShell
      title="Dashboard Internal"
      subtitle="Pantau performa diagnosis AI, confidence rata-rata, dan feedback pengguna secara ringkas."
    >
      <SectionCard title="Navigasi cepat" description="Akses kilat ke fitur utama Plantify.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {quickLinks.map(({ href, label, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-start gap-4 rounded-2xl border border-emerald-100 bg-white/70 px-5 py-4 transition-colors hover:border-emerald-300 hover:bg-white"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 transition-all group-hover:bg-emerald-200">
                <Icon size={20} />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-emerald-900">{label}</p>
                <p className="text-xs text-emerald-900/70">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Statistik utama">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-12 text-emerald-700">
            <FiLoader className="animate-spin" />
            <span className="text-sm font-medium">Memuat statistik...</span>
          </div>
        ) : error ? (
          <DataState title="Dashboard tidak tersedia" description="Pastikan backend aktif untuk melihat metrik." />
        ) : data && data.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {data.map((metric) => (
              <div
                key={metric.label}
                className="space-y-2 rounded-2xl border border-emerald-100 bg-white/70 px-4 py-4"
              >
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">{metric.label}</p>
                <p className="text-2xl font-semibold text-emerald-900">{metric.value}</p>
                {typeof metric.delta === "number" ? (
                  <p className={`text-xs font-semibold ${metric.delta >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {metric.delta >= 0 ? "+" : ""}
                    {metric.delta}%
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <DataState
            title="Belum ada data statistik"
            description="Metrik dashboard akan muncul setelah ada aktivitas diagnosis di platform."
          />
        )}
      </SectionCard>
    </AppShell>
  );
}
