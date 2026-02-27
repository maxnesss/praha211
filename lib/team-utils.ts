export const TEAM_MAX_MEMBERS = 5;

export function toTeamSlug(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function normalizeTeamSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function getPublicPlayerName(input: {
  nickname?: string | null;
  name?: string | null;
  email?: string | null;
}) {
  const nickname = input.nickname?.trim();
  if (nickname) {
    return nickname;
  }

  const name = input.name?.trim();
  if (name) {
    return name;
  }

  const localPart = input.email?.split("@")[0]?.trim();
  if (localPart) {
    if (localPart.length <= 2) {
      return `${localPart[0] ?? "H"}*`;
    }
    return `${localPart.slice(0, 2)}***`;
  }

  return "Hráč";
}
