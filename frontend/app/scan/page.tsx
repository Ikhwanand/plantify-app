'use client';

import Image from "next/image";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiCheckCircle, FiLoader, FiUploadCloud } from "react-icons/fi";
import { uploadPlantImage } from "../../lib/api";
import { useApiRequest } from "../../lib/useApiRequest";
import { AppShell } from "../components/AppShell";
import { SectionCard } from "../components/SectionCard";

export default function ScanPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { execute, loading, error } = useApiRequest(uploadPlantImage);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const isReadyToSubmit = useMemo(() => Boolean(selectedFile) && !loading, [selectedFile, loading]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) {
      return;
    }
    const file = event.target.files[0];
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("image", selectedFile);
    if (notes.trim()) {
      formData.append("notes", notes.trim());
    }

    try {
      const response = await execute(formData);
      if (response) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("plantify:last-scan", JSON.stringify(response));
        }
        router.push(`/scan/checklist?scanId=${response.scanId}`);
      }
    } catch (err) {
      console.error("Upload gagal", err);
    }
  };

  return (
    <AppShell
      title="Scan Tanaman"
      subtitle="Upload foto tanaman dan biarkan Vision AI Plantify membaca gejala awal sebelum konfirmasi manual."
    >
      <SectionCard
        title="Upload atau ambil foto"
        description="Gunakan foto fokus pada daun, batang, atau area yang terindikasi bermasalah. Format yang didukung: JPG, PNG, HEIC."
      >
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col gap-4">
            <label className="rounded-3xl border-2 border-dashed border-emerald-300 bg-white/60 px-6 py-10 text-center transition-colors hover:border-emerald-500">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <FiUploadCloud className="mx-auto text-emerald-500" size={34} />
              <p className="mt-3 text-base font-semibold text-emerald-900">Tarik atau pilih foto</p>
              <p className="text-sm text-emerald-900/70">Maksimal 10 MB, rekam kondisi terbaru.</p>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-emerald-900">Catatan tambahan</span>
              <textarea
                className="w-full rounded-2xl border border-emerald-200 bg-white/70 px-4 py-3 text-sm text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                rows={4}
                placeholder="Contoh: terlihat bercak coklat sejak 3 hari lalu, sudah disemprot fungisida organik."
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>

            {error ? (
              <p className="text-sm text-red-600">
                Gagal mengunggah foto. Pastikan backend di http://localhost:8000/api aktif lalu coba lagi.
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-3xl border border-emerald-100 bg-white/80 p-4">
              <h3 className="text-sm font-semibold text-emerald-900">Pratinjau</h3>
              <div className="mt-3 aspect-square overflow-hidden rounded-2xl bg-emerald-50/70 flex items-center justify-center">
                {previewUrl ? (
                  <div className="relative h-full w-full">
                    <Image
                      src={previewUrl}
                      alt="Pratinjau foto tanaman"
                      fill
                      sizes="100vw"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <p className="text-sm text-emerald-900/60">Belum ada foto terpilih.</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isReadyToSubmit}
              className="flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-white font-semibold shadow-lg shadow-emerald-200 transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin" />
                  Mengirim ke Vision AI...
                </>
              ) : (
                <>
                  <FiCheckCircle />
                  Lanjutkan ke Checklist
                </>
              )}
            </button>

            <p className="text-xs text-emerald-900/60">
              Foto Anda diproses secara lokal dulu sebelum dikirim aman ke server. Kami tidak menyimpan foto tanpa
              persetujuan.
            </p>
          </div>
        </div>
      </SectionCard>
    </AppShell>
  );
}
