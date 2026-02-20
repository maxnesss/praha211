"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ExistingClaim = {
  claimedAt: string;
  selfieUrl: string;
};

type ClaimDistrictFormProps = {
  districtCode: string;
  districtName: string;
  isAuthenticated: boolean;
  isClaimed: boolean;
  existingClaim?: ExistingClaim;
};

export function ClaimDistrictForm({
  districtCode,
  districtName,
  isAuthenticated,
  isClaimed,
  existingClaim,
}: ClaimDistrictFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const selfieFile = formData.get("selfieFile");
    const attestVisited = formData.get("attestVisited") === "on";
    const attestSignVisible = formData.get("attestSignVisible") === "on";

    if (!(selfieFile instanceof File) || selfieFile.size === 0) {
      setError("Nahrajte selfie soubor.");
      setIsSubmitting(false);
      return;
    }

    const selfieUrl = URL.createObjectURL(selfieFile);
    const response = await fetch(`/api/districts/${districtCode}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selfieUrl,
        attestVisited,
        attestSignVisible,
      }),
    });
    URL.revokeObjectURL(selfieUrl);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      setError(payload?.message || "Nepodařilo se odeslat potvrzení městské části.");
      setIsSubmitting(false);
      return;
    }

    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    setSuccess(payload?.message || "Potvrzení přijato.");
    setIsModalOpen(false);
    setIsSubmitting(false);
    router.refresh();
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-lg font-semibold text-slate-100">Potvrdit městskou část</h2>
        <p className="mt-2 text-sm text-slate-400">
          Přihlaste se a odešlete potvrzení návštěvy pro{" "}
          <strong>{districtName}</strong>.
        </p>
        <Link
          href={`/sign-in?callbackUrl=${encodeURIComponent(`/district/${districtCode}`)}`}
          className="mt-4 inline-flex rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400"
        >
          Přihlásit se a potvrdit
        </Link>
      </div>
    );
  }

  if (isClaimed && existingClaim) {
    return (
      <div className="rounded-xl border border-emerald-300/40 bg-emerald-500/10 p-5">
        <h2 className="text-lg font-semibold text-emerald-100">
          Městská část dokončena
        </h2>
        <p className="mt-2 text-sm text-emerald-100/90">
          Potvrzeno dne{" "}
          {new Date(existingClaim.claimedAt).toLocaleString("cs-CZ")}.
        </p>
        {existingClaim.selfieUrl.startsWith("http") ? (
          <a
            href={existingClaim.selfieUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex text-sm font-medium text-emerald-100 underline underline-offset-4 hover:text-white"
          >
            Otevřít nahranou selfie
          </a>
        ) : (
          <p className="mt-4 text-sm text-emerald-100/90">Selfie soubor byl nahrán.</p>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setSuccess(null);
          setIsModalOpen(true);
        }}
        className="mt-6 flex w-full justify-center rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400"
      >
        Odemknout městskou část
      </button>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">
                  Odemknout městskou část
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Nahrajte selfie soubor a potvrďte návštěvu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-md border border-slate-700 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300 hover:bg-slate-800"
              >
                Zavřít
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label
                  htmlFor="selfieFile"
                  className="text-sm font-medium text-slate-200"
                >
                  Nahrajte selfie
                </label>
                <input
                  id="selfieFile"
                  name="selfieFile"
                  type="file"
                  accept="image/*"
                  required
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-200 hover:file:bg-slate-700"
                />
              </div>

              <label className="flex items-start gap-3 text-sm text-slate-300">
                <input
                  name="attestVisited"
                  type="checkbox"
                  required
                  className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 text-amber-500 focus:ring-amber-400"
                />
                Tuto městskou část jsem fyzicky navštívil/a.
              </label>

              <label className="flex items-start gap-3 text-sm text-slate-300">
                <input
                  name="attestSignVisible"
                  type="checkbox"
                  required
                  className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 text-amber-500 focus:ring-amber-400"
                />
                Na selfie je vidět oficiální cedule městské části.
              </label>

              {error && (
                <p className="rounded-md border border-rose-400/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {error}
                </p>
              )}

              {success && (
                <p className="rounded-md border border-emerald-300/50 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                  {success}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Odesílám..." : "Potvrdit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
