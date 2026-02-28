"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isAllowedSelfieMimeType,
  SELFIE_ALLOWED_MIME_TYPES,
  SELFIE_MAX_SIZE_BYTES,
} from "@/lib/selfie-upload-rules";

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

type SignedUploadPayload = {
  uploadUrl: string;
  selfieKey: string;
  contentType: string;
  method: "PUT";
};

const UNLOCK_EFFECT_SESSION_KEY_PREFIX = "praha112_unlock_effect_";
const UNLOCK_EFFECT_MAX_AGE_MS = 20_000;

const UNLOCK_EFFECT_SPARKS = [
  { left: "8%", top: "86%", delay: "0ms" },
  { left: "16%", top: "80%", delay: "70ms" },
  { left: "26%", top: "88%", delay: "120ms" },
  { left: "38%", top: "82%", delay: "60ms" },
  { left: "49%", top: "90%", delay: "180ms" },
  { left: "59%", top: "84%", delay: "90ms" },
  { left: "68%", top: "88%", delay: "150ms" },
  { left: "78%", top: "81%", delay: "40ms" },
  { left: "88%", top: "86%", delay: "140ms" },
] as const;

function getUnlockEffectStorageKey(districtCode: string) {
  return `${UNLOCK_EFFECT_SESSION_KEY_PREFIX}${districtCode}`;
}

function consumePendingUnlockEffect(districtCode: string) {
  if (typeof window === "undefined") {
    return false;
  }

  const storageKey = getUnlockEffectStorageKey(districtCode);
  const stored = window.sessionStorage.getItem(storageKey);
  if (!stored) {
    return false;
  }

  window.sessionStorage.removeItem(storageKey);
  const timestamp = Number.parseInt(stored, 10);

  if (Number.isNaN(timestamp) || Date.now() - timestamp > UNLOCK_EFFECT_MAX_AGE_MS) {
    return false;
  }

  return true;
}

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
  const [showUnlockEffect, setShowUnlockEffect] = useState(() =>
    consumePendingUnlockEffect(districtCode),
  );

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

    if (!isAllowedSelfieMimeType(selfieFile.type)) {
      setError("Nepodporovaný formát souboru. Nahrajte prosím JPG, PNG, WEBP nebo HEIC.");
      setIsSubmitting(false);
      return;
    }

    if (selfieFile.size > SELFIE_MAX_SIZE_BYTES) {
      setError("Soubor je příliš velký. Maximální velikost je 10 MB.");
      setIsSubmitting(false);
      return;
    }

    const signResponse = await fetch("/api/uploads/selfie/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: selfieFile.name,
        type: selfieFile.type,
        size: selfieFile.size,
        districtCode,
      }),
    });

    const signPayload = (await signResponse.json().catch(() => null)) as
      | ({ message?: string } & Partial<SignedUploadPayload>)
      | null;

    if (
      !signResponse.ok
      || !signPayload?.uploadUrl
      || !signPayload.selfieKey
      || !signPayload.contentType
    ) {
      setError(signPayload?.message || "Nepodařilo se připravit upload selfie.");
      setIsSubmitting(false);
      return;
    }

    const uploadResponse = await fetch(signPayload.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": signPayload.contentType,
      },
      body: selfieFile,
    });

    if (!uploadResponse.ok) {
      setError("Nahrání selfie selhalo. Zkuste to prosím znovu.");
      setIsSubmitting(false);
      return;
    }

    const response = await fetch(`/api/districts/${districtCode}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selfieUrl: signPayload.selfieKey,
        attestVisited,
        attestSignVisible,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      setError(
        payload?.message
          || "Nepodařilo se odeslat potvrzení městské části po nahrání selfie.",
      );
      setIsSubmitting(false);
      return;
    }

    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    setSuccess(payload?.message || "Potvrzení přijato.");
    setIsModalOpen(false);
    setIsSubmitting(false);
    setShowUnlockEffect(true);

    if (typeof window !== "undefined") {
      const storageKey = getUnlockEffectStorageKey(districtCode);
      window.sessionStorage.setItem(storageKey, String(Date.now()));
    }

    router.refresh();
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-cyan-300/25 bg-[#091925]/70 p-5">
        <h2 className="text-lg font-semibold text-cyan-50">Potvrdit městskou část</h2>
        <p className="mt-2 text-sm text-cyan-100/70">
          Přihlaste se a odešlete potvrzení návštěvy pro <strong>{districtName}</strong>.
        </p>
        <Link
          href={`/sign-in?callbackUrl=${encodeURIComponent(`/district/${districtCode}`)}`}
          className="mt-4 inline-flex rounded-md border border-cyan-300/45 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-50 transition-colors hover:bg-cyan-400/20"
        >
          Přihlásit se a potvrdit
        </Link>
      </div>
    );
  }

  if (isClaimed && existingClaim) {
    return (
      <div className="relative mt-1 overflow-hidden rounded-xl border border-orange-300/40 bg-orange-400/12 p-4 sm:p-5">
        {showUnlockEffect ? (
          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute inset-0 animate-[unlock-sheen_1200ms_ease-out_forwards] bg-[radial-gradient(circle_at_16%_12%,rgba(251,191,36,0.24),transparent_46%),radial-gradient(circle_at_78%_20%,rgba(125,211,252,0.2),transparent_44%),radial-gradient(circle_at_52%_92%,rgba(251,146,60,0.18),transparent_58%)]"
              onAnimationEnd={() => {
                setShowUnlockEffect(false);
              }}
            />
            {UNLOCK_EFFECT_SPARKS.map((spark) => (
              <span
                key={`${spark.left}-${spark.delay}`}
                className="absolute h-1.5 w-1.5 rounded-full bg-orange-100/95 shadow-[0_0_16px_rgba(251,191,36,0.75)] animate-[unlock-spark_1050ms_ease-out_forwards]"
                style={{
                  left: spark.left,
                  top: spark.top,
                  animationDelay: spark.delay,
                }}
              />
            ))}
          </div>
        ) : null}

        <h2 className="relative text-lg font-semibold text-orange-100">Městská část dokončena</h2>
        <p className="relative mt-1.5 text-sm text-orange-100/85">
          Potvrzeno dne {new Date(existingClaim.claimedAt).toLocaleString("cs-CZ")}.
        </p>
        {existingClaim.selfieUrl.startsWith("selfies/") ? (
          <a
            href={`/api/uploads/selfie/view?key=${encodeURIComponent(existingClaim.selfieUrl)}`}
            target="_blank"
            rel="noreferrer"
            className="relative mt-3 inline-flex text-sm font-medium text-orange-100 underline underline-offset-4 hover:text-orange-50"
          >
            Otevřít nahranou selfie
          </a>
        ) : existingClaim.selfieUrl.startsWith("http") ? (
          <a
            href={existingClaim.selfieUrl}
            target="_blank"
            rel="noreferrer"
            className="relative mt-3 inline-flex text-sm font-medium text-orange-100 underline underline-offset-4 hover:text-orange-50"
          >
            Otevřít nahranou selfie
          </a>
        ) : (
          <p className="relative mt-3 text-sm text-orange-100/85">Selfie soubor byl nahrán.</p>
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
        className="mt-6 flex w-full justify-center rounded-md border border-orange-300/60 bg-orange-400/20 px-4 py-2 text-sm font-semibold text-orange-50 transition-colors hover:bg-orange-400/30"
      >
        Odemknout městskou část
      </button>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030b11]/80 p-4">
          <div className="w-full max-w-lg rounded-xl border border-cyan-300/35 bg-[#0b1f2f] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-cyan-50">Odemknout městskou část</h2>
                <p className="mt-1 text-sm text-cyan-100/70">
                  Nahrajte selfie soubor a potvrďte návštěvu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-md border border-cyan-300/35 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-100 hover:bg-cyan-400/10"
              >
                Zavřít
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleSubmit} autoComplete="off">
              <div className="space-y-1.5">
                <label htmlFor="selfieFile" className="text-sm font-medium text-cyan-100">
                  Nahrajte selfie
                </label>
                <input
                  id="selfieFile"
                  name="selfieFile"
                  type="file"
                  accept={SELFIE_ALLOWED_MIME_TYPES.join(",")}
                  required
                  className="w-full rounded-md border border-cyan-300/30 bg-[#08161f] px-3 py-2 text-sm text-cyan-50 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-500/15 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-cyan-100 hover:file:bg-cyan-500/25"
                />
              </div>

              <label className="flex items-start gap-3 text-sm text-cyan-100/80">
                <input
                  name="attestVisited"
                  type="checkbox"
                  required
                  className="mt-0.5 h-4 w-4 rounded border-cyan-300/40 bg-[#08161f] text-orange-300 focus:ring-orange-200"
                />
                Tuto městskou část jsem fyzicky navštívil/a.
              </label>

              <label className="flex items-start gap-3 text-sm text-cyan-100/80">
                <input
                  name="attestSignVisible"
                  type="checkbox"
                  required
                  className="mt-0.5 h-4 w-4 rounded border-cyan-300/40 bg-[#08161f] text-orange-300 focus:ring-orange-200"
                />
                Na selfie je vidět oficiální cedule městské části.
              </label>

              {error ? (
                <p className="rounded-md border border-rose-400/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {error}
                </p>
              ) : null}

              {success ? (
                <p className="rounded-md border border-emerald-300/50 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                  {success}
                </p>
              ) : null}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-cyan-300/35 px-4 py-2 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-400/10"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md border border-orange-300/60 bg-orange-400/20 px-4 py-2 text-sm font-semibold text-orange-50 transition-colors hover:bg-orange-400/30 disabled:cursor-not-allowed disabled:opacity-70"
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
