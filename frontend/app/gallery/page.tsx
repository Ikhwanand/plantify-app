'use client';

import Image from "next/image";
import { useEffect } from "react";
import { FiLoader } from "react-icons/fi";
import { fetchGalleryCases } from "../../lib/api";
import { useApiRequest } from "../../lib/useApiRequest";
import { AppShell } from "../components/AppShell";
import { SectionCard } from "../components/SectionCard";
import { DataState } from "../components/DataState";

export default function GalleryPage() {
  const { data, loading, error, execute } = useApiRequest(fetchGalleryCases);

  useEffect(() => {
    execute().catch((err) => console.error("Galeri kasus gagal dimuat", err));
  }, [execute]);

  return (
    <AppShell
      title="Galeri Kasus Terverifikasi"
      subtitle="Pelajari kasus nyata yang sudah divalidasi tim agronomist. Gunakan sebagai referensi perbandingan."
    >
      <SectionCard title="Koleksi terbaru">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-12 text-emerald-700">
            <FiLoader className="animate-spin" />
            <span className="text-sm font-medium">Memuat galeri...</span>
          </div>
        ) : error ? (
          <DataState title="Galeri tidak tersedia" description="Pastikan backend aktif untuk memuat kasus terbaru." />
        ) : data && data.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.map((item) => (
              <article
                key={item.id}
                className="flex flex-col overflow-hidden rounded-3xl border border-emerald-100 bg-white/70"
              >
                <div className="relative aspect-[4/3] bg-emerald-50/70">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-emerald-900/60">
                      Tidak ada gambar
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-3 px-5 py-4">
                  <div className="text-xs text-emerald-700">
                    {item.crop} - {item.region ?? "Region tidak diketahui"}
                  </div>
                  <h3 className="text-base font-semibold text-emerald-900">{item.title}</h3>
                  <p className="text-sm text-emerald-900/70">{item.summary}</p>
                  <p className="text-xs font-semibold text-emerald-600">Kasus: {item.issue}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <DataState
            title="Belum ada kasus terpublikasi"
            description="Tim Plantify sedang memverifikasi kasus baru. Cek kembali dalam beberapa saat."
          />
        )}
      </SectionCard>
    </AppShell>
  );
}
