'use client';

import { useCallback, useState } from "react";

type AsyncFn<Args extends unknown[], Result> = (...args: Args) => Promise<Result>;

export function useApiRequest<Args extends unknown[], Result>(fn: AsyncFn<Args, Result>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Result | null>(null);

  const execute = useCallback(
    async (...args: Args) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fn(...args);
        setData(response);
        return response;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : typeof err === "string" ? err : "Terjadi kesalahan.";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fn]
  );

  return { execute, loading, error, data, setData };
}
