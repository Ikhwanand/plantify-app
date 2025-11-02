'use client';

import { FormEvent, useEffect, useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import {
  fetchLogEntries,
  createLogEntry,
  updateLogEntry,
  deleteLogEntry,
  LogEntry,
} from "../../lib/api";
import { useApiRequest } from "../../lib/useApiRequest";
import { AppShell } from "../components/AppShell";
import { SectionCard } from "../components/SectionCard";
import { DataState } from "../components/DataState";

const categoryOptions: LogEntry["category"][] = ["watering", "fertilizing", "treatment", "observation", "other"];

type LogFormState = {
  title: string;
  note: string;
  performedAt: string;
  category: LogEntry["category"];
};

const createDefaultFormState = (): LogFormState => ({
  title: "",
  note: "",
  performedAt: new Date().toISOString().slice(0, 16),
  category: "observation",
});

export default function LogbookPage() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [createForm, setCreateForm] = useState<LogFormState>(createDefaultFormState);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<LogFormState>(createDefaultFormState);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { loading: loadingEntries, error: loadError, execute: loadEntries } = useApiRequest(fetchLogEntries);
  const { loading: creating, error: createError, execute: saveEntry } = useApiRequest(createLogEntry);
  const { loading: updating, error: updateApiError, execute: patchEntry } = useApiRequest(updateLogEntry);
  const { loading: deleting, error: deleteApiError, execute: removeEntry } = useApiRequest(deleteLogEntry);

  useEffect(() => {
    loadEntries()
      .then((data) => {
        if (data) setEntries(data);
      })
      .catch((err) => console.error("Logbook gagal dimuat", err));
  }, [loadEntries]);

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      title: createForm.title,
      note: createForm.note,
      performedAt: new Date(createForm.performedAt).toISOString(),
      category: createForm.category,
    } satisfies Omit<LogEntry, "id">;

    try {
      const created = await saveEntry(payload);
      if (created) {
        setEntries((prev) => [created, ...prev]);
        setCreateForm(createDefaultFormState());
      }
    } catch (err) {
      console.error("Gagal menambahkan log", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Hapus catatan ini?")) return;
    setDeleteError(null);
    setDeletingId(id);
    try {
      await removeEntry(id);
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
      if (editingId === id) {
        setEditingId(null);
      }
    } catch (err) {
      console.error("Gagal menghapus log", err);
      setDeleteError("Gagal menghapus catatan. Coba lagi.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleStartEdit = (entry: LogEntry) => {
    setEditingId(entry.id);
    setEditError(null);
    setEditForm({
      title: entry.title,
      note: entry.note,
      performedAt: new Date(entry.performedAt).toISOString().slice(0, 16),
      category: entry.category,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditError(null);
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editingId === null) return;
    setEditError(null);
    try {
      const updated = await patchEntry(editingId, {
        title: editForm.title,
        note: editForm.note,
        performedAt: new Date(editForm.performedAt).toISOString(),
        category: editForm.category,
      });
      if (updated) {
        setEntries((prev) =>
          prev.map((entry) =>
            entry.id === editingId
              ? {
                  ...entry,
                  title: updated.title,
                  note: updated.note,
                  performedAt: updated.performedAt,
                  category: updated.category,
                }
              : entry
          )
        );
        setEditingId(null);
      }
    } catch (err) {
      console.error("Gagal memperbarui catatan", err);
      setEditError("Gagal memperbarui catatan. Coba lagi.");
    }
  };

  return (
    <AppShell
      title="Logbook Tanaman"
      subtitle="Catat penyiraman, pemupukan, dan tindakan perawatan agar riwayat tanaman terdokumentasi rapi."
    >
      <SectionCard
        title="Tambah catatan"
        description="Lengkapi aktivitas terbaru lalu simpan agar Plantify dapat memberi saran tindak lanjut yang tepat."
      >
        <form className="grid gap-4 md:grid-cols-[1fr_1fr]" onSubmit={handleCreateSubmit}>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-emerald-900">Judul</span>
            <input
              required
              value={createForm.title}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))}
              className="rounded-2xl border border-emerald-200 bg-white/70 px-4 py-3 text-sm text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder="Contoh: Penyiraman pagi"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-emerald-900">Kategori</span>
            <select
              value={createForm.category}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  category: event.target.value as LogEntry["category"],
                }))
              }
              className="rounded-2xl border border-emerald-200 bg-white/70 px-4 py-3 text-sm text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="md:col-span-2 flex flex-col gap-2">
            <span className="text-sm font-semibold text-emerald-900">Catatan</span>
            <textarea
              required
              rows={4}
              value={createForm.note}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, note: event.target.value }))}
              className="rounded-2xl border border-emerald-200 bg-white/70 px-4 py-3 text-sm text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder="Detail tindakan, dosis, kondisi tanaman, atau pengamatan penting lainnya."
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-emerald-900">Tanggal & waktu</span>
            <input
              type="datetime-local"
              value={createForm.performedAt}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, performedAt: event.target.value }))}
              className="rounded-2xl border border-emerald-200 bg-white/70 px-4 py-3 text-sm text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={creating}
              className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
            >
              {creating ? "Menyimpan..." : "Simpan catatan"}
            </button>
          </div>
        </form>
        {createError ? (
          <p className="text-sm text-red-600">
            Gagal menyimpan catatan. Pastikan backend di http://localhost:8000/api aktif.
          </p>
        ) : null}
      </SectionCard>

      <SectionCard title="Catatan terakhir">
        {loadingEntries ? (
          <p className="text-sm text-emerald-900/70">Memuat catatan...</p>
        ) : loadError ? (
          <DataState
            title="Logbook tidak tersedia"
            description="Tidak dapat mengambil data logbook dari server."
          />
        ) : entries.length ? (
          <div className="grid gap-4">
            {entries.map((entry) => {
              const isDeleting = deletingId === entry.id && deleting;
              const isEditing = editingId === entry.id;
              return (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-emerald-100 bg-white/70 px-4 py-4 space-y-3"
                >
                  {isEditing ? (
                    <form className="space-y-3" onSubmit={handleEditSubmit}>
                      <div className="grid gap-3 md:grid-cols-[1fr_0.4fr]">
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-semibold text-emerald-900 uppercase">Judul</span>
                          <input
                            value={editForm.title}
                            onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))}
                            required
                            className="rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-semibold text-emerald-900 uppercase">Kategori</span>
                          <select
                            value={editForm.category}
                            onChange={(event) =>
                              setEditForm((prev) => ({
                                ...prev,
                                category: event.target.value as LogEntry["category"],
                              }))
                            }
                            className="rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                          >
                            {categoryOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-semibold text-emerald-900 uppercase">Catatan</span>
                        <textarea
                          value={editForm.note}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, note: event.target.value }))}
                          rows={3}
                          required
                          className="rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                        />
                      </label>

                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-semibold text-emerald-900 uppercase">Tanggal & waktu</span>
                        <input
                          type="datetime-local"
                          value={editForm.performedAt}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, performedAt: event.target.value }))}
                          className="rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                        />
                      </label>

                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-end md:gap-3">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-700 hover:border-emerald-300"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={updating}
                          className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-emerald-200 transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                        >
                          {updating ? "Menyimpan..." : "Simpan perubahan"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-emerald-900">{entry.title}</p>
                          <span className="text-xs text-emerald-900/60">
                            {new Date(entry.performedAt).toLocaleString()} - {entry.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(entry)}
                            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-50"
                          >
                            <FiEdit2 size={14} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(entry.id)}
                            disabled={isDeleting}
                            className="inline-flex items-center gap-2 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                          >
                            <FiTrash2 size={14} />
                            {isDeleting ? "Menghapus..." : "Hapus"}
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-emerald-900/70">{entry.note}</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <DataState
            title="Logbook kosong"
            description="Belum ada catatan. Simpan aktivitas pertama Anda melalui formulir di atas."
          />
        )}
        {deleteError || deleteApiError ? (
          <p className="text-sm text-red-600">{deleteError ?? deleteApiError}</p>
        ) : null}
        {editError || updateApiError ? (
          <p className="text-sm text-red-600">{editError ?? updateApiError}</p>
        ) : null}
      </SectionCard>
    </AppShell>
  );
}
