"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TeamJoinRequestOverview, TeamMemberOverview } from "@/lib/team-types";

type TeamLeaderPanelProps = {
  teamSlug: string;
  pendingRequests: TeamJoinRequestOverview[];
  removableMembers: TeamMemberOverview[];
};

type ApiPayload = {
  message?: string;
};

function formatCzDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("cs-CZ");
}

export function TeamLeaderPanel({
  teamSlug,
  pendingRequests,
  removableMembers,
}: TeamLeaderPanelProps) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function runAction(key: string, endpoint: string) {
    setErrorMessage(null);
    setBusyKey(key);

    const response = await fetch(endpoint, { method: "POST" });
    const payload = (await response.json().catch(() => null)) as ApiPayload | null;

    if (!response.ok) {
      setErrorMessage(payload?.message ?? "Akce se nepodařila.");
      setBusyKey(null);
      return;
    }

    setBusyKey(null);
    router.refresh();
  }

  return (
    <article className="mt-6 rounded-2xl border border-cyan-300/30 bg-cyan-500/5 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">Velitelský panel</p>

      <div className="mt-4 space-y-4">
        <div className="rounded-xl border border-cyan-300/25 bg-[#091925]/75 p-3">
          <p className="text-sm font-semibold text-cyan-100">Žádosti o vstup</p>
          {pendingRequests.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {pendingRequests.map((request) => (
                <li
                  key={request.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-cyan-300/20 bg-cyan-500/5 px-3 py-2"
                >
                  <div>
                    <p className="text-sm text-cyan-50">
                      <Link
                        href={`/player/${request.userId}`}
                        className="underline decoration-cyan-300/35 underline-offset-2 transition-colors hover:text-white"
                      >
                        {request.displayName}
                      </Link>
                    </p>
                    <p className="text-xs text-cyan-100/70">
                      Požádal: {formatCzDateTime(request.createdAtIso)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        runAction(
                          `approve:${request.id}`,
                          `/api/teams/${teamSlug}/requests/${request.id}/approve`,
                        )}
                      disabled={busyKey !== null}
                      className="rounded-md border border-emerald-300/50 bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-100 transition-colors hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {busyKey === `approve:${request.id}` ? "..." : "Schválit"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        runAction(
                          `reject:${request.id}`,
                          `/api/teams/${teamSlug}/requests/${request.id}/reject`,
                        )}
                      disabled={busyKey !== null}
                      className="rounded-md border border-rose-300/55 bg-rose-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-rose-100 transition-colors hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {busyKey === `reject:${request.id}` ? "..." : "Zamítnout"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-cyan-100/70">Žádné čekající žádosti.</p>
          )}
        </div>

        <div className="rounded-xl border border-cyan-300/25 bg-[#091925]/75 p-3">
          <p className="text-sm font-semibold text-cyan-100">Odebrat hráče</p>
          {removableMembers.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {removableMembers.map((member) => (
                <li
                  key={member.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-cyan-300/20 bg-cyan-500/5 px-3 py-2"
                >
                  <div>
                    <p className="text-sm text-cyan-50">
                      <Link
                        href={`/player/${member.id}`}
                        className="underline decoration-cyan-300/35 underline-offset-2 transition-colors hover:text-white"
                      >
                        {member.displayName}
                      </Link>
                    </p>
                    <p className="text-xs text-cyan-100/70">
                      Body: {member.points} · Odemčeno: {member.completed}/112
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      runAction(
                        `remove:${member.id}`,
                        `/api/teams/${teamSlug}/members/${member.id}/remove`,
                      )}
                    disabled={busyKey !== null}
                    className="rounded-md border border-rose-300/55 bg-rose-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-rose-100 transition-colors hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {busyKey === `remove:${member.id}` ? "..." : "Odebrat"}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-cyan-100/70">Nemáte koho odebrat.</p>
          )}
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-3 rounded-md border border-rose-400/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {errorMessage}
        </p>
      ) : null}
    </article>
  );
}
