'use client';

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { FiAlertCircle, FiCheck, FiExternalLink, FiInfo, FiX } from "react-icons/fi";
import { fetchDiagnosis } from "../../../lib/api";
import { useApiRequest } from "../../../lib/useApiRequest";
import { AppShell } from "../../components/AppShell";
import { SectionCard } from "../../components/SectionCard";
import { DataState } from "../../components/DataState";

export default function DiagnosisDetailPage() {
  const params = useParams();
  const diagnosisId = Array.isArray(params?.id) ? params?.id[0] : params?.id ?? "";

  const { data, loading, error, execute, setData } = useApiRequest(fetchDiagnosis);

  useEffect(() => {
    if (!diagnosisId) return;

    const stored =
      typeof window !== "undefined" ? sessionStorage.getItem(`plantify:diagnosis:${diagnosisId}`) : null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && String(parsed.id) === diagnosisId) {
          setData(parsed);
          return;
        }
      } catch (err) {
        console.warn("Gagal memuat diagnosis lokal", err);
      }
    }

    execute(diagnosisId)
      .then((result) => {
        if (result && typeof window !== "undefined") {
          sessionStorage.setItem(`plantify:diagnosis:${diagnosisId}`, JSON.stringify(result));
        }
      })
      .catch((err) => console.error("Diagnosis tidak dapat dimuat", err));
  }, [diagnosisId, execute, setData]);

  const confidencePercent = useMemo(() => {
    if (!data || typeof data.confidence !== "number") return null;
    const normalized = Math.min(Math.max(data.confidence, 0), 1);
    return Math.round(normalized * 100);
  }, [data]);

  const consensusPercent = useMemo(() => {
    if (!data || typeof data.consensusScore !== "number") return null;
    const normalized = Math.min(Math.max(data.consensusScore, 0), 1);
    return Math.round(normalized * 100);
  }, [data]);

  const sectionDescription = data
    ? data.plantName
      ? `Tanaman: ${data.plantName}`
      : "Pastikan checklist gejala sudah lengkap agar diagnosis lebih akurat."
    : "Memuat data diagnosis...";

  if (!diagnosisId) {
    return (
      <DataState
        title="Diagnosis tidak ditemukan"
        description="ID diagnosis tidak valid. Silakan buka dari riwayat atau lakukan scan baru."
        action={
          <a href="/scan" className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white">
            Kembali ke Scan
          </a>
        }
      />
    );
  }

  return (
    <AppShell
      title="Hasil Diagnosis"
      subtitle="Rangkuman temuan Vision AI dan agen bukti Plantify, disertai rekomendasi perawatan serta daftar sumber."
      actions={
        <a
          href="/history"
          className="rounded-full border border-emerald-300 bg-white/70 px-5 py-2 text-sm font-semibold text-emerald-700 hover:border-emerald-500"
        >
          Lihat riwayat
        </a>
      }
    >
      <SectionCard title={data?.issue ?? "Memuat diagnosis..."} description={sectionDescription}>
        {loading ? (
          <p className="text-sm text-emerald-900/70">Mengambil hasil diagnosis dari server...</p>
        ) : error ? (
          <DataState
            title="Diagnosis gagal dimuat"
            description="Periksa kembali koneksi ke server backend (http://localhost:8000/api)."
            action={
              <button
                type="button"
                onClick={() => execute(diagnosisId)}
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Coba ulang
              </button>
            }
          />
        ) : data ? (
          <div className="space-y-10">
            <div className="grid gap-6 md:grid-cols-[0.8fr_1fr]">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-emerald-900 uppercase tracking-wide">Ringkasan</h3>
                  <p className="mt-2 text-sm font-semibold text-emerald-900">{data.issue}</p>
                  {data.summary ? (
                    <p className="mt-2 text-sm text-emerald-900/80">{data.summary}</p>
                  ) : (
                    <p className="mt-2 text-sm text-emerald-900/60">
                      Belum ada ringkasan singkat. Gunakan rekomendasi di bawah untuk tindakan awal.
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-emerald-700">
                    {data.plantName ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1">Tanaman: {data.plantName}</span>
                    ) : null}
                    {data.plantPart ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1">Bagian: {data.plantPart}</span>
                    ) : null}
                    {consensusPercent !== null ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1">
                        Konsensus sumber: {consensusPercent}%
                      </span>
                    ) : null}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-emerald-900 uppercase tracking-wide">Confidence meter</h3>
                  <div className="mt-2 rounded-full bg-emerald-100/60">
                    {confidencePercent !== null ? (
                      <div
                        className="flex h-3 items-center justify-end rounded-full bg-emerald-500 text-[10px] font-semibold text-white"
                        style={{ width: `${confidencePercent}%` }}
                      >
                        <span className="pr-2">{confidencePercent}%</span>
                      </div>
                    ) : (
                      <div className="flex h-3 items-center justify-center rounded-full bg-emerald-200 text-[10px] font-semibold text-emerald-700">
                        <span>Confidence belum tersedia</span>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 flex items-start gap-2 text-xs text-emerald-900/70">
                    <FiInfo className="mt-0.5 text-emerald-500" size={16} />
                    Confidence dihitung dari kecocokan gejala, bukti web, dan konsensus antar sumber.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-emerald-100 bg-white/70 p-6">
                <h3 className="text-sm font-semibold text-emerald-900 uppercase tracking-wide">
                  Rekomendasi perawatan
                </h3>
                {data.recommendations.length ? (
                  <div className="mt-4 space-y-4">
                    {data.recommendations.map((item, index) => (
                      <div key={`${item.title}-${index}`} className="space-y-2 rounded-2xl bg-emerald-50/70 px-4 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                          {item.type === "active_ingredient" ? "Bahan aktif" : "Pendekatan non-kimia"}
                        </span>
                        <p className="text-sm font-semibold text-emerald-900">{item.title}</p>
                        <p className="text-sm text-emerald-900/70">{item.description}</p>
                        {item.caution ? (
                          <p className="flex items-start gap-2 text-xs font-semibold text-amber-600">
                            <FiAlertCircle className="mt-0.5" />
                            {item.caution}
                          </p>
                        ) : null}
                        {item.references?.length ? (
                          <p className="text-xs text-emerald-900/60">
                            Referensi: {item.references.map((ref) => `#${ref}`).join(", ")}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-emerald-900/70">
                    Belum ada rekomendasi otomatis. Periksa kembali checklist atau tambahkan foto tambahan.
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-emerald-900 uppercase tracking-wide">Citations</h3>
              {data.sources.length ? (
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  {data.sources.map((source, index) => (
                    <a
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col gap-2 rounded-2xl border border-emerald-100 bg-white/70 px-4 py-4 transition-colors hover:border-emerald-300"
                    >
                      <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                        #{index + 1} {source.source}
                      </span>
                      <p className="text-sm font-semibold text-emerald-900 group-hover:text-emerald-700">
                        {source.title}
                      </p>
                      <p className="text-xs text-emerald-900/70">{source.summary}</p>
                      {source.publishedAt ? (
                        <p className="text-xs text-emerald-900/60">Terbit: {source.publishedAt}</p>
                      ) : null}
                      <span className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                        Buka sumber
                        <FiExternalLink />
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-emerald-900/70">Belum ada sumber referensi yang terverifikasi.</p>
              )}
            </div>

            {data.checklist.length ? (
              <div>
                <h3 className="text-sm font-semibold text-emerald-900 uppercase tracking-wide">Checklist gejala</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {data.checklist.map((item, index) => (
                    <div
                      key={`${item.symptom}-${index}`}
                      className="space-y-2 rounded-2xl border border-emerald-100 bg-white/70 px-4 py-4"
                    >
                      <p className="text-sm font-semibold text-emerald-900">{item.symptom}</p>
                      <div className="flex flex-wrap gap-2 text-xs font-semibold">
                        <span
                          className={`flex items-center gap-1 rounded-full px-3 py-1 ${
                            item.aiDetected ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {item.aiDetected ? <FiCheck /> : <FiX />}
                          Deteksi AI
                        </span>
                        <span
                          className={`flex items-center gap-1 rounded-full px-3 py-1 ${
                            item.userConfirmed ? "bg-emerald-500 text-white" : "bg-red-100 text-red-600"
                          }`}
                        >
                          {item.userConfirmed ? <FiCheck /> : <FiX />}
                          Konfirmasi user
                        </span>
                      </div>
                      {item.note ? <p className="text-xs text-emerald-900/70">Catatan: {item.note}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {data.additionalRequests.length ? (
              <div>
                <h3 className="text-sm font-semibold text-emerald-900 uppercase tracking-wide">Permintaan lanjutan</h3>
                <ul className="mt-3 space-y-2 text-sm text-emerald-900/80">
                  {data.additionalRequests.map((request, index) => (
                    <li key={`${request.type}-${index}`} className="flex items-start gap-2 rounded-2xl bg-emerald-50/70 px-4 py-3">
                      <FiAlertCircle className="mt-0.5 text-emerald-500" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">{request.type}</p>
                        <p className="text-sm text-emerald-900/80">{request.message}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {data.followUpQuestions.length ? (
              <div>
                <h3 className="text-sm font-semibold text-emerald-900 uppercase tracking-wide">Pertanyaan lanjutan</h3>
                <ul className="mt-3 list-disc space-y-2 pl-6 text-sm text-emerald-900/80">
                  {data.followUpQuestions.map((question, index) => (
                    <li key={`${question}-${index}`}>{question}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-emerald-900/70">Belum ada data diagnosis untuk ID ini.</p>
        )}
      </SectionCard>
    </AppShell>
  );
}
