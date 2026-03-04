"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type MessageCategory =
  | "DIRECT"
  | "TEAM_BROADCAST"
  | "GLOBAL_BROADCAST"
  | "BADGE_UNLOCK"
  | "SYSTEM";

type MessageSendMode = "DIRECT" | "TEAM" | "ALL_USERS";

type InboxMessage = {
  id: string;
  category: MessageCategory;
  title: string;
  body: string;
  createdAtIso: string;
  readAtIso: string | null;
  senderUserId: string | null;
  senderDisplayName: string;
};

type DirectRecipientOption = {
  userId: string;
  displayName: string;
  teamName: string | null;
};

type MessagesCenterProps = {
  messages: InboxMessage[];
  recipients: DirectRecipientOption[];
  unreadCount: number;
  canSendTeamMessage: boolean;
  teamName: string | null;
  canBroadcastAllUsers: boolean;
  initialRecipientUserId?: string | null;
};

type ApiPayload = {
  message?: string;
};

const CATEGORY_LABELS: Record<MessageCategory, string> = {
  DIRECT: "Soukromá zpráva",
  TEAM_BROADCAST: "Týmová zpráva",
  GLOBAL_BROADCAST: "Admin oznámení",
  BADGE_UNLOCK: "Nový odznak",
  SYSTEM: "Systém",
};

const MODE_LABELS: Record<MessageSendMode, string> = {
  DIRECT: "Soukromě uživateli",
  TEAM: "Všem hráčům v týmu",
  ALL_USERS: "Všem uživatelům",
};

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("cs-CZ");
}

export function MessagesCenter({
  messages,
  recipients,
  unreadCount,
  canSendTeamMessage,
  teamName,
  canBroadcastAllUsers,
  initialRecipientUserId,
}: MessagesCenterProps) {
  const router = useRouter();
  const availableModes = useMemo(() => {
    const modes: MessageSendMode[] = ["DIRECT"];
    if (canSendTeamMessage) {
      modes.push("TEAM");
    }
    if (canBroadcastAllUsers) {
      modes.push("ALL_USERS");
    }
    return modes;
  }, [canBroadcastAllUsers, canSendTeamMessage]);

  const defaultRecipientUserId = useMemo(() => {
    if (
      initialRecipientUserId
      && recipients.some((recipient) => recipient.userId === initialRecipientUserId)
    ) {
      return initialRecipientUserId;
    }
    return recipients[0]?.userId ?? "";
  }, [initialRecipientUserId, recipients]);

  const [mode, setMode] = useState<MessageSendMode>(availableModes[0] ?? "DIRECT");
  const [recipientUserId, setRecipientUserId] = useState(defaultRecipientUserId);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitBusy, setSubmitBusy] = useState(false);
  const [markAllBusy, setMarkAllBusy] = useState(false);
  const [markOneBusyId, setMarkOneBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const resolvedMode = availableModes.includes(mode)
    ? mode
    : (availableModes[0] ?? "DIRECT");
  const resolvedRecipientUserId = recipients.some(
    (recipient) => recipient.userId === recipientUserId,
  )
    ? recipientUserId
    : defaultRecipientUserId;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError(null);
    setActionMessage(null);

    if (resolvedMode === "DIRECT" && !resolvedRecipientUserId) {
      setActionError("Vyberte příjemce zprávy.");
      return;
    }

    setSubmitBusy(true);

    const response = await fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: resolvedMode,
        recipientUserId: resolvedMode === "DIRECT" ? resolvedRecipientUserId : undefined,
        title,
        body,
      }),
    });

    const payload = (await response.json().catch(() => null)) as ApiPayload | null;

    if (!response.ok) {
      setActionError(payload?.message ?? "Zprávu se nepodařilo odeslat.");
      setSubmitBusy(false);
      return;
    }

    setSubmitBusy(false);
    setTitle("");
    setBody("");
    setActionMessage(payload?.message ?? "Zpráva byla odeslána.");
    router.refresh();
  }

  async function handleMarkRead(messageId: string) {
    setActionError(null);
    setActionMessage(null);
    setMarkOneBusyId(messageId);

    const response = await fetch(`/api/messages/${messageId}/read`, {
      method: "POST",
    });

    const payload = (await response.json().catch(() => null)) as ApiPayload | null;
    if (!response.ok) {
      setActionError(payload?.message ?? "Nepodařilo se označit zprávu jako přečtenou.");
      setMarkOneBusyId(null);
      return;
    }

    setMarkOneBusyId(null);
    setActionMessage(payload?.message ?? "Zpráva označena jako přečtená.");
    router.refresh();
  }

  async function handleMarkAllRead() {
    setActionError(null);
    setActionMessage(null);
    setMarkAllBusy(true);

    const response = await fetch("/api/messages/read-all", {
      method: "POST",
    });

    const payload = (await response.json().catch(() => null)) as ApiPayload | null;
    if (!response.ok) {
      setActionError(payload?.message ?? "Nepodařilo se označit zprávy jako přečtené.");
      setMarkAllBusy(false);
      return;
    }

    setMarkAllBusy(false);
    setActionMessage(payload?.message ?? "Všechny zprávy byly označeny jako přečtené.");
    router.refresh();
  }

  return (
    <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(18rem,24rem)_1fr]">
      <section className="rounded-2xl border border-cyan-300/30 bg-[#091925]/75 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/75">
              Nová zpráva
            </p>
            <p className="mt-2 text-sm text-cyan-100/80">
              Nepřečtené: <span className="font-semibold text-orange-100">{unreadCount}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={markAllBusy || unreadCount === 0}
            className="rounded-md border border-cyan-300/35 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-50 transition-colors hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {markAllBusy ? "..." : "Přečíst vše"}
          </button>
        </div>

        <form
          className="mt-4 space-y-3"
          onSubmit={handleSubmit}
          autoComplete="off"
        >
          <div>
            <label htmlFor="message-mode" className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-200/75">
              Režim odeslání
            </label>
            <select
              id="message-mode"
              value={resolvedMode}
              onChange={(event) => setMode(event.target.value as MessageSendMode)}
              className="mt-1.5 w-full rounded-md border border-cyan-300/30 bg-[#071622] px-3 py-2 text-sm text-cyan-50 outline-none transition-colors focus:border-cyan-200/60"
            >
              {availableModes.map((availableMode) => (
                <option key={availableMode} value={availableMode}>
                  {MODE_LABELS[availableMode]}
                </option>
              ))}
            </select>
          </div>

          {resolvedMode === "DIRECT" ? (
            <div>
              <label htmlFor="message-recipient" className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-200/75">
                Příjemce
              </label>
              <select
                id="message-recipient"
                value={resolvedRecipientUserId}
                onChange={(event) => setRecipientUserId(event.target.value)}
                className="mt-1.5 w-full rounded-md border border-cyan-300/30 bg-[#071622] px-3 py-2 text-sm text-cyan-50 outline-none transition-colors focus:border-cyan-200/60"
              >
                {recipients.length > 0 ? (
                  recipients.map((recipient) => (
                    <option key={recipient.userId} value={recipient.userId}>
                      {recipient.displayName}
                      {recipient.teamName ? ` · ${recipient.teamName}` : ""}
                    </option>
                  ))
                ) : (
                  <option value="">Žádný dostupný příjemce</option>
                )}
              </select>
            </div>
          ) : null}

          {resolvedMode === "TEAM" ? (
            <p className="rounded-md border border-cyan-300/25 bg-cyan-500/8 px-3 py-2 text-xs text-cyan-100/85">
              Zpráva se odešle všem ostatním členům týmu
              {teamName ? ` ${teamName}` : ""}.
            </p>
          ) : null}

          {resolvedMode === "ALL_USERS" ? (
            <p className="rounded-md border border-orange-300/30 bg-orange-400/10 px-3 py-2 text-xs text-orange-100">
              Admin rozeslání: zprávu obdrží všichni ostatní aktivní uživatelé.
            </p>
          ) : null}

          <div>
            <label htmlFor="message-title" className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-200/75">
              Předmět
            </label>
            <input
              id="message-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              required
              autoComplete="off"
              className="mt-1.5 w-full rounded-md border border-cyan-300/30 bg-[#071622] px-3 py-2 text-sm text-cyan-50 outline-none transition-colors placeholder:text-cyan-200/45 focus:border-cyan-200/60"
              placeholder="Např. Dnešní plán v terénu"
            />
          </div>

          <div>
            <label htmlFor="message-body" className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-200/75">
              Text
            </label>
            <textarea
              id="message-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={2000}
              required
              autoComplete="off"
              rows={6}
              className="mt-1.5 w-full resize-y rounded-md border border-cyan-300/30 bg-[#071622] px-3 py-2 text-sm text-cyan-50 outline-none transition-colors placeholder:text-cyan-200/45 focus:border-cyan-200/60"
              placeholder="Napište zprávu..."
            />
          </div>

          <button
            type="submit"
            disabled={submitBusy || (resolvedMode === "DIRECT" && recipients.length === 0)}
            className="w-full rounded-md border border-orange-300/55 bg-orange-400/18 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-orange-50 transition-colors hover:bg-orange-400/28 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitBusy ? "Odesílám..." : "Odeslat zprávu"}
          </button>
        </form>

        {actionError ? (
          <p className="mt-3 rounded-md border border-rose-400/45 bg-rose-500/12 px-3 py-2 text-sm text-rose-200">
            {actionError}
          </p>
        ) : null}
        {actionMessage ? (
          <p className="mt-3 rounded-md border border-emerald-300/40 bg-emerald-500/12 px-3 py-2 text-sm text-emerald-100">
            {actionMessage}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-cyan-300/30 bg-[#091925]/75 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100/75">
            Doručené zprávy
          </h2>
          <p className="text-xs text-cyan-100/70">
            Celkem: <span className="font-semibold text-cyan-50">{messages.length}</span>
          </p>
        </div>

        {messages.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {messages.map((message) => {
              const isUnread = message.readAtIso === null;
              return (
                <li
                  key={message.id}
                  className={`rounded-lg border px-3 py-3 ${
                    isUnread
                      ? "border-orange-300/40 bg-orange-400/10"
                      : "border-cyan-300/20 bg-cyan-500/6"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-cyan-200/70">
                        {CATEGORY_LABELS[message.category]}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-cyan-50">
                        {message.title}
                      </p>
                    </div>
                    {isUnread ? (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(message.id)}
                        disabled={markOneBusyId !== null}
                        className="rounded-md border border-cyan-300/35 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-50 transition-colors hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {markOneBusyId === message.id ? "..." : "Přečteno"}
                      </button>
                    ) : (
                      <span className="rounded bg-cyan-500/12 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-100/75">
                        Přečteno
                      </span>
                    )}
                  </div>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-cyan-100/90">
                    {message.body}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-cyan-100/70">
                    <p>
                      Od:{" "}
                      {message.senderUserId ? (
                        <Link
                          href={`/player/${message.senderUserId}`}
                          className="font-medium text-cyan-50 underline decoration-cyan-300/35 underline-offset-2 hover:text-white"
                        >
                          {message.senderDisplayName}
                        </Link>
                      ) : (
                        <span className="font-medium text-cyan-50">{message.senderDisplayName}</span>
                      )}
                    </p>
                    <p>{formatDateTime(message.createdAtIso)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-cyan-100/75">
            Zatím nemáte žádné zprávy.
          </p>
        )}
      </section>
    </div>
  );
}
