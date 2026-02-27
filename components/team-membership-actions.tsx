"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type TeamMembershipActionsProps = {
  teamSlug: string;
  isMember: boolean;
  isLeader: boolean;
  hasOtherTeam: boolean;
  currentTeamSlug: string | null;
  isFull: boolean;
  hasPendingRequest: boolean;
};

type ApiPayload = {
  message?: string;
};

export function TeamMembershipActions({
  teamSlug,
  isMember,
  isLeader,
  hasOtherTeam,
  currentTeamSlug,
  isFull,
  hasPendingRequest,
}: TeamMembershipActionsProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleApply() {
    setErrorMessage(null);
    setIsSubmitting(true);

    const response = await fetch(`/api/teams/${teamSlug}/apply`, {
      method: "POST",
    });

    const payload = (await response.json().catch(() => null)) as ApiPayload | null;

    if (!response.ok) {
      setErrorMessage(payload?.message ?? "Žádost se nepodařilo odeslat.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    router.refresh();
  }

  async function handleLeave() {
    setErrorMessage(null);
    setIsSubmitting(true);

    const response = await fetch(`/api/teams/${teamSlug}/leave`, {
      method: "POST",
    });

    const payload = (await response.json().catch(() => null)) as ApiPayload | null;

    if (!response.ok) {
      setErrorMessage(payload?.message ?? "Tým se nepodařilo opustit.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    router.push("/teams");
    router.refresh();
  }

  return (
    <article className="mt-6 rounded-2xl border border-cyan-300/30 bg-cyan-500/5 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">Členství</p>

      {isMember ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-cyan-100/80">
            {isLeader ? "Jste velitel tohoto týmu." : "Jste členem tohoto týmu."}
          </p>

          {!isLeader ? (
            <button
              type="button"
              onClick={handleLeave}
              disabled={isSubmitting}
              className="rounded-md border border-rose-300/55 bg-rose-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-rose-100 transition-colors hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Zpracovávám..." : "Opustit tým"}
            </button>
          ) : null}
        </div>
      ) : null}

      {!isMember && hasOtherTeam ? (
        <div className="mt-3 space-y-2 text-sm text-cyan-100/80">
          <p>Už jste v jiném týmu. Nejprve ho opusťte.</p>
          {currentTeamSlug ? (
            <Link
              href={`/team/${currentTeamSlug}`}
              className="inline-flex rounded-md border border-cyan-300/40 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100 transition-colors hover:bg-cyan-400/20"
            >
              Přejít na můj tým
            </Link>
          ) : null}
        </div>
      ) : null}

      {!isMember && !hasOtherTeam && hasPendingRequest ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-cyan-100/80">Žádost už čeká na schválení velitelem.</p>
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-md border border-cyan-300/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100/50"
          >
            Žádost odeslána
          </button>
        </div>
      ) : null}

      {!isMember && !hasOtherTeam && !hasPendingRequest ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-cyan-100/80">
            {isFull
              ? "Tým je plný, ale můžete poslat žádost pro případ uvolnění místa."
              : "Pošlete žádost o vstup a velitel ji může schválit."}
          </p>
          <button
            type="button"
            onClick={handleApply}
            disabled={isSubmitting}
            className="rounded-md border border-orange-300/60 bg-orange-400/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-orange-50 transition-colors hover:bg-orange-400/30 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Odesílám..." : "Požádat o vstup"}
          </button>
        </div>
      ) : null}

      {errorMessage ? (
        <p className="mt-3 rounded-md border border-rose-400/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {errorMessage}
        </p>
      ) : null}
    </article>
  );
}
