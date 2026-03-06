import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { MessagesCenter } from "@/components/messages-center";
import { SiteHeader } from "@/components/site-header";
import metro from "@/app/metro-theme.module.css";
import { authOptions } from "@/lib/auth";
import {
  findDirectMessageRecipientOption,
  getTeamMessagingContextForUser,
  getUserInboxMessages,
  getUserUnreadMessageCount,
} from "@/lib/messaging";

type MessagesPageSearchParams = Promise<{
  to?: string | string[];
}>;

type MessagesPageProps = {
  searchParams: MessagesPageSearchParams;
};

function resolveQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }
  return value?.trim() ?? "";
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=%2Fzpravy");
  }

  const resolvedSearchParams = await searchParams;
  const requestedRecipient = resolveQueryValue(resolvedSearchParams.to);
  const initialRecipientPromise = requestedRecipient.length > 0
    ? findDirectMessageRecipientOption(session.user.id, requestedRecipient)
    : Promise.resolve(null);

  const [messages, unreadCount, teamContext, initialRecipient] = await Promise.all([
    getUserInboxMessages(session.user.id, { limit: 120 }),
    getUserUnreadMessageCount(session.user.id),
    getTeamMessagingContextForUser(session.user.id),
    initialRecipientPromise,
  ]);

  return (
    <main className={metro.routeShell}>
      <div className={`${metro.scanlineOverlay} pointer-events-none absolute inset-0 opacity-35`} />
      <div className={`${metro.backdropGradient} pointer-events-none absolute inset-0`} />

      <SiteHeader session={session} />

      <section className={metro.shellContent}>
        <div className={`${metro.pageReveal} rounded-3xl border border-cyan-300/35 bg-[#0c202e]/80 p-6 shadow-[0_20px_44px_rgba(0,0,0,0.44)] sm:p-8 ${metro.mobilePanel}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
            Komunikace
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-cyan-50 sm:text-4xl">
            Zprávy
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-cyan-100/75 sm:text-base">
            Pište soukromé zprávy, týmové oznámení a spravujte doručenou poštu.
          </p>

          <MessagesCenter
            messages={messages}
            unreadCount={unreadCount}
            canSendTeamMessage={Boolean(teamContext)}
            teamName={teamContext?.teamName ?? null}
            canBroadcastAllUsers={session.user.role === "ADMIN"}
            initialRecipient={initialRecipient}
          />
        </div>
      </section>
    </main>
  );
}
