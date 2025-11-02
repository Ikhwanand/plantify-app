'use client';

import { useEffect, useState } from "react";
import { FiArrowRightCircle, FiLoader, FiTrash2 } from "react-icons/fi";
import { deleteDiagnosis, fetchDiagnosisHistory } from "../../lib/api";
import { useApiRequest } from "../../lib/useApiRequest";
import { AppShell } from "../components/AppShell";
import { SectionCard } from "../components/SectionCard";
import { DataState } from "../components/DataState";

export default function HistoryPage() {
  const { data, loading, error, execute, setData } = useApiRequest(fetchDiagnosisHistory);
  const {
    execute: removeDiagnosis,
    loading: deleting,
    error: deleteApiError,
  } = useApiRequest(deleteDiagnosis);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    execute().catch((err) => console.error("Riwayat diagnosis gagal dimuat", err));
  }, [execute]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Hapus diagnosis ini dari riwayat?")) return;
    setDeleteError(null);
    setDeletingId(id);
    try {
      await removeDiagnosis(id);
      setData((prev) => (prev ? prev.filter((item) => item.id !== id) : prev));
    } catch (err) {
      console.error("Diagnosis gagal dihapus", err);
      setDeleteError("Gagal menghapus diagnosis. Coba lagi.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AppShell
      title="Riwayat Diagnosis"
      subtitle="Kumpulan hasil scan yang pernah dilakukan. Gunakan sebagai referensi untuk tindakan lanjutan."
    >
      <SectionCard title="Riwayat terbaru">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-12 text-emerald-700">
            <FiLoader className="animate-spin" />
            <span className="text-sm font-medium">Memuat riwayat...</span>
          </div>
        ) : error ? (
          <DataState
            title="Riwayat tidak tersedia"
            description="Pastikan backend di http://localhost:8000/api sedang berjalan."
            action={
              <button
                type="button"
                onClick={() => execute()}
                className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white"
              >
                Coba lagi
              </button>
            }
          />
        ) : data && data.length ? (
          <div className="grid gap-4">
            {data.map((item) => {
              const isDeleting = deletingId === item.id && deleting;
              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-white/70 px-4 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-emerald-900">{item.issue}</p>
                    <p className="text-xs text-emerald-900/60">
                      {item.plantName ? `${item.plantName} - ` : ""}
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                    <div className="text-xs font-semibold text-emerald-700">
                      Confidence: {Math.round(item.confidence * 100)}%
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                    <a
                      href={`/diagnosis/${item.id}`}
                      className="flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-500"
                    >
                      Lihat detail
                      <FiArrowRightCircle />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={isDeleting}
                      className="inline-flex items-center gap-2 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                    >
                      <FiTrash2 size={14} />
                      {isDeleting ? "Menghapus..." : "Hapus"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <DataState
            title="Belum ada diagnosis tersimpan"
            description="Mulai dengan memindai tanaman untuk melihat hasil diagnosis pertama Anda."
            action={
              <a href="/scan" className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white">
                Scan sekarang
              </a>
            }
          />
        )}
        {deleteError || deleteApiError ? (
          <p className="mt-4 text-sm text-red-600">{deleteError ?? deleteApiError}</p>
        ) : null}
      </SectionCard>
    </AppShell>
  );
}
