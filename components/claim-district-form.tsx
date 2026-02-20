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

      setError(payload?.message || "Unable to submit district claim.");
      setIsSubmitting(false);
      return;
    }

    const payload = (await response.json()) as {
      claim: { awardedPoints: number };
    };

    setSuccess(`Claim accepted. +${payload.claim.awardedPoints} points.`);
    setIsSubmitting(false);
    router.refresh();
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-lg font-semibold text-slate-100">Claim District</h2>
        <p className="mt-2 text-sm text-slate-400">
          Sign in to submit your visit for <strong>{districtName}</strong>.
        </p>
        <Link
          href={`/sign-in?callbackUrl=${encodeURIComponent(`/district/${districtCode}`)}`}
          className="mt-4 inline-flex rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400"
        >
          Sign in to claim
        </Link>
      </div>
    );
  }

  if (isClaimed && existingClaim) {
    return (
      <div className="rounded-xl border border-emerald-300/40 bg-emerald-500/10 p-5">
        <h2 className="text-lg font-semibold text-emerald-100">
          District Completed
        </h2>
        <p className="mt-2 text-sm text-emerald-100/90">
          Claimed on {new Date(existingClaim.claimedAt).toLocaleString()}.
        </p>
        <ul className="mt-3 space-y-1 text-sm text-emerald-100/90">
          <li>Base points: {existingClaim.basePoints}</li>
          <li>Same-day multiplier: {existingClaim.sameDayMultiplier.toFixed(2)}x</li>
          <li>Streak bonus: +{existingClaim.streakBonus}</li>
          <li>Total awarded: +{existingClaim.awardedPoints}</li>
        </ul>
        <a
          href={existingClaim.selfieUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex text-sm font-medium text-emerald-100 underline underline-offset-4 hover:text-white"
        >
          Open submitted selfie
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-lg font-semibold text-slate-100">Submit Claim</h2>
      <p className="mt-2 text-sm text-slate-400">
        Trust-based V1: confirm visit, sign visibility, and attach selfie URL.
      </p>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label htmlFor="selfieUrl" className="text-sm font-medium text-slate-200">
            Selfie URL
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
          I physically visited this district.
        </label>

        <label className="flex items-start gap-3 text-sm text-slate-300">
          <input
            name="attestSignVisible"
            type="checkbox"
            required
            className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 text-amber-500 focus:ring-amber-400"
          />
          The official district sign is visible in the selfie.
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
          {isSubmitting ? "Submitting..." : "Claim district"}
        </button>
      </form>
    </div>
  );
}
