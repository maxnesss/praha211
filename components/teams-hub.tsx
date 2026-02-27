"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { TeamDirectoryItem } from "@/lib/team-types";
import { TEAM_MAX_MEMBERS, normalizeTeamSearch } from "@/lib/team-utils";

type TeamsHubProps = {
  teams: TeamDirectoryItem[];
  currentTeamSlug: string | null;
  currentTeamName: string | null;
};

type CreateTeamResponse = {
  message?: string;
  team?: {
    slug: string;
    name: string;
  };
};

export function TeamsHub({
  teams,
  currentTeamSlug,
  currentTeamName,
}: TeamsHubProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredTeams = useMemo(() => {
    const normalizedQuery = normalizeTeamSearch(query);
    if (normalizedQuery.length === 0) {
      return teams;
    }

    return teams.filter((team) => {
      const searchable = normalizeTeamSearch(
        `${team.name} ${team.slug} ${team.previewMembers.join(" ")}`,
      );
      return searchable.includes(normalizedQuery);
    });
  }, [query, teams]);

  async function handleCreateTeam(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsCreating(true);

    const response = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameDraft }),
    });

    const payload = (await response.json().catch(() => null)) as
      | CreateTeamResponse
      | null;

    if (!response.ok) {
      setErrorMessage(payload?.message ?? "Tým se nepodařilo vytvořit.");
      setIsCreating(false);
      return;
    }

    setNameDraft("");
    setIsCreating(false);
    setIsCreateModalOpen(false);

    if (payload?.team?.slug) {
      router.push(`/team/${payload.team.slug}`);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <article className="rounded-2xl border border-cyan-300/30 bg-cyan-500/5 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">
              Váš tým
            </p>
            <p className="mt-2 text-xl font-semibold text-cyan-50">
              {currentTeamName ?? "Zatím bez týmu"}
            </p>
          </div>

          {currentTeamSlug ? (
            <Link
              href={`/team/${currentTeamSlug}`}
              className="rounded-md border border-orange-300/55 bg-orange-400/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-orange-50 transition-colors hover:bg-orange-400/25"
            >
              Přejít na můj tým
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setIsCreateModalOpen(true);
              }}
              className="rounded-md border border-orange-300/60 bg-orange-400/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-orange-50 transition-colors hover:bg-orange-400/30"
            >
              Vytvořit tým
            </button>
          )}
        </div>
      </article>

      <article className="rounded-2xl border border-cyan-300/30 bg-[#091925]/70 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200/75">
            Seznam týmů
          </h2>
          <p className="text-xs text-cyan-100/70">Maximálně {TEAM_MAX_MEMBERS} hráčů na tým</p>
        </div>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Vyhledat tým"
          className="mt-4 w-full rounded-xl border border-cyan-300/35 bg-[#081823] px-3 py-2 text-sm text-cyan-50 outline-none transition placeholder:text-cyan-200/45 focus:border-cyan-200/80"
        />

        {filteredTeams.length > 0 ? (
          <ul className="mt-4 divide-y divide-cyan-300/20 overflow-hidden rounded-xl border border-cyan-300/25 bg-cyan-500/5">
            {filteredTeams.map((team) => (
              <li key={team.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold text-cyan-50">{team.name}</p>
                      {currentTeamSlug === team.slug ? (
                        <span className="rounded bg-orange-400/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-100">
                          Váš tým
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-cyan-200/70">
                      /team/{team.slug}
                    </p>
                    <p className="mt-2 text-xs text-cyan-100/70">
                      {team.previewMembers.length > 0
                        ? `Členové: ${team.previewMembers.join(", ")}`
                        : "Zatím bez členů"}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-2 text-sm text-cyan-100/90 sm:items-end">
                    <p>Body: {team.points}</p>
                    <p>Odemčeno: {team.completed}</p>
                    <p>
                      Členové: {team.membersCount}/{TEAM_MAX_MEMBERS}
                    </p>
                    <p>{team.isFull ? "Plný tým" : "Volná místa"}</p>
                    <Link
                      href={`/team/${team.slug}`}
                      className="mt-1 inline-flex rounded-md border border-cyan-300/40 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100 transition-colors hover:bg-cyan-400/20"
                    >
                      Detail týmu
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-xl border border-cyan-300/25 bg-cyan-500/5 px-3 py-4 text-sm text-cyan-100/75">
            Žádný tým neodpovídá hledání.
          </p>
        )}
      </article>

      {!currentTeamSlug && isCreateModalOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#030b11]/80 p-4">
          <div className="mx-auto flex min-h-full w-full items-center justify-center py-4">
            <div className="w-full max-w-md rounded-xl border border-cyan-300/35 bg-[#0b1f2f] p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-cyan-50">Vytvořit tým</h2>
                  <p className="mt-1 text-sm text-cyan-100/70">
                    Zadejte název a vytvořte nový tým.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-md border border-cyan-300/35 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-100 hover:bg-cyan-400/10"
                >
                  Zavřít
                </button>
              </div>

              <form className="mt-5 space-y-4" onSubmit={handleCreateTeam} autoComplete="off">
                <div className="space-y-1.5">
                  <label htmlFor="team-name" className="text-sm font-medium text-cyan-100">
                    Název týmu
                  </label>
                  <input
                    id="team-name"
                    value={nameDraft}
                    onChange={(event) => setNameDraft(event.target.value)}
                    autoComplete="off"
                    placeholder="Např. Knights"
                    maxLength={40}
                    required
                    className="w-full rounded-xl border border-cyan-300/35 bg-[#081823] px-3 py-2 text-sm text-cyan-50 outline-none transition placeholder:text-cyan-200/45 focus:border-cyan-200/80"
                  />
                </div>

                {errorMessage ? (
                  <p className="rounded-md border border-rose-400/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                    {errorMessage}
                  </p>
                ) : null}

                <div className="flex items-center justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="rounded-md border border-cyan-300/35 px-4 py-2 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-400/10"
                  >
                    Zrušit
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="rounded-md border border-orange-300/60 bg-orange-400/20 px-4 py-2 text-sm font-semibold text-orange-50 transition-colors hover:bg-orange-400/30 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isCreating ? "Vytvářím..." : "Vytvořit tým"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
