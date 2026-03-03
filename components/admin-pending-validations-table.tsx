"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import metro from "@/app/metro-theme.module.css";

export type AdminPendingValidationRow = {
  id: string;
  userLabel: string;
  userEmail: string;
  districtCode: string;
  districtName: string;
  submittedAt: string;
  selfieUrl: string;
  localFaceDetected: boolean;
  localFaceCount: number;
  localDistrictMatched: boolean;
  localConfidence: number;
  localReasons: string[];
};

type AdminPendingValidationsTableProps = {
  submissions: AdminPendingValidationRow[];
};

const dateFormatter = new Intl.DateTimeFormat("cs-CZ", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function AdminPendingValidationsTable({ submissions }: AdminPendingValidationsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      submissions.map((submission) => ({
        ...submission,
        submittedLabel: dateFormatter.format(new Date(submission.submittedAt)),
      })),
    [submissions],
  );

  async function updateSubmission(submissionId: string, action: "approve" | "reject") {
    setFeedback(null);
    setActiveSubmissionId(submissionId);

    const response = await fetch(`/api/admin/claim-submissions/${submissionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    if (!response.ok) {
      setFeedback(payload?.message ?? "Operaci se nepodařilo dokončit.");
      setActiveSubmissionId(null);
      return;
    }

    setFeedback(payload?.message ?? "Operace dokončena.");
    startTransition(() => {
      router.refresh();
    });
    setActiveSubmissionId(null);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-cyan-300/25 bg-[#091925]/75">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-300/20 bg-[#06141d]/70 px-4 py-3 text-xs uppercase tracking-[0.12em] text-cyan-200/60">
        <span>Čekající validace</span>
        <span className="text-[10px] text-cyan-200/70 normal-case">
          Celkem čekajících: {rows.length}
        </span>
      </div>

      {feedback ? (
        <p className="border-b border-cyan-300/20 bg-[#06141d]/55 px-4 py-2 text-xs text-cyan-100/85">
          {feedback}
        </p>
      ) : null}

      <div className="divide-y divide-cyan-300/20 md:hidden">
        {rows.length > 0 ? (
          rows.map((row) => (
            <article key={row.id} className="space-y-3 px-4 py-4 text-sm text-cyan-50/90">
              <div className="space-y-1">
                <p className="font-semibold text-cyan-50">{row.userLabel}</p>
                <p className="text-xs text-cyan-200/75">{row.userEmail}</p>
                <p className="break-all text-[10px] text-cyan-200/55">Žádost: {row.id}</p>
              </div>

              <div>
                <p className="font-semibold text-cyan-50">{row.districtName}</p>
                <p className={`${metro.monoDigit} text-xs text-cyan-200/75`}>{row.districtCode}</p>
              </div>

              <div className="text-xs leading-5 text-cyan-100/80">
                <p>
                  Obličej: {row.localFaceDetected ? "ano" : "ne"} ({row.localFaceCount})
                </p>
                <p>Název části: {row.localDistrictMatched ? "ano" : "ne"}</p>
                <p>Důvěra: {Math.round(row.localConfidence * 100)} %</p>
              </div>

              <p className="text-xs text-cyan-100/80">
                {row.localReasons.length > 0 ? row.localReasons.join(" · ") : "Bez důvodů"}
              </p>

              <div className="flex items-center justify-between gap-3">
                <a
                  href={`/api/uploads/selfie/view?key=${encodeURIComponent(row.selfieUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100 underline underline-offset-4 hover:text-cyan-50"
                >
                  Otevřít selfie
                </a>
                <span className="text-xs text-cyan-100/80">{row.submittedLabel}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void updateSubmission(row.id, "approve");
                  }}
                  disabled={isPending || activeSubmissionId === row.id}
                  className="rounded-md border border-emerald-300/50 bg-emerald-500/15 px-3 py-2 text-center text-xs font-semibold leading-tight text-emerald-100 transition-colors hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Schválit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm("Opravdu chcete žádost neschválit?")) {
                      return;
                    }
                    void updateSubmission(row.id, "reject");
                  }}
                  disabled={isPending || activeSubmissionId === row.id}
                  className="rounded-md border border-red-300/50 bg-red-500/20 px-3 py-2 text-center text-xs font-semibold leading-tight text-red-100 transition-colors hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Neschválit
                </button>
              </div>
            </article>
          ))
        ) : (
          <p className="px-4 py-6 text-cyan-100/70">Žádné čekající validace.</p>
        )}
      </div>

      <div className="hidden md:block">
        <table className="w-full table-fixed text-xs">
          <thead className="bg-[#06141d]/70 text-xs uppercase tracking-[0.12em] text-cyan-200/60">
            <tr>
              <th className="w-[18%] px-3 py-2 text-left">Uživatel</th>
              <th className="w-[15%] px-3 py-2 text-left">Městská část</th>
              <th className="w-[14%] px-3 py-2 text-left">Lokální kontrola</th>
              <th className="w-[22%] px-3 py-2 text-left">Důvody fallbacku</th>
              <th className="w-[9%] px-3 py-2 text-left">Selfie</th>
              <th className="w-[8%] px-3 py-2 text-left">Čas</th>
              <th className="w-[14%] px-3 py-2 text-left">Akce</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-cyan-300/20 text-cyan-50/90">
                  <td className="break-words px-3 py-2 align-top">
                    <p className="font-semibold text-cyan-50">{row.userLabel}</p>
                    <p className="text-xs text-cyan-200/75">{row.userEmail}</p>
                    <p className="break-all text-[10px] text-cyan-200/55">Žádost: {row.id}</p>
                  </td>
                  <td className="break-words px-3 py-2 align-top">
                    <p className="font-semibold text-cyan-50">{row.districtName}</p>
                    <p className={`${metro.monoDigit} text-xs text-cyan-200/75`}>{row.districtCode}</p>
                  </td>
                  <td className="px-3 py-2 align-top text-xs leading-5 text-cyan-100/80">
                    <p>
                      Obličej: {row.localFaceDetected ? "ano" : "ne"} ({row.localFaceCount})
                    </p>
                    <p>Název části: {row.localDistrictMatched ? "ano" : "ne"}</p>
                    <p>Důvěra: {Math.round(row.localConfidence * 100)} %</p>
                  </td>
                  <td className="break-words px-3 py-2 align-top text-xs text-cyan-100/80">
                    {row.localReasons.length > 0 ? row.localReasons.join(" · ") : "Bez důvodů"}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <a
                      href={`/api/uploads/selfie/view?key=${encodeURIComponent(row.selfieUrl)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100 underline underline-offset-4 hover:text-cyan-50"
                    >
                      Otevřít selfie
                    </a>
                  </td>
                  <td className="px-3 py-2 align-top text-xs text-cyan-100/80">{row.submittedLabel}</td>
                  <td className="px-3 py-2 align-top">
                    <div className="flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          void updateSubmission(row.id, "approve");
                        }}
                        disabled={isPending || activeSubmissionId === row.id}
                        className="w-full rounded-md border border-emerald-300/50 bg-emerald-500/15 px-2 py-1.5 text-center text-[11px] font-semibold leading-tight text-emerald-100 transition-colors hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Schválit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!window.confirm("Opravdu chcete žádost neschválit?")) {
                            return;
                          }
                          void updateSubmission(row.id, "reject");
                        }}
                        disabled={isPending || activeSubmissionId === row.id}
                        className="w-full rounded-md border border-red-300/50 bg-red-500/20 px-2 py-1.5 text-center text-[11px] font-semibold leading-tight text-red-100 transition-colors hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Neschválit
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-3 py-6 text-cyan-100/70" colSpan={7}>
                  Žádné čekající validace.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
