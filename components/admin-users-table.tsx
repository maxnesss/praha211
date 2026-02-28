"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import metro from "@/app/metro-theme.module.css";

export type AdminUserRow = {
  id: string;
  email: string;
  name: string | null;
  nickname: string | null;
  role: "ADMIN" | "USER";
  isFrozen: boolean;
  createdAt: string;
  claimsCount: number;
};

type AdminUsersTableProps = {
  users: AdminUserRow[];
  currentUserId: string;
  page: number;
  totalPages: number;
  totalUsers: number;
};

const dateFormatter = new Intl.DateTimeFormat("cs-CZ", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function AdminUsersTable({
  users,
  currentUserId,
  page,
  totalPages,
  totalUsers,
}: AdminUsersTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      users.map((user) => ({
        ...user,
        createdLabel: dateFormatter.format(new Date(user.createdAt)),
        isSelf: user.id === currentUserId,
      })),
    [users, currentUserId],
  );

  async function elevateUser(userId: string) {
    setError(null);
    setActiveUserId(userId);
    const response = await fetch(`/api/admin/users/${userId}/role`, {
      method: "POST",
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { message?: string } | null;
      setError(data?.message ?? "Změnu role se nepodařilo dokončit.");
      setActiveUserId(null);
      return;
    }

    startTransition(() => {
      router.refresh();
    });
    setActiveUserId(null);
  }

  async function setFreeze(userId: string, frozen: boolean) {
    setError(null);
    setActiveUserId(userId);
    const response = await fetch(`/api/admin/users/${userId}/freeze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frozen }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { message?: string } | null;
      setError(data?.message ?? "Změnu stavu se nepodařilo dokončit.");
      setActiveUserId(null);
      return;
    }

    startTransition(() => {
      router.refresh();
    });
    setActiveUserId(null);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-cyan-300/25 bg-[#091925]/75">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-300/20 bg-[#06141d]/70 px-4 py-3 text-xs uppercase tracking-[0.12em] text-cyan-200/60">
        <span>Seznam účtů</span>
        {error ? (
          <span className="text-[10px] font-semibold text-orange-200 normal-case">
            {error}
          </span>
        ) : (
          <span className="text-[10px] text-cyan-200/70 normal-case">
            Celkem: {totalUsers} · Strana {page}/{totalPages} · Na stránce: {rows.length}
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="bg-[#06141d]/70 text-xs uppercase tracking-[0.12em] text-cyan-200/60">
            <tr>
              <th className="px-4 py-3 text-left">Uživatel</th>
              <th className="px-4 py-3 text-left">Kontakt</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Stav</th>
              <th className="px-4 py-3 text-left">Claimy</th>
              <th className="px-4 py-3 text-left">Registrace</th>
              <th className="px-4 py-3 text-left">Akce</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-cyan-300/20 text-cyan-50/90"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {user.nickname ?? user.name ?? "Neznámé jméno"}
                      </span>
                      {user.isSelf ? (
                        <span className="rounded bg-orange-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-100">
                          Vy
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-cyan-200/70">
                      ID: {user.id}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-cyan-50">{user.email}</p>
                    <p className="text-xs text-cyan-200/70">
                      {user.name ?? "Bez jména"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                        user.role === "ADMIN"
                          ? "bg-orange-400/20 text-orange-100"
                          : "bg-cyan-400/15 text-cyan-100"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                        user.isFrozen
                          ? "bg-red-500/20 text-red-200"
                          : "bg-emerald-400/15 text-emerald-100"
                      }`}
                    >
                      {user.isFrozen ? "Zmrazen" : "Aktivní"}
                    </span>
                  </td>
                  <td className={`${metro.monoDigit} px-4 py-3`}>{user.claimsCount}</td>
                  <td className="px-4 py-3 text-cyan-100/75">{user.createdLabel}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {user.role === "USER" ? (
                        <button
                          type="button"
                          onClick={() => elevateUser(user.id)}
                          disabled={isPending || activeUserId === user.id || user.isSelf}
                          className="rounded-md border border-orange-300/60 bg-orange-400/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-orange-50 transition-colors hover:bg-orange-400/30 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Povýšit na ADMIN
                        </button>
                      ) : (
                        <span className="rounded-md border border-cyan-300/20 bg-cyan-400/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100/55">
                          ADMIN
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => setFreeze(user.id, !user.isFrozen)}
                        disabled={isPending || activeUserId === user.id || user.isSelf}
                        className={`rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                          user.isFrozen
                            ? "border-emerald-300/50 bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/25"
                            : "border-red-300/50 bg-red-500/20 text-red-100 hover:bg-red-500/30"
                        }`}
                      >
                        {user.isFrozen ? "Zrušit zmrazení" : "Zmrazit"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-cyan-100/65" colSpan={7}>
                  Zatím nejsou vytvořené žádné účty.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="border-t border-cyan-300/20 bg-[#06141d]/70 px-4 py-3 text-xs text-cyan-100/65">
        Akce jsou povoleny pouze pro účty s rolí ADMIN.
      </div>
    </div>
  );
}
