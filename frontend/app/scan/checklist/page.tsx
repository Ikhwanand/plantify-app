'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiAlertTriangle, FiCheckSquare, FiLoader } from "react-icons/fi";
import { ChecklistPayload, fetchScanChecklist, submitChecklist } from "../../../lib/api";
import { useApiRequest } from "../../../lib/useApiRequest";
import { AppShell } from "../../components/AppShell";
import { SectionCard } from "../../components/SectionCard";
import { DataState } from "../../components/DataState";

type SymptomState = {
  positive: string[];
  negative: string[];
};

const defaultState: SymptomState = {
  positive: [],
  negative: [],
};

export default function ChecklistPage() {
  const router = useRouter();
  const params = useSearchParams();
  const scanId = params.get("scanId") ?? "";

  const [checklist, setChecklist] = useState<string[]>(() => {
    if (typeof window === "undefined" || !scanId) return [];
    const stored = sessionStorage.getItem("plantify:last-scan");
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      if (parsed?.scanId === scanId && Array.isArray(parsed?.checklist)) {
        return parsed.checklist;
      }
    } catch (err) {
      console.warn("Gagal membaca checklist lokal", err);
    }
    return [];
  });
  const [state, setState] = useState<SymptomState>(defaultState);

  const { execute: loadChecklist, loading: loadingChecklist, error: loadError } =
    useApiRequest(fetchScanChecklist);
  const {
    execute: sendChecklist,
    loading: submitting,
    error: submitError,
  } = useApiRequest(submitChecklist);

  useEffect(() => {
    if (!scanId || checklist.length > 0) return;

    loadChecklist(scanId)
      .then((response) => {
        if (response?.checklist?.length) {
          setChecklist(response.checklist);
          if (typeof window !== "undefined") {
            sessionStorage.setItem(
              "plantify:last-scan",
              JSON.stringify({ scanId, checklist: response.checklist })
            );
          }
        }
      })
      .catch((err) => console.error("Checklist tidak dapat dimuat", err));
  }, [scanId, checklist.length, loadChecklist]);

  const enableSubmit = useMemo(() => state.positive.length > 0 && !submitting, [state, submitting]);

  const handleToggle = (symptom: string, isPositive: boolean) => {
    setState((prev) => {
      const positive = new Set(prev.positive);
      const negative = new Set(prev.negative);

      if (isPositive) {
        positive.add(symptom);
        negative.delete(symptom);
      } else {
        negative.add(symptom);
        positive.delete(symptom);
      }

      return {
        positive: Array.from(positive),
        negative: Array.from(negative),
      };
    });
  };

  const handleSubmit = async () => {
    if (!scanId) return;
    const numericScanId = Number(scanId);
    if (!Number.isFinite(numericScanId)) {
      console.error("Scan ID tidak valid:", scanId);
      return;
    }

    const payload: ChecklistPayload = {
      scanId: numericScanId,
      confirmedSymptoms: state.positive,
      deniedSymptoms: state.negative,
    };

    try {
      const result = await sendChecklist(payload);
      if (result?.diagnosisId) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("plantify:last-checklist", JSON.stringify({ scanId, ...payload }));
        }
        router.push(`/diagnosis/${result.diagnosisId}`);
      }
    } catch (err) {
      console.error("Checklist gagal dikirim", err);
    }
  };

  if (!scanId) {
    return (
      <AppShell
        title="Checklist Gejala"
        subtitle="Konfirmasi gejala yang berhasil dideteksi Vision AI. Hasil diagnosis akan mempertimbangkan jawaban Anda."
      >
        <DataState
          title="Checklist tidak ditemukan"
          description="Scan ID tidak tersedia. Silakan lakukan scan ulang."
          action={
            <button
              type="button"
              onClick={() => router.push("/scan")}
              className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white"
            >
              Kembali ke Scan
            </button>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Checklist Gejala"
      subtitle="Konfirmasi gejala yang berhasil dideteksi Vision AI. Hasil diagnosis akan mempertimbangkan jawaban Anda."
    >
      <SectionCard
        title="Konfirmasi manual"
        description="Centang gejala yang benar-benar terlihat, dan tandai yang tidak muncul agar AI memberikan rekomendasi paling relevan."
      >
        {loadingChecklist ? (
          <div className="flex items-center justify-center gap-3 py-12 text-emerald-700">
            <FiLoader className="animate-spin" />
            <span className="text-sm font-medium">Memuat checklist gejala...</span>
          </div>
        ) : checklist.length === 0 ? (
          <DataState
            title="Checklist masih kosong"
            description={
              loadError
                ? "Kami tidak dapat memuat daftar gejala. Pastikan kembali server backend aktif."
                : "Belum ada gejala yang diidentifikasi. Anda bisa langsung lanjut dengan catatan manual."
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {checklist.map((item) => (
              <label
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-white/70 px-4 py-4 hover:border-emerald-300"
              >
                <FiCheckSquare className="mt-1 text-emerald-600" size={20} />
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-emerald-900">{item}</p>
                  <div className="flex gap-3 text-xs text-emerald-900/70">
                    <button
                      type="button"
                      onClick={() => handleToggle(item, true)}
                      className={`rounded-full border px-3 py-1 font-semibold transition-colors ${
                        state.positive.includes(item)
                          ? "border-emerald-500 bg-emerald-100 text-emerald-700"
                          : "border-emerald-200 bg-white hover:border-emerald-400"
                      }`}
                    >
                      Terlihat
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggle(item, false)}
                      className={`rounded-full border px-3 py-1 font-semibold transition-colors ${
                        state.negative.includes(item)
                          ? "border-red-400 bg-red-50 text-red-600"
                          : "border-emerald-200 bg-white hover:border-red-200"
                      }`}
                    >
                      Tidak terlihat
                    </button>
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-xs text-emerald-900/70">
            <FiAlertTriangle className="text-amber-500" />
            <span>
              Checklist membantu AI menghitung confidence. Pastikan hanya gejala yang benar-benar muncul yang ditandai
              &quot;Terlihat&quot;.
            </span>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!enableSubmit}
            className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
          >
            {submitting ? "Mengirim checklist..." : "Kirim & lihat diagnosis"}
          </button>
        </div>

        {submitError ? (
          <p className="text-sm text-red-600">
            Checklist gagal dikirim. Pastikan backend di http://localhost:8000/api aktif lalu coba lagi.
          </p>
        ) : null}
      </SectionCard>
    </AppShell>
  );
}
