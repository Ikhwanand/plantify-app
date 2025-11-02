'use client';

import { ChangeEvent, useEffect, useState } from "react";
import { fetchUserSettings, updateUserSettings, UserSettings } from "../../lib/api";
import { useApiRequest } from "../../lib/useApiRequest";
import { AppShell } from "../components/AppShell";
import { SectionCard } from "../components/SectionCard";
import { DataState } from "../components/DataState";

const languageOptions = [
  { value: "id", label: "Bahasa Indonesia" },
  { value: "en", label: "English" },
  { value: "ms", label: "Bahasa Melayu" },
];

const countryOptions = [
  { value: "ID", label: "Indonesia" },
  { value: "SG", label: "Singapore" },
  { value: "MY", label: "Malaysia" },
  { value: "TH", label: "Thailand" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);

  const { execute: loadSettings, loading, error } = useApiRequest(fetchUserSettings);
  const { execute: persistSettings, loading: saving } = useApiRequest(updateUserSettings);

  useEffect(() => {
    loadSettings()
      .then((data) => {
        if (data) setSettings(data);
      })
      .catch((err) => console.error("Pengaturan gagal dimuat", err));
  }, [loadSettings]);

  const handleSelectChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    if (!settings) return;
    const { name, value } = event.target;
    const payload = { [name]: value } as Partial<UserSettings>;
    setSettings((prev) => (prev ? { ...prev, [name]: value } : prev));
    try {
      await persistSettings(payload);
    } catch (err) {
      console.error("Gagal memperbarui pengaturan", err);
    }
  };

  const handleToggleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!settings) return;
    const { name, checked } = event.target;
    const payload = { [name]: checked } as Partial<UserSettings>;
    setSettings((prev) => (prev ? { ...prev, [name]: checked } : prev));
    try {
      await persistSettings(payload);
    } catch (err) {
      console.error("Gagal memperbarui pengaturan", err);
    }
  };

  return (
    <AppShell
      title="Pengaturan"
      subtitle="Sesuaikan bahasa, negara, dan preferensi mode ilmiah agar Plantify memberikan konteks paling relevan."
    >
      <SectionCard title="Preferensi lokal">
        {loading ? (
          <p className="text-sm text-emerald-900/70">Memuat pengaturan pengguna...</p>
        ) : error ? (
          <DataState
            title="Gagal memuat pengaturan"
            description="Pastikan backend tersedia di http://localhost:8000/api."
          />
        ) : settings ? (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-emerald-900">Bahasa UI</span>
              <select
                name="language"
                value={settings.language}
                onChange={handleSelectChange}
                className="rounded-2xl border border-emerald-200 bg-white/70 px-4 py-3 text-sm text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-emerald-900">Negara</span>
              <select
                name="country"
                value={settings.country}
                onChange={handleSelectChange}
                className="rounded-2xl border border-emerald-200 bg-white/70 px-4 py-3 text-sm text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                {countryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-white/70 px-4 py-4 md:col-span-2">
              <div>
                <p className="text-sm font-semibold text-emerald-900">Aktifkan mode ilmiah</p>
                <p className="text-xs text-emerald-900/70">
                  Plantify akan mencari referensi arXiv dan literatur ilmiah untuk diagnosis mendalam.
                </p>
              </div>
              <input
                type="checkbox"
                name="enableScientificMode"
                checked={settings.enableScientificMode}
                onChange={handleToggleChange}
                className="h-5 w-10 rounded-full border-emerald-300 bg-emerald-100 accent-emerald-600"
              />
            </label>

            <label className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-white/70 px-4 py-4 md:col-span-2">
              <div>
                <p className="text-sm font-semibold text-emerald-900">Aktifkan mode offline</p>
                <p className="text-xs text-emerald-900/70">
                  Simpan hasil diagnosis terakhir dan logbook agar tetap tersedia tanpa koneksi.
                </p>
              </div>
              <input
                type="checkbox"
                name="offlineMode"
                checked={settings.offlineMode}
                onChange={handleToggleChange}
                className="h-5 w-10 rounded-full border-emerald-300 bg-emerald-100 accent-emerald-600"
              />
            </label>
          </div>
        ) : (
          <DataState title="Belum ada pengaturan" description="Ubah opsi untuk mulai menyimpan preferensi Anda." />
        )}
        {saving ? <p className="text-xs text-emerald-900/60">Menyimpan perubahan...</p> : null}
      </SectionCard>
    </AppShell>
  );
}
