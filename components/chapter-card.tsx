import Link from "next/link";

type ChapterPreviewCell = {
  code: string;
  completed: boolean;
};

type ChapterCardProps = {
  slug: string;
  name: string;
  accentColor: string;
  completed: number;
  total: number;
  progressPercent: number;
  preview: ChapterPreviewCell[];
};

export function ChapterCard({
  slug,
  name,
  accentColor,
  completed,
  total,
  progressPercent,
  preview,
}: ChapterCardProps) {
  return (
    <Link
      href={`/chapter/${slug}`}
      className="group rounded-xl border border-cyan-300/30 bg-[#091925]/75 p-5 transition-colors hover:border-cyan-200/70 hover:bg-[#0b1f2f]/85"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-wide text-cyan-50">{name}</h2>
          <p className="mt-1 text-sm text-cyan-100/70">
            {completed} / {total}
          </p>
        </div>
        <span
          className="rounded-md border px-2 py-1 text-xs font-medium uppercase tracking-wider"
          style={{ borderColor: accentColor, color: accentColor }}
        >
          Kapitola
        </span>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-1.5">
        {preview.map((cell) => (
          <div
            key={cell.code}
            className={`h-6 rounded-sm border ${
              cell.completed
                ? "border-cyan-300/55 bg-cyan-400/30"
                : "border-cyan-300/20 bg-[#08161f]"
            }`}
          />
        ))}
      </div>

      <div className="mt-4">
        <div className="h-2 overflow-hidden rounded-full bg-cyan-950/80">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progressPercent}%`, backgroundColor: accentColor }}
          />
        </div>
        <p className="mt-2 text-xs uppercase tracking-[0.14em] text-cyan-100/65">
          {progressPercent}% dokončeno
        </p>
      </div>
    </Link>
  );
}
