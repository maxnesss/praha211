"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { normalizeTeamSearch } from "@/lib/team-utils";

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

const RECIPIENT_MIN_QUERY_LENGTH = 4;
const RECIPIENT_MAX_VISIBLE_RESULTS = 8;

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("cs-CZ");
}

function normalizeRecipientSearch(value: string) {
  return normalizeTeamSearch(value);
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
    return "";
  }, [initialRecipientUserId, recipients]);
  const defaultRecipientQuery = useMemo(() => {
    if (!defaultRecipientUserId) {
      return "";
    }

    return recipients.find((recipient) => recipient.userId === defaultRecipientUserId)?.displayName ?? "";
  }, [defaultRecipientUserId, recipients]);

  const [mode, setMode] = useState<MessageSendMode>(availableModes[0] ?? "DIRECT");
  const [recipientUserId, setRecipientUserId] = useState(defaultRecipientUserId);
  const [recipientQuery, setRecipientQuery] = useState(defaultRecipientQuery);
  const [isRecipientFocused, setIsRecipientFocused] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitBusy, setSubmitBusy] = useState(false);
  const [markAllBusy, setMarkAllBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [openedMessageId, setOpenedMessageId] = useState<string | null>(null);
  const [readMessageIds, setReadMessageIds] = useState<Set<string>>(() => new Set());
  const [deletedMessageIds, setDeletedMessageIds] = useState<Set<string>>(() => new Set());
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const resolvedMode = availableModes.includes(mode)
    ? mode
    : (availableModes[0] ?? "DIRECT");
  const resolvedRecipientUserId = recipients.some(
    (recipient) => recipient.userId === recipientUserId,
  )
    ? recipientUserId
    : "";
  const selectedRecipient = recipients.find(
    (recipient) => recipient.userId === resolvedRecipientUserId,
  ) ?? null;
  const normalizedRecipientQuery = normalizeRecipientSearch(recipientQuery);
  const shouldFilterRecipients = normalizedRecipientQuery.length >= RECIPIENT_MIN_QUERY_LENGTH;
  const filteredRecipients = shouldFilterRecipients
    ? recipients.filter((recipient) => {
      const haystack = normalizeRecipientSearch(
        `${recipient.displayName} ${recipient.teamName ?? ""}`,
      );
      return haystack.includes(normalizedRecipientQuery);
    }).slice(0, RECIPIENT_MAX_VISIBLE_RESULTS)
    : [];
  const shouldShowRecipientDropdown =
    resolvedMode === "DIRECT"
    && isRecipientFocused
    && shouldFilterRecipients;
  const visibleMessages = messages.filter((message) => !deletedMessageIds.has(message.id));
  const openedMessage = visibleMessages.find((message) => message.id === openedMessageId) ?? null;

  function isMessageRead(message: InboxMessage) {
    return message.readAtIso !== null || readMessageIds.has(message.id);
  }

  function handleRecipientSelect(recipient: DirectRecipientOption) {
    setRecipientUserId(recipient.userId);
    setRecipientQuery(recipient.displayName);
    setIsRecipientFocused(false);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

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
        recipientNickname: resolvedMode === "DIRECT" ? selectedRecipient?.displayName : undefined,
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

    const response = await fetch(`/api/messages/${messageId}/read`, {
      method: "POST",
    });

    const payload = (await response.json().catch(() => null)) as ApiPayload | null;
    if (!response.ok) {
      setActionError(payload?.message ?? "Nepodařilo se označit zprávu jako přečtenou.");
      return;
    }

    setReadMessageIds((previous) => new Set(previous).add(messageId));
    router.refresh();
  }

  async function handleOpenMessage(message: InboxMessage) {
    setOpenedMessageId(message.id);
    if (isMessageRead(message)) {
      return;
    }

    await handleMarkRead(message.id);
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
    setReadMessageIds(
      new Set(visibleMessages.map((message) => message.id)),
    );
    router.refresh();
  }

  async function handleDeleteMessage(messageId: string) {
    setActionError(null);
    setActionMessage(null);
    setDeleteBusy(true);

    const response = await fetch(`/api/messages/${messageId}`, {
      method: "DELETE",
    });

    const payload = (await response.json().catch(() => null)) as ApiPayload | null;
    if (!response.ok) {
      setActionError(payload?.message ?? "Zprávu se nepodařilo smazat.");
      setDeleteBusy(false);
      return;
    }

    setDeletedMessageIds((previous) => new Set(previous).add(messageId));
    setOpenedMessageId((current) => (current === messageId ? null : current));
    setDeleteBusy(false);
    setActionMessage(payload?.message ?? "Zpráva byla smazána.");
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
          {!canBroadcastAllUsers && canSendTeamMessage ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-200/75">
                Komu poslat
              </p>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5 rounded-xl border border-cyan-300/25 bg-[#071622] p-1">
                <button
                  type="button"
                  onClick={() => setMode("DIRECT")}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                    resolvedMode === "DIRECT"
                      ? "border border-orange-300/55 bg-orange-400/20 text-orange-50"
                      : "border border-transparent bg-cyan-500/6 text-cyan-100 hover:bg-cyan-500/14"
                  }`}
                >
                  Soukromě
                </button>
                <button
                  type="button"
                  onClick={() => setMode("TEAM")}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                    resolvedMode === "TEAM"
                      ? "border border-orange-300/55 bg-orange-400/20 text-orange-50"
                      : "border border-transparent bg-cyan-500/6 text-cyan-100 hover:bg-cyan-500/14"
                  }`}
                >
                  Tým
                </button>
              </div>
            </div>
          ) : availableModes.length > 1 ? (
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
          ) : null}

          {resolvedMode === "DIRECT" ? (
            <div>
              <label htmlFor="message-recipient-query" className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-200/75">
                Příjemce (přezdívka)
              </label>
              <div className="relative mt-1.5">
                <input
                  id="message-recipient-query"
                  value={recipientQuery}
                  onChange={(event) => {
                    const nextQuery = event.target.value;
                    setRecipientQuery(nextQuery);
                    if (
                      selectedRecipient
                      && normalizeRecipientSearch(nextQuery)
                        !== normalizeRecipientSearch(selectedRecipient.displayName)
                    ) {
                      setRecipientUserId("");
                    }
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter"
                      && shouldShowRecipientDropdown
                      && filteredRecipients.length === 1
                    ) {
                      const onlyRecipient = filteredRecipients[0];
                      if (!onlyRecipient) {
                        return;
                      }

                      event.preventDefault();
                      handleRecipientSelect(onlyRecipient);
                    }
                  }}
                  onFocus={() => setIsRecipientFocused(true)}
                  onBlur={() => {
                    setTimeout(() => setIsRecipientFocused(false), 120);
                  }}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  placeholder="Hledat hráče nebo tým"
                  className="w-full rounded-xl border border-cyan-300/35 bg-[#081823] px-3 py-2 text-sm text-cyan-50 outline-none transition placeholder:text-cyan-200/45 focus:border-cyan-200/80"
                />

                {shouldShowRecipientDropdown ? (
                  <div className="absolute left-0 right-0 z-20 mt-2 rounded-xl border border-cyan-300/35 bg-[#061720] shadow-[0_10px_28px_rgba(0,0,0,0.45)]">
                    {filteredRecipients.length > 0 ? (
                      <ul className="max-h-72 overflow-y-auto py-1">
                        {filteredRecipients.map((recipient) => (
                          <li key={recipient.userId} className="px-2 py-1">
                            <button
                              type="button"
                              onClick={() => handleRecipientSelect(recipient)}
                              className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition hover:bg-cyan-500/10"
                            >
                              <span className="min-w-0 flex-1 text-sm text-cyan-50">
                                <span className="font-medium">{recipient.displayName}</span>
                              </span>
                              <span className="shrink-0 rounded-md border border-cyan-300/35 bg-cyan-500/10 px-2 py-1 text-xs font-medium text-cyan-100">
                                {recipient.teamName ?? "Bez týmu"}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="px-3 py-2 text-sm text-cyan-100/75">
                        Tomuto hledání neodpovídá žádný hráč.
                      </p>
                    )}
                  </div>
                ) : null}
              </div>

              <p className="mt-1 text-[11px] text-cyan-100/65">
                Hledání se aktivuje od {RECIPIENT_MIN_QUERY_LENGTH} znaků.
              </p>

              {selectedRecipient ? (
                <p className="mt-1 text-xs text-cyan-100/80">
                  Vybráno:{" "}
                  <span className="font-semibold text-cyan-50">
                    {selectedRecipient.displayName}
                  </span>
                  {selectedRecipient.teamName ? ` · ${selectedRecipient.teamName}` : ""}
                </p>
              ) : null}
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
            disabled={submitBusy || (resolvedMode === "DIRECT" && !resolvedRecipientUserId)}
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
            Celkem: <span className="font-semibold text-cyan-50">{visibleMessages.length}</span>
          </p>
        </div>

        {visibleMessages.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {visibleMessages.map((message) => {
              const isUnread = !isMessageRead(message);
              return (
                <li
                  key={message.id}
                  className={`rounded-lg border ${
                    isUnread
                      ? "border-orange-300/40 bg-orange-400/10"
                      : "border-cyan-300/20 bg-cyan-500/6"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => void handleOpenMessage(message)}
                    className="w-full px-3 py-3 text-left transition-colors hover:bg-cyan-500/8"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-cyan-100/75">
                      <p>
                        Od: <span className="font-semibold text-cyan-50">{message.senderDisplayName}</span>
                      </p>
                      <p>{formatDateTime(message.createdAtIso)}</p>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-cyan-50">{message.title}</p>
                      <span className="rounded-md border border-cyan-300/35 bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-100">
                        {CATEGORY_LABELS[message.category]}
                      </span>
                    </div>
                  </button>
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

      {openedMessage ? (
        <div
          className="fixed inset-0 z-[95] flex items-end justify-center bg-[#02090f]/72 p-4 sm:items-center"
          onClick={() => setOpenedMessageId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Detail zprávy"
            className="w-full max-w-lg rounded-2xl border border-cyan-300/30 bg-[#081b27]/95 p-5 shadow-[0_24px_52px_rgba(0,0,0,0.55)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-cyan-200/70">
                  {CATEGORY_LABELS[openedMessage.category]}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-cyan-50">
                  {openedMessage.title}
                </h3>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-cyan-100/75">
              <p>
                Od:{" "}
                {openedMessage.senderUserId ? (
                  <Link
                    href={`/player/${openedMessage.senderUserId}`}
                    className="font-semibold text-cyan-50 underline decoration-cyan-300/35 underline-offset-2 hover:text-white"
                  >
                    {openedMessage.senderDisplayName}
                  </Link>
                ) : (
                  <span className="font-semibold text-cyan-50">{openedMessage.senderDisplayName}</span>
                )}
              </p>
              <p>{formatDateTime(openedMessage.createdAtIso)}</p>
            </div>

            <p className="mt-4 whitespace-pre-wrap rounded-xl border border-cyan-300/25 bg-cyan-500/8 px-3 py-3 text-sm leading-6 text-cyan-100/90">
              {openedMessage.body}
            </p>

            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => void handleDeleteMessage(openedMessage.id)}
                disabled={deleteBusy}
                className="rounded-md border border-rose-300/55 bg-rose-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-rose-100 transition-colors hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleteBusy ? "Mažu..." : "Smazat zprávu"}
              </button>

              <button
                type="button"
                onClick={() => setOpenedMessageId(null)}
                className="rounded-md border border-cyan-300/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-50 transition-colors hover:bg-cyan-500/20"
              >
                Zavřít
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
