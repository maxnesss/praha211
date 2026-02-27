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
      <div className="rounded-xl border border-orange-300/40 bg-orange-400/12 p-5">
        <h2 className="text-lg font-semibold text-orange-100">Městská část dokončena</h2>
        <p className="mt-2 text-sm text-orange-100/85">
          Potvrzeno dne {new Date(existingClaim.claimedAt).toLocaleString("cs-CZ")}.
        </p>
        {existingClaim.selfieUrl.startsWith("selfies/") ? (
          <a
            href={`/api/uploads/selfie/view?key=${encodeURIComponent(existingClaim.selfieUrl)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex text-sm font-medium text-orange-100 underline underline-offset-4 hover:text-orange-50"
          >
            Otevřít nahranou selfie
          </a>
        ) : existingClaim.selfieUrl.startsWith("http") ? (
          <a
            href={existingClaim.selfieUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex text-sm font-medium text-orange-100 underline underline-offset-4 hover:text-orange-50"
          >
            Otevřít nahranou selfie
          </a>
        ) : (
          <p className="mt-4 text-sm text-orange-100/85">Selfie soubor byl nahrán.</p>
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
