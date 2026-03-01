type PodiumMedal = {
  rankClassName: string;
  medal: string;
  medalLabel: string;
};

const PODIUM_MEDALS: Record<number, PodiumMedal> = {
  1: {
    rankClassName: "text-amber-100",
    medal: "🥇",
    medalLabel: "Zlato",
  },
  2: {
    rankClassName: "text-slate-100",
    medal: "🥈",
    medalLabel: "Stříbro",
  },
  3: {
    rankClassName: "text-orange-100",
    medal: "🥉",
    medalLabel: "Bronz",
  },
};

export function getPodiumMedal(rank: number): PodiumMedal | null {
  return PODIUM_MEDALS[rank] ?? null;
}
