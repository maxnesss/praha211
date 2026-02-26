"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CoatOfArms } from "@/components/coat-of-arms";

type DistrictCoatPreviewProps = {
  assetKey: string;
  code: string;
  name: string;
  history: string;
  funFact: string;
  sourceUrl?: string;
  initiallyUnlocked: boolean;
  canToggleLock: boolean;
};

function toPreview(text: string, maxChars: number) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxChars) {
    return normalized;
  }

  const sliced = normalized.slice(0, maxChars);
  const sentenceEnd = Math.max(
    sliced.lastIndexOf(". "),
    sliced.lastIndexOf("! "),
    sliced.lastIndexOf("? "),
  );

  if (sentenceEnd > maxChars * 0.55) {
    return `${sliced.slice(0, sentenceEnd + 1).trim()} …`;
  }

  return `${sliced.trim()} …`;
}

export function DistrictCoatPreview({
  assetKey,
  code,
  name,
  history,
  funFact,
  sourceUrl,
  initiallyUnlocked,
  canToggleLock,
}: DistrictCoatPreviewProps) {
  const router = useRouter();
  const [isUnlocked, setIsUnlocked] = useState(initiallyUnlocked);
  const [isSaving, setIsSaving] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);
  const historyPreview = toPreview(history, 460);
  const funFactPreview = toPreview(funFact, 170);

  useEffect(() => {
    setIsUnlocked(initiallyUnlocked);
  }, [initiallyUnlocked]);

  async function handleTestToggle() {
    if (!canToggleLock || isSaving) {
      return;
    }

    setIsSaving(true);
    setTestError(null);
    setTestSuccess(null);

    const method = isUnlocked ? "DELETE" : "POST";
    const response = await fetch(`/api/districts/${code}/test-claim`, {
      method,
    });
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;

    if (!response.ok) {
      setTestError(
        payload?.message ||
          "Testovací změnu se nepodařilo uložit. Zkuste to prosím znovu.",
      );
      setIsSaving(false);
      return;
    }

    const unlockedAfterRequest = method === "POST";
    setIsUnlocked(unlockedAfterRequest);
    setTestSuccess(
      payload?.message ||
        (unlockedAfterRequest
          ? "Městská část byla testem odemčena."
          : "Městská část byla testem zamčena."),
    );
    setIsSaving(false);
    router.refresh();
  }

  return (
    <div className="mt-5 w-full max-w-full">
      {canToggleLock ? (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={handleTestToggle}
            disabled={isSaving}
            className="rounded-md border border-cyan-300/35 px-3 py-1.5 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving
              ? "Test: Ukládám..."
              : isUnlocked
                ? "Test: Zamknout a odebrat body"
                : "Test: Odemknout a připsat body"}
          </button>
        </div>
      ) : null}

      <div className="grid w-full grid-cols-1 items-start gap-4 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <CoatOfArms
          assetKey={assetKey}
          code={code}
          name={name}
          sizes="(max-width: 1024px) 80vw, 420px"
          loadingStrategy="eager"
          className={`aspect-square w-full max-w-[22rem] ${isUnlocked ? "" : "grayscale"}`}
        />

        <aside className="flex flex-col rounded-lg border border-cyan-300/25 bg-[#08161f]/80 p-4 md:h-[22rem]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/70">
            Historie části
          </p>
          <p className="mt-3 overflow-hidden text-sm leading-6 text-cyan-50/90 [display:-webkit-box] [text-overflow:ellipsis] [-webkit-box-orient:vertical] [-webkit-line-clamp:7] lg:[-webkit-line-clamp:8]">
            {historyPreview}
          </p>

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-orange-200">
            Zajímavost
          </p>
          <p className="mt-2 overflow-hidden text-sm leading-6 text-cyan-50/90 [display:-webkit-box] [text-overflow:ellipsis] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] lg:[-webkit-line-clamp:3]">
            {funFactPreview}
          </p>

          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-auto pt-4 text-xs font-medium text-cyan-100/75 underline underline-offset-4 hover:text-cyan-50"
            >
              Zdroj: Wikipedie
            </a>
          ) : null}
        </aside>
      </div>

      <p
        className={`mt-4 text-xs font-semibold uppercase tracking-[0.14em] ${
          isUnlocked ? "text-orange-200" : "text-cyan-100/65"
        }`}
      >
        {isUnlocked ? "Erb je odemčen." : "Erb je zamčen."}
      </p>

      {testSuccess ? (
        <p className="mt-2 rounded-md border border-emerald-300/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
          {testSuccess}
        </p>
      ) : null}
      {testError ? (
        <p className="mt-2 rounded-md border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
          {testError}
        </p>
      ) : null}
    </div>
  );
}
