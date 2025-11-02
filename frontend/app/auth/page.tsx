'use client';

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiLock, FiMail, FiUser } from "react-icons/fi";
import { loginAccount, registerAccount } from "../../lib/api";
import { useApiRequest } from "../../lib/useApiRequest";
import { storeAuthSession } from "../../lib/auth";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { DataState } from "../components/DataState";

type AuthMode = "register" | "login";

const initialState = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("register");
  const [formState, setFormState] = useState(initialState);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    execute: executeRegister,
    loading: registering,
    error: registerError,
  } = useApiRequest(registerAccount);
  const { execute: executeLogin, loading: loggingIn, error: loginError } = useApiRequest(loginAccount);

  const isRegister = mode === "register";
  const isSubmitting = useMemo(() => (isRegister ? registering : loggingIn), [isRegister, registering, loggingIn]);
  const serverError = isRegister ? registerError : loginError;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (isRegister) {
      if (formState.password !== formState.confirmPassword) {
        setFormError("Konfirmasi kata sandi tidak cocok.");
        return;
      }
      if (formState.password.length < 8) {
        setFormError("Kata sandi minimal 8 karakter.");
        return;
      }
    }

    try {
      if (isRegister) {
        const response = await executeRegister({
          name: formState.name.trim(),
          email: formState.email.trim().toLowerCase(),
          password: formState.password,
        });
        if (response) {
          storeAuthSession(response);
          router.push("/dashboard");
        }
      } else {
        const response = await executeLogin({
          email: formState.email.trim().toLowerCase(),
          password: formState.password,
        });
        if (response) {
          storeAuthSession(response);
          router.push("/dashboard");
        }
      }
    } catch (err) {
      console.error("Autentikasi gagal", err);
    }
  };

  const handleSwitchMode = (next: AuthMode) => {
    setMode(next);
    setFormError(null);
  };

  return (
    <div className="flex flex-col gap-12 pb-16">
      <PageHeader
        title="Mulai dengan Plantify"
        subtitle="Buat akun baru atau masuk untuk melanjutkan perjalanan perawatan tanaman Anda."
        actions={
          <div className="rounded-full bg-white/80 px-4 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
            Gunakan email aktif untuk menerima update beta.
          </div>
        }
      />

      <SectionCard
        title={isRegister ? "Daftar akun Plantify" : "Masuk ke Plantify"}
        description={
          isRegister
            ? "Gratis selamanya untuk fitur diagnosis, checklist, dan logbook."
            : "Masuk untuk mengakses riwayat diagnosis dan logbook Anda."
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {isRegister ? (
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-emerald-900">Nama lengkap</span>
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white/70 px-4 py-3">
                <FiUser className="text-emerald-500" />
                <input
                  required
                  value={formState.name}
                  onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Contoh: Andi Saputra"
                  className="w-full bg-transparent text-sm text-emerald-900 focus:outline-none"
                />
              </div>
            </label>
          ) : null}

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-emerald-900">Email</span>
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white/70 px-4 py-3">
              <FiMail className="text-emerald-500" />
              <input
                required
                type="email"
                value={formState.email}
                onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="email@domain.com"
                className="w-full bg-transparent text-sm text-emerald-900 focus:outline-none"
              />
            </div>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-emerald-900">Kata sandi</span>
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white/70 px-4 py-3">
              <FiLock className="text-emerald-500" />
              <input
                required
                type="password"
                value={formState.password}
                onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="Minimal 8 karakter"
                className="w-full bg-transparent text-sm text-emerald-900 focus:outline-none"
              />
            </div>
          </label>

          {isRegister ? (
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-emerald-900">Konfirmasi kata sandi</span>
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white/70 px-4 py-3">
                <FiLock className="text-emerald-500" />
                <input
                  required
                  type="password"
                  value={formState.confirmPassword}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, confirmPassword: event.target.value }))
                  }
                  placeholder="Ulangi kata sandi"
                  className="w-full bg-transparent text-sm text-emerald-900 focus:outline-none"
                />
              </div>
            </label>
          ) : null}

          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          {serverError ? <p className="text-sm text-red-600">{serverError}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
          >
            {isRegister ? (isSubmitting ? "Mendaftarkan..." : "Daftar & masuk") : isSubmitting ? "Masuk..." : "Masuk"}
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-emerald-100 bg-white/70 px-4 py-4 text-sm text-emerald-900/80">
          {isRegister ? (
            <p>
              Sudah punya akun?{" "}
              <button
                type="button"
                onClick={() => handleSwitchMode("login")}
                className="font-semibold text-emerald-600 underline-offset-4 hover:underline"
              >
                Masuk sekarang
              </button>
            </p>
          ) : (
            <p>
              Baru pertama kali di Plantify?{" "}
              <button
                type="button"
                onClick={() => handleSwitchMode("register")}
                className="font-semibold text-emerald-600 underline-offset-4 hover:underline"
              >
                Buat akun gratis
              </button>
            </p>
          )}
        </div>
      </SectionCard>

      <DataState
        title="Beta terbuka"
        description="Akun beta mendapatkan akses ke semua fitur Plantify tanpa batas. Kami akan memberi tahu jika ada perubahan paket."
      />
    </div>
  );
}
