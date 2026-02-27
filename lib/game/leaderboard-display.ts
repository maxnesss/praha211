type LeaderboardIdentity = {
  nickname: string | null;
  name: string | null;
  email: string | null;
};

function toNameInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }

  const single = parts[0] ?? "";
  if (single.length >= 2) {
    return single.slice(0, 2).toUpperCase();
  }

  return single.toUpperCase();
}

function toEmailInitials(email: string) {
  const local = email.split("@")[0]?.trim() ?? "";
  if (local.length >= 2) {
    return local.slice(0, 2).toUpperCase();
  }
  return local.toUpperCase();
}

export function toLeaderboardPlayerLabel(input: LeaderboardIdentity) {
  const nickname = input.nickname?.trim();
  if (nickname) {
    return nickname;
  }

  const name = input.name?.trim();
  if (name) {
    const initials = toNameInitials(name);
    if (initials) {
      return initials;
    }
  }

  const email = input.email?.trim();
  if (email) {
    const initials = toEmailInitials(email);
    if (initials) {
      return initials;
    }
  }

  return "??";
}
