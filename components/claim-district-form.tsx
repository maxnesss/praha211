"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ExistingClaim = {
  claimedAt: string;
  awardedPoints: number;
  basePoints: number;
  sameDayMultiplier: number;
  streakBonus: number;
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const selfieUrl = String(formData.get("selfieUrl") || "");
    const attestVisited = formData.get("attestVisited") === "on";
    const attestSignVisible = formData.get("attestSignVisible") === "on";

    const response = await fetch(`/api/districts/${districtCode}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selfieUrl,
        attestVisited,
        attestSignVisible,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      setError(payload?.message || "Nepodařilo se odeslat potvrzení městské části.");
      setIsSubmitting(false);
      return;
    }

    const payload = (await response.json()) as {
      claim: { awardedPoints: number };
    };

    setSuccess(`Potvrzení přijato. +${payload.claim.awardedPoints} bodů.`);
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
        <ul className="mt-3 space-y-1 text-sm text-emerald-100/90">
          <li>Základní body: {existingClaim.basePoints}</li>
          <li>
            Násobitel za stejný den: {existingClaim.sameDayMultiplier.toFixed(2)}x
          </li>
          <li>Bonus za sérii: +{existingClaim.streakBonus}</li>
          <li>Celkem získáno: +{existingClaim.awardedPoints}</li>
        </ul>
        <a
          href={existingClaim.selfieUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex text-sm font-medium text-emerald-100 underline underline-offset-4 hover:text-white"
        >
          Otevřít nahranou selfie
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-lg font-semibold text-slate-100">Odeslat potvrzení</h2>
      <p className="mt-2 text-sm text-slate-400">
        Verze V1 založená na důvěře: potvrďte návštěvu, viditelnost cedule a
        přiložte URL selfie.
      </p>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label htmlFor="selfieUrl" className="text-sm font-medium text-slate-200">
            URL selfie
          </label>
          <input
            id="selfieUrl"
            name="selfieUrl"
            type="url"
            required
            placeholder="https://..."
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-amber-400"
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Odesílám..." : "Potvrdit městskou část"}
        </button>
      </form>
    </div>
  );
}
