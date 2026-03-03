"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TeamMemberOverview } from "@/lib/team-types";

type TeamLeaderVotePanelProps = {
  teamSlug: string;
  members: TeamMemberOverview[];
};

type ApiPayload = {
  message?: string;
};

export function TeamLeaderVotePanel({ teamSlug, members }: TeamLeaderVotePanelProps) {
  const router = useRouter();
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleVote(candidateUserId: string) {
    setErrorMessage(null);
    setBusyMemberId(candidateUserId);

    const response = await fetch(`/api/teams/${teamSlug}/leader/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ candidateUserId }),
    });

    const payload = (await response.json().catch(() => null)) as ApiPayload | null;

    if (!response.ok) {
      setErrorMessage(payload?.message ?? "Hlas se nepodařilo uložit.");
      setBusyMemberId(null);
      return;
    }

    setBusyMemberId(null);
    router.refresh();
  }

  return (
    <article className="mt-6 border-t border-cyan-300/20 pt-5">
      <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">Volba velitele</p>
      <p className="mt-2 text-sm text-cyan-100/80">
        Každý člen má 1 hlas. Svůj hlas můžete kdykoliv změnit.
      </p>

      <ul className="mt-3 space-y-2">
        {members.map((member) => (
          <li
            key={`vote:${member.id}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-cyan-300/20 bg-cyan-500/5 px-3 py-2"
          >
            <div className="text-sm text-cyan-50">
              <span className="font-medium">{member.displayName}</span>
              {member.isLeader ? (
                <span className="ml-2 rounded bg-cyan-400/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-100">
                  Velitel
                </span>
              ) : null}
              {member.isCurrentUser ? (
                <span className="ml-2 rounded bg-orange-400/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-100">
                  Vy
                </span>
              ) : null}
              {member.isCurrentUserVote ? (
                <span className="ml-2 rounded bg-emerald-400/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-100">
                  Váš hlas
                </span>
              ) : null}
              <p className="text-xs text-cyan-100/70">
                Hlasů: {member.leaderVotes}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleVote(member.id)}
              disabled={busyMemberId !== null || member.isCurrentUserVote}
              className="rounded-md border border-orange-300/60 bg-orange-400/20 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-orange-50 transition-colors hover:bg-orange-400/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {busyMemberId === member.id
                ? "..."
                : member.isCurrentUserVote
                  ? "Hlasováno"
                  : "Hlasovat"}
            </button>
          </li>
        ))}
      </ul>

      {errorMessage ? (
        <p className="mt-3 rounded-md border border-rose-400/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {errorMessage}
        </p>
      ) : null}
    </article>
  );
}
