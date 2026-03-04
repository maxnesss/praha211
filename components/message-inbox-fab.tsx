import Link from "next/link";

type MessageInboxFabProps = {
  unreadCount: number;
};

function formatUnreadBadge(unreadCount: number) {
  if (unreadCount > 99) {
    return "99+";
  }
  return String(unreadCount);
}

export function MessageInboxFab({ unreadCount }: MessageInboxFabProps) {
  const hasUnread = unreadCount > 0;
  const ariaLabel = hasUnread
    ? `Otevřít zprávy (${unreadCount} nepřečtených)`
    : "Otevřít zprávy";

  return (
    <Link
      href="/zpravy"
      prefetch={true}
      aria-label={ariaLabel}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/35 bg-[#091a26]/88 text-cyan-100/75 shadow-[0_8px_16px_rgba(0,0,0,0.28)] transition-colors hover:bg-[#0d2230]"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z" />
        <path d="m4 7 8 6 8-6" />
      </svg>

      {hasUnread ? (
        <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full border border-orange-200/60 bg-orange-500 px-1 text-[10px] font-bold leading-none text-white shadow-[0_0_14px_rgba(249,115,22,0.6)]">
          {formatUnreadBadge(unreadCount)}
        </span>
      ) : null}
    </Link>
  );
}
