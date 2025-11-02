'use client';

import { FormEvent, useEffect, useState } from "react";
import { FiCalendar, FiEdit2, FiLoader, FiTrash2 } from "react-icons/fi";
import {
  Reminder,
  createReminder,
  deleteReminder,
  fetchReminders,
  updateReminder,
} from "../../lib/api";
import { useApiRequest } from "../../lib/useApiRequest";
import { AppShell } from "../components/AppShell";
import { SectionCard } from "../components/SectionCard";
import { DataState } from "../components/DataState";

const frequencies: Reminder["frequency"][] = ["once", "weekly", "monthly"];

type ReminderFormState = {
  title: string;
  scheduledFor: string;
  description: string;
  frequency: Reminder["frequency"];
};

const createDefaultFormState = (): ReminderFormState => ({
  title: "",
  scheduledFor: new Date().toISOString().slice(0, 16),
  description: "",
  frequency: "once",
});

const toIcsDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid reminder date");
  }
  return (
    date.getUTCFullYear().toString().padStart(4, "0") +
    (date.getUTCMonth() + 1).toString().padStart(2, "0") +
    date.getUTCDate().toString().padStart(2, "0") +
    "T" +
    date.getUTCHours().toString().padStart(2, "0") +
    date.getUTCMinutes().toString().padStart(2, "0") +
    date.getUTCSeconds().toString().padStart(2, "0") +
    "Z"
  );
};

const escapeIcsText = (value: string): string =>
  value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

const buildIcsContent = (reminder: Reminder): string => {
  const dtStamp = toIcsDateTime(new Date().toISOString());
  const dtStart = toIcsDateTime(reminder.scheduledFor);
  const description = reminder.description ? escapeIcsText(reminder.description) : "";
  const summary = escapeIcsText(reminder.title);
  const freq = reminder.frequency ?? "once";
  const rrule =
    freq === "once"
      ? ""
      : `RRULE:FREQ=${freq === "weekly" ? "WEEKLY" : "MONTHLY"}\n`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Plantify//Reminder//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:plantify-reminder-${reminder.id}@plantify`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    rrule.trim(),
    `SUMMARY:${summary}`,
    description ? `DESCRIPTION:${description}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\n");
};

const downloadReminderIcs = (reminder: Reminder) => {
  try {
    const icsContent = buildIcsContent(reminder);
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const sanitizedTitle = reminder.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "pengingat";
    anchor.href = url;
    anchor.download = `${sanitizedTitle}.ics`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Gagal membuat file ICS", err);
  }
};

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [createForm, setCreateForm] = useState<ReminderFormState>(createDefaultFormState);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ReminderFormState>(createDefaultFormState);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { execute: loadReminders, loading, error } = useApiRequest(fetchReminders);
  const { execute: saveReminder, loading: saving, error: saveError } = useApiRequest(createReminder);
  const { execute: removeReminder, loading: deleting, error: deleteApiError } = useApiRequest(deleteReminder);
  const { execute: patchReminder, loading: updating, error: updateApiError } = useApiRequest(updateReminder);

  useEffect(() => {
    loadReminders()
      .then((data) => {
        if (data) setReminders(data);
      })
      .catch((err) => console.error("Pengingat gagal dimuat", err));
  }, [loadReminders]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: Omit<Reminder, "id"> = {
      title: createForm.title,
      scheduledFor: new Date(createForm.scheduledFor).toISOString(),
      description: createForm.description,
      frequency: createForm.frequency,
    };

    try {
      const created = await saveReminder(payload);
      if (created) {
        setReminders((prev) => [created, ...prev]);
        setCreateForm(createDefaultFormState());
      }
    } catch (err) {
      console.error("Pengingat gagal dibuat", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Hapus pengingat ini?")) return;
    setDeleteError(null);
    setDeletingId(id);
    try {
      await removeReminder(id);
      setReminders((prev) => prev.filter((reminder) => reminder.id !== id));
      if (editingId === id) {
        setEditingId(null);
      }
    } catch (err) {
      console.error("Pengingat gagal dihapus", err);
      setDeleteError("Gagal menghapus pengingat. Coba lagi.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleStartEdit = (reminder: Reminder) => {
    setEditingId(reminder.id);
    setEditError(null);
    setEditForm({
      title: reminder.title,
      description: reminder.description ?? "",
      scheduledFor: new Date(reminder.scheduledFor).toISOString().slice(0, 16),
      frequency: reminder.frequency ?? "once",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditError(null);
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editingId === null) return;
    setEditError(null);
    try {
      const updated = await patchReminder(editingId, {
        title: editForm.title,
        description: editForm.description,
        scheduledFor: new Date(editForm.scheduledFor).toISOString(),
        frequency: editForm.frequency,
      });
      if (updated) {
        setReminders((prev) =>
          prev.map((reminder) =>
            reminder.id === editingId
              ? {
                  ...reminder,
                  title: updated.title,
                  description: updated.description,
                  scheduledFor: updated.scheduledFor,
                  frequency: updated.frequency,
                }
              : reminder
          )
        );
        setEditingId(null);
      }
    } catch (err) {
      console.error("Pengingat gagal diperbarui", err);
      setEditError("Gagal memperbarui pengingat. Coba lagi.");
    }
  };

  return (
    <AppShell
      title="Pengingat Perawatan"
      subtitle="Atur pengingat sederhana tanpa push notification. Kami siapkan jadwal in-app dan file .ics untuk integrasi kalender."
    >
      <SectionCard title="Pengingat baru">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
          <label className="flex flex-col gap-2 md:col-span-2">
            <span className="text-sm font-semibold text-emerald-900">Judul pengingat</span>
            <input
              required
              value={createForm.title}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))}
              className="rounded-2xl border border-emerald-200 bg-white/70 px-4 py-3 text-sm text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder="Contoh: Jadwal fungisida azoxystrobin"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-emerald-900">Waktu pengingat</span>
            <input
              type="datetime-local"
              value={createForm.scheduledFor}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, scheduledFor: event.target.value }))}
              className="rounded-2xl border border-emerald-200 bg-white/70 px-4 py-3 text-sm text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-emerald-900">Frekuensi</span>
            <select
              value={createForm.frequency}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, frequency: event.target.value as Reminder["frequency"] }))
              }
              className="rounded-2xl border border-emerald-200 bg-white/70 px-4 py-3 text-sm text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              {frequencies.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 md:col-span-2">
            <span className="text-sm font-semibold text-emerald-900">Catatan</span>
            <textarea
              rows={4}
              value={createForm.description}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
              className="rounded-2xl border border-emerald-200 bg-white/70 px-4 py-3 text-sm text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder="Tambahkan detail dosis, alat yang dibutuhkan, atau catatan keselamatan."
            />
          </label>

          <div className="md:col-span-2 flex items-center justify-between">
            <p className="text-xs text-emerald-900/70">
              Setelah tersimpan, Anda bisa ekspor file .ics untuk ditambahkan ke Google Calendar atau Apple Calendar.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan pengingat"}
            </button>
          </div>
        </form>
        {saveError ? (
          <p className="text-sm text-red-600">
            Gagal menyimpan pengingat. Pastikan backend di http://localhost:8000/api aktif.
          </p>
        ) : null}
      </SectionCard>

      <SectionCard title="Pengingat aktif">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-12 text-emerald-700">
            <FiLoader className="animate-spin" />
            <span className="text-sm font-medium">Memuat pengingat...</span>
          </div>
        ) : error ? (
          <DataState title="Tidak dapat memuat pengingat" description="Coba ulang setelah backend aktif." />
        ) : reminders.length ? (
          <div className="grid gap-4">
            {reminders.map((reminder) => {
              const isDeleting = deletingId === reminder.id && deleting;
              const isEditing = editingId === reminder.id;

              return (
                <div
                  key={reminder.id}
                  className="rounded-2xl border border-emerald-100 bg-white/70 px-4 py-4 space-y-3"
                >
                  {isEditing ? (
                    <form className="space-y-3" onSubmit={handleUpdate}>
                      <div className="grid gap-3 md:grid-cols-[1fr_0.5fr]">
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
                          <span className="text-xs font-semibold text-emerald-900 uppercase">Frekuensi</span>
                          <select
                            value={editForm.frequency}
                            onChange={(event) =>
                              setEditForm((prev) => ({
                                ...prev,
                                frequency: event.target.value as Reminder["frequency"],
                              }))
                            }
                            className="rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                          >
                            {frequencies.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-semibold text-emerald-900 uppercase">Waktu pengingat</span>
                        <input
                          type="datetime-local"
                          value={editForm.scheduledFor}
                          onChange={(event) =>
                            setEditForm((prev) => ({ ...prev, scheduledFor: event.target.value }))
                          }
                          className="rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                        />
                      </label>

                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-semibold text-emerald-900 uppercase">Catatan</span>
                        <textarea
                          rows={3}
                          value={editForm.description}
                          onChange={(event) =>
                            setEditForm((prev) => ({ ...prev, description: event.target.value }))
                          }
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
                          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                            <FiCalendar />
                            {reminder.title}
                          </div>
                          <p className="text-xs text-emerald-900/60">
                            {new Date(reminder.scheduledFor).toLocaleString()} - {reminder.frequency}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(reminder)}
                            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-50"
                          >
                            <FiEdit2 size={14} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(reminder.id)}
                            disabled={isDeleting}
                            className="inline-flex items-center gap-2 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                          >
                            <FiTrash2 size={14} />
                            {isDeleting ? "Menghapus..." : "Hapus"}
                          </button>
                        </div>
                      </div>
                      {reminder.description ? (
                        <p className="text-sm text-emerald-900/70">{reminder.description}</p>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => downloadReminderIcs(reminder)}
                        className="rounded-full border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-600 hover:border-emerald-500"
                      >
                        Unduh .ics
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <DataState
            title="Belum ada pengingat"
            description="Tambahkan pengingat agar Anda tidak melewatkan jadwal penting perawatan tanaman."
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
