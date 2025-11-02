'use client';

import type { AuthResponse } from "./api";

export const AUTH_STORAGE_KEY = "plantify:auth";

export type AuthSession = AuthResponse;

export const readAuthSession = (): AuthSession | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.accessToken === "string" && parsed.user) {
      return parsed as AuthSession;
    }
  } catch {
    return null;
  }

  return null;
};

export const storeAuthSession = (session: AuthSession) => {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
};

export const clearAuthSession = () => {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
};
